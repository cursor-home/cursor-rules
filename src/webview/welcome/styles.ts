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
    `;
} 