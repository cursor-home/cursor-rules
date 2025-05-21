/**
 * Cursor Rules Assistant 扩展主入口文件
 * 
 * 该文件负责扩展的激活、初始化和注册功能，是整个扩展的入口点。
 * 包含扩展激活时（activate函数）和停用时（deactivate函数）执行的代码。
 */

// VSCode扩展API，提供了与VSCode编辑器交互的功能
import * as vscode from 'vscode';
// 配置面板视图提供者，负责展示扩展配置UI
import { ConfigPanelViewProvider } from './config/configProvider';
// 欢迎页面显示函数，用于向用户展示入门指南
import { showWelcomePage } from './webview/welcome';
// 所有注册的命令集合，包括规则相关、AI相关和工具相关命令
import { allCommands } from './commands';
// Cursor Rules检查相关函数，用于检测工作区是否存在规则和显示提示
import { checkCursorRules, shouldShowPrompt, showCursorRulesPrompt } from './cursorRules/checker';
// 处理用户对Cursor Rules提示的选择
import { handleCursorRulesChoice } from './cursorRules/manager';
// 日志功能从logger模块导入
import { 
	LogLevel, 
	initializeLogging, 
	info, 
	warn, 
	error 
} from './logger/logger';


/**
 * 检查扩展版本并处理欢迎信息
 * 
 * 检测是首次安装还是版本更新，并显示相应的欢迎信息
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @returns {Promise<void>} 无返回值的Promise
 */
async function checkExtensionVersion(context: vscode.ExtensionContext): Promise<void> {
	try {
		const extensionId = 'CC11001100.cursor-rules-assistant';
		info(`尝试获取扩展信息，扩展ID: ${extensionId}`);
		
		// 获取当前扩展
		const extension = vscode.extensions.getExtension(extensionId);
		
		// 如果找不到扩展，记录错误并返回
		if (!extension) {
			error(`无法获取扩展信息，跳过欢迎信息检查。尝试的扩展ID: ${extensionId}`);
			
			// 记录所有可用的扩展列表以便排查
			const allExtensions = vscode.extensions.all;
			info(`当前已安装的扩展总数: ${allExtensions.length}`);
			info(`尝试查找ID包含 'cursor-rules' 的扩展...`);
			
			const cursorRulesExtensions = allExtensions.filter(ext => 
				ext.id.toLowerCase().includes('cursor-rules')
			);
			
			if (cursorRulesExtensions.length > 0) {
				info(`找到与 'cursor-rules' 相关的扩展:`);
				cursorRulesExtensions.forEach(ext => {
					info(`- 扩展ID: ${ext.id}, 扩展路径: ${ext.extensionPath}`);
				});
			} else {
				warn(`未找到任何与 'cursor-rules' 相关的扩展`);
			}
			
			// 输出前10个扩展ID用于参考
			info(`已安装扩展ID示例(最多显示10个):`);
			allExtensions.slice(0, 10).forEach(ext => {
				info(`- ${ext.id}`);
			});
			
			return;
		}
		
		info(`成功获取扩展信息，扩展ID: ${extension.id}, 扩展路径: ${extension.extensionPath}`);
		
		// 获取当前版本
		const extensionVersion = extension.packageJSON.version;
		
		// 从全局状态获取之前存储的版本号
		const previousVersion = context.globalState.get<string>('extensionVersion');
		
		info(`扩展版本检查: 当前=${extensionVersion}, 先前=${previousVersion || '未安装'}`);
		
		// 确定是首次安装还是更新
		if (!previousVersion) {
			// 首次安装情况：显示入门指南选项
			info('检测到首次安装，准备显示欢迎信息');
			
			// 使用setTimeout确保欢迎信息在其他UI元素加载后显示
			setTimeout(() => {
				info('正在显示欢迎对话框...');
				
				// 使用模态对话框代替通知，确保用户能看到
				vscode.window.showInformationMessage(
					'Cursor Rules Assistant 安装成功！是否要查看入门指南？',
					{ modal: true }, // 使用模态对话框，强制用户关注
					'查看指南', '以后再说'
				).then(selection => {
					if (selection === '查看指南') {
						info('用户选择查看入门指南');
						showWelcomePage(context);
					} else {
						info('用户选择跳过入门指南');
					}
					
					// 在用户做出选择后再更新版本信息
					context.globalState.update('extensionVersion', extensionVersion);
				}, err => {
					// 处理可能的错误
					error(`显示欢迎对话框时出错: ${err instanceof Error ? err.message : String(err)}`);
					// 出错时也更新版本信息，避免反复提示
					context.globalState.update('extensionVersion', extensionVersion);
				});
				
				// 记录日志以便调试
				info('欢迎对话框显示请求已发送');
			}, 500); // 减少延迟到500毫秒，减少用户等待时间
		} else if (previousVersion !== extensionVersion) {
			// 版本更新情况：显示更新通知
			info(`检测到版本更新：${previousVersion} -> ${extensionVersion}`);
			
			setTimeout(() => {
				info('正在显示版本更新对话框...');
				
				// 同样使用模态对话框
				vscode.window.showInformationMessage(
					`Cursor Rules Assistant 已更新到 v${extensionVersion}！查看新特性？`,
					{ modal: true }, // 使用模态对话框
					'查看更新', '忽略'
				).then(selection => {
					if (selection === '查看更新') {
						info('用户选择查看更新内容');
						showWelcomePage(context);
					} else {
						info('用户选择忽略更新内容');
					}
					
					// 在用户做出选择后再更新版本信息
					context.globalState.update('extensionVersion', extensionVersion);
				}, err => {
					// 处理可能的错误
					error(`显示更新对话框时出错: ${err instanceof Error ? err.message : String(err)}`);
					// 出错时也更新版本信息
					context.globalState.update('extensionVersion', extensionVersion);
				});
				
				info('版本更新对话框显示请求已发送');
			}, 500);
		} else {
			// 相同版本，直接更新状态
			context.globalState.update('extensionVersion', extensionVersion);
		}
	} catch (err) {
		// 捕获并记录任何错误，提供详细的错误信息和堆栈跟踪
		const errorMessage = err instanceof Error ? err.message : String(err);
		const errorStack = err instanceof Error && err.stack ? err.stack : 'No stack trace available';
		
		error(`检查扩展版本时出错: ${errorMessage}`);
		error(`错误详情: ${errorStack}`);
		
		// 记录当前环境信息以辅助调试
		info(`VSCode版本: ${vscode.version}`);
		info(`扩展运行环境: ${process.platform}-${process.arch}`);
		
		try {
			// 尝试列出当前目录结构，可能有助于排查路径问题
			const fs = require('fs');
			const path = require('path');
			const extensionPath = context.extensionPath;
			info(`扩展路径: ${extensionPath}`);
			
			if (fs.existsSync(extensionPath)) {
				const packageJsonPath = path.join(extensionPath, 'package.json');
				if (fs.existsSync(packageJsonPath)) {
					const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
					info(`package.json 信息: 名称=${packageJson.name}, 版本=${packageJson.version}, 发布者=${packageJson.publisher || '未设置'}`);
				} else {
					warn(`package.json 文件不存在: ${packageJsonPath}`);
				}
			} else {
				warn(`扩展路径不存在: ${extensionPath}`);
			}
		} catch (fsErr) {
			warn(`尝试读取文件系统信息时出错: ${fsErr instanceof Error ? fsErr.message : String(fsErr)}`);
		}
	}
}

/**
 * 注册UI组件
 * 
 * 注册配置面板视图提供者，使配置面板在活动栏中可见
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @returns {void} 无返回值
 */
function registerUIComponents(context: vscode.ExtensionContext): void {
	// 注册配置面板视图提供者
	// 这将在活动栏中显示扩展的配置面板
	info('注册配置面板提供者');
	const configPanelProvider = new ConfigPanelViewProvider(context.extensionUri, context);
	// 将视图提供者添加到订阅数组，以便扩展停用时自动释放资源
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ConfigPanelViewProvider.viewType, // 视图类型ID，固定为'cursor-rules-assistant.configView'
			configPanelProvider
		)
	);
}

/**
 * 注册扩展命令
 * 
 * 注册所有扩展命令，包括规则相关、AI相关和工具相关命令
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @returns {void} 无返回值
 */
function registerCommands(context: vscode.ExtensionContext): void {
	// 注册所有命令
	// allCommands包含了规则相关、AI相关和工具相关的所有命令
	info('注册扩展命令');
	context.subscriptions.push(...allCommands);
	
	// 注册带context参数的特殊命令
	context.subscriptions.push(
		vscode.commands.registerCommand('cursor-rules-assistant.openConfig', () => {
			// 执行打开配置面板命令时传递context参数
			vscode.commands.executeCommand('_cursor-rules-assistant.openConfigWithContext', context);
		}),
		vscode.commands.registerCommand('cursor-rules-assistant.openWelcomePage', () => {
			// 执行打开欢迎页面命令时传递context参数
			vscode.commands.executeCommand('_cursor-rules-assistant.openWelcomePageWithContext', context);
		}),
		// 添加开发测试命令，用于重置扩展状态，模拟首次安装
		vscode.commands.registerCommand('cursor-rules-assistant.resetExtensionState', () => {
			// 清除版本记录
			context.globalState.update('extensionVersion', undefined).then(() => {
				info('已重置扩展状态，下次激活时将模拟首次安装');
				vscode.window.showInformationMessage('扩展状态已重置！重启VSCode或重新加载窗口以模拟首次安装体验。', '重新加载窗口').then(selection => {
					if (selection === '重新加载窗口') {
						vscode.commands.executeCommand('workbench.action.reloadWindow');
					}
				});
			});
		})
	);
}

/**
 * 检查工作区规则
 * 
 * 为所有打开的工作区检查Cursor Rules状态，并根据需要显示配置提示
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @param {boolean} enableAutoCheck - 是否启用自动检查的配置选项
 * @returns {Promise<void>} 无返回值的Promise
 */
async function checkWorkspaceRules(
	context: vscode.ExtensionContext, 
	enableAutoCheck: boolean
): Promise<void> {
	// 获取当前打开的所有工作区
	// 示例：workspaceFolders = [{name: "project1", uri: {...}}, {name: "project2", uri: {...}}]
	const workspaceFolders = vscode.workspace.workspaceFolders;
	// 如果没有打开的工作区，则跳过规则检查
	if (!workspaceFolders || workspaceFolders.length === 0) {
		warn('未检测到工作区，跳过规则检查');
		return;
	}
	
	// 如果启用了自动检查选项，则为每个工作区检查Cursor Rules
	if (!enableAutoCheck) {
		info('自动检查已禁用，跳过规则检查');
		return;
	}
	
	info('自动检查工作区中的规则');
	// 遍历所有工作区
	for (const workspaceFolder of workspaceFolders) {
		await checkSingleWorkspace(context, workspaceFolder);
	}
}

/**
 * 检查单个工作区的规则
 * 
 * 检查指定工作区的Cursor Rules状态，如果需要则显示配置提示
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要检查的工作区文件夹对象
 * @returns {Promise<void>} 无返回值的Promise
 */
async function checkSingleWorkspace(
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	info(`检查工作区: ${workspaceFolder.name}`);
	// 检查是否应该为该工作区显示提示
	// 如果用户之前选择了"不再提示"，则shouldShowPrompt返回false
	if (!shouldShowPrompt(context, workspaceFolder)) {
		info(`跳过工作区 ${workspaceFolder.name}，提示已被禁用或已显示`);
		return;
	}
	
	// 检查工作区是否已存在Cursor Rules
	// 返回结果示例：{exists: true, paths: ['/path/to/.cursor/rules']}
	const checkResult = await checkCursorRules(workspaceFolder);
	if (checkResult.exists) {
		info(`工作区 ${workspaceFolder.name} 已存在规则文件`);
		return;
	}
	
	// 如果工作区不存在规则，显示提示并处理用户选择
	info(`向工作区 ${workspaceFolder.name} 显示规则提示`);
	// 可能的选择：'自动配置'、'手动配置'、'本次跳过'或'不再提示'
	const choice = await showCursorRulesPrompt(workspaceFolder);
	await handleCursorRulesChoice(choice, context, workspaceFolder);
}

/**
 * 注册工作区变化监听器
 * 
 * 监听工作区变化事件，当新工作区添加时检查规则状态
 * 
 * @param {vscode.ExtensionContext} context - 扩展上下文对象
 * @param {boolean} enableAutoCheck - 是否启用自动检查的配置选项
 * @returns {void} 无返回值
 */
function registerWorkspaceChangeListener(
	context: vscode.ExtensionContext, 
	enableAutoCheck: boolean
): void {
	// 监听工作区变化事件，当新工作区添加时进行检查
	info('注册工作区变化监听器');
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(async event => {
			// 如果自动检查已禁用，则不处理
			if (!enableAutoCheck) {
				return;
			}
			
			// 为新添加的每个工作区检查Cursor Rules
			// event.added示例：[{name: "new-project", uri: {...}}]
			for (const workspaceFolder of event.added) {
				await checkSingleWorkspace(context, workspaceFolder);
			}
		})
	);
}

/**
 * 扩展激活函数
 * 
 * 当扩展首次被激活时（例如VSCode启动或执行扩展命令时）由VSCode调用。
 * 负责初始化扩展所需的各种资源、注册命令和事件监听器，以及设置工作环境。
 * 
 * @param context - VSCode提供的扩展上下文对象，包含扩展的运行环境信息
 *                  例如：context.subscriptions数组用于注册需要在扩展停用时释放的资源
 *                  context.extensionPath包含扩展安装路径
 *                  context.globalState用于存储全局持久化数据
 * 
 * @example
 * // VSCode自动调用此函数，无需手动调用
 * // 扩展激活示例流程：
 * // 1. 初始化日志系统
 * // 2. 初始化规则加载器
 * // 3. 确保规则目录结构
 * // 4. 检查版本并显示欢迎信息
 * // 5. 注册配置面板
 * // 6. 注册命令
 * // 7. 检查工作区规则
 * 
 * @returns 无显式返回值。隐式返回一个Promise，表示激活过程的完成
 */
export async function activate(context: vscode.ExtensionContext) {
	// 获取插件配置
	const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
	const logLevel = config.get<string>('logLevel', 'info');
	
	// 1. 初始化日志系统
	initializeLogging(logLevel);
	
	// 3. 检查扩展版本并处理欢迎信息
	await checkExtensionVersion(context);
	
	// 4. 注册UI组件
	registerUIComponents(context);
	
	// 5. 注册扩展命令
	registerCommands(context);
	
	// 获取更多插件配置
	const enableAutoCheck = config.get<boolean>('enableAutoCheck', true);
	
	// 7. 检查工作区规则
	await checkWorkspaceRules(context, enableAutoCheck);
	
	// 8. 注册工作区变化监听器
	registerWorkspaceChangeListener(context, enableAutoCheck);
	
	// 记录扩展激活完成
	info('扩展激活完成');
}

/**
 * 扩展停用函数
 * 
 * 当扩展被停用时（例如VSCode关闭或扩展被明确禁用时）由VSCode调用。
 * 用于执行清理操作，释放资源，保存状态等。
 * 
 * 注意：大部分资源的释放是通过context.subscriptions自动处理的，
 * 因此此函数通常只需处理特殊的清理工作。
 * 
 * @example
 * // VSCode自动调用此函数，无需手动调用
 * // 目前只记录日志，未执行其他操作
 * 
 * @returns void - 无返回值
 */
export function deactivate() {
	// 记录扩展停用日志
	info('Cursor Rules Assistant 已停用');
}
