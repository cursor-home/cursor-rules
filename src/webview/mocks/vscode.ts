/**
 * VSCode API模拟模块
 * 
 * 这个模块为WebView环境提供一个简化的vscode API模拟，
 * 以支持在WebView代码中导入vscode模块而不会导致Webpack编译错误。
 * 
 * 注意：这只是一个模拟模块，仅用于编译目的，不提供任何实际功能。
 * WebView应通过消息传递机制与实际的VSCode API通信。
 */

// 通用类型定义
export interface Uri {
  toString(): string;
  fsPath: string;
  scheme: string;
  // 只包含在WebView中使用的属性
}

export interface WebviewOptions {
  enableScripts?: boolean;
  localResourceRoots?: Uri[];
  // 其他在WebView中使用的选项
}

export interface Webview {
  asWebviewUri(localResource: Uri): Uri;
  cspSource: string;
  onDidReceiveMessage: any;
  postMessage(message: any): Thenable<boolean>;
  // 其他在WebView中使用的方法
}

// WebView环境需要的命名空间
export namespace window {
  export function createOutputChannel(name: string): any {
    // 模拟实现
    return {
      appendLine: (value: string) => {},
      append: (value: string) => {},
      clear: () => {},
      show: (preserveFocus?: boolean) => {},
      hide: () => {},
      dispose: () => {}
    };
  }

  export function showInformationMessage(message: string, ...items: string[]): Thenable<string | undefined> {
    // 模拟实现
    return Promise.resolve(undefined);
  }

  export function showWarningMessage(message: string, ...items: string[]): Thenable<string | undefined> {
    // 模拟实现
    return Promise.resolve(undefined);
  }

  export function showErrorMessage(message: string, ...items: string[]): Thenable<string | undefined> {
    // 模拟实现
    return Promise.resolve(undefined);
  }

  // 其他可能在WebView中使用的函数
}

// 命令命名空间
export namespace commands {
  export function registerCommand(command: string, callback: (...args: any[]) => any): any {
    // 模拟实现
    return { dispose: () => {} };
  }

  export function executeCommand<T>(command: string, ...args: any[]): Thenable<T | undefined> {
    // 模拟实现
    return Promise.resolve(undefined);
  }
}

// URI辅助函数
export namespace Uri {
  export function joinPath(base: Uri, ...pathSegments: string[]): Uri {
    // 模拟实现
    return {
      toString: () => "",
      fsPath: "",
      scheme: ""
    };
  }
}

// 工作区命名空间
export namespace workspace {
  export function getConfiguration(section?: string): any {
    // 模拟实现
    return {
      get: (key: string, defaultValue?: any) => defaultValue,
      update: (key: string, value: any, target?: any) => Promise.resolve()
    };
  }
}

// 这个默认导出是为了支持`import * as vscode from 'vscode';`语法
export default {
  Uri,
  window,
  commands,
  workspace
}; 