/**
 * Welcome Page Display Logic
 * 
 * 负责显示欢迎页面的主要业务逻辑
 */

import * as vscode from 'vscode';
import { info, error } from '../../logger/logger';
import { generateWelcomeHtml } from './template';

/**
 * 显示欢迎页面
 * @param context 扩展上下文
 * @returns WebView面板实例
 */
export function showWelcomePage(context: vscode.ExtensionContext): vscode.WebviewPanel {
    info('=========== 开始显示欢迎页面 ===========');
    info(`扩展路径: ${context.extensionPath}`);
    
    try {
        // 记录当前活动编辑器信息
        const activeEditor = vscode.window.activeTextEditor;
        info(`当前活动编辑器: ${activeEditor ? activeEditor.document.uri.toString() : '无'}`);
        
        // 创建并显示webview面板
        info('创建新的WebView面板(cursorRulesWelcome)...');
        const panel = vscode.window.createWebviewPanel(
            'cursorRulesWelcome', // 视图标识
            'Cursor Rules Assistant 欢迎', // 面板标题
            vscode.ViewColumn.One, // 显示在编辑器的第一栏
            {
                enableScripts: true, // 启用JS
                retainContextWhenHidden: true, // 隐藏时保留状态
            }
        );
        
        info('WebView面板创建成功，准备设置HTML内容...');
        
        // 设置HTML内容
        try {
            panel.webview.html = generateWelcomeHtml();
            info('WebView面板HTML内容设置完成');
        } catch (htmlErr) {
            error(`设置WebView HTML内容时出错: ${htmlErr instanceof Error ? htmlErr.message : String(htmlErr)}`);
        }
        
        // 处理来自webview的消息
        panel.webview.onDidReceiveMessage(
            message => {
                info(`收到WebView消息: ${JSON.stringify(message)}`);
                switch (message.type) {
                    case 'executeCommand':
                        info(`WebView请求执行命令: ${message.command}`);
                        vscode.commands.executeCommand(message.command);
                        return;
                    case 'openLink':
                        info(`WebView请求打开链接: ${message.url}`);
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
        
        // 监听面板关闭事件
        panel.onDidDispose(() => {
            info('欢迎页面WebView已关闭');
        }, null, context.subscriptions);
        
        // 监听可见性变化
        panel.onDidChangeViewState(e => {
            info(`WebView面板可见性变化: ${e.webviewPanel.visible ? '可见' : '隐藏'}`);
        }, null, context.subscriptions);
        
        info('欢迎页面WebView设置完成并返回');
        return panel;
    } catch (err) {
        error(`显示欢迎页面时出错: ${err instanceof Error ? err.message : String(err)}`);
        error(`错误堆栈: ${err instanceof Error && err.stack ? err.stack : '无堆栈信息'}`);
        
        // 尝试再次创建一个简单的面板作为备选方案
        try {
            info('尝试创建简单备选WebView...');
            const fallbackPanel = vscode.window.createWebviewPanel(
                'cursorRulesFallback',
                'Cursor Rules Assistant',
                vscode.ViewColumn.One,
                { enableScripts: false }
            );
            fallbackPanel.webview.html = `
                <html><body>
                    <h1>欢迎使用 Cursor Rules Assistant</h1>
                    <p>出于技术原因，无法显示完整的欢迎页面。</p>
                    <p>您可以通过命令面板访问所有功能。</p>
                </body></html>
            `;
            info('备选WebView创建成功');
            return fallbackPanel;
        } catch (fallbackErr) {
            error(`创建备选WebView也失败: ${fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)}`);
            // 如果连备选方案都失败，则抛出错误
            throw err;
        }
    }
} 