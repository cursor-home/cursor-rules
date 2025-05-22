/**
 * techStack/index.ts
 * 
 * 技术栈检测模块，负责分析项目使用的编程语言、框架、库和工具等
 * 这个模块是Cursor Rules自动配置功能的核心部分，通过分析项目文件
 * 来确定项目的技术栈信息，从而推荐适合的规则模板
 * 
 * 主要功能：
 * 1. 检测项目使用的编程语言、框架、库和工具
 * 2. 计算检测结果的置信度
 * 3. 提供技术栈信息描述生成功能
 * 
 * 检测流程：
 * 1. 通过VS Code语言服务初步检测项目语言
 * 2. 使用专门的检测器增强检测结果
 * 3. 计算最终检测结果的置信度
 * 4. 返回完整的技术栈信息
 */
import * as vscode from 'vscode';
import { TechStackInfo, createEmptyTechStackInfo } from '../types';
import { calculateConfidence, getTechStackDescription } from './utils';
import { 
  detectViaLanguageServices, 
  enhanceTechStackInfo 
} from './detectors';

/**
 * 检测项目技术栈
 * 
 * 分析指定工作区的项目技术栈信息，包括使用的编程语言、框架、库和工具等
 * 通过多种检测方法综合判断，并计算结果的置信度
 * 
 * 检测步骤：
 * 1. 首先使用VS Code语言服务API初步检测项目语言
 * 2. 然后使用文件扫描等方法进一步增强检测结果
 * 3. 最后计算检测结果的整体置信度
 * 
 * @param {vscode.WorkspaceFolder} workspaceFolder - 要检测的工作区文件夹对象
 * @returns {Promise<TechStackInfo>} 包含项目技术栈信息的对象
 * 
 * @throws 如果检测过程出错，会捕获异常并返回空的技术栈信息
 * 
 * @example
 * ```typescript
 * // 检测当前打开的项目技术栈
 * const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
 * 
 * if (workspaceFolder) {
 *   try {
 *     const techStack = await detectProjectTechStack(workspaceFolder);
 *     
 *     console.log('Detected tech stack:');
 *     console.log(`语言: ${techStack.languages.join(', ')}`);
 *     console.log(`框架: ${techStack.frameworks.join(', ')}`);
 *     console.log(`库: ${techStack.libraries.join(', ')}`);
 *     console.log(`工具: ${techStack.tools.join(', ')}`);
 *     console.log(`置信度: ${techStack.confidence}`);
 *     
 *     // 获取技术栈描述
 *     const description = getTechStackDescription(techStack);
 *     console.log(`技术栈描述: ${description}`);
 *   } catch (error) {
 *     console.error('Error detecting tech stack:', error);
 *   }
 * }
 * ```
 * 
 * 返回数据样例：
 * ```typescript
 * {
 *   languages: ['TypeScript', 'JavaScript'],
 *   frameworks: ['React', 'Next.js'],
 *   libraries: ['Redux', 'Tailwind CSS'],
 *   tools: ['Webpack', 'ESLint'],
 *   confidence: 0.85
 * }
 * ```
 */
export async function detectProjectTechStack(workspaceFolder: vscode.WorkspaceFolder): Promise<TechStackInfo> {
  // 初始化结果为空的技术栈信息
  const result = createEmptyTechStackInfo();

  try {
    // 1. 先使用VS Code语言服务方法，基于文件类型初步检测
    const vscodeResult = await detectViaLanguageServices(workspaceFolder);
    
    // 2. 然后使用其他检测器增强检测结果，分析package.json等配置文件
    const enhancedResult = await enhanceTechStackInfo(workspaceFolder, vscodeResult);
    
    // 3. 根据检测到的技术栈元素数量和质量，计算并设置置信度
    enhancedResult.confidence = calculateConfidence(enhancedResult);
    
    return enhancedResult;
  } catch (error) {
    // 如果检测过程出现任何错误，记录日志并返回空结果
    console.error('Error detecting tech stack:', error);
    return result;
  }
}

// 导出公共API，方便其他模块使用
export {
  TechStackInfo,
  getTechStackDescription
}; 