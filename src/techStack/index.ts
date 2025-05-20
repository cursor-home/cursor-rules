import * as vscode from 'vscode';
import { TechStackInfo, createEmptyTechStackInfo } from './types';
import { calculateConfidence, getTechStackDescription } from './utils';
import { 
  detectViaLanguageServices, 
  enhanceTechStackInfo 
} from './detectors';

/**
 * 检测项目技术栈
 * @param workspaceFolder 工作区文件夹
 * @returns 技术栈信息
 */
export async function detectProjectTechStack(workspaceFolder: vscode.WorkspaceFolder): Promise<TechStackInfo> {
  // 初始化结果
  const result = createEmptyTechStackInfo();

  try {
    // 1. 先使用语言服务方法
    const vscodeResult = await detectViaLanguageServices(workspaceFolder);
    
    // 2. 然后增强检测结果
    const enhancedResult = await enhanceTechStackInfo(workspaceFolder, vscodeResult);
    
    // 3. 设置置信度
    enhancedResult.confidence = calculateConfidence(enhancedResult);
    
    return enhancedResult;
  } catch (error) {
    console.error('检测技术栈时出错:', error);
    return result;
  }
}

// 导出公共API
export {
  TechStackInfo,
  getTechStackDescription
}; 