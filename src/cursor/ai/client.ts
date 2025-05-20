/**
 * AI客户端实现文件
 * 提供与Cursor API交互的客户端类
 */
import axios from 'axios';
import { getCursorToken, TokenData } from '../credentials/index';
import { CursorAIRequest, CursorAIResponse, ClientOptions } from './models';
import { APIConstants, CursorAIErrors } from './constants';

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