import * as vscode from 'vscode';
import { showWelcomePage } from '../webview/welcome';

/**
 * Register open welcome page command
 */
export const openWelcomePageCommand = vscode.commands.registerCommand('_cursor-rules-assistant.openWelcomePageWithContext', (context: vscode.ExtensionContext) => {
	showWelcomePage(context);
}); 