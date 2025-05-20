import * as vscode from 'vscode';
import { autoConfigureCursorRules } from '../cursorRules/manager';
import { detectProjectTechStack, getTechStackDescription } from '../techStack';
import { showWelcomePage } from '../webview/welcome';

/**
 * 注册打开配置面板命令
 */
export const openConfigCommand = vscode.commands.registerCommand('cursor-rules-assistant.openConfig', () => {
	vscode.commands.executeCommand('workbench.view.extension.cursor-rules-assistant-view');
});

/**
 * 注册打开欢迎页面命令
 */
export const openWelcomePageCommand = vscode.commands.registerCommand('cursor-rules-assistant.openWelcomePage', (context: vscode.ExtensionContext) => {
	showWelcomePage(context);
});

/**
 * 注册创建Cursor Rules命令
 */
export const createCursorRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.createCursorRules', async () => {
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

/**
 * 注册技术栈检测命令
 */
export const detectTechStackCommand = vscode.commands.registerCommand('cursor-rules-assistant.detectTechStack', async () => {
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