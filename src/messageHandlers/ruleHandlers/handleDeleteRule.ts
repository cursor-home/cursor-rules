import * as vscode from 'vscode';
import { info, warn, error } from '../../logger/logger';
import { sendSuccessResponse, sendErrorResponse } from './ruleHandlerUtils';
import { configPanelInstance } from '../../webview/configPanel/showConfigPanel';
import { UserRuleStorageManager } from '../../cursorRules/userRuleStorageManager';

/**
 * 处理删除规则请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleDeleteRule(message: any) {
    info('收到删除规则请求:', message.ruleId);
    
    if (!message.ruleId) {
        error('未提供规则ID');
        sendErrorResponse('ruleDeleted', 'No rule ID provided');
        return;
    }
    
    try {
        // 创建存储管理器实例
        const storageManager = new UserRuleStorageManager();
        
        // 删除规则
        const success = await storageManager.deleteRule(message.ruleId);
        
        if (success) {
            info(`规则 ${message.ruleId} 删除成功`);
            
            // 发送成功响应
            sendSuccessResponse('ruleDeleted', {});
            
            // 导航回规则列表
            if (configPanelInstance) {
                configPanelInstance.webview.postMessage({
                    type: 'navigateTo',
                    page: 'rules'
                });
            }
            
            vscode.window.showInformationMessage(`规则删除成功`);
        } else {
            warn(`规则 ${message.ruleId} 删除失败`);
            sendErrorResponse('ruleDeleted', `规则删除失败`);
        }
    } catch (err) {
        error('删除规则时发生错误:', err);
        sendErrorResponse('ruleDeleted', `删除规则失败: ${err}`);
    }
} 