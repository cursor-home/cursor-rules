import { info, error } from '../../logger/logger';
import { openFileInEditor } from './utils';

/**
 * 处理打开规则文件请求
 * 
 * @param message 带有文件路径的消息对象
 */
export async function handleOpenRule(message: any) {
    info('Received request to open rule file:', message.path);
    
    if (!message.path) {
        error('No file path provided');
        return;
    }
    
    await openFileInEditor(message.path);
} 