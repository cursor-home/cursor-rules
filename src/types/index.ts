/**
 * types/index.ts
 * 
 * 项目级全局类型定义文件，包含Cursor Rules相关的类型定义、检查结果、选项枚举和模板接口等
 * 这些类型被用于整个项目中，提供统一的类型定义和类型安全
 */
import * as vscode from 'vscode';

/**
 * 技术栈信息接口
 */
export interface TechStackInfo {
  languages: string[];  // 编程语言
  frameworks: string[]; // 框架
  libraries: string[];  // 库
  tools: string[];      // 工具
  confidence: number;   // 检测置信度 (0-1)
}

/**
 * 创建一个空的技术栈信息对象
 */
export function createEmptyTechStackInfo(): TechStackInfo {
  return {
    languages: [],
    frameworks: [],
    libraries: [],
    tools: [],
    confidence: 0
  };
}

/**
 * Cursor Rules检查结果接口
 * 
 * 用于表示在工作区中检查Cursor Rules存在情况的结果
 * 
 * @property exists - 是否存在Cursor Rules
 * @property paths - 找到的Cursor Rules文件/目录路径列表
 * @property version - 版本信息
 * @property details - 详细信息
 * 
 * @example
 * ```typescript
 * // 检查结果示例
 * const result: CursorRulesCheckResult = {
 *   exists: true,
 *   paths: [
 *     '/path/to/project/.cursor/rules',
 *     '/path/to/project/.cursorrules'
 *   ],
 *   version: 'both',
 *   details: {
 *     newFormat: true,
 *     newFormatPath: '/path/to/project/.cursor/rules',
 *     legacyFormat: true,
 *     legacyFormatPath: '/path/to/project/.cursorrules'
 *   }
 * };
 * 
 * if (result.exists) {
 *   console.log('发现Cursor Rules，路径:', result.paths.join(', '));
 * } else {
 *   console.log('未找到Cursor Rules');
 * }
 * ```
 */
export interface CursorRulesCheckResult {
	exists: boolean;
	paths: string[];
	version?: 'new' | 'legacy' | 'both';  // new: 新版目录格式 (.cursor/rules), legacy: 旧版文件格式 (.cursorrules), both: 两种格式都存在
	details?: {
		newFormat?: boolean;  // 是否存在新格式
		newFormatPath?: string;  // 新格式路径
		legacyFormat?: boolean;  // 是否存在旧格式
		legacyFormatPath?: string;  // 旧格式路径
	};
}

/**
 * 弹窗选项枚举
 * 
 * 定义当向用户展示Cursor Rules配置提示时的可选项
 * 
 * @value AutoConfigure - 自动配置，让系统自动创建Cursor Rules
 * @value ManualConfigure - 手动配置，打开配置向导引导用户配置
 * @value SkipNow - 暂不配置，本次跳过但下次仍会提示
 * @value NeverAskAgain - 此项目不再提示，永久跳过此工作区的提示
 * 
 * @example
 * ```typescript
 * // 使用枚举示例
 * const userChoice = CursorRulesPromptChoice.AutoConfigure;
 * 
 * switch (userChoice) {
 *   case CursorRulesPromptChoice.AutoConfigure:
 *     console.log('用户选择了自动配置');
 *     break;
 *   case CursorRulesPromptChoice.NeverAskAgain:
 *     console.log('用户选择不再提示');
 *     break;
 * }
 * ```
 */
export enum CursorRulesPromptChoice {
	AutoConfigure = '自动配置',
	ManualConfigure = '手动配置',
	SkipNow = '暂不配置',
	NeverAskAgain = '此项目不再提示'
}

/**
 * 技术栈匹配标准
 * 
 * 定义规则适用的技术栈条件，用于规则匹配算法
 * 
 * @property languages - 可选项，适用的编程语言数组
 * @property frameworks - 可选项，适用的框架数组
 * @property libraries - 可选项，适用的库数组
 * @property tools - 可选项，适用的工具数组
 * @property minConfidence - 可选项，最小匹配置信度阈值(0-1)
 * 
 * @example
 * ```typescript
 * const criteria: TechStackCriteria = {
 *   languages: ["TypeScript", "JavaScript"],
 *   frameworks: ["React", "Next.js"],
 *   libraries: ["Redux", "Tailwind"],
 *   minConfidence: 0.7
 * };
 * ```
 */
export interface TechStackCriteria {
  languages?: string[];
  frameworks?: string[];
  libraries?: string[];
  tools?: string[];
  minConfidence?: number;
}

/**
 * 规则元数据
 * 
 * 描述规则的基本信息，但不包含规则的具体内容
 * 
 * @property id - 规则的唯一标识符，通常是文件名或文件路径生成的唯一标识
 * @property name - 规则的显示名称，用于UI展示
 * @property description - 规则的简短描述，说明其用途
 * @property techStack - 规则适用的技术栈匹配条件
 * @property filePath - 可选项，规则文件的实际文件系统路径
 * @property files - 可选项，规则包含的多个文件信息
 * @property readContent - 读取规则内容的方法，只在需要时调用
 *                        不传参数时读取主文件，传入文件索引时读取指定文件
 * 
 * @example
 * ```typescript
 * const ruleMetadata: RuleMetadata = {
 *   id: "typescript-nextjs",
 *   name: "TypeScript Next.js 开发规则",
 *   description: "适用于基于Next.js的TypeScript项目的开发规则",
 *   techStack: {
 *     languages: ["TypeScript"],
 *     frameworks: ["Next.js", "React"]
 *   },
 *   filePath: "/path/to/rules/typescript-nextjs.mdc"
 * };
 * ```
 */
export interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  techStack?: TechStackCriteria;
  filePath?: string;  // 本地文件路径
  files?: RuleFile[];  // 规则包含的多个文件
  readContent(fileIndex?: number): Promise<string | null>;  // 读取规则内容的方法，可指定特定文件
}

/**
 * 完整规则内容
 * 
 * 包含规则元数据和实际内容，可作为模板使用
 * 
 * @property id - 规则的唯一标识符
 * @property name - 规则的显示名称
 * @property description - 规则的简短描述
 * @property content - 规则的主要内容文本
 * @property contents - 可选项，多文件规则的内容数组
 * @property techStack - 可选项，规则适用的技术栈匹配条件
 * @property isBuiltIn - 可选项，表示规则是否为内置规则
 * @property lastUpdated - 可选项，规则上次更新的时间戳
 * @property source - 可选项，规则的来源
 * @property filePath - 可选项，规则文件的实际文件系统路径
 * @property files - 可选项，规则包含的多个文件信息
 * 
 * @example
 * ```typescript
 * // 作为规则使用
 * const rule: Rule = {
 *   id: "typescript-nextjs",
 *   name: "TypeScript Next.js 开发规则",
 *   description: "适用于基于Next.js的TypeScript项目的开发规则",
 *   techStack: {
 *     languages: ["TypeScript"],
 *     frameworks: ["Next.js", "React"]
 *   },
 *   content: "# TypeScript Next.js 开发规则\n\n这里是规则内容...",
 *   isBuiltIn: true,
 *   lastUpdated: 1632468123457,
 *   source: RuleSource.BuiltIn
 * };
 * 
 * // 作为模板使用
 * const template: Rule = {
 *   id: 'typescript',
 *   name: 'TypeScript规则',
 *   description: '适用于TypeScript项目的规则',
 *   content: `---
 * description: TypeScript项目规则
 * ---
 * # TypeScript项目规范
 * 
 * ## 类型声明
 * - 总是显式声明类型，尽量避免any
 * ...其他规则内容...
 * `
 * };
 * ```
 */
export interface Rule extends RuleMetadata {
  content: string;  // 主要规则内容
  contents?: string[];  // 多文件规则的内容数组
  isBuiltIn?: boolean;
  lastUpdated?: number;
  source?: RuleSource;
}

/**
 * 规则来源
 * 
 * 枚举类型，定义规则的来源类别
 * 
 * @value BuiltIn - 内置规则，随扩展安装提供
 * @value Local - 本地规则，存储在用户本地但不是内置的规则
 * @value Custom - 自定义规则，用户创建的规则
 * 
 * @example
 * ```typescript
 * const source: RuleSource = RuleSource.BuiltIn;
 * 
 * // 使用示例
 * if (source === RuleSource.BuiltIn) {
 *   console.log("这是一个内置规则");
 * }
 * ```
 */
export enum RuleSource {
  BuiltIn = 'built-in',
  Local = 'local',
  Custom = 'custom'
}

/**
 * 规则匹配结果
 * 
 * 表示将规则与技术栈匹配后的结果
 * 
 * @property rule - 匹配的规则对象
 * @property matchScore - 匹配得分(0-1)，值越高表示匹配度越高
 * @property source - 规则的来源类型
 * 
 * @example
 * ```typescript
 * const matchResult: RuleMatchResult = {
 *   rule: { 
 *     id: "typescript-nextjs",
 *     name: "TypeScript Next.js 规则",
 *     description: "Next.js 项目规则",
 *     techStack: { languages: ["TypeScript"] },
 *     content: "规则内容...",
 *     isBuiltIn: true
 *   },
 *   matchScore: 0.85,
 *   source: RuleSource.BuiltIn
 * };
 * 
 * console.log(`匹配规则: ${matchResult.rule.name}`);
 * console.log(`匹配度: ${matchResult.matchScore * 100}%`);
 * ```
 */
export interface RuleMatchResult {
  rule: Rule;
  matchScore: number;
  source: RuleSource;
}

/**
 * 规则搜索选项
 * 
 * 定义搜索规则时的过滤和限制选项
 * 
 * @property limit - 可选项，返回结果的最大数量
 * @property includeBuiltIn - 可选项，是否包含内置规则
 * @property includeLocal - 可选项，是否包含本地规则
 * @property minScore - 可选项，最小匹配分数阈值(0-1)
 * 
 * @example
 * ```typescript
 * const searchOptions: RuleSearchOptions = {
 *   limit: 5,
 *   includeBuiltIn: true,
 *   includeLocal: false,
 *   minScore: 0.6
 * };
 * 
 * const rules = await findRules(techStack, searchOptions);
 * ```
 */
export interface RuleSearchOptions {
  limit?: number;
  includeBuiltIn?: boolean;
  includeLocal?: boolean;
  minScore?: number;
}

/**
 * 规则文件接口
 * 
 * 描述规则目录中的文件
 * 
 * @property path - 文件路径
 * @property description - 文件描述
 */
export interface RuleFile {
  path: string;
  description: string;
}

/**
 * Meta.json中的规则元数据
 * 
 * 描述meta.json中规则的元数据格式
 */
export interface MetaRuleMetadata {
  id: string;
  path: string;
  name: string;
  description: string;
  techStack: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  tags: string[];
  files?: RuleFile[];
}

/**
 * Meta.json文件数据结构
 * 
 * 描述整个meta.json文件的结构，包含规则列表、版本信息和更新日期
 * 
 * @property rules - 规则元数据数组
 * @property version - meta.json文件版本
 * @property lastUpdated - 上次更新日期，格式为YYYY-MM-DD
 * 
 * @example
 * ```typescript
 * const metaData: MetaJsonData = {
 *   rules: [
 *     {
 *       id: "typescript-basic",
 *       path: "typescript/basic.mdc",
 *       name: "TypeScript基础规则",
 *       description: "适用于TypeScript项目的基础规则",
 *       techStack: {
 *         languages: ["TypeScript"],
 *         frameworks: [],
 *         tools: ["ESLint"]
 *       },
 *       tags: ["typescript", "基础"]
 *     }
 *   ],
 *   version: "1.0.0",
 *   lastUpdated: "2023-03-15"
 * };
 * ```
 */
export interface MetaJsonData {
  rules: MetaRuleMetadata[];
  version: string;
  lastUpdated: string;
}

/**
 * 工作区状态接口
 * 
 * 定义工作区的Cursor Rules配置状态，用于持久化和状态管理
 * 
 * @property configured - 是否已经配置过Cursor Rules
 * @property enabled - 是否已启用Cursor Rules
 * @property lastCheck - 最后检查时间的ISO字符串
 * @property rules - 关联的规则文件列表
 * @property techStack - 工作区检测到的技术栈信息
 * @property ignorePatterns - 忽略的文件或目录模式列表
 * @property settings - 其他配置设置
 * 
 * @example
 * ```typescript
 * const workspaceState: WorkspaceState = {
 *   configured: true,
 *   enabled: true,
 *   lastCheck: '2023-09-01T12:00:00.000Z',
 *   rules: ['react.mdc', 'typescript.mdc'],
 *   techStack: {
 *     languages: ['TypeScript'],
 *     frameworks: ['React'],
 *     libraries: ['Redux'],
 *     tools: ['Webpack'],
 *     confidence: 0.85
 *   },
 *   ignorePatterns: ['node_modules/**', 'dist/**'],
 *   settings: {
 *     applyOnSave: true,
 *     showNotifications: true,
 *     debugMode: false
 *   }
 * };
 * ```
 */
export interface WorkspaceState {
	// 是否已经配置过Cursor Rules
	configured: boolean;
	
	// 是否已启用Cursor Rules
	enabled: boolean;
	
	// 最后检查时间
	lastCheck: string | null;
	
	// 关联的规则文件
	rules: string[];
	
	// 技术栈信息
	techStack: TechStackInfo;
	
	// 忽略的文件或目录
	ignorePatterns: string[];
	
	// 其他设置
	settings: {
		applyOnSave: boolean;
		showNotifications: boolean;
		debugMode: boolean;
	};
} 