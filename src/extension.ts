// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConfigPanelViewProvider } from './config/configProvider';
import { showWelcomePage } from './webview/welcome';
import { allCommands } from './commands';
import { checkCursorRules, shouldShowPrompt, showCursorRulesPrompt } from './cursorRules/checker';
import { handleCursorRulesChoice } from './cursorRules/manager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	console.log('Cursor Rules Assistant 已激活！');
	
	// 检查是否首次安装或更新
	const extensionVersion = vscode.extensions.getExtension('cursor-rules-assistant')?.packageJSON.version;
	const previousVersion = context.globalState.get<string>('extensionVersion');
	
	// 首次安装时或版本变更时显示欢迎信息
	if (!previousVersion) {
		// 首次安装
		vscode.window.showInformationMessage(
			'Cursor Rules Assistant 安装成功！是否要查看入门指南？',
			'查看指南', '以后再说'
		).then(selection => {
			if (selection === '查看指南') {
				// 显示欢迎页面
				showWelcomePage(context);
			}
		});
	} else if (previousVersion !== extensionVersion) {
		// 版本更新
		vscode.window.showInformationMessage(
			`Cursor Rules Assistant 已更新到 v${extensionVersion}！查看新特性？`,
			'查看更新', '忽略'
		).then(selection => {
			if (selection === '查看更新') {
				// 显示欢迎页面，但聚焦于更新内容
				showWelcomePage(context);
			}
		});
	}
	
	// 保存当前版本号
	context.globalState.update('extensionVersion', extensionVersion);
	
	// 注册配置面板提供者
	const configPanelProvider = new ConfigPanelViewProvider(context.extensionUri, context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ConfigPanelViewProvider.viewType,
			configPanelProvider
		)
	);
	
	// 注册所有命令
	context.subscriptions.push(...allCommands);
	
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
