/**
 * Configuration Panel Display Logic
 * 
 * 负责创建和管理配置面板WebView
 */

import * as vscode from 'vscode';
import { info, error, debug } from '../../logger/logger';
import { generateConfigPanelHtml } from './template';
import { 
    handleGetRuleList, 
    handleCreateRule, 
    handleGetRuleDetail, 
    handleOpenRule, 
    handleDeleteRule, 
    handleEditRule 
} from '../../messageHandlers/ruleHandlers';

// 全局引用，确保同一时间只有一个面板
// 导出变量，允许其他模块访问配置面板实例
export let configPanelInstance: vscode.WebviewPanel | undefined;

/**
 * 显示配置面板
 * @param context 扩展上下文
 * @returns WebView面板实例
 */
export function showConfigPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    info("正在打开配置面板...");

    // 如果已存在配置面板，则直接显示
    if (configPanelInstance) {
        info("配置面板已存在，将其展示到前面");
        configPanelInstance.reveal();
        return configPanelInstance;
    }

    // 创建新的配置面板
    info("创建新的配置面板WebView...");
    configPanelInstance = vscode.window.createWebviewPanel(
        'cursorRulesConfig', // 视图类型
        'Cursor Rules Assistant 配置', // 面板标题
        vscode.ViewColumn.One, // 在编辑器的第一栏打开
        {
            enableScripts: true, // 启用JavaScript
            retainContextWhenHidden: true, // 隐藏时保留状态
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'dist') // 允许的本地资源路径
            ]
        }
    );

    // 设置HTML内容
    try {
        configPanelInstance.webview.html = generateConfigPanelHtml(
            configPanelInstance.webview, 
            context.extensionUri
        );
        info("配置面板HTML内容设置成功");
    } catch (e: any) {
        error("创建WebView内容时出错", e);
        if (configPanelInstance) {
            configPanelInstance.webview.html = `<html><body><h1>加载配置面板时出错</h1><p>错误详情: ${e.message}</p></body></html>`;
        }
    }

    // 处理面板关闭事件
    configPanelInstance.onDidDispose(() => {
        configPanelInstance = undefined;
        info("配置面板已关闭");
    }, null, context.subscriptions);
    
    // 处理WebView消息
    configPanelInstance.webview.onDidReceiveMessage(
        message => {
            info('收到WebView消息:', message);
            
            // 处理调试日志消息
            if (message.type === 'debug-log') {
                debug(`WebView调试: ${message.text}`);
            }
            
            // 处理错误消息
            if (message.type === 'error') {
                error(`WebView错误: ${message.text}`, message.error);
            }

            // 处理规则列表请求
            if (message.type === 'getRuleList') {
                handleGetRuleList(message);
            }

            // 处理创建规则请求
            if (message.type === 'createRule') {
                handleCreateRule(message);
            }

            // 处理获取规则详情请求
            if (message.type === 'getRuleDetail') {
                handleGetRuleDetail(message);
            }

            // 处理打开规则文件请求
            if (message.type === 'openRule') {
                handleOpenRule(message);
            }

            // 处理删除规则请求
            if (message.type === 'deleteRule') {
                handleDeleteRule(message);
            }

            // 处理编辑规则请求
            if (message.type === 'editRule') {
                handleEditRule(message);
            }
        },
        undefined,
        context.subscriptions
    );
    
    info("配置面板设置完成");
    return configPanelInstance;
} 