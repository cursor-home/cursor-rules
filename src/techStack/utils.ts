import { TechStackInfo } from './types';

/**
 * 计算检测结果的置信度
 * @param result 技术栈信息
 * @returns 置信度数值 (0-1)
 */
export function calculateConfidence(result: TechStackInfo): number {
  let confidence = 0;
  
  // 基于检测到的技术数量计算置信度
  const totalDetected = result.languages.length + result.frameworks.length + 
                        result.libraries.length + result.tools.length;
  
  // 根据检测到的信息量调整置信度
  if (totalDetected >= 10) {
    confidence = 0.9;
  } else if (totalDetected >= 7) {
    confidence = 0.8;
  } else if (totalDetected >= 5) {
    confidence = 0.7;
  } else if (totalDetected >= 3) {
    confidence = 0.6;
  } else if (totalDetected >= 1) {
    confidence = 0.5;
  } else {
    confidence = 0.3;
  }
  
  return confidence;
}

/**
 * 获取技术栈信息的友好描述
 * @param info 技术栈信息
 * @returns 格式化的描述文本
 */
export function getTechStackDescription(info: TechStackInfo): string {
  const parts = [];
  
  if (info.languages.length > 0) {
    parts.push(`语言: ${info.languages.join(', ')}`);
  }
  
  if (info.frameworks.length > 0) {
    parts.push(`框架: ${info.frameworks.join(', ')}`);
  }
  
  if (info.libraries.length > 0) {
    parts.push(`库: ${info.libraries.join(', ')}`);
  }
  
  if (info.tools.length > 0) {
    parts.push(`工具: ${info.tools.join(', ')}`);
  }
  
  if (parts.length === 0) {
    return '未检测到技术栈信息';
  }
  
  return parts.join(' | ');
} 