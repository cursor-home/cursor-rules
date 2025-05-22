import * as vscode from 'vscode';

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

interface WebviewMessage {
	command: string;
}

/**
 * 规则配置提示面板
 * 提供一个美观的WebView界面，用于显示规则配置选项
 */
export class RulePromptPanel {
	public static currentPanel: RulePromptPanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	/**
	 * 创建规则配置提示面板
	 * @param extensionUri 扩展URI
	 */
	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 如果已经有面板了，就显示它
		if (RulePromptPanel.currentPanel) {
			RulePromptPanel.currentPanel._panel.reveal(column);
			return;
		}

		// 否则，创建一个新的面板
		const panel = vscode.window.createWebviewPanel(
			'rulePrompt',
			'Cursor Rules Configuration',
			column || vscode.ViewColumn.One,
			{
				// 启用JavaScript
				enableScripts: true,
				// 限制webview可以加载的资源
				localResourceRoots: [
					vscode.Uri.joinPath(extensionUri, 'media')
				]
			}
		);

		RulePromptPanel.currentPanel = new RulePromptPanel(panel, extensionUri);
	}

	/**
	 * 构造函数
	 * @param panel WebView面板
	 * @param extensionUri 扩展URI
	 */
	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// 设置webview的HTML内容
		this._update();

		// 监听面板关闭事件
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// 监听来自webview的消息
		this._panel.webview.onDidReceiveMessage(
			(message: WebviewMessage) => {
				switch (message.command) {
					case 'autoConfigure':
						vscode.commands.executeCommand('cursor-rules.autoConfigure');
						break;
					case 'manualConfigure':
						vscode.commands.executeCommand('cursor-rules.manualConfigure');
						break;
					case 'skip':
						vscode.commands.executeCommand('cursor-rules.skip');
						break;
					case 'neverShowAgain':
						vscode.commands.executeCommand('cursor-rules.neverShowAgain');
						break;
				}
			},
			null,
			this._disposables
		);
	}

	/**
	 * 更新WebView内容
	 */
	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	/**
	 * 获取WebView的HTML内容
	 * @param webview WebView实例
	 * @returns HTML字符串
	 */
	private _getHtmlForWebview(webview: vscode.Webview) {
		// 获取本地资源路径
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'rulePrompt.css'));

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${styleUri}" rel="stylesheet">
			<title>Cursor Rules Configuration</title>
		</head>
		<body>
			<div class="container">
				<header>
					<h1>Cursor Rules Configuration</h1>
					<p>Choose how you want to configure Cursor Rules for this workspace.</p>
				</header>
				<div class="content">
					<div class="option-card" onclick="sendMessage('autoConfigure')">
						<h2>Auto Configure</h2>
						<p>Automatically configure rules based on your project structure.</p>
					</div>
					<div class="option-card" onclick="sendMessage('manualConfigure')">
						<h2>Manual Configure</h2>
						<p>Configure rules manually with a guided setup process.</p>
					</div>
				</div>
				<footer>
					<div class="checkbox-container">
						<input type="checkbox" id="neverShowAgain" onchange="handleNeverShowAgain()">
						<label for="neverShowAgain">Don't show this prompt again</label>
					</div>
					<button onclick="sendMessage('skip')">Skip for now</button>
				</footer>
			</div>
			<script>
				const vscode = acquireVsCodeApi();
				
				function sendMessage(command) {
					vscode.postMessage({ command });
				}
				
				function handleNeverShowAgain() {
					const checkbox = document.getElementById('neverShowAgain');
					if (checkbox.checked) {
						sendMessage('neverShowAgain');
					}
				}
			</script>
		</body>
		</html>`;
	}

	/**
	 * 释放资源
	 */
	public dispose() {
		RulePromptPanel.currentPanel = undefined;

		// 清理资源
		this._panel.dispose();

		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
} 