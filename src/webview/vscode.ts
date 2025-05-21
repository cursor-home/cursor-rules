/**
 * vscode.ts
 * 
 * 提供WebView与VSCode扩展主进程通信的接口
 * 包装了acquireVsCodeApi()方法获取的VSCode API对象
 */

// 声明全局VSCode API
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// 获取VSCode API并缓存
let vscodeApiCache: ReturnType<typeof acquireVsCodeApi> | undefined;

function getVSCodeAPI() {
  if (!vscodeApiCache) {
    try {
      vscodeApiCache = acquireVsCodeApi();
    } catch (error) {
      console.error('Failed to acquire VS Code API:', error);
      // 创建一个模拟API用于开发环境
      vscodeApiCache = {
        postMessage: (message: any) => console.log('VSCode postMessage (mock):', message),
        getState: () => ({}),
        setState: (state: any) => console.log('VSCode setState (mock):', state)
      };
    }
  }
  return vscodeApiCache;
}

// 导出VSCode API接口
export const vscode = {
  /**
   * 向扩展主进程发送消息
   * 
   * @param message 要发送的消息对象
   */
  postMessage: (message: any) => {
    getVSCodeAPI().postMessage(message);
  },
  
  /**
   * 获取WebView状态
   * 
   * @returns 存储的状态对象
   */
  getState: () => {
    return getVSCodeAPI().getState();
  },
  
  /**
   * 设置WebView状态
   * 
   * @param state 要存储的状态对象
   */
  setState: (state: any) => {
    getVSCodeAPI().setState(state);
  }
}; 