/**
 * Welcome Page Template
 * 
 * 负责生成欢迎页面的HTML模板，整合样式、脚本和内容
 */

import { getWelcomePageStyles } from './styles';
import { getWelcomePageScripts } from './scripts';
import { getWelcomePageContent } from './content';

/**
 * 生成完整的欢迎页HTML
 * @returns 欢迎页HTML字符串
 */
export function generateWelcomeHtml(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Rules Assistant</title>
    <style>
        ${getWelcomePageStyles()}
    </style>
</head>
<body>
    <div class="ai-circle ai-circle-1"></div>
    <div class="ai-circle ai-circle-2"></div>

    ${getWelcomePageContent()}
    
    <script>
        ${getWelcomePageScripts()}
    </script>
</body>
</html>`;
} 