/**
 * Configuration Panel HTML Template
 * 
 * 负责生成配置面板的HTML模板，包含必要的脚本和样式
 */

import * as vscode from 'vscode';
import { getNonce } from './utils';

/**
 * 生成配置面板HTML内容
 * @param webviewView WebView视图
 * @param extensionUri 扩展URI
 * @returns HTML字符串
 */
export function generateConfigPanelHtml(webviewView: vscode.Webview, extensionUri: vscode.Uri): string {
    // 获取脚本URI和nonce
    const scriptUri = webviewView.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js'));
    const nonce = getNonce();
    
    // 返回HTML
    return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webviewView.cspSource} 'unsafe-inline';">
            <title>Cursor Rules Assistant</title>
            <style nonce="${nonce}">
                .debug-panel {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background: #f1f1f1;
                    border-top: 1px solid #ccc;
                    padding: 10px;
                    font-family: monospace;
                    max-height: 200px;
                    overflow: auto;
                    display: none;
                }
                .error { color: red; }
                .warning { color: orange; }
                .info { color: blue; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <div id="debug-panel" class="debug-panel"></div>
            <script nonce="${nonce}">
                // Add debug logging
                const debugPanel = document.getElementById('debug-panel');
                
                // Override console methods to capture logs
                const originalConsole = {
                    log: console.log,
                    warn: console.warn,
                    error: console.error,
                    info: console.info
                };
                
                function showDebugPanel() {
                    debugPanel.style.display = 'block';
                }
                
                function logToPanel(type, args) {
                    try {
                        const entry = document.createElement('div');
                        entry.className = type;
                        const timestamp = new Date().toISOString().substr(11, 8);
                        entry.textContent = \`[\${timestamp}] [\${type.toUpperCase()}] \${Array.from(args).map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}\`;
                        debugPanel.appendChild(entry);
                        debugPanel.scrollTop = debugPanel.scrollHeight;
                        showDebugPanel();
                    } catch (e) {
                        originalConsole.error('Error in debug logger:', e);
                    }
                }
                
                // Override console methods
                console.log = function() { 
                    logToPanel('log', arguments); 
                    originalConsole.log.apply(console, arguments);
                };
                console.warn = function() { 
                    logToPanel('warning', arguments); 
                    originalConsole.warn.apply(console, arguments);
                };
                console.error = function() { 
                    logToPanel('error', arguments); 
                    originalConsole.error.apply(console, arguments);
                };
                console.info = function() { 
                    logToPanel('info', arguments); 
                    originalConsole.info.apply(console, arguments);
                };
                
                // Global error handler
                window.onerror = function(message, source, lineno, colno, error) {
                    console.error('GLOBAL ERROR:', message, 'at', source, lineno, colno);
                    if (error && error.stack) {
                        console.error('Stack:', error.stack);
                    }
                    return false;
                };
                
                // Log startup
                console.info('WebView debug initialized');
                
                // Protection around script loading
                try {
                    console.log('Loading webview.js from:', '${scriptUri}');
                } catch (e) {
                    console.error('Error before loading script:', e);
                }
            </script>
            <script nonce="${nonce}">
                // Wrap script loading in try-catch
                try {
                    console.log('Attempting to load webview script...');
                    
                    // Create script element
                    const script = document.createElement('script');
                    script.nonce = '${nonce}';
                    script.src = '${scriptUri}';
                    script.onerror = function(e) {
                        console.error('Script load error:', e);
                        showDebugPanel();
                    };
                    script.onload = function() {
                        console.log('Script loaded successfully');
                    };
                    
                    // Append script to body
                    document.body.appendChild(script);
                } catch (e) {
                    console.error('Error during script creation:', e);
                    showDebugPanel();
                }
            </script>
        </body>
        </html>`;
} 