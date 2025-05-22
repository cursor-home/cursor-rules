/**
 * metaManager.ts
 * 
 * Meta.json管理器模块
 * 
 * 负责加载和管理规则元数据文件(meta.json)，提供规则元数据的查询和过滤功能。
 * 这个模块实现了基于meta.json的规则发现机制，替代或补充原有的文件系统扫描方式。
 * 使用自动过期的缓存机制，避免长时间不使用的缓存占用内存空间。
 * 
 * 主要职责：
 * 1. 加载和解析meta.json文件
 * 2. 提供规则元数据的查询接口
 * 3. 基于技术栈和标签过滤规则
 * 4. 维护meta.json的自动过期缓存
 * 5. 提供规则匹配和推荐功能
 * 
 * 工作流程：
 * 1. 初始化时设置缓存和扩展上下文
 * 2. 当需要规则元数据时，优先从缓存加载
 * 3. 如果缓存不存在或已过期，从文件系统加载meta.json
 * 4. 根据技术栈匹配规则，计算匹配分数
 * 5. 返回匹配度最高的规则给调用者
 * 
 * meta.json文件格式：
 * ```json
 * {
 *   "rules": [
 *     {
 *       "id": "rule-id",
 *       "name": "规则名称",
 *       "description": "规则描述",
 *       "techStack": {
 *         "languages": ["JavaScript", "TypeScript"],
 *         "frameworks": ["React"],
 *         "tools": ["Webpack"]
 *       }
 *     }
 *   ],
 *   "version": "1.0.0",
 *   "lastUpdated": "2023-05-01"
 * }
 * ```
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Rule, RuleMetadata, TechStackInfo, MetaJsonData, RuleMatchResult, RuleSource, RuleSearchOptions } from '../types';
import { debug, info, warn, error } from '../logger/logger';
import Cache from 'vscode-cache';

// 全局扩展上下文
let extensionContext: vscode.ExtensionContext;

// Meta数据缓存实例
let metaCache: Cache | null = null;

// 缓存过期时间（秒）
const CACHE_EXPIRATION_TIME = 60 * 60; // 默认1小时过期

/**
 * 初始化Meta管理器
 * 
 * 在扩展激活时必须调用此函数以设置扩展上下文，并初始化元数据缓存
 * 这是使用Meta管理器功能的前提条件
 * 
 * 初始化过程：
 * 1. 保存扩展上下文对象，用于访问扩展资源和全局状态
 * 2. 创建Cache实例，用于缓存meta.json数据
 * 3. 设置缓存键名为'meta-json-cache'，缓存过期时间为1小时
 * 
 * @param {vscode.ExtensionContext} context - VSCode扩展上下文对象
 * @returns {void} 无返回值
 * 
 * @throws 不会直接抛出异常，但如果初始化失败，后续的缓存操作会失败
 * 
 * @example
 * ```typescript
 * // 在扩展的activate函数中调用
 * export function activate(context: vscode.ExtensionContext) {
 *   // 初始化Meta管理器
 *   initializeMetaManager(context);
 *   
 *   // 注册命令和激活其他功能...
 * }
 * ```
 */
export function initializeMetaManager(context: vscode.ExtensionContext) {
  extensionContext = context;
  
  // 初始化缓存，使用vscode-cache库
  metaCache = new Cache(context, 'meta-json-cache');
  
  debug('Meta manager initialized, cache expiration time: ' + CACHE_EXPIRATION_TIME + ' seconds');
}

/**
 * 获取meta.json文件路径
 * 
 * 内部函数，根据扩展路径计算meta.json文件的绝对路径
 * meta.json文件固定存储在扩展目录的resources/rules/目录下
 * 
 * @returns {string} meta.json的绝对路径
 * @throws 如果扩展上下文未初始化，则抛出错误
 * 
 * @internal 这是一个内部函数，不应被外部模块直接调用
 * 
 * @example
 * ```typescript
 * // 内部使用示例
 * try {
 *   const metaJsonPath = getMetaJsonPath();
 *   console.log(`Metadata file path: ${metaJsonPath}`);
 *   
 *   // 检查文件是否存在
 *   const exists = fs.existsSync(metaJsonPath);
 *   console.log(`文件存在: ${exists}`);
 * } catch (err) {
 *   console.error('Failed to get meta.json path:', err);
 * }
 * ```
 */
function getMetaJsonPath(): string {
  if (!extensionContext) {
    throw new Error('Meta manager not initialized, please call initializeMetaManager first');
  }
  return path.join(extensionContext.extensionPath, 'resources', 'rules', 'meta.json');
}

/**
 * 从文件系统加载meta.json文件
 * 
 * 直接从文件系统读取并解析meta.json文件，不使用缓存
 * 如果文件不存在，返回空的默认结构
 * 
 * 执行流程：
 * 1. 获取meta.json文件的绝对路径
 * 2. 检查文件是否存在
 * 3. 如果文件不存在，返回默认的空结构
 * 4. 读取文件内容并解析为JSON对象
 * 5. 记录加载成功的日志
 * 
 * @returns {Promise<MetaJsonData>} 解析后的meta.json内容
 * @throws 如果文件读取或解析失败，会抛出对应错误
 * 
 * @internal 这是一个内部函数，不应被外部模块直接调用
 * 
 * @example
 * ```typescript
 * // 内部使用示例
 * try {
 *   const metaData = await loadMetaJsonFromFile();
 *   console.log(`成功加载了 ${metaData.rules.length} 条规则`);
 *   console.log(`元数据版本: ${metaData.version}`);
 *   console.log(`最后更新日期: ${metaData.lastUpdated}`);
 * } catch (err) {
 *   console.error('Failed to load meta.json from filesystem:', err);
 * }
 * ```
 * 
 * 默认空结构：
 * ```json
 * {
 *   "rules": [],
 *   "version": "1.0.0",
 *   "lastUpdated": "2023-04-30"
 * }
 * ```
 */
async function loadMetaJsonFromFile(): Promise<MetaJsonData> {
  try {
    const metaJsonPath = getMetaJsonPath();
    info(`从文件系统加载meta.json: ${metaJsonPath}`);

    if (!fs.existsSync(metaJsonPath)) {
      warn(`meta.json不存在: ${metaJsonPath}`);
      return { 
        rules: [], 
        version: "1.0.0", 
        lastUpdated: new Date().toISOString().split('T')[0] 
      };
    }

    const content = fs.readFileSync(metaJsonPath, 'utf-8');
    const metaData = JSON.parse(content) as MetaJsonData;
    info(`成功从文件系统加载meta.json，共${metaData.rules.length}条规则`);
    return metaData;
  } catch (err) {
    error('Failed to load meta.json from filesystem:', err);
    throw err;
  }
}

/**
 * 加载meta.json文件
 * 
 * 优先从缓存读取，如果缓存不存在或已过期则从文件系统读取并更新缓存
 * 这是获取规则元数据的主要入口点
 * 
 * 工作流程：
 * 1. 检查Meta管理器是否已初始化
 * 2. 尝试从缓存中获取元数据
 * 3. 如果缓存中没有，从文件系统加载
 * 4. 更新缓存，设置过期时间
 * 5. 返回加载的元数据
 * 
 * 缓存策略：
 * - 使用vscode-cache库管理缓存
 * - 缓存键名为'metaData'
 * - 缓存过期时间为CACHE_EXPIRATION_TIME（默认1小时）
 * - 过期后自动从文件系统重新加载
 * 
 * @returns {Promise<MetaJsonData>} 解析后的meta.json内容
 * @throws 如果Meta缓存未初始化或文件加载失败
 * 
 * @example
 * ```typescript
 * // 加载规则元数据
 * try {
 *   const metaData = await loadMetaJson();
 *   console.log(`加载了${metaData.rules.length}条规则`);
 *   console.log(`元数据版本: ${metaData.version}`);
 *   console.log(`最后更新时间: ${metaData.lastUpdated}`);
 *   
 *   // 获取规则列表
 *   const rules = metaData.rules;
 *   rules.forEach(rule => {
 *     console.log(`- ${rule.name}: ${rule.description}`);
 *   });
 * } catch (err) {
 *   console.error('加载元数据失败:', err);
 * }
 * ```
 */
export async function loadMetaJson(): Promise<MetaJsonData> {
  if (!metaCache) {
    throw new Error('Meta cache not initialized, please call initializeMetaManager first');
  }

  try {
    // 尝试从缓存中获取
    if (metaCache.has('metaData')) {
      debug('从缓存加载meta.json');
      return metaCache.get('metaData') as MetaJsonData;
    }

    // 缓存不存在或已过期，从文件系统加载
    const metaData = await loadMetaJsonFromFile();
    
    // 更新缓存，设置过期时间
    await metaCache.put('metaData', metaData, CACHE_EXPIRATION_TIME);
    debug(`meta.json已缓存，${CACHE_EXPIRATION_TIME}秒后过期`);
    
    return metaData;
  } catch (err) {
    error('Failed to load meta.json:', err);
    throw err;
  }
}

/**
 * 根据ID获取规则元数据
 * 
 * 通过规则ID查找并返回对应的规则元数据
 * 如果找不到对应ID的规则，则返回null
 * 
 * 工作原理：
 * 1. 加载meta.json中的所有规则元数据
 * 2. 在规则数组中查找与指定ID匹配的规则
 * 3. 如果找到则返回该规则元数据，否则返回null
 * 
 * @param {string} id - 规则ID，唯一标识符
 * @returns {Promise<RuleMetadata | null>} 规则元数据或null（如果找不到）
 * 
 * @example
 * ```typescript
 * // 获取特定ID的规则
 * const ruleId = 'react-typescript';
 * const rule = await getRuleMetadataById(ruleId);
 * 
 * if (rule) {
 *   console.log(`找到规则: ${rule.name}`);
 *   console.log(`描述: ${rule.description}`);
 *   console.log('适用的技术栈:');
 *   if (rule.techStack.languages) {
 *     console.log(`- 语言: ${rule.techStack.languages.join(', ')}`);
 *   }
 *   if (rule.techStack.frameworks) {
 *     console.log(`- 框架: ${rule.techStack.frameworks.join(', ')}`);
 *   }
 * } else {
 *   console.log(`未找到ID为 ${ruleId} 的规则`);
 * }
 * ```
 */
export async function getRuleMetadataById(id: string): Promise<RuleMetadata | null> {
  const meta = await loadMetaJson();
  const rule = meta.rules.find(r => r.id === id);
  return rule || null;
}

/**
 * 获取所有规则元数据
 * 
 * 返回meta.json中的所有规则元数据数组
 * 适用于需要显示规则列表或进行批量操作的场景
 * 
 * 工作原理：
 * 1. 加载meta.json元数据
 * 2. 返回其中的rules数组
 * 3. 如果rules不存在，返回空数组
 * 
 * @returns {Promise<RuleMetadata[]>} 所有规则的元数据数组
 * 
 * @example
 * ```typescript
 * // 获取所有规则并显示计数
 * const allRules = await getAllRuleMetadata();
 * console.log(`共有 ${allRules.length} 条规则`);
 * 
 * // 过滤特定语言的规则
 * const typescriptRules = allRules.filter(rule => 
 *   rule.techStack?.languages?.includes('TypeScript')
 * );
 * console.log(`TypeScript相关规则: ${typescriptRules.length} 条`);
 * 
 * // 创建规则选择菜单
 * const items = allRules.map(rule => ({
 *   label: rule.name,
 *   description: rule.description,
 *   rule
 * }));
 * 
 * const selected = await vscode.window.showQuickPick(items, {
 *   placeHolder: '选择一个规则'
 * });
 * 
 * if (selected) {
 *   console.log(`用户选择了: ${selected.label}`);
 * }
 * ```
 */
export async function getAllRuleMetadata(): Promise<RuleMetadata[]> {
  const meta = await loadMetaJson();
  return meta.rules || [];
}

/**
 * 清除meta.json缓存
 * 
 * 强制清除meta.json的缓存，下次访问时将从文件系统重新加载
 * 通常在规则文件被修改后调用，以确保加载最新的规则数据
 * 
 * 工作原理：
 * 1. 检查元数据缓存是否已初始化
 * 2. 检查缓存中是否存在metaData键
 * 3. 如果存在，从缓存中删除该键
 * 4. 记录日志，表明缓存已清除
 * 
 * @returns {Promise<void>} 无返回值的Promise
 * 
 * @example
 * ```typescript
 * // 当规则文件被修改后清除缓存
 * vscode.workspace.onDidSaveTextDocument(async (document) => {
 *   // 检查是否是规则文件(.mdc文件)
 *   if (document.fileName.endsWith('.mdc')) {
 *     await clearMetaCache();
 *     console.log('规则文件已修改，已清除规则缓存');
 *     vscode.window.showInformationMessage('规则已更新，缓存已清除');
 *   }
 * });
 * 
 * // 手动触发缓存清除
 * const clearCacheCommand = vscode.commands.registerCommand(
 *   'cursor-rules.clearCache',
 *   async () => {
 *     await clearMetaCache();
 *     vscode.window.showInformationMessage('规则缓存已清除');
 *   }
 * );
 * ```
 */
export async function clearMetaCache(): Promise<void> {
  if (!metaCache) {
    return;
  }
  
  if (metaCache.has('metaData')) {
    await metaCache.forget('metaData');
    info('meta.json cache cleared');
  }
}

/**
 * Finding rules based on tech stack
 * 
 * How it works:
 * 1. Get all rule metadata
 * 2. Calculate match score between each rule and given tech stack
 * 3. Filter out rules with match scores below threshold
 * 4. Sort by match score in descending order and return results
 * 
 * @param {TechStackInfo} techStack - Tech stack information
 * @param {number} minScore - Minimum match score (0.0-1.0), default is 0.3
 * @returns {Promise<{rule: RuleMetadata, score: number}[]>} Array of rule metadata and match scores
 * 
 * @example
 * ```typescript
 * // Get rules matching project tech stack
 * const techStack: TechStackInfo = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React'],
 *   libraries: ['Redux'],
 *   tools: ['Webpack'],
 *   confidence: 0.8
 * };
 * 
 * const matches = await findRulesByTechStack(techStack, 0.5);
 * console.log(`Found ${matches.length} matching rules`);
 * 
 * matches.forEach(match => {
 *   console.log(`Rule: ${match.rule.name}, Match score: ${match.score.toFixed(2)}`);
 * });
 * 
 * if (matches.length > 0) {
 *   // Get best matching rule
 *   const bestMatch = matches[0];
 *   console.log(`Best matching rule: ${bestMatch.rule.name} (Match score: ${bestMatch.score.toFixed(2)})`);
 * }
 * ```
 */
export async function findRulesByTechStack(
  techStack: TechStackInfo,
  minScore: number = 0.3
): Promise<{rule: RuleMetadata, score: number}[]> {
  const allRules = await getAllRuleMetadata();
  const matches: {rule: RuleMetadata, score: number}[] = [];

  for (const rule of allRules) {
    let score = calculateMatchScore(rule, techStack);
    if (score >= minScore) {
      matches.push({ rule, score });
    }
  }

  // Sort by match score in descending order
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Calculate match score between rule and tech stack
 * 
 * Internal function that calculates match score based on rule metadata and project tech stack
 * Considers languages, frameworks, and tools dimensions with different weights
 * 
 * Matching algorithm explanation:
 * 1. Language match weight is 0.5
 * 2. Framework match weight is 0.3
 * 3. Tools match weight is 0.2
 * 4. Within each dimension, score is calculated based on proportion of matches
 * 5. Final score is normalized sum of dimension scores between 0-1
 * 
 * Match calculation example:
 * - If rule requires TypeScript and project uses TypeScript, language dimension gets full score
 * - If rule requires React and Angular, but project only uses React, framework dimension gets half score
 * - Final score is weighted sum of dimensions divided by total effective weight
 * 
 * @param {RuleMetadata} rule - Rule metadata
 * @param {TechStackInfo} techStack - Tech stack information
 * @returns {number} Match score (0.0-1.0)
 * 
 * @internal This is an internal function and should not be called directly by external modules
 * 
 * @example
 * ```typescript
 * // Internal usage example
 * const rule: RuleMetadata = {
 *   id: 'typescript-react',
 *   name: 'TypeScript React Rule',
 *   description: 'Rule for TypeScript React projects',
 *   techStack: {
 *     languages: ['TypeScript'],
 *     frameworks: ['React']
 *   }
 * };
 * 
 * const projectStack: TechStackInfo = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React'],
 *   libraries: ['Redux'],
 *   tools: ['Webpack'],
 *   confidence: 0.8
 * };
 * 
 * const score = calculateMatchScore(rule, projectStack);
 * console.log(`Match score: ${score.toFixed(2)}`); // Might output: 1.00
 * ```
 */
function calculateMatchScore(rule: RuleMetadata, techStack: TechStackInfo): number {
  if (!rule.techStack) return 0;
  
  let score = 0;
  let maxScore = 0;
  
  // Language match (weight 0.5)
  if (rule.techStack.languages && rule.techStack.languages.length > 0) {
    maxScore += 0.5;
    const languages = rule.techStack.languages.map(lang => lang.toLowerCase());
    
    for (const lang of techStack.languages || []) {
      if (languages.includes(lang.toLowerCase())) {
        score += 0.5 / languages.length;
      }
    }
  }
  
  // Framework match (weight 0.3)
  if (rule.techStack.frameworks && rule.techStack.frameworks.length > 0) {
    maxScore += 0.3;
    const frameworks = rule.techStack.frameworks.map(framework => framework.toLowerCase());
    
    for (const framework of techStack.frameworks || []) {
      if (frameworks.includes(framework.toLowerCase())) {
        score += 0.3 / frameworks.length;
      }
    }
  }
  
  // Tools match (weight 0.2)
  if (rule.techStack.tools && rule.techStack.tools.length > 0) {
    maxScore += 0.2;
    const tools = rule.techStack.tools.map(tool => tool.toLowerCase());
    
    for (const tool of techStack.tools || []) {
      if (tools.includes(tool.toLowerCase())) {
        score += 0.2 / tools.length;
      }
    }
  }
  
  // Normalize score (prevent division by zero)
  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Find matching rules based on tech stack
 * 
 * Find rules matching given tech stack information and calculate match scores
 * Options control search scope, minimum match score, and result limit
 * 
 * Workflow:
 * 1. Load all rule metadata (built-in and local, based on options)
 * 2. Calculate match score for each rule against the tech stack
 * 3. Filter rules with match scores above threshold
 * 4. Sort by match score in descending order
 * 5. Limit returned results
 * 
 * @param {TechStackInfo} techStack - Project tech stack information including languages, frameworks, libraries and tools
 * @param {RuleSearchOptions} options - Search configuration options
 *   - limit: Maximum number of results to return, default is 5
 *   - includeBuiltIn: Whether to include built-in rules, default is true
 *   - includeLocal: Whether to include local rules, default is true
 *   - minScore: Minimum match score threshold (0.0-1.0), default is 0.3
 * @returns {Promise<RuleMatchResult[]>} Array of match results sorted by score in descending order
 *   Each result includes rule object, match score and rule source
 * 
 * @throws May throw errors when loading rule metadata
 * 
 * @example
 * ```typescript
 * // Find rules matching React+TypeScript tech stack
 * const techStack = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React'],
 *   libraries: ['Redux'],
 *   tools: ['Webpack', 'ESLint'],
 *   confidence: 0.9
 * };
 * 
 * // Configure search options
 * const options = {
 *   limit: 3,                // Return maximum 3 results
 *   includeBuiltIn: true,    // Include built-in rules
 *   includeLocal: false,     // Don't include local rules
 *   minScore: 0.5            // Minimum match score is 0.5
 * };
 * 
 * // Execute search
 * const matches = await findMatchingRules(techStack, options);
 * 
 * // Process results
 * matches.forEach((match, index) => {
 *   console.log(`Match #${index + 1}:`);
 *   console.log(`- Rule: ${match.rule.name}`);
 *   console.log(`- Description: ${match.rule.description}`);
 *   console.log(`- Match score: ${match.matchScore.toFixed(2)}`);
 *   console.log(`- Source: ${match.source === RuleSource.BuiltIn ? 'Built-in' : 'Local'}`);
 * });
 * ```
 */
export async function findMatchingRules(
  techStack: TechStackInfo, 
  options: RuleSearchOptions = {}
): Promise<RuleMatchResult[]> {
  const {
    limit = 5,
    includeBuiltIn = true,
    includeLocal = true,
    minScore = 0.3
  } = options;

  const allRules = await getAllRuleMetadata();
  const results: RuleMatchResult[] = [];
  
  for (const rule of allRules) {
    const matchScore = calculateMatchScore(rule, techStack);
    if (matchScore >= minScore) {
      // 将元数据转为规则对象
      const ruleObj: Rule = {
        ...rule,
        content: "", // 由于不从文件加载，内容为空字符串
        isBuiltIn: true,
        source: RuleSource.BuiltIn
      };
      
      results.push({
        rule: ruleObj,
        matchScore,
        source: RuleSource.BuiltIn
      });
    }
  }
  
  // 按匹配分数排序并限制返回数量
  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

/**
 * 根据技术栈推荐规则
 * 
 * 这是findMatchingRules函数的便捷包装，用于基于技术栈推荐最合适的规则
 * 主要用于自动配置流程中，为用户推荐最适合其项目的规则
 * 
 * 功能特点：
 * 1. 提供更简洁的API接口，专注于推荐功能
 * 2. 增加错误处理，确保即使发生异常也会返回空数组而非抛出错误
 * 3. 在内部调用findMatchingRules实现核心功能
 * 
 * @param {TechStackInfo} techStack - 项目技术栈信息，包含语言、框架等
 * @param {RuleSearchOptions} options - 可选的搜索配置
 *   - limit: 最大返回结果数量
 *   - includeBuiltIn: 是否包含内置规则
 *   - includeLocal: 是否包含本地规则
 *   - minScore: 最小匹配分数阈值
 * @returns {Promise<RuleMatchResult[]>} 规则匹配结果数组，失败时返回空数组
 * 
 * @example
 * ```typescript
 * // 检测项目技术栈
 * const techStack = await detectProjectTechStack(workspaceFolder);
 * 
 * // 推荐规则
 * const recommendations = await recommendRulesForTechStack(techStack, {
 *   minScore: 0.4,
 *   limit: 3
 * });
 * 
 * // 显示推荐结果
 * if (recommendations.length > 0) {
 *   vscode.window.showInformationMessage(
 *     `推荐规则: ${recommendations.map(r => r.rule.name).join(', ')}`
 *   );
 *   
 *   // 询问用户是否使用最佳匹配
 *   const bestMatch = recommendations[0];
 *   const useRecommended = await vscode.window.showQuickPick(
 *     ['是', '否'],
 *     { placeHolder: `是否使用推荐的"${bestMatch.rule.name}"规则?` }
 *   );
 *   
 *   if (useRecommended === '是') {
 *     await applyRuleToWorkspace(bestMatch.rule, workspaceFolder);
 *   }
 * } else {
 *   vscode.window.showInformationMessage('没有找到合适的规则推荐');
 * }
 * ```
 */
export async function recommendRulesForTechStack(
  techStack: TechStackInfo,
  options: RuleSearchOptions = {}
): Promise<RuleMatchResult[]> {
  try {
    return await findMatchingRules(techStack, options);
  } catch (err) {
    error('推荐规则失败:', err);
    return [];
  }
}

/**
 * 获取适用于技术栈的最佳匹配规则
 * 
 * 查找与给定技术栈匹配度最高的单个规则
 * 这是recommendRulesForTechStack的简化版，直接返回最佳匹配的规则对象
 * 
 * 功能特点：
 * 1. 自动设置limit为1，只获取最佳匹配
 * 2. 简化返回结果，直接返回规则对象而非匹配结果数组
 * 3. 如果没有找到匹配的规则，返回null
 * 
 * 使用场景：
 * - 自动配置时需要一个最佳推荐规则
 * - 用户界面上显示"推荐规则"时
 * - 简化代码逻辑，无需处理数组
 * 
 * @param {TechStackInfo} techStack - 技术栈信息对象
 * @param {RuleSearchOptions} options - 可选的搜索选项（除了limit，其他选项都会传递给底层函数）
 * @returns {Promise<Rule | null>} 最佳匹配的规则对象，如果没有匹配则返回null
 * 
 * @example
 * ```typescript
 * // 在自动配置流程中获取最佳规则
 * async function autoConfigureWithBestRule(workspaceFolder: vscode.WorkspaceFolder) {
 *   // 检测项目技术栈
 *   const techStack = await detectProjectTechStack(workspaceFolder);
 *   
 *   // 获取最佳匹配规则
 *   const bestRule = await getBestRuleForTechStack(techStack, {
 *     minScore: 0.5,  // 设置最低匹配阈值
 *     includeLocal: false  // 只使用内置规则
 *   });
 *   
 *   if (bestRule) {
 *     // 找到匹配规则
 *     const useRule = await vscode.window.showInformationMessage(
 *       `检测到此项目最适合使用"${bestRule.name}"规则。是否应用？`,
 *       '是', '否'
 *     );
 *     
 *     if (useRule === '是') {
 *       await applyRuleToWorkspace(bestRule, workspaceFolder);
 *       return true;
 *     }
 *   } else {
 *     // 没有找到合适的规则
 *     vscode.window.showInformationMessage('未找到适合此项目的规则模板');
 *   }
 *   
 *   return false;
 * }
 * ```
 */
export async function getBestRuleForTechStack(
  techStack: TechStackInfo,
  options?: RuleSearchOptions
): Promise<Rule | null> {
  const searchOptions = {
    ...options,
    limit: 1
  };
  
  const results = await findMatchingRules(techStack, searchOptions);
  return results.length > 0 ? results[0].rule : null;
} 