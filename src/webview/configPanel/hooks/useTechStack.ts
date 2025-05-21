/**
 * configPanel/hooks/useTechStack.ts
 * 
 * 用于处理技术栈检测相关逻辑的Hook
 */
import { useState, useEffect } from 'react';
import { TechStackInfo, VSCodeAPI } from '../types';
import { ruleTemplates } from '../constants';

/**
 * 技术栈Hook返回值接口
 */
interface UseTechStackReturn {
  techStackInfo: TechStackInfo | null;
  detecting: boolean;
  handleDetectTechStack: () => void;
  getRecommendedTemplate: () => string;
  applyRecommendedTemplate: () => void;
}

/**
 * 技术栈检测Hook
 */
export const useTechStack = (
  vscode: VSCodeAPI, 
  selectedTemplateIndex: number | null,
  setSelectedTemplateIndex: (index: number) => void,
  handleConfigChange: (id: string, value: string | boolean | number) => void
): UseTechStackReturn => {
  // 技术栈信息
  const [techStackInfo, setTechStackInfo] = useState<TechStackInfo | null>(null);
  
  // 技术栈检测状态
  const [detecting, setDetecting] = useState<boolean>(false);
  
  // 处理技术栈检测消息
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'techStackDetected') {
        setTechStackInfo(message.techStackInfo);
        setDetecting(false);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);
  
  // 处理技术栈检测
  const handleDetectTechStack = () => {
    setDetecting(true);
    setTechStackInfo(null);
    
    // 发送检测命令到扩展
    vscode.postMessage({
      type: 'detectTechStack'
    });
  };
  
  // 根据技术栈推荐模板
  const getRecommendedTemplate = (): string => {
    if (!techStackInfo) {
      return ruleTemplates[selectedTemplateIndex as number]?.id || 'basic';
    }
    
    // 如果检测到TypeScript，选用TypeScript模板
    if (techStackInfo.languages.includes('TypeScript')) {
      // 如果同时检测到React，选用React模板
      if (techStackInfo.frameworks.includes('React')) {
        return 'react';
      }
      return 'typescript';
    } 
    // 如果只检测到React但不是TypeScript，依然使用React模板
    else if (techStackInfo.frameworks.includes('React')) {
      return 'react';
    }
    
    return 'basic';
  };
  
  // 应用推荐模板
  const applyRecommendedTemplate = () => {
    const recommendedTemplate = getRecommendedTemplate();
    const index = ruleTemplates.findIndex(t => t.id === recommendedTemplate);
    setSelectedTemplateIndex(index);
    
    // 更新默认模板配置
    handleConfigChange('defaultTemplate', recommendedTemplate);
  };
  
  return {
    techStackInfo,
    detecting,
    handleDetectTechStack,
    getRecommendedTemplate,
    applyRecommendedTemplate
  };
}; 