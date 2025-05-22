import * as vscode from 'vscode';
import { info, error, debug } from '../logger/logger';
import { handleGetRuleList, handleCreateRule, handleGetRuleDetail, handleOpenRule, handleDeleteRule, handleEditRule } from './ruleHandlers';

/**
 * ConfigPanel WebviewPanel instance
 */
export let configPanel: vscode.WebviewPanel | undefined;

/**
 * Register open config panel command
 * Uses internal command ID, called by public command cursor-rules-assistant.openConfig with context
 */
export const openConfigCommand = vscode.commands.registerCommand('_cursor-rules-assistant.openConfigWithContext', (context: vscode.ExtensionContext) => {
	// If config panel already exists, just show it
	if (configPanel) {
		configPanel.reveal();
		return;
	}

	info("Opening configuration panel...");

	// Create new config panel
	configPanel = vscode.window.createWebviewPanel(
		'cursorRulesConfig', // View type
		'Cursor Rules Assistant Configuration', // Panel title
		vscode.ViewColumn.One, // Open in editor's first column
		{
			enableScripts: true, // Enable JavaScript
			retainContextWhenHidden: true, // Retain state when hidden
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'dist') // Allowed local resource paths
			]
		}
	);

	// Get WebviewContent
	try {
		const scriptUri = configPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js'));
		const nonce = getNonce();
		
		info(`Script URI: ${scriptUri}`);
		debug(`Nonce generated: ${nonce.substring(0, 8)}...`);

		// Set HTML content with debugging script
		configPanel.webview.html = `<!DOCTYPE html>
			<html lang="en-US">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${configPanel.webview.cspSource} 'unsafe-inline';">
				<title>Cursor Rules Assistant</title>
				<style nonce="${nonce}">
					.debug-panel {
						position: fixed;
						bottom: 0;
						left: 0;
						width: 100%;
						background: #f1f1f1;
						border-top: 1px solid #ccc;
						padding: 10px;
						font-family: monospace;
						max-height: 200px;
						overflow: auto;
						display: none;
					}
					.error { color: red; }
					.warning { color: orange; }
					.info { color: blue; }
				</style>
			</head>
			<body>
				<div id="root"></div>
				<div id="debug-panel" class="debug-panel"></div>
				<script nonce="${nonce}">
					// Add debug logging
					const debugPanel = document.getElementById('debug-panel');
					
					// Override console methods to capture logs
					const originalConsole = {
						log: console.log,
						warn: console.warn,
						error: console.error,
						info: console.info
					};
					
					function showDebugPanel() {
						debugPanel.style.display = 'block';
					}
					
					function logToPanel(type, args) {
						try {
							const entry = document.createElement('div');
							entry.className = type;
							const timestamp = new Date().toISOString().substr(11, 8);
							entry.textContent = \`[\${timestamp}] [\${type.toUpperCase()}] \${Array.from(args).map(arg => 
								typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}\`;
							debugPanel.appendChild(entry);
							debugPanel.scrollTop = debugPanel.scrollHeight;
							showDebugPanel();
						} catch (e) {
							originalConsole.error('Error in debug logger:', e);
						}
					}
					
					// Override console methods
					console.log = function() { 
						logToPanel('log', arguments); 
						originalConsole.log.apply(console, arguments);
					};
					console.warn = function() { 
						logToPanel('warning', arguments); 
						originalConsole.warn.apply(console, arguments);
					};
					console.error = function() { 
						logToPanel('error', arguments); 
						originalConsole.error.apply(console, arguments);
					};
					console.info = function() { 
						logToPanel('info', arguments); 
						originalConsole.info.apply(console, arguments);
					};
					
					// Global error handler
					window.onerror = function(message, source, lineno, colno, error) {
						console.error('GLOBAL ERROR:', message, 'at', source, lineno, colno);
						if (error && error.stack) {
							console.error('Stack:', error.stack);
						}
						return false;
					};
					
					// Log startup
					console.info('WebView debug initialized');
					
					// Protection around script loading
					try {
						console.log('Loading webview.js from:', '${scriptUri}');
					} catch (e) {
						console.error('Error before loading script:', e);
					}
				</script>
				<script nonce="${nonce}">
					// Wrap script loading in try-catch
					try {
						console.log('Attempting to load webview script...');
						
						// Create script element
						const script = document.createElement('script');
						script.nonce = '${nonce}';
						script.src = '${scriptUri}';
						script.onerror = function(e) {
							console.error('Script load error:', e);
							showDebugPanel();
						};
						script.onload = function() {
							console.log('Script loaded successfully');
						};
						
						// Append script to body
						document.body.appendChild(script);
					} catch (e) {
						console.error('Error during script creation:', e);
						showDebugPanel();
					}
				</script>
			</body>
			</html>`;

		info("WebView panel HTML content set successfully");
	} catch (e: any) {
		error("Error creating WebView content", e);
		if (configPanel) {
			configPanel.webview.html = `<html><body><h1>Error loading configuration panel</h1><p>Error details: ${e.message}</p></body></html>`;
		}
	}

	// Handle panel close event
	configPanel.onDidDispose(() => {
		configPanel = undefined;
		info("Configuration panel was closed");
	}, null, context.subscriptions);
	
	// Handle WebView messages
	configPanel.webview.onDidReceiveMessage(
		message => {
			info('Received message from WebView:', message);
			
			// Handle debug log messages from WebView
			if (message.type === 'debug-log') {
				debug(`WebView Debug: ${message.text}`);
			}
			
			// Handle errors from WebView
			if (message.type === 'error') {
				error(`WebView Error: ${message.text}`, message.error);
			}

			// Handle rule list request
			if (message.type === 'getRuleList') {
				handleGetRuleList(message);
			}

			// Handle create rule request
			if (message.type === 'createRule') {
				handleCreateRule(message);
			}

			// Handle get rule detail request
			if (message.type === 'getRuleDetail') {
				handleGetRuleDetail(message);
			}

			// Handle open rule file request
			if (message.type === 'openRule') {
				handleOpenRule(message);
			}

			// Handle delete rule request
			if (message.type === 'deleteRule') {
				handleDeleteRule(message);
			}

			// Handle edit rule request
			if (message.type === 'editRule') {
				handleEditRule(message);
			}
		},
		undefined,
		context.subscriptions
	);
	
	info("Configuration panel setup complete");
});

/**
 * Generate random nonce value
 */
export function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
} 