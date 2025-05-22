import { info, error } from '../../logger/logger';
import { sendSuccessResponse, sendErrorResponse } from './ruleHandlerUtils';
import { UserRuleStorageManager } from '../../cursorRules/userRuleStorageManager';
import { Rule, RuleSource } from '../../types';

/**
 * 处理创建规则请求
 * 
 * @param message 包含规则数据的消息对象
 */
export async function handleCreateRule(message: any) {
    info('收到创建规则请求');
    
    if (!message.rule) {
        error('未提供规则数据');
        sendErrorResponse('ruleCreated', 'No rule data provided');
        return;
    }
    
    try {
        // 创建存储管理器实例
        const storageManager = new UserRuleStorageManager();
        
        // 生成规则ID
        const ruleId = message.rule.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
            
        // 构建规则对象
        const rule: Rule = {
            id: ruleId,
            name: message.rule.name,
            description: message.rule.description || 'Custom rule',
            content: message.rule.content,
            techStack: message.rule.techStack || {},
            source: RuleSource.Custom,
            readContent: async () => message.rule.content
        };
        
        // 存储规则
        await storageManager.storeRule(rule);
        
        info(`规则 ${rule.name} 创建成功`);
        
        // 发送成功响应
        sendSuccessResponse('ruleCreated', { ruleId });
        
    } catch (err) {
        error('创建规则失败:', err);
        sendErrorResponse('ruleCreated', `创建规则失败: ${err}`);
    }
} 