/**
 * Welcome Page Display Logic
 * 
 * 负责显示欢迎页面的主要业务逻辑
 */

import * as vscode from 'vscode';
import { info, error } from '../../logger/logger';
import { generateWelcomeHtml } from './template';

// GitHub stars缓存相关常量
const GITHUB_STARS_CACHE_KEY = 'github_stars_cache';
const GITHUB_STARS_CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟的缓存有效期（毫秒）

/**
 * 获取并缓存GitHub stars数量
 * @param context 扩展上下文
 * @returns 缓存的star数量，如果没有缓存则返回null
 */
async function getCachedGitHubStars(context: vscode.ExtensionContext): Promise<number | null> {
    try {
        // 尝试从扩展全局缓存获取
        const cachedData = context.globalState.get<{ timestamp: number, stars: number }>(GITHUB_STARS_CACHE_KEY);
        
        if (cachedData) {
            const { timestamp, stars } = cachedData;
            const now = new Date().getTime();
            
            // 如果缓存未过期，使用缓存数据
            if (now - timestamp < GITHUB_STARS_CACHE_EXPIRY) {
                info(`使用缓存的GitHub star数量: ${stars}`);
                return stars;
            }
            
            info('缓存已过期，需要刷新GitHub star数量');
            // 尽管缓存过期，但仍然返回过期的缓存值作为备选
            return stars;
        }
        
        info('没有GitHub star数量的缓存');
        return null;
    } catch (err) {
        error(`获取缓存的GitHub star数量出错: ${err instanceof Error ? err.message : String(err)}`);
        return null;
    }
}

/**
 * 更新GitHub stars数量缓存
 * @param context 扩展上下文
 * @param stars star数量
 */
async function updateGitHubStarsCache(context: vscode.ExtensionContext, stars: number): Promise<void> {
    try {
        const cacheData = {
            timestamp: new Date().getTime(),
            stars
        };
        await context.globalState.update(GITHUB_STARS_CACHE_KEY, cacheData);
        info(`已更新GitHub star数量缓存: ${stars}`);
    } catch (err) {
        error(`更新GitHub star数量缓存失败: ${err instanceof Error ? err.message : String(err)}`);
    }
}

/**
 * 显示欢迎页面
 * @param context 扩展上下文
 * @returns WebView面板实例
 */
export function showWelcomePage(context: vscode.ExtensionContext): vscode.WebviewPanel | undefined {
    try {
        // 记录开始显示欢迎页面
        info('开始显示欢迎页面');
        
        // 获取扩展路径
        const extensionPath = context.extensionPath;
        info(`扩展路径: ${extensionPath}`);
        
        // 获取当前编辑器
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            info(`当前活动编辑器: ${activeEditor.document.fileName}`);
        } else {
            info('当前没有活动编辑器');
        }
        
        // 创建WebView面板
        const panel = vscode.window.createWebviewPanel(
            'cursorRulesWelcome', // 标识符
            'Cursor Rules Assistant', // 面板标题
            vscode.ViewColumn.One, // 显示在编辑器的哪个部分
            {
                enableScripts: true, // 启用JS脚本
                retainContextWhenHidden: true, // 隐藏时保留内容
            }
        );
        
        // 设置HTML内容
        panel.webview.html = generateWelcomeHtml();
        
        // 处理从WebView接收的消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openCommand':
                        // 执行命令
                        info(`从WebView接收到执行命令请求: ${message.commandId}`);
                        vscode.commands.executeCommand(message.commandId);
                        return;
                    case 'openLink':
                        // 打开链接
                        info(`从WebView接收到打开链接请求: ${message.url}`);
                        vscode.env.openExternal(vscode.Uri.parse(message.url));
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
        
        // 监听面板关闭事件
        panel.onDidDispose(
            () => {
                info('欢迎页面已关闭');
            },
            null,
            context.subscriptions
        );
        
        // 监听面板可见性变化
        panel.onDidChangeViewState(
            e => {
                const panelVisible = e.webviewPanel.visible;
                info(`欢迎页面可见性变化: ${panelVisible ? '可见' : '隐藏'}`);
            },
            null,
            context.subscriptions
        );
        
        return panel;
    } catch (err) {
        // 错误处理
        error('显示欢迎页面时发生错误:', err);
        
        // 如果发生错误，尝试创建一个简单的WebView
        try {
            const panel = vscode.window.createWebviewPanel(
                'cursorRulesWelcome',
                'Cursor Rules Assistant',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );
            
            panel.webview.html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Cursor Rules Assistant</title>
                </head>
                <body>
                    <h1>欢迎使用 Cursor Rules Assistant</h1>
                    <p>抱歉，加载完整欢迎页面时出现错误。</p>
                    <p>请尝试使用命令面板访问扩展功能。</p>
                </body>
                </html>
            `;
            
            return panel;
        } catch (fallbackError) {
            error('创建后备欢迎页面时也发生错误:', fallbackError);
            return undefined;
        }
    }
} 