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
      '{**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/venv/**,**/__pycache__/**,**/target/**,**/bin/**,**/obj/**}',
      200 // 增加文件数量限制以提高准确性
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

    // 语言必须至少占文件的3%才被认为是主要语言，但至少需要2个文件
    const threshold = Math.max(2, totalFiles * 0.03); 

    for (const [lang, count] of languageCounts.entries()) {
      if (count >= threshold) {
        mapLanguageIdToTech(lang, result);
      }
    }
    
    // 4. 进行一些额外的关联检测
    await detectRelatedTechnologies(languageCounts, result, workspaceFolder);
  } catch (error) {
    console.error('Failed to detect using VSCode language services:', error);
  }

  return result;
}

/**
 * 检测相关技术
 * 根据已经检测到的语言，推断可能的相关技术
 */
async function detectRelatedTechnologies(
  languageCounts: Map<string, number>,
  result: TechStackInfo,
  workspaceFolder: vscode.WorkspaceFolder
): Promise<void> {
  // 基于语言检测可能的技术栈
  if (languageCounts.has('typescript') || languageCounts.has('javascript')) {
    // 检查是否有.d.ts文件，这通常表示TypeScript项目
    const dtsFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*.d.ts'),
      '{**/node_modules/**}',
      1
    );
    
    if (dtsFiles.length > 0 && !result.languages.includes('TypeScript')) {
      result.languages.push('TypeScript');
    }
    
    // 检查前端框架的特定组件文件
    const reactComponents = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*.{jsx,tsx}'),
      '{**/node_modules/**}',
      1
    );
    
    if (reactComponents.length > 0 && !result.frameworks.includes('React')) {
      result.frameworks.push('React');
    }
    
    // 检查Vue组件
    const vueComponents = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*.vue'),
      '{**/node_modules/**}',
      1
    );
    
    if (vueComponents.length > 0 && !result.frameworks.includes('Vue.js')) {
      result.frameworks.push('Vue.js');
    }
  }
  
  // 检测Java相关框架
  if (languageCounts.has('java')) {
    // 检查Spring框架
    const springFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*{Controller,Service,Repository,Application}.java'),
      null,
      1
    );
    
    if (springFiles.length > 0 && !result.frameworks.includes('Spring')) {
      result.frameworks.push('Spring');
    }
    
    // 检查Android
    const androidFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/AndroidManifest.xml'),
      null,
      1
    );
    
    if (androidFiles.length > 0 && !result.frameworks.includes('Android')) {
      result.frameworks.push('Android');
    }
  }
  
  // 检测C#/.NET相关框架
  if (languageCounts.has('csharp')) {
    // 检查ASP.NET
    const aspNetFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/Startup.cs'),
      null,
      1
    );
    
    if (aspNetFiles.length > 0 && !result.frameworks.includes('ASP.NET Core')) {
      result.frameworks.push('ASP.NET Core');
    }
  }
  
  // 检测Python相关框架 (扩展现有检测)
  if (languageCounts.has('python')) {
    // 检查数据科学相关文件
    const jupyterFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/*.ipynb'),
      null,
      1
    );
    
    if (jupyterFiles.length > 0 && !result.tools.includes('Jupyter')) {
      result.tools.push('Jupyter');
      if (!result.frameworks.includes('Data Science')) {
        result.frameworks.push('Data Science');
      }
    }
  }
}

/**
 * 从文件扩展名获取语言ID
 * @param ext 文件扩展名
 * @returns 语言ID或空字符串
 */
function getLanguageIdFromExtension(ext: string): string {
  // 基于扩展名映射到语言ID
  switch (ext) {
    // JavaScript/TypeScript
    case '.js':
      return 'javascript';
    case '.jsx':
      return 'javascriptreact';
    case '.ts':
      return 'typescript';
    case '.tsx':
      return 'typescriptreact';
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.d.ts':
      return 'typescript';
      
    // Python
    case '.py':
    case '.pyw':
    case '.pyc':
    case '.pyd':
    case '.pyo':
      return 'python';
    case '.ipynb':
      return 'jupyter';
      
    // JVM语言
    case '.java':
      return 'java';
    case '.class':
      return 'java';
    case '.kt':
    case '.kts':
      return 'kotlin';
    case '.scala':
      return 'scala';
    case '.groovy':
      return 'groovy';
    case '.clj':
    case '.cljs':
      return 'clojure';
      
    // .NET语言
    case '.cs':
      return 'csharp';
    case '.vb':
      return 'vb';
    case '.fs':
    case '.fsx':
      return 'fsharp';
    
    // Web
    case '.vue':
      return 'vue';
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.scss':
    case '.sass':
      return 'scss';
    case '.less':
      return 'less';
    case '.styl':
      return 'stylus';
    
    // 其他语言
    case '.go':
      return 'go';
    case '.rb':
    case '.erb':
    case '.gemspec':
      return 'ruby';
    case '.php':
    case '.phtml':
      return 'php';
    case '.rs':
      return 'rust';
    case '.swift':
      return 'swift';
    case '.dart':
      return 'dart';
    case '.elm':
      return 'elm';
    case '.erl':
    case '.hrl':
      return 'erlang';
    case '.ex':
    case '.exs':
      return 'elixir';
    case '.hs':
    case '.lhs':
      return 'haskell';
    case '.lua':
      return 'lua';
    case '.ml':
    case '.mli':
      return 'ocaml';
    case '.pl':
    case '.pm':
      return 'perl';
    case '.r':
    case '.rmd':
      return 'r';
    
    // C/C++相关
    case '.c':
      return 'c';
    case '.h':
      return 'c';
    case '.cpp':
    case '.cc':
    case '.cxx':
    case '.hpp':
    case '.hxx':
    case '.h++':
      return 'cpp';
    case '.m':
    case '.mm':
      return 'objectivec';
      
    // 数据/配置文件格式
    case '.json':
      return 'json';
    case '.md':
    case '.markdown':
      return 'markdown';
    case '.xml':
      return 'xml';
    case '.yaml':
    case '.yml':
      return 'yaml';
    case '.toml':
      return 'toml';
    
    // Shell脚本
    case '.sh':
    case '.bash':
    case '.zsh':
      return 'shellscript';
    case '.ps1':
      return 'powershell';
    case '.bat':
    case '.cmd':
      return 'bat';
      
    // 移动开发
    case '.swift':
      return 'swift';
    case '.xib':
    case '.storyboard':
      return 'swiftui';
    
    // 区块链/智能合约相关
    case '.sol':
      return 'solidity';
    case '.rell':
      return 'rell';
    case '.move':
      return 'move';
    case '.cairo':
      return 'cairo';
    
    // Web Assembly
    case '.wat':
    case '.wasm':
      return 'webassembly';
    
    // 其他专门语言
    case '.sql':
      return 'sql';
    case '.graphql':
    case '.gql':
      return 'graphql';
    case '.proto':
      return 'protobuf';
    case '.cmake':
    case 'CMakeLists.txt':
      return 'cmake';
    case '.f':
    case '.f90':
    case '.f95':
      return 'fortran';
    case '.jl':
      return 'julia';
    case '.v':
      return 'verilog';
    case '.vhdl':
      return 'vhdl';
    case '.asm':
      return 'assembly';
      
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
    'jupyter': 'Python',
    'java': 'Java',
    'kotlin': 'Kotlin',
    'scala': 'Scala',
    'groovy': 'Groovy',
    'clojure': 'Clojure',
    'csharp': 'C#',
    'vb': 'Visual Basic',
    'fsharp': 'F#',
    'go': 'Go',
    'ruby': 'Ruby',
    'php': 'PHP',
    'rust': 'Rust',
    'swift': 'Swift',
    'swiftui': 'Swift',
    'dart': 'Dart',
    'elm': 'Elm',
    'erlang': 'Erlang',
    'elixir': 'Elixir',
    'haskell': 'Haskell',
    'lua': 'Lua',
    'ocaml': 'OCaml',
    'perl': 'Perl',
    'r': 'R',
    'c': 'C',
    'cpp': 'C++',
    'objectivec': 'Objective-C',
    'shellscript': 'Shell',
    'powershell': 'PowerShell',
    'bat': 'Batch',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'less': 'Less',
    'stylus': 'Stylus',
    'xml': 'XML',
    'json': 'JSON',
    'yaml': 'YAML',
    'markdown': 'Markdown',
    'solidity': 'Solidity', // 区块链Smart Contract语言
    'rell': 'Rell', // 区块链相关语言
    'move': 'Move', // Facebook区块链语言
    'cairo': 'Cairo', // StarkNet智能合约语言
    'webassembly': 'WebAssembly',
    'sql': 'SQL',
    'graphql': 'GraphQL',
    'protobuf': 'Protocol Buffers',
    'cmake': 'CMake',
    'fortran': 'Fortran',
    'julia': 'Julia',
    'verilog': 'Verilog',
    'vhdl': 'VHDL',
    'assembly': 'Assembly',
    'vue': 'Vue.js',
    'svelte': 'Svelte'
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