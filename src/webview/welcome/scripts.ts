/**
 * Welcome Page Scripts
 * 
 * 欢迎页面的JavaScript脚本
 */

export function getWelcomePageScripts(): string {
    return `
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
    `;
} 