import * as vscode from 'vscode';
import { autoConfigureCursorRules } from '../cursorRules/manager';
import { detectProjectTechStack, getTechStackDescription } from '../techStack';
import { showWelcomePage } from '../webview/welcome';
// TODO: 以下函数尚未实现，需要重构后修复
// 目前仅保留导入以避免编译错误
import { 
	fetchAvailableRules, 
	fetchRuleContent, 
	applyRuleToWorkspace, 
	getRulesForTechStack,
	Rule,
	RuleMetadata
} from '../rulesRepository';

/**
 * 配置面板WebviewPanel实例
 */
let configPanel: vscode.WebviewPanel | undefined;

/**
 * 注册打开配置面板命令
 * 使用内部命令ID，由公共命令cursor-rules-assistant.openConfig调用并传递context
 */
export const openConfigCommand = vscode.commands.registerCommand('_cursor-rules-assistant.openConfigWithContext', (context: vscode.ExtensionContext) => {
	// 如果配置面板已经存在，直接显示
	if (configPanel) {
		configPanel.reveal();
		return;
	}

	// 创建新的配置面板
	configPanel = vscode.window.createWebviewPanel(
		'cursorRulesConfig', // 视图类型
		'Cursor Rules Assistant 配置', // 面板标题
		vscode.ViewColumn.One, // 在编辑器的第一栏打开
		{
			enableScripts: true, // 启用JavaScript
			retainContextWhenHidden: true, // 隐藏时保留状态
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'dist') // 允许加载的本地资源路径
			]
		}
	);

	// 获取WebviewContent
	const scriptUri = configPanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js'));
	const nonce = getNonce();

	// 设置HTML内容
	configPanel.webview.html = `<!DOCTYPE html>
		<html lang="zh-CN">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${configPanel.webview.cspSource};">
			<title>Cursor Rules助手</title>
		</head>
		<body>
			<div id="root"></div>
			<script nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		</html>`;

	// 处理面板关闭事件
	configPanel.onDidDispose(() => {
		configPanel = undefined;
	}, null, context.subscriptions);
	
	// TODO: 处理WebView消息
	// 当前这只是一个基本实现，后续需要添加处理配置的逻辑
	configPanel.webview.onDidReceiveMessage(
		message => {
			console.log('收到消息:', message);
			// 这里需要添加消息处理逻辑
		},
		undefined,
		context.subscriptions
	);
});

/**
 * 生成随机nonce值
 */
function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * 注册打开欢迎页面命令
 */
export const openWelcomePageCommand = vscode.commands.registerCommand('_cursor-rules-assistant.openWelcomePageWithContext', (context: vscode.ExtensionContext) => {
	showWelcomePage(context);
});

/**
 * 注册创建Cursor Rules命令
 */
export const createCursorRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.createCursorRules', async () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
		return;
	}
	
	// 如果有多个工作区，让用户选择
	let workspaceFolder: vscode.WorkspaceFolder;
	if (workspaceFolders.length === 1) {
		workspaceFolder = workspaceFolders[0];
	} else {
		const selected = await vscode.window.showQuickPick(
			workspaceFolders.map(folder => ({ label: folder.name, folder })),
			{ placeHolder: '选择要配置Cursor Rules的工作区' }
		);
		
		if (!selected) {
			return;
		}
		
		workspaceFolder = selected.folder;
	}
	
	await autoConfigureCursorRules(workspaceFolder);
});

/**
 * 注册技术栈检测命令
 */
export const detectTechStackCommand = vscode.commands.registerCommand('cursor-rules-assistant.detectTechStack', async () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
		return;
	}
	
	// 如果有多个工作区，让用户选择
	let workspaceFolder: vscode.WorkspaceFolder;
	if (workspaceFolders.length === 1) {
		workspaceFolder = workspaceFolders[0];
	} else {
		const selected = await vscode.window.showQuickPick(
			workspaceFolders.map(folder => ({ label: folder.name, folder })),
			{ placeHolder: '选择要检测技术栈的工作区' }
		);
		
		if (!selected) {
			return;
		}
		
		workspaceFolder = selected.folder;
	}
	
	// 显示进度条
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			const techStackDesc = getTechStackDescription(techStackInfo);
			
			// 显示技术栈信息
			vscode.window.showInformationMessage(`检测到的项目技术栈: ${techStackDesc}`);
			
			return techStackInfo;
		} catch (error) {
			console.error('检测技术栈时出错:', error);
			vscode.window.showErrorMessage('检测技术栈失败，请重试');
		}
	});
});

/**
 * 注册浏览Cursor Rules命令
 */
export const browseRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.browseRules', async () => {
	try {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "正在获取可用规则...",
			cancellable: false
		}, async (progress) => {
			// 获取可用规则
			const rules = await fetchAvailableRules();
			
			if (rules.length === 0) {
				vscode.window.showInformationMessage('未找到可用的规则');
				return;
			}
			
			// 显示规则列表
			const selected = await vscode.window.showQuickPick(
				rules.map((rule: RuleMetadata) => ({
					label: rule.name,
					description: rule.description,
					rule
				})),
				{ placeHolder: '选择要查看的规则' }
			);
			
			if (!selected) {
				return;
			}
			
			// 获取规则详细内容
			progress.report({ message: `正在获取 ${selected.label} 的详细内容...` });
			
			try {
				const fullRule = await fetchRuleContent(selected.rule);
				
				// 显示规则详情并提供应用选项
				const action = await vscode.window.showInformationMessage(
					`规则: ${fullRule.name}`,
					'应用到当前工作区',
					'查看详细内容'
				);
				
				if (action === '应用到当前工作区') {
					// 选择工作区
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders || workspaceFolders.length === 0) {
						vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
						return;
					}
					
					let workspaceFolder: vscode.WorkspaceFolder;
					if (workspaceFolders.length === 1) {
						workspaceFolder = workspaceFolders[0];
					} else {
						const selectedWs = await vscode.window.showQuickPick(
							workspaceFolders.map(folder => ({ label: folder.name, folder })),
							{ placeHolder: '选择要应用规则的工作区' }
						);
						
						if (!selectedWs) {
							return;
						}
						
						workspaceFolder = selectedWs.folder;
					}
					
					// 应用规则
					await applyRuleToWorkspace(fullRule, workspaceFolder);
				} else if (action === '查看详细内容') {
					// 在新文档中显示规则内容
					const document = await vscode.workspace.openTextDocument({
						content: fullRule.content,
						language: 'markdown'
					});
					await vscode.window.showTextDocument(document);
				}
			} catch (error) {
				console.error('获取规则详情失败:', error);
				vscode.window.showErrorMessage('获取规则详情失败，请重试');
			}
		});
	} catch (error) {
		console.error('浏览规则失败:', error);
		vscode.window.showErrorMessage('浏览规则失败，请重试');
	}
});

/**
 * 注册根据技术栈推荐规则命令
 */
export const recommendRulesCommand = vscode.commands.registerCommand('cursor-rules-assistant.recommendRules', async () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('请先打开一个工作区文件夹。');
		return;
	}
	
	// 如果有多个工作区，让用户选择
	let workspaceFolder: vscode.WorkspaceFolder;
	if (workspaceFolders.length === 1) {
		workspaceFolder = workspaceFolders[0];
	} else {
		const selected = await vscode.window.showQuickPick(
			workspaceFolders.map(folder => ({ label: folder.name, folder })),
			{ placeHolder: '选择要获取规则推荐的工作区' }
		);
		
		if (!selected) {
			return;
		}
		
		workspaceFolder = selected.folder;
	}
	
	// 显示进度条
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "正在分析项目技术栈...",
		cancellable: false
	}, async (progress) => {
		try {
			// 检测技术栈
			const techStackInfo = await detectProjectTechStack(workspaceFolder);
			const techStackDesc = getTechStackDescription(techStackInfo);
			
			progress.report({ message: `检测到技术栈: ${techStackDesc}，正在搜索匹配规则...` });
			
			// 获取匹配的规则
			const rules = await getRulesForTechStack(techStackInfo, {
				limit: 5,
				includeBuiltIn: true,
				includeRemote: true,
				minScore: 0.3
			});
			
			if (rules.length === 0) {
				vscode.window.showInformationMessage('未找到匹配的规则');
				return;
			}
			
			// 显示规则推荐列表
			const selected = await vscode.window.showQuickPick(
				rules.map(rule => ({
					label: rule.name,
					description: rule.description,
					detail: `匹配项目技术栈: ${techStackDesc}`,
					rule
				})),
				{ placeHolder: '选择要应用的规则' }
			);
			
			if (!selected) {
				return;
			}
			
			// 应用选中的规则
			await applyRuleToWorkspace(selected.rule, workspaceFolder);
		} catch (error) {
			console.error('推荐规则失败:', error);
			vscode.window.showErrorMessage('推荐规则失败，请重试');
		}
	});
}); 