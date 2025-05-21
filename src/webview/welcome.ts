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
        :root {
            --ai-primary: #3a86ff;
            --ai-secondary: #6610f2;
            --ai-accent: #8338ec;
            --ai-gradient-start: rgba(58, 134, 255, 0.05);
            --ai-gradient-end: rgba(131, 56, 236, 0.15);
            --card-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
            --animation-duration: 0.8s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(58, 134, 255, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(58, 134, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(58, 134, 255, 0); }
        }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: var(--vscode-foreground);
            padding: 30px 40px;
            line-height: 1.6;
            background-image: 
                radial-gradient(circle at 20% 20%, var(--ai-gradient-start) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, var(--ai-gradient-end) 0%, transparent 60%);
            background-attachment: fixed;
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 40px;
            animation: fadeIn var(--animation-duration) ease-out;
        }
        
        .ai-badge {
            display: inline-block;
            background: linear-gradient(135deg, var(--ai-primary), var(--ai-accent));
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(131, 56, 236, 0.3);
        }
        
        h1 {
            color: var(--vscode-textLink-foreground);
            font-size: 2.4em;
            margin-bottom: 0.3em;
            position: relative;
            display: inline-block;
        }
        
        h1::after {
            content: "";
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: linear-gradient(90deg, var(--ai-primary), var(--ai-accent));
            border-radius: 2px;
        }
        
        h2 {
            color: var(--vscode-editor-foreground);
            font-size: 1.8em;
            margin-top: 2em;
            margin-bottom: 0.8em;
            padding-bottom: 0.4em;
            border-bottom: 1px solid var(--vscode-panel-border);
            position: relative;
            animation: fadeIn var(--animation-duration) ease-out;
        }
        
        h2::before {
            content: "";
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 80px;
            height: 3px;
            background: linear-gradient(90deg, var(--ai-primary), var(--ai-accent));
            border-radius: 3px;
        }
        
        p {
            margin: 1em 0;
            font-size: 1.05em;
            line-height: 1.6;
        }
        
        .action-button {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 5px 10px 0;
            background: linear-gradient(135deg, var(--ai-primary), var(--ai-secondary));
            color: white;
            text-decoration: none;
            border-radius: 6px;
            cursor: pointer;
            border: none;
            box-shadow: 0 4px 12px rgba(58, 134, 255, 0.25);
            transition: all 0.3s ease;
            font-weight: 500;
            position: relative;
            overflow: hidden;
        }
        
        .action-button::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(58, 134, 255, 0.35);
        }
        
        .action-button:hover::after {
            opacity: 1;
        }
        
        .action-button:active {
            transform: translateY(1px);
        }
        
        .feature-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin: 30px 0;
            animation: fadeIn var(--animation-duration) ease-out;
        }
        
        .feature-box {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 12px;
            padding: 25px;
            background-color: var(--vscode-editor-background);
            transition: all 0.3s ease;
            box-shadow: var(--card-shadow);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .feature-box::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
            background: linear-gradient(90deg, var(--ai-primary), var(--ai-accent));
            opacity: 0.7;
        }
        
        .feature-box:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
        
        .feature-title {
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }
        
        .feature-title .emoji {
            font-size: 1.5em;
            margin-right: 12px;
            display: inline-block;
        }
        
        .feature-content {
            flex-grow: 1;
            margin-bottom: 15px;
        }
        
        .feature-actions {
            margin-top: auto;
        }
        
        .upcoming-feature {
            border-left: none;
            background: linear-gradient(135deg, var(--ai-gradient-start), var(--ai-gradient-end));
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
            animation: pulse 3s infinite;
        }
        
        .upcoming-feature::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                135deg,
                rgba(58, 134, 255, 0.05) 0%,
                rgba(102, 16, 242, 0.1) 50%,
                rgba(131, 56, 236, 0.15) 100%
            );
            z-index: -1;
        }
        
        .command {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 5px 10px;
            border-radius: 5px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
            display: inline-block;
            margin: 3px 0;
        }
        
        .github-badge {
            display: flex;
            align-items: center;
            margin: 20px auto;
            padding: 15px;
            border-radius: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            transition: all 0.3s ease;
            width: fit-content;
            box-shadow: var(--card-shadow);
            animation: float 6s ease-in-out infinite;
        }
        
        .github-badge:hover {
            background-color: var(--vscode-list-hoverBackground);
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
        }
        
        .github-logo {
            margin-right: 15px;
            width: 28px;
            height: 28px;
        }
        
        .github-stats {
            display: flex;
            align-items: center;
            color: var(--vscode-foreground);
        }
        
        .github-star {
            margin-right: 8px;
            width: 20px;
            height: 20px;
            color: #f1c40f;
        }
        
        .github-text {
            margin-left: 15px;
            color: var(--vscode-textLink-foreground);
            font-weight: 500;
        }
        
        .steps-container {
            background-color: var(--vscode-editor-background);
            border-radius: 12px;
            padding: 25px;
            box-shadow: var(--card-shadow);
            margin: 30px 0;
            animation: fadeIn var(--animation-duration) ease-out;
        }
        
        .steps-container ol {
            counter-reset: item;
            list-style-type: none;
            padding-left: 10px;
        }
        
        .steps-container li {
            position: relative;
            padding-left: 40px;
            margin-bottom: 15px;
            counter-increment: item;
        }
        
        .steps-container li::before {
            content: counter(item);
            position: absolute;
            left: 0;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, var(--ai-primary), var(--ai-accent));
            color: white;
            border-radius: 50%;
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .commands-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 15px;
            margin-top: 20px;
            animation: fadeIn var(--animation-duration) ease-out;
        }
        
        .command-item {
            background-color: var(--vscode-editor-background);
            border-radius: 8px;
            padding: 15px;
            box-shadow: var(--card-shadow);
            transition: all 0.3s ease;
        }
        
        .command-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .command-name {
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
        }
        
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        
        .ai-circle {
            position: fixed;
            border-radius: 50%;
            background: radial-gradient(
                circle,
                var(--ai-gradient-start) 0%,
                var(--ai-gradient-end) 100%
            );
            opacity: 0.4;
            z-index: -1;
        }
        
        .ai-circle-1 {
            width: 300px;
            height: 300px;
            top: -150px;
            right: -100px;
        }
        
        .ai-circle-2 {
            width: 200px;
            height: 200px;
            bottom: 100px;
            left: -100px;
        }
    </style>
</head>
<body>
    <div class="ai-circle ai-circle-1"></div>
    <div class="ai-circle ai-circle-2"></div>

    <div class="page-header">
        <div class="ai-badge">AI 驱动</div>
        <h1>欢迎使用 Cursor Rules Assistant</h1>
        <p>感谢您安装 Cursor Rules Assistant！这个 VSCode 扩展将帮助您快速设置和管理 Cursor Rules，提升您的项目开发体验。</p>
    </div>
    
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
    
    <div class="feature-box upcoming-feature">
        <div class="feature-title">
            <span class="emoji">🚀</span>
            <span>新功能即将到来</span>
        </div>
        <div class="feature-content">
            <p>我们不仅帮助您管理 Cursor Rules，<strong>基于 Cursor AI 的自动托管式管理功能正在研发中</strong>！</p>
            <p>未来功能亮点：</p>
            <ul>
                <li>智能托管式管理您的所有 Cursor Rules</li>
                <li>基于项目上下文自动调整和优化规则</li>
                <li>AI 辅助规则生成和维护</li>
                <li>智能策略建议和最佳实践推荐</li>
            </ul>
            <p><em>敬请期待，Stay tuned！</em></p>
        </div>
    </div>
    
    <h2>什么是 Cursor Rules?</h2>
    <p>Cursor Rules 是一组项目特定的规则和指导，可以帮助 Cursor AI 更好地理解您的代码库和项目需求。通过配置 Cursor Rules，您可以：</p>
    <ul>
        <li>提供项目结构和代码惯例的上下文</li>
        <li>定义项目特定的最佳实践</li>
        <li>改善 AI 生成代码的质量</li>
        <li><strong>实现智能化、自动化的代码辅助流程</strong></li>
        <li><strong>让 AI 更好地适应您的项目风格和要求</strong></li>
    </ul>
    
    <p>而 <strong>Cursor Rules Assistant</strong> 则是您管理这些规则的得力助手，不仅提供简单的规则管理功能，更致力于打造基于 Cursor AI 能力的<strong>智能托管式管理系统</strong>，让规则管理变得更加智能和高效。</p>
    
    <h2>主要功能</h2>
    
    <div class="feature-container">
        <div class="feature-box">
            <div class="feature-title">
                <span class="emoji">🔍</span>
                <span>自动检测技术栈</span>
            </div>
            <div class="feature-content">
                <p>插件可以自动分析您的项目，检测使用的编程语言、框架和库，为您推荐最适合的 Cursor Rules 配置。</p>
            </div>
            <div class="feature-actions">
                <button class="action-button" onclick="executeCommand('cursor-rules-assistant.detectTechStack')">检测项目技术栈</button>
            </div>
        </div>
        
        <div class="feature-box">
            <div class="feature-title">
                <span class="emoji">⚙️</span>
                <span>智能托管配置</span>
            </div>
            <div class="feature-content">
                <p>根据项目类型自动配置 Cursor Rules，或使用预定义模板快速入门。<strong>未来支持全自动托管管理</strong>，使规则始终保持最佳状态。</p>
            </div>
            <div class="feature-actions">
                <button class="action-button" onclick="executeCommand('cursor-rules-assistant.createCursorRules')">创建 Cursor Rules</button>
            </div>
        </div>
        
        <div class="feature-box">
            <div class="feature-title">
                <span class="emoji">🤖</span>
                <span>AI 辅助功能</span>
            </div>
            <div class="feature-content">
                <p>使用集成的 AI 功能生成代码、解答问题或进行编程对话。<strong>基于项目上下文的智能理解能力不断增强</strong>。</p>
            </div>
            <div class="feature-actions">
                <button class="action-button" onclick="executeCommand('cursor-rules-assistant.generateCode')">生成代码</button>
                <button class="action-button" onclick="executeCommand('cursor-rules-assistant.streamConversation')">AI 对话</button>
            </div>
        </div>
        
        <div class="feature-box">
            <div class="feature-title">
                <span class="emoji">📈</span>
                <span>持续优化</span>
            </div>
            <div class="feature-content">
                <p><strong>自动分析您的项目需求和代码模式，持续优化规则配置</strong>，让 AI 协作效率随着项目进展不断提高。</p>
            </div>
        </div>
    </div>
    
    <h2>快速入门</h2>
    <div class="steps-container">
        <ol>
            <li>打开您的项目文件夹</li>
            <li>点击活动栏中的 Cursor Rules 图标</li>
            <li>使用"创建 Cursor Rules"命令自动配置项目规则</li>
            <li>根据需要自定义生成的规则文件</li>
        </ol>
    </div>
    
    <h2>命令列表</h2>
    <div class="commands-container">
        <div class="command-item">
            <div class="command-name">打开配置面板</div>
            <span class="command">Cursor Rules Assistant: 打开配置面板</span>
        </div>
        <div class="command-item">
            <div class="command-name">创建规则</div>
            <span class="command">Cursor Rules Assistant: 创建Cursor Rules</span>
        </div>
        <div class="command-item">
            <div class="command-name">检测技术栈</div>
            <span class="command">Cursor Rules Assistant: 检测项目技术栈</span>
        </div>
        <div class="command-item">
            <div class="command-name">AI生成代码</div>
            <span class="command">Cursor Rules Assistant: 使用Cursor AI生成代码</span>
        </div>
    </div>
    
    <h2>设置选项</h2>
    <p>您可以通过 VSCode 设置页面或点击配置面板中的设置图标来自定义插件行为。</p>
    
    <div class="footer">
        <p>Cursor Rules Assistant - 让AI更懂你的项目</p>
    </div>
    
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
        
        // 添加页面动画和互动效果
        function addInteractiveEffects() {
            // 添加渐进显示效果
            const elements = document.querySelectorAll('h2, .feature-container, .steps-container, .commands-container');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, { threshold: 0.1 });
            
            elements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
        
        // 页面加载完成后执行
        window.addEventListener('load', () => {
            fetchGitHubStars();
            if ('IntersectionObserver' in window) {
                addInteractiveEffects();
            }
        });
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