/**
 * 凭证模块的令牌API文件
 * 提供获取和验证令牌的公共API
 */

import { TokenData, TokenSource, TokenErrors } from './token-models';
import { extractTokenFromEnv, extractTokenFromConfigFile, extractTokenFromCacheFile, validateToken, saveTokenToCache } from './token-extractors';

// 缓存的令牌数据
let cachedTokenData: TokenData | null = null;

/**
 * 获取Cursor API令牌
 * @param forceRefresh 是否强制刷新缓存
 * @returns 令牌数据
 */
export async function getCursorToken(forceRefresh = false): Promise<TokenData> {
    // 如果有缓存且不强制刷新，则直接返回
    if (cachedTokenData && !forceRefresh) {
        return cachedTokenData;
    }
    
    // 尝试从不同来源提取令牌
    const extractors = [
        { extract: extractTokenFromEnv, source: TokenSource.ENV_VAR },
        { extract: extractTokenFromCacheFile, source: TokenSource.STORE_FILE },
        { extract: extractTokenFromConfigFile, source: TokenSource.CONFIG_FILE }
    ];
    
    for (const { extract, source } of extractors) {
        const result = await extract();
        
        if (result.found && result.token) {
            // 验证令牌有效性
            const validation = await validateToken(result.token);
            
            if (validation.isValid) {
                // 创建令牌数据对象
                const tokenData: TokenData = {
                    token: result.token,
                    source,
                    isValid: true,
                    account: validation.data?.user
                };
                
                // 如果令牌不是来自缓存，则保存到缓存中
                if (source !== TokenSource.STORE_FILE) {
                    await saveTokenToCache(result.token);
                }
                
                // 缓存令牌数据
                cachedTokenData = tokenData;
                
                return tokenData;
            }
        }
    }
    
    // 如果所有提取器都失败，则抛出错误
    throw TokenErrors.TOKEN_NOT_FOUND;
}

/**
 * 测试令牌有效性
 * @param token 待测试的令牌
 * @returns 测试结果
 */
export async function testTokenValidity(token: string): Promise<{
    isValid: boolean;
    user?: any;
    error?: string;
}> {
    const result = await validateToken(token);
    
    if (result.isValid) {
        return {
            isValid: true,
            user: result.data?.user
        };
    } else {
        return {
            isValid: false,
            error: result.error
        };
    }
}

/**
 * 保存令牌
 * @param token 令牌字符串
 */
export async function saveToken(token: string): Promise<void> {
    if (!token || token.trim() === '') {
        throw new Error('令牌不能为空');
    }
    
    // 验证令牌有效性
    const validation = await validateToken(token);
    
    if (!validation.isValid) {
        throw new Error(`令牌无效: ${validation.error}`);
    }
    
    // 保存令牌到缓存
    await saveTokenToCache(token);
    
    // 更新缓存变量
    cachedTokenData = {
        token,
        source: TokenSource.USER_INPUT,
        isValid: true,
        account: validation.data?.user
    };
}

/**
 * 清除缓存的令牌
 */
export function clearCachedToken(): void {
    cachedTokenData = null;
} 