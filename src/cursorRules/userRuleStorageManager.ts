/**
 * userRuleStorageManager.ts
 * 
 * 用户创建的 Cursor Rules 存储管理器
 * 负责用户自定义规则的存储、读取和管理
 * 
 * 主要功能：
 * 1. 将用户创建的规则存储到全局存储目录
 * 2. 使用分块存储和压缩来处理大型规则文件
 * 3. 管理规则元数据和内容
 * 4. 提供规则的CRUD操作接口
 */
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as os from 'os';
import { promisify } from 'util';
import { info, warn, error, debug } from '../logger/logger';
import { Rule, RuleMetadata } from '../types';

// 将回调函数转换为Promise
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// 配置参数
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const MAX_MEMORY_CHUNK = 50 * 1024 * 1024; // 50MB in memory limit
const EXTENSION_ID = 'cursor-home.cursor-rules'; // 扩展ID，格式：publisher.name

interface ChunkInfo {
    index: number;
    size: number;
    compressed: boolean;
}

interface ContentInfo {
    totalSize: number;
    chunks: ChunkInfo[];
    lastModified: number;
}

/**
 * 获取全局存储目录路径
 */
function getGlobalStoragePath(): string {
    const basePath = process.platform === 'win32' 
        ? path.join(process.env.APPDATA || '', 'Code', 'User', 'globalStorage')
        : process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage')
            : path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage');
            
    return path.join(basePath, EXTENSION_ID);
}

/**
 * 用户规则存储管理器
 * 负责规则内容的分块存储和读取
 */
export class UserRuleStorageManager {
    private readonly globalStorageRoot: string;
    private readonly metaDir: string;
    private readonly contentsDir: string;
    private readonly dbPath: string;

    constructor() {
        this.globalStorageRoot = getGlobalStoragePath();
        this.metaDir = path.join(this.globalStorageRoot, 'rules', 'meta');
        this.contentsDir = path.join(this.globalStorageRoot, 'rules', 'contents');
        this.dbPath = path.join(this.globalStorageRoot, 'rules.db');
        
        // 确保目录存在
        this.ensureDirectories();
    }

    /**
     * 确保所需目录存在
     */
    private ensureDirectories(): void {
        const dirs = [
            this.globalStorageRoot,
            path.join(this.globalStorageRoot, 'rules'),
            this.metaDir,
            this.contentsDir
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                info(`创建目录: ${dir}`);
            }
        }
    }

    /**
     * 存储规则
     * @param rule 规则对象
     */
    async storeRule(rule: Rule): Promise<void> {
        try {
            // 1. 存储元数据
            const metaPath = path.join(this.metaDir, `${rule.id}.json`);
            const metadata: RuleMetadata = {
                id: rule.id,
                name: rule.name,
                description: rule.description,
                techStack: rule.techStack,
                filePath: path.join(this.contentsDir, rule.id),
                readContent: async () => this.readRuleContent(rule.id)
            };
            
            fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

            // 2. 创建内容目录
            const ruleDir = path.join(this.contentsDir, rule.id);
            if (!fs.existsSync(ruleDir)) {
                fs.mkdirSync(ruleDir, { recursive: true });
            }

            // 3. 分块存储内容
            const content = rule.content;
            const chunks: ChunkInfo[] = [];
            let offset = 0;

            while (offset < content.length) {
                const chunk = content.slice(offset, offset + CHUNK_SIZE);
                const compressed = await gzip(Buffer.from(chunk));
                
                const chunkInfo: ChunkInfo = {
                    index: chunks.length,
                    size: chunk.length,
                    compressed: true
                };
                
                // 保存压缩后的分块
                fs.writeFileSync(
                    path.join(ruleDir, `chunk${chunkInfo.index}.gz`),
                    compressed
                );
                
                chunks.push(chunkInfo);
                offset += CHUNK_SIZE;
            }

            // 4. 保存内容信息
            const contentInfo: ContentInfo = {
                totalSize: content.length,
                chunks,
                lastModified: Date.now()
            };
            
            fs.writeFileSync(
                path.join(ruleDir, 'info.json'),
                JSON.stringify(contentInfo, null, 2)
            );

            info(`规则 ${rule.id} 已成功存储，共 ${chunks.length} 个分块`);
        } catch (err) {
            error(`存储规则 ${rule.id} 失败:`, err);
            throw err;
        }
    }

    /**
     * 读取规则内容
     * @param ruleId 规则ID
     */
    async readRuleContent(ruleId: string): Promise<string | null> {
        try {
            const ruleDir = path.join(this.contentsDir, ruleId);
            if (!fs.existsSync(ruleDir)) {
                warn(`规则 ${ruleId} 的内容目录不存在`);
                return null;
            }

            // 读取内容信息
            const infoPath = path.join(ruleDir, 'info.json');
            if (!fs.existsSync(infoPath)) {
                warn(`规则 ${ruleId} 的内容信息文件不存在`);
                return null;
            }

            const contentInfo: ContentInfo = JSON.parse(
                fs.readFileSync(infoPath, 'utf8')
            );

            // 分块读取和解压
            let content = '';
            for (const chunk of contentInfo.chunks) {
                const chunkPath = path.join(ruleDir, `chunk${chunk.index}.gz`);
                const compressed = fs.readFileSync(chunkPath);
                const decompressed = await gunzip(compressed);
                content += decompressed.toString();

                // 如果累积的内容超过内存限制，抛出错误
                if (content.length > MAX_MEMORY_CHUNK) {
                    throw new Error(`规则内容超过内存限制 (${MAX_MEMORY_CHUNK / 1024 / 1024}MB)`);
                }
            }

            return content;
        } catch (err) {
            error(`读取规则 ${ruleId} 内容失败:`, err);
            return null;
        }
    }

    /**
     * 删除规则
     * @param ruleId 规则ID
     */
    async deleteRule(ruleId: string): Promise<boolean> {
        try {
            // 1. 删除元数据
            const metaPath = path.join(this.metaDir, `${ruleId}.json`);
            if (fs.existsSync(metaPath)) {
                fs.unlinkSync(metaPath);
            }

            // 2. 删除内容目录
            const ruleDir = path.join(this.contentsDir, ruleId);
            if (fs.existsSync(ruleDir)) {
                // 递归删除目录
                fs.rmSync(ruleDir, { recursive: true, force: true });
            }

            info(`规则 ${ruleId} 已成功删除`);
            return true;
        } catch (err) {
            error(`删除规则 ${ruleId} 失败:`, err);
            return false;
        }
    }

    /**
     * 获取规则元数据
     * @param ruleId 规则ID
     */
    getRuleMetadata(ruleId: string): RuleMetadata | null {
        try {
            const metaPath = path.join(this.metaDir, `${ruleId}.json`);
            if (!fs.existsSync(metaPath)) {
                return null;
            }

            const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            // 添加readContent方法
            metadata.readContent = async () => this.readRuleContent(ruleId);
            return metadata;
        } catch (err) {
            error(`读取规则 ${ruleId} 元数据失败:`, err);
            return null;
        }
    }

    /**
     * 获取所有规则元数据
     */
    getAllRuleMetadata(): RuleMetadata[] {
        try {
            const files = fs.readdirSync(this.metaDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const ruleId = path.basename(file, '.json');
                    return this.getRuleMetadata(ruleId);
                })
                .filter((metadata): metadata is RuleMetadata => metadata !== null);
        } catch (err) {
            error('读取规则元数据列表失败:', err);
            return [];
        }
    }
} 