/**
 * 规则处理模块索引文件
 * 
 * 此文件将所有的规则处理函数导出，保持与原来的API兼容
 */

// 导出所有的规则处理函数
export { handleGetRuleList } from './getRuleList';
export { handleCreateRule } from './createRule';
export { handleGetRuleDetail } from './getRuleDetail';
export { handleOpenRule } from './openRule';
export { handleDeleteRule } from './deleteRule';
export { handleEditRule } from './editRule';

// 可选：导出工具函数，以便在需要时使用
export * as RuleHandlerUtils from './utils'; 