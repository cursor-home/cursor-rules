/**
 * Cursor Rules Assistant Extension Main Entry File
 * 
 * This file is responsible for extension activation, initialization, and functionality registration.
 * It contains code executed during extension activation (activate function) and deactivation (deactivate function).
 */

// VSCode extension API, providing functionality to interact with the VSCode editor
import * as vscode from 'vscode';
// Configuration panel view provider, responsible for displaying extension configuration UI
import { ConfigPanelViewProvider } from './config/configProvider';
// Welcome page display function, used to show getting started guide to users
import { showWelcomePage } from './webview/welcome';
// All registered command collections, including rule-related, AI-related, and tool-related commands
import { allCommands } from './commands';
// Cursor Rules check-related functions, used to detect if rules exist in the workspace and show prompts
import { checkCursorRules, shouldShowPrompt, showCursorRulesPrompt } from './cursorRules/checker';
// Handle user choices regarding Cursor Rules prompts
import { handleCursorRulesChoice } from './cursorRules/manager';
// Import initialization function for meta manager
import { initializeMetaManager } from './cursorRules/metaManager';
// Logging functionality imported from logger module
import { 
	LogLevel, 
	initializeLogging, 
	info, 
	warn, 
	error 
} from './logger/logger';
// Import RulePromptPanel
import { RulePromptPanel } from './webview/rulePromptPanel';


/**
 * Check extension version and handle welcome messages
 * 
 * Detects whether it's a first-time installation or version update, and displays appropriate welcome messages
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @returns {Promise<void>} Promise with no return value
 */
async function checkExtensionVersion(context: vscode.ExtensionContext): Promise<void> {
	try {
		const extensionId = 'CC11001100.cursor-rules-assistant';
		info(`Attempting to get extension information, extension ID: ${extensionId}`);
		info(`Current number of active extensions: ${vscode.extensions.all.length}`);
		
		// Get current extension
		const extension = vscode.extensions.getExtension(extensionId);
		
		// If extension cannot be found, log error and return
		if (!extension) {
			error(`Unable to get extension information, skipping welcome message check. Attempted extension ID: ${extensionId}`);
			
			// Log all available extensions for troubleshooting
			const allExtensions = vscode.extensions.all;
			info(`Total number of installed extensions: ${allExtensions.length}`);
			info(`Attempting to find extensions with ID containing 'cursor-rules'...`);
			
			const cursorRulesExtensions = allExtensions.filter(ext => 
				ext.id.toLowerCase().includes('cursor-rules')
			);
			
			if (cursorRulesExtensions.length > 0) {
				info(`Found extensions related to 'cursor-rules':`);
				cursorRulesExtensions.forEach(ext => {
					info(`- Extension ID: ${ext.id}, Extension path: ${ext.extensionPath}`);
				});
			} else {
				warn(`No extensions related to 'cursor-rules' found`);
			}
			
			// Output first 10 extension IDs for reference
			info(`Installed extension ID examples (showing up to 10):`);
			allExtensions.slice(0, 10).forEach(ext => {
				info(`- ${ext.id}`);
			});
			
			return;
		}
		
		info(`Successfully retrieved extension information, extension ID: ${extension.id}, extension path: ${extension.extensionPath}`);
		info(`packageJSON: ${JSON.stringify({
			name: extension.packageJSON.name,
			version: extension.packageJSON.version,
			publisher: extension.packageJSON.publisher,
			engines: extension.packageJSON.engines
		})}`);
		
		// Get current version
		const extensionVersion = extension.packageJSON.version;
		
		// Get previously stored version number from global state
		const previousVersion = context.globalState.get<string>('extensionVersion');
		
		info(`Extension version check: current=${extensionVersion}, previous=${previousVersion || 'not installed'}`);
		
		// Determine if it's a first installation or update
		if (!previousVersion) {
			// First installation case: directly show getting started guide
			info('First installation detected, showing welcome page');
			
			try {
				// Directly show welcome page
				showWelcomePage(context);
				info('Welcome page opened');
				
				// Update version information
				info(`Updating global state 'extensionVersion' to ${extensionVersion}`);
				await context.globalState.update('extensionVersion', extensionVersion);
				info(`Global state updated successfully, current 'extensionVersion': ${context.globalState.get('extensionVersion')}`);
			} catch (err) {
				// Handle possible errors
				error(`Error showing welcome page: ${err instanceof Error ? err.message : String(err)}`);
				// Update version info even when error occurs to avoid repeated prompts
				await context.globalState.update('extensionVersion', extensionVersion);
			}
		} else if (previousVersion !== extensionVersion) {
			// Version update case: show update notification
			info(`Version update detected: ${previousVersion} -> ${extensionVersion}`);
			
			// Use notification to notify user of update
			vscode.window.showInformationMessage(
				`Cursor Rules Assistant has been updated to v${extensionVersion}!`,
				'View Updates'
			).then(selection => {
				if (selection === 'View Updates') {
					info('User chose to view update content');
					showWelcomePage(context);
				}
				
				// Update version info regardless of user choice
				context.globalState.update('extensionVersion', extensionVersion);
			}, err => {
				// Handle possible errors
				error(`Error showing update prompt: ${err instanceof Error ? err.message : String(err)}`);
				// Update version info even when error occurs
				context.globalState.update('extensionVersion', extensionVersion);
			});
		} else {
			// Same version, just update state
			info(`Version is the same (${extensionVersion}), skipping welcome/update information display`);
			await context.globalState.update('extensionVersion', extensionVersion);
		}
	} catch (err) {
		// Catch and log any errors, provide detailed error information and stack trace
		const errorMessage = err instanceof Error ? err.message : String(err);
		const errorStack = err instanceof Error && err.stack ? err.stack : 'No stack trace available';
		
		error(`Error checking extension version: ${errorMessage}`);
		error(`Error details: ${errorStack}`);
		
		// Log current environment information to assist debugging
		info(`VSCode version: ${vscode.version}`);
		info(`Extension runtime environment: ${process.platform}-${process.arch}`);
		
		try {
			// Try to list current directory structure, which may help troubleshoot path issues
			const fs = require('fs');
			const path = require('path');
			const extensionPath = context.extensionPath;
			info(`Extension path: ${extensionPath}`);
			
			if (fs.existsSync(extensionPath)) {
				const packageJsonPath = path.join(extensionPath, 'package.json');
				if (fs.existsSync(packageJsonPath)) {
					const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
					info(`package.json information: name=${packageJson.name}, version=${packageJson.version}, publisher=${packageJson.publisher || 'not set'}`);
				} else {
					warn(`package.json file does not exist: ${packageJsonPath}`);
				}
			} else {
				warn(`Extension path does not exist: ${extensionPath}`);
			}
		} catch (fsErr) {
			warn(`Error trying to read filesystem information: ${fsErr instanceof Error ? fsErr.message : String(fsErr)}`);
		}
	}
}

/**
 * Register UI components
 * 
 * Register configuration panel view provider to make configuration panel visible in activity bar
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @returns {void} No return value
 */
function registerUIComponents(context: vscode.ExtensionContext): void {
	// Register configuration panel view provider
	// This will display the extension's configuration panel in the activity bar
	info('Registering configuration panel provider');
	const configPanelProvider = new ConfigPanelViewProvider(context.extensionUri, context);
	// Add view provider to subscriptions array to automatically release resources when extension is deactivated
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			ConfigPanelViewProvider.viewType, // View type ID, fixed as 'cursor-rules-assistant.configView'
			configPanelProvider
		)
	);
}

/**
 * Register extension commands
 * 
 * Register all extension commands, including rule-related, AI-related, and tool-related commands
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @returns {void} No return value
 */
function registerCommands(context: vscode.ExtensionContext): void {
	// Register all commands
	// allCommands includes all rule-related, AI-related, and tool-related commands
	info('Registering extension commands');
	context.subscriptions.push(...allCommands);
	
	// Register special commands with context parameter
	context.subscriptions.push(
		vscode.commands.registerCommand('cursor-rules-assistant.openConfig', () => {
			// Pass context parameter when executing open configuration panel command
			vscode.commands.executeCommand('_cursor-rules-assistant.openConfigWithContext', context);
		}),
		vscode.commands.registerCommand('cursor-rules-assistant.openWelcomePage', () => {
			// Pass context parameter when executing open welcome page command
			vscode.commands.executeCommand('_cursor-rules-assistant.openWelcomePageWithContext', context);
		}),
		// Add development test command to reset extension state, simulating first installation
		vscode.commands.registerCommand('cursor-rules-assistant.resetExtensionState', async () => {
			// Clear version record
			try {
				await context.globalState.update('extensionVersion', undefined);
				info('Extension state reset, first installation experience will be shown');
				
				// Immediately show welcome page, no restart needed
				info('Showing welcome page...');
				const panel = showWelcomePage(context);
				info('Welcome page displayed successfully');
				
				vscode.window.showInformationMessage('Extension state has been reset! Welcome page has been opened. You can close the page and reopen it from the command palette at any time.');
			} catch (err) {
				error(`Error resetting extension state: ${err instanceof Error ? err.message : String(err)}`);
				vscode.window.showErrorMessage(`Failed to reset extension state: ${err instanceof Error ? err.message : String(err)}`);
			}
		})
	);
}

/**
 * Check workspace rules
 * 
 * Check Cursor Rules status for all opened workspaces and display configuration prompts as needed
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @param {boolean} enableAutoCheck - Configuration option to enable automatic checks
 * @returns {Promise<void>} Promise with no return value
 */
async function checkWorkspaceRules(
	context: vscode.ExtensionContext, 
	enableAutoCheck: boolean
): Promise<void> {
	// Get current opened workspaces
	// Example: workspaceFolders = [{name: "project1", uri: {...}}, {name: "project2", uri: {...}}]
	const workspaceFolders = vscode.workspace.workspaceFolders;
	// If no workspaces are opened, skip rule check
	if (!workspaceFolders || workspaceFolders.length === 0) {
		warn('No workspaces detected, skipping rule check');
		return;
	}
	
	// If automatic check option is enabled, check Cursor Rules for each workspace
	if (!enableAutoCheck) {
		info('Automatic check disabled, skipping rule check');
		return;
	}
	
	info('Checking workspaces for rules');
	// Loop through all workspaces
	for (const workspaceFolder of workspaceFolders) {
		await checkSingleWorkspace(context, workspaceFolder);
	}
}

/**
 * Check single workspace rules
 * 
 * Check Cursor Rules status for specified workspace, and display configuration prompts if needed
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @param {vscode.WorkspaceFolder} workspaceFolder - Workspace folder object to check
 * @returns {Promise<void>} Promise with no return value
 */
async function checkSingleWorkspace(
	context: vscode.ExtensionContext,
	workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
	info(`开始检查工作区: ${workspaceFolder.name}`);
	info(`工作区路径: ${workspaceFolder.uri.fsPath}`);
	
	// Check if should show prompt for this workspace
	// If user previously selected "don't show again", shouldShowPrompt returns false
	const shouldShow = shouldShowPrompt(context, workspaceFolder);
	info(`工作区 ${workspaceFolder.name} 是否应该显示提示: ${shouldShow}`);
	
	if (!shouldShow) {
		const disabledPrompts = context.globalState.get<string[]>('disabledPrompts', []);
		info(`跳过工作区 ${workspaceFolder.name}，原因: ${disabledPrompts.includes(workspaceFolder.uri.toString()) ? '用户选择不再提示' : '提示已显示'}`);
		return;
	}
	
	// Check if Cursor Rules exist in workspace
	// Return example: {exists: true, paths: ['/path/to/.cursor/rules']}
	const checkResult = await checkCursorRules(workspaceFolder);
	info(`工作区 ${workspaceFolder.name} 规则检查结果:`, {
		exists: checkResult.exists,
		paths: checkResult.paths,
		hasRules: checkResult.paths.length > 0
	});
	
	if (checkResult.exists) {
		info(`工作区 ${workspaceFolder.name} 已存在规则文件，路径: ${checkResult.paths.join(', ')}`);
		return;
	}
	
	// If workspace does not have rules, display prompt and handle user choice
	info(`工作区 ${workspaceFolder.name} 未发现规则文件，准备显示配置提示`);
	// Possible choices: 'auto configure', 'manual configure', 'skip this time', or 'don't show again'
	const choice = await showCursorRulesPrompt(workspaceFolder);
	info(`用户选择: ${choice || '未选择'}`);
	
	await handleCursorRulesChoice(choice, context, workspaceFolder);
	info(`工作区 ${workspaceFolder.name} 规则检查完成`);
}

/**
 * Register workspace change listener
 * 
 * Listen for workspace change events, check rule status when new workspace is added
 * 
 * @param {vscode.ExtensionContext} context - Extension context object
 * @param {boolean} enableAutoCheck - Configuration option to enable automatic checks
 * @returns {void} No return value
 */
function registerWorkspaceChangeListener(
	context: vscode.ExtensionContext, 
	enableAutoCheck: boolean
): void {
	// Listen for workspace change events, check rule status when new workspace is added
	info('Registering workspace change listener');
	context.subscriptions.push(
		vscode.workspace.onDidChangeWorkspaceFolders(async event => {
			// If automatic check is disabled, do not process
			if (!enableAutoCheck) {
				return;
			}
			
			// Check Cursor Rules for each new added workspace
			// event.added example: [{name: "new-project", uri: {...}}]
			for (const workspaceFolder of event.added) {
				await checkSingleWorkspace(context, workspaceFolder);
			}
		})
	);
}

/**
 * Extension activation function
 * 
 * Called when extension is first activated (e.g., when VSCode starts or executes extension command).
 * Responsible for initializing various resources, registering commands, and setting up environment.
 * 
 * @param context - VSCode provided extension context object, containing extension runtime environment information
 *                  e.g., context.subscriptions array for registering resources to release when extension is deactivated
 *                  context.extensionPath contains extension installation path
 *                  context.globalState used for storing global persistent data
 * 
 * @example
 * // VSCode automatically calls this function, no need to manually call
 * // Extension activation example flow:
 * // 1. Initialize logging system
 * // 2. Initialize meta manager
 * // 3. Ensure rule directory structure
 * // 4. Check version and display welcome messages
 * // 5. Register configuration panel
 * // 6. Register commands
 * // 7. Check workspace rules
 * 
 * @returns void - No explicit return value. Implicit return a Promise, representing completion of activation process
 */
export async function activate(context: vscode.ExtensionContext) {
	info('========== Starting activation of Cursor Rules Assistant extension ==========');
	info(`Extension path: ${context.extensionPath}`);
	
	// Get plugin configuration
	const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
	const logLevel = config.get<string>('logLevel', 'info');
	info(`Current log level: ${logLevel}`);
	
	// 1. Initialize logging system
	initializeLogging(logLevel);
	info('Logging system initialized');
	
	// 2. Initialize meta manager for rule metadata
	initializeMetaManager(context);
	info('Meta manager initialized for rule metadata');
	
	// Log global state information
	// Try to print values of known specific keys
	try {
		// Use inspect method to check globalState, avoid direct access to private properties
		info('Checking global state...');
		// List values of known specific keys
		const knownKeys = ['extensionVersion', 'disabledPrompts', 'lastCheck'];
		for (const key of knownKeys) {
			const value = context.globalState.get(key);
			info(`Global state key '${key}': ${value !== undefined ? JSON.stringify(value) : 'not set'}`);
		}
	} catch (err) {
		warn(`Unable to read global state information: ${err instanceof Error ? err.message : String(err)}`);
	}
	
	// Log environment information
	info(`VSCode version: ${vscode.version}`);
	info(`Operating system: ${process.platform}-${process.arch}`);
	info(`Node.js version: ${process.version}`);
	
	// 3. Check extension version and handle welcome messages
	info('Starting extension version check...');
	await checkExtensionVersion(context);
	info('Extension version check completed');
	
	// 4. Register UI components
	info('Starting to register UI components...');
	registerUIComponents(context);
	info('UI components registered');
	
	// 5. Register extension commands
	info('Starting to register extension commands...');
	registerCommands(context);
	info('Extension commands registered');
	
	// Get more plugin configuration
	const enableAutoCheck = config.get<boolean>('enableAutoCheck', true);
	info(`Automatic check workspace rule setting: ${enableAutoCheck ? 'Enabled' : 'Disabled'}`);
	
	// 7. Check workspace rules
	info('Starting to check workspace rules...');
	await checkWorkspaceRules(context, enableAutoCheck);
	info('Workspace rules check completed');
	
	// 8. Register workspace change listener
	info('Starting to register workspace change listener...');
	registerWorkspaceChangeListener(context, enableAutoCheck);
	info('Workspace change listener registered');
	
	// Again check global state, confirm if correctly updated
	const updatedExtensionVersion = context.globalState.get<string>('extensionVersion');
	info(`Extension version in global state after activation: ${updatedExtensionVersion || 'not set'}`);
	
	// Backup plan: If extension version still not set, then directly show welcome page
	// Note: Normally, first installation time, checkExtensionVersion already sets version and shows welcome page
	// Here is just an additional safeguard mechanism
	if (!updatedExtensionVersion) {
		info(`Backup plan: Detected extension version not set, possibly due to incomplete first installation process`);
		// Wait a short period to avoid conflict with welcome page display in checkExtensionVersion
		setTimeout(async () => {
			try {
				info(`Backup plan: Delay check if version is set...`);
				const delayedCheck = context.globalState.get<string>('extensionVersion');
				if (!delayedCheck) {
					info(`Backup plan: Version still not set, trying to show welcome page...`);
					showWelcomePage(context);
					
					// Update version information
					const thisVersion = vscode.extensions.getExtension('CC11001100.cursor-rules-assistant')?.packageJSON.version || '0.0.1';
					await context.globalState.update('extensionVersion', thisVersion);
					info(`Backup plan: Global state updated, version set to: ${thisVersion}`);
				} else {
					info(`Backup plan: Detected version set to ${delayedCheck}, no additional action needed`);
				}
			} catch (err) {
				error(`Backup plan welcome page display failed: ${err instanceof Error ? err.message : String(err)}`);
			}
		}, 3000); // Wait 3 seconds to ensure main process has enough time to complete
	}
	
	// Log extension activation completion
	info('========== Extension activation completed ==========');
}

/**
 * Extension deactivation function
 * 
 * Called when extension is deactivated (e.g., when VSCode closes or extension is explicitly disabled).
 * Used for executing cleanup operations, releasing resources, saving state, etc.
 * 
 * Note: Most resource releases are handled automatically through context.subscriptions,
 * so this function usually only handles special cleanup work.
 * 
 * @example
 * // VSCode automatically calls this function, no need to manually call
 * // Currently only logs, no other operations
 * 
 * @returns void - No return value
 */
export function deactivate() {
	// Log extension deactivation message
	info('Cursor Rules Assistant deactivated');
}
