/**
 * 常量定义文件
 * 包含API路径和错误常量
 */

/**
 * API相关常量
 */
export const APIConstants = {
    /**
     * 默认超时时间(秒)
     */
    DEFAULT_TIMEOUT: 60,
    
    /**
     * 会话API路径
     */
    CONVERSATION_API_PATH: '/api/lsp/conversation',
    
    /**
     * 原始会话API路径
     */
    ORIGINAL_CONVERSATION_PATH: '/api/v2/chat/completions'
};

/**
 * 错误常量定义
 */
export const CursorAIErrors = {
    /**
     * 无效请求错误
     */
    INVALID_REQUEST: new Error('无效的请求参数'),
    
    /**
     * Token错误
     */
    TOKEN_ERROR: new Error('无法获取有效的Cursor API令牌'),
    
    /**
     * 原始API不支持流式输出
     */
    ORIGINAL_API_UNSUPPORTED: new Error('原始API格式不支持流式输出')
}; 