import * as vscode from 'vscode';
import { TechStackInfo } from '../types';
import { detectViaLanguageServices } from './languageDetector';
import { checkFrameworkConfigFiles } from './frameworkDetector';
import { analyzePackageJson } from './packageDetector';
import { analyzePythonDependencies } from './pythonDetector';

// 导出所有检测器
export {
  detectViaLanguageServices,
  checkFrameworkConfigFiles,
  analyzePackageJson,
  analyzePythonDependencies
};

/**
 * 通过分析项目特定配置文件和结构增强技术栈信息
 * @param workspaceFolder 工作区文件夹
 * @param initialInfo 初始技术栈信息
 * @returns 增强后的技术栈信息
 */
export async function enhanceTechStackInfo(
  workspaceFolder: vscode.WorkspaceFolder, 
  initialInfo: TechStackInfo
): Promise<TechStackInfo> {
  const result = { ...initialInfo };

  try {
    // 1. 检查特定框架和库的配置文件
    await checkFrameworkConfigFiles(workspaceFolder, result);
    
    // 2. 如果存在package.json，分析依赖
    await analyzePackageJson(workspaceFolder, result);
    
    // 3. 针对Python项目分析requirements.txt或Pipfile
    await analyzePythonDependencies(workspaceFolder, result);
    
    // 4. 检查其他语言的依赖配置文件（预留扩展点）
    await checkOtherDependencyFiles(workspaceFolder, result);
  } catch (error) {
    console.error('增强技术栈信息时出错:', error);
  }

  return result;
}

/**
 * 检查其他语言的依赖文件（预留扩展点）
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
async function checkOtherDependencyFiles(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // 可以根据需要添加其他语言的依赖分析
  // 如Java的pom.xml, Ruby的Gemfile等
} 