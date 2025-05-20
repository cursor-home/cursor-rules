/**
 * Cursor模块入口文件
 * 导出所有子模块和公共API
 */

// 导出凭证模块
export * from './credentials/index.js';

// 导出AI模块
export * from './ai/index.js';

/**
 * 初始化模块
 * 简化的主函数，用于初始化所有模块功能
 */
export async function initialize(): Promise<boolean> {
    try {
        // 从AI模块获取客户端实例
        const client = await import('./ai/index.js').then(module => module.getDefaultAIClient());
        
        // 初始化客户端
        await client.initialize();
        
        return client.isInitialized();
    } catch (error) {
        console.error('初始化Cursor模块失败:', error);
        return false;
    }
} 