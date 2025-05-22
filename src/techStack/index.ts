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
import { TechStackInfo, createEmptyTechStackInfo } from './types';
import { detectViaLanguageServices } from './detectors/languageDetector';
import { checkFrameworkConfigFiles } from './detectors/frameworkDetector';
import { analyzeWorkspacePackages } from './detectors/packageDetector';
import { analyzeCloudTechnologies } from './detectors/cloudDetector';
import { analyzeDatabases } from './detectors/databaseDetector';
import { enhanceTechStackInfo } from './detectors';
import { analyzePythonDependencies } from './detectors/pythonDetector';
import { calculateConfidence, getTechStackDescription } from './utils';

/**
 * 检测项目的技术栈
 * @param workspaceFolder 工作区文件夹
 * @returns 技术栈信息，包括置信度和描述
 */
export async function detectTechStack(workspaceFolder: vscode.WorkspaceFolder): Promise<TechStackInfo> {
  // 创建空的技术栈信息对象
  const result = createEmptyTechStackInfo();
  
  try {
    // 1. 使用VSCode语言服务进行初步检测
    const languageResult = await detectViaLanguageServices(workspaceFolder);
    mergeTechStackResults(result, languageResult);
    
    // 2. 使用多个专门的检测器增强检测结果
    
    // 2.1 检查特定框架配置文件
    await checkFrameworkConfigFiles(workspaceFolder, result);
    
    // 2.2 分析package.json中的依赖
    await analyzeWorkspacePackages(workspaceFolder, result);
    
    // 2.3 分析Python项目依赖
    await analyzePythonDependencies(workspaceFolder, result);
    
    // 2.4 分析云原生和容器相关技术
    await analyzeCloudTechnologies(workspaceFolder, result);
    
    // 2.5 分析数据库相关技术
    await analyzeDatabases(workspaceFolder, result);
    
    // 2.6 检查其他依赖文件
    await enhanceTechStackInfo(workspaceFolder, result);
    
    // 3. 计算置信度
    result.confidence = calculateConfidence(result);
    
  } catch (error) {
    console.error('Error detecting tech stack:', error);
    // 出错时返回基本信息，但标记低置信度
    result.confidence = 0; // 使用0作为最低置信度
  }
  
  return result;
}

/**
 * 合并两个技术栈结果
 * @param target 目标技术栈
 * @param source 源技术栈
 */
function mergeTechStackResults(target: TechStackInfo, source: TechStackInfo): void {
  // 合并语言
  for (const lang of source.languages) {
    if (!target.languages.includes(lang)) {
      target.languages.push(lang);
    }
  }
  
  // 合并框架
  for (const framework of source.frameworks) {
    if (!target.frameworks.includes(framework)) {
      target.frameworks.push(framework);
    }
  }
  
  // 合并库
  for (const lib of source.libraries) {
    if (!target.libraries.includes(lib)) {
      target.libraries.push(lib);
    }
  }
  
  // 合并工具
  for (const tool of source.tools) {
    if (!target.tools.includes(tool)) {
      target.tools.push(tool);
    }
  }
}

/**
 * 示例: 如何使用检测器
 */
export async function example(): Promise<void> {
  // 获取活动工作区文件夹
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.log('没有打开的工作区');
    return;
  }
  
  const folder = workspaceFolders[0];
  console.log(`正在分析工作区: ${folder.name}`);
  
  // 检测技术栈
  const techStack = await detectTechStack(folder);
  
  // 打印结果
  console.log(`技术栈信息 (置信度: ${techStack.confidence}):`);
  console.log(`- 语言: ${techStack.languages.join(', ')}`);
  console.log(`- 框架: ${techStack.frameworks.join(', ')}`);
  console.log(`- 库: ${techStack.libraries.join(', ')}`);
  console.log(`- 工具: ${techStack.tools.join(', ')}`);
  console.log(`- 描述: ${getTechStackDescription(techStack)}`);
}

// 导出公共API，方便其他模块使用
export {
  TechStackInfo,
  getTechStackDescription
}; 