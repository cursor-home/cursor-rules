/**
 * manager.ts
 * 
 * Cursor Rules管理器模块，负责对工作区的Cursor Rules进行创建、配置和应用
 * 这个模块实现了自动配置和手动配置流程，以及用户选择的处理逻辑
 * 
 * 主要功能：
 * 1. 根据模板创建规则文件
 * 2. 自动检测项目技术栈并应用合适的规则
 * 3. 提供手动配置入口
 * 4. 处理用户对配置提示的响应
 * 
 * 使用场景：
 * - 在新项目初始化时自动提示用户配置Cursor Rules
 * - 用户通过命令面板手动配置Cursor Rules
 * - 根据项目技术栈自动推荐最适合的规则
 * - 处理用户对配置提示的各种响应
 * 
 * 文件结构：
 * - applyRuleToWorkspace: 将规则应用到工作区的核心函数
 * - createRuleFromTemplate: 根据模板创建规则文件
 * - autoConfigureCursorRules: 自动配置流程入口
 * - openManualConfiguration: 打开手动配置面板
 * - handleCursorRulesChoice: 处理用户选择的路由函数
 * 
 * @module cursorRules/manager
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CursorRulesPromptChoice, RuleTemplate, Rule, TechStackInfo } from '../types';
import { detectProjectTechStack, getTechStackDescription } from '../techStack';
import { ruleTemplates } from './templates';
import { saveNeverAskAgain } from './checker';
import { 
	getBestRuleForTechStack, 
	recommendRulesForTechStack
} from './metaManager';
import { debug, info, warn, error } from '../logger/logger';

/**
 * 应用规则到工作区
 * 
 * 将指定的规则应用到工作区，创建必要的目录结构并写入规则内容。
 * 此函数会在工作区的.cursor/rules目录下创建一个以规则ID命名的.mdc文件，
 * 并自动打开该文件供用户查看和编辑。
 * 
 * @param {Rule} rule - 要应用的规则对象，包含规则的ID、名称和内容
 *                     (例如: {id: 'typescript', name: 'TypeScript规则', content: '# TypeScript规则...'})
 * @param {vscode.WorkspaceFolder} workspaceFolder - 目标工作区文件夹对象
 * @returns {Promise<boolean>} 应用成功返回true，失败返回false
 * 
 * @throws 可能抛出文件系统相关错误，例如权限不足、磁盘空间不足等
 * 
 * @example
 * ```typescript
 * // 创建一个简单的规则对象
 * const myRule: Rule = {
 *   id: 'my-custom-rule',
 *   name: '我的自定义规则',
 *   description: '这是一个针对我的项目的自定义规则',
 *   content: '# 我的自定义规则\n\n这里是规则内容...',
 *   isBuiltIn: false,
 *   techStack: {
 *     languages: ['JavaScript', 'TypeScript'],
 *     frameworks: ['React']
 *   }
 * };
 * 
 * // 获取当前工作区
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * 
 * // 应用规则到工作区
 * if (workspaceFolder) {
 *   const success = await applyRuleToWorkspace(myRule, workspaceFolder);
 *   
 *   if (success) {
 *     console.log(`已成功应用规则: ${myRule.name}`);
 *   } else {
 *     console.error('应用规则失败');
 *   }
 * }
 * ```
 */
async function applyRuleToWorkspace(rule: Rule, workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
	try {
		const rootPath = workspaceFolder.uri.fsPath;
		const rulesDir = path.join(rootPath, '.cursor', 'rules');
		
		// 创建.cursor/rules目录结构（如果不存在）
		if (!fs.existsSync(path.join(rootPath, '.cursor'))) {
			fs.mkdirSync(path.join(rootPath, '.cursor'));
		}
		
		if (!fs.existsSync(rulesDir)) {
			fs.mkdirSync(rulesDir);
		}
		
		// 创建规则文件，使用规则ID作为文件名
		const rulePath = path.join(rulesDir, `${rule.id}.mdc`);
		fs.writeFileSync(rulePath, rule.content);
		
		// 尝试打开创建的文件以便用户查看和编辑
		const document = await vscode.workspace.openTextDocument(rulePath);
		await vscode.window.showTextDocument(document);
		
		// 记录日志并显示成功通知
		info(`已将规则 ${rule.name} 应用到工作区 ${workspaceFolder.name}`);
		vscode.window.showInformationMessage(`已成功应用"${rule.name}"，您可以根据需要进行修改。`);
		
		return true;
	} catch (err) {
		// 错误处理：记录日志并显示错误通知
		error(`应用规则到工作区失败:`, err);
		vscode.window.showErrorMessage(`应用规则到工作区失败: ${err}`);
		return false;
	}
}

/**
 * 根据模板创建规则文件
 * 
 * 在工作区中创建Cursor Rules目录结构并写入指定模板的规则内容。
 * 完成后打开新创建的规则文件供用户查看和编辑。
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 目标工作区文件夹对象
 * @param {RuleTemplate} template - 要应用的规则模板对象
 *                               (例如: {id: 'typescript', name: 'TypeScript规则', 
 *                                      description: '适用于TypeScript项目', 
 *                                      content: '# TypeScript规则...'})
 * @returns {Promise<void>} 无返回值的Promise
 * 
 * @throws 可能抛出文件系统错误或VS Code API相关错误
 * 
 * @example
 * ```typescript
 * // 获取基础模板
 * const basicTemplate = ruleTemplates.find(t => t.id === 'basic');
 * 
 * // 应用模板到当前工作区
 * if (basicTemplate && vscode.workspace.workspaceFolders?.[0]) {
 *   await createRuleFromTemplate(
 *     vscode.workspace.workspaceFolders[0], 
 *     basicTemplate
 *   );
 *   
 *   console.log(`已创建 ${basicTemplate.name} 规则文件`);
 * }
 * ```
 * 
 * 数据样例：
 * ```typescript
 * // 模板对象样例
 * const templateExample: RuleTemplate = {
 *   id: 'react',
 *   name: 'React项目规则',
 *   description: '适用于React项目的Cursor Rules',
 *   content: `# React项目规则
 * 
 * ## 组件命名规范
 * - 组件文件名使用PascalCase
 * - 组件名称与文件名一致
 * 
 * ## 状态管理
 * - 优先使用React Hooks管理状态
 * - 复杂状态考虑使用Context API或Redux
 * `
 * };
 * ```
 */
export async function createRuleFromTemplate(workspaceFolder: vscode.WorkspaceFolder, template: RuleTemplate): Promise<void> {
	const rootPath = workspaceFolder.uri.fsPath;
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	
	// 创建.cursor/rules目录结构（如果不存在）
	if (!fs.existsSync(path.join(rootPath, '.cursor'))) {
		fs.mkdirSync(path.join(rootPath, '.cursor'));
	}
	
	if (!fs.existsSync(rulesDir)) {
		fs.mkdirSync(rulesDir);
	}
	
	// 创建规则文件，使用模板ID作为文件名
	const rulePath = path.join(rulesDir, `${template.id}.mdc`);
	fs.writeFileSync(rulePath, template.content);
	
	// 尝试打开创建的文件以便用户查看和编辑
	const document = await vscode.workspace.openTextDocument(rulePath);
	await vscode.window.showTextDocument(document);
	
	// 显示成功通知
	vscode.window.showInformationMessage(`已成功创建${template.name}规则，您可以根据需要进行修改。`);
}

/**
 * 自动配置Cursor Rules
 * 
 * 分析项目技术栈，并基于检测结果自动应用最合适的规则。
 * 该函数会显示进度通知，并在过程中向用户提供反馈。
 * 如果检测到合适的规则，会询问用户是否使用推荐规则。
 * 
 * 工作流程:
 * 1. 显示进度通知，开始分析项目技术栈
 * 2. 调用detectProjectTechStack检测项目的编程语言、框架等
 * 3. 显示检测结果，如果置信度足够高
 * 4. 搜索匹配的规则，从最高匹配度开始推荐
 * 5. 询问用户是否接受推荐规则
 * 6. 如果没有找到匹配规则或用户拒绝，回退使用基础模板
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要配置的工作区文件夹对象
 * @returns {Promise<void>} 无返回值的Promise
 * 
 * @throws 可能抛出技术栈检测错误，此时会回退到默认模板
 * 
 * @example
 * ```typescript
 * // 在用户选择自动配置时调用
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * if (workspaceFolder) {
 *   // 显示进度通知
 *   vscode.window.withProgress(
 *     {
 *       location: vscode.ProgressLocation.Notification,
 *       title: "正在配置Cursor Rules..."
 *     },
 *     async () => {
 *       await autoConfigureCursorRules(workspaceFolder);
 *       return null;
 *     }
 *   );
 * }
 * ```
 * 
 * 技术栈数据样例：
 * ```typescript
 * // 技术栈检测结果样例
 * const techStackExample: TechStackInfo = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React', 'Next.js'],
 *   libraries: ['Redux', 'React Router'],
 *   tools: ['Webpack', 'ESLint'],
 *   confidence: 0.85  // 检测置信度（0-1之间）
 * };
 * ```
 */
export async function autoConfigureCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
	// 使用进度通知显示技术栈分析进度
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			// 检测项目技术栈（语言、框架、库、工具等）
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			const techStackDesc = getTechStackDescription(techStackInfo);
			
			// 如果检测结果置信度足够高（>0.5），显示检测到的技术栈信息
			if (techStackInfo.confidence > 0.5) {
				vscode.window.showInformationMessage(`检测到项目技术栈: ${techStackDesc}`);
			}
			
			// 更新进度通知，开始搜索匹配规则
			progress.report({ message: "正在搜索匹配的规则..." });

			// 尝试从规则仓库获取最佳匹配的规则，设置0.4的最小匹配分数作为阈值
			const matchResults = await recommendRulesForTechStack(techStackInfo, {
				includeBuiltIn: true,   // 包括内置规则
				includeLocal: true,     // 包括本地规则
				minScore: 0.4,          // 最小匹配分数
				limit: 1                // 仅获取最佳匹配
			});
			
			// 获取最佳匹配的规则（如果有）
			const bestRule = matchResults.length > 0 ? matchResults[0].rule : null;
			
			if (bestRule) {
				// 询问用户是否使用推荐的规则
				const useRecommended = await vscode.window.showQuickPick(
					['是，使用推荐规则', '否，使用基础模板'],
					{ placeHolder: `推荐将"${bestRule.name}"规则应用到您的项目，是否使用？` }
				);
				
				if (useRecommended === '是，使用推荐规则') {
					// 用户选择使用推荐规则，应用到工作区
					const success = await applyRuleToWorkspace(bestRule, workspaceFolder);
					if (success) {
						return techStackInfo; // 成功应用规则，返回检测到的技术栈信息
					}
				}
				// 如果用户拒绝或应用失败，将继续执行下面的代码，使用基础模板
			}
			
			// 如果没有找到匹配规则或者用户选择不使用，回退到原来的模板逻辑
			progress.report({ message: "正在使用基础模板创建规则..." });
			
			// 根据技术栈选择最合适的模板
			let templateId = 'basic'; // 默认使用基础模板
			
			// 基于检测到的技术栈进行模板选择决策
			// 如果检测到TypeScript，选用TypeScript模板
			if (techStackInfo.languages.includes('TypeScript')) {
				templateId = 'typescript';
				
				// 如果同时检测到React，选用React模板
				if (techStackInfo.frameworks.includes('React')) {
					templateId = 'react';
				}
			} else if (techStackInfo.frameworks.includes('React')) {
				// 如果只检测到React但不是TypeScript，依然使用React模板
				templateId = 'react';
			}
			
			// 获取选定的模板，如果找不到就使用第一个可用模板
			const template = ruleTemplates.find(t => t.id === templateId) || ruleTemplates[0];
			
			// 使用选定的模板创建规则文件
			await createRuleFromTemplate(workspaceFolder, template);
			
			return techStackInfo; // 返回检测到的技术栈信息
		} catch (error) {
			console.error('检测技术栈时出错:', error);
			
			// 出错时回退到默认配置逻辑
			const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
			const defaultTemplateId = config.get<string>('defaultTemplate', 'basic'); // 从用户设置获取默认模板ID
			const template = ruleTemplates.find(t => t.id === defaultTemplateId) || ruleTemplates[0];
			
			// 使用默认模板创建规则文件
			await createRuleFromTemplate(workspaceFolder, template);
		}
	});
}

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
 * 处理用户选择
 * 
 * 根据用户对Cursor Rules配置提示的选择，执行相应的操作。
 * 包括自动配置、手动配置、跳过和不再提示等选项的处理。
 * 
 * 选项处理逻辑：
 * - AutoConfigure：调用自动配置流程
 * - ManualConfigure：打开手动配置面板
 * - NeverAskAgain：保存用户偏好，不再为此工作区显示提示
 * - SkipNow：本次跳过，不做任何操作
 * 
 * @param {string | undefined} choice - 用户选择的选项，来自CursorRulesPromptChoice枚举
 *                                    ("自动配置", "手动配置", "暂不配置", "此项目不再提示")
 * @param {vscode.ExtensionContext} context - 扩展上下文对象，用于访问全局状态
 * @param {vscode.WorkspaceFolder} workspaceFolder - 相关的工作区文件夹对象
 * @returns {Promise<void>} 无返回值的Promise
 * 
 * @example
 * ```typescript
 * // 显示提示并处理用户选择
 * const choice = await showCursorRulesPrompt(workspaceFolder);
 * 
 * if (choice) {
 *   // 处理用户选择
 *   await handleCursorRulesChoice(choice, context, workspaceFolder);
 *   
 *   // 根据不同选择可能会有不同的后续操作
 *   console.log(`用户选择了: ${choice}`);
 * } else {
 *   console.log('用户取消了操作');
 * }
 * ```
 * 
 * 用户选择数据样例：
 * ```typescript
 * // 用户可能的选择值
 * const choices = {
 *   autoConfigure: "自动配置",
 *   manualConfigure: "手动配置",
 *   skipNow: "暂不配置", 
 *   neverAskAgain: "此项目不再提示"
 * };
 * ```
 */
export async function handleCursorRulesChoice(
	choice: string | undefined,
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	// 动态导入CursorRulesPromptChoice枚举，确保类型安全
	const { CursorRulesPromptChoice } = await import('../types');
    
	// 根据用户选择执行不同操作
	switch (choice) {
		case CursorRulesPromptChoice.AutoConfigure:
			// 用户选择自动配置，启动自动检测技术栈和规则匹配流程
			await autoConfigureCursorRules(workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.ManualConfigure:
			// 用户选择手动配置，打开配置面板让用户自行选择规则
			await openManualConfiguration();
			break;
			
		case CursorRulesPromptChoice.NeverAskAgain:
			// 用户选择不再提示，将此工作区ID保存到"不再询问"列表
			await saveNeverAskAgain(context, workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.SkipNow:
		default:
			// 用户选择暂不配置或其他情况，不执行任何操作
			// 下次打开工作区时仍会显示提示
			break;
	}
} 