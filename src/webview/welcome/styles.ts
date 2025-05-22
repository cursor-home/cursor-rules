/**
 * Welcome Page Styles
 * 
 * 定义欢迎页面的CSS样式
 */

/**
 * 获取欢迎页面的样式
 * @returns CSS样式字符串
 */
export function getWelcomePageStyles(): string {
    return `
        :root {
            --primary-color: #2563eb;
            --secondary-color: #3b82f6;
            --accent-color: #1e40af;
            --text-color: #333;
            --text-light: #666;
            --bg-color: #fff;
            --card-bg: #f8fafc;
            --border-color: #e5e7eb;
            --gradient-start: #4f46e5;
            --gradient-end: #3b82f6;
            --animation-duration: 1.5s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
            animation: fadeIn 0.5s ease-in-out;
        }
        
        .welcome-container {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        
        .welcome-header {
            text-align: center;
            margin-bottom: 10px;
            position: relative;
        }
        
        .welcome-badge {
            display: inline-block;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            border-radius: 20px;
            padding: 5px 15px;
            margin-bottom: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: pulse var(--animation-duration) infinite ease-in-out;
        }
        
        .badge-text {
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        
        h1 {
            font-size: 2.2em;
            margin-bottom: 10px;
            color: var(--primary-color);
        }
        
        h2 {
            font-size: 1.7em;
            margin-bottom: 15px;
            color: var(--accent-color);
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 8px;
        }
        
        h3 {
            font-size: 1.3em;
            margin-bottom: 10px;
            color: var(--secondary-color);
        }
        
        p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .github-badge {
            display: flex;
            justify-content: center;
            margin: 15px 0;
        }
        
        .github-link {
            display: flex;
            align-items: center;
            background-color: #24292e;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        
        .github-link:hover {
            background-color: #1b1f23;
        }
        
        .github-icon {
            fill: white;
            margin-right: 8px;
        }
        
        .feature-box {
            background: linear-gradient(to right, #f0f9ff, #e0f2fe);
            border-radius: 10px;
            padding: 20px;
            position: relative;
            margin: 10px 0;
            border-left: 5px solid var(--primary-color);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .feature-tag {
            position: absolute;
            top: -10px;
            right: 20px;
            background-color: var(--accent-color);
            color: white;
            padding: 3px 10px;
            font-size: 12px;
            border-radius: 15px;
            font-weight: bold;
        }
        
        .welcome-section {
            margin-bottom: 30px;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .feature-card {
            background-color: var(--card-bg);
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--border-color);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }
        
        .button-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
        }
        
        .action-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.3s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .action-button:hover {
            background-color: var(--accent-color);
        }
        
        .commands-list {
            list-style-type: none;
            margin-left: 10px;
        }
        
        .commands-list li {
            margin-bottom: 10px;
            position: relative;
            padding-left: 20px;
        }
        
        .commands-list li::before {
            content: "•";
            color: var(--primary-color);
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        code {
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            color: var(--accent-color);
        }
        
        .welcome-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            color: var(--text-light);
            font-size: 14px;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .features-grid {
                grid-template-columns: 1fr;
            }
            
            body {
                padding: 15px;
            }
            
            h1 {
                font-size: 1.8em;
            }
            
            h2 {
                font-size: 1.5em;
            }
        }
    `;
} 