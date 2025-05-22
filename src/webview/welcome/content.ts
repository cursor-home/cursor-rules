/**
 * Welcome Page Content
 * 
 * 定义欢迎页面的HTML内容结构
 */

/**
 * 获取欢迎页面的HTML内容
 * @returns HTML内容字符串
 */
export function getWelcomePageContent(): string {
    return `
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
        
        <div class="feature-box upcoming-feature">
            <div class="feature-title">
                <span class="emoji">🤖</span>
                <span>AI 辅助功能</span>
                <span style="margin-left: 8px; font-size: 0.75em; background-color: rgba(255, 193, 7, 0.2); color: #ff9800; padding: 2px 8px; border-radius: 10px; font-weight: normal;">研发中</span>
            </div>
            <div class="feature-content">
                <p>使用集成的 AI 功能生成代码、解答问题或进行编程对话。<strong>基于项目上下文的智能理解能力不断增强</strong>。</p>
                <p style="font-style: italic; opacity: 0.8; margin-top: 10px;">该功能目前正在研发中，即将推出，敬请期待！</p>
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
        <div class="command-item" style="opacity: 0.7; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 5px; right: 5px; font-size: 0.65em; background-color: rgba(255, 193, 7, 0.2); color: #ff9800; padding: 2px 8px; border-radius: 10px;">研发中</div>
            <div class="command-name">AI生成代码</div>
            <span class="command">Cursor Rules Assistant: 使用Cursor AI生成代码</span>
        </div>
    </div>
    
    <h2>设置选项</h2>
    <p>您可以通过 VSCode 设置页面或点击配置面板中的设置图标来自定义插件行为。</p>
    
    <div class="footer">
        <p>Cursor Rules Assistant - 让AI更懂你的项目</p>
    </div>
    `
} 