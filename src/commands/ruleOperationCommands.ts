import * as vscode from 'vscode';
import { autoConfigureCursorRules } from '../cursorRules/manager';
import { detectProjectTechStack, getTechStackDescription } from '../techStack';
import { info, error } from '../logger/logger';

/**
 * Register create Cursor Rules command
 */
export const createCursorRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.createCursorRules', async () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
		return;
	}
	
	// If there are multiple workspaces, let user choose
	let workspaceFolder: vscode.WorkspaceFolder;
	if (workspaceFolders.length === 1) {
		workspaceFolder = workspaceFolders[0];
	} else {
		const selected = await vscode.window.showQuickPick(
			workspaceFolders.map(folder => ({ label: folder.name, folder })),
			{ placeHolder: '选择要为其配置 Cursor Rules 的工作区' }
		);
		
		if (!selected) {
			return;
		}
		
		workspaceFolder = selected.folder;
	}
	
	await autoConfigureCursorRules(workspaceFolder);
});

/**
 * Register tech stack detection command
 */
export const detectTechStackCommand = vscode.commands.registerCommand('cursor-rules-assistant.detectTechStack', async () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
		return;
	}
	
	// If there are multiple workspaces, let user choose
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
	
	// Show progress bar
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			const techStackDesc = getTechStackDescription(techStackInfo);
			
			// Show tech stack information
			vscode.window.showInformationMessage(`检测到项目技术栈: ${techStackDesc}`);
			
			return techStackInfo;
		} catch (error) {
			console.error('检测技术栈时出错:', error);
			vscode.window.showErrorMessage('检测技术栈失败，请重试');
		}
	});
});

/**
 * Register browse Cursor Rules command
 */
export const browseRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.browseRules', async () => {
	// Show message about unimplemented feature
	vscode.window.showInformationMessage('浏览规则功能尚未实现，将在未来版本中提供');
});

/**
 * Register recommend rules based on tech stack command
 */
export const recommendRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.recommendRules', async () => {
	// Show message about unimplemented feature
	vscode.window.showInformationMessage('规则推荐功能尚未实现，将在未来版本中提供');
}); 