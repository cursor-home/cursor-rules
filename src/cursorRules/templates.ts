/**
 * templates.ts
 * 
 * 规则模板定义模块，包含各种预定义的规则模板，用于快速创建Cursor Rules
 * 
 * 主要功能：
 * 1. 定义不同类型项目的规则模板
 * 2. 为模板提供ID、名称、描述和内容
 * 3. 支持按技术栈类型筛选模板
 */
import { RuleTemplate } from '../types';

/**
 * 预定义规则模板集合
 * 
 * 包含基础模板、TypeScript模板和React模板
 * 每个模板包含ID、名称、描述和内容
 * 
 * 使用方式：
 * ```typescript
 * // 获取基础模板
 * const basicTemplate = ruleTemplates.find(t => t.id === 'basic');
 * 
 * // 应用模板
 * if (basicTemplate) {
 *   createRuleFromTemplate(workspaceFolder, basicTemplate);
 * }
 * ```
 */
export const ruleTemplates: RuleTemplate[] = [
	/**
	 * 基础规则模板
	 * 
	 * 提供通用的编码规范，适用于任何类型的项目
	 * 不包含特定语言或框架的规则
	 * 
	 * 特点：
	 * - 提供基本的代码风格指南
	 * - 包含基础的安全规则
	 * - 留有项目特定规则的空间
	 * 
	 * 使用时机：
	 * - 无法确定项目的技术栈
	 * - 作为多语言混合项目的基础
	 * - 快速初始化规则时使用
	 */
	{
		id: 'basic',
		name: '基础规则',
		description: '适用于所有项目的通用规则',
		content: `---
description: 通用项目规则
---
# 通用编码规范

## 代码风格
- 使用一致的缩进和格式
- 变量命名采用驼峰命名法
- 避免过长的函数和嵌套层级
- 总是添加适当的注释

## 安全规则
- 避免硬编码密钥或敏感信息
- 确保正确处理用户输入
- 使用安全的API调用方式

## 项目特定规则
- 在此添加项目特有的规则和惯例
`
	},
	
	/**
	 * TypeScript规则模板
	 * 
	 * 专为TypeScript项目设计的规则，包含类型声明、函数规范和项目组织规则
	 * 设置了globs属性以匹配所有.ts和.tsx文件
	 * 
	 * 特点：
	 * - 专注于TypeScript的类型系统最佳实践
	 * - 包含清晰的函数签名规范
	 * - 提供项目组织结构建议
	 * 
	 * 使用时机：
	 * - 检测到项目使用TypeScript
	 * - 纯TypeScript项目或TypeScript与JavaScript混合项目
	 * - Node.js后端或前端非React项目
	 * 
	 * globs属性：
	 * "** /*.ts,** /*.tsx" - 匹配所有.ts和.tsx文件，使规则仅应用于这些文件
	 */
	{
		id: 'typescript',
		name: 'TypeScript规则',
		description: '适用于TypeScript项目的规则',
		content: `---
description: TypeScript项目规则
globs: "**/*.ts,**/*.tsx"
---
# TypeScript项目规范

## 类型声明
- 总是显式声明类型，尽量避免any
- 使用接口（interface）定义对象类型
- 使用类型别名（type）定义复杂类型
- 使用枚举（enum）定义固定选项集合

## 函数规范
- 所有函数必须有返回类型声明
- 使用函数重载表达复杂的类型关系
- 尽量使用箭头函数保持this上下文

## 项目组织
- 每个文件只导出一个主要类或函数
- 相关功能放在同一目录下
- 使用index.ts统一导出API
`
	},
	
	/**
	 * React规则模板
	 * 
	 * 专为React项目设计的规则，包含组件设计、状态管理和性能优化规则
	 * 设置了globs属性以匹配所有.tsx和.jsx文件
	 * 
	 * 特点：
	 * - 专注于React函数组件和Hooks的最佳实践
	 * - 提供状态管理策略和组件设计原则
	 * - 包含性能优化建议
	 * 
	 * 使用时机：
	 * - 检测到项目使用React框架
	 * - React与TypeScript结合的项目最适合
	 * - 也适用于React与JavaScript的项目
	 * 
	 * globs属性：
	 * "** /*.tsx,** /*.jsx" - 匹配所有.tsx和.jsx文件，使规则仅应用于React组件文件
	 */
	{
		id: 'react',
		name: 'React规则',
		description: '适用于React项目的规则',
		content: `---
description: React项目规则
globs: "**/*.tsx,**/*.jsx"
---
# React项目规范

## 组件设计
- 优先使用函数组件和Hooks
- 组件尽量保持纯函数，避免副作用
- 使用自定义Hook封装复杂逻辑
- 大型组件拆分为小组件

## 状态管理
- 使用useState管理简单状态
- 复杂状态使用useReducer
- 跨组件状态使用Context API
- 避免过度使用全局状态

## 性能优化
- 使用React.memo避免不必要的重新渲染
- 使用useCallback缓存回调函数
- 使用useMemo缓存计算结果
`
	}
]; 