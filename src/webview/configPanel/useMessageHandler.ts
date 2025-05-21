import { useCallback, useEffect, useState } from 'react';
import { VSCodeAPI } from './types';

// Define message handler type
export type MessageHandler = (message: any) => void;

export const useMessageHandler = (vscode: VSCodeAPI) => {
    const [messageHandlers, setMessageHandlers] = useState<{ [key: string]: MessageHandler }>({});

    // Setup the message event listener
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            console.log('[DEBUG useMessageHandler] 收到消息:', JSON.stringify(message));

            // Call the appropriate handler based on message type
            if (message && message.type && messageHandlers[message.type]) {
                console.log(`[DEBUG useMessageHandler] 找到消息类型的处理器: ${message.type}`);
                messageHandlers[message.type](message);
            } else if (message && message.type) {
                console.log(`[DEBUG useMessageHandler] 未注册该消息类型的处理器: ${message.type}`);
            } else {
                console.log('[DEBUG useMessageHandler] 收到无效格式的消息');
            }
        };

        console.log('[DEBUG useMessageHandler] 添加全局消息监听器');
        // Add event listener
        window.addEventListener('message', handleMessage);

        // Remove event listener on cleanup
        return () => {
            console.log('[DEBUG useMessageHandler] 移除全局消息监听器');
            window.removeEventListener('message', handleMessage);
        };
    }, [messageHandlers]);

    // Register a handler for a specific message type
    const registerHandler = useCallback((messageType: string, handler: MessageHandler) => {
        console.log(`[DEBUG useMessageHandler] 注册消息类型的处理器: ${messageType}`);
        setMessageHandlers(prevHandlers => ({
            ...prevHandlers,
            [messageType]: handler
        }));
    }, []);

    // Unregister a handler
    const unregisterHandler = useCallback((messageType: string) => {
        console.log(`[DEBUG useMessageHandler] 注销消息类型的处理器: ${messageType}`);
        setMessageHandlers(prevHandlers => {
            const newHandlers = { ...prevHandlers };
            delete newHandlers[messageType];
            return newHandlers;
        });
    }, []);

    return { registerHandler, unregisterHandler };
}; 