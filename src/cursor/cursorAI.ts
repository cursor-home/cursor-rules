import axios from 'axios';
import { getCursorToken, TokenData, CursorCredentialErrors } from './cursorCredentials';

/**
 * Cursor AI请求接口
 */
export interface CursorAIRequest {
    prompt: string;           // 提示词
    language?: string;        // 目标语言
    context?: string;         // 上下文代码
    maxTokens?: number;       // 最大生成令牌数
    temperature?: number;     // 温度值(创造性)
    stop?: string[];          // 停止词
    stream?: boolean;         // 是否使用流式响应
    model?: string;           // 使用的模型
    messages?: Message[];     // 消息数组，用于对话格式
}

/**
 * 对话消息接口
 */
export interface Message {
    role: string;             // 角色(system/user/assistant)
    content: string;          // 消息内容
}

/**
 * Cursor AI响应接口
 */
export interface CursorAIResponse {
    code?: string;            // 生成的代码
    error?: string;           // 错误信息
    errorType?: string;       // 错误类型
    raw?: any;                // 原始响应数据
    response?: string;        // 文本响应
    usage?: {                 // Token使用统计
        input: number;        // 输入token数
        output: number;       // 输出token数
    };
}

/**
 * 流式响应数据块
 */
export interface StreamChunk {
    choices: Array<{
        delta: {
            content: string;
        };
        index: number;
    }>;
    id: string;
    object: string;
    created: number;
}

/**
 * API路径常量
 */
export const APIConstants = {
    CONVERSATION_API_PATH: '/api/conversation',
    ORIGINAL_CONVERSATION_PATH: '/conversation',
    DEFAULT_TIMEOUT: 300  // 默认超时时间(秒)
};

/**
 * 错误类型
 */
export const CursorAIErrors = {
    TOKEN_ERROR: new Error('获取Cursor凭证失败'),
    API_ERROR: new Error('调用Cursor API失败'),
    RATE_LIMIT_ERROR: new Error('超过API调用限制'),
    NETWORK_ERROR: new Error('网络连接错误'),
    INVALID_RESPONSE: new Error('无效的API响应'),
    INVALID_REQUEST: new Error('无效的请求参数'),
    ORIGINAL_API_UNSUPPORTED: new Error('原生API不支持该功能')
};

/**
 * Cursor AI客户端类
 */
export class CursorAIClient {
    private token: string | null = null;
    private tokenData: TokenData | null = null;
    private baseURL = 'https://api.cursor.sh/v1';
    private cursorBaseURL = 'https://api.cursor.sh';
    private useOriginalAPI = false;
    private timeout = APIConstants.DEFAULT_TIMEOUT;
    
    constructor(token?: string, options?: ClientOptions) {
        if (token) {
            this.token = token;
        }
        
        if (options) {
            this.useOriginalAPI = options.useOriginalAPI || false;
            this.timeout = options.timeout || APIConstants.DEFAULT_TIMEOUT;
            
            if (options.baseURL) {
                this.baseURL = options.baseURL;
                
                // 解析baseHost
                let baseHost = options.baseURL;
                if (baseHost.endsWith(APIConstants.CONVERSATION_API_PATH)) {
                    baseHost = baseHost.substring(0, baseHost.length - APIConstants.CONVERSATION_API_PATH.length);
                } else if (baseHost.endsWith(APIConstants.ORIGINAL_CONVERSATION_PATH)) {
                    baseHost = baseHost.substring(0, baseHost.length - APIConstants.ORIGINAL_CONVERSATION_PATH.length);
                }
                
                // 设置cursorBaseURL
                this.cursorBaseURL = baseHost;
                if (!this.cursorBaseURL.startsWith('http')) {
                    this.cursorBaseURL = 'https://' + this.cursorBaseURL;
                }
            }
        }
    }
    
    /**
     * 初始化客户端凭证
     */
    async initialize(): Promise<void> {
        if (!this.token) {
            try {
                this.tokenData = await getCursorToken();
                this.token = this.tokenData.token;
            } catch (error) {
                console.error('初始化Cursor AI客户端失败:', error);
                throw CursorAIErrors.TOKEN_ERROR;
            }
        }
    }
    
    /**
     * 检查是否已初始化
     */
    isInitialized(): boolean {
        return !!this.token;
    }
    
    /**
     * 获取凭证信息
     */
    getTokenInfo(): TokenData | null {
        return this.tokenData;
    }
    
    /**
     * 生成代码
     * @param request 请求参数
     * @returns 响应结果
     */
    async generateCode(request: CursorAIRequest): Promise<CursorAIResponse> {
        if (!this.isInitialized()) {
            await this.initialize();
        }
        
        // 验证请求参数
        if (!request.prompt) {
            throw CursorAIErrors.INVALID_REQUEST;
        }
        
        // 如果提供了messages，则优先使用会话API
        if (request.messages && request.messages.length > 0) {
            return this.completionNonStream({
                ...request,
                stream: false,
                model: request.model || 'claude-3-opus-20240229'
            });
        }
        
        try {
            // 构建请求参数
            const apiRequest = {
                prompt: request.prompt,
                language: request.language || '',
                context: request.context || '',
                maxTokens: request.maxTokens || 2048,
                temperature: request.temperature || 0.7,
                stop: request.stop || []
            };
            
            // 发送API请求
            const response = await axios.post(
                `${this.baseURL}/generate/code`,
                apiRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    timeout: this.timeout * 1000
                }
            );
            
            // 处理响应
            if (response.data && response.status === 200) {
                return {
                    code: response.data.code || response.data.text || response.data.content,
                    raw: response.data
                };
            } else {
                return {
                    error: '未能正确解析API响应',
                    errorType: 'PARSE_ERROR',
                    raw: response.data
                };
            }
        } catch (error: any) {
            console.error('调用Cursor AI API失败:', error);
            
            let errorResponse: CursorAIResponse = {
                error: error.message,
                errorType: 'API_ERROR'
            };
            
            // 处理不同类型的错误
            if (error.response) {
                // 服务器返回了错误状态码
                errorResponse.error = `API错误(${error.response.status}): ${error.response.data?.message || error.message}`;
                errorResponse.raw = error.response.data;
                
                if (error.response.status === 429) {
                    errorResponse.errorType = 'RATE_LIMIT';
                    errorResponse.error = '超过API调用限制，请稍后重试';
                } else if (error.response.status === 401 || error.response.status === 403) {
                    errorResponse.errorType = 'AUTH_ERROR';
                    errorResponse.error = '凭证无效或已过期';
                }
            } else if (error.request) {
                // 请求已发送但未收到响应
                errorResponse.errorType = 'NETWORK_ERROR';
                errorResponse.error = '网络请求超时或无法连接到Cursor API';
            }
            
            return errorResponse;
        }
    }
    
    /**
     * 简单代码生成(便捷方法)
     * @param prompt 提示词
     * @param language 目标语言
     * @returns 生成的代码
     */
    async generateSimpleCode(prompt: string, language?: string): Promise<string> {
        const response = await this.generateCode({
            prompt,
            language
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        return response.code || '';
    }
    
    /**
     * 发送非流式完成请求
     * @param request 请求参数
     * @returns 响应结果
     */
    async completionNonStream(request: CursorAIRequest): Promise<CursorAIResponse> {
        if (this.useOriginalAPI) {
            return this.originalCompletionNonStream(request);
        }
        
        if (!this.isInitialized()) {
            await this.initialize();
        }
        
        if (!request.messages && !request.prompt) {
            throw CursorAIErrors.INVALID_REQUEST;
        }
        
        try {
            // 准备请求参数
            const apiRequest: any = {
                model: request.model || 'claude-3-opus-20240229',
                temperature: request.temperature || 0.7,
                maxTokens: request.maxTokens || 2048,
                stream: false
            };
            
            // 处理提示词和消息格式
            if (request.messages && request.messages.length > 0) {
                apiRequest.prompt = request.messages;
            } else {
                apiRequest.prompt = [
                    { role: 'system', content: '你是一个专业的编程助手。' },
                    { role: 'user', content: request.prompt || '' }
                ];
            }
            
            if (request.stop && request.stop.length > 0) {
                apiRequest.stop = request.stop;
            }
            
            // 发送API请求
            const endpoint = `${this.cursorBaseURL}${APIConstants.CONVERSATION_API_PATH}`;
            const response = await axios.post(
                endpoint,
                apiRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    timeout: this.timeout * 1000
                }
            );
            
            // 处理响应
            if (response.data && response.status === 200) {
                return {
                    response: response.data.response || response.data.text || response.data.content,
                    raw: response.data,
                    usage: response.data.usage || { input: 0, output: 0 }
                };
            } else {
                return {
                    error: '未能正确解析API响应',
                    errorType: 'PARSE_ERROR',
                    raw: response.data
                };
            }
        } catch (error: any) {
            console.error('调用Cursor API失败:', error);
            
            let errorResponse: CursorAIResponse = {
                error: error.message,
                errorType: 'API_ERROR'
            };
            
            // 处理不同类型的错误
            if (error.response) {
                errorResponse.error = `API错误(${error.response.status}): ${error.response.data?.message || error.message}`;
                errorResponse.raw = error.response.data;
                
                if (error.response.status === 429) {
                    errorResponse.errorType = 'RATE_LIMIT';
                    errorResponse.error = '超过API调用限制，请稍后重试';
                } else if (error.response.status === 401 || error.response.status === 403) {
                    errorResponse.errorType = 'AUTH_ERROR';
                    errorResponse.error = '凭证无效或已过期';
                }
            } else if (error.request) {
                errorResponse.errorType = 'NETWORK_ERROR';
                errorResponse.error = '网络请求超时或无法连接到Cursor API';
            }
            
            return errorResponse;
        }
    }
    
    /**
     * 使用原始API格式发送非流式请求
     * @param request 请求参数
     * @returns 响应结果
     */
    private async originalCompletionNonStream(request: CursorAIRequest): Promise<CursorAIResponse> {
        if (!this.isInitialized()) {
            await this.initialize();
        }
        
        try {
            // 准备请求参数(原始API格式)
            const apiRequest: any = {
                model: request.model || 'claude-3-opus-20240229',
                temperature: request.temperature || 0.7,
                maxTokens: request.maxTokens || 2048,
                stream: false
            };
            
            // 处理提示词和消息格式
            if (request.messages && request.messages.length > 0) {
                apiRequest.messages = request.messages;
            } else if (request.prompt) {
                apiRequest.messages = [
                    { role: 'system', content: '你是一个专业的编程助手。' },
                    { role: 'user', content: request.prompt }
                ];
            } else {
                throw CursorAIErrors.INVALID_REQUEST;
            }
            
            // 发送API请求
            const endpoint = `${this.cursorBaseURL}${APIConstants.ORIGINAL_CONVERSATION_PATH}`;
            const response = await axios.post(
                endpoint,
                apiRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    timeout: this.timeout * 1000
                }
            );
            
            // 处理响应
            if (response.data && response.status === 200) {
                return {
                    response: response.data.choices[0]?.message?.content || '',
                    raw: response.data,
                    usage: response.data.usage || { input: 0, output: 0 }
                };
            } else {
                return {
                    error: '未能正确解析API响应',
                    errorType: 'PARSE_ERROR',
                    raw: response.data
                };
            }
        } catch (error: any) {
            console.error('调用Cursor原始API失败:', error);
            
            let errorResponse: CursorAIResponse = {
                error: error.message,
                errorType: 'API_ERROR'
            };
            
            // 处理不同类型的错误
            if (error.response) {
                errorResponse.error = `API错误(${error.response.status}): ${error.response.data?.message || error.message}`;
                errorResponse.raw = error.response.data;
            } else if (error.request) {
                errorResponse.errorType = 'NETWORK_ERROR';
                errorResponse.error = '网络请求超时或无法连接到Cursor API';
            }
            
            return errorResponse;
        }
    }
    
    /**
     * 发送流式完成请求
     * @param request 请求参数
     * @returns 原始HTTP响应
     */
    async completionStream(request: CursorAIRequest): Promise<Response> {
        if (this.useOriginalAPI) {
            throw CursorAIErrors.ORIGINAL_API_UNSUPPORTED;
        }
        
        if (!this.isInitialized()) {
            await this.initialize();
        }
        
        if (!request.messages && !request.prompt) {
            throw CursorAIErrors.INVALID_REQUEST;
        }
        
        // 准备请求参数
        const apiRequest: any = {
            model: request.model || 'claude-3-opus-20240229',
            temperature: request.temperature || 0.7,
            maxTokens: request.maxTokens || 2048,
            stream: true
        };
        
        // 处理提示词和消息格式
        if (request.messages && request.messages.length > 0) {
            apiRequest.prompt = request.messages;
        } else {
            apiRequest.prompt = [
                { role: 'system', content: '你是一个专业的编程助手。' },
                { role: 'user', content: request.prompt || '' }
            ];
        }
        
        if (request.stop && request.stop.length > 0) {
            apiRequest.stop = request.stop;
        }
        
        // 发送API请求
        const endpoint = `${this.cursorBaseURL}${APIConstants.CONVERSATION_API_PATH}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(apiRequest)
        });
        
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API错误(${response.status}): ${text}`);
        }
        
        return response;
    }
}

/**
 * 客户端配置选项
 */
export interface ClientOptions {
    useOriginalAPI?: boolean;  // 是否使用原始API
    timeout?: number;          // 超时时间(秒)
    baseURL?: string;          // 基础URL
}

/**
 * 创建Cursor AI客户端
 * @param token 认证令牌
 * @param baseURL 基础URL
 * @returns AI客户端实例
 */
export function createCursorAIClient(token?: string, baseURL?: string): CursorAIClient {
    return new CursorAIClient(token, {
        baseURL: baseURL
    });
}

/**
 * 使用自定义选项创建Cursor AI客户端
 * @param token 认证令牌
 * @param options 客户端选项
 * @returns AI客户端实例
 */
export function createCursorAIClientWithOptions(token: string, options: ClientOptions): CursorAIClient {
    return new CursorAIClient(token, options);
}

/**
 * 获取单例AI客户端
 */
let defaultClient: CursorAIClient | null = null;

export function getDefaultAIClient(): CursorAIClient {
    if (!defaultClient) {
        defaultClient = new CursorAIClient();
    }
    return defaultClient;
} 