/**
 * configPanel/constants.ts
 * 
 * 配置面板使用的常量定义
 */
import { Rule } from '../../types';

/**
 * 预定义的规则模板，这个模板应该和manager.ts中的保持一致
 * 由于webview与扩展主进程运行在不同的上下文中，所以需要在这里重新定义
 * 而不是直接导入，确保两边的模板数据一致
 */
export const ruleTemplates: Rule[] = [
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

/**
 * 默认配置项
 */
export const defaultConfig = [
  { id: 'enableAutoCheck', label: '启动时自动检查Cursor Rules', value: true, type: 'boolean' as const },
  { id: 'defaultTemplate', label: '默认模板', value: 'basic', type: 'string' as const },
  { id: 'enableTechStackDetection', label: '启用技术栈检测', value: true, type: 'boolean' as const }
]; 