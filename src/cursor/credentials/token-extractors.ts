/**
 * 凭证模块的令牌提取器文件
 * 实现多种令牌提取策略
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { TokenExtractorResult, TokenSource } from './token-models';
import { getConfigPath, getTokenCachePath, ensureDirExists } from './storage-locations';

/**
 * 从环境变量中提取令牌
 * @returns 令牌提取结果
 */
export async function extractTokenFromEnv(): Promise<TokenExtractorResult> {
    const token = process.env.CURSOR_API_KEY || process.env.CURSOR_API_TOKEN;
    
    if (token) {
        return {
            found: true,
            token
        };
    }
    
    return {
        found: false,
        error: '未在环境变量中找到Cursor API令牌'
    };
}

/**
 * 从Cursor配置文件中提取令牌
 * @returns 令牌提取结果
 */
export async function extractTokenFromConfigFile(): Promise<TokenExtractorResult> {
    try {
        const configPath = getConfigPath();
        
        if (!fs.existsSync(configPath)) {
            return {
                found: false,
                error: `配置文件不存在: ${configPath}`
            };
        }
        
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        // 检查多种可能的令牌字段名
        const token = config.cursorApiKey || config.ai?.apiKey || config.api?.key || config.apiKey;
        
        if (token) {
            return {
                found: true,
                token
            };
        }
        
        return {
            found: false,
            error: '未在配置文件中找到有效的令牌字段'
        };
    } catch (error: any) {
        return {
            found: false,
            error: `读取配置文件失败: ${error.message}`
        };
    }
}

/**
 * 从缓存文件中提取令牌
 * @returns 令牌提取结果
 */
export async function extractTokenFromCacheFile(): Promise<TokenExtractorResult> {
    try {
        const cachePath = getTokenCachePath();
        
        if (!fs.existsSync(cachePath)) {
            return {
                found: false,
                error: `缓存文件不存在: ${cachePath}`
            };
        }
        
        const cacheData = fs.readFileSync(cachePath, 'utf8');
        const cache = JSON.parse(cacheData);
        
        if (cache.token) {
            const currentTime = new Date().getTime();
            
            // 如果有过期时间且已过期，则视为未找到
            if (cache.expiresAt && new Date(cache.expiresAt).getTime() < currentTime) {
                return {
                    found: false,
                    error: '缓存的令牌已过期'
                };
            }
            
            return {
                found: true,
                token: cache.token
            };
        }
        
        return {
            found: false,
            error: '缓存文件中未找到有效令牌'
        };
    } catch (error: any) {
        return {
            found: false,
            error: `读取缓存文件失败: ${error.message}`
        };
    }
}

/**
 * 检查令牌是否有效
 * @param token 待验证的令牌
 * @returns 验证结果
 */
export async function validateToken(token: string): Promise<{
    isValid: boolean;
    data?: any;
    error?: string;
}> {
    if (!token || token.trim() === '') {
        return {
            isValid: false,
            error: '令牌为空'
        };
    }
    
    try {
        // 调用Cursor API验证令牌
        const response = await axios.get('https://api.cursor.sh/v1/user/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5秒超时
        });
        
        // 检查响应状态
        if (response.status === 200 && response.data) {
            return {
                isValid: true,
                data: response.data
            };
        } else {
            return {
                isValid: false,
                error: `API返回状态: ${response.status}`
            };
        }
    } catch (error: any) {
        // 处理不同类型的错误
        let errorMessage = '验证令牌时发生错误';
        
        if (error.response) {
            // 服务器返回了错误状态码
            if (error.response.status === 401) {
                errorMessage = '令牌无效或已过期';
            } else {
                errorMessage = `API错误(${error.response.status}): ${error.response.data?.message || error.message}`;
            }
        } else if (error.request) {
            // 请求已发送但未收到响应
            errorMessage = '网络错误或API超时';
        }
        
        return {
            isValid: false,
            error: errorMessage
        };
    }
}

/**
 * 保存令牌到缓存文件
 * @param token 令牌字符串
 * @param expiresAt 可选的过期时间
 */
export async function saveTokenToCache(token: string, expiresAt?: string): Promise<void> {
    try {
        const cachePath = getTokenCachePath();
        ensureDirExists(cachePath);
        
        const cacheData = {
            token,
            expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 默认30天后过期
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error: any) {
        console.error('保存令牌到缓存失败:', error);
        throw error;
    }
} 