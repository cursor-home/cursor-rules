import { info, warn, error, debug } from '../../logger/logger';
import { Rule, RuleSource } from '../../types';
import { builtInRuleManager } from '../../cursorRules/builtInRuleManager';
import { sendSuccessResponse, sendErrorResponse } from './ruleHandlerUtils';

/**
 * 处理获取规则详情请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleGetRuleDetail(message: any) {
    info('收到规则详情请求:', message.ruleId);
    debug('请求参数:', JSON.stringify(message));
    
    if (!message.ruleId) {
        debug('请求中没有提供ruleId');
        sendErrorResponse('ruleDetail', 'No rule ID provided');
        debug('已发送错误响应: 没有提供规则ID');
        return;
    }
    
    try {
        // 使用builtInRuleManager根据ID获取规则元数据
        const targetRule = await builtInRuleManager.getRuleMetadataById(message.ruleId);
        
        if (targetRule) {
            debug(`找到规则: ${targetRule.name}`);
            
            // 读取规则内容
            const content = await targetRule.readContent();
            const rule: Rule = {
                ...targetRule,
                content: content || `[错误] 无法读取规则内容: ${targetRule.filePath || '未指定文件路径'}`,
                source: targetRule.filePath ? RuleSource.Custom : RuleSource.BuiltIn
            };
            
            info(`成功获取规则详情: ${rule.name}`);
            debug(`发送成功响应，包含规则: ${rule.name}`);
            sendSuccessResponse('ruleDetail', { rule });
            debug('响应成功发送');
        } else {
            warn(`未找到规则: ${message.ruleId}`);
            debug(`未找到ID为${message.ruleId}的规则`);
            sendErrorResponse('ruleDetail', `Rule not found: ${message.ruleId}`);
            debug('已发送错误响应');
        }
    } catch (err) {
        error('获取规则详情失败:', err);
        sendErrorResponse('ruleDetail', `Failed to get rule detail: ${err}`);
        debug('已发送错误响应');
    }
} 