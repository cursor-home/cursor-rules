import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TechStackInfo } from '../types';

/**
 * Python包映射信息
 */
interface PythonPackageMapping {
  pattern: RegExp;  // 包名匹配模式
  tech: string;     // 技术名称
  type: 'frameworks' | 'libraries' | 'tools'; // 类型分类
}

/**
 * 分析Python项目依赖
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function analyzePythonDependencies(workspaceFolder: vscode.WorkspaceFolder, result: TechStackInfo): Promise<void> {
  try {
    // 检查是否包含Python文件
    if (!result.languages.includes('Python')) {
      return;
    }

    // 检查requirements.txt
    const requirementsFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/requirements.txt'),
      '{**/venv/**,**/.venv/**}',
      1
    );

    if (requirementsFiles.length > 0) {
      await analyzeRequirementsFile(requirementsFiles[0].fsPath, result);
    }

    // 检查Pipfile
    const pipFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/Pipfile'),
      '{**/venv/**,**/.venv/**}',
      1
    );

    if (pipFiles.length > 0) {
      await analyzePipfile(pipFiles[0].fsPath, result);
    }
  } catch (error) {
    console.error('分析Python依赖时出错:', error);
  }
}

/**
 * 分析requirements.txt文件
 * @param filePath 文件路径
 * @param result 技术栈结果对象
 */
async function analyzeRequirementsFile(filePath: string, result: TechStackInfo): Promise<void> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // 检查常见Python框架和库
    const pythonPackages = getPythonPackageMappings();

    for (const line of lines) {
      // 忽略注释行和空行
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }

      // 从行中提取包名（移除版本号等）
      const packageName = line.split('==')[0].split('>=')[0].split('<=')[0].trim();

      for (const { pattern, tech, type } of pythonPackages) {
        if (pattern.test(packageName)) {
          addToTechStack(result, tech, type);
        }
      }
    }
  } catch (error) {
    console.error('分析requirements.txt文件时出错:', error);
  }
}

/**
 * 分析Pipfile文件
 * @param filePath 文件路径
 * @param result 技术栈结果对象
 */
async function analyzePipfile(filePath: string, result: TechStackInfo): Promise<void> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // 检查是否在包区域
    let inPackages = false;
    // 检查常见Python框架和库
    const pythonPackages = getPythonPackageMappings();

    for (const line of lines) {
      // 检查包区域标记
      if (line.includes('[packages]')) {
        inPackages = true;
        continue;
      } else if (line.includes('[') && !line.includes('[packages]')) {
        inPackages = false;
        continue;
      }

      // 只处理包区域的行
      if (inPackages && line.includes('=')) {
        const packageName = line.split('=')[0].trim();

        for (const { pattern, tech, type } of pythonPackages) {
          if (pattern.test(packageName)) {
            addToTechStack(result, tech, type);
          }
        }
      }
    }
  } catch (error) {
    console.error('分析Pipfile文件时出错:', error);
  }
}

/**
 * 获取Python包映射
 * @returns Python包映射数组
 */
function getPythonPackageMappings(): PythonPackageMapping[] {
  return [
    { pattern: /django/i, tech: 'Django', type: 'frameworks' },
    { pattern: /flask/i, tech: 'Flask', type: 'frameworks' },
    { pattern: /fastapi/i, tech: 'FastAPI', type: 'frameworks' },
    { pattern: /tornado/i, tech: 'Tornado', type: 'frameworks' },
    { pattern: /pytest/i, tech: 'pytest', type: 'tools' },
    { pattern: /numpy/i, tech: 'NumPy', type: 'libraries' },
    { pattern: /pandas/i, tech: 'pandas', type: 'libraries' },
    { pattern: /tensorflow/i, tech: 'TensorFlow', type: 'libraries' },
    { pattern: /pytorch/i, tech: 'PyTorch', type: 'libraries' },
    { pattern: /scikit-learn/i, tech: 'scikit-learn', type: 'libraries' },
    { pattern: /sqlalchemy/i, tech: 'SQLAlchemy', type: 'libraries' },
    { pattern: /celery/i, tech: 'Celery', type: 'libraries' }
  ];
}

/**
 * 添加技术到技术栈对象
 * @param result 技术栈结果对象
 * @param tech 技术名称
 * @param type 技术类型
 */
function addToTechStack(
  result: TechStackInfo, 
  tech: string, 
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'
): void {
  if (type === 'frameworks' && !result.frameworks.includes(tech)) {
    result.frameworks.push(tech);
  } else if (type === 'libraries' && !result.libraries.includes(tech)) {
    result.libraries.push(tech);
  } else if (type === 'tools' && !result.tools.includes(tech)) {
    result.tools.push(tech);
  } else if (type === 'languages' && !result.languages.includes(tech)) {
    result.languages.push(tech);
  }
} 