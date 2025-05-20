import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigItem } from './types';
import { defaultConfig } from './defaults';
import { ruleTemplates } from '../cursorRules/templates';
import { createRuleFromTemplate } from '../cursorRules/manager';
import { detectProjectTechStack } from '../techStack';

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