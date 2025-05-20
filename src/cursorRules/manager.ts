import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CursorRulesPromptChoice, RuleTemplate } from './types';
import { detectProjectTechStack, getTechStackDescription } from '../techStack';
import { ruleTemplates } from './templates';
import { saveNeverAskAgain } from './checker';

/**
 * 根据模板创建规则文件
 * @param workspaceFolder 工作区文件夹
 * @param template 模板
 */
export async function createRuleFromTemplate(workspaceFolder: vscode.WorkspaceFolder, template: RuleTemplate): Promise<void> {
	const rootPath = workspaceFolder.uri.fsPath;
	const rulesDir = path.join(rootPath, '.cursor', 'rules');
	
	// 创建.cursor/rules目录
	if (!fs.existsSync(path.join(rootPath, '.cursor'))) {
		fs.mkdirSync(path.join(rootPath, '.cursor'));
	}
	
	if (!fs.existsSync(rulesDir)) {
		fs.mkdirSync(rulesDir);
	}
	
	// 创建规则文件
	const rulePath = path.join(rulesDir, `${template.id}.mdc`);
	fs.writeFileSync(rulePath, template.content);
	
	// 尝试打开创建的文件
	const document = await vscode.workspace.openTextDocument(rulePath);
	await vscode.window.showTextDocument(document);
	
	vscode.window.showInformationMessage(`已成功创建${template.name}规则，您可以根据需要进行修改。`);
}

/**
 * 自动配置Cursor Rules
 * @param workspaceFolder 工作区文件夹
 */
export async function autoConfigureCursorRules(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
	// 检测项目技术栈
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			// 检测项目技术栈
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			
			// 根据技术栈选择最合适的模板
			let templateId = 'basic'; // 默认使用基础模板
			
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
			
			// 获取模板
			const template = ruleTemplates.find(t => t.id === templateId) || ruleTemplates[0];
			
			// 显示检测到的技术栈信息
			if (techStackInfo.confidence > 0.5) {
				const techStackDesc = getTechStackDescription(techStackInfo);
				vscode.window.showInformationMessage(`检测到项目技术栈: ${techStackDesc}，将使用${template.name}模板。`);
			}
			
			// 创建规则文件
			await createRuleFromTemplate(workspaceFolder, template);
			
			return techStackInfo;
		} catch (error) {
			console.error('检测技术栈时出错:', error);
			
			// 出错时回退到原来的逻辑
			const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
			const defaultTemplateId = config.get<string>('defaultTemplate', 'basic');
			const template = ruleTemplates.find(t => t.id === defaultTemplateId) || ruleTemplates[0];
			
			await createRuleFromTemplate(workspaceFolder, template);
		}
	});
}

/**
 * 打开手动配置向导
 */
export async function openManualConfiguration(): Promise<void> {
	// 这里可以跳转到配置页面或打开文档
	vscode.commands.executeCommand('workbench.view.extension.cursor-rules-assistant-view');
	vscode.window.showInformationMessage('已打开Cursor Rules配置面板，请按向导进行配置。');
}

/**
 * 处理用户选择
 * @param choice 用户选择
 * @param context 扩展上下文
 * @param workspaceFolder 工作区文件夹
 */
export async function handleCursorRulesChoice(
	choice: string | undefined,
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	const { CursorRulesPromptChoice } = await import('./types');
    
	switch (choice) {
		case CursorRulesPromptChoice.AutoConfigure:
			await autoConfigureCursorRules(workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.ManualConfigure:
			await openManualConfiguration();
			break;
			
		case CursorRulesPromptChoice.NeverAskAgain:
			saveNeverAskAgain(context, workspaceFolder);
			break;
			
		case CursorRulesPromptChoice.SkipNow:
		default:
			// 不执行任何操作
			break;
	}
} 