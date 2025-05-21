/**
 * 临时的 rulesRepository 模块
 * 
 * 提供基础实现以解决编译错误
 * 注意：这只是为了编译通过，实际功能需要后续开发
 */
import * as vscode from 'vscode';

// 规则元数据类型
export interface RuleMetadata {
    id: string;
    name: string;
    description: string;
    techStack?: {
        languages?: string[];
        frameworks?: string[];
    };
}

// 完整规则类型
export interface Rule extends RuleMetadata {
    content: string;
    isBuiltIn?: boolean;
}

/**
 * 获取可用的规则列表
 * 
 * @returns 规则元数据数组
 */
export async function fetchAvailableRules(): Promise<RuleMetadata[]> {
    // 临时实现：返回空数组
    return [];
}

/**
 * 获取规则的完整内容
 * 
 * @param rule 规则元数据
 * @returns 完整的规则对象
 */
export async function fetchRuleContent(rule: RuleMetadata): Promise<Rule> {
    // 临时实现：返回带空内容的规则
    return {
        ...rule,
        content: `# ${rule.name}\n\n暂无内容`
    };
}

/**
 * 将规则应用到工作区
 * 
 * @param rule 要应用的规则
 * @param workspaceFolder 目标工作区
 * @returns 是否成功
 */
export async function applyRuleToWorkspace(rule: Rule, workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
    // 临时实现：显示消息并返回成功
    vscode.window.showInformationMessage(`将来会应用规则: ${rule.name}`);
    return true;
}

/**
 * 获取适用于特定技术栈的规则
 * 
 * @param techStack 技术栈信息
 * @param options 选项
 * @returns 匹配的规则列表
 */
export async function getRulesForTechStack(
    techStack: any, 
    options: { 
        limit?: number; 
        includeBuiltIn?: boolean; 
        includeRemote?: boolean; 
        minScore?: number; 
    }
): Promise<Rule[]> {
    // 临时实现：返回空数组
    return [];
} 