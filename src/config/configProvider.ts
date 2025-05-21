import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigItem } from './types';
import { defaultConfig } from './defaults';
import { createRuleFromTemplate } from '../cursorRules/manager';
import { detectProjectTechStack } from '../techStack';
import { Rule, WorkspaceState } from '../types';

/**
 * 配置提供者模块，负责管理与Cursor Rules相关的配置
 * 包括规则模板、状态管理等
 */

/**
 * 预定义规则模板集合
 */
export const ruleTemplates: Rule[] = [
	{
		id: 'basic',
		name: '基础规则',
		description: '适用于所有项目的通用规则',
		content: `---
description: 通用项目规则
---
# 通用编码规范

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

// 工作区状态配置
const defaultWorkspaceState: WorkspaceState = {
	// 是否已经配置过Cursor Rules
	configured: false,
	
	// 是否已启用Cursor Rules
	enabled: false,
	
	// 最后检查时间
	lastCheck: null,
	
	// 关联的规则文件
	rules: [],
	
	// 技术栈信息
	techStack: {
		languages: [],
		frameworks: [],
		libraries: [],
		tools: [],
		confidence: 0
	},
	
	// 忽略的文件或目录
	ignorePatterns: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
	
	// 其他设置
	settings: {
		applyOnSave: false,
		showNotifications: true,
		debugMode: false
	}
};

/**
 * 获取工作区状态
 * 
 * @param workspace 工作区文件夹
 * @returns 工作区状态对象
 */
export function getWorkspaceState(workspace: vscode.WorkspaceFolder): WorkspaceState {
	try {
		const statePath = path.join(workspace.uri.fsPath, '.cursor', 'state.json');
		if (fs.existsSync(statePath)) {
			const stateData = fs.readFileSync(statePath, { encoding: 'utf8' });
			return JSON.parse(stateData) as WorkspaceState;
		}
	} catch (err) {
		console.error('读取工作区状态失败', err);
	}
	
	return { ...defaultWorkspaceState };
}

/**
 * 保存工作区状态
 * 
 * @param workspace 工作区文件夹
 * @param state 工作区状态对象
 */
export function saveWorkspaceState(workspace: vscode.WorkspaceFolder, state: WorkspaceState): void {
	try {
		const cursorDir = path.join(workspace.uri.fsPath, '.cursor');
		if (!fs.existsSync(cursorDir)) {
			fs.mkdirSync(cursorDir);
		}
		
		const statePath = path.join(cursorDir, 'state.json');
		fs.writeFileSync(statePath, JSON.stringify(state, null, 2), { encoding: 'utf8' });
	} catch (err) {
		console.error('保存工作区状态失败', err);
		vscode.window.showErrorMessage(`无法保存工作区状态: ${err}`);
	}
}

/**
 * 更新工作区配置状态
 * 
 * @param workspace 工作区文件夹
 * @param configured 是否已配置
 */
export function updateConfiguredState(workspace: vscode.WorkspaceFolder, configured: boolean): void {
	const state = getWorkspaceState(workspace);
	state.configured = configured;
	state.lastCheck = new Date().toISOString();
	saveWorkspaceState(workspace, state);
}

/**
 * 配置面板类
 */
export class ConfigPanelViewProvider implements vscode.WebviewViewProvider {
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