import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CursorRulesCheckResult } from './types';

/**
 * 检查工作区是否存在Cursor Rules
 * @param workspaceFolder 工作区文件夹
 * @returns 检查结果
 */
export async function checkCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<CursorRulesCheckResult> {
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
export function getWorkspaceFolderId(workspaceFolder: vscode.WorkspaceFolder): string {
	return workspaceFolder.uri.toString();
}

/**
 * 检查是否应该为工作区显示提示
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 * @returns 是否显示提示
 */
export function shouldShowPrompt(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): boolean {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	return !neverAskList.includes(workspaceId);
}

/**
 * 记住用户选择不再显示提示
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 */
export function saveNeverAskAgain(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): void {
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
export async function showCursorRulesPrompt(workspaceFolder: vscode.WorkspaceFolder): Promise<string | undefined> {
	const { CursorRulesPromptChoice } = await import('./types');
	
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
	
	return selection?.label;
} 