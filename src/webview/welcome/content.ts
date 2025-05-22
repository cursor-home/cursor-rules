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
    <div class="welcome-container">
      <header class="welcome-header">
        <div class="welcome-badge">
          <span class="badge-text">助手</span>
        </div>
        <h1>欢迎使用 Cursor Rules Assistant</h1>
      </header>
      
      <div class="github-badge">
        <a href="#" id="github-link" class="github-link">
          <svg height="20" viewBox="0 0 16 16" width="20" class="github-icon">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          <span id="github-stars">--</span> Stars
        </a>
      </div>
      
      <div class="feature-box">
        <span class="feature-tag">即将推出</span>
        <h3>Cursor AI 赋能</h3>
        <p>我们正在开发一系列基于 Cursor AI 的智能辅助功能，敬请期待！</p>
      </div>
      
      <section class="welcome-section">
        <h2>什么是 Cursor Rules？</h2>
        <p>
          Cursor Rules 是一种强大的方式，让您可以为 Cursor AI 提供特定上下文和指导，
          使其更好地理解您的特定项目、代码风格和最佳实践。
        </p>
        <p>
          通过定义规则，您可以显著提高 AI 输出的质量和准确性，使其更符合您的项目需求和期望。
        </p>
      </section>
      
      <section class="welcome-section">
        <h2>主要功能</h2>
        <div class="features-grid">
          <div class="feature-card">
            <h3>自动技术栈检测</h3>
            <p>智能识别您的项目技术栈，自动应用最适合的规则和配置</p>
          </div>
          
          <div class="feature-card">
            <h3>智能管理配置</h3>
            <p>轻松创建、编辑和管理规则，无需手动编辑复杂的JSON配置</p>
          </div>
          
          <div class="feature-card">
            <h3>AI 辅助功能</h3>
            <p>集成多种AI辅助能力，自动生成规则建议，提高开发效率（开发中）</p>
          </div>
          
          <div class="feature-card">
            <h3>持续优化</h3>
            <p>根据您的使用习惯不断优化和改进，让AI反馈更符合您的需求</p>
          </div>
        </div>
      </section>
      
      <section class="welcome-section">
        <h2>快速开始</h2>
        <p>要开始使用 Cursor Rules Assistant，您可以：</p>
        <div class="button-container">
          <button class="action-button" data-command="cursor-rules-assistant.openConfigPanel">
            打开配置面板
          </button>
          <button class="action-button" data-command="cursor-rules-assistant.detectProjectType">
            检测项目类型
          </button>
        </div>
      </section>
      
      <section class="welcome-section">
        <h2>命令列表</h2>
        <ul class="commands-list">
          <li><code>Cursor Rules: 打开配置面板</code> - 打开规则管理界面</li>
          <li><code>Cursor Rules: 检测项目类型</code> - 智能检测当前项目类型</li>
          <li><code>Cursor Rules: 打开欢迎页面</code> - 显示此欢迎页面</li>
        </ul>
      </section>
      
      <footer class="welcome-footer">
        <p>Cursor Rules Assistant - 让AI更好地理解您的项目</p>
      </footer>
    </div>
  `;
} 