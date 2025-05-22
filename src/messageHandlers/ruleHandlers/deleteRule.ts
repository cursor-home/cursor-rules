import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { info, warn } from '../../logger/logger';
import { 
    checkWorkspaceFolder, 
    getRulesDirectoryPath, 
    sendSuccessResponse, 
    sendErrorResponse 
} from './utils';
import { configPanelInstance } from '../../webview/configPanel/showConfigPanel';

/**
 * 处理删除规则请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleDeleteRule(message: any) {
    info('Received request to delete rule:', message.ruleId);
    
    if (!message.ruleId) {
        sendErrorResponse('ruleDeleted', 'No rule ID provided');
        return;
    }
    
    // 获取当前工作区
    const workspaceFolder = checkWorkspaceFolder('ruleDeleted');
    if (!workspaceFolder) return;
    
    try {
        // 查找规则文件
        const rulesDir = getRulesDirectoryPath(workspaceFolder);
        const filePath = path.join(rulesDir, message.ruleId);
        
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            // 删除文件
            fs.unlinkSync(filePath);
            info(`Rule deleted successfully: ${filePath}`);
            
            // 发送成功响应
            sendSuccessResponse('ruleDeleted', {});
            
            // 导航回规则列表
            if (configPanelInstance) {
                configPanelInstance.webview.postMessage({
                    type: 'navigateTo',
                    page: 'rules'
                });
            }
            
            vscode.window.showInformationMessage(`Rule deleted successfully`);
        } else {
            warn(`Rule file not found: ${filePath}`);
            sendErrorResponse('ruleDeleted', `Rule file not found: ${filePath}`);
        }
    } catch (err) {
        sendErrorResponse('ruleDeleted', `Failed to delete rule: ${err}`);
    }
} 