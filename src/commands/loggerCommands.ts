import * as vscode from 'vscode';
import { 
    logger, 
    LogLevel, 
    setLogLevel, 
    showLogs, 
    clearLogs 
} from '../logger/logger';

/**
 * 显示日志面板命令
 */
export const showLogsCommand = vscode.commands.registerCommand('cursor-rules-assistant.showLogs', () => {
    showLogs();
});

/**
 * 清空日志命令
 */
export const clearLogsCommand = vscode.commands.registerCommand('cursor-rules-assistant.clearLogs', () => {
    clearLogs();
});

/**
 * 设置日志级别命令
 */
export const setLogLevelCommand = vscode.commands.registerCommand('cursor-rules-assistant.setLogLevel', async () => {
    const levels = [
        { label: 'DEBUG', detail: '调试级别 - 显示所有日志' },
        { label: 'INFO', detail: '信息级别 - 显示信息、警告和错误' },
        { label: 'WARN', detail: '警告级别 - 仅显示警告和错误' },
        { label: 'ERROR', detail: '错误级别 - 仅显示错误' }
    ];

    const currentLevel = logger.getLevel();
    const currentLevelName = LogLevel[currentLevel];
    
    const selectedLevel = await vscode.window.showQuickPick(levels, {
        placeHolder: `选择日志级别 (当前: ${currentLevelName})`,
        ignoreFocusOut: true
    });

    if (!selectedLevel) {
        return;
    }

    // 设置日志级别
    switch (selectedLevel.label) {
        case 'DEBUG':
            setLogLevel(LogLevel.DEBUG);
            break;
        case 'INFO':
            setLogLevel(LogLevel.INFO);
            break;
        case 'WARN':
            setLogLevel(LogLevel.WARN);
            break;
        case 'ERROR':
            setLogLevel(LogLevel.ERROR);
            break;
    }

    // 更新配置
    const config = vscode.workspace.getConfiguration('cursor-rules-assistant');
    await config.update('logLevel', selectedLevel.label.toLowerCase(), true);

    vscode.window.showInformationMessage(`日志级别已设置为 ${selectedLevel.label}`);
});

/**
 * 日志相关命令
 */
export const loggerCommands = [
    showLogsCommand,
    clearLogsCommand,
    setLogLevelCommand
]; 