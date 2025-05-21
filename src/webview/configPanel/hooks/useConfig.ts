/**
 * configPanel/hooks/useConfig.ts
 * 
 * 用于处理配置相关逻辑的Hook
 */
import { useState, useEffect } from 'react';
import { ConfigItem, VSCodeAPI } from '../types';
import { defaultConfig, ruleTemplates } from '../constants';

/**
 * 配置Hook返回值接口
 */
interface UseConfigReturn {
  config: ConfigItem[];
  selectedTemplateIndex: number | null;
  previewContent: string;
  handleConfigChange: (id: string, value: string | boolean | number) => void;
  handleCreateTemplate: () => void;
}

/**
 * 扩展默认配置，添加新的配置项
 */
const extendedDefaultConfig: ConfigItem[] = [
  ...defaultConfig,
  // 添加旧版规则自动转换设置
  { 
    id: 'autoConvertLegacyRules', 
    label: '自动转换旧版Cursor Rule', 
    value: false, 
    type: 'boolean' 
  },
  // 添加不再询问设置，用于配合旧版规则转换提示
  { 
    id: 'dontAskForConversion', 
    label: '不再询问是否转换旧版规则', 
    value: false, 
    type: 'boolean' 
  }
];

/**
 * 配置管理Hook
 */
export const useConfig = (vscode: VSCodeAPI): UseConfigReturn => {
  // 通用配置项状态
  const [config, setConfig] = useState<ConfigItem[]>(extendedDefaultConfig);
  
  // 选中的模板
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  
  // 模板预览
  const [previewContent, setPreviewContent] = useState<string>('');

  // 处理配置消息
  useEffect(() => {
    // 监听来自扩展的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'configLoaded') {
        // 合并已有配置和扩展的新配置项
        const mergedConfig = [...message.config];
        
        // 检查并添加可能不存在的新配置项
        const existingConfigIds = new Set(mergedConfig.map((item: ConfigItem) => item.id));
        
        extendedDefaultConfig.forEach(defaultItem => {
          if (!existingConfigIds.has(defaultItem.id)) {
            mergedConfig.push(defaultItem);
          }
        });
        
        setConfig(mergedConfig);
        
        // 设置默认模板
        const defaultTemplate = message.config.find((item: ConfigItem) => item.id === 'defaultTemplate');
        if (defaultTemplate) {
          setSelectedTemplateIndex(ruleTemplates.findIndex(t => t.id === defaultTemplate.value as string));
        }
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // 请求初始配置
    vscode.postMessage({ type: 'getConfig' });
    
    // 返回清理函数
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [vscode]);
  
  // 更新模板预览
  useEffect(() => {
    if (selectedTemplateIndex !== null) {
      setPreviewContent(ruleTemplates[selectedTemplateIndex].content);
    }
  }, [selectedTemplateIndex]);
  
  // 处理配置更改
  const handleConfigChange = (id: string, value: string | boolean | number) => {
    const newConfig = config.map(item => 
      item.id === id ? { ...item, value } : item
    );
    
    setConfig(newConfig);
    
    // 发送更新到扩展
    vscode.postMessage({
      type: 'updateConfig',
      config: newConfig
    });
    
    // 如果更改的是默认模板，则更新预览
    if (id === 'defaultTemplate') {
      setSelectedTemplateIndex(ruleTemplates.findIndex(t => t.id === value as string));
    }
    
    // 特殊处理旧版规则转换设置
    if (id === 'autoConvertLegacyRules' && value === true) {
      // 如果启用了自动转换，则自动禁用"不再询问"选项
      const updatedConfig = newConfig.map(item =>
        item.id === 'dontAskForConversion' ? { ...item, value: false } : item
      );
      setConfig(updatedConfig);
      
      // 发送更新到扩展
      vscode.postMessage({
        type: 'updateConfig',
        config: updatedConfig
      });
    }
  };
  
  // 创建选中的模板
  const handleCreateTemplate = () => {
    if (selectedTemplateIndex === null) return;
    
    vscode.postMessage({
      type: 'createTemplate',
      templateId: ruleTemplates[selectedTemplateIndex].id
    });
  };

  return {
    config,
    selectedTemplateIndex,
    previewContent,
    handleConfigChange,
    handleCreateTemplate
  };
}; 