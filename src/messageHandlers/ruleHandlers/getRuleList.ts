import * as fs from 'fs';
import * as path from 'path';
import { info, warn } from '../../logger/logger';
import { Rule, RuleSource, RuleMetadata } from '../../types';
import { getAllRuleMetadata } from '../../cursorRules/metaManager';
import { 
    checkWorkspaceFolder, 
    getRulesDirectoryPath, 
    extractRuleInfo, 
    sendSuccessResponse, 
    sendErrorResponse 
} from './utils';

/**
 * 处理规则列表请求
 * 
 * @param message 从WebView接收的消息对象
 * @param includeBuiltIn 是否包含内置规则的布尔标志
 */
export async function handleGetRuleList(message: any, includeBuiltIn: boolean = true) {
    info('Received request for rule list');
    
    // 获取当前工作区
    const workspaceFolder = checkWorkspaceFolder('ruleListResult');
    if (!workspaceFolder) return;
    
    // 在 .cursor/rules 目录中查找规则
    const rulesDir = getRulesDirectoryPath(workspaceFolder);
    let rules: Rule[] = [];
    
    try {
        // 检查规则目录是否存在
        if (fs.existsSync(rulesDir)) {
            info(`Rules directory found: ${rulesDir}`);
            
            // 读取所有 .md 和 .mdc 文件
            const files = fs.readdirSync(rulesDir)
                .filter(file => file.endsWith('.md') || file.endsWith('.mdc'));
            
            info(`Found ${files.length} rule files`);
            
            // 构建规则对象
            rules = files.map(file => {
                const filePath = path.join(rulesDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 从内容中提取名称和描述
                const ruleInfo = extractRuleInfo(content);
                
                return {
                    id: file,
                    name: ruleInfo.name || file,
                    description: ruleInfo.description || '',
                    filePath: filePath,
                    content: content,
                    source: RuleSource.Custom
                };
            });
        } else {
            info(`Rules directory not found: ${rulesDir}`);
        }
        
        // 如果需要，获取内置规则
        if (includeBuiltIn) {
            try {
                const builtInRules = await getAllRuleMetadata();
                const builtInRuleObjects = builtInRules.map((rule: RuleMetadata) => ({
                    ...rule,
                    content: '# ' + rule.name + '\n\n' + rule.description,
                    source: RuleSource.BuiltIn
                }));
                
                // 合并规则
                rules = [...rules, ...builtInRuleObjects];
            } catch (err) {
                warn('Error loading built-in rules:', err);
            }
        }
        
        // 发送成功响应回WebView
        info(`Sending ${rules.length} rules back to WebView`);
        sendSuccessResponse('ruleListResult', { rules });
    } catch (err) {
        // 发送错误响应
        sendErrorResponse('ruleListResult', `Failed to load rule list: ${err}`);
    }
} 