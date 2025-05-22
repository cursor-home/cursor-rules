import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { info, error, warn } from '../logger/logger';
import { Rule, RuleSource, RuleMetadata } from '../types';
import { getAllRuleMetadata } from '../cursorRules/metaManager';
import { configPanelInstance } from '../webview/configPanel/showConfigPanel';

/**
 * Handle rule list request
 * 
 * @param message Message object received from WebView
 * @param includeBuiltIn Boolean flag to include built-in rules
 */
export async function handleGetRuleList(message: any, includeBuiltIn: boolean = true) {
	info('Received request for rule list');
	
	// Get current workspace
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	
	if (workspaceFolder) {
		// Look for rules in .cursor/rules directory
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		let rules: Rule[] = [];
		
		try {
			// Check if rules directory exists
			if (fs.existsSync(rulesDir)) {
				info(`Rules directory found: ${rulesDir}`);
				
				// Read all .md and .mdc files
				const files = fs.readdirSync(rulesDir)
					.filter(file => file.endsWith('.md') || file.endsWith('.mdc'));
				
				info(`Found ${files.length} rule files`);
				
				// Build rule objects
				rules = files.map(file => {
					const filePath = path.join(rulesDir, file);
					const content = fs.readFileSync(filePath, 'utf8');
					
					// Extract name and description from content
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
			
			// Get built-in rules if needed
			if (includeBuiltIn) {
				try {
					const builtInRules = await getAllRuleMetadata();
					const builtInRuleObjects = builtInRules.map((rule: RuleMetadata) => ({
						...rule,
						content: '# ' + rule.name + '\n\n' + rule.description,
						source: RuleSource.BuiltIn
					}));
					
					// Combine rules
					rules = [...rules, ...builtInRuleObjects];
				} catch (err) {
					warn('Error loading built-in rules:', err);
				}
			}
			
			// Send success response back to WebView
			info(`Sending ${rules.length} rules back to WebView`);
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleListResult',
					success: true,
					rules: rules
				});
			}
		} catch (err) {
			// Send error response
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
		// No workspace error
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
 * Handle create rule request
 * 
 * @param message Message object containing rule data
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
	
	// Get current workspace
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
		// Create rules directory if it doesn't exist
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		if (!fs.existsSync(path.join(workspaceFolder.uri.fsPath, '.cursor'))) {
			fs.mkdirSync(path.join(workspaceFolder.uri.fsPath, '.cursor'));
		}
		
		if (!fs.existsSync(rulesDir)) {
			fs.mkdirSync(rulesDir);
		}
		
		// Generate rule file name
		const ruleName = message.rule.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
		
		const fileName = `${ruleName}.mdc`;
		const filePath = path.join(rulesDir, fileName);
		
		// Build rule content with front matter
		let ruleContent = '---\n';
		ruleContent += `description: ${message.rule.description || 'Custom rule'}\n`;
		
		// Add tech stack to front matter if provided
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
		
		// Add main content
		ruleContent += message.rule.content;
		
		// Write file
		fs.writeFileSync(filePath, ruleContent, 'utf8');
		
		info(`Rule created successfully: ${filePath}`);
		
		// Send success response
		if (configPanelInstance) {
			configPanelInstance.webview.postMessage({
				type: 'ruleCreated',
				success: true,
				rulePath: filePath
			});
		}
		
		// Open the file in the editor
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
 * Handle get rule detail request
 * 
 * @param message Message object with rule ID
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
	
	// Get current workspace
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
		// First, try to find in custom rules
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		console.log(`[DEBUG getRuleDetail] 在目录中查找规则: ${rulesDir}`);
		
		let rule: Rule | null = null;
		
		// If it's a custom rule (stored as a file)
		if (fs.existsSync(rulesDir)) {
			const potentialPath = path.join(rulesDir, message.ruleId);
			console.log(`[DEBUG getRuleDetail] 检查规则文件是否存在: ${potentialPath}`);
			
			if (fs.existsSync(potentialPath)) {
				console.log(`[DEBUG getRuleDetail] 找到规则文件: ${potentialPath}`);
				const content = fs.readFileSync(potentialPath, 'utf8');
				
				// Extract name and description from content
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
		
		// If not found in custom rules, try to find in built-in rules
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
		
		// Send response
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
 * Handle open rule file request
 * 
 * @param message Message object with file path
 */
export async function handleOpenRule(message: any) {
	info('Received request to open rule file:', message.path);
	
	if (!message.path) {
		error('No file path provided');
		return;
	}
	
	try {
		// Check if file exists
		if (fs.existsSync(message.path)) {
			// Open the file in the editor
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
 * Handle delete rule request
 * 
 * @param message Message object with rule ID
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
	
	// Get current workspace
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
		// Find the rule file
		const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
		const filePath = path.join(rulesDir, message.ruleId);
		
		// Check if file exists
		if (fs.existsSync(filePath)) {
			// Delete the file
			fs.unlinkSync(filePath);
			info(`Rule deleted successfully: ${filePath}`);
			
			// Send success response
			if (configPanelInstance) {
				configPanelInstance.webview.postMessage({
					type: 'ruleDeleted',
					success: true
				});
			}
			
			// Navigate back to rules list
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
 * Handle edit rule request
 * 
 * @param message Message object with rule data
 */
export async function handleEditRule(message: any) {
	info('Received request to edit rule');
	
	if (!message.rule) {
		error('No rule data provided');
		return;
	}
	
	try {
		// Check if file exists
		if (message.rule.filePath && fs.existsSync(message.rule.filePath)) {
			// Open the file in the editor
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