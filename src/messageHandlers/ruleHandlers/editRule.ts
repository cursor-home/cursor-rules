import { info, error } from '../../logger/logger';
import { openFileInEditor } from './utils';

/**
 * 处理编辑规则请求
 * 
 * @param message 带有规则数据的消息对象
 */
export async function handleEditRule(message: any) {
    info('Received request to edit rule');
    
    if (!message.rule) {
        error('No rule data provided');
        return;
    }
    
    // 在编辑器中打开文件
    if (message.rule.filePath) {
        await openFileInEditor(message.rule.filePath);
    } else {
        error('Rule file path not provided');
    }
} 