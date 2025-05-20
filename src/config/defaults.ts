import { ConfigItem } from './types';

/**
 * 默认插件配置
 */
export const defaultConfig: ConfigItem[] = [
	{ id: 'enableAutoCheck', label: '启动时自动检查Cursor Rules', value: true, type: 'boolean' },
	{ id: 'defaultTemplate', label: '默认模板', value: 'basic', type: 'string' }
]; 