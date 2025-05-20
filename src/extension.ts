// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { detectProjectTechStack, TechStackInfo, getTechStackDescription } from './techStack';
import { getDefaultAIClient, CursorAIClient, CursorAIRequest, CursorAIResponse, Message } from './cursor/cursorAI';
import { window, commands, ExtensionContext, WebviewPanel, ViewColumn, Uri, workspace, TextDocument, Range, Position } from 'vscode';

// 配置项接口定义
interface ConfigItem {
	id: string;
	label: string;
	value: string | boolean | number;
	type: 'string' | 'boolean' | 'number';
}

// 默认配置
const defaultConfig: ConfigItem[] = [
	{ id: 'enableAutoCheck', label: '启动时自动检查Cursor Rules', value: true, type: 'boolean' },
	{ id: 'defaultTemplate', label: '默认模板', value: 'basic', type: 'string' }
];

// Cursor Rules检查结果
interface CursorRulesCheckResult {
	exists: boolean;
	paths: string[];
}

// 弹窗选项
enum CursorRulesPromptChoice {
	AutoConfigure = '自动配置',
	ManualConfigure = '手动配置',
	SkipNow = '暂不配置',
	NeverAskAgain = '此项目不再提示'
}

// 规则模板接口
interface RuleTemplate {
	id: string;
	name: string;
	description: string;
	content: string;
}

// 预定义的规则模板
const ruleTemplates: RuleTemplate[] = [
	{
		id: 'basic',
		name: '基础规则',
		description: '包含基本代码风格和安全规则',
		content: `---
description: 基本项目规则
---
# 项目规范

## 代码风格
- 使用一致的缩进和格式
- 变量命名采用驼峰命名法
- 避免过长的函数和嵌套层级
- 总是添加适当的注释

## 安全规则
- 避免硬编码密钥或敏感信息
- 确保正确处理用户输入
- 使用安全的API调用方式

## 项目特定规则
- 在此添加项目特有的规则和惯例
`
	},
	{
		id: 'typescript',
		name: 'TypeScript规则',
		description: '适用于TypeScript项目的规则',
		content: `---
description: TypeScript项目规则
globs: "**/*.ts,**/*.tsx"
---
# TypeScript项目规范

## 类型声明
- 总是显式声明类型，尽量避免any
- 使用接口（interface）定义对象类型
- 使用类型别名（type）定义复杂类型
- 使用枚举（enum）定义固定选项集合

## 函数规范
- 所有函数必须有返回类型声明
- 使用函数重载表达复杂的类型关系
- 尽量使用箭头函数保持this上下文

## 项目组织
- 每个文件只导出一个主要类或函数
- 相关功能放在同一目录下
- 使用index.ts统一导出API
`
	},
	{
		id: 'react',
		name: 'React规则',
		description: '适用于React项目的规则',
		content: `---
description: React项目规则
globs: "**/*.tsx,**/*.jsx"
---
# React项目规范

## 组件设计
- 优先使用函数组件和Hooks
- 组件尽量保持纯函数，避免副作用
- 使用自定义Hook封装复杂逻辑
- 大型组件拆分为小组件

## 状态管理
- 使用useState管理简单状态
- 复杂状态使用useReducer
- 跨组件状态使用Context API
- 避免过度使用全局状态

## 性能优化
- 使用React.memo避免不必要的重新渲染
- 使用useCallback缓存回调函数
- 使用useMemo缓存计算结果
`
	}
];

// 配置面板类
class ConfigPanelViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'cursor-rules-assistant.configView';
	private _view?: vscode.WebviewView;
	
	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _extensionContext: vscode.ExtensionContext
	) {}
	
	// 解析webview的HTML内容
	private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
		// webview的本地资源路径
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
		
		// 使用nonce来防止恶意脚本注入
		const nonce = this._getNonce();
		
		return `<!DOCTYPE html>
			<html lang="zh-CN">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource};">
				<title>Cursor Rules助手</title>
			</head>
			<body>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
	
	// 生成随机nonce值
	private _getNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
	
	// 解析webview
	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;
		
		// 设置webview选项
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'dist')
			]
		};
		
		// 设置HTML内容
		webviewView.webview.html = this._getWebviewContent(webviewView.webview, this._extensionUri);
		
		// 加载配置
		const config = this._loadConfig();
		
		// 处理webview消息
		webviewView.webview.onDidReceiveMessage(
			async message => {
				switch (message.type) {
					case 'getConfig':
						// 发送配置到webview
						this._view?.webview.postMessage({
							type: 'configLoaded',
							config: config
						});
						break;
					
					case 'updateConfig':
						// 保存更新的配置
						this._saveConfig(message.config);
						break;
					
					case 'resetConfig':
						// 重置为默认配置
						this._saveConfig(defaultConfig);
						// 发送重置后的配置到webview
						this._view?.webview.postMessage({
							type: 'configLoaded',
							config: defaultConfig
						});
						break;
						
					case 'createTemplate':
						// 创建模板
						const templateId = message.templateId;
						const template = ruleTemplates.find(t => t.id === templateId);
						
						if (template) {
							// 获取当前工作区
							const workspaceFolders = vscode.workspace.workspaceFolders;
							if (!workspaceFolders || workspaceFolders.length === 0) {
								vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
								return;
							}
							
							let workspaceFolder: vscode.WorkspaceFolder;
							
							// 如果有多个工作区，让用户选择
							if (workspaceFolders.length === 1) {
								workspaceFolder = workspaceFolders[0];
							} else {
								const selected = await vscode.window.showQuickPick(
									workspaceFolders.map(folder => ({ label: folder.name, folder })),
									{ placeHolder: '选择要配置Cursor Rules的工作区' }
								);
								
								if (!selected) {
									return;
								}
								
								workspaceFolder = selected.folder;
							}
							
							// 创建模板文件
							await createRuleFromTemplate(workspaceFolder, template);
						}
						break;
						
					case 'detectTechStack':
						// 检测技术栈
						const workspaceFolders = vscode.workspace.workspaceFolders;
						if (!workspaceFolders || workspaceFolders.length === 0) {
							vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
							return;
						}
						
						let workspaceFolder: vscode.WorkspaceFolder;
						
						// 如果有多个工作区，让用户选择
						if (workspaceFolders.length === 1) {
							workspaceFolder = workspaceFolders[0];
						} else {
							const selected = await vscode.window.showQuickPick(
								workspaceFolders.map(folder => ({ label: folder.name, folder })),
								{ placeHolder: '选择要检测技术栈的工作区' }
							);
							
							if (!selected) {
								return;
							}
							
							workspaceFolder = selected.folder;
						}
						
						// 执行技术栈检测
						try {
							const techStackInfo = await detectProjectTechStack(workspaceFolder);
							
							// 发送结果到webview
							this._view?.webview.postMessage({
								type: 'techStackDetected',
								techStackInfo: techStackInfo
							});
						} catch (error) {
							console.error('检测技术栈时出错:', error);
							vscode.window.showErrorMessage('检测技术栈失败，请重试。');
						}
						break;
				}
			},
			undefined,
			this._extensionContext.subscriptions
		);
	}
	
	// 加载配置
	private _loadConfig(): ConfigItem[] {
		try {
			const config = this._extensionContext.globalState.get<ConfigItem[]>('pluginConfig');
			return config || defaultConfig;
		} catch (error) {
			console.error('加载配置失败:', error);
			return defaultConfig;
		}
	}
	
	// 保存配置
	private _saveConfig(config: ConfigItem[]): void {
		try {
			this._extensionContext.globalState.update('pluginConfig', config);
		} catch (error) {
			console.error('保存配置失败:', error);
			vscode.window.showErrorMessage('保存配置失败，请重试。');
		}
	}
}

/**
 * 检查工作区是否存在Cursor Rules
 * @param workspaceFolder 工作区文件夹
 * @returns 检查结果
 */
async function checkCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<CursorRulesCheckResult> {
	const result: CursorRulesCheckResult = {
		exists: false,
		paths: []
	};
	
	if (!workspaceFolder) {
		return result;
	}
	
	const rootPath = workspaceFolder.uri.fsPath;
	
	// 检查 .cursor/rules 目录
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	if (fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory()) {
		result.exists = true;
		result.paths.push(rulesDir);
	}
	
	// 检查 .cursorrules 文件 (旧版本格式)
	const legacyRulesFile = path.join(rootPath, '.cursorrules');
	if (fs.existsSync(legacyRulesFile) && fs.statSync(legacyRulesFile).isFile()) {
		result.exists = true;
		result.paths.push(legacyRulesFile);
	}
	
	return result;
}

/**
 * 创建工作区唯一ID
 * @param workspaceFolder 工作区文件夹
 * @returns 工作区ID
 */
function getWorkspaceFolderId(workspaceFolder: vscode.WorkspaceFolder): string {
	return workspaceFolder.uri.toString();
}

/**
 * 检查是否应该为工作区显示提示
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 * @returns 是否显示提示
 */
function shouldShowPrompt(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): boolean {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	return !neverAskList.includes(workspaceId);
}

/**
 * 记住用户选择不再显示提示
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 */
function saveNeverAskAgain(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): void {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	
	if (!neverAskList.includes(workspaceId)) {
		neverAskList.push(workspaceId);
		context.globalState.update('cursorRules.neverAsk', neverAskList);
	}
}

/**
 * 显示Cursor Rules配置提示
 * @param workspaceFolder 工作区文件夹
 * @returns 用户选择
 */
async function showCursorRulesPrompt(workspaceFolder: vscode.WorkspaceFolder): Promise<CursorRulesPromptChoice | undefined> {
	const options: vscode.QuickPickItem[] = [
		{ label: CursorRulesPromptChoice.AutoConfigure, description: '自动创建基础Cursor Rules配置' },
		{ label: CursorRulesPromptChoice.ManualConfigure, description: '打开手动配置向导' },
		{ label: CursorRulesPromptChoice.SkipNow, description: '本次跳过，下次仍提示' },
		{ label: CursorRulesPromptChoice.NeverAskAgain, description: '此项目不再提示' }
	];
	
	const selection = await vscode.window.showQuickPick(options, {
		placeHolder: `${workspaceFolder.name}项目未配置Cursor Rules，是否进行配置？`,
		ignoreFocusOut: true
	});
	
	return selection?.label as CursorRulesPromptChoice;
}

/**
 * 根据模板创建规则文件
 * @param workspaceFolder 工作区文件夹
 * @param template 模板
 */
async function createRuleFromTemplate(workspaceFolder: vscode.WorkspaceFolder, template: RuleTemplate): Promise<void> {
	const rootPath = workspaceFolder.uri.fsPath;
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	
	// 创建.cursor/rules目录
	if (!fs.existsSync(path.join(rootPath, '.cursor'))) {
		fs.mkdirSync(path.join(rootPath, '.cursor'));
	}
	
	if (!fs.existsSync(rulesDir)) {
		fs.mkdirSync(rulesDir);
	}
	
	// 创建规则文件
	const rulePath = path.join(rulesDir, `${template.id}.mdc`);
	fs.writeFileSync(rulePath, template.content);
	
	// 尝试打开创建的文件
	const document = await vscode.workspace.openTextDocument(rulePath);
	await vscode.window.showTextDocument(document);
	
	vscode.window.showInformationMessage(`已成功创建${template.name}规则，您可以根据需要进行修改。`);
}

/**
 * 自动配置Cursor Rules
 * @param workspaceFolder 工作区文件夹
 */
async function autoConfigureCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
	// 检测项目技术栈
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			// 检测项目技术栈
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			
			// 根据技术栈选择最合适的模板
			let templateId = 'basic'; // 默认使用基础模板
			
			// 如果检测到TypeScript，选用TypeScript模板
			if (techStackInfo.languages.includes('TypeScript')) {
				templateId = 'typescript';
				
				// 如果同时检测到React，选用React模板
				if (techStackInfo.frameworks.includes('React')) {
					templateId = 'react';
				}
			} else if (techStackInfo.frameworks.includes('React')) {
				// 如果只检测到React但不是TypeScript，依然使用React模板
				templateId = 'react';
			}
			
			// 获取模板
			const template = ruleTemplates.find(t => t.id === templateId) || ruleTemplates[0];
			
			// 显示检测到的技术栈信息
			if (techStackInfo.confidence > 0.5) {
				const techStackDesc = getTechStackDescription(techStackInfo);
				vscode.window.showInformationMessage(`检测到项目技术栈: ${techStackDesc}，将使用${template.name}模板。`);
			}
			
			// 创建规则文件
			await createRuleFromTemplate(workspaceFolder, template);
			
			return techStackInfo;
		} catch (error) {
			console.error('检测技术栈时出错:', error);
			
			// 出错时回退到原来的逻辑
			const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
			const defaultTemplateId = config.get<string>('defaultTemplate', 'basic');
			const template = ruleTemplates.find(t => t.id === defaultTemplateId) || ruleTemplates[0];
			
			await createRuleFromTemplate(workspaceFolder, template);
		}
	});
}

/**
 * 打开手动配置向导
 */
async function openManualConfiguration(): Promise<void> {
	// 这里可以跳转到配置页面或打开文档
	vscode.commands.executeCommand('workbench.view.extension.cursor-rules-assistant-view');
	vscode.window.showInformationMessage('已打开Cursor Rules配置面板，请按向导进行配置。');
}

/**
 * 处理用户选择
 * @param choice 用户选择
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 */
async function handleCursorRulesChoice(
	choice: CursorRulesPromptChoice | undefined,
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	switch (choice) {
		case CursorRulesPromptChoice.AutoConfigure:
			await autoConfigureCursorRules(workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.ManualConfigure:
			await openManualConfiguration();
			break;
			
		case CursorRulesPromptChoice.NeverAskAgain:
			saveNeverAskAgain(context, workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.SkipNow:
		default:
			// 不执行任何操作
			break;
	}
}

// 注册生成代码命令
const generateCodeCommand = commands.registerCommand('cursor-rules-assistant.generateCode', async () => {
	try {
		// 获取用户输入的提示
		const prompt = await window.showInputBox({
			prompt: '输入代码生成提示',
			placeHolder: '例如: 生成一个Node.js的HTTP服务器'
		});
		
		if (!prompt) {
			return;
		}
		
		// 获取当前活动编辑器的语言
		let language = 'javascript';
		if (window.activeTextEditor) {
			language = window.activeTextEditor.document.languageId;
		}
		
		// 显示进度条
		window.withProgress({
			location: { viewId: 'cursor-rules-assistant.configView' },
			title: '正在生成代码...',
			cancellable: false
		}, async () => {
			// 调用Cursor AI生成代码
			try {
				const client = getDefaultAIClient();
				await client.initialize();
				
				const options: CursorAIRequest = {
					prompt: prompt,
					language: language,
					maxTokens: 2048,
					temperature: 0.7
				};
				
				const response = await client.generateCode(options);
				
				if (!response.error) {
					// 创建一个新的编辑器显示生成的代码
					const document = await workspace.openTextDocument({
						content: response.code || '',
						language: language // 使用请求中指定的语言
					});
					await window.showTextDocument(document, ViewColumn.One, true);
					window.showInformationMessage('代码生成成功!');
				} else {
					vscode.window.showErrorMessage(`生成代码失败: ${response.error}`);
				}
			} catch (error: any) {
				vscode.window.showErrorMessage(`生成代码失败: ${error.message}`);
			}
		});
	} catch (error) {
		console.error('生成代码出错:', error);
		window.showErrorMessage(`生成代码出错: ${error instanceof Error ? error.message : String(error)}`);
	}
});

// 注册流式对话命令
const streamConversationCommand = commands.registerCommand('cursor-rules-assistant.streamConversation', async () => {
	try {
		// 获取用户输入的提示
		const prompt = await window.showInputBox({
			prompt: '输入对话提示',
			placeHolder: '例如: 请详细介绍一下TypeScript的泛型'
		});
		
		if (!prompt) {
			return;
		}
		
		// 创建输出面板
		const outputChannel = window.createOutputChannel('Cursor AI 对话');
		outputChannel.show(true);
		outputChannel.appendLine('🤖 开始流式对话...\n');
		outputChannel.appendLine(`👤 用户: ${prompt}\n`);
		outputChannel.appendLine('🤖 AI 助手:');
		
		// 调用流式API
		try {
			const client = getDefaultAIClient();
			await client.initialize();
			
			const request: CursorAIRequest = {
				prompt: prompt,
				model: 'claude-3-opus-20240229',
				temperature: 0.7,
				maxTokens: 4000,
				stream: true
			};
			
			// 显示进度指示器
			window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: '正在生成回复...',
				cancellable: false
			}, async (progress) => {
				try {
					// 发送流式请求
					const response = await client.completionStream(request);
					
					// 处理流式响应
					const reader = response.body?.getReader();
					if (!reader) {
						throw new Error('无法获取响应流');
					}
					
					const decoder = new TextDecoder();
					let fullText = '';
					
					while (true) {
						const { value, done } = await reader.read();
						if (done) break;
						
						const chunk = decoder.decode(value, { stream: true });
						const lines = chunk.split('\n');
						
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const data = line.substring(6);
								if (data === '[DONE]') {
									continue;
								}
								
								try {
									const jsonData = JSON.parse(data);
									if (jsonData.choices && jsonData.choices.length > 0) {
										const content = jsonData.choices[0]?.delta?.content || '';
										if (content) {
											outputChannel.append(content);
											fullText += content;
											
											// 更新进度
											progress.report({ message: `已接收 ${fullText.length} 个字符` });
										}
									}
								} catch (e) {
									// 忽略解析错误
									console.error('解析数据错误:', e);
								}
							}
						}
					}
					
					outputChannel.appendLine('\n\n✅ 回复完成');
				} catch (error) {
					outputChannel.appendLine(`\n\n❌ 错误: ${error instanceof Error ? error.message : String(error)}`);
					throw error;
				}
			});
		} catch (error: any) {
			outputChannel.appendLine(`\n\n❌ 错误: ${error.message}`);
			vscode.window.showErrorMessage(`流式对话失败: ${error.message}`);
		}
	} catch (error) {
		console.error('流式对话出错:', error);
		window.showErrorMessage(`流式对话出错: ${error instanceof Error ? error.message : String(error)}`);
	}
});

// 注册高级对话命令
const advancedConversationCommand = commands.registerCommand('cursor-rules-assistant.advancedConversation', async () => {
	try {
		// 创建和显示对话面板
		const outputChannel = window.createOutputChannel('Cursor AI 高级对话');
		outputChannel.show(true);
		outputChannel.appendLine('🤖 Cursor AI 高级对话助手\n');
		
		// 获取系统提示
		const systemPrompt = await window.showInputBox({
			prompt: '输入系统提示 (可选)',
			placeHolder: '例如: 你是一位精通TypeScript的专业助手',
			value: '你是一位精通编程的专业技术助手，擅长解决编程问题和回答技术问题。'
		});
		
		if (systemPrompt === undefined) {
			// 用户取消了操作
			return;
		}
		
		// 初始化对话历史
		const messages: Message[] = [];
		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
			outputChannel.appendLine(`🔧 系统指令: ${systemPrompt}\n`);
		}
		
		// 初始化AI客户端
		const client = getDefaultAIClient();
		await client.initialize();
		
		// 对话循环
		let continueDialog = true;
		while (continueDialog) {
			// 获取用户输入
			const userPrompt = await window.showInputBox({
				prompt: '输入你的问题 (输入"exit"退出对话)',
				placeHolder: '例如: 请解释一下JavaScript中的闭包概念'
			});
			
			if (!userPrompt || userPrompt.toLowerCase() === 'exit') {
				continueDialog = false;
				outputChannel.appendLine('\n🔚 对话已结束');
				break;
			}
			
			// 添加用户消息到历史
			messages.push({ role: 'user', content: userPrompt });
			outputChannel.appendLine(`👤 用户: ${userPrompt}\n`);
			outputChannel.appendLine('🤖 AI 助手:');
			
			try {
				// 准备请求参数
				const request: CursorAIRequest = {
					messages: [...messages], // 复制消息历史
					model: 'claude-3-opus-20240229',
					temperature: 0.7,
					maxTokens: 4000,
					prompt: '' // 提供一个空的prompt，真正的内容在messages中
				};
				
				// 显示进度指示器
				await window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: '正在生成回复...',
					cancellable: false
				}, async () => {
					// 发送请求
					const response = await client.completionNonStream(request);
					
					if (response.error) {
						outputChannel.appendLine(`\n❌ 错误: ${response.error}`);
						vscode.window.showErrorMessage(`生成回复失败: ${response.error}`);
					} else {
						const assistantResponse = response.response || '';
						outputChannel.appendLine(assistantResponse);
						outputChannel.appendLine('\n');
						
						// 添加助手回复到历史
						messages.push({ role: 'assistant', content: assistantResponse });
						
						// 显示token使用情况
						if (response.usage) {
							outputChannel.appendLine(`ℹ️ Token使用: 输入 ${response.usage.input}, 输出 ${response.usage.output}\n`);
						}
					}
				});
			} catch (error: any) {
				outputChannel.appendLine(`\n❌ 错误: ${error.message}\n`);
				vscode.window.showErrorMessage(`对话出错: ${error.message}`);
			}
		}
	} catch (error) {
		console.error('高级对话出错:', error);
		window.showErrorMessage(`高级对话出错: ${error instanceof Error ? error.message : String(error)}`);
	}
});

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('Cursor Rules Assistant 已激活！');
	
	// 注册配置面板提供者
	const configPanelProvider = new ConfigPanelViewProvider(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ConfigPanelViewProvider.viewType,
			configPanelProvider
		)
	);
	
	// 注册打开配置命令
	const openConfigCommand = vscode.commands.registerCommand('cursor-rules-assistant.openConfig', () => {
		vscode.commands.executeCommand('workbench.view.extension.cursor-rules-assistant-view');
	});
	
	// 注册创建Cursor Rules命令
	const createCursorRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.createCursorRules', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
			return;
		}
		
		// 如果有多个工作区，让用户选择
		let workspaceFolder: vscode.WorkspaceFolder;
		if (workspaceFolders.length === 1) {
			workspaceFolder = workspaceFolders[0];
		} else {
			const selected = await vscode.window.showQuickPick(
				workspaceFolders.map(folder => ({ label: folder.name, folder })),
				{ placeHolder: '选择要配置Cursor Rules的工作区' }
			);
			
			if (!selected) {
				return;
			}
			
			workspaceFolder = selected.folder;
		}
		
		await autoConfigureCursorRules(workspaceFolder);
	});
	
	// 注册技术栈检测命令
	const detectTechStackCommand = vscode.commands.registerCommand('cursor-rules-assistant.detectTechStack', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
			return;
		}
		
		// 如果有多个工作区，让用户选择
		let workspaceFolder: vscode.WorkspaceFolder;
		if (workspaceFolders.length === 1) {
			workspaceFolder = workspaceFolders[0];
		} else {
			const selected = await vscode.window.showQuickPick(
				workspaceFolders.map(folder => ({ label: folder.name, folder })),
				{ placeHolder: '选择要检测技术栈的工作区' }
			);
			
			if (!selected) {
				return;
			}
			
			workspaceFolder = selected.folder;
		}
		
		// 显示进度条
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "正在分析项目技术栈...",
			cancellable: false
		}, async (progress) => {
			try {
				const techStackInfo = await detectProjectTechStack(workspaceFolder);
				const techStackDesc = getTechStackDescription(techStackInfo);
				
				// 显示技术栈信息
				vscode.window.showInformationMessage(`检测到的项目技术栈: ${techStackDesc}`);
				
				return techStackInfo;
			} catch (error) {
				console.error('检测技术栈时出错:', error);
				vscode.window.showErrorMessage('检测技术栈失败，请重试');
			}
		});
	});
	
	// 注册AI相关命令
	const aiCommands = [
		generateCodeCommand,
		streamConversationCommand,
		advancedConversationCommand,
		// 可以添加更多AI相关命令
	];
	
	context.subscriptions.push(openConfigCommand, createCursorRulesCommand, detectTechStackCommand, ...aiCommands);
	
	// 启动时检查Cursor Rules
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return;
	}
	
	// 获取插件配置
	const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
	const enableAutoCheck = config.get<boolean>('enableAutoCheck', true);
	
	// 如果启用了自动检查，则检查每个工作区
	if (enableAutoCheck) {
		// 为每个工作区检查Cursor Rules
		for (const workspaceFolder of workspaceFolders) {
			// 检查是否应该显示提示
			if (!shouldShowPrompt(context, workspaceFolder)) {
				continue;
			}
			
			// 检查是否存在Cursor Rules
			const checkResult = await checkCursorRules(workspaceFolder);
			if (checkResult.exists) {
				continue;
			}
			
			// 显示提示
			const choice = await showCursorRulesPrompt(workspaceFolder);
			await handleCursorRulesChoice(choice, context, workspaceFolder);
		}
	}
	
	// 监听工作区变化
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(async event => {
			// 当新工作区添加时检查
			if (!enableAutoCheck) {
				return;
			}
			
			for (const workspaceFolder of event.added) {
				// 检查是否应该显示提示
				if (!shouldShowPrompt(context, workspaceFolder)) {
					continue;
				}
				
				// 检查是否存在Cursor Rules
				const checkResult = await checkCursorRules(workspaceFolder);
				if (checkResult.exists) {
					continue;
				}
				
				// 显示提示
				const choice = await showCursorRulesPrompt(workspaceFolder);
				await handleCursorRulesChoice(choice, context, workspaceFolder);
			}
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
