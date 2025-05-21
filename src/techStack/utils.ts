/**
 * techStack/utils.ts
 * 
 * 技术栈工具函数模块，提供技术栈信息的处理工具
 * 
 * 主要功能：
 * 1. 计算技术栈检测结果的置信度
 * 2. 生成技术栈信息的可读字符串描述
 * 
 * 这个模块被技术栈检测主模块所使用，为其提供辅助功能，
 * 包括对检测结果进行后处理和格式化，使结果更易于理解和展示
 */
import { TechStackInfo } from '../types';

/**
 * 计算检测结果的置信度
 * 
 * 根据检测到的技术栈信息量计算置信度得分，范围从0到1
 * 检测到的技术项目越多，置信度越高
 * 
 * 置信度计算规则：
 * - 检测到10项及以上：0.9
 * - 检测到7-9项：0.8
 * - 检测到5-6项：0.7
 * - 检测到3-4项：0.6
 * - 检测到1-2项：0.5
 * - 检测到0项：0.3
 * 
 * @param {TechStackInfo} result - 技术栈信息对象
 * @returns {number} 置信度数值，范围从0到1
 * 
 * @example
 * ```typescript
 * const techStack = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React'],
 *   libraries: ['Redux', 'Lodash'],
 *   tools: ['Webpack'],
 *   confidence: 0  // 初始置信度为0
 * };
 * 
 * // 计算置信度
 * const confidence = calculateConfidence(techStack);
 * console.log(`检测置信度: ${confidence}`);  // 0.7
 * 
 * // 更新技术栈对象
 * techStack.confidence = confidence;
 * ```
 */
export function calculateConfidence(result: TechStackInfo): number {
  let confidence = 0;
  
  // 基于检测到的技术数量计算置信度
  // 将所有技术栈项目（语言、框架、库、工具）的数量累加
  const totalDetected = result.languages.length + result.frameworks.length + 
                        result.libraries.length + result.tools.length;
  
  // 根据检测到的信息量调整置信度
  // 检测到的技术项目越多，置信度越高
  if (totalDetected >= 10) {
    confidence = 0.9;  // 非常高的置信度，但保留一定的不确定性
  } else if (totalDetected >= 7) {
    confidence = 0.8;  // 高置信度
  } else if (totalDetected >= 5) {
    confidence = 0.7;  // 较高置信度
  } else if (totalDetected >= 3) {
    confidence = 0.6;  // 中等置信度
  } else if (totalDetected >= 1) {
    confidence = 0.5;  // 基本置信度
  } else {
    confidence = 0.3;  // 低置信度，表示几乎没有检测到有用信息
  }
  
  return confidence;
}

/**
 * 获取技术栈信息的友好描述
 * 
 * 将技术栈信息对象转换为人类可读的字符串描述，
 * 格式为"语言: X, Y | 框架: Z | ..."
 * 
 * 生成规则：
 * 1. 对于每个非空技术栈类别，生成"类别: 项目1, 项目2, ..."格式的字符串
 * 2. 使用 | 符号连接不同类别
 * 3. 如果没有检测到任何技术栈信息，返回默认提示文本
 * 
 * @param {TechStackInfo} info - 技术栈信息对象
 * @returns {string} 格式化的描述文本
 * 
 * @example
 * ```typescript
 * // 完整技术栈示例
 * const fullStack = {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React', 'Express'],
 *   libraries: ['Redux'],
 *   tools: ['Webpack', 'ESLint'],
 *   confidence: 0.8
 * };
 * 
 * // 生成描述
 * const description1 = getTechStackDescription(fullStack);
 * console.log(description1);
 * // 输出: "语言: TypeScript, JavaScript | 框架: React, Express | 库: Redux | 工具: Webpack, ESLint"
 * 
 * // 空技术栈示例
 * const emptyStack = {
 *   languages: [],
 *   frameworks: [],
 *   libraries: [],
 *   tools: [],
 *   confidence: 0.3
 * };
 * 
 * // 生成描述
 * const description2 = getTechStackDescription(emptyStack);
 * console.log(description2);
 * // 输出: "未检测到技术栈信息"
 * ```
 */
export function getTechStackDescription(info: TechStackInfo): string {
  const parts = [];
  
  // 如果有检测到语言，添加到描述部分
  if (info.languages.length > 0) {
    parts.push(`语言: ${info.languages.join(', ')}`);
  }
  
  // 如果有检测到框架，添加到描述部分
  if (info.frameworks.length > 0) {
    parts.push(`框架: ${info.frameworks.join(', ')}`);
  }
  
  // 如果有检测到库，添加到描述部分
  if (info.libraries.length > 0) {
    parts.push(`库: ${info.libraries.join(', ')}`);
  }
  
  // 如果有检测到工具，添加到描述部分
  if (info.tools.length > 0) {
    parts.push(`工具: ${info.tools.join(', ')}`);
  }
  
  // 如果没有任何检测结果，返回默认文本
  if (parts.length === 0) {
    return '未检测到技术栈信息';
  }
  
  // 使用竖线连接各个部分
  return parts.join(' | ');
} 