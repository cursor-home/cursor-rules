import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TechStackInfo } from '../types';

/**
 * 云配置文件信息接口
 */
interface CloudConfigInfo {
  // 文件模式，用于匹配配置文件
  patterns: string[];
  // 相关的云服务/工具
  technology: string;
  // 技术类型：框架、库或工具
  type: 'frameworks' | 'libraries' | 'tools' | 'languages';
  // 可选的验证函数，用于验证文件内容
  validate?: (content: string) => boolean;
}

/**
 * 分析云原生技术栈
 * 专门用于检测项目中的云原生和容器相关技术
 * @param workspaceFolder 工作区文件夹
 * @param result 技术栈结果对象
 */
export async function analyzeCloudTechnologies(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  try {
    // 1. 检查常见的云服务和容器配置文件
    await checkCloudConfigFiles(workspaceFolder, result);
    
    // 2. 检查 package.json 中的云服务相关依赖
    await checkPackageJsonForCloudDeps(workspaceFolder, result);
    
    // 3. 检查 Python 依赖中的云服务相关包
    await checkPythonCloudDeps(workspaceFolder, result);
  } catch (error) {
    console.error('Error analyzing cloud technologies:', error);
  }
}

/**
 * 检查常见的云服务和容器配置文件
 */
async function checkCloudConfigFiles(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // 定义云服务和容器技术的配置文件
  const cloudConfigs: CloudConfigInfo[] = [
    // Docker
    {
      patterns: ['Dockerfile', '**/Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '**/docker-compose.yml', '**/docker-compose.yaml'],
      technology: 'Docker',
      type: 'tools',
    },
    // Kubernetes
    {
      patterns: ['kubernetes/*.yaml', 'kubernetes/*.yml', 'k8s/*.yaml', 'k8s/*.yml', '**/*.k8s.yaml', '**/*.k8s.yml'],
      technology: 'Kubernetes',
      type: 'tools',
    },
    // Terraform
    {
      patterns: ['**/*.tf', '**/terraform/*.tf'],
      technology: 'Terraform',
      type: 'tools',
      validate: (content) => content.includes('resource') || content.includes('provider') || content.includes('module')
    },
    // AWS CloudFormation
    {
      patterns: ['**/cloudformation/*.yaml', '**/cloudformation/*.yml', '**/*.cf.yaml', '**/*.cf.yml'],
      technology: 'AWS CloudFormation',
      type: 'tools',
      validate: (content) => content.includes('AWSTemplateFormatVersion') || content.includes('Resources:')
    },
    // Azure ARM Templates
    {
      patterns: ['**/templates/*.json', '**/*.arm.json'],
      technology: 'Azure ARM Templates',
      type: 'tools',
      validate: (content) => content.includes('"$schema": "https://schema.management.azure.com/schemas/')
    },
    // Google Cloud Deployment Manager
    {
      patterns: ['**/*.yaml', '**/*.jinja'],
      technology: 'Google Cloud Deployment Manager',
      type: 'tools',
      validate: (content) => content.includes('imports:') && content.includes('resources:')
    },
    // Helm Charts
    {
      patterns: ['**/charts/**/Chart.yaml', '**/helm/**/Chart.yaml'],
      technology: 'Helm',
      type: 'tools',
    },
    // Serverless Framework
    {
      patterns: ['serverless.yml', 'serverless.yaml', '**/serverless.yml', '**/serverless.yaml'],
      technology: 'Serverless Framework',
      type: 'tools',
    },
    // GitHub Actions
    {
      patterns: ['.github/workflows/*.yml', '.github/workflows/*.yaml'],
      technology: 'GitHub Actions',
      type: 'tools',
    },
    // CircleCI
    {
      patterns: ['.circleci/config.yml', '.circleci/config.yaml'],
      technology: 'CircleCI',
      type: 'tools',
    },
    // GitLab CI
    {
      patterns: ['.gitlab-ci.yml', '.gitlab-ci.yaml'],
      technology: 'GitLab CI',
      type: 'tools',
    },
    // AWS Lambda (Serverless)
    {
      patterns: ['**/serverless.yml', '**/serverless.yaml'],
      technology: 'AWS Lambda',
      type: 'tools',
      validate: (content) => content.includes('aws') || content.includes('lambda')
    },
    // AWS SAM (Serverless Application Model)
    {
      patterns: ['template.yaml', 'template.yml', 'sam-template.yaml', 'sam-template.yml'],
      technology: 'AWS SAM',
      type: 'tools',
      validate: (content) => content.includes('Transform: AWS::Serverless')
    }
  ];

  // 检查每个配置文件
  for (const config of cloudConfigs) {
    for (const pattern of config.patterns) {
      try {
        const relativePath = pattern.replace('**/', '');
        const findResult = await vscode.workspace.findFiles(
          new vscode.RelativePattern(workspaceFolder, pattern),
          null,
          5 // 限制找到的文件数量
        );

        if (findResult.length > 0) {
          const filePath = findResult[0].fsPath;
          
          // 如果有验证函数，则读取文件内容进行验证
          if (config.validate) {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (!config.validate(content)) {
              continue; // 验证失败，跳过
            }
          }
          
          // 添加技术到结果中
          addToTechStack(result, config.technology, config.type);
          break; // 找到一个匹配即可
        }
      } catch (error) {
        console.error(`Error checking pattern ${pattern}:`, error);
      }
    }
  }
}

/**
 * 检查 package.json 中的云服务相关依赖
 */
async function checkPackageJsonForCloudDeps(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  try {
    const packageJsonPath = path.join(workspaceFolder.uri.fsPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {})
    };

    // 云服务依赖映射
    const cloudDependencyMappings: { [key: string]: { name: string; type: 'frameworks' | 'libraries' | 'tools' } } = {
      // AWS
      'aws-sdk': { name: 'AWS SDK', type: 'libraries' },
      '@aws-sdk/client': { name: 'AWS SDK', type: 'libraries' },
      'aws-amplify': { name: 'AWS Amplify', type: 'frameworks' },
      'aws-cdk': { name: 'AWS CDK', type: 'tools' },
      'aws-cdk-lib': { name: 'AWS CDK', type: 'tools' },
      'cdk': { name: 'AWS CDK', type: 'tools' },
      
      // Azure
      '@azure/functions': { name: 'Azure Functions', type: 'frameworks' },
      '@azure/storage-blob': { name: 'Azure Storage', type: 'libraries' },
      '@azure/cosmos': { name: 'Azure Cosmos DB', type: 'libraries' },
      
      // Google Cloud
      '@google-cloud/functions-framework': { name: 'Google Cloud Functions', type: 'frameworks' },
      '@google-cloud/storage': { name: 'Google Cloud Storage', type: 'libraries' },
      '@google-cloud/firestore': { name: 'Firestore', type: 'libraries' },
      'firebase': { name: 'Firebase', type: 'libraries' },
      'firebase-admin': { name: 'Firebase Admin', type: 'libraries' },
      
      // Serverless
      'serverless': { name: 'Serverless Framework', type: 'tools' },
      
      // Container/Orchestration
      'kubernetes-client': { name: 'Kubernetes', type: 'tools' },
      '@kubernetes/client-node': { name: 'Kubernetes', type: 'tools' },
      
      // Cloud Providers - Generic
      'pulumi': { name: 'Pulumi', type: 'tools' },
      '@pulumi/aws': { name: 'Pulumi AWS', type: 'tools' },
      '@pulumi/azure': { name: 'Pulumi Azure', type: 'tools' },
      '@pulumi/gcp': { name: 'Pulumi GCP', type: 'tools' },
      
      // Terraform
      'terraform-cdk': { name: 'Terraform CDK', type: 'tools' },
      'cdktf': { name: 'Terraform CDK', type: 'tools' },
    };

    // 检查依赖
    for (const [dep, _] of Object.entries(dependencies)) {
      // 精确匹配
      if (cloudDependencyMappings[dep]) {
        const mapping = cloudDependencyMappings[dep];
        addToTechStack(result, mapping.name, mapping.type);
        continue;
      }
      
      // 包含匹配
      for (const [key, mapping] of Object.entries(cloudDependencyMappings)) {
        if (dep.includes(key)) {
          addToTechStack(result, mapping.name, mapping.type);
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error checking package.json for cloud dependencies:', error);
  }
}

/**
 * 检查 Python 依赖中的云服务相关包
 */
async function checkPythonCloudDeps(
  workspaceFolder: vscode.WorkspaceFolder,
  result: TechStackInfo
): Promise<void> {
  // Python 云服务依赖文件
  const pythonDepFiles = [
    'requirements.txt',
    'Pipfile',
    'pyproject.toml',
    'setup.py'
  ];

  // 云服务包映射
  const cloudPackageMappings: { [key: string]: { name: string; type: 'frameworks' | 'libraries' | 'tools' } } = {
    // AWS
    'boto3': { name: 'AWS SDK (boto3)', type: 'libraries' },
    'aws-cdk': { name: 'AWS CDK', type: 'tools' },
    'aws-cdk-lib': { name: 'AWS CDK', type: 'tools' },
    'chalice': { name: 'AWS Chalice', type: 'frameworks' },
    'aws-lambda': { name: 'AWS Lambda', type: 'frameworks' },
    
    // Azure
    'azure-functions': { name: 'Azure Functions', type: 'frameworks' },
    'azure-storage-blob': { name: 'Azure Storage', type: 'libraries' },
    'azure-cosmos': { name: 'Azure Cosmos DB', type: 'libraries' },
    
    // Google Cloud
    'google-cloud': { name: 'Google Cloud SDK', type: 'libraries' },
    'google-cloud-storage': { name: 'Google Cloud Storage', type: 'libraries' },
    'google-cloud-firestore': { name: 'Firestore', type: 'libraries' },
    'firebase-admin': { name: 'Firebase Admin', type: 'libraries' },
    'functions-framework': { name: 'Google Cloud Functions', type: 'frameworks' },
    
    // Container/Orchestration
    'kubernetes': { name: 'Kubernetes Python Client', type: 'tools' },
    'docker': { name: 'Docker SDK for Python', type: 'tools' },
    
    // IaC
    'pulumi': { name: 'Pulumi', type: 'tools' },
    'terraform': { name: 'Terraform', type: 'tools' },
    'troposphere': { name: 'AWS CloudFormation (Troposphere)', type: 'tools' },
  };

  for (const depFile of pythonDepFiles) {
    try {
      const filePath = path.join(workspaceFolder.uri.fsPath, depFile);
      if (!fs.existsSync(filePath)) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        // 忽略注释和空行
        if (line.trim().startsWith('#') || !line.trim()) {
          continue;
        }

        // 提取包名（移除版本和其他信息）
        let packageName = line.split('==')[0].split('>=')[0].split('<=')[0].split('>')[0].split('<')[0].split('#')[0].trim();
        packageName = packageName.split('[')[0]; // 移除额外选项如 package[option]
        
        // 检查是否匹配云包
        for (const [cloudPkg, mapping] of Object.entries(cloudPackageMappings)) {
          if (packageName === cloudPkg || packageName.includes(cloudPkg)) {
            addToTechStack(result, mapping.name, mapping.type);
            break;
          }
        }
      }
    } catch (error) {
      console.error(`Error checking ${depFile} for cloud dependencies:`, error);
    }
  }
}

/**
 * 添加检测到的技术到技术栈结果中
 */
function addToTechStack(
  result: TechStackInfo,
  technology: string,
  type: 'frameworks' | 'libraries' | 'tools' | 'languages'
): void {
  if (type === 'frameworks' && !result.frameworks.includes(technology)) {
    result.frameworks.push(technology);
  } else if (type === 'libraries' && !result.libraries.includes(technology)) {
    result.libraries.push(technology);
  } else if (type === 'tools' && !result.tools.includes(technology)) {
    result.tools.push(technology);
  } else if (type === 'languages' && !result.languages.includes(technology)) {
    result.languages.push(technology);
  }
} 