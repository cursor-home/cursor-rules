import * as vscode from 'vscode';
import { autoConfigureCursorRules } from '../cursorRules/manager';

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