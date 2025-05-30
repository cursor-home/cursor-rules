/**
 * Configuration Panel Commands
 * 
 * 负责注册和管理配置面板相关命令
 */

import * as vscode from 'vscode';
import { info } from '../logger/logger';
import { showConfigPanel } from '../webview/configPanel';

/**
 * 注册打开配置面板命令
 */
export const openConfigCommand = vscode.commands.registerCommand('cursor-rules-assistant.openConfigPanel', (context: vscode.ExtensionContext) => {
	info("通过命令打开配置面板");
	showConfigPanel(context);
}); 