import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TechStackInfo } from '../types';

/**
 * 依赖映射信息
 */
interface DependencyMapping {
  name: string;  // 依赖包名
  tech: string;  // 技术名称
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'; // 类型分类
}

/**
 * 分析package.json中的依赖
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function analyzePackageJson(workspaceFolder: vscode.WorkspaceFolder, result: TechStackInfo): Promise<void> {
  try {
    const packageJsonFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/package.json'),
      '{**/node_modules/**}',
      1
    );

    if (packageJsonFiles.length === 0) {
      return;
    }

    const packageJsonPath = packageJsonFiles[0].fsPath;
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // 合并各种依赖
    const allDependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {})
    };

    // 检查常见框架和库
    const dependencyMappings: DependencyMapping[] = getDependencyMappings();

    for (const { name, tech, type } of dependencyMappings) {
      if (allDependencies[name]) {
        addToTechStack(result, tech, type);
      }
    }
  } catch (error) {
    console.error('分析package.json时出错:', error);
  }
}

/**
 * 获取依赖映射列表
 * @returns 依赖映射数组
 */
function getDependencyMappings(): DependencyMapping[] {
  return [
    // 框架
    { name: 'react', tech: 'React', type: 'frameworks' },
    { name: 'vue', tech: 'Vue.js', type: 'frameworks' },
    { name: '@angular/core', tech: 'Angular', type: 'frameworks' },
    { name: 'svelte', tech: 'Svelte', type: 'frameworks' },
    { name: 'next', tech: 'Next.js', type: 'frameworks' },
    { name: 'nuxt', tech: 'Nuxt.js', type: 'frameworks' },
    { name: 'gatsby', tech: 'Gatsby', type: 'frameworks' },
    { name: 'astro', tech: 'Astro', type: 'frameworks' },
    { name: 'express', tech: 'Express', type: 'frameworks' },
    { name: 'koa', tech: 'Koa', type: 'frameworks' },
    { name: '@nestjs/core', tech: 'NestJS', type: 'frameworks' },
    { name: 'electron', tech: 'Electron', type: 'frameworks' },
    
    // 库
    { name: 'redux', tech: 'Redux', type: 'libraries' },
    { name: 'mobx', tech: 'MobX', type: 'libraries' },
    { name: 'styled-components', tech: 'Styled Components', type: 'libraries' },
    { name: 'tailwindcss', tech: 'Tailwind CSS', type: 'libraries' },
    { name: 'bootstrap', tech: 'Bootstrap', type: 'libraries' },
    { name: '@mui/material', tech: 'Material UI', type: 'libraries' },
    { name: 'antd', tech: 'Ant Design', type: 'libraries' },
    { name: 'axios', tech: 'Axios', type: 'libraries' },
    { name: 'graphql', tech: 'GraphQL', type: 'libraries' },
    { name: 'apollo-client', tech: 'Apollo Client', type: 'libraries' },
    
    // 工具
    { name: 'webpack', tech: 'Webpack', type: 'tools' },
    { name: 'vite', tech: 'Vite', type: 'tools' },
    { name: 'jest', tech: 'Jest', type: 'tools' },
    { name: 'mocha', tech: 'Mocha', type: 'tools' },
    { name: 'cypress', tech: 'Cypress', type: 'tools' },
    { name: 'eslint', tech: 'ESLint', type: 'tools' },
    { name: 'prettier', tech: 'Prettier', type: 'tools' },
    { name: 'typescript', tech: 'TypeScript', type: 'languages' },
    { name: 'babel', tech: 'Babel', type: 'tools' },
    { name: 'storybook', tech: 'Storybook', type: 'tools' }
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