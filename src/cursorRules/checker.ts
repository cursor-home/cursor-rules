/**
 * checker.ts
 * 
 * Cursor Rules检查器模块，负责检查工作区是否存在Cursor Rules配置，
 * 并处理相关的用户提示和选择。
 * 
 * 主要功能：
 * 1. 检查工作区是否存在Cursor Rules配置文件或目录
 * 2. 管理用户对Cursor Rules提示的响应选择
 * 3. 保存用户偏好设置，如"不再询问"等选项
 * 4. 显示配置提示对话框
 * 
 * 工作流程：
 * 1. 当用户打开项目时，系统会检查该项目是否已配置Cursor Rules
 * 2. 如果未配置，检查用户是否选择了"不再询问"
 * 3. 如果未选择"不再询问"，显示配置提示给用户
 * 4. 根据用户的选择，执行相应的配置操作或记住用户偏好
 * 
 * 模块依赖：
 * - vscode：访问VS Code API，如对话框、工作区等
 * - path、fs：文件系统操作
 * - types：引用相关的类型定义
 * - logger：记录日志信息
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CursorRulesCheckResult, CursorRulesPromptChoice } from '../types';
import { debug, info, warn, error } from '../logger/logger';

/**
 * 检查工作区是否存在Cursor Rules
 * 
 * 扫描指定工作区的文件系统，查找Cursor Rules相关的目录或文件
 * 支持检测两种格式：
 * 1. 新格式: .cursor/rules/ 目录
 * 2. 旧格式: .cursorrules 文件
 * 
 * 工作原理：
 * 1. 检查工作区根目录是否存在.cursor/rules目录（新格式）
 * 2. 检查工作区根目录是否存在.cursorrules文件（旧格式）
 * 3. 如果找到任意一种格式，则认为存在Cursor Rules
 * 4. 返回检查结果，包括存在状态和找到的路径列表
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要检查的工作区文件夹对象
 * @returns {Promise<CursorRulesCheckResult>} 包含检查结果的对象，包括是否存在rules和路径列表
 * 
 * @throws 如果文件系统操作失败，可能抛出I/O相关错误
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   const result = await checkCursorRules(workspaceFolder);
 *   
 *   if (result.exists) {
 *     // 存在Cursor Rules
 *     console.log('找到Cursor Rules，路径：', result.paths);
 *   } else {
 *     // 不存在Cursor Rules，可以显示提示
 *     const choice = await showCursorRulesPrompt(workspaceFolder);
 *     // 处理用户选择...
 *   }
 * }
 * ```
 * 
 * 返回数据样例：
 * ```typescript
 * // 存在规则的情况
 * {
 *   exists: true,
 *   paths: ['/workspace/.cursor/rules']
 * }
 * 
 * // 不存在规则的情况
 * {
 *   exists: false,
 *   paths: []
 * }
 * ```
 */
export async function checkCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<CursorRulesCheckResult> {
	const result: CursorRulesCheckResult = {
		exists: false,
		paths: []
	};
	
	if (!workspaceFolder) {
		warn('检查Cursor Rules: 没有提供工作区');
		return result;
	}
	
	const rootPath = workspaceFolder.uri.fsPath;
	debug(`检查Cursor Rules: 工作区路径 ${rootPath}`);
	
	// 检查 .cursor/rules 目录（新格式）
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	if (fs.existsSync(rulesDir) && fs.statSync(rulesDir).isDirectory()) {
		debug(`检测到规则目录: ${rulesDir}`);
		result.exists = true;
		result.paths.push(rulesDir);
	}
	
	// 检查 .cursorrules 文件（旧版本格式）
	const legacyRulesFile = path.join(rootPath, '.cursorrules');
	if (fs.existsSync(legacyRulesFile) && fs.statSync(legacyRulesFile).isFile()) {
		debug(`检测到旧版本规则文件: ${legacyRulesFile}`);
		result.exists = true;
		result.paths.push(legacyRulesFile);
	}
	
	if (result.exists) {
		info(`工作区 ${workspaceFolder.name} 存在Cursor Rules: ${result.paths.join(', ')}`);
	} else {
		info(`工作区 ${workspaceFolder.name} 不存在Cursor Rules`);
	}
	
	return result;
}

/**
 * 创建工作区唯一ID
 * 
 * 基于工作区URI生成唯一标识符，用于在全局状态中跟踪用户对特定工作区的配置选择
 * 
 * 工作原理：
 * 使用工作区的URI作为唯一标识符，URI包含了工作区的完整路径和协议信息，
 * 确保即使在不同设备或位置打开同一项目，也能识别为同一工作区
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 工作区文件夹对象
 * @returns {string} 工作区的唯一标识符
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // 获取工作区的唯一ID
 *   const workspaceId = getWorkspaceFolderId(workspaceFolder);
 *   console.log(`工作区ID: ${workspaceId}`);
 *   
 *   // 使用这个ID在全局状态中存储或检索数据
 *   const storedData = context.globalState.get<string[]>(`someData.${workspaceId}`);
 * }
 * ```
 * 
 * 返回数据示例：
 * "file:///c%3A/users/username/projects/myproject"
 */
export function getWorkspaceFolderId(workspaceFolder: vscode.WorkspaceFolder): string {
	return workspaceFolder.uri.toString();
}

/**
 * 检查是否应该为工作区显示提示
 * 
 * 根据用户之前的选择确定是否应该显示Cursor Rules配置提示
 * 如果用户之前选择了"不再提示"，则返回false
 * 
 * 工作原理：
 * 1. 获取工作区的唯一ID
 * 2. 从扩展全局状态中读取"不再询问"列表
 * 3. 检查工作区ID是否在列表中
 * 4. 如果在列表中，表示用户选择了不再提示，返回false
 * 5. 如果不在列表中，表示应该显示提示，返回true
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象，用于访问全局状态
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要检查的工作区文件夹对象
 * @returns {boolean} 是否应该显示配置提示
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // 检查是否应该显示提示
 *   const shouldPrompt = shouldShowPrompt(context, workspaceFolder);
 *   
 *   if (shouldPrompt) {
 *     // 显示配置提示
 *     const choice = await showCursorRulesPrompt(workspaceFolder);
 *     // 处理用户选择...
 *     
 *     if (choice === CursorRulesPromptChoice.NeverAskAgain) {
 *       // 保存"不再提示"的选择
 *       saveNeverAskAgain(context, workspaceFolder);
 *     }
 *   } else {
 *     console.log('用户之前选择了不再提示');
 *   }
 * }
 * ```
 */
export function shouldShowPrompt(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder): boolean {
	const workspaceId = getWorkspaceFolderId(workspaceFolder);
	const neverAskList = context.globalState.get<string[]>('cursorRules.neverAsk', []);
	const shouldShow = !neverAskList.includes(workspaceId);
	
	debug(`工作区 ${workspaceFolder.name} 是否应该显示提示: ${shouldShow}`);
	return shouldShow;
}

/**
 * 记住用户选择不再显示提示
 * 
 * 将工作区ID添加到"不再询问"列表中，保存在扩展的全局状态中
 * 这样未来就不会再为该工作区显示Cursor Rules配置提示
 * 
 * 工作原理：
 * 1. 获取工作区的唯一ID
 * 2. 从扩展全局状态中读取"不再询问"列表
 * 3. 如果工作区ID不在列表中，将其添加到列表
 * 4. 更新扩展全局状态，保存更新后的列表
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象，用于访问全局状态
 * @param {vscode.WorkspaceFolder} workspaceFolder - 工作区文件夹对象
 * @returns {void} 无返回值
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // 用户选择了"不再提示"选项
 *   if (userChoice === CursorRulesPromptChoice.NeverAskAgain) {
 *     // 保存这个选择
 *     saveNeverAskAgain(context, workspaceFolder);
 *     console.log(`已将工作区 ${workspaceFolder.name} 添加到不再询问列表`);
 *   }
 * }
 * ```
 * 
 * 全局状态数据结构：
 * ```typescript
 * // context.globalState中的数据示例
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
		info(`将工作区 ${workspaceFolder.name} 添加到不再询问列表`);
		neverAskList.push(workspaceId);
		context.globalState.update('cursorRules.neverAsk', neverAskList);
	}
}

/**
 * 显示Cursor Rules配置提示
 * 
 * 向用户展示一个快速选择对话框，提供Cursor Rules配置的选项
 * 用户可以选择自动配置、手动配置、暂不配置或不再提示
 * 
 * 工作原理：
 * 1. 动态导入CursorRulesPromptChoice枚举类型
 * 2. 创建选项列表，每个选项包括标签和描述
 * 3. 显示QuickPick对话框，让用户选择一个选项
 * 4. 返回用户选择的选项标签，如果用户取消则返回undefined
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 相关的工作区文件夹对象
 * @returns {Promise<string | undefined>} 用户选择的选项文本，如果用户取消则返回undefined
 * 
 * @example
 * ```typescript
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // 检查是否存在Cursor Rules
 *   const checkResult = await checkCursorRules(workspaceFolder);
 *   
 *   if (!checkResult.exists && shouldShowPrompt(context, workspaceFolder)) {
 *     // 显示配置提示
 *     const choice = await showCursorRulesPrompt(workspaceFolder);
 *     
 *     // 处理用户选择
 *     if (choice === CursorRulesPromptChoice.AutoConfigure) {
 *       // 自动配置...
 *       await autoConfigureCursorRules(workspaceFolder);
 *     } else if (choice === CursorRulesPromptChoice.NeverAskAgain) {
 *       // 保存"不再提示"选择
 *       saveNeverAskAgain(context, workspaceFolder);
 *     }
 *   }
 * }
 * ```
 * 
 * 显示给用户的选项：
 * 1. "自动配置" - 自动创建基础Cursor Rules配置
 * 2. "手动配置" - 打开手动配置向导
 * 3. "暂不配置" - 本次跳过，下次仍提示
 * 4. "此项目不再提示" - 记住用户选择，不再为此项目显示提示
 */
export async function showCursorRulesPrompt(workspaceFolder: vscode.WorkspaceFolder): Promise<string | undefined> {
	const { CursorRulesPromptChoice } = await import('../types');
	
	info(`显示Cursor Rules配置提示: ${workspaceFolder.name}`);
	
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
	
	if (selection) {
		debug(`用户选择了: ${selection.label}`);
	} else {
		debug('用户取消了选择');
	}
	
	return selection?.label;
} 