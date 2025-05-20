import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import { ConfigPanel } from './ConfigPanel';

// 使用VSCode的webview通信API
declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: any) => void;
      getState: () => any;
      setState: (state: any) => void;
    };
  }
}

// 获取VSCode API
const vscode = window.acquireVsCodeApi();

// 创建根元素并渲染React应用
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ConfigPanel vscode={vscode} />
    </React.StrictMode>
  );
} 