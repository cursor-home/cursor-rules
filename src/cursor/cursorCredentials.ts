import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Cursor凭证数据接口
 */
export interface TokenData {
    token: string;           // 凭证值
    raw?: string;            // 原始数据，仅用于调试
    sourceDev?: string;      // 来源设备信息
    filePath?: string;       // 凭证文件路径
}

/**
 * 错误类型
 */
export const CursorCredentialErrors = {
    TOKEN_NOT_FOUND: new Error('找不到Cursor凭证'),
    UNSUPPORTED_OS: new Error('不支持的操作系统'),
    INVALID_TOKEN_FORMAT: new Error('无效的token格式'),
    TOKEN_FILE_READ_ERROR: new Error('读取token文件失败'),
    TOKEN_PARSE_ERROR: new Error('解析token数据失败')
};

// 本地存储相关常量
const TokenSessionKey = "_https://aicursor.com/token";
const TokenJSONKey = "token";

/**
 * 存储位置列表
 */
interface StorageLocation {
    name: string;
    getBasePath: () => string;
    filename: string;
}

/**
 * 根据操作系统获取存储位置
 */
function getStorageLocations(): StorageLocation[] {
    const homeDir = os.homedir();
    const platform = os.platform();
    
    let locations: StorageLocation[] = [];
    
    // LocalStorage位置
    locations.push({
        name: "LocalStorage",
        getBasePath: () => {
            switch (platform) {
                case 'darwin':
                    return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'Local Storage', 'leveldb');
                case 'win32':
                    return path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'Local Storage', 'leveldb');
                case 'linux':
                    return path.join(homeDir, '.config', 'Cursor', 'Local Storage', 'leveldb');
                default:
                    return '';
            }
        },
        filename: "000003.log"
    });
    
    // SessionStorage位置
    locations.push({
        name: "SessionStorage",
        getBasePath: () => {
            switch (platform) {
                case 'darwin':
                    return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'Session Storage');
                case 'win32':
                    return path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'Session Storage');
                case 'linux':
                    return path.join(homeDir, '.config', 'Cursor', 'Session Storage');
                default:
                    return '';
            }
        },
        filename: "000003.log"
    });
    
    // 旧版LocalStorage位置
    locations.push({
        name: "OldLocalStorage",
        getBasePath: () => {
            switch (platform) {
                case 'darwin':
                    return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'Local Storage');
                case 'win32':
                    return path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'Local Storage');
                case 'linux':
                    return path.join(homeDir, '.config', 'Cursor', 'Local Storage');
                default:
                    return '';
            }
        },
        filename: "https_aicursor.com_0.localstorage"
    });
    
    // 旧版SessionStorage位置
    locations.push({
        name: "OldSessionStorage",
        getBasePath: () => {
            switch (platform) {
                case 'darwin':
                    return path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'Session Storage');
                case 'win32':
                    return path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'Session Storage');
                case 'linux':
                    return path.join(homeDir, '.config', 'Cursor', 'Session Storage');
                default:
                    return '';
            }
        },
        filename: "https_aicursor.com_0.localstorage"
    });
    
    return locations;
}

/**
 * 判断是否是有效的JWT格式
 */
function isValidJWTFormat(token: string): boolean {
    return token.startsWith('eyJ') && token.split('.').length >= 3;
}

/**
 * 判断是否是有效的Cursor token格式
 */
function isValidCursorToken(token: string): boolean {
    return token.length >= 20 && token.startsWith('cur_') && token.includes('-');
}

/**
 * 从数据中提取token
 */
function extractTokenFromData(data: Buffer, sourcePath: string): TokenData | null {
    // 转换为字符串便于正则匹配
    const dataStr = data.toString('utf8');
    
    // 1. 搜索JWT格式token
    const jwtPattern = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
    const jwtMatches = dataStr.match(jwtPattern);
    
    if (jwtMatches) {
        for (const match of jwtMatches) {
            if (isValidJWTFormat(match)) {
                const platform = os.platform();
                const arch = os.arch();
                return {
                    token: match,
                    raw: dataStr,
                    sourceDev: `${platform}/${arch}`,
                    filePath: sourcePath
                };
            }
        }
    }
    
    // 2. 搜索Cursor专用token格式
    const cursorPattern = /cur_[a-zA-Z0-9_-]+/g;
    const cursorMatches = dataStr.match(cursorPattern);
    
    if (cursorMatches) {
        for (const match of cursorMatches) {
            if (isValidCursorToken(match)) {
                const platform = os.platform();
                const arch = os.arch();
                return {
                    token: match,
                    raw: dataStr,
                    sourceDev: `${platform}/${arch}`,
                    filePath: sourcePath
                };
            }
        }
    }
    
    // 3. 搜索键值格式
    const keyIndex = dataStr.indexOf(TokenSessionKey);
    if (keyIndex !== -1) {
        // 尝试解析JSON格式
        try {
            // 搜索在这个键后面的引号内的内容
            const afterKey = dataStr.substring(keyIndex + TokenSessionKey.length);
            const tokenMatch = afterKey.match(/"([^"]+)"/);
            
            if (tokenMatch && tokenMatch[1]) {
                const token = tokenMatch[1];
                if (isValidJWTFormat(token) || isValidCursorToken(token)) {
                    const platform = os.platform();
                    const arch = os.arch();
                    return {
                        token: token,
                        raw: dataStr,
                        sourceDev: `${platform}/${arch}`,
                        filePath: sourcePath
                    };
                }
            }
        } catch (error) {
            console.error('解析Session Storage数据失败:', error);
        }
    }
    
    return null;
}

/**
 * 从本地存储文件中获取token
 */
async function getTokenFromStorageFile(location: StorageLocation): Promise<TokenData | null> {
    const basePath = location.getBasePath();
    if (!basePath) {
        return null;
    }
    
    const filePath = path.join(basePath, location.filename);
    
    try {
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath);
            const token = extractTokenFromData(data, filePath);
            if (token) {
                return token;
            }
        }
        
        // 如果是目录，检查目录中的所有文件
        if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
            const files = fs.readdirSync(basePath);
            for (const file of files) {
                const fullPath = path.join(basePath, file);
                if (fs.statSync(fullPath).isFile()) {
                    try {
                        const data = fs.readFileSync(fullPath);
                        const token = extractTokenFromData(data, fullPath);
                        if (token) {
                            return token;
                        }
                    } catch (error) {
                        console.error(`读取文件 ${fullPath} 失败:`, error);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`从 ${filePath} 读取token失败:`, error);
    }
    
    return null;
}

/**
 * 从token.json文件中读取token
 */
async function getTokenFromJSONFile(): Promise<TokenData | null> {
    try {
        const configPath = getCursorConfigPath();
        if (!configPath) {
            return null;
        }
        
        const tokenPath = path.join(configPath, 'token.json');
        
        // 检查文件是否存在
        if (!fs.existsSync(tokenPath)) {
            return null;
        }
        
        // 读取文件内容
        const data = fs.readFileSync(tokenPath, 'utf8');
        
        // 尝试解析为JSON
        try {
            const tokenData = JSON.parse(data);
            let token = '';
            
            // 尝试获取token字段
            if (tokenData[TokenJSONKey]) {
                token = tokenData[TokenJSONKey];
            } else {
                // 尝试其他可能的字段
                for (const key in tokenData) {
                    if (typeof tokenData[key] === 'string' && isValidJWTFormat(tokenData[key])) {
                        token = tokenData[key];
                        break;
                    }
                }
            }
            
            // 验证token格式
            if (token && (isValidJWTFormat(token) || isValidCursorToken(token))) {
                const platform = os.platform();
                const arch = os.arch();
                return {
                    token: token,
                    sourceDev: `${platform}/${arch}`,
                    filePath: tokenPath
                };
            }
        } catch (error) {
            // 如果解析JSON失败，尝试直接作为token字符串处理
            const token = data.trim();
            if (isValidJWTFormat(token) || isValidCursorToken(token)) {
                const platform = os.platform();
                const arch = os.arch();
                return {
                    token: token,
                    sourceDev: `${platform}/${arch}`,
                    filePath: tokenPath
                };
            }
        }
    } catch (error) {
        console.error('读取token.json文件失败:', error);
    }
    
    return null;
}

/**
 * 获取Cursor配置目录
 */
function getCursorConfigPath(): string | null {
    try {
        const homeDir = os.homedir();
        let configPath = '';
        
        switch (os.platform()) {
            case 'darwin': // macOS
                configPath = path.join(homeDir, 'Library', 'Application Support', 'Cursor');
                break;
            case 'win32': // Windows
                configPath = path.join(homeDir, 'AppData', 'Roaming', 'Cursor');
                break;
            case 'linux':
                configPath = path.join(homeDir, '.config', 'Cursor');
                break;
            default:
                return null;
        }
        
        // 检查目录是否存在
        if (fs.existsSync(configPath)) {
            return configPath;
        }
    } catch (error) {
        console.error('获取Cursor配置目录失败:', error);
    }
    
    return null;
}

/**
 * 获取Cursor凭证
 */
export async function getCursorToken(): Promise<TokenData> {
    // 尝试从token.json读取
    const jsonToken = await getTokenFromJSONFile();
    if (jsonToken) {
        return jsonToken;
    }
    
    // 尝试从各个存储位置读取
    const locations = getStorageLocations();
    for (const location of locations) {
        const token = await getTokenFromStorageFile(location);
        if (token) {
            return token;
        }
    }
    
    throw CursorCredentialErrors.TOKEN_NOT_FOUND;
}

/**
 * 测试当前token是否有效
 */
export async function testTokenValidity(token: string): Promise<boolean> {
    // 这里可以实现一个简单的测试，比如发送一个请求到Cursor API验证token有效性
    // 但目前我们只做格式验证
    return isValidJWTFormat(token) || isValidCursorToken(token);
} 