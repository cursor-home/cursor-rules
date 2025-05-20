import * as vscode from 'vscode';
import { TechStackInfo } from '../types';

/**
 * 框架配置文件信息
 */
interface FrameworkFileInfo {
  pattern: string;    // 文件匹配模式
  framework: string;  // 框架/库/工具名称
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'; // 类型分类
}

/**
 * 通过配置文件检测框架
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function checkFrameworkConfigFiles(workspaceFolder: vscode.WorkspaceFolder, result: TechStackInfo): Promise<void> {
  // 框架配置文件检查映射
  const frameworkFiles: FrameworkFileInfo[] = [
    { pattern: '**/angular.json', framework: 'Angular', type: 'frameworks' },
    { pattern: '**/next.config.js', framework: 'Next.js', type: 'frameworks' },
    { pattern: '**/nuxt.config.js', framework: 'Nuxt.js', type: 'frameworks' },
    { pattern: '**/svelte.config.js', framework: 'Svelte', type: 'frameworks' },
    { pattern: '**/gatsby-config.js', framework: 'Gatsby', type: 'frameworks' },
    { pattern: '**/astro.config.mjs', framework: 'Astro', type: 'frameworks' },
    { pattern: '**/vite.config.js', framework: 'Vite', type: 'tools' },
    { pattern: '**/webpack.config.js', framework: 'Webpack', type: 'tools' },
    { pattern: '**/tailwind.config.js', framework: 'Tailwind CSS', type: 'libraries' },
    { pattern: '**/jest.config.js', framework: 'Jest', type: 'tools' },
    { pattern: '**/cypress.json', framework: 'Cypress', type: 'tools' },
    { pattern: '**/Dockerfile', framework: 'Docker', type: 'tools' },
    { pattern: '**/docker-compose.yml', framework: 'Docker Compose', type: 'tools' },
    { pattern: '**/Jenkinsfile', framework: 'Jenkins', type: 'tools' },
    { pattern: '**/.github/workflows/*.yml', framework: 'GitHub Actions', type: 'tools' },
    { pattern: '**/requirements.txt', framework: 'Python', type: 'languages' },
    { pattern: '**/manage.py', framework: 'Django', type: 'frameworks' },
    { pattern: '**/app.py', framework: 'Flask', type: 'frameworks' },
    { pattern: '**/pyproject.toml', framework: 'Python', type: 'languages' },
    { pattern: '**/pom.xml', framework: 'Maven', type: 'tools' },
    { pattern: '**/build.gradle', framework: 'Gradle', type: 'tools' },
    { pattern: '**/Gemfile', framework: 'Ruby', type: 'languages' },
    { pattern: '**/config/routes.rb', framework: 'Ruby on Rails', type: 'frameworks' },
    { pattern: '**/composer.json', framework: 'PHP', type: 'languages' },
    { pattern: '**/artisan', framework: 'Laravel', type: 'frameworks' },
    { pattern: '**/go.mod', framework: 'Go', type: 'languages' },
    { pattern: '**/*.csproj', framework: '.NET', type: 'frameworks' },
    { pattern: '**/cargo.toml', framework: 'Rust', type: 'languages' },
    { pattern: '**/pubspec.yaml', framework: 'Flutter', type: 'frameworks' }
  ];

  for (const { pattern, framework, type } of frameworkFiles) {
    try {
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(workspaceFolder, pattern),
        '{**/node_modules/**,**/dist/**,**/build/**}',
        1 // 只需要找到一个匹配的文件
      );

      if (files.length > 0) {
        // 将检测到的框架添加到相应的类别中
        await addToTechStack(result, framework, type);
      }
    } catch (error) {
      // 忽略单个模式的错误
      continue;
    }
  }
}

/**
 * 添加技术到技术栈对象
 * @param result 技术栈结果对象
 * @param tech 技术名称
 * @param type 技术类型
 */
async function addToTechStack(
  result: TechStackInfo, 
  tech: string, 
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'
): Promise<void> {
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