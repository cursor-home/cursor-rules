/**
 * webview/index.ts
 * 
 * WebView模块入口文件，导出所有WebView相关功能
 * 这个文件是提供给extension部分使用的入口，而index.tsx是WebView构建入口
 */

// 导出欢迎页面模块
export { showWelcomePage } from './welcome/showWelcomePage';

// 导出配置面板模块
// 注：showConfigPanel需要直接从configPanel目录导入，避免循环引用
export { showConfigPanel } from './configPanel/showConfigPanel'; 