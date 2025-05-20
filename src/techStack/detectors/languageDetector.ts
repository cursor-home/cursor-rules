import * as vscode from 'vscode';
import * as path from 'path';
import { TechStackInfo, createEmptyTechStackInfo } from '../types';

/**
 * 使用VSCode语言服务检测项目语言
 * @param workspaceFolder 工作区文件夹
 * @returns 检测到的技术栈信息
 */
export async function detectViaLanguageServices(workspaceFolder: vscode.WorkspaceFolder): Promise<TechStackInfo> {
  const result = createEmptyTechStackInfo();
  
  const languageCounts = new Map<string, number>();
  const rootPath = workspaceFolder.uri.fsPath;

  try {
    // 1. 获取所有文件，排除node_modules和其他一些常见的排除目录
    const allFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*.*'), 
      '{**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/venv/**,**/__pycache__/**}',
      100 // 限制文件数量
    );

    // 2. 分析文件语言
    for (const file of allFiles) {
      try {
        // 根据文件扩展名推断语言
        const ext = path.extname(file.fsPath).toLowerCase();
        let langId = '';
        
        // 先尝试从扩展名映射到语言ID
        langId = getLanguageIdFromExtension(ext);
        
        // 如果无法从扩展名确定语言，尝试打开文件获取
        if (!langId) {
          try {
            const doc = await vscode.workspace.openTextDocument(file);
            langId = doc.languageId;
          } catch (e) {
            // 忽略无法打开的文件
            continue;
          }
        }
        
        if (langId) {
          languageCounts.set(langId, (languageCounts.get(langId) || 0) + 1);
        }
      } catch (err) {
        // 忽略单个文件的错误
        continue;
      }
    }

    // 3. 根据语言统计推断主要语言
    let totalFiles = 0;
    for (const count of languageCounts.values()) {
      totalFiles += count;
    }

    // 语言必须至少占文件的5%才被认为是主要语言
    const threshold = Math.max(3, totalFiles * 0.05); 

    for (const [lang, count] of languageCounts.entries()) {
      if (count >= threshold) {
        mapLanguageIdToTech(lang, result);
      }
    }
  } catch (error) {
    console.error('使用VSCode语言服务检测失败:', error);
  }

  return result;
}

/**
 * 从文件扩展名获取语言ID
 * @param ext 文件扩展名
 * @returns 语言ID或空字符串
 */
function getLanguageIdFromExtension(ext: string): string {
  // 基于扩展名映射到语言ID
  switch (ext) {
    case '.js':
      return 'javascript';
    case '.jsx':
      return 'javascriptreact';
    case '.ts':
      return 'typescript';
    case '.tsx':
      return 'typescriptreact';
    case '.py':
      return 'python';
    case '.java':
      return 'java';
    case '.cs':
      return 'csharp';
    case '.go':
      return 'go';
    case '.rb':
      return 'ruby';
    case '.php':
      return 'php';
    case '.vue':
      return 'vue';
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.scss':
    case '.sass':
      return 'scss';
    case '.less':
      return 'less';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    case '.xml':
      return 'xml';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.rs':
      return 'rust';
    case '.swift':
      return 'swift';
    case '.kt':
    case '.kts':
      return 'kotlin';
    case '.dart':
      return 'dart';
    case '.c':
      return 'c';
    case '.cpp':
    case '.cc':
    case '.cxx':
      return 'cpp';
    case '.sh':
      return 'shellscript';
    default:
      return '';
  }
}

/**
 * 将语言ID映射到技术栈
 * @param langId 语言ID
 * @param result 技术栈结果对象
 */
export function mapLanguageIdToTech(langId: string, result: TechStackInfo): void {
  // 语言映射
  const languageMap: Record<string, string> = {
    'javascript': 'JavaScript',
    'javascriptreact': 'JavaScript',
    'typescript': 'TypeScript',
    'typescriptreact': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'csharp': 'C#',
    'go': 'Go',
    'ruby': 'Ruby',
    'php': 'PHP',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'dart': 'Dart',
    'c': 'C',
    'cpp': 'C++',
    'shellscript': 'Shell'
  };

  // 框架映射推断
  const frameworkMap: Record<string, string> = {
    'typescriptreact': 'React',
    'javascriptreact': 'React',
    'vue': 'Vue.js',
    'svelte': 'Svelte',
    'angular': 'Angular'
  };

  // 添加语言
  if (languageMap[langId] && !result.languages.includes(languageMap[langId])) {
    result.languages.push(languageMap[langId]);
  }

  // 添加框架推断
  if (frameworkMap[langId] && !result.frameworks.includes(frameworkMap[langId])) {
    result.frameworks.push(frameworkMap[langId]);
  }
} 