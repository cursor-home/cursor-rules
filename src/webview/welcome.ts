import * as vscode from 'vscode';
import { info, error, warn } from '../logger/logger';

/**
 * 生成欢迎页面HTML内容
 */
export function getWelcomePageContent(): string {
    info('生成欢迎页面HTML内容');
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>欢迎使用 Cursor Rules Assistant</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: var(--vscode-foreground);
            padding: 20px;
            line-height: 1.5;
        }
        h1 {
            color: var(--vscode-textLink-foreground);
            font-size: 2em;
            margin-bottom: 0.5em;
        }
        h2 {
            color: var(--vscode-editor-foreground);
            font-size: 1.5em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            padding-bottom: 0.2em;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        p {
            margin: 0.8em 0;
        }
        .action-button {
            display: inline-block;
            padding: 8px 16px;
            margin: 10px 0;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            text-decoration: none;
            border-radius: 3px;
            cursor: pointer;
            border: none;
        }
        .action-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .feature-box {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            background-color: var(--vscode-editor-background);
        }
        .feature-title {
            font-weight: bold;
            margin-bottom: 8px;
        }
        .command {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
        }
        .github-badge {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            border-radius: 5px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            transition: background-color 0.2s;
            width: fit-content;
        }
        .github-badge:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .github-logo {
            margin-right: 10px;
            width: 24px;
            height: 24px;
        }
        .github-stats {
            display: flex;
            align-items: center;
            color: var(--vscode-foreground);
        }
        .github-star {
            margin-right: 5px;
            width: 16px;
            height: 16px;
        }
        .github-text {
            margin-left: 10px;
            color: var(--vscode-textLink-foreground);
        }
    </style>
</head>
<body>
    <h1>欢迎使用 Cursor Rules Assistant</h1>
    <p>感谢您安装 Cursor Rules Assistant！这个 VSCode 扩展将帮助您快速设置和管理 Cursor Rules，提升您的项目开发体验。</p>
    
    <!-- GitHub徽标和star数 -->
    <div class="github-badge" onclick="openGitHubRepo()">
        <svg class="github-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
        </svg>
        <div class="github-stats">
            <svg class="github-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/>
            </svg>
            <span id="star-count">加载中...</span>
        </div>
        <span class="github-text">star支持一下</span>
    </div>
    
    <h2>什么是 Cursor Rules?</h2>
    <p>Cursor Rules 是一组项目特定的规则和指导，可以帮助 Cursor AI 更好地理解您的代码库和项目需求。通过配置 Cursor Rules，您可以：</p>
    <ul>
        <li>提供项目结构和代码惯例的上下文</li>
        <li>定义项目特定的最佳实践</li>
        <li>改善 AI 生成代码的质量</li>
    </ul>
    
    <h2>主要功能</h2>
    
    <div class="feature-box">
        <div class="feature-title">🔍 自动检测技术栈</div>
        <p>插件可以自动分析您的项目，检测使用的编程语言、框架和库，为您推荐最适合的 Cursor Rules 配置。</p>
        <button class="action-button" onclick="executeCommand('cursor-rules-assistant.detectTechStack')">检测项目技术栈</button>
    </div>
    
    <div class="feature-box">
        <div class="feature-title">⚙️ 快速配置</div>
        <p>根据项目类型自动配置 Cursor Rules，或使用预定义模板快速入门。</p>
        <button class="action-button" onclick="executeCommand('cursor-rules-assistant.createCursorRules')">创建 Cursor Rules</button>
    </div>
    
    <div class="feature-box">
        <div class="feature-title">🤖 AI 辅助功能</div>
        <p>使用集成的 AI 功能生成代码、解答问题或进行编程对话。</p>
        <button class="action-button" onclick="executeCommand('cursor-rules-assistant.generateCode')">生成代码</button>
        <button class="action-button" onclick="executeCommand('cursor-rules-assistant.streamConversation')">AI 对话</button>
    </div>
    
    <h2>快速入门</h2>
    <ol>
        <li>打开您的项目文件夹</li>
        <li>点击活动栏中的 Cursor Rules 图标</li>
        <li>使用"创建 Cursor Rules"命令自动配置项目规则</li>
        <li>根据需要自定义生成的规则文件</li>
    </ol>
    
    <h2>命令列表</h2>
    <ul>
        <li><span class="command">Cursor Rules Assistant: 打开配置面板</span> - 打开插件配置界面</li>
        <li><span class="command">Cursor Rules Assistant: 创建Cursor Rules</span> - 为当前项目创建规则</li>
        <li><span class="command">Cursor Rules Assistant: 检测项目技术栈</span> - 分析项目技术栈</li>
        <li><span class="command">Cursor Rules Assistant: 使用Cursor AI生成代码</span> - AI辅助代码生成</li>
    </ul>
    
    <h2>设置选项</h2>
    <p>您可以通过 VSCode 设置页面或点击配置面板中的设置图标来自定义插件行为。</p>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function executeCommand(command) {
            vscode.postMessage({
                type: 'executeCommand',
                command: command
            });
        }
        
        // 打开GitHub仓库
        function openGitHubRepo() {
            vscode.postMessage({
                type: 'openLink',
                url: 'https://github.com/cursor-home/cursor-rules'
            });
        }
        
        // 获取GitHub star数量
        async function fetchGitHubStars() {
            try {
                const response = await fetch('https://api.github.com/repos/cursor-home/cursor-rules');
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('star-count').textContent = data.stargazers_count;
                } else {
                    document.getElementById('star-count').textContent = '获取失败';
                }
            } catch (error) {
                console.error('获取GitHub star数量失败:', error);
                document.getElementById('star-count').textContent = '获取失败';
            }
        }
        
        // 页面加载完成后获取star数量
        window.addEventListener('load', fetchGitHubStars);
    </script>
</body>
</html>`;
}

/**
 * 显示欢迎页面
 * @param context 扩展上下文
 */
export function showWelcomePage(context: vscode.ExtensionContext): vscode.WebviewPanel {
    info('=========== 开始显示欢迎页面 ===========');
    info(`扩展路径: ${context.extensionPath}`);
    
    try {
        // 记录当前活动编辑器信息
        const activeEditor = vscode.window.activeTextEditor;
        info(`当前活动编辑器: ${activeEditor ? activeEditor.document.uri.toString() : '无'}`);
        
        // 记录当前已打开的WebView面板
        info('尝试获取当前已打开的WebView面板数量...');
        
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
            panel.webview.html = getWelcomePageContent();
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