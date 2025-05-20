/**
 * 凭证模块的模型定义文件
 * 包含令牌数据接口和错误类型
 */

/**
 * 令牌数据接口
 */
export interface TokenData {
    /**
     * 令牌字符串
     */
    token: string;
    /**
     * 令牌来源
     */
    source: TokenSource;
    /**
     * 是否是有效的令牌
     */
    isValid: boolean;
    /**
     * 令牌过期时间(ISO日期字符串)
     */
    expiresAt?: string;
    /**
     * 关联的账户信息
     */
    account?: {
        email?: string;
        id?: string;
        name?: string;
    };
}

/**
 * 令牌来源枚举
 */
export enum TokenSource {
    /**
     * 配置文件
     */
    CONFIG_FILE = 'config_file',
    /**
     * 环境变量
     */
    ENV_VAR = 'env_var',
    /**
     * 存储文件
     */
    STORE_FILE = 'store_file',
    /**
     * 本地存储
     */
    LOCAL_STORAGE = 'local_storage',
    /**
     * 用户输入
     */
    USER_INPUT = 'user_input',
    /**
     * Cursor应用
     */
    CURSOR_APP = 'cursor_app'
}

/**
 * 令牌提取器结果接口
 */
export interface TokenExtractorResult {
    /**
     * 是否找到令牌
     */
    found: boolean;
    /**
     * 令牌字符串
     */
    token?: string;
    /**
     * 错误信息
     */
    error?: string;
}

/**
 * 凭证错误类型
 */
export const TokenErrors = {
    /**
     * 令牌未找到错误
     */
    TOKEN_NOT_FOUND: new Error('找不到有效的Cursor API令牌'),
    /**
     * 令牌无效错误
     */
    INVALID_TOKEN: new Error('Cursor API令牌无效'),
    /**
     * 网络错误
     */
    NETWORK_ERROR: new Error('验证令牌时发生网络错误'),
    /**
     * 文件访问错误
     */
    FILE_ACCESS_ERROR: new Error('无法访问Cursor凭证文件')
}; 