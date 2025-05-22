import { info, warn, error } from '../../logger/logger';
import { Rule, RuleSource } from '../../types';
import { builtInRuleManager } from '../../cursorRules/builtInRuleManager';
import { sendSuccessResponse, sendErrorResponse } from './ruleHandlerUtils';

/**
 * 处理规则列表请求
 * 
 * @param message 从WebView接收的消息对象
 * @param includeBuiltIn 是否包含内置规则的布尔标志
 */
export async function handleGetRuleList(message: any, includeBuiltIn: boolean = true) {
    info('收到规则列表请求');
    
    try {
        // 使用builtInRuleManager获取所有规则元数据
        const ruleMetadata = await builtInRuleManager.getAllRuleMetadata();
        info(`获取到${ruleMetadata.length}条规则元数据`);
        
        // 转换为Rule对象，但不读取内容
        const rules: Rule[] = ruleMetadata.map(rule => ({
            ...rule,
            content: '', // 内容为空，需要时再读取
            source: rule.filePath ? RuleSource.Custom : RuleSource.BuiltIn
        }));
        
        // 发送成功响应回WebView
        info(`向WebView发送${rules.length}条规则`);
        sendSuccessResponse('ruleListResult', { rules });
    } catch (err) {
        error('加载规则列表失败:', err);
        sendErrorResponse('ruleListResult', `Failed to load rule list: ${err}`);
    }
} 