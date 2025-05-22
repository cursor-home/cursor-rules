/**
 * Welcome Page Scripts
 * 
 * 欢迎页面的JavaScript脚本
 */

/**
 * 获取欢迎页面的JavaScript脚本
 * @returns JavaScript脚本字符串
 */
export function getWelcomePageScripts(): string {
    return `
    const vscode = acquireVsCodeApi();
    
    function executeCommand(commandId) {
        vscode.postMessage({
            command: 'openCommand',
            commandId: commandId
        });
    }
    
    // 打开GitHub仓库
    function openGitHubRepo() {
        vscode.postMessage({
            command: 'openLink',
            url: 'https://github.com/cc11001100/cursor-rules'
        });
    }
    
    // 获取GitHub星数
    async function fetchGitHubStars() {
        try {
            const githubStarsElement = document.getElementById('github-stars');
            if (githubStarsElement) {
                // 设置默认值
                githubStarsElement.textContent = '--';
                
                // 尝试获取星数
                try {
                    const response = await fetch('https://api.github.com/repos/cc11001100/cursor-rules');
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.stargazers_count !== undefined) {
                            githubStarsElement.textContent = data.stargazers_count.toString();
                            
                            // 通知扩展保存星数
                            vscode.postMessage({
                                command: 'updateGitHubStars',
                                stars: data.stargazers_count
                            });
                        }
                    }
                } catch (err) {
                    console.error('获取GitHub星数时出错:', err);
                }
            }
        } catch (err) {
            console.error('处理GitHub星数时出错:', err);
        }
    }
    
    // 添加交互效果
    function addEffects() {
        // 使用Intersection Observer为元素添加出现动画
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // 为特性卡片添加观察
        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });
        
        // 为欢迎页面的各个部分添加观察
        document.querySelectorAll('.welcome-section').forEach(section => {
            observer.observe(section);
        });
        
        // 为按钮添加点击事件
        document.querySelectorAll('.action-button').forEach(button => {
            button.addEventListener('click', () => {
                const commandId = button.getAttribute('data-command');
                if (commandId) {
                    executeCommand(commandId);
                }
            });
        });
        
        // 为GitHub链接添加点击事件
        const githubLink = document.getElementById('github-link');
        if (githubLink) {
            githubLink.addEventListener('click', (e) => {
                e.preventDefault();
                openGitHubRepo();
            });
        }
    }
    
    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', () => {
        // 获取GitHub星数
        fetchGitHubStars();
        
        // 添加交互效果
        addEffects();
    });
    `;
} 