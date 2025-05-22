import * as vscode from 'vscode';
import { TechStackInfo, createEmptyTechStackInfo } from '../types';
import { detectViaLanguageServices } from './languageDetector';
import { checkFrameworkConfigFiles } from './frameworkDetector';
import { analyzeWorkspacePackages } from './packageDetector';
import { analyzePythonDependencies } from './pythonDetector';
import { analyzeCloudTechnologies } from './cloudDetector';
import { analyzeDatabases } from './databaseDetector';

/**
 * 增强技术栈信息
 * 
 * 这个函数通过多种检测方法来增强技术栈信息，包括：
 * - 检查框架配置文件
 * - 分析package.json依赖
 * - 分析Python依赖
 * - 分析云技术和容器
 * - 分析数据库技术
 * 
 * @param workspaceFolder 工作区文件夹
 * @param initialResult 可选的初始技术栈信息
 * @returns 增强后的技术栈信息
 */
export async function enhanceTechStackInfo(
  workspaceFolder: vscode.WorkspaceFolder,
  initialResult?: TechStackInfo
): Promise<TechStackInfo> {
  try {
    // 使用提供的初始结果或创建新的空结果
    const result = initialResult || await detectViaLanguageServices(workspaceFolder);
    
    // 1. 检查特定框架配置文件
    await checkFrameworkConfigFiles(workspaceFolder, result);
    
    // 2. 分析package.json中的依赖
    await analyzeWorkspacePackages(workspaceFolder, result);
    
    // 3. 分析Python项目依赖
    await analyzePythonDependencies(workspaceFolder, result);
    
    // 4. 分析云原生和容器相关技术
    await analyzeCloudTechnologies(workspaceFolder, result);
    
    // 5. 分析数据库相关技术
    await analyzeDatabases(workspaceFolder, result);
    
    return result;
  } catch (error) {
    console.error('Error enhancing tech stack info:', error);
    // 出错时返回初始结果或创建新的空结果
    return initialResult || createEmptyTechStackInfo();
  }
}

// 导出所有检测器
export {
  detectViaLanguageServices,
  checkFrameworkConfigFiles,
  analyzeWorkspacePackages,
  analyzePythonDependencies,
  analyzeCloudTechnologies,
  analyzeDatabases
}; 