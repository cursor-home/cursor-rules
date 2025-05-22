import * as fs from 'fs';
import * as path from 'path';
import { info, error } from '../../logger/logger';
import { 
    checkWorkspaceFolder,
    ensureRulesDirectory,
    sendSuccessResponse,
    sendErrorResponse,
    openFileInEditor
} from './utils';

/**
 * 处理创建规则请求
 * 
 * @param message 包含规则数据的消息对象
 */
export async function handleCreateRule(message: any) {
    info('Received request to create a new rule');
    
    if (!message.rule) {
        sendErrorResponse('ruleCreated', 'No rule data provided');
        return;
    }
    
    // 获取当前工作区
    const workspaceFolder = checkWorkspaceFolder('ruleCreated');
    if (!workspaceFolder) return;
    
    try {
        // 确保规则目录存在
        const rulesDir = ensureRulesDirectory(workspaceFolder);
        
        // 生成规则文件名
        const ruleName = message.rule.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        
        const fileName = `${ruleName}.mdc`;
        const filePath = path.join(rulesDir, fileName);
        
        // 构建带有前置元数据的规则内容
        let ruleContent = '---\n';
        ruleContent += `description: ${message.rule.description || 'Custom rule'}\n`;
        
        // 如果提供了技术栈，将其添加到前置元数据
        if (message.rule.techStack) {
            ruleContent += 'techStack:\n';
            
            if (message.rule.techStack.languages && message.rule.techStack.languages.length > 0) {
                ruleContent += '  languages:\n';
                message.rule.techStack.languages.forEach((lang: string) => {
                    ruleContent += `    - "${lang}"\n`;
                });
            }
            
            if (message.rule.techStack.frameworks && message.rule.techStack.frameworks.length > 0) {
                ruleContent += '  frameworks:\n';
                message.rule.techStack.frameworks.forEach((framework: string) => {
                    ruleContent += `    - "${framework}"\n`;
                });
            }
            
            if (message.rule.techStack.libraries && message.rule.techStack.libraries.length > 0) {
                ruleContent += '  libraries:\n';
                message.rule.techStack.libraries.forEach((lib: string) => {
                    ruleContent += `    - "${lib}"\n`;
                });
            }
            
            if (message.rule.techStack.tools && message.rule.techStack.tools.length > 0) {
                ruleContent += '  tools:\n';
                message.rule.techStack.tools.forEach((tool: string) => {
                    ruleContent += `    - "${tool}"\n`;
                });
            }
        }
        
        ruleContent += '---\n\n';
        
        // 添加主体内容
        ruleContent += message.rule.content;
        
        // 写入文件
        fs.writeFileSync(filePath, ruleContent, 'utf8');
        
        info(`Rule created successfully: ${filePath}`);
        
        // 发送成功响应
        sendSuccessResponse('ruleCreated', { rulePath: filePath });
        
        // 在编辑器中打开文件
        await openFileInEditor(filePath);
        
    } catch (err) {
        sendErrorResponse('ruleCreated', `Failed to create rule: ${err}`);
    }
} 