/**
 * manager.ts
 * 
 * Cursor Rules管理器模块，负责对工作区的Cursor Rules进行创建、配置和应用
 * 这个模块实现了自动配置和手动配置流程，以及用户选择的处理逻辑
 * 
 * 主要功能：
 * 1. 处理用户对配置提示的响应
 * 2. 提供手动配置入口
 * 
 * 使用场景：
 * - 在新项目初始化时自动提示用户配置Cursor Rules
 * - 用户通过命令面板手动配置Cursor Rules
 * - 处理用户对配置提示的各种响应
 * 
 * 文件结构：
 * - openManualConfiguration: 打开手动配置面板
 * - handleCursorRulesChoice: 处理用户选择的路由函数
 * 
 * @module cursorRules/manager
 */
import * as vscode from 'vscode';
import { CursorRulesPromptChoice } from '../types';
import { saveNeverAskAgain } from './checker';
import { info, error } from '../logger/logger';
import { autoConfigureCursorRules } from './autoGenerator';

/**
 * 打开手动配置向导
 * 
 * 打开Cursor Rules配置面板，引导用户进行手动配置。
 * 通过执行扩展视图命令跳转到配置界面，让用户可以手动选择和编辑规则。
 * 
 * @returns {Promise<void>} 无返回值的Promise
 * 
 * @throws 可能抛出VS Code命令执行相关错误
 * 
 * @example
 * ```typescript
 * // 当用户选择手动配置时
 * if (userChoice === CursorRulesPromptChoice.ManualConfigure) {
 *   await openManualConfiguration();
 *   
 *   // 配置面板已经打开，可以进行其他后续操作
 *   console.log('手动配置面板已打开');
 * }
 * ```
 * 
 * 执行流程：
 * 1. 执行VS Code命令打开扩展视图
 * 2. 显示信息通知，提示用户按照向导进行配置
 * 3. 用户在配置面板中可以浏览和选择可用的规则模板
 * 4. 用户可以预览、编辑和应用所选规则
 */
export async function openManualConfiguration(): Promise<void> {
	// 执行VS Code命令，打开Cursor Rules Assistant扩展的视图页面
	// 这个命令在扩展激活时通过registerCommand注册
	vscode.commands.executeCommand('workbench.view.extension.cursor-rules-assistant-view');
	
	// 显示提示信息，告知用户配置面板已打开
	vscode.window.showInformationMessage('已打开Cursor Rules配置面板，请按向导进行配置。');
}

/**
 * 处理用户对Cursor Rules提示的选择
 * 
 * @param {string|undefined} choice - 用户选择的操作
 * @param {vscode.ExtensionContext} context - 扩展上下文
 * @param {vscode.WorkspaceFolder} workspaceFolder - 工作区文件夹
 * @returns {Promise<void>} 无返回值的Promise
 */
export async function handleCursorRulesChoice(
	choice: string | undefined,
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	// 如果用户选择自动配置
	if (choice === '自动配置') {
		try {
			// 执行自动配置逻辑并显示进度提示
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "正在配置Cursor Rules...",
				cancellable: false
			}, async () => {
				// 调用自动配置函数，它已经包含所有必要的提示和逻辑
				await autoConfigureCursorRules(workspaceFolder);
			});
			
			// 显示成功消息，明确说明使用的是新版格式
			vscode.window.showInformationMessage(
				`已为工作区 ${workspaceFolder.name} 自动配置Cursor Rules (新版格式)`
			);
		} catch (err) {
			// 处理错误
			const errorMsg = err instanceof Error ? err.message : String(err);
			error(`自动配置Cursor Rules失败: ${errorMsg}`);
			vscode.window.showErrorMessage(
				`无法为工作区 ${workspaceFolder.name} 自动配置Cursor Rules: ${errorMsg}`
			);
		}
	}
	// 如果用户选择手动配置
	else if (choice === '手动配置') {
		// 打开配置向导
		vscode.window.showInformationMessage(
			`请按照向导为工作区 ${workspaceFolder.name} 手动配置Cursor Rules (推荐新版格式)`
		);
		
		// 打开配置面板或执行命令
		vscode.commands.executeCommand('cursor-rules-assistant.createCursorRules');
	}
	// 如果用户选择不再提示
	else if (choice === '不再提示') {
		// 将此工作区记录为不再提示
		// 获取当前禁用提示的工作区列表
		const disabledPrompts = context.globalState.get<string[]>('disabledPrompts', []);
		// 添加当前工作区ID
		disabledPrompts.push(workspaceFolder.uri.toString());
		// 保存更新后的列表
		await context.globalState.update('disabledPrompts', disabledPrompts);
		
		info(`已将工作区 ${workspaceFolder.name} 添加到禁用提示列表`);
	}
	// 如果用户选择跳过
	else {
		// 本次跳过，不记录，下次仍提示
		info(`用户选择跳过工作区 ${workspaceFolder.name} 的Cursor Rules配置`);
	}
} 