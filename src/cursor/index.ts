/**
 * Cursor模块入口文件 - 已被临时禁用
 * 仅保留必要的导出接口以避免引用错误
 */

// 模型定义
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

export interface Message {
    role: MessageRole;
    content: string;
    name?: string;
}

export interface TokenUsage {
    input: number;
    output: number;
}

export interface CursorAIRequest {
    prompt?: string;
    messages?: Message[];
    language?: string;
    context?: string;
    maxTokens?: number;
    temperature?: number;
    stop?: string[];
    stream?: boolean;
    model?: string;
}

export interface CursorAIResponse {
    code?: string;
    response?: string;
    error?: string | null;
    errorType?: string;
    raw?: any;
    usage?: TokenUsage;
}

export interface ClientOptions {
    baseURL?: string;
    useOriginalAPI?: boolean;
    timeout?: number;
}

// CursorAIClient 接口
export class CursorAIClient {
    constructor(_token?: string, _options?: ClientOptions) {}
    
    async initialize(): Promise<void> {}
    
    isInitialized(): boolean {
        return true;
    }
    
    async generateCode(_request: CursorAIRequest): Promise<CursorAIResponse> {
        return { code: '', error: null };
    }
    
    async generateSimpleCode(_prompt: string, _language?: string): Promise<string> {
        return '';
    }
    
    async completionNonStream(_request: CursorAIRequest): Promise<CursorAIResponse> {
        return { response: '', error: null };
    }
    
    async completionStream(_request: CursorAIRequest): Promise<Response> {
        return new Response();
    }
}

// 工厂函数
export function createCursorAIClient(_token?: string, _options?: ClientOptions): CursorAIClient {
    return new CursorAIClient();
}

// 单例获取函数
export function getDefaultAIClient(_forceNew = false): CursorAIClient {
    return new CursorAIClient();
}

// 重置函数
export function resetDefaultClient(): void {}

// 便捷方法
export async function generateCode(_prompt: string, _language?: string): Promise<string> {
    return '';
}

/**
 * 初始化模块的空实现
 */
export async function initialize(): Promise<boolean> {
    return true;
} 