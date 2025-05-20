/**
 * Cursor AI模块入口文件
 * 导出所有类型和客户端工厂函数
 */

// 导出所有接口和类型
export * from './models';
export * from './constants';

// 导出客户端类
export { CursorAIClient } from './client';

import { CursorAIClient } from './client';
import { ClientOptions } from './models';

// 客户端单例
let defaultClient: CursorAIClient | null = null;

/**
 * 创建Cursor AI客户端实例
 * @param token 可选的API令牌
 * @param options 可选的客户端配置
 * @returns Cursor AI客户端实例
 */
export function createCursorAIClient(token?: string, options?: ClientOptions): CursorAIClient {
    return new CursorAIClient(token, options);
}

/**
 * 获取默认的Cursor AI客户端实例(单例模式)
 * @param forceNew 是否强制创建新实例
 * @returns Cursor AI客户端实例
 */
export function getDefaultAIClient(forceNew = false): CursorAIClient {
    if (!defaultClient || forceNew) {
        defaultClient = createCursorAIClient();
    }
    return defaultClient;
}

/**
 * 重置默认客户端
 */
export function resetDefaultClient(): void {
    defaultClient = null;
}

/**
 * 生成代码(便捷方法)
 * @param prompt 提示词
 * @param language 目标语言
 * @returns 生成的代码
 */
export async function generateCode(prompt: string, language?: string): Promise<string> {
    const client = getDefaultAIClient();
    return client.generateSimpleCode(prompt, language);
} 