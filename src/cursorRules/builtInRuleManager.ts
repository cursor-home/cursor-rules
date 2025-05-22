/**
 * builtInRuleManager.ts
 * 
 * Cursor Rules 内置规则管理器
 * 负责管理和提供插件内置的规则模板
 * 
 * 主要功能：
 * 1. 加载和管理内置规则元数据
 * 2. 提供规则查询和匹配功能
 * 3. 基于项目技术栈推荐合适的规则
 * 4. 维护规则元数据缓存
 * 
 * 工作流程：
 * 1. 初始化时加载内置规则元数据
 * 2. 提供规则查询和推荐接口
 * 3. 根据技术栈匹配最合适的规则
 * 4. 管理元数据缓存生命周期
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { Rule, RuleMetadata, TechStackInfo, MetaJsonData, RuleMatchResult, RuleSource, RuleSearchOptions, MetaRuleMetadata } from '../types';
import { debug, info, warn, error } from '../logger/logger';
import { fileExists, readFileContent } from '../utils/fsUtils';
import Cache from 'vscode-cache';

// 单例实例
let instance: BuiltInRuleManager | null = null;

// 缓存过期时间（秒）
const CACHE_EXPIRATION_TIME = 60 * 60; // 默认1小时过期

/**
 * 内置规则管理器类
 * 负责管理和提供插件内置的规则模板
 */
export class BuiltInRuleManager {
  private extensionContext: vscode.ExtensionContext | null = null;
  private metaCache: Cache | null = null;
  
  /**
   * 私有构造函数，防止直接创建实例
   * 使用 initialize 方法初始化单例
   */
  private constructor() {
    debug('内置规则管理器实例已创建');
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): BuiltInRuleManager {
    if (!instance) {
      instance = new BuiltInRuleManager();
    }
    return instance;
  }
  
  /**
   * 初始化内置规则管理器
   * 
   * 在扩展激活时必须调用此函数以设置扩展上下文，并初始化元数据缓存
   * 这是使用内置规则管理器功能的前提条件
   * 
   * @param {vscode.ExtensionContext} context - VSCode扩展上下文对象
   */
  public initialize(context: vscode.ExtensionContext): void {
    this.extensionContext = context;
    
    // 初始化缓存，使用vscode-cache库
    this.metaCache = new Cache(context, 'meta-json-cache');
    
    debug('内置规则管理器已初始化，缓存过期时间: ' + CACHE_EXPIRATION_TIME + ' 秒');
  }
  
  /**
   * 获取meta.json文件URI
   * 
   * 内部函数，根据扩展路径计算meta.json文件的URI
   * meta.json文件固定存储在扩展目录的resources/rules/目录下
   * 
   * @returns {vscode.Uri} meta.json的URI
   * @throws 如果扩展上下文未初始化，则抛出错误
   */
  private getMetaJsonUri(): vscode.Uri {
    if (!this.extensionContext) {
      throw new Error('内置规则管理器未初始化，请先调用 initialize');
    }
    return vscode.Uri.joinPath(
      vscode.Uri.file(this.extensionContext.extensionPath), 
      'resources', 
      'rules', 
      'meta.json'
    );
  }
  
  /**
   * 从文件系统加载meta.json文件
   * 
   * 直接从文件系统读取并解析meta.json文件，不使用缓存
   * 如果文件不存在，抛出错误
   * 
   * @returns {Promise<MetaJsonData>} 解析后的meta.json内容
   */
  private async loadMetaJsonFromFile(): Promise<MetaJsonData> {
    try {
      const metaJsonUri = this.getMetaJsonUri();
      info(`从文件系统加载meta.json: ${metaJsonUri.fsPath}`);
  
      const exists = await fileExists(metaJsonUri);
      if (!exists) {
        error(`meta.json文件不存在: ${metaJsonUri.fsPath}，这是扩展必需的核心配置文件`);
        throw new Error(`meta.json文件不存在: ${metaJsonUri.fsPath}，无法加载内置规则配置`);
      }
  
      const content = await readFileContent(metaJsonUri);
      if (content === null) {
        throw new Error(`无法读取meta.json文件: ${metaJsonUri.fsPath}`);
      }
      
      const metaData = JSON.parse(content) as MetaJsonData;
      info(`成功从文件系统加载meta.json，共${metaData.rules.length}条规则`);
      return metaData;
    } catch (err) {
      error('从文件系统加载meta.json失败:', err);
      throw err;
    }
  }
  
  /**
   * 加载meta.json文件
   * 
   * 优先从缓存读取，如果缓存不存在或已过期则从文件系统读取并更新缓存
   * 这是获取规则元数据的主要入口点
   * 
   * @returns {Promise<MetaJsonData>} 解析后的meta.json内容
   */
  public async loadMetaJson(): Promise<MetaJsonData> {
    if (!this.metaCache) {
      throw new Error('Meta缓存未初始化，请先调用initialize');
    }
  
    try {
      // 尝试从缓存中获取
      if (this.metaCache.has('metaData')) {
        debug('从缓存加载meta.json');
        return this.metaCache.get('metaData') as MetaJsonData;
      }
  
      // 缓存不存在或已过期，从文件系统加载
      const metaData = await this.loadMetaJsonFromFile();
      
      // 更新缓存，设置过期时间
      await this.metaCache.put('metaData', metaData, CACHE_EXPIRATION_TIME);
      debug(`meta.json已缓存，${CACHE_EXPIRATION_TIME}秒后过期`);
      
      return metaData;
    } catch (err) {
      error('加载meta.json失败:', err);
      throw err;
    }
  }
  
  /**
   * 根据文件路径创建单文件读取函数
   * 
   * 生成一个读取特定路径文件内容的函数
   * 这是底层的工具方法，只负责单个文件的读取
   * 
   * @param {string} filePath - 文件相对路径，相对于rules目录
   * @param {string} extensionPath - 扩展目录路径
   * @returns {() => Promise<string | null>} 读取文件内容的函数
   */
  private createSingleFileReader(filePath: string, extensionPath: string): () => Promise<string | null> {
    return async () => {
      try {
        const fileUri = vscode.Uri.joinPath(
          vscode.Uri.file(extensionPath),
          'resources',
          'rules',
          filePath
        );
        
        debug(`读取规则文件: ${fileUri.fsPath}`);
        return await readFileContent(fileUri);
      } catch (err) {
        error(`读取规则文件失败: ${filePath}`, err);
        return null;
      }
    };
  }
  
  /**
   * 增强规则元数据
   * 
   * 为规则元数据添加readContent方法
   * readContent方法根据文件索引直接读取对应文件内容
   * 
   * @param {MetaRuleMetadata} rule - 规则元数据
   * @param {string} extensionPath - 扩展目录路径
   * @returns {RuleMetadata} 增强后的规则元数据
   */
  private enhanceRuleMetadata(rule: MetaRuleMetadata, extensionPath: string): RuleMetadata {
    // 增强规则元数据，添加readContent方法
    return {
      ...rule,
      readContent: async (fileIndex?: number) => {
        // 处理多文件规则
        if (rule.files && rule.files.length > 0) {
          // 获取要读取的文件信息
          const fileInfo = fileIndex !== undefined && fileIndex >= 0 && fileIndex < rule.files.length
            ? rule.files[fileIndex]  // 使用指定的文件索引
            : rule.files[0];         // 默认使用第一个文件
          
          // 创建文件读取函数
          const reader = this.createSingleFileReader(fileInfo.path, extensionPath);
          debug(`读取文件: ${fileInfo.path} (规则: ${rule.id})`);
          return await reader();
        }
        
        // 处理单文件规则
        const relativePath = rule.path || `${rule.id}.mdc`;
        const reader = this.createSingleFileReader(relativePath, extensionPath);
        debug(`读取文件: ${relativePath} (规则: ${rule.id})`);
        return await reader();
      }
    };
  }
  
  /**
   * 根据ID获取规则元数据
   * 
   * 通过规则ID查找并返回对应的规则元数据
   * 如果找不到对应ID的规则，则返回null
   * 
   * @param {string} id - 规则ID，唯一标识符
   * @returns {Promise<RuleMetadata | null>} 规则元数据或null（如果找不到）
   */
  public async getRuleMetadataById(id: string): Promise<RuleMetadata | null> {
    if (!this.extensionContext) {
      throw new Error('内置规则管理器未初始化，请先调用 initialize');
    }
    
    const meta = await this.loadMetaJson();
    const rule = meta.rules.find(r => r.id === id);
    if (!rule) {
      return null;
    }
    
    const extensionPath = this.extensionContext.extensionPath;
    
    // 增强规则元数据，添加readContent函数
    return this.enhanceRuleMetadata(rule, extensionPath);
  }
  
  /**
   * 获取所有规则元数据
   * 
   * 返回meta.json中的所有规则元数据数组
   * 适用于需要显示规则列表或进行批量操作的场景
   * 
   * @returns {Promise<RuleMetadata[]>} 所有规则的元数据数组
   */
  public async getAllRuleMetadata(): Promise<RuleMetadata[]> {
    if (!this.extensionContext) {
      throw new Error('内置规则管理器未初始化，请先调用 initialize');
    }
    
    const meta = await this.loadMetaJson();
    const extensionPath = this.extensionContext.extensionPath;
    
    // 增强所有规则元数据，添加readContent函数
    return meta.rules.map(rule => this.enhanceRuleMetadata(rule, extensionPath));
  }
  
  /**
   * 清除meta.json缓存
   * 
   * 强制清除meta.json的缓存，下次访问时将从文件系统重新加载
   * 通常在规则文件被修改后调用，以确保加载最新的规则数据
   */
  public async clearMetaCache(): Promise<void> {
    if (!this.metaCache) {
      return;
    }
    
    if (this.metaCache.has('metaData')) {
      await this.metaCache.forget('metaData');
      info('meta.json 缓存已清除');
    }
  }
  
  /**
   * 计算规则与技术栈的匹配分数
   * 
   * 内部函数，计算规则元数据和项目技术栈的匹配程度
   * 考虑语言、框架和工具维度，使用不同权重
   * 
   * @param {RuleMetadata} rule - 规则元数据
   * @param {TechStackInfo} techStack - 技术栈信息
   * @returns {number} 匹配分数 (0.0-1.0)
   */
  private calculateMatchScore(rule: RuleMetadata, techStack: TechStackInfo): number {
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
   * 加载规则内容
   * 
   * 加载规则的所有文件内容，用于规则匹配结果
   * 
   * @param {RuleMetadata} rule - 规则元数据
   * @returns {Promise<{content: string, contents: string[]} | null>} 成功加载则返回内容对象，否则返回null
   */
  private async loadRuleContents(rule: RuleMetadata): Promise<{content: string, contents: string[]} | null> {
    try {
      // 处理多文件规则
      if (rule.files && rule.files.length > 0) {
        debug(`加载多文件规则[${rule.id}]内容，共${rule.files.length}个文件`);
        
        // 为每个文件创建读取任务
        const contentPromises = rule.files.map((_, index) => rule.readContent(index));
        const contents = await Promise.all(contentPromises);
        
        // 过滤掉null值，确保所有文件都成功读取
        const validContents = contents.filter((content): content is string => content !== null);
        
        // 只有当至少有一个文件成功读取时才返回内容
        if (validContents.length > 0) {
          // 第一个文件作为主内容
          const mainContent = validContents[0];
          debug(`成功加载规则[${rule.id}]的${validContents.length}个文件内容`);
          return {
            content: mainContent,
            contents: validContents
          };
        }
        
        debug(`规则[${rule.id}]的所有文件均加载失败`);
        return null;
      }
      
      // 处理单文件规则
      const content = await rule.readContent();
      if (content !== null) {
        debug(`成功加载单文件规则[${rule.id}]内容`);
        return {
          content,
          contents: [content]
        };
      }
      
      debug(`单文件规则[${rule.id}]加载失败`);
      return null;
    } catch (err) {
      error(`加载规则内容失败: ${rule.id}`, err);
      return null;
    }
  }
  
  /**
   * 查找匹配的规则
   * 
   * 根据技术栈信息查找匹配的规则并计算匹配分数
   * 选项控制搜索范围、最小匹配分数和结果数量限制
   * 支持多文件规则
   * 
   * @param {TechStackInfo} techStack - 项目技术栈信息
   * @param {RuleSearchOptions} options - 搜索配置选项
   * @returns {Promise<RuleMatchResult[]>} 规则匹配结果数组
   */
  public async findMatchingRules(
    techStack: TechStackInfo, 
    options: RuleSearchOptions = {}
  ): Promise<RuleMatchResult[]> {
    const {
      limit = 5,
      includeBuiltIn = true,
      includeLocal = true,
      minScore = 0.3
    } = options;
  
    const allRules = await this.getAllRuleMetadata();
    const results: RuleMatchResult[] = [];
    
    // 计算匹配分数并过滤出符合分数要求的规则
    const matchingRules = allRules
      .map(rule => ({
        rule,
        matchScore: this.calculateMatchScore(rule, techStack)
      }))
      .filter(({ matchScore }) => matchScore >= minScore);
      
    debug(`找到${matchingRules.length}条匹配分数满足要求的规则`);
    
    // 对于每条匹配的规则，加载内容并创建规则对象
    for (const { rule, matchScore } of matchingRules) {
      // 加载规则内容
      const contentResult = await this.loadRuleContents(rule);
      
      if (contentResult) {
        // 创建规则对象
        const ruleObj: Rule = {
          ...rule,
          content: contentResult.content,
          contents: contentResult.contents,
          source: RuleSource.BuiltIn
        };
        
        results.push({
          rule: ruleObj,
          matchScore,
          source: RuleSource.BuiltIn
        });
        
        debug(`已添加规则: ${rule.id}`);
      }
    }
    
    debug(`共找到${results.length}条可用的匹配规则`);
    
    // 按匹配分数排序并限制返回数量
    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }
  
  /**
   * 获取适用于技术栈的最佳匹配规则
   * 
   * 查找与给定技术栈匹配度最高的单个规则
   * 这是findMatchingRules的简化版，直接返回最佳匹配的规则对象
   * 
   * @param {TechStackInfo} techStack - 技术栈信息对象
   * @param {RuleSearchOptions} options - 可选的搜索选项
   * @returns {Promise<Rule | null>} 最佳匹配的规则对象
   */
  public async getBestRuleForTechStack(
    techStack: TechStackInfo,
    options?: RuleSearchOptions
  ): Promise<Rule | null> {
    const searchOptions = {
      ...options,
      limit: 1
    };
    
    const results = await this.findMatchingRules(techStack, searchOptions);
    return results.length > 0 ? results[0].rule : null;
  }
}

// 创建并导出单例实例
export const builtInRuleManager = BuiltInRuleManager.getInstance(); 