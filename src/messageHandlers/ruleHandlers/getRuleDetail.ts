import * as fs from 'fs';
import * as path from 'path';
import { info, warn } from '../../logger/logger';
import { Rule, RuleSource } from '../../types';
import { getAllRuleMetadata } from '../../cursorRules/metaManager';
import { 
    checkWorkspaceFolder,
    getRulesDirectoryPath,
    extractRuleInfo,
    sendSuccessResponse,
    sendErrorResponse
} from './utils';

/**
 * 处理获取规则详情请求
 * 
 * @param message 带有规则ID的消息对象
 */
export async function handleGetRuleDetail(message: any) {
    info('Received request for rule detail:', message.ruleId);
    console.log('[DEBUG getRuleDetail] 收到规则详情请求, 参数:', JSON.stringify(message));
    
    if (!message.ruleId) {
        console.log('[DEBUG getRuleDetail] 请求中没有提供ruleId');
        sendErrorResponse('ruleDetail', 'No rule ID provided');
        console.log('[DEBUG getRuleDetail] 已发送错误响应: 没有提供规则ID');
        return;
    }
    
    // 获取当前工作区
    const workspaceFolder = checkWorkspaceFolder('ruleDetail');
    if (!workspaceFolder) {
        console.log('[DEBUG getRuleDetail] 未找到工作区文件夹');
        return;
    }
    
    try {
        // 首先，尝试在自定义规则中查找
        const rulesDir = getRulesDirectoryPath(workspaceFolder);
        console.log(`[DEBUG getRuleDetail] 在目录中查找规则: ${rulesDir}`);
        
        let rule: Rule | null = null;
        
        // 如果是自定义规则（存储为文件）
        if (fs.existsSync(rulesDir)) {
            const potentialPath = path.join(rulesDir, message.ruleId);
            console.log(`[DEBUG getRuleDetail] 检查规则文件是否存在: ${potentialPath}`);
            
            if (fs.existsSync(potentialPath)) {
                console.log(`[DEBUG getRuleDetail] 找到规则文件: ${potentialPath}`);
                const content = fs.readFileSync(potentialPath, 'utf8');
                
                // 从内容中提取名称和描述
                const ruleInfo = extractRuleInfo(content);
                
                rule = {
                    id: message.ruleId,
                    name: ruleInfo.name || message.ruleId,
                    description: ruleInfo.description || '',
                    filePath: potentialPath,
                    content: content,
                    source: RuleSource.Custom,
                    lastUpdated: fs.statSync(potentialPath).mtime.getTime()
                };
                console.log(`[DEBUG getRuleDetail] 已创建规则对象: ${rule.name}`);
            } else {
                console.log(`[DEBUG getRuleDetail] 未找到规则文件: ${potentialPath}`);
            }
        } else {
            console.log(`[DEBUG getRuleDetail] 规则目录不存在: ${rulesDir}`);
        }
        
        // 如果在自定义规则中未找到，尝试在内置规则中查找
        if (!rule) {
            console.log(`[DEBUG getRuleDetail] 在内置规则中查找`);
            const builtInRules = await getAllRuleMetadata();
            console.log(`[DEBUG getRuleDetail] 找到${builtInRules.length}个内置规则`);
            
            const builtInRule = builtInRules.find(r => r.id === message.ruleId);
            
            if (builtInRule) {
                console.log(`[DEBUG getRuleDetail] 找到内置规则: ${builtInRule.name}`);
                rule = {
                    ...builtInRule,
                    content: '# ' + builtInRule.name + '\n\n' + builtInRule.description,
                    source: RuleSource.BuiltIn
                };
            } else {
                console.log(`[DEBUG getRuleDetail] 未找到ID为${message.ruleId}的内置规则`);
            }
        }
        
        // 发送响应
        if (rule) {
            info(`Rule found: ${rule.name}`);
            console.log(`[DEBUG getRuleDetail] 发送成功响应，包含规则: ${rule.name}`);
            sendSuccessResponse('ruleDetail', { rule });
            console.log(`[DEBUG getRuleDetail] 响应成功发送`);
        } else {
            warn(`Rule not found: ${message.ruleId}`);
            console.log(`[DEBUG getRuleDetail] 未找到ID为${message.ruleId}的规则`);
            sendErrorResponse('ruleDetail', `Rule not found: ${message.ruleId}`);
            console.log(`[DEBUG getRuleDetail] 已发送错误响应`);
        }
    } catch (err) {
        console.log(`[DEBUG getRuleDetail] 处理过程中出错:`, err);
        sendErrorResponse('ruleDetail', `Failed to get rule detail: ${err}`);
        console.log(`[DEBUG getRuleDetail] 已发送错误响应`);
    }
} 