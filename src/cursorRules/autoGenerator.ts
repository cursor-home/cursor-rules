/**
 * autoGenerator.ts
 * 
 * Cursor Rules自动生成器模块，负责自动分析项目技术栈并生成适合的规则
 * 
 * 主要功能：
 * 1. 根据项目技术栈自动选择和应用合适的规则
 * 2. 将规则应用到工作区
 * 3. 根据模板创建规则文件
 * 
 * 使用场景：
 * - 在新项目初始化时自动生成Cursor Rules
 * - 用户通过命令手动触发自动生成
 * - 根据项目技术栈推荐和应用最适合的规则
 * 
 * 文件结构：
 * - applyRuleToWorkspace: 将规则应用到工作区的核心函数
 * - createRuleFromTemplate: 根据模板创建规则文件
 * - autoConfigureCursorRules: 自动配置流程入口
 * - getDefaultRuleForTechStack: 获取适合特定技术栈的默认规则
 * - getBasicRule: 获取基础规则
 * 
 * @module cursorRules/autoGenerator
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { Rule, TechStackInfo, createEmptyTechStackInfo, RuleMatchResult } from '../types';
import { detectTechStack, getTechStackDescription } from '../techStack';
import { builtInRuleManager } from './builtInRuleManager';
import { debug, info, warn, error } from '../logger/logger';
import { UserRuleStorageManager } from './userRuleStorageManager';
import { writeFileContent, ensureDirectoryStructure } from '../utils/fsUtils';

/**
 * 应用规则到工作区
 * 
 * 将指定的规则应用到工作区，创建必要的目录结构并写入规则内容。
 * 此函数会在工作区的.cursor/rules目录下创建一个以规则ID命名的.mdc文件，
 * 并自动打开该文件供用户查看和编辑。
 * 
 * @param {Rule} rule - 要应用的规则对象
 * @param {vscode.WorkspaceFolder} workspaceFolder - 目标工作区文件夹对象
 * @returns {Promise<boolean>} 应用成功返回true，失败返回false
 */
export async function applyRuleToWorkspace(rule: Rule, workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
	try {
		const rootPath = workspaceFolder.uri;
		
		// 创建.cursor/rules目录结构（如果不存在）
		const { uri: rulesDir, success } = await ensureDirectoryStructure(rootPath, ['.cursor', 'rules']);
		if (!success) {
			throw new Error('创建规则目录结构失败');
		}
		
		// 创建规则文件，使用规则ID作为文件名
		const rulePath = vscode.Uri.joinPath(rulesDir, `${rule.id}.mdc`);
		
		// 使用工具函数写入文件
		const writeSuccess = await writeFileContent(rulePath, rule.content);
		if (!writeSuccess) {
			throw new Error(`写入规则文件失败: ${rulePath.fsPath}`);
		}
		
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
 * @param {Rule} template - 要应用的规则模板对象
 * @returns {Promise<void>} 无返回值的Promise
 */
export async function createRuleFromTemplate(workspaceFolder: vscode.WorkspaceFolder, template: Rule): Promise<void> {
	const rootPath = workspaceFolder.uri;
	
	// 创建.cursor/rules目录结构（如果不存在）
	const { uri: rulesDir, success } = await ensureDirectoryStructure(rootPath, ['.cursor', 'rules']);
	if (!success) {
		throw new Error('创建规则目录结构失败');
	}
	
	// 创建规则文件，使用模板ID作为文件名
	const rulePath = vscode.Uri.joinPath(rulesDir, `${template.id}.mdc`);
	
	// 使用工具函数写入文件
	const writeSuccess = await writeFileContent(rulePath, template.content);
	if (!writeSuccess) {
		throw new Error(`创建规则文件失败: ${rulePath.fsPath}`);
	}
	
	// 尝试打开创建的文件以便用户查看和编辑
	const document = await vscode.workspace.openTextDocument(rulePath);
	await vscode.window.showTextDocument(document);
	
	// 显示成功通知
	vscode.window.showInformationMessage(`已成功创建${template.name}规则，您可以根据需要进行修改。`);
}

/**
 * 获取适合特定技术栈的默认规则
 * 
 * 根据技术栈信息选择最合适的基础规则模板
 * 如果没有找到匹配规则，返回通用的基础规则
 * 
 * @param {TechStackInfo} techStack - 技术栈信息
 * @returns {Promise<Rule>} 默认规则对象
 */
async function getDefaultRuleForTechStack(techStack: TechStackInfo): Promise<Rule> {
	// 尝试使用技术栈特征构建查询条件
	let query: TechStackInfo;
	
	// 如果检测到TypeScript和React，查找TypeScript+React规则
	if (techStack.languages.includes('TypeScript') && techStack.frameworks.includes('React')) {
		query = {
			...createEmptyTechStackInfo(),
			languages: ['TypeScript'],
			frameworks: ['React'],
			confidence: 1.0
		};
	} 
	// 如果只检测到TypeScript，查找TypeScript规则
	else if (techStack.languages.includes('TypeScript')) {
		query = {
			...createEmptyTechStackInfo(),
			languages: ['TypeScript'],
			confidence: 1.0
		};
	}
	// 如果只检测到React，查找React规则
	else if (techStack.frameworks.includes('React')) {
		query = {
			...createEmptyTechStackInfo(),
			frameworks: ['React'],
			confidence: 1.0
		};
	}
	// 默认使用通用查询
	else {
		query = {
			...createEmptyTechStackInfo(),
			confidence: 1.0
		};
	}
	
	// 查找匹配的规则
	const rule = await builtInRuleManager.getBestRuleForTechStack(query, {
		includeBuiltIn: true,
		minScore: 0.4
	});
	
	// 如果找不到规则，构造一个基础规则
	if (!rule) {
		return await getBasicRule();
	}
	
	return rule;
}

/**
 * 获取基础规则
 * 
 * 尝试从规则库获取id为'basic'的基础规则
 * 如果找不到，则返回硬编码的基础规则
 * 
 * @returns {Promise<Rule>} 基础规则对象
 */
async function getBasicRule(): Promise<Rule> {
	try {
		// 尝试从元数据中获取id为'basic'的规则
		const ruleMetadata = await builtInRuleManager.getRuleMetadataById('basic');
		if (ruleMetadata) {
			const content = await ruleMetadata.readContent();
			if (content) {
				return {
					...ruleMetadata,
					content
				};
			}
		}
	} catch (err) {
		error('获取基础规则失败:', err);
	}
	
	// 回退到硬编码的基础规则
	const basicRule: Rule = {
		id: 'basic',
		name: '基础规则',
		description: '适用于所有项目的通用规则',
		content: `---
description: 通用项目规则
---
# 通用编码规范

## 代码风格
- 使用一致的缩进和格式
- 变量命名采用驼峰命名法
- 避免过长的函数和嵌套层级
- 总是添加适当的注释

## 安全规则
- 避免硬编码密钥或敏感信息
- 确保正确处理用户输入
- 使用安全的API调用方式

## 项目特定规则
- 在此添加项目特有的规则和惯例
`,
		readContent: async () => basicRule.content
	};
	
	return basicRule;
}

/**
 * 自动配置Cursor Rules
 * 
 * 分析项目技术栈，并基于检测结果自动应用最合适的规则。
 * 该函数会显示进度通知，并在过程中向用户提供反馈。
 * 如果检测到合适的规则，会询问用户是否使用推荐规则。
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要配置的工作区文件夹对象
 * @returns {Promise<void>} 无返回值的Promise
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
			const techStackInfo = await detectTechStack(workspaceFolder);
			const techStackDesc = getTechStackDescription(techStackInfo);
			
			// 如果检测结果置信度足够高（>0.5），显示检测到的技术栈信息
			if (techStackInfo.confidence > 0.5) {
				vscode.window.showInformationMessage(`检测到项目技术栈: ${techStackDesc}`);
			}
			
			// 更新进度通知，开始搜索匹配规则
			progress.report({ message: "正在搜索匹配的规则..." });

			// 尝试从规则仓库获取最佳匹配的规则，设置0.4的最小匹配分数作为阈值
			let matchResults: RuleMatchResult[] = [];
			try {
				matchResults = await builtInRuleManager.findMatchingRules(techStackInfo, {
					includeBuiltIn: true,   // 包括内置规则
					includeLocal: true,     // 包括本地规则
					minScore: 0.4,          // 最小匹配分数
					limit: 1                // 仅获取最佳匹配
				});
			} catch (err) {
				error('搜索匹配规则失败:', err);
				// 错误处理后继续执行，使用空数组
				matchResults = [];
			}
			
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
			
			// 如果没有找到匹配规则或者用户选择不使用，回退到默认规则逻辑
			progress.report({ message: "正在查找适合的基础规则..." });
			
			// 获取适合当前技术栈的默认规则
			const defaultRule = await getDefaultRuleForTechStack(techStackInfo);
			
			// 使用默认规则创建规则文件
			await createRuleFromTemplate(workspaceFolder, defaultRule);
			
			return techStackInfo; // 返回检测到的技术栈信息
		} catch (err) {
			error('检测技术栈时出错:', err);
			
			// 出错时回退到基础规则
			const basicRule = await getBasicRule();
			
			// 使用基础规则创建规则文件
			await createRuleFromTemplate(workspaceFolder, basicRule);
		}
	});
} 