/**
 * 凭证模块的存储位置处理文件
 * 处理凭证存储位置和文件路径
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * 获取配置路径
 * @returns 配置目录路径
 */
export function getConfigPath(): string {
    // 根据操作系统选择配置目录
    if (process.platform === 'win32') {
        // Windows
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        return path.join(appData, 'cursor', 'cursorsettings.json');
    } else if (process.platform === 'darwin') {
        // macOS
        return path.join(os.homedir(), 'Library', 'Application Support', 'cursor', 'cursorsettings.json');
    } else {
        // Linux 和其他平台
        const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
        return path.join(configHome, 'cursor', 'cursorsettings.json');
    }
}

/**
 * 获取令牌缓存文件路径
 * @returns 令牌缓存文件路径
 */
export function getTokenCachePath(): string {
    const context = getExtensionContext();
    if (context) {
        // 使用扩展上下文存储
        return path.join(context.globalStorageUri.fsPath, 'cursor-token.json');
    } else {
        // 回退到临时目录
        const tempDir = os.tmpdir();
        return path.join(tempDir, 'cursor-vscode-token.json');
    }
}

// 扩展上下文
let extensionContext: vscode.ExtensionContext | null = null;

/**
 * 设置扩展上下文
 * @param context 扩展上下文
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * 获取扩展上下文
 * @returns 扩展上下文
 */
export function getExtensionContext(): vscode.ExtensionContext | null {
    return extensionContext;
}

/**
 * 确保目录存在
 * @param filePath 文件路径
 */
export function ensureDirExists(filePath: string): void {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

/**
 * 获取Cursor应用安装路径
 * @returns Cursor应用安装路径
 */
export function getCursorAppPath(): string | null {
    if (process.platform === 'darwin') {
        // macOS
        const appPaths = [
            '/Applications/Cursor.app',
            path.join(os.homedir(), 'Applications', 'Cursor.app')
        ];
        
        for (const appPath of appPaths) {
            if (fs.existsSync(appPath)) {
                return appPath;
            }
        }
    } else if (process.platform === 'win32') {
        // Windows
        const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
        
        const appPaths = [
            path.join(programFiles, 'Cursor', 'Cursor.exe'),
            path.join(programFilesX86, 'Cursor', 'Cursor.exe'),
            path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'cursor', 'Cursor.exe')
        ];
        
        for (const appPath of appPaths) {
            if (fs.existsSync(appPath)) {
                return appPath;
            }
        }
    } else {
        // Linux
        const appPaths = [
            '/usr/bin/cursor',
            '/usr/local/bin/cursor',
            path.join(os.homedir(), '.local', 'bin', 'cursor')
        ];
        
        for (const appPath of appPaths) {
            if (fs.existsSync(appPath)) {
                return appPath;
            }
        }
    }
    
    return null;
} 