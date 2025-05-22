import { info, error, debug } from '../../logger/logger';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { UserRuleStorageManager } from '../../cursorRules/userRuleStorageManager';
import { writeFileContent } from '../../utils/fsUtils';

/**
 * 处理规则编辑请求
 * 支持两种参数格式：
 * 1. { ruleId: string } - 提供规则ID
 * 2. { rule: { id: string, ... } } - 提供规则对象
 * 
 * @param message 消息对象，包含规则ID或规则对象
 */
export async function handleRuleEdit(message: any) {
    debug('收到规则编辑请求:', JSON.stringify(message));
    
    // 获取规则ID
    const ruleId = message.ruleId || (message.rule && message.rule.id);
    
    if (!ruleId) {
        error('未提供规则ID');
        vscode.window.showErrorMessage('No rule ID provided for editing');
        return;
    }
    
    try {
        // 创建存储管理器实例
        const storageManager = new UserRuleStorageManager();
        
        // 获取规则元数据
        const metadata = storageManager.getRuleMetadata(ruleId);
        if (!metadata) {
            error(`规则 ${ruleId} 不存在`);
            vscode.window.showErrorMessage(`Rule ${ruleId} not found`);
            return;
        }
        
        // 读取规则内容
        const content = await metadata.readContent();
        if (!content) {
            error(`无法读取规则 ${ruleId} 的内容`);
            vscode.window.showErrorMessage(`Cannot read rule content: ${ruleId}`);
            return;
        }
        
        // 创建临时文件路径
        const tmpFile = vscode.Uri.file(
            path.join(os.tmpdir(), `rule-${ruleId}-${Date.now()}.mdc`)
        );
        
        // 使用工具函数写入内容
        const writeSuccess = await writeFileContent(tmpFile, content);
        if (!writeSuccess) {
            throw new Error(`无法创建临时文件: ${tmpFile.fsPath}`);
        }
        
        // 打开文件
        const document = await vscode.workspace.openTextDocument(tmpFile);
        await vscode.window.showTextDocument(document);
        
        info(`规则 ${ruleId} 已打开进行编辑`);
        
    } catch (err) {
        error('处理规则编辑请求时出错:', err);
        vscode.window.showErrorMessage(`Failed to edit rule: ${err}`);
    }
} 