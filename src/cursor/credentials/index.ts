/**
 * 凭证模块入口文件
 * 导出所有公共API和类型
 */

// 导出类型和错误
export {
    TokenData,
    TokenSource,
    TokenExtractorResult,
    TokenErrors
} from './token-models';

// 导出存储位置API
export {
    getConfigPath,
    getTokenCachePath,
    setExtensionContext,
    getExtensionContext,
    ensureDirExists,
    getCursorAppPath
} from './storage-locations';

// 导出提取器和验证函数
export {
    extractTokenFromEnv,
    extractTokenFromConfigFile,
    extractTokenFromCacheFile,
    validateToken,
    saveTokenToCache
} from './token-extractors';

// 导出公共API
export {
    getCursorToken,
    testTokenValidity,
    saveToken,
    clearCachedToken
} from './token-api';