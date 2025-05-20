import * as vscode from 'vscode';

/**
 * 配置项接口定义
 */
export interface ConfigItem {
	id: string;
	label: string;
	value: string | boolean | number;
	type: 'string' | 'boolean' | 'number';
}

/**
 * 默认配置接口
 */
export type DefaultConfig = ConfigItem[]; 