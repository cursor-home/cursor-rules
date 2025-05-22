import * as vscode from 'vscode';
import { showWelcomePage } from '../webview/welcome/index';

/**
 * Register open welcome page command
 */
export const openWelcomePageCommand = vscode.commands.registerCommand('cursor-rules-assistant.openWelcomePageWithContext', (context: vscode.ExtensionContext) => {
	showWelcomePage(context);
}); 