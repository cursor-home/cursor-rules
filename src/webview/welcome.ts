import * as vscode from 'vscode';

/**
 * 生成欢迎页面HTML内容
 */
export function getWelcomePageContent(): string {
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
    </style>
</head>
<body>
    <h1>欢迎使用 Cursor Rules Assistant</h1>
    <p>感谢您安装 Cursor Rules Assistant！这个 VSCode 扩展将帮助您快速设置和管理 Cursor Rules，提升您的项目开发体验。</p>
    
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
    </script>
</body>
</html>`;
}

/**
 * 显示欢迎页面
 * @param context 扩展上下文
 */
export function showWelcomePage(context: vscode.ExtensionContext): vscode.WebviewPanel {
    // 创建并显示webview面板
    const panel = vscode.window.createWebviewPanel(
        'cursorRulesWelcome', // 视图标识
        'Cursor Rules Assistant 欢迎', // 面板标题
        vscode.ViewColumn.One, // 显示在编辑器的第一栏
        {
            enableScripts: true, // 启用JS
            retainContextWhenHidden: true, // 隐藏时保留状态
        }
    );

    // 设置HTML内容
    panel.webview.html = getWelcomePageContent();

    // 处理来自webview的消息
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.type) {
                case 'executeCommand':
                    vscode.commands.executeCommand(message.command);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
} 