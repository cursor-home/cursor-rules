import * as vscode from 'vscode';
import { TechStackInfo } from '../types';

/**
 * 包依赖映射接口
 */
export interface PackageMapping {
  tech: string;  // 技术名称
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'; // 技术类型
}

/**
 * 分析package.json文件，提取项目使用的库和工具
 * @param packageJsonPath package.json文件路径
 * @returns 提取的技术栈信息
 */
export async function analyzePackageJson(packageJsonPath: string): Promise<Partial<TechStackInfo>> {
  try {
    const result: Partial<TechStackInfo> = {
      libraries: [],
      tools: [],
      frameworks: []
    };

    const document = await vscode.workspace.openTextDocument(packageJsonPath);
    const content = document.getText();
    const packageJson = JSON.parse(content);

    // 合并依赖集合
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    // 框架检测
    const frameworks = extractFrameworks(dependencies);
    if (frameworks.length > 0) {
      result.frameworks = frameworks;
    }

    // 库检测
    const libraries = extractLibraries(dependencies);
    if (libraries.length > 0) {
      result.libraries = libraries;
    }

    // 工具检测
    const tools = extractTools(dependencies);
    if (tools.length > 0) {
      result.tools = tools;
    }

    return result;
  } catch (error) {
    // 处理错误
    console.error('分析 package.json 失败:', error);
    return {};
  }
}

/**
 * 从依赖中提取框架信息
 * @param dependencies 依赖对象
 * @returns 框架列表
 */
function extractFrameworks(dependencies: Record<string, string>): string[] {
  const frameworkMappings: Record<string, string> = {
    // React 生态系统
    'react': 'React',
    'react-dom': 'React',
    'next': 'Next.js',
    '@next/font': 'Next.js',
    'next-auth': 'Next.js',
    'create-next-app': 'Next.js',
    
    // Vue 生态系统
    'vue': 'Vue',
    '@vue/cli-service': 'Vue',
    'vue-router': 'Vue',
    'vuex': 'Vue',
    'pinia': 'Vue',
    'nuxt': 'Nuxt.js',
    '@nuxt/content': 'Nuxt.js',
    '@nuxtjs/composition-api': 'Nuxt.js',
    'nuxt3': 'Nuxt.js',
    
    // Angular 生态系统
    '@angular/core': 'Angular',
    '@angular/common': 'Angular',
    '@angular/platform-browser': 'Angular',
    '@angular/cli': 'Angular',
    
    // 其他前端框架
    'svelte': 'Svelte',
    '@sveltejs/kit': 'SvelteKit',
    'gatsby': 'Gatsby',
    'ember-cli': 'Ember.js',
    '@remix-run/react': 'Remix',
    'remix': 'Remix',
    '@builder.io/qwik': 'Qwik',
    '@builder.io/qwik-city': 'Qwik',
    'solid-js': 'SolidJS',
    'solid-start': 'SolidJS',
    'astro': 'Astro',
    
    // 后端框架
    'express': 'Express',
    '@nestjs/core': 'NestJS',
    '@nestjs/common': 'NestJS',
    'koa': 'Koa',
    'fastify': 'Fastify',
    'hapi': 'Hapi',
    'meteor': 'Meteor',
    'restify': 'Restify',
    'sails': 'Sails.js',
    'loopback': 'LoopBack',
    'midway': 'Midway',
    'eggjs': 'Egg.js',
    'egg': 'Egg.js',
    
    // 跨平台框架
    'react-native': 'React Native',
    'expo': 'Expo',
    'expo-cli': 'Expo',
    '@ionic/react': 'Ionic React',
    '@ionic/vue': 'Ionic Vue',
    '@ionic/angular': 'Ionic Angular',
    '@capacitor/core': 'Capacitor',
    'nativescript': 'NativeScript',
    '@nativescript/core': 'NativeScript',
    'electron': 'Electron',
    'electron-builder': 'Electron',
    'tauri': 'Tauri',
    
    // 全栈框架
    'blitz': 'Blitz.js',
    'redwood': 'RedwoodJS',
    '@redwoodjs/core': 'RedwoodJS',
    
    // 云端函数框架
    'serverless': 'Serverless',
    'firebase-functions': 'Firebase',
    'aws-lambda': 'AWS Lambda',
    'azure-functions': 'Azure Functions',
    
    // CMS 框架
    'strapi': 'Strapi',
    'ghost': 'Ghost',
    'contentful': 'Contentful',
    'sanity': 'Sanity',
    
    // 区块链开发框架
    'ethers': 'Ethereum',
    'web3': 'Ethereum',
    'hardhat': 'Hardhat',
    '@openzeppelin/contracts': 'OpenZeppelin',
    'truffle': 'Truffle',
    'ganache': 'Ganache',
    '@nomiclabs/hardhat-ethers': 'Hardhat',
    '@nomiclabs/hardhat-waffle': 'Hardhat',
  };
  
  const result = new Set<string>();
  
  // 检测框架依赖
  for (const [dep, version] of Object.entries(dependencies)) {
    const framework = frameworkMappings[dep];
    if (framework) {
      result.add(framework);
    }
  }
  
  return Array.from(result);
}

/**
 * 从依赖中提取库信息
 * @param dependencies 依赖对象
 * @returns 库列表
 */
function extractLibraries(dependencies: Record<string, string>): string[] {
  const libraryMappings: Record<string, string> = {
    // UI 组件库
    '@mui/material': 'Material UI',
    '@material-ui/core': 'Material UI',
    'antd': 'Ant Design',
    '@ant-design/icons': 'Ant Design',
    '@chakra-ui/react': 'Chakra UI',
    '@chakra-ui/core': 'Chakra UI',
    'tailwindcss': 'Tailwind',
    '@headlessui/react': 'Headless UI',
    '@radix-ui/react-primitive': 'Radix UI',
    '@radix-ui/themes': 'Radix UI',
    '@radix-ui/colors': 'Radix UI',
    '@mantine/core': 'Mantine',
    '@mantine/hooks': 'Mantine',
    'bootstrap': 'Bootstrap',
    'react-bootstrap': 'React Bootstrap',
    'semantic-ui-react': 'Semantic UI',
    'styled-components': 'Styled Components',
    '@emotion/react': 'Emotion',
    '@emotion/styled': 'Emotion',
    'framer-motion': 'Framer Motion',
    'stitches': 'Stitches',
    '@stitches/react': 'Stitches',
    'shadcn-ui': 'Shadcn UI',
    'cva': 'Shadcn UI',
    'class-variance-authority': 'Shadcn UI',
    'cmdk': 'Shadcn UI',
    'lucide-react': 'Lucide React',
    
    // 状态管理
    'redux': 'Redux',
    '@reduxjs/toolkit': 'Redux Toolkit',
    'react-redux': 'React Redux',
    'mobx': 'MobX',
    'mobx-react': 'MobX React',
    'recoil': 'Recoil',
    'jotai': 'Jotai',
    'zustand': 'Zustand',
    'valtio': 'Valtio',
    'xstate': 'XState',
    '@tanstack/react-query': 'React Query',
    'react-query': 'React Query',
    'swr': 'SWR',
    'immer': 'Immer',
    
    // 路由
    'react-router': 'React Router',
    'react-router-dom': 'React Router',
    'wouter': 'Wouter',
    'history': 'History',
    
    // 表单
    'formik': 'Formik',
    'react-hook-form': 'React Hook Form',
    'yup': 'Yup',
    'zod': 'Zod',
    'final-form': 'Final Form',
    'react-final-form': 'React Final Form',
    
    // 数据处理/可视化
    'axios': 'Axios',
    'graphql': 'GraphQL',
    'apollo-client': 'Apollo Client',
    '@apollo/client': 'Apollo Client',
    'd3': 'D3.js',
    'three': 'Three.js',
    'chart.js': 'Chart.js',
    'react-chartjs-2': 'React Chart.js',
    'recharts': 'Recharts',
    'victory': 'Victory',
    'visx': 'visx',
    'leaflet': 'Leaflet',
    'mapbox-gl': 'Mapbox GL',
    'echarts': 'ECharts',
    'plotly.js': 'Plotly.js',
    'react-vis': 'React Vis',
    
    // 功能增强库
    'lodash': 'Lodash',
    'ramda': 'Ramda',
    'date-fns': 'date-fns',
    'dayjs': 'Day.js',
    'moment': 'Moment.js',
    'luxon': 'Luxon',
    'uuid': 'UUID',
    'nanoid': 'nanoid',
    
    // 动画与交互
    'gsap': 'GSAP',
    'motion': 'Motion',
    'react-spring': 'React Spring',
    'react-motion': 'React Motion',
    'react-transition-group': 'React Transition Group',
    'swiper': 'Swiper',
    'slick-carousel': 'Slick Carousel',
    'react-slick': 'React Slick',
    
    // 国际化/本地化
    'i18next': 'i18next',
    'react-i18next': 'React i18next',
    'intl': 'Intl',
    'react-intl': 'React Intl',
    
    // 数据库和ORM
    'prisma': 'Prisma',
    '@prisma/client': 'Prisma',
    'typeorm': 'TypeORM',
    'sequelize': 'Sequelize',
    'mongoose': 'Mongoose',
    'mongodb': 'MongoDB',
    'pg': 'PostgreSQL',
    'mysql': 'MySQL',
    'mysql2': 'MySQL',
    'sqlite3': 'SQLite',
    'redis': 'Redis',
    'ioredis': 'Redis',
    'kysely': 'Kysely',
    'drizzle-orm': 'Drizzle ORM',
    
    // 云服务和BaaS
    'firebase': 'Firebase',
    '@firebase/app': 'Firebase',
    'aws-sdk': 'AWS SDK',
    '@aws-sdk/client-s3': 'AWS SDK',
    '@azure/storage-blob': 'Azure SDK',
    '@google-cloud/storage': 'Google Cloud',
    'supabase': 'Supabase',
    '@supabase/supabase-js': 'Supabase',
    'appwrite': 'Appwrite',
    'pocketbase': 'PocketBase',
    
    // 测试库
    'jest': 'Jest',
    '@testing-library/react': 'React Testing Library',
    '@testing-library/vue': 'Vue Testing Library',
    '@testing-library/svelte': 'Svelte Testing Library',
    '@testing-library/angular': 'Angular Testing Library',
    'vitest': 'Vitest',
    'jasmine': 'Jasmine',
    'mocha': 'Mocha',
    'chai': 'Chai',
    'enzyme': 'Enzyme',
    'cypress': 'Cypress',
    'playwright': 'Playwright',
    'puppeteer': 'Puppeteer',
    'msw': 'MSW',
    'detox': 'Detox',
    
    // 文档生成
    'storybook': 'Storybook',
    '@storybook/react': 'Storybook',
    '@storybook/vue': 'Storybook',
    '@storybook/svelte': 'Storybook',
    '@storybook/angular': 'Storybook',
    'docusaurus': 'Docusaurus',
    'nextra': 'Nextra',
    'vitepress': 'VitePress',
    'typedoc': 'TypeDoc',
    'jsdoc': 'JSDoc',
  };
  
  const result = new Set<string>();
  
  // 检测库依赖
  for (const [dep, version] of Object.entries(dependencies)) {
    // 检查精确匹配
    const library = libraryMappings[dep];
    if (library) {
      result.add(library);
      continue;
    }
    
    // 检查模糊匹配
    if (dep.startsWith('@shadcn/ui') || dep.includes('shadcn')) {
      result.add('Shadcn UI');
    } else if (dep.startsWith('@tanstack/') && !dep.includes('query')) {
      result.add('TanStack');
    }
  }
  
  return Array.from(result);
}

/**
 * 从依赖中提取工具信息
 * @param dependencies 依赖对象
 * @returns 工具列表
 */
function extractTools(dependencies: Record<string, string>): string[] {
  const toolMappings: Record<string, string> = {
    // 构建工具
    'webpack': 'Webpack',
    'webpack-cli': 'Webpack',
    'webpack-dev-server': 'Webpack',
    'vite': 'Vite',
    '@vitejs/plugin-react': 'Vite',
    '@vitejs/plugin-vue': 'Vite',
    'esbuild': 'esbuild',
    'rollup': 'Rollup',
    '@rollup/plugin-node-resolve': 'Rollup',
    'parcel': 'Parcel',
    'snowpack': 'Snowpack',
    'turbopack': 'Turbopack',
    'rspack': 'Rspack',
    'swc': 'SWC',
    '@swc/core': 'SWC',
    'bun': 'Bun',
    
    // 代码转换与预处理
    'typescript': 'TypeScript',
    'babel': 'Babel',
    '@babel/core': 'Babel',
    '@babel/preset-env': 'Babel',
    '@babel/preset-react': 'Babel',
    '@babel/preset-typescript': 'Babel',
    'postcss': 'PostCSS',
    'autoprefixer': 'PostCSS',
    'sass': 'Sass',
    'node-sass': 'Sass',
    'less': 'Less',
    'stylus': 'Stylus',
    
    // Lint 和代码格式化
    'eslint': 'ESLint',
    '@typescript-eslint/eslint-plugin': 'ESLint',
    '@typescript-eslint/parser': 'ESLint',
    'prettier': 'Prettier',
    'stylelint': 'Stylelint',
    'husky': 'Husky',
    'lint-staged': 'lint-staged',
    
    // 测试运行器
    'jest': 'Jest',
    '@jest/core': 'Jest',
    'vitest': 'Vitest',
    'mocha': 'Mocha',
    'chai': 'Chai',
    'karma': 'Karma',
    'jasmine': 'Jasmine',
    'cypress': 'Cypress',
    'playwright': 'Playwright',
    'detox': 'Detox',
    'puppeteer': 'Puppeteer',
    
    // 工作区与Monorepo
    'lerna': 'Lerna',
    'nx': 'Nx',
    'turborepo': 'Turborepo',
    
    // CI/CD & 部署
    'vercel': 'Vercel',
    '@vercel/node': 'Vercel',
    'netlify-cli': 'Netlify',
    'netlify-lambda': 'Netlify',
    'serverless': 'Serverless',
    'aws-cdk': 'AWS CDK',
    'firebase-tools': 'Firebase CLI',
    
    // 文档工具
    'storybook': 'Storybook',
    '@storybook/react': 'Storybook',
    'docusaurus': 'Docusaurus',
    'typedoc': 'TypeDoc',
    'jsdoc': 'JSDoc',
    
    // 容器与开发环境
    'docker-compose': 'Docker Compose',
    'dockerode': 'Docker',
    
    // 区块链开发工具
    'hardhat': 'Hardhat',
    '@nomiclabs/hardhat-ethers': 'Hardhat',
    'truffle': 'Truffle',
    'ganache-cli': 'Ganache',
    'web3': 'Web3.js',
    'ethers': 'ethers.js',
    'solc': 'Solidity Compiler',
    'foundry-rs': 'Foundry',
    '@foundry-rs/hardhat': 'Foundry',
    '@nomicfoundation/hardhat-foundry': 'Foundry',
    'forge-std': 'Foundry',
    
    // Next.js 相关工具
    'next': 'Next.js',  // 需要额外检测是否是 13+ 版本用于 App Router 检测
  };
  
  const result = new Set<string>();
  
  // 检测工具依赖
  for (const [dep, version] of Object.entries(dependencies)) {
    // 检查精确匹配
    const tool = toolMappings[dep];
    if (tool) {
      result.add(tool);
      continue;
    }
    
    // 检查特殊依赖模式
    if (dep.startsWith('eslint-') || dep.startsWith('@eslint/')) {
      result.add('ESLint');
    } else if (dep.startsWith('prettier-') || dep.startsWith('@prettier/')) {
      result.add('Prettier');
    } else if (dep.startsWith('webpack-') || dep.startsWith('@webpack/')) {
      result.add('Webpack');
    } else if (dep.includes('tailwind')) {
      result.add('Tailwind');
    } else if (dep.includes('hardhat') || dep.includes('foundry')) {
      // 区块链开发工具检测
      if (dep.includes('hardhat')) {
        result.add('Hardhat');
      }
      if (dep.includes('foundry')) {
        result.add('Foundry');
      }
    }
  }
  
  // 特殊检测: Next.js 13+ App Router
  if (dependencies['next']) {
    // 提取版本号的主要部分
    const nextVersion = dependencies['next'];
    const versionMatch = nextVersion.match(/(\d+)/);
    if (versionMatch && parseInt(versionMatch[1]) >= 13) {
      // Next.js 13+ 可能使用 App Router
      result.add('App Router');
    }
  }
  
  return Array.from(result);
}

/**
 * 分析项目中的package.json文件
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function analyzeWorkspacePackages(
  workspaceFolder: vscode.WorkspaceFolder, 
  result: TechStackInfo
): Promise<void> {
  try {
    const packageJsonFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/package.json'),
      '{**/node_modules/**,**/dist/**,**/build/**}',
      1
    );

    if (packageJsonFiles.length === 0) {
      return;
    }

    // 打开并解析package.json
    const document = await vscode.workspace.openTextDocument(packageJsonFiles[0]);
    const content = document.getText();
    const packageJson = JSON.parse(content);

    // 获取依赖信息，包括正常依赖、开发依赖和对等依赖
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {})
    };

    // 分析依赖
    for (const dep in dependencies) {
      const mapping = getPackageMapping(dep);
      if (mapping) {
        addToTechStack(result, mapping.type, mapping.tech);
      }
    }

    // 检查是否指定了类型（TypeScript项目）
    if (dependencies.typescript || packageJson.types || packageJson.typings) {
      if (!result.languages.includes('TypeScript')) {
        result.languages.push('TypeScript');
      }
    }

    // 检查是否有scripts可以提供额外信息
    if (packageJson.scripts) {
      analyzeScripts(packageJson.scripts, result);
    }
  } catch (error) {
    console.error('Failed to analyze package.json:', error);
  }
}

/**
 * 分析package.json中的scripts部分获取更多信息
 * @param scripts scripts对象
 * @param result 技术栈结果对象
 */
function analyzeScripts(scripts: Record<string, string>, result: TechStackInfo): void {
  const scriptValues = Object.values(scripts).join(' ');
  
  // 检查常见的框架和工具在脚本中的引用
  const frameworks = [
    { pattern: 'react-scripts', tech: 'Create React App', type: 'frameworks' as const },
    { pattern: 'next', tech: 'Next.js', type: 'frameworks' as const },
    { pattern: 'nuxt', tech: 'Nuxt.js', type: 'frameworks' as const },
    { pattern: 'vue-cli-service', tech: 'Vue CLI', type: 'tools' as const },
    { pattern: 'angular', tech: 'Angular', type: 'frameworks' as const },
    { pattern: 'electron', tech: 'Electron', type: 'frameworks' as const },
    { pattern: 'expo', tech: 'Expo', type: 'frameworks' as const },
    { pattern: 'storybook', tech: 'Storybook', type: 'tools' as const },
    { pattern: 'nodemon', tech: 'Nodemon', type: 'tools' as const },
    { pattern: 'serverless', tech: 'Serverless', type: 'frameworks' as const },
    { pattern: 'webpack', tech: 'Webpack', type: 'tools' as const },
    { pattern: 'vite', tech: 'Vite', type: 'tools' as const },
    { pattern: 'jest', tech: 'Jest', type: 'tools' as const },
    { pattern: 'mocha', tech: 'Mocha', type: 'tools' as const },
    { pattern: 'cypress', tech: 'Cypress', type: 'tools' as const },
    { pattern: 'eslint', tech: 'ESLint', type: 'tools' as const },
    { pattern: 'prettier', tech: 'Prettier', type: 'tools' as const },
    { pattern: 'nest', tech: 'NestJS', type: 'frameworks' as const },
    { pattern: 'lerna', tech: 'Lerna', type: 'tools' as const },
    { pattern: 'nx', tech: 'Nx', type: 'tools' as const }
  ];
  
  for (const { pattern, tech, type } of frameworks) {
    if (scriptValues.includes(pattern)) {
      addToTechStack(result, type, tech);
    }
  }
}

/**
 * 获取包映射关系
 * @param packageName 包名称
 * @returns 映射关系或undefined
 */
function getPackageMapping(packageName: string): PackageMapping | undefined {
  // 前端框架
  if (frontendPackageMappings[packageName]) {
    return frontendPackageMappings[packageName];
  }

  // 后端框架
  if (backendPackageMappings[packageName]) {
    return backendPackageMappings[packageName];
  }

  // 工具和测试框架
  if (toolsAndTestingMappings[packageName]) {
    return toolsAndTestingMappings[packageName];
  }

  // 如果是以特定前缀开头的包，推断其关联技术
  if (packageName.startsWith('@angular/')) {
    return { tech: 'Angular', type: 'frameworks' };
  } else if (packageName.startsWith('@vue/')) {
    return { tech: 'Vue.js', type: 'frameworks' };
  } else if (packageName.startsWith('@nestjs/')) {
    return { tech: 'NestJS', type: 'frameworks' };
  } else if (packageName.startsWith('gatsby-')) {
    return { tech: 'Gatsby', type: 'frameworks' };
  } else if (packageName.startsWith('@storybook/')) {
    return { tech: 'Storybook', type: 'tools' };
  } else if (packageName.startsWith('@testing-library/')) {
    return { tech: 'Testing Library', type: 'tools' };
  } else if (packageName.startsWith('@emotion/') || packageName.startsWith('@mui/')) {
    return { tech: 'Material UI', type: 'libraries' };
  } else if (packageName.startsWith('@chakra-ui/')) {
    return { tech: 'Chakra UI', type: 'libraries' };
  } else if (packageName.startsWith('@apollo/') || packageName.startsWith('apollo-') || packageName.startsWith('apollo-server')) {
    return { tech: 'Apollo GraphQL', type: 'libraries' };
  }

  return undefined;
}

/**
 * 前端包映射
 */
const frontendPackageMappings: Record<string, PackageMapping> = {
  // 核心框架
  'react': { tech: 'React', type: 'frameworks' },
  'react-dom': { tech: 'React', type: 'frameworks' },
  'vue': { tech: 'Vue.js', type: 'frameworks' },
  'angular': { tech: 'Angular', type: 'frameworks' },
  'svelte': { tech: 'Svelte', type: 'frameworks' },
  'preact': { tech: 'Preact', type: 'frameworks' },
  'next': { tech: 'Next.js', type: 'frameworks' },
  'nuxt': { tech: 'Nuxt.js', type: 'frameworks' },
  'gatsby': { tech: 'Gatsby', type: 'frameworks' },
  'astro': { tech: 'Astro', type: 'frameworks' },
  'remix': { tech: 'Remix', type: 'frameworks' },
  'solid-js': { tech: 'SolidJS', type: 'frameworks' },
  'ember.js': { tech: 'Ember.js', type: 'frameworks' },
  'alpine.js': { tech: 'Alpine.js', type: 'frameworks' },
  
  // 状态管理
  'redux': { tech: 'Redux', type: 'libraries' },
  'react-redux': { tech: 'Redux', type: 'libraries' },
  '@reduxjs/toolkit': { tech: 'Redux Toolkit', type: 'libraries' },
  'mobx': { tech: 'MobX', type: 'libraries' },
  'mobx-react': { tech: 'MobX', type: 'libraries' },
  'recoil': { tech: 'Recoil', type: 'libraries' },
  'vuex': { tech: 'Vuex', type: 'libraries' },
  'pinia': { tech: 'Pinia', type: 'libraries' },
  'jotai': { tech: 'Jotai', type: 'libraries' },
  'zustand': { tech: 'Zustand', type: 'libraries' },
  'valtio': { tech: 'Valtio', type: 'libraries' },
  'effector': { tech: 'Effector', type: 'libraries' },
  
  // UI组件库
  'material-ui': { tech: 'Material UI', type: 'libraries' },
  '@mui/material': { tech: 'Material UI', type: 'libraries' },
  '@emotion/react': { tech: 'Emotion', type: 'libraries' },
  '@emotion/styled': { tech: 'Emotion', type: 'libraries' },
  'styled-components': { tech: 'Styled Components', type: 'libraries' },
  'antd': { tech: 'Ant Design', type: 'libraries' },
  '@ant-design/pro-components': { tech: 'Ant Design Pro', type: 'libraries' },
  'chakra-ui': { tech: 'Chakra UI', type: 'libraries' },
  '@chakra-ui/react': { tech: 'Chakra UI', type: 'libraries' },
  'tailwindcss': { tech: 'Tailwind CSS', type: 'libraries' },
  'bootstrap': { tech: 'Bootstrap', type: 'libraries' },
  'react-bootstrap': { tech: 'Bootstrap', type: 'libraries' },
  'vuetify': { tech: 'Vuetify', type: 'libraries' },
  'element-ui': { tech: 'Element UI', type: 'libraries' },
  'element-plus': { tech: 'Element Plus', type: 'libraries' },
  'quasar': { tech: 'Quasar', type: 'libraries' },
  'primereact': { tech: 'PrimeReact', type: 'libraries' },
  'primevue': { tech: 'PrimeVue', type: 'libraries' },
  
  // 路由
  'react-router': { tech: 'React Router', type: 'libraries' },
  'react-router-dom': { tech: 'React Router', type: 'libraries' },
  'vue-router': { tech: 'Vue Router', type: 'libraries' },
  '@angular/router': { tech: 'Angular Router', type: 'libraries' },
  
  // 表单
  'react-hook-form': { tech: 'React Hook Form', type: 'libraries' },
  'formik': { tech: 'Formik', type: 'libraries' },
  'react-final-form': { tech: 'React Final Form', type: 'libraries' },
  'vee-validate': { tech: 'VeeValidate', type: 'libraries' },
  'vuelidate': { tech: 'Vuelidate', type: 'libraries' },
  'angular-forms': { tech: 'Angular Forms', type: 'libraries' },
  
  // 数据获取/API
  'axios': { tech: 'Axios', type: 'libraries' },
  'graphql': { tech: 'GraphQL', type: 'libraries' },
  'apollo-client': { tech: 'Apollo GraphQL', type: 'libraries' },
  'react-query': { tech: 'React Query', type: 'libraries' },
  '@tanstack/react-query': { tech: 'React Query', type: 'libraries' },
  'swr': { tech: 'SWR', type: 'libraries' },
  'urql': { tech: 'URQL', type: 'libraries' },
  'relay': { tech: 'Relay', type: 'libraries' },
  
  // 移动和桌面
  'react-native': { tech: 'React Native', type: 'frameworks' },
  'expo': { tech: 'Expo', type: 'frameworks' },
  'electron': { tech: 'Electron', type: 'frameworks' },
  'tauri': { tech: 'Tauri', type: 'frameworks' },
  'ionic': { tech: 'Ionic', type: 'frameworks' },
  '@ionic/react': { tech: 'Ionic React', type: 'frameworks' },
  '@ionic/vue': { tech: 'Ionic Vue', type: 'frameworks' },
  '@capacitor/core': { tech: 'Capacitor', type: 'frameworks' },
  'cordova': { tech: 'Cordova', type: 'frameworks' },
  'nativescript': { tech: 'NativeScript', type: 'frameworks' },
  '@nativescript/core': { tech: 'NativeScript', type: 'frameworks' },
  
  // 动画
  'framer-motion': { tech: 'Framer Motion', type: 'libraries' },
  'react-spring': { tech: 'React Spring', type: 'libraries' },
  'gsap': { tech: 'GSAP', type: 'libraries' },
  'motion': { tech: 'Motion One', type: 'libraries' },
  'animejs': { tech: 'Anime.js', type: 'libraries' },
  'three': { tech: 'Three.js', type: 'libraries' },
  
  // i18n
  'i18next': { tech: 'i18next', type: 'libraries' },
  'react-i18next': { tech: 'i18next', type: 'libraries' },
  'vue-i18n': { tech: 'Vue I18n', type: 'libraries' },
  '@angular/localize': { tech: 'Angular I18n', type: 'libraries' },
};

/**
 * 后端和服务端包映射
 */
const backendPackageMappings: Record<string, PackageMapping> = {
  // Node.js后端框架
  'express': { tech: 'Express', type: 'libraries' },
  'koa': { tech: 'Koa', type: 'libraries' },
  'fastify': { tech: 'Fastify', type: 'libraries' },
  'hapi': { tech: 'Hapi', type: 'libraries' },
  '@hapi/hapi': { tech: 'Hapi', type: 'libraries' },
  'nest': { tech: 'NestJS', type: 'frameworks' },
  '@nestjs/core': { tech: 'NestJS', type: 'frameworks' },
  'strapi': { tech: 'Strapi', type: 'frameworks' },
  'feathers': { tech: 'Feathers', type: 'frameworks' },
  '@feathersjs/feathers': { tech: 'Feathers', type: 'frameworks' },
  'adonis': { tech: 'AdonisJS', type: 'frameworks' },
  'sails': { tech: 'Sails.js', type: 'frameworks' },
  'meteor': { tech: 'Meteor', type: 'frameworks' },
  'loopback': { tech: 'LoopBack', type: 'frameworks' },
  
  // 数据库和ORM
  'mongoose': { tech: 'Mongoose', type: 'libraries' },
  'sequelize': { tech: 'Sequelize', type: 'libraries' },
  'typeorm': { tech: 'TypeORM', type: 'libraries' },
  'prisma': { tech: 'Prisma', type: 'libraries' },
  '@prisma/client': { tech: 'Prisma', type: 'libraries' },
  'knex': { tech: 'Knex.js', type: 'libraries' },
  'mongodb': { tech: 'MongoDB', type: 'libraries' },
  'pg': { tech: 'PostgreSQL', type: 'libraries' },
  'mysql': { tech: 'MySQL', type: 'libraries' },
  'mysql2': { tech: 'MySQL', type: 'libraries' },
  'sqlite3': { tech: 'SQLite', type: 'libraries' },
  'better-sqlite3': { tech: 'SQLite', type: 'libraries' },
  'redis': { tech: 'Redis', type: 'libraries' },
  'ioredis': { tech: 'Redis', type: 'libraries' },
  
  // API技术
  'graphql': { tech: 'GraphQL', type: 'libraries' },
  'apollo-server': { tech: 'Apollo GraphQL', type: 'libraries' },
  '@apollo/server': { tech: 'Apollo GraphQL', type: 'libraries' },
  'express-graphql': { tech: 'GraphQL', type: 'libraries' },
  'type-graphql': { tech: 'TypeGraphQL', type: 'libraries' },
  'trpc': { tech: 'tRPC', type: 'libraries' },
  '@trpc/server': { tech: 'tRPC', type: 'libraries' },
  'nexus': { tech: 'Nexus', type: 'libraries' },
  'swagger': { tech: 'Swagger', type: 'libraries' },
  'swagger-ui': { tech: 'Swagger', type: 'libraries' },
  
  // 认证和授权
  'passport': { tech: 'Passport.js', type: 'libraries' },
  'jsonwebtoken': { tech: 'JWT', type: 'libraries' },
  'bcrypt': { tech: 'bcrypt', type: 'libraries' },
  'auth0': { tech: 'Auth0', type: 'libraries' },
  'oauth': { tech: 'OAuth', type: 'libraries' },
  'oauth2': { tech: 'OAuth 2.0', type: 'libraries' },
  
  // 服务器和中间件
  'pm2': { tech: 'PM2', type: 'tools' },
  'nodemon': { tech: 'Nodemon', type: 'tools' },
  'cors': { tech: 'CORS', type: 'libraries' },
  'helmet': { tech: 'Helmet', type: 'libraries' },
  'compression': { tech: 'compression', type: 'libraries' },
  'morgan': { tech: 'Morgan', type: 'libraries' },
  'winston': { tech: 'Winston', type: 'libraries' },
  'pino': { tech: 'Pino', type: 'libraries' },
  
  // 无服务器和云
  'serverless': { tech: 'Serverless', type: 'frameworks' },
  'aws-sdk': { tech: 'AWS SDK', type: 'libraries' },
  '@aws-sdk/client-s3': { tech: 'AWS SDK', type: 'libraries' },
  'firebase': { tech: 'Firebase', type: 'libraries' },
  'firebase-admin': { tech: 'Firebase', type: 'libraries' },
  '@google-cloud/storage': { tech: 'Google Cloud', type: 'libraries' },
  '@azure/storage-blob': { tech: 'Azure', type: 'libraries' },
  'vercel': { tech: 'Vercel', type: 'tools' },
};

/**
 * 工具和测试包映射
 */
const toolsAndTestingMappings: Record<string, PackageMapping> = {
  // 构建工具
  'webpack': { tech: 'Webpack', type: 'tools' },
  'vite': { tech: 'Vite', type: 'tools' },
  'esbuild': { tech: 'esbuild', type: 'tools' },
  'rollup': { tech: 'Rollup', type: 'tools' },
  'parcel': { tech: 'Parcel', type: 'tools' },
  'turbopack': { tech: 'Turbopack', type: 'tools' },
  'snowpack': { tech: 'Snowpack', type: 'tools' },
  'gulp': { tech: 'Gulp', type: 'tools' },
  'grunt': { tech: 'Grunt', type: 'tools' },
  'babel': { tech: 'Babel', type: 'tools' },
  '@babel/core': { tech: 'Babel', type: 'tools' },
  'typescript': { tech: 'TypeScript', type: 'languages' },
  'ts-node': { tech: 'TypeScript', type: 'languages' },
  'swc': { tech: 'SWC', type: 'tools' },
  '@swc/core': { tech: 'SWC', type: 'tools' },
  
  // 测试框架和工具
  'jest': { tech: 'Jest', type: 'tools' },
  '@jest/core': { tech: 'Jest', type: 'tools' },
  'mocha': { tech: 'Mocha', type: 'tools' },
  'chai': { tech: 'Chai', type: 'tools' },
  'jasmine': { tech: 'Jasmine', type: 'tools' },
  'karma': { tech: 'Karma', type: 'tools' },
  'cypress': { tech: 'Cypress', type: 'tools' },
  'playwright': { tech: 'Playwright', type: 'tools' },
  '@playwright/test': { tech: 'Playwright', type: 'tools' },
  'puppeteer': { tech: 'Puppeteer', type: 'tools' },
  'selenium-webdriver': { tech: 'Selenium', type: 'tools' },
  'webdriverio': { tech: 'WebdriverIO', type: 'tools' },
  'vitest': { tech: 'Vitest', type: 'tools' },
  '@testing-library/react': { tech: 'Testing Library', type: 'tools' },
  '@testing-library/vue': { tech: 'Testing Library', type: 'tools' },
  'storybook': { tech: 'Storybook', type: 'tools' },
  '@storybook/react': { tech: 'Storybook', type: 'tools' },
  
  // 代码质量和格式化
  'eslint': { tech: 'ESLint', type: 'tools' },
  'prettier': { tech: 'Prettier', type: 'tools' },
  'stylelint': { tech: 'Stylelint', type: 'tools' },
  'husky': { tech: 'Husky', type: 'tools' },
  'lint-staged': { tech: 'lint-staged', type: 'tools' },
  'commitlint': { tech: 'commitlint', type: 'tools' },
  '@commitlint/cli': { tech: 'commitlint', type: 'tools' },
  
  // 工作流和构建系统
  'nx': { tech: 'Nx', type: 'tools' },
  'lerna': { tech: 'Lerna', type: 'tools' },
  'turborepo': { tech: 'Turborepo', type: 'tools' },
  'pnpm': { tech: 'pnpm', type: 'tools' },
  'yarn': { tech: 'Yarn', type: 'tools' },
  'npm': { tech: 'npm', type: 'tools' },
  
  // 文档
  'typedoc': { tech: 'TypeDoc', type: 'tools' },
  'jsdoc': { tech: 'JSDoc', type: 'tools' },
  'docusaurus': { tech: 'Docusaurus', type: 'tools' },
  'vuepress': { tech: 'VuePress', type: 'tools' },
  'docsify': { tech: 'Docsify', type: 'tools' },
  'mdx': { tech: 'MDX', type: 'tools' },
};

/**
 * 将检测到的技术添加到技术栈结果对象
 * @param result 技术栈结果对象
 * @param type 技术类型
 * @param tech 技术名称
 */
export function addToTechStack(
  result: TechStackInfo,
  type: 'frameworks' | 'libraries' | 'tools' | 'languages',
  tech: string
): void {
  // 避免重复添加
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