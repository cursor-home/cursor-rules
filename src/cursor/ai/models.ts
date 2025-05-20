/**
 * AI模块模型定义文件
 * 包含请求和响应的接口定义
 */

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/**
 * 消息对象接口
 */
export interface Message {
    role: MessageRole;
    content: string;
    name?: string;
}

/**
 * 客户端配置选项
 */
export interface ClientOptions {
    /**
     * 基础URL
     */
    baseURL?: string;
    /**
     * 是否使用原始API格式
     */
    useOriginalAPI?: boolean;
    /**
     * 超时时间(秒)
     */
    timeout?: number;
}

/**
 * 令牌用量信息
 */
export interface TokenUsage {
    /**
     * 输入令牌数
     */
    input: number;
    /**
     * 输出令牌数
     */
    output: number;
}

/**
 * Cursor AI请求参数
 */
export interface CursorAIRequest {
    /**
     * 提示词
     */
    prompt?: string;
    /**
     * 消息列表(会话模式)
     */
    messages?: Message[];
    /**
     * 目标语言
     */
    language?: string;
    /**
     * 上下文信息
     */
    context?: string;
    /**
     * 最大令牌数
     */
    maxTokens?: number;
    /**
     * 温度(0.0-1.0)
     */
    temperature?: number;
    /**
     * 停止序列
     */
    stop?: string[];
    /**
     * 是否使用流式输出
     */
    stream?: boolean;
    /**
     * 模型名称
     */
    model?: string;
}

/**
 * 响应的错误类型
 */
export type ErrorType = 
    | 'INVALID_REQUEST' 
    | 'API_ERROR' 
    | 'PARSE_ERROR' 
    | 'AUTH_ERROR' 
    | 'RATE_LIMIT' 
    | 'NETWORK_ERROR';

/**
 * Cursor AI响应结果
 */
export interface CursorAIResponse {
    /**
     * 生成的代码(代码生成模式)
     */
    code?: string;
    /**
     * 生成的回复(对话模式)
     */
    response?: string;
    /**
     * 错误消息
     */
    error?: string;
    /**
     * 错误类型
     */
    errorType?: ErrorType;
    /**
     * 原始响应数据
     */
    raw?: any;
    /**
     * 令牌用量信息
     */
    usage?: TokenUsage;
} 