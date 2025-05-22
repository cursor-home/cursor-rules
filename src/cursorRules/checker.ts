/**
 * checker.ts
 * 
 * Cursor Rules checker module, responsible for checking if Cursor Rules configuration exists in the workspace,
 * and handling related user prompts and choices.
 * 
 * Main functions:
 * 1. Check if Cursor Rules configuration files or directories exist in the workspace
 * 2. Manage user responses to Cursor Rules prompts
 * 3. Save user preferences, such as "don't ask again" options
 * 4. Display configuration prompt dialogs
 * 
 * Workflow:
 * 1. When a user opens a project, the system checks if Cursor Rules is configured
 * 2. If not configured, check if the user has selected "don't ask again"
 * 3. If "don't ask again" is not selected, display configuration prompt to the user
 * 4. Based on user's choice, perform corresponding configuration operations or remember user preference
 * 
 * Module dependencies:
 * - vscode: Access VS Code API, such as dialogs, workspaces, etc.
 * - path, fs: File system operations
 * - types: Reference related type definitions
 * - logger: Record log information
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CursorRulesCheckResult, CursorRulesPromptChoice } from '../types';
import { debug, info, warn, error } from '../logger/logger';

/**
 * Check if Cursor Rules exists in the workspace
 * 
 * Scan the file system of the specified workspace to find Cursor Rules related directories or files
 * Supports detection of two formats:
 * 1. New format: .cursor/rules/ directory
 * 2. Legacy format: .cursorrules file
 * 
 * How it works:
 * 1. Check if .cursor/rules directory exists in workspace root (new format)
 * 2. Check if .cursorrules file exists in workspace root (legacy format)
 * 3. If either format is found, Cursor Rules is considered to exist
 * 4. Return check result including existence status and list of found paths
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - Workspace folder object to check
 * @returns {Promise<CursorRulesCheckResult>} Object containing check results, including whether rules exist and path list
 * 
 * @throws May throw I/O related errors if file system operations fail
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   const result = await checkCursorRules(workspaceFolder);
 *   
 *   if (result.exists) {
 *     // Cursor Rules exists
 *     console.log('Found Cursor Rules, paths:', result.paths);
 *   } else {
 *     // Cursor Rules doesn't exist, can show prompt
 *     const choice = await showCursorRulesPrompt(workspaceFolder);
 *     // Handle user choice...
 *   }
 * }
 * ```
 * 
 * Return data example:
 * ```typescript
 * // When rules exist
 * {
 *   exists: true,
 *   paths: ['/workspace/.cursor/rules']
 * }
 * 
 * // When rules don't exist
 * {
 *   exists: false,
 *   paths: []
 * }
 * ```
 */
export async function checkCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<CursorRulesCheckResult> {
	const result: CursorRulesCheckResult = {
		exists: false,
		paths: [],
		details: {
			newFormat: false,
			legacyFormat: false
		}
	};
	
	if (!workspaceFolder) {
		warn('Check Cursor Rules: No workspace provided');
		return result;
	}
	
	const rootPath = workspaceFolder.uri.fsPath;
	debug(`Check Cursor Rules: Workspace path ${rootPath}`);
	
	// Check .cursor/rules directory (new format)
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	if (fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory()) {
		debug(`Detected rules directory: ${rulesDir}`);
		result.exists = true;
		result.paths.push(rulesDir);
		result.details!.newFormat = true;
		result.details!.newFormatPath = rulesDir;
	}
	
	// Check .cursorrules file (legacy format)
	const legacyRulesFile = path.join(rootPath, '.cursorrules');
	if (fs.existsSync(legacyRulesFile) && fs.statSync(legacyRulesFile).isFile()) {
		debug(`Detected legacy rules file: ${legacyRulesFile}`);
		result.exists = true;
		result.paths.push(legacyRulesFile);
		result.details!.legacyFormat = true;
		result.details!.legacyFormatPath = legacyRulesFile;
	}
	
	// Set version information
	if (result.details!.newFormat && result.details!.legacyFormat) {
		result.version = 'both';
	} else if (result.details!.newFormat) {
		result.version = 'new';
	} else if (result.details!.legacyFormat) {
		result.version = 'legacy';
	}
	
	if (result.exists) {
		info(`Workspace ${workspaceFolder.name} has Cursor Rules: ${result.paths.join(', ')} (version: ${result.version})`);
	} else {
		info(`Workspace ${workspaceFolder.name} has no Cursor Rules`);
	}
	
	return result;
}

/**
 * Create workspace unique ID
 * 
 * Generate a unique identifier based on workspace URI, used to track user configuration choices for specific workspaces in global state
 * 
 * How it works:
 * Uses the workspace URI as a unique identifier. The URI contains complete path and protocol information,
 * ensuring that the same project is recognized as the same workspace even if opened on different devices or locations
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - Workspace folder object
 * @returns {string} Unique identifier for the workspace
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // Get workspace unique ID
 *   const workspaceId = getWorkspaceFolderId(workspaceFolder);
 *   console.log(`Workspace ID: ${workspaceId}`);
 *   
 *   // Use this ID to store or retrieve data in global state
 *   const storedData = context.globalState.get<string[]>(`someData.${workspaceId}`);
 * }
 * ```
 * 
 * Return data example:
 * "file:///c%3A/users/username/projects/myproject"
 */
export function getWorkspaceFolderId(workspaceFolder: vscode.WorkspaceFolder): string {
	return workspaceFolder.uri.toString();
}

/**
 * Check if prompt should be shown for workspace
 * 
 * Determine if Cursor Rules configuration prompt should be displayed based on user's previous choices
 * If the user previously chose "don't ask again", returns false
 * 
 * How it works:
 * 1. Get the workspace's unique ID
 * 2. Read the "don't ask again" list from extension global state
 * 3. Check if workspace ID is in the list
 * 4. If in the list, user chose not to be prompted again, return false
 * 5. If not in the list, prompt should be shown, return true
 * 
 * @param {vscode.ExtensionContext} context - Extension context object, used to access global state
 * @param {vscode.WorkspaceFolder} workspaceFolder - Workspace folder object to check
 * @returns {boolean} Whether configuration prompt should be displayed
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // Check if prompt should be shown
 *   const shouldPrompt = shouldShowPrompt(context, workspaceFolder);
 *   
 *   if (shouldPrompt) {
 *     // Show configuration prompt
 *     const choice = await showCursorRulesPrompt(workspaceFolder);
 *     // Handle user choice...
 *     
 *     if (choice === CursorRulesPromptChoice.NeverAskAgain) {
 *       // Save "don't ask again" choice
 *       saveNeverAskAgain(context, workspaceFolder);
 *     }
 *   } else {
 *     console.log('User previously chose not to be prompted');
 *   }
 * }
 * ```
 */
export function shouldShowPrompt(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): boolean {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	const shouldShow = !neverAskList.includes(workspaceId);
	
	debug(`Workspace ${workspaceFolder.name} should show prompt: ${shouldShow}`);
	return shouldShow;
}

/**
 * Remember user choice not to show prompt
 * 
 * Add workspace ID to "don't ask again" list and save in extension global state
 * This way, the prompt will not be shown for that workspace in the future
 * 
 * How it works:
 * 1. Get the workspace's unique ID
 * 2. Read the "don't ask again" list from extension global state
 * 3. If workspace ID is not in the list, add it to the list
 * 4. Update extension global state, save updated list
 * 
 * @param {vscode.ExtensionContext} context - Extension context object, used to access global state
 * @param {vscode.WorkspaceFolder} workspaceFolder - Workspace folder object
 * @returns {void} No return value
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // User chose "don't ask again" option
 *   if (userChoice === CursorRulesPromptChoice.NeverAskAgain) {
 *     // Save this choice
 *     saveNeverAskAgain(context, workspaceFolder);
 *     console.log(`Workspace ${workspaceFolder.name} added to never ask again list`);
 *   }
 * }
 * ```
 * 
 * Global state data structure:
 * ```typescript
 * // context.globalState data example
 * {
 *   "cursorRules.neverAsk": [
 *     "file:///c%3A/users/username/projects/project1",
 *     "file:///c%3A/users/username/projects/project2"
 *   ]
 * }
 * ```
 */
export function saveNeverAskAgain(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): void {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	
	if (!neverAskList.includes(workspaceId)) {
		info(`Workspace ${workspaceFolder.name} added to never ask again list`);
		neverAskList.push(workspaceId);
		context.globalState.update('cursorRules.neverAsk', neverAskList);
	}
}

/**
 * 显示Cursor Rules配置提示
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 工作区文件夹
 * @returns {Promise<string|undefined>} 用户的选择
 */
export async function showCursorRulesPrompt(workspaceFolder: vscode.WorkspaceFolder): Promise<string | undefined> {
	const { CursorRulesPromptChoice } = await import('../types');
	
	info(`显示规则配置提示给工作区: ${workspaceFolder.name}`);
	
	// 获取扩展URI
	const extension = vscode.extensions.getExtension('cursor-rules-assistant');
	if (!extension) {
		error('无法获取扩展URI');
		return undefined;
	}
	
	// 创建并显示WebView面板
	const { RulePromptPanel } = await import('../webview/rulePromptPanel');
	RulePromptPanel.createOrShow(extension.extensionUri);
	
	// 返回一个Promise，等待用户选择
	return new Promise((resolve) => {
		// 监听来自WebView的消息
		const disposable = vscode.window.onDidChangeActiveTextEditor(() => {
			// 当用户切换到其他编辑器时，认为用户选择了"稍后再说"
			disposable.dispose();
			resolve(CursorRulesPromptChoice.SkipNow);
		});
		
		// 监听WebView面板的关闭事件
		const panelDisposable = vscode.window.onDidChangeWindowState(() => {
			if (!vscode.window.state.focused) {
				// 当窗口失去焦点时，认为用户选择了"稍后再说"
				panelDisposable.dispose();
				disposable.dispose();
				resolve(CursorRulesPromptChoice.SkipNow);
			}
		});
	});
} 