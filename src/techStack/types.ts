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