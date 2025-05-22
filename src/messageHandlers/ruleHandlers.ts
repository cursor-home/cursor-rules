import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { info, error, warn } from '../logger/logger';
import { Rule, RuleSource, RuleMetadata } from '../types';
import { getAllRuleMetadata } from '../cursorRules/metaManager';
import { configPanelInstance } from '../webview/configPanel/showConfigPanel';

/**
 * 处理规则列表请求
 * 
 * @param message 从WebView接收的消息对象
 * @param includeBuiltIn 是否包含内置规则的布尔标志
 */
export async function handleGetRuleList(message: any, includeBuiltIn: boolean = true) {
	info('Received request for rule list');
	
	// 获取当前工作区
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	if (workspaceFolder) {
		// 在 .cursor/rules 目录中查找规则
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		let rules: Rule[] = [];
		
		try {
			// 检查规则目录是否存在
			if (fs.existsSync(rulesDir)) {
				info(`Rules directory found: ${rulesDir}`);
				
				// 读取所有 .md 和 .mdc 文件
				const files = fs.readdirSync(rulesDir)
					.filter(file => file.endsWith('.md') || file.endsWith('.mdc'));
				
				info(`Found ${files.length} rule files`);
				
				// 构建规则对象
				rules = files.map(file => {
					const filePath = path.join(rulesDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					
					// 从内容中提取名称和描述
					const nameMatch = content.match(/# (.*)/);
					const descMatch = content.match(/description: (.*)/);
					
					return {
						id: file,
						name: nameMatch ? nameMatch[1] : file,
						description: descMatch ? descMatch[1] : '',
						filePath: filePath,
						content: content,
						source: RuleSource.Custom
					};
				});
			} else {
				info(`Rules directory not found: ${rulesDir}`);
			}
			
			// 如果需要，获取内置规则
			if (includeBuiltIn) {
				try {
					const builtInRules = await getAllRuleMetadata();
					const builtInRuleObjects = builtInRules.map((rule: RuleMetadata) => ({
						...rule,
						content: '# ' + rule.name + '\n\n' + rule.description,
						source: RuleSource.BuiltIn
					}));
					
					// 合并规则
					rules = [...rules, ...builtInRuleObjects];
				} catch (err) {
					warn('Error loading built-in rules:', err);
				}
			}
			
			// 发送成功响应回WebView
			info(`Sending ${rules.length} rules back to WebView`);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleListResult',
					success: true,
					rules: rules
				});
			}
		} catch (err) {
			// 发送错误响应
			error(`Error loading rule list: ${err}`, err);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleListResult',
					success: false,
					error: `Failed to load rule list: ${err}`
				});
			}
		}
	} else {
		// 无工作区错误
		warn('No workspace folder found');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleListResult',
				success: false,
				error: 'Please open a workspace folder first'
			});
		}
	}
}

/**
 * 处理创建规则请求
 * 
 * @param message 包含规则数据的消息对象
 */
export async function handleCreateRule(message: any) {
	info('Received request to create a new rule');
	
	if (!message.rule) {
		error('No rule data provided');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleCreated',
				success: false,
				error: 'No rule data provided'
			});
		}
		return;
	}
	
	// 获取当前工作区
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	if (!workspaceFolder) {
		warn('No workspace folder found');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleCreated',
				success: false,
				error: 'Please open a workspace folder first'
			});
		}
		return;
	}
	
	try {
		// 如果规则目录不存在，则创建它
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		if (!fs.existsSync(path.join(workspaceFolder.uri.fsPath, '.cursor'))) {
			fs.mkdirSync(path.join(workspaceFolder.uri.fsPath, '.cursor'));
		}
		
		if (!fs.existsSync(rulesDir)) {
			fs.mkdirSync(rulesDir);
		}
		
		// 生成规则文件名
		const ruleName = message.rule.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		
		const fileName = `${ruleName}.mdc`;
		const filePath = path.join(rulesDir, fileName);
		
		// 构建带有前置元数据的规则内容
		let ruleContent = '---\n';
		ruleContent += `description: ${message.rule.description || 'Custom rule'}\n`;
		
		// 如果提供了技术栈，将其添加到前置元数据
		if (message.rule.techStack) {
			ruleContent += 'techStack:\n';
			
			if (message.rule.techStack.languages && message.rule.techStack.languages.length > 0) {
				ruleContent += '  languages:\n';
				message.rule.techStack.languages.forEach((lang: string) => {
					ruleContent += `    - "${lang}"\n`;
				});
			}
			
			if (message.rule.techStack.frameworks && message.rule.techStack.frameworks.length > 0) {
				ruleContent += '  frameworks:\n';
				message.rule.techStack.frameworks.forEach((framework: string) => {
					ruleContent += `    - "${framework}"\n`;
				});
			}
			
			if (message.rule.techStack.libraries && message.rule.techStack.libraries.length > 0) {
				ruleContent += '  libraries:\n';
				message.rule.techStack.libraries.forEach((lib: string) => {
					ruleContent += `    - "${lib}"\n`;
				});
			}
			
			if (message.rule.techStack.tools && message.rule.techStack.tools.length > 0) {
				ruleContent += '  tools:\n';
				message.rule.techStack.tools.forEach((tool: string) => {
					ruleContent += `    - "${tool}"\n`;
				});
			}
		}
		
		ruleContent += '---\n\n';
		
		// 添加主体内容
		ruleContent += message.rule.content;
		
		// 写入文件
		fs.writeFileSync(filePath, ruleContent, 'utf8');
		
		info(`Rule created successfully: ${filePath}`);
		
		// 发送成功响应
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleCreated',
				success: true,
				rulePath: filePath
			});
		}
		
		// 在编辑器中打开文件
		const document = await vscode.workspace.openTextDocument(filePath);
		await vscode.window.showTextDocument(document);
		
	} catch (err) {
		error(`Error creating rule: ${err}`, err);
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleCreated',
				success: false,
				error: `Failed to create rule: ${err}`
			});
		}
	}
}

/**
 * 处理获取规则详情请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleGetRuleDetail(message: any) {
	info('Received request for rule detail:', message.ruleId);
	console.log('[DEBUG getRuleDetail] 收到规则详情请求, 参数:', JSON.stringify(message));
	
	if (!message.ruleId) {
		error('No rule ID provided');
		console.log('[DEBUG getRuleDetail] 请求中没有提供ruleId');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDetail',
				success: false,
				error: 'No rule ID provided'
			});
			console.log('[DEBUG getRuleDetail] 已发送错误响应: 没有提供规则ID');
		} else {
			console.log('[DEBUG getRuleDetail] configPanel未定义，无法发送响应');
		}
		return;
	}
	
	// 获取当前工作区
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	if (!workspaceFolder) {
		warn('No workspace folder found');
		console.log('[DEBUG getRuleDetail] 未找到工作区文件夹');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDetail',
				success: false,
				error: 'Please open a workspace folder first'
			});
			console.log('[DEBUG getRuleDetail] 已发送错误响应: 没有工作区文件夹');
		} else {
			console.log('[DEBUG getRuleDetail] configPanel未定义，无法发送响应');
		}
		return;
	}
	
	try {
		// 首先，尝试在自定义规则中查找
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		console.log(`[DEBUG getRuleDetail] 在目录中查找规则: ${rulesDir}`);
		
		let rule: Rule | null = null;
		
		// 如果是自定义规则（存储为文件）
		if (fs.existsSync(rulesDir)) {
			const potentialPath = path.join(rulesDir, message.ruleId);
			console.log(`[DEBUG getRuleDetail] 检查规则文件是否存在: ${potentialPath}`);
			
			if (fs.existsSync(potentialPath)) {
				console.log(`[DEBUG getRuleDetail] 找到规则文件: ${potentialPath}`);
				const content = fs.readFileSync(potentialPath, 'utf8');
				
				// 从内容中提取名称和描述
				const nameMatch = content.match(/# (.*)/);
				const descMatch = content.match(/description: (.*)/);
				
				rule = {
					id: message.ruleId,
					name: nameMatch ? nameMatch[1] : message.ruleId,
					description: descMatch ? descMatch[1] : '',
					filePath: potentialPath,
					content: content,
					source: RuleSource.Custom,
					lastUpdated: fs.statSync(potentialPath).mtime.getTime()
				};
				console.log(`[DEBUG getRuleDetail] 已创建规则对象: ${rule.name}`);
			} else {
				console.log(`[DEBUG getRuleDetail] 未找到规则文件: ${potentialPath}`);
			}
		} else {
			console.log(`[DEBUG getRuleDetail] 规则目录不存在: ${rulesDir}`);
		}
		
		// 如果在自定义规则中未找到，尝试在内置规则中查找
		if (!rule) {
			console.log(`[DEBUG getRuleDetail] 在内置规则中查找`);
			const builtInRules = await getAllRuleMetadata();
			console.log(`[DEBUG getRuleDetail] 找到${builtInRules.length}个内置规则`);
			
			const builtInRule = builtInRules.find((r: RuleMetadata) => r.id === message.ruleId);
			
			if (builtInRule) {
				console.log(`[DEBUG getRuleDetail] 找到内置规则: ${builtInRule.name}`);
				rule = {
					...builtInRule,
					content: '# ' + builtInRule.name + '\n\n' + builtInRule.description,
					source: RuleSource.BuiltIn
				};
			} else {
				console.log(`[DEBUG getRuleDetail] 未找到ID为${message.ruleId}的内置规则`);
			}
		}
		
		// 发送响应
		if (rule) {
			info(`Rule found: ${rule.name}`);
			console.log(`[DEBUG getRuleDetail] 发送成功响应，包含规则: ${rule.name}`);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleDetail',
					success: true,
					rule: rule
				});
				console.log(`[DEBUG getRuleDetail] 响应成功发送`);
			} else {
				console.log(`[DEBUG getRuleDetail] configPanel未定义，无法发送响应`);
			}
		} else {
			warn(`Rule not found: ${message.ruleId}`);
			console.log(`[DEBUG getRuleDetail] 未找到ID为${message.ruleId}的规则`);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleDetail',
					success: false,
					error: `Rule not found: ${message.ruleId}`
				});
				console.log(`[DEBUG getRuleDetail] 已发送错误响应`);
			} else {
				console.log(`[DEBUG getRuleDetail] configPanel未定义，无法发送响应`);
			}
		}
	} catch (err) {
		error(`Error getting rule detail: ${err}`, err);
		console.log(`[DEBUG getRuleDetail] 处理过程中出错:`, err);
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDetail',
				success: false,
				error: `Failed to get rule detail: ${err}`
			});
			console.log(`[DEBUG getRuleDetail] 已发送错误响应`);
		} else {
			console.log(`[DEBUG getRuleDetail] configPanel未定义，无法发送响应`);
		}
	}
}

/**
 * 处理打开规则文件请求
 * 
 * @param message 带有文件路径的消息对象
 */
export async function handleOpenRule(message: any) {
	info('Received request to open rule file:', message.path);
	
	if (!message.path) {
		error('No file path provided');
		return;
	}
	
	try {
		// 检查文件是否存在
		if (fs.existsSync(message.path)) {
			// 在编辑器中打开文件
			const document = await vscode.workspace.openTextDocument(message.path);
			await vscode.window.showTextDocument(document);
			info(`Opened rule file: ${message.path}`);
		} else {
			warn(`Rule file not found: ${message.path}`);
			vscode.window.showErrorMessage(`Rule file not found: ${message.path}`);
		}
	} catch (err) {
		error(`Error opening rule file: ${err}`, err);
		vscode.window.showErrorMessage(`Failed to open rule file: ${err}`);
	}
}

/**
 * 处理删除规则请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleDeleteRule(message: any) {
	info('Received request to delete rule:', message.ruleId);
	
	if (!message.ruleId) {
		error('No rule ID provided');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDeleted',
				success: false,
				error: 'No rule ID provided'
			});
		}
		return;
	}
	
	// 获取当前工作区
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	if (!workspaceFolder) {
		warn('No workspace folder found');
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDeleted',
				success: false,
				error: 'Please open a workspace folder first'
			});
		}
		return;
	}
	
	try {
		// 查找规则文件
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		const filePath = path.join(rulesDir, message.ruleId);
		
		// 检查文件是否存在
		if (fs.existsSync(filePath)) {
			// 删除文件
			fs.unlinkSync(filePath);
			info(`Rule deleted successfully: ${filePath}`);
			
			// 发送成功响应
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleDeleted',
					success: true
				});
			}
			
			// 导航回规则列表
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'navigateTo',
					page: 'rules'
				});
			}
			
			vscode.window.showInformationMessage(`Rule deleted successfully`);
		} else {
			warn(`Rule file not found: ${filePath}`);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleDeleted',
					success: false,
					error: `Rule file not found: ${filePath}`
				});
			}
		}
	} catch (err) {
		error(`Error deleting rule: ${err}`, err);
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleDeleted',
				success: false,
				error: `Failed to delete rule: ${err}`
			});
		}
	}
}

/**
 * 处理编辑规则请求
 * 
 * @param message 带有规则数据的消息对象
 */
export async function handleEditRule(message: any) {
	info('Received request to edit rule');
	
	if (!message.rule) {
		error('No rule data provided');
		return;
	}
	
	try {
		// 检查文件是否存在
		if (message.rule.filePath && fs.existsSync(message.rule.filePath)) {
			// 在编辑器中打开文件
			const document = await vscode.workspace.openTextDocument(message.rule.filePath);
			await vscode.window.showTextDocument(document);
			info(`Opened rule file for editing: ${message.rule.filePath}`);
		} else {
			warn(`Rule file not found: ${message.rule.filePath}`);
			vscode.window.showErrorMessage(`Rule file not found: ${message.rule.filePath}`);
		}
	} catch (err) {
		error(`Error editing rule: ${err}`, err);
		vscode.window.showErrorMessage(`Failed to edit rule: ${err}`);
	}
} 