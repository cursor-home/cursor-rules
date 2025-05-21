/**
 * webview/index.tsx
 * 
 * WebView入口文件，负责渲染配置面板
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ConfigPanel } from './configPanel';
import { vscode as vscodeApi } from './vscode';
import './index.css';

// 获取挂载点
const rootElement = document.getElementById('root');

// 渲染配置面板
if (rootElement) {
  // 使用React 18的createRoot API
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ConfigPanel vscode={vscodeApi} />
    </React.StrictMode>
  );
} 