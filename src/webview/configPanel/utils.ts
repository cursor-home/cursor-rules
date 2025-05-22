/**
 * Configuration Panel Utilities
 * 
 * 提供配置面板相关的工具函数
 */

/**
 * 生成随机nonce值用于内容安全策略
 * @returns 随机生成的nonce字符串
 */
export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
} 