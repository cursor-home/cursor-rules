import * as vscode from 'vscode';
import { TechStackInfo } from '../types';
import { addToTechStack } from './packageDetector';
import * as path from 'path';

/**
 * 框架配置文件信息接口
 */
export interface FrameworkFileInfo {
  // 文件匹配模式，支持glob
  patterns: string[];
  // 框架名称
  framework: string;
  // 技术类型：框架、库或工具
  type: 'frameworks' | 'libraries' | 'tools';
  // 可选的相关语言
  language?: string;
  // 可选的验证函数，用于检查文件内容确认框架
  validate?: (filePath: string) => Promise<boolean>;
}

/**
 * 检查框架配置文件
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果
 */
export async function checkFrameworkConfigFiles(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  try {
    // 使用新的扩展框架文件数组
    for (const fileInfo of frameworkFiles) {
      for (const pattern of fileInfo.patterns) {
        try {
          const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(workspaceFolder, pattern),
            '{**/node_modules/**,**/dist/**,**/build/**,**/.git/**,**/venv/**,**/__pycache__/**}',
            1
          );

          if (files.length > 0) {
            const filePath = files[0].fsPath;
            
            // 如果有验证函数，则调用验证
            if (fileInfo.validate) {
              const isValid = await fileInfo.validate(filePath);
              if (!isValid) continue;
            }
            
            // 将框架添加到技术栈
            addToTechStack(result, fileInfo.type, fileInfo.framework);
            
            // 如果有关联语言，也添加
            if (fileInfo.language && !result.languages.includes(fileInfo.language)) {
              result.languages.push(fileInfo.language);
            }
            
            break; // 找到一个匹配就可以了
          }
        } catch (error) {
          console.error(`Error checking pattern ${pattern}:`, error);
        }
      }
    }
    
    // 检测特殊组合技术栈
    await detectTechStackCombinations(workspaceFolder, result);
    
  } catch (error) {
    console.error('Error checking framework config files:', error);
  }
}

/**
 * 检测技术栈组合
 * 有些技术组合需要多个文件共同判断
 */
async function detectTechStackCombinations(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // 检测MERN堆栈 (MongoDB + Express + React + Node.js)
  if (
    result.frameworks.includes('React') && 
    result.libraries.includes('Express')
  ) {
    const mongoFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/{mongoose,mongodb}.{js,ts}'),
      '{**/node_modules/**}',
      1
    );
    
    if (mongoFiles.length > 0 && !result.frameworks.includes('MERN Stack')) {
      result.frameworks.push('MERN Stack');
    }
  }
  
  // 检测MEAN堆栈 (MongoDB + Express + Angular + Node.js)
  if (
    result.frameworks.includes('Angular') && 
    result.libraries.includes('Express')
  ) {
    const mongoFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(workspaceFolder, '**/{mongoose,mongodb}.{js,ts}'),
      '{**/node_modules/**}',
      1
    );
    
    if (mongoFiles.length > 0 && !result.frameworks.includes('MEAN Stack')) {
      result.frameworks.push('MEAN Stack');
    }
  }
  
  // 检测微服务架构
  const microserviceIndicators = await vscode.workspace.findFiles(
    new vscode.RelativePattern(workspaceFolder, '**/{docker-compose,kubernetes,k8s}.{yml,yaml}'),
    null,
    1
  );
  
  if (microserviceIndicators.length > 0 && !result.frameworks.includes('Microservices')) {
    result.frameworks.push('Microservices');
  }
}

/**
 * 框架配置文件信息列表
 */
export const frameworkFiles: FrameworkFileInfo[] = [
  // JavaScript/TypeScript 前端框架
  {
    patterns: ['angular.json', '.angular-cli.json'],
    framework: 'Angular',
    type: 'frameworks',
    language: 'TypeScript'
  },
  {
    patterns: ['next.config.{js,ts,mjs,cjs}', 'app/layout.{js,jsx,ts,tsx}', '.next/**/*'],
    framework: 'Next.js',
    type: 'frameworks'
  },
  {
    patterns: ['nuxt.config.{js,ts}', '.nuxt/**/*'],
    framework: 'Nuxt.js',
    type: 'frameworks'
  },
  {
    patterns: ['{gatsby-config,gatsby-node,gatsby-browser,gatsby-ssr}.{js,ts}'],
    framework: 'Gatsby',
    type: 'frameworks'
  },
  {
    patterns: ['svelte.config.{js,cjs,mjs}'],
    framework: 'Svelte',
    type: 'frameworks'
  },
  {
    patterns: ['sveltekit.config.{js,ts}', 'src/routes/**/*.svelte'],
    framework: 'SvelteKit',
    type: 'frameworks'
  },
  {
    patterns: ['astro.config.{js,ts,mjs}'],
    framework: 'Astro',
    type: 'frameworks'
  },
  {
    patterns: ['remix.config.{js,ts}'],
    framework: 'Remix',
    type: 'frameworks'
  },
  {
    patterns: ['ember-cli-build.js'],
    framework: 'Ember.js',
    type: 'frameworks'
  },
  {
    patterns: ['qwik.config.{js,ts}', 'vite.config.{js,ts}'],
    framework: 'Qwik',
    type: 'frameworks',
    validate: async (filePath: string) => {
      try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const content = document.getText();
        return content.includes('@builder.io/qwik') || content.includes('qwikCity');
      } catch {
        return false;
      }
    }
  },
  {
    patterns: ['solid.config.{js,ts}', 'solidjs.config.{js,ts}', 'solid-start.config.{js,ts}'],
    framework: 'SolidJS',
    type: 'frameworks'
  },
  
  // JavaScript/TypeScript 后端框架
  {
    patterns: ['nest-cli.json'],
    framework: 'NestJS',
    type: 'frameworks',
    language: 'TypeScript'
  },
  {
    patterns: ['nodemon.json', 'server.{js,ts}'],
    framework: 'Express',
    type: 'libraries'
  },
  {
    patterns: ['serverless.{yml,yaml}'],
    framework: 'Serverless',
    type: 'frameworks'
  },
  {
    patterns: ['.strapi-updater.json', 'strapi.{js,json}'],
    framework: 'Strapi',
    type: 'frameworks'
  },
  
  // UI 库和组件库
  {
    patterns: ['tailwind.config.{js,ts,cjs}'],
    framework: 'Tailwind',
    type: 'libraries'
  },
  {
    patterns: ['components/ui/**/*.{tsx,jsx}', '.shadcn/**/*', 'components.json'],
    framework: 'Shadcn UI',
    type: 'libraries',
    validate: async (filePath: string) => {
      try {
        if (path.basename(filePath) === 'components.json') {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('@shadcn') || content.includes('shadcn');
        }
        
        // 检查是否为shadcn组件
        if (filePath.includes('components/ui/')) {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('cn(') || content.includes('cva(') || 
                 content.includes('VariantProps') || content.includes('lucide-react');
        }
        
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    patterns: ['theme/chakra.{js,ts}', '**/theme/index.{js,ts}'],
    framework: 'Chakra UI',
    type: 'libraries',
    validate: async (filePath: string) => {
      try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const content = document.getText();
        return content.includes('@chakra-ui') || content.includes('ChakraProvider');
      } catch {
        return false;
      }
    }
  },
  {
    patterns: ['styled-components.{js,ts}', '**/styles/theme.{js,ts}'],
    framework: 'Styled Components',
    type: 'libraries',
    validate: async (filePath: string) => {
      try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const content = document.getText();
        return content.includes('styled-components') || content.includes('createGlobalStyle');
      } catch {
        return false;
      }
    }
  },
  
  // React 生态
  {
    patterns: ['craco.config.{js,ts}'],
    framework: 'Create React App',
    type: 'frameworks'
  },
  {
    patterns: ['vite.config.{js,ts}', 'vitest.config.{js,ts}'],
    framework: 'Vite',
    type: 'tools'
  },
  
  // 移动开发框架
  {
    patterns: ['app.json', 'metro.config.js', '**/react-native.config.js'],
    framework: 'React Native',
    type: 'frameworks'
  },
  {
    patterns: ['pubspec.yaml', 'pubspec.yml', '**/.metadata'],
    framework: 'Flutter',
    type: 'frameworks',
    language: 'Dart'
  },
  {
    patterns: ['capacitor.config.{json,ts}'],
    framework: 'Capacitor',
    type: 'frameworks'
  },
  {
    patterns: ['ionic.config.json'],
    framework: 'Ionic',
    type: 'frameworks'
  },
  {
    patterns: ['config.xml', '**/www/cordova.js'],
    framework: 'Cordova',
    type: 'frameworks'
  },
  {
    patterns: ['**/App_Resources/**', 'nsconfig.json', 'package.json'],
    framework: 'NativeScript',
    type: 'frameworks',
    validate: async (filePath: string) => {
      if (path.basename(filePath) === 'package.json') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          const packageJson = JSON.parse(content);
          return !!(packageJson.dependencies && 
                    (packageJson.dependencies.nativescript || 
                     packageJson.dependencies['@nativescript/core']));
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  
  // Python 框架
  {
    patterns: ['manage.py', '**/wsgi.py', '**/asgi.py'],
    framework: 'Django',
    type: 'frameworks',
    language: 'Python'
  },
  {
    patterns: ['**/flask_app.py', '**/flask_config.py', '**/*Flask*.py'],
    framework: 'Flask',
    type: 'frameworks',
    language: 'Python'
  },
  {
    patterns: ['**/fastapi_app.py', '**/*FastAPI*.py', 'main.py'],
    framework: 'FastAPI',
    type: 'frameworks',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.basename(filePath) === 'main.py') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('fastapi') || content.includes('FastAPI');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['streamlit_app.py', '**/*.streamlit/**'],
    framework: 'Streamlit',
    type: 'frameworks',
    language: 'Python'
  },
  
  // Java 框架
  {
    patterns: ['pom.xml', '**/mvnw', '**/mvnw.cmd'],
    framework: 'Maven',
    type: 'tools',
    language: 'Java'
  },
  {
    patterns: ['build.gradle', 'build.gradle.kts', '**/gradlew', '**/gradlew.bat'],
    framework: 'Gradle',
    type: 'tools'
  },
  {
    patterns: ['**/application.{properties,yml,yaml}', '**/spring-boot-starter*/**'],
    framework: 'Spring Boot',
    type: 'frameworks',
    language: 'Java'
  },
  {
    patterns: ['**/hibernate.cfg.xml', '**/persistence.xml'],
    framework: 'Hibernate',
    type: 'frameworks',
    language: 'Java'
  },
  
  // .NET 框架
  {
    patterns: ['**/*.csproj', '**/*.fsproj', '**/*.vbproj'],
    framework: '.NET',
    type: 'frameworks'
  },
  {
    patterns: ['**/appsettings.json', '**/Startup.cs', '**/Program.cs'],
    framework: 'ASP.NET Core',
    type: 'frameworks',
    language: 'C#',
    validate: async (filePath: string) => {
      if (path.basename(filePath) === 'Program.cs') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('Microsoft.AspNetCore') || 
                 content.includes('WebApplication');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['global.asax', 'Web.config'],
    framework: 'ASP.NET',
    type: 'frameworks',
    language: 'C#'
  },
  
  // 云原生/DevOps 相关
  {
    patterns: ['Dockerfile', 'docker-compose.{yml,yaml}', '.dockerignore'],
    framework: 'Docker',
    type: 'tools'
  },
  {
    patterns: [
      '**/kubernetes/**/*.{yml,yaml}', 
      '**/k8s/**/*.{yml,yaml}', 
      'skaffold.{yml,yaml}', 
      'kustomization.{yml,yaml}'
    ],
    framework: 'Kubernetes',
    type: 'tools'
  },
  {
    patterns: ['**/helm/**/*.{yml,yaml}', '**/charts/**/*.{yml,yaml}'],
    framework: 'Helm',
    type: 'tools'
  },
  {
    patterns: ['*.tf', '*.tfvars', '.terraform/**/*'],
    framework: 'Terraform',
    type: 'tools'
  },
  {
    patterns: ['appspec.{yml,yaml}', 'buildspec.{yml,yaml}', 'cloudformation.{yml,yaml,json}'],
    framework: 'AWS',
    type: 'tools'
  },
  {
    patterns: ['cloudbuild.{yml,yaml,json}', 'app.{yml,yaml}'],
    framework: 'Google Cloud',
    type: 'tools'
  },
  {
    patterns: ['azure-pipelines.{yml,yaml}', '.azure/**/*'],
    framework: 'Azure',
    type: 'tools'
  },
  {
    patterns: ['.gitlab-ci.{yml,yaml}'],
    framework: 'GitLab CI',
    type: 'tools'
  },
  {
    patterns: ['.github/workflows/**/*.{yml,yaml}'],
    framework: 'GitHub Actions',
    type: 'tools'
  },
  {
    patterns: ['Jenkinsfile', 'jenkins/**/*'],
    framework: 'Jenkins',
    type: 'tools'
  },
  {
    patterns: ['**/pulumi.{yml,yaml}', 'Pulumi.{yml,yaml}'],
    framework: 'Pulumi',
    type: 'tools'
  },
  {
    patterns: ['vercel.json', '.vercel/**/*', 'vercel.config.{js,ts}'],
    framework: 'Vercel',
    type: 'tools'
  },
  {
    patterns: ['supabase/**/*', 'supabase.{js,ts}'],
    framework: 'Supabase',
    type: 'tools'
  },
  
  // 数据库相关
  {
    patterns: ['**/migrations/**/*.{sql,js,py,rb}', 'schema.{sql,prisma}'],
    framework: 'Database',
    type: 'tools'
  },
  {
    patterns: ['**/sequelize/**/*', '.sequelizerc'],
    framework: 'Sequelize',
    type: 'libraries'
  },
  {
    patterns: ['**/typeorm/**/*', 'ormconfig.{json,js,ts}'],
    framework: 'TypeORM',
    type: 'libraries'
  },
  {
    patterns: ['**/mongoose/**/*'],
    framework: 'Mongoose',
    type: 'libraries'
  },
  {
    patterns: ['prisma/schema.prisma'],
    framework: 'Prisma',
    type: 'libraries'
  },
  
  // 区块链相关 (Solidity/Web3)
  {
    patterns: ['foundry.toml', 'lib/forge-std/**/*', '.foundry/**/*'],
    framework: 'Foundry',
    type: 'tools',
    language: 'Solidity'
  },
  {
    patterns: ['hardhat.config.{js,ts}', '.hardhat/**/*'],
    framework: 'Hardhat',
    type: 'tools',
    language: 'Solidity'
  },
  {
    patterns: ['truffle.js', 'truffle-config.js'],
    framework: 'Truffle',
    type: 'tools',
    language: 'Solidity'
  },
  {
    patterns: ['brownie-config.yaml', 'contracts/**/*.sol'],
    framework: 'Brownie',
    type: 'tools',
    language: 'Solidity'
  },
  {
    patterns: ['remappings.txt', 'contracts/**/*.sol'],
    framework: 'Solidity',
    type: 'frameworks'
  },
  
  // 前端工具链
  {
    patterns: ['.babelrc', '.babelrc.{js,json}', 'babel.config.{js,json}'],
    framework: 'Babel',
    type: 'tools'
  },
  {
    patterns: ['webpack.config.{js,ts}', 'webpack.{common,dev,prod}.{js,ts}'],
    framework: 'Webpack',
    type: 'tools'
  },
  {
    patterns: ['jest.config.{js,ts,json}', 'jest.setup.{js,ts}'],
    framework: 'Jest',
    type: 'tools'
  },
  {
    patterns: ['cypress.{json,config.js,config.ts}', 'cypress/**/*'],
    framework: 'Cypress',
    type: 'tools'
  },
  {
    patterns: ['detox.config.js', '.detoxrc.{json,js}', 'e2e/**/*.spec.js'],
    framework: 'Detox',
    type: 'tools'
  },
  {
    patterns: ['.storybook/**/*', 'stories/**/*.{js,jsx,ts,tsx}'],
    framework: 'Storybook',
    type: 'tools'
  },
  {
    patterns: ['tailwind.config.{js,ts}'],
    framework: 'Tailwind',
    type: 'libraries'
  },
  
  // Google Apps Script 相关
  {
    patterns: ['.clasp.json', 'appscript.json', '**/*.gs'],
    framework: 'Clasp',
    type: 'tools'
  },
  {
    patterns: ['appsscript.json', '**/*.gs'],
    framework: 'Google Apps Script',
    type: 'frameworks'
  },
  
  // iOS/macOS开发
  {
    patterns: ['*.xcodeproj/**/*', '*.xcworkspace/**/*', 'Podfile'],
    framework: 'UIKit',
    type: 'frameworks',
    language: 'Swift'
  },
  {
    patterns: ['**/*.swift', '**/*.xib', '**/*.storyboard'],
    framework: 'SwiftUI',
    type: 'frameworks',
    language: 'Swift',
    validate: async (filePath: string) => {
      if (path.extname(filePath) === '.swift') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('SwiftUI') || content.includes('View {');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  
  // 其他工具
  {
    patterns: ['.eslintrc', '.eslintrc.{js,json,yml,yaml}', 'eslint.config.{js,mjs}'],
    framework: 'ESLint',
    type: 'tools'
  },
  {
    patterns: ['.prettierrc', '.prettierrc.{js,json,yml,yaml}', 'prettier.config.{js,cjs}'],
    framework: 'Prettier',
    type: 'tools'
  },
  {
    patterns: ['nx.json', 'workspace.json'],
    framework: 'Nx',
    type: 'tools'
  },
  {
    patterns: ['app/{page,layout,loading,error,not-found}.{js,jsx,ts,tsx}'],
    framework: 'App Router',
    type: 'tools'
  },
  
  // 游戏开发
  {
    patterns: ['**/*.unity', 'ProjectSettings/**/*'],
    framework: 'Unity',
    type: 'frameworks',
    language: 'C#'
  },
  {
    patterns: ['**/*.godot', 'project.godot'],
    framework: 'Godot',
    type: 'frameworks'
  },
  {
    patterns: ['**/*.unreal', '**/*.uproject'],
    framework: 'Unreal Engine',
    type: 'frameworks',
    language: 'C++'
  },
  
  // 数据科学/机器学习
  {
    patterns: ['**/*.ipynb', '**/notebooks/**'],
    framework: 'Jupyter',
    type: 'tools',
    language: 'Python' 
  },
  {
    patterns: ['**/requirements.txt', '**/environment.yml'],
    framework: 'Data Science',
    type: 'frameworks',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.basename(filePath) === 'requirements.txt') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          const dsPackages = [
            'numpy', 'pandas', 'matplotlib', 'scipy', 'scikit-learn', 
            'tensorflow', 'keras', 'pytorch', 'torch', 'opencv'
          ];
          return dsPackages.some(pkg => content.includes(pkg));
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['MLproject', 'MLmodel', 'conda.yaml'],
    framework: 'MLflow',
    type: 'frameworks',
    language: 'Python'
  },
  {
    patterns: ['pytorch_model.bin', '**/torch/**/*.py', '**/*torch*.py'],
    framework: 'PyTorch',
    type: 'tools',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.extname(filePath) === '.py') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('import torch') || content.includes('from torch');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['**/*scikit*learn*.py', '**/*sklearn*.py'],
    framework: 'Scikit-Learn',
    type: 'tools',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.extname(filePath) === '.py') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('import sklearn') || content.includes('from sklearn');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['**/*llm*.py', '**/transformers/**/*.py', '**/*transformer*.py'],
    framework: 'LLM',
    type: 'tools',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.extname(filePath) === '.py') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          return content.includes('import transformers') || 
                 content.includes('from transformers') ||
                 content.includes('LLM') || content.includes('langchain');
        } catch {
          return false;
        }
      }
      return true;
    }
  },
  {
    patterns: ['**/*ml*.py', '**/model/**/*.py', '**/models/**/*.py'],
    framework: 'ML',
    type: 'tools',
    language: 'Python',
    validate: async (filePath: string) => {
      if (path.extname(filePath) === '.py') {
        try {
          const document = await vscode.workspace.openTextDocument(filePath);
          const content = document.getText();
          const mlPatterns = [
            'train_test_split', 'accuracy_score', 'precision_score',
            'model.fit', 'model.predict', 'learning_rate', 'train_step',
            'training_data', 'test_data', 'validation_data'
          ];
          return mlPatterns.some(pattern => content.includes(pattern));
        } catch {
          return false;
        }
      }
      return true;
    }
  },
]; 