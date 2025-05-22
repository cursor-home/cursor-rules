import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigItem } from './types';
import { defaultConfig } from './defaults';
import { createRuleFromTemplate } from '../cursorRules/autoGenerator';
import { detectTechStack } from '../techStack';
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
`,
		readContent: async () => `---
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
`,
		readContent: async () => `---
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
`,
		readContent: async () => `---
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

// 添加接口定义
interface RuleFile {
	path: string;
	content: string;
	name: string;
	description?: string;
	source: string;
}

/**
 * 配置面板类
 */
export class ConfigPanelViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'cursor-rules-assistant.configView';
	private _view?: vscode.WebviewView;
	private _messageTimestamps: Record<string, number> = {}; // 添加消息时间戳记录
	
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
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
				// 添加调试日志，记录收到的消息类型
				console.log(`[DEBUG ConfigPanelViewProvider] 收到消息:`, message);
			
				// 添加消息循环保护 - 如果是特定消息类型，记录最近的请求时间
				const now = Date.now();
				
				// 检查特定消息类型是否频繁发送（100ms内）
				if (['getRuleDetail', 'getRuleFiles'].includes(message.type)) {
					const lastTime = this._messageTimestamps[message.type];
					if (lastTime && (now - lastTime < 100)) {
						console.log(`[DEBUG ConfigPanelViewProvider] 消息${message.type}频率过高，跳过处理`);
						return;
					}
					this._messageTimestamps[message.type] = now;
				}
			
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
					
					// 添加导航消息处理支持
					case 'navigateTo':
						console.log(`[DEBUG ConfigPanelViewProvider] 处理navigateTo消息:`, message);
						// 将消息转发到webview，保持原有格式
						this._view?.webview.postMessage(message);
						break;
					
					// 添加规则详情相关消息的处理
					case 'getRuleDetail':
						console.log(`[DEBUG ConfigPanelViewProvider] 处理getRuleDetail消息，ruleId: ${message.ruleId}`);
						// 导入并调用ruleCommands中的handleGetRuleDetail
						try {
							// 尝试直接处理规则详情请求
							const fs = require('fs');
							const path = require('path');
							
							// 从工作区获取规则信息
							const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
							if (!workspaceFolder) {
								console.warn('[DEBUG ConfigPanelViewProvider] 未找到工作区文件夹');
								this._view?.webview.postMessage({
									type: 'ruleDetail',
									success: false, 
									error: 'Please open a workspace folder first'
								});
								return;
							}
							
							const rulesDir = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
							console.log(`[DEBUG ConfigPanelViewProvider] 在目录中查找规则: ${rulesDir}`);
							
							// 导入RuleSource
							const { RuleSource } = require('../types');
							
							// 尝试查找规则文件
							if (fs.existsSync(rulesDir)) {
								const potentialPath = path.join(rulesDir, message.ruleId);
								console.log(`[DEBUG ConfigPanelViewProvider] 检查规则文件是否存在: ${potentialPath}`);
								
								if (fs.existsSync(potentialPath)) {
									console.log(`[DEBUG ConfigPanelViewProvider] 找到规则文件: ${potentialPath}`);
									const content = fs.readFileSync(potentialPath, 'utf8');
									console.log(`[DEBUG ConfigPanelViewProvider] 读取规则文件成功，内容长度: ${content.length}，前100个字符: ${content.substring(0, 100)}`);
									
									// 从内容中提取名称和描述
									const nameMatch = content.match(/# (.*)/);
									const descMatch = content.match(/description: (.*)/);
									
									const rule = {
										id: message.ruleId,
										name: nameMatch ? nameMatch[1] : message.ruleId,
										description: descMatch ? descMatch[1] : '',
										filePath: potentialPath,
										content: content,
										source: RuleSource.Custom,
										lastUpdated: fs.statSync(potentialPath).mtime.getTime()
									};
									
									console.log(`[DEBUG ConfigPanelViewProvider] 已创建规则对象: ${rule.name}, 内容长度: ${rule.content.length}`);
									
									// 发送成功响应
									this._view?.webview.postMessage({
										type: 'ruleDetail',
										success: true,
										rule: rule
									});
									console.log(`[DEBUG ConfigPanelViewProvider] 响应成功发送`);
								} else {
									console.log(`[DEBUG ConfigPanelViewProvider] 未找到规则文件: ${potentialPath}`);
									this._view?.webview.postMessage({
										type: 'ruleDetail',
										success: false,
										error: `Rule not found: ${message.ruleId}`
									});
								}
							} else {
								console.log(`[DEBUG ConfigPanelViewProvider] 规则目录不存在: ${rulesDir}`);
								this._view?.webview.postMessage({
									type: 'ruleDetail',
									success: false,
									error: `Rules directory not found`
								});
							}
						} catch (err) {
							console.error(`[DEBUG ConfigPanelViewProvider] 处理getRuleDetail消息出错:`, err);
							this._view?.webview.postMessage({
								type: 'ruleDetail',
								success: false,
								error: `Failed to get rule detail: ${err}`
							});
						}
						break;
						
					case 'openRule':
						console.log(`[DEBUG ConfigPanelViewProvider] 处理openRule消息，路径: ${message.path}`);
						try {
							// 检查文件是否存在
							if (require('fs').existsSync(message.path)) {
								// 打开文件
								const document = await vscode.workspace.openTextDocument(message.path);
								await vscode.window.showTextDocument(document);
							} else {
								vscode.window.showErrorMessage(`Rule file not found: ${message.path}`);
							}
						} catch (err) {
							console.error(`[DEBUG ConfigPanelViewProvider] 处理openRule消息出错:`, err);
							vscode.window.showErrorMessage(`Failed to open rule file: ${err}`);
						}
						break;
					
					case 'deleteRule':
						console.log(`[DEBUG ConfigPanelViewProvider] 处理deleteRule消息，ruleId: ${message.ruleId}`);
						try {
							if (!message.ruleId) {
								console.error('[DEBUG ConfigPanelViewProvider] 没有提供ruleId');
								this._view?.webview.postMessage({
									type: 'ruleDeleted',
									success: false,
									error: 'No rule ID provided'
								});
								return;
							}
							
							// 获取工作区
							const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
							if (!workspaceFolder) {
								console.warn('[DEBUG ConfigPanelViewProvider] 未找到工作区文件夹');
								this._view?.webview.postMessage({
									type: 'ruleDeleted',
									success: false,
									error: 'Please open a workspace folder first'
								});
								return;
							}
							
							// 检查规则文件
							const fs = require('fs');
							const path = require('path');
							const rulePath = path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules', message.ruleId);
							
							if (fs.existsSync(rulePath)) {
								// 删除文件
								fs.unlinkSync(rulePath);
								
								// 发送成功响应
								this._view?.webview.postMessage({
									type: 'ruleDeleted',
									success: true,
									ruleId: message.ruleId
								});
								
								// 显示通知
								vscode.window.showInformationMessage(`规则 ${message.ruleId} 已删除`);
							} else {
								console.warn(`[DEBUG ConfigPanelViewProvider] 规则文件不存在: ${rulePath}`);
								this._view?.webview.postMessage({
									type: 'ruleDeleted',
									success: false,
									error: `Rule file not found: ${message.ruleId}`
								});
							}
						} catch (err) {
							console.error(`[DEBUG ConfigPanelViewProvider] 处理deleteRule消息出错:`, err);
							this._view?.webview.postMessage({
								type: 'ruleDeleted',
								success: false,
								error: `Failed to delete rule: ${err}`
							});
						}
						break;
						
					case 'editRule':
						console.log(`[DEBUG ConfigPanelViewProvider] 处理editRule消息，规则:`, message.rule);
						try {
							if (!message.rule || !message.rule.id) {
								console.error('[DEBUG ConfigPanelViewProvider] 没有提供规则信息');
								vscode.window.showErrorMessage('No rule information provided for editing');
								return;
							}
							
							// 如果有文件路径，直接打开文件
							if (message.rule.filePath && require('fs').existsSync(message.rule.filePath)) {
								const document = await vscode.workspace.openTextDocument(message.rule.filePath);
								await vscode.window.showTextDocument(document);
							} else {
								vscode.window.showErrorMessage(`Cannot edit rule: file not found`);
							}
						} catch (err) {
							console.error(`[DEBUG ConfigPanelViewProvider] 处理editRule消息出错:`, err);
							vscode.window.showErrorMessage(`Failed to edit rule: ${err}`);
						}
						break;
					
					// 添加getRuleFiles消息处理程序
					case 'getRuleFiles':
						try {
							const workspace = vscode.workspace.workspaceFolders?.[0];
							if (!workspace) {
								vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
								return;
							}

							const filesWithContent: RuleFile[] = [];
							const startTime = Date.now();
							const ruleId = message.ruleId;

							// 1. 查找自定义规则（.cursor/rules/）
							const userRuleDir = path.join(workspace.uri.fsPath, '.cursor', 'rules');
							const userRuleFile = path.join(userRuleDir, `${ruleId}.mdc`);
							if (fs.existsSync(userRuleFile)) {
								const content = fs.readFileSync(userRuleFile, 'utf8');
								filesWithContent.push({
									path: userRuleFile.replace(workspace.uri.fsPath, ''),
									content,
									name: path.basename(userRuleFile),
									description: `自定义规则: ${ruleId}`,
									source: 'user'
								});
								console.log(`[DEBUG] 读取自定义规则文件: ${userRuleFile}`);
							}
							// 支持自定义规则目录多文件
							const userRuleSubDir = path.join(userRuleDir, ruleId);
							if (fs.existsSync(userRuleSubDir) && fs.statSync(userRuleSubDir).isDirectory()) {
								const mdcFiles = fs.readdirSync(userRuleSubDir).filter(f => f.endsWith('.mdc'));
								for (const file of mdcFiles) {
									const filePath = path.join(userRuleSubDir, file);
									const content = fs.readFileSync(filePath, 'utf8');
									filesWithContent.push({
										path: filePath.replace(workspace.uri.fsPath, ''),
										content,
										name: path.basename(file),
										description: `自定义规则: ${file}`,
										source: 'user'
									});
									console.log(`[DEBUG] 读取自定义规则目录文件: ${filePath}`);
								}
							}

							// 2. 查找内置规则（resources/rules/）
							const builtInRulesPath = this._getBuiltInRulesPath();
							const builtInRuleFile = path.join(builtInRulesPath, `${ruleId}.mdc`);
							if (fs.existsSync(builtInRuleFile)) {
								const content = fs.readFileSync(builtInRuleFile, 'utf8');
								filesWithContent.push({
									path: builtInRuleFile.replace(builtInRulesPath, 'resources/rules'),
									content,
									name: path.basename(builtInRuleFile),
									description: `内置规则: ${ruleId}`,
									source: 'builtin'
								});
								console.log(`[DEBUG] 读取内置规则文件: ${builtInRuleFile}`);
							}
							// index.mdc
							const builtInRuleIndexFile = path.join(builtInRulesPath, ruleId, 'index.mdc');
							if (fs.existsSync(builtInRuleIndexFile)) {
								const content = fs.readFileSync(builtInRuleIndexFile, 'utf8');
								filesWithContent.push({
									path: builtInRuleIndexFile.replace(builtInRulesPath, 'resources/rules'),
									content,
									name: 'index.mdc',
									description: `内置规则: ${ruleId}/index.mdc`,
									source: 'builtin'
								});
								console.log(`[DEBUG] 读取内置规则 index.mdc: ${builtInRuleIndexFile}`);
							}
							// 目录下所有 .mdc
							const builtInRuleDir = path.join(builtInRulesPath, ruleId);
							if (fs.existsSync(builtInRuleDir) && fs.statSync(builtInRuleDir).isDirectory()) {
								const mdcFiles = fs.readdirSync(builtInRuleDir).filter(f => f.endsWith('.mdc'));
								for (const file of mdcFiles) {
									const filePath = path.join(builtInRuleDir, file);
									const content = fs.readFileSync(filePath, 'utf8');
									filesWithContent.push({
										path: filePath.replace(builtInRulesPath, 'resources/rules'),
										content,
										name: path.basename(file),
										description: `内置规则: ${file}`,
										source: 'builtin'
									});
									console.log(`[DEBUG] 读取内置规则目录文件: ${filePath}`);
								}
							}

							// 3. 查找通用规则（resources/rules/common/）
							const commonRuleFile = path.join(builtInRulesPath, 'common', `${ruleId}.mdc`);
							if (fs.existsSync(commonRuleFile)) {
								const content = fs.readFileSync(commonRuleFile, 'utf8');
								filesWithContent.push({
									path: commonRuleFile.replace(builtInRulesPath, 'resources/rules'),
									content,
									name: path.basename(commonRuleFile),
									description: `通用规则: ${ruleId}`,
									source: 'common'
								});
								console.log(`[DEBUG] 读取通用规则文件: ${commonRuleFile}`);
							}
							const commonRuleDir = path.join(builtInRulesPath, 'common', ruleId);
							if (fs.existsSync(commonRuleDir) && fs.statSync(commonRuleDir).isDirectory()) {
								const mdcFiles = fs.readdirSync(commonRuleDir).filter(f => f.endsWith('.mdc'));
								for (const file of mdcFiles) {
									const filePath = path.join(commonRuleDir, file);
									const content = fs.readFileSync(filePath, 'utf8');
									filesWithContent.push({
										path: filePath.replace(builtInRulesPath, 'resources/rules'),
										content,
										name: path.basename(file),
										description: `通用规则: ${file}`,
										source: 'common'
									});
									console.log(`[DEBUG] 读取通用规则目录文件: ${filePath}`);
								}
							}

							// 日志显示找到的文件总数和大小
							const totalSize = filesWithContent.reduce((sum, file) => sum + file.content.length, 0);
							console.log(`[DEBUG] 为规则${ruleId}找到${filesWithContent.length}个文件，总大小: ${totalSize}字节`);

							const responseToSend = {
								type: 'ruleFiles',
								id: message.id,
								ruleId: ruleId,
								files: filesWithContent.map(file => ({
									...file,
									content: file.content.length > 1000000 ? file.content.substring(0, 1000000) + '...[内容过长，已截断]' : file.content
								}))
							};

							this._view?.webview.postMessage(responseToSend);

							const totalTime = Date.now() - startTime;
							console.log(`[DEBUG] 处理getRuleFiles完成，耗时: ${totalTime}ms`);
							return;
						} catch (err) {
							console.error('[ERROR ConfigPanelViewProvider] 处理getRuleFiles请求时出错:', err);
							this._view?.webview.postMessage({ 
								type: 'ruleFiles', 
								id: message.id,
								error: '获取规则文件时出错',
								errorDetails: err?.toString() || '未知错误'
							});
						}
						break;
					
					case 'createTemplate':
						try {
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
						} catch (error) {
							console.error('创建模板时出错:', error);
							vscode.window.showErrorMessage('创建模板失败，请重试。');
						}
						break;
						
					case 'detectTechStack':
						try {
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
							const techStackInfo = await detectTechStack(workspaceFolder);
							
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

	private _getBuiltInRulesPath(): string {
		return path.join(this._extensionUri.fsPath, 'resources', 'rules');
	}
} 