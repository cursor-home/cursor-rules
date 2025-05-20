import * as vscode from 'vscode';

/**
 * Cursor Rules检查结果接口
 */
export interface CursorRulesCheckResult {
	exists: boolean;
	paths: string[];
}

/**
 * 弹窗选项枚举
 */
export enum CursorRulesPromptChoice {
	AutoConfigure = '自动配置',
	ManualConfigure = '手动配置',
	SkipNow = '暂不配置',
	NeverAskAgain = '此项目不再提示'
}

/**
 * 规则模板接口
 */
export interface RuleTemplate {
	id: string;
	name: string;
	description: string;
	content: string;
} 