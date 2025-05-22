import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { info, error, warn } from '../../logger/logger';
import { configPanelInstance } from '../../webview/configPanel/showConfigPanel';
import { Rule } from '../../types';

/**
 * 获取当前工作区文件夹
 * @returns 当前工作区文件夹或undefined
 */
export function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.workspaceFolders?.[0];
}

/**
 * 获取规则目录路径
 * @param workspaceFolder 工作区文件夹
 * @returns 规则目录的完整路径
 */
export function getRulesDirectoryPath(workspaceFolder: vscode.WorkspaceFolder): string {
    return path.join(workspaceFolder.uri.fsPath, '.cursor', 'rules');
}

/**
 * 确保规则目录存在
 * @param workspaceFolder 工作区文件夹
 * @returns 规则目录的完整路径
 */
export function ensureRulesDirectory(workspaceFolder: vscode.WorkspaceFolder): string {
    const cursorDir = path.join(workspaceFolder.uri.fsPath, '.cursor');
    if (!fs.existsSync(cursorDir)) {
        fs.mkdirSync(cursorDir);
    }
    
    const rulesDir = path.join(cursorDir, 'rules');
    if (!fs.existsSync(rulesDir)) {
        fs.mkdirSync(rulesDir);
    }
    
    return rulesDir;
}

/**
 * 提取规则的名称和描述
 * @param content 规则文件内容
 * @returns 包含提取的名称和描述的对象
 */
export function extractRuleInfo(content: string): { name?: string; description?: string } {
    const nameMatch = content.match(/# (.*)/);
    const descMatch = content.match(/description: (.*)/);
    
    return {
        name: nameMatch ? nameMatch[1] : undefined,
        description: descMatch ? descMatch[1] : undefined
    };
}

/**
 * 向WebView发送成功响应
 * @param type 消息类型
 * @param data 响应数据
 */
export function sendSuccessResponse(type: string, data: any): void {
    if (configPanelInstance) {
        configPanelInstance.webview.postMessage({
            type,
            success: true,
            ...data
        });
    }
}

/**
 * 向WebView发送错误响应
 * @param type 消息类型
 * @param errorMessage 错误消息
 */
export function sendErrorResponse(type: string, errorMessage: string): void {
    error(errorMessage);
    if (configPanelInstance) {
        configPanelInstance.webview.postMessage({
            type,
            success: false,
            error: errorMessage
        });
    }
}

/**
 * 检查工作区是否存在，如果不存在则发送错误响应
 * @param type 响应类型
 * @returns 工作区文件夹或undefined（如果不存在）
 */
export function checkWorkspaceFolder(type: string): vscode.WorkspaceFolder | undefined {
    const workspaceFolder = getWorkspaceFolder();
    
    if (!workspaceFolder) {
        warn('No workspace folder found');
        sendErrorResponse(type, 'Please open a workspace folder first');
        return undefined;
    }
    
    return workspaceFolder;
}

/**
 * 在编辑器中打开文件
 * @param filePath 文件路径
 */
export async function openFileInEditor(filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
        warn(`File not found: ${filePath}`);
        vscode.window.showErrorMessage(`File not found: ${filePath}`);
        return;
    }
    
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        info(`Opened file: ${filePath}`);
    } catch (err) {
        error(`Error opening file: ${err}`, err);
        vscode.window.showErrorMessage(`Failed to open file: ${err}`);
    }
} 