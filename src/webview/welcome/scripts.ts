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
    
    // 获取GitHub star数量，使用本地缓存和扩展全局缓存实现30分钟内不重复请求
    async function fetchGitHubStars() {
        const CACHE_KEY = 'github_stars_cache';
        const CACHE_EXPIRY = 30 * 60 * 1000; // 30分钟的缓存有效期（毫秒）
        
        try {
            // 尝试从本地存储缓存获取
            const cachedData = localStorage.getItem(CACHE_KEY);
            let useCache = false;
            let cachedStars = null;
            
            if (cachedData) {
                const { timestamp, stars } = JSON.parse(cachedData);
                const now = new Date().getTime();
                cachedStars = stars;
                
                // 如果缓存未过期，使用缓存数据
                if (now - timestamp < CACHE_EXPIRY) {
                    console.log('使用本地缓存的GitHub star数量');
                    document.getElementById('star-count').textContent = stars;
                    useCache = true;
                } else {
                    // 缓存已过期，但暂时显示缓存数据，同时在后台更新
                    console.log('本地缓存已过期，准备刷新GitHub star数量');
                    document.getElementById('star-count').textContent = stars;
                }
            }
            
            // 如果本地缓存有效，则不执行后续操作
            if (useCache) return;
            
            // 从GitHub API获取最新数据
            const response = await fetch('https://api.github.com/repos/cursor-home/cursor-rules');
            if (response.ok) {
                const data = await response.json();
                const starsCount = data.stargazers_count;
                
                // 更新显示
                document.getElementById('star-count').textContent = starsCount;
                
                // 保存到本地缓存
                const cacheData = {
                    timestamp: new Date().getTime(),
                    stars: starsCount
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                console.log('GitHub star数量已更新并缓存到本地');
                
                // 同步回扩展全局存储
                vscode.postMessage({
                    type: 'updateGitHubStars',
                    stars: starsCount
                });
            } else {
                // 如果请求失败但有缓存数据，保留缓存显示
                // 如果没有缓存或显示失败，则显示获取失败
                if (!cachedStars) {
                    document.getElementById('star-count').textContent = '获取失败';
                }
                console.error('获取GitHub star数量失败:', response.status);
            }
        } catch (error) {
            // 如果有缓存数据，保留缓存显示
            if (!localStorage.getItem(CACHE_KEY)) {
                document.getElementById('star-count').textContent = '获取失败';
            }
            console.error('获取GitHub star数量失败:', error);
        }
    }
    
    // 使用扩展缓存的GitHub star数量
    function updateFromExtensionCache(stars) {
        document.getElementById('star-count').textContent = stars;
        // 同步到本地存储
        const cacheData = {
            timestamp: new Date().getTime(),
            stars: stars
        };
        localStorage.setItem('github_stars_cache', JSON.stringify(cacheData));
        console.log('已从扩展更新GitHub star缓存');
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
    
    // 监听来自扩展的消息
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'cachedGitHubStars':
                // 使用扩展缓存的GitHub star数量
                console.log('收到扩展缓存的GitHub star数量:', message.stars);
                updateFromExtensionCache(message.stars);
                break;
        }
    });
    
    // 页面加载完成后执行
    window.addEventListener('load', () => {
        fetchGitHubStars();
        if ('IntersectionObserver' in window) {
            addInteractiveEffects();
        }
    });
    `;
} 