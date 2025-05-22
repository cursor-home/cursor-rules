import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TechStackInfo } from './types';
import { normalizeTechName } from './utils';

/**
 * meta.json中定义的规则技术栈
 */
interface MetaRuleTechStack {
  languages?: string[];
  frameworks?: string[];
  libraries?: string[];
  tools?: string[];
}

/**
 * meta.json中的规则元数据
 */
interface RuleMetadata {
  id: string;
  name: string;
  description: string;
  techStack?: MetaRuleTechStack;
  filePath?: string;
}

/**
 * 技术栈验证结果
 */
interface TechStackValidationResult {
  // 所有技术栈列表
  allTechnologies: {
    languages: Set<string>;
    frameworks: Set<string>;
    libraries: Set<string>;
    tools: Set<string>;
  };
  // 缺失检测支持的技术栈
  missingDetection: {
    languages: string[];
    frameworks: string[];
    libraries: string[];
    tools: string[];
  };
  // 检测覆盖率
  coverage: {
    languages: number;
    frameworks: number;
    libraries: number;
    tools: number;
    overall: number;
  };
  // 必要的技术栈映射
  requiredMappings: Map<string, string[]>;
}

/**
 * 验证技术栈检测系统的完整性
 * @param context 扩展上下文
 * @returns 验证结果
 */
export async function validateTechStackDetection(
  context: vscode.ExtensionContext
): Promise<TechStackValidationResult> {
  // 初始化结果
  const result: TechStackValidationResult = {
    allTechnologies: {
      languages: new Set<string>(),
      frameworks: new Set<string>(),
      libraries: new Set<string>(),
      tools: new Set<string>()
    },
    missingDetection: {
      languages: [],
      frameworks: [],
      libraries: [],
      tools: []
    },
    coverage: {
      languages: 0,
      frameworks: 0,
      libraries: 0,
      tools: 0,
      overall: 0
    },
    requiredMappings: new Map<string, string[]>()
  };

  try {
    // 1. 读取meta.json中的所有规则
    const metaRules = await readMetaRules(context);
    if (!metaRules || metaRules.length === 0) {
      console.error('meta.json文件中未发现规则');
      return result;
    }

    // 2. 提取所有技术栈
    extractAllTechnologies(metaRules, result);

    // 3. 检查我们的检测系统能否覆盖所有技术栈
    await validateDetectionCoverage(result);

    // 4. 计算覆盖率
    calculateCoverage(result);

    return result;
  } catch (error) {
    console.error('验证技术栈检测时出错:', error);
    return result;
  }
}

/**
 * 读取meta.json中的所有规则
 * @param context 扩展上下文
 * @returns 规则元数据列表
 */
async function readMetaRules(context: vscode.ExtensionContext): Promise<RuleMetadata[]> {
  try {
    // 读取内置规则
    const builtInRulesPath = path.join(context.extensionPath, 'resources', 'rules', 'meta.json');
    const metaContent = fs.readFileSync(builtInRulesPath, 'utf-8');
    const metaRules = JSON.parse(metaContent) as RuleMetadata[];
    return metaRules;
  } catch (error) {
    console.error('读取meta.json时出错:', error);
    return [];
  }
}

/**
 * 从规则中提取所有技术栈
 * @param rules 规则元数据列表
 * @param result 验证结果
 */
function extractAllTechnologies(rules: RuleMetadata[], result: TechStackValidationResult): void {
  for (const rule of rules) {
    if (!rule.techStack) continue;

    // 处理每种技术类型
    addTechnologies(rule.techStack.languages, 'languages', result, rule.id);
    addTechnologies(rule.techStack.frameworks, 'frameworks', result, rule.id);
    addTechnologies(rule.techStack.libraries, 'libraries', result, rule.id);
    addTechnologies(rule.techStack.tools, 'tools', result, rule.id);
  }
}

/**
 * 添加技术到结果集
 * @param technologies 技术列表
 * @param type 技术类型
 * @param result 验证结果
 * @param ruleId 规则ID（用于反向查找）
 */
function addTechnologies(
  technologies: string[] | undefined, 
  type: keyof MetaRuleTechStack,
  result: TechStackValidationResult,
  ruleId: string
): void {
  if (!technologies || technologies.length === 0) return;

  for (const tech of technologies) {
    // 添加到全部技术集合
    result.allTechnologies[type].add(tech);

    // 添加到规则映射
    const normalizedTech = normalizeTechName(tech);
    if (!result.requiredMappings.has(normalizedTech)) {
      result.requiredMappings.set(normalizedTech, []);
    }
    
    const rules = result.requiredMappings.get(normalizedTech)!;
    if (!rules.includes(ruleId)) {
      rules.push(ruleId);
    }
  }
}

/**
 * 验证检测覆盖率
 * @param result 验证结果
 */
async function validateDetectionCoverage(result: TechStackValidationResult): Promise<void> {
  // 在此添加针对每种技术类型的验证逻辑
  // 例如，检查languageDetector.ts中的逻辑是否能检测到所有语言

  // 检查语言检测
  await validateLanguageDetection(result);
  
  // 检查框架检测
  await validateFrameworkDetection(result);
  
  // 检查库检测
  await validateLibraryDetection(result);
  
  // 检查工具检测
  await validateToolDetection(result);
}

/**
 * 验证语言检测覆盖率
 * @param result 验证结果
 */
async function validateLanguageDetection(result: TechStackValidationResult): Promise<void> {
  // 在实际实现中，这里应该检查languageDetector.ts中的逻辑是否能检测到所有语言
  // 这里仅做简化模拟
  const detectableLanguages = new Set([
    'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'Solidity', 'Swift', 'Dart',
    'PHP', 'Ruby', 'Go', 'Rust', 'C++', 'C', 'Kotlin', 'Scala', 'Rell'
  ]);
  
  // 找出缺失检测的语言
  for (const language of result.allTechnologies.languages) {
    const normalizedName = normalizeTechName(language);
    if (!detectableLanguages.has(normalizedName)) {
      result.missingDetection.languages.push(language);
    }
  }
}

/**
 * 验证框架检测覆盖率
 * @param result 验证结果
 */
async function validateFrameworkDetection(result: TechStackValidationResult): Promise<void> {
  // 在实际实现中，这里应该检查frameworkDetector.ts中的逻辑是否能检测到所有框架
  // 这里仅做简化模拟
  const detectableFrameworks = new Set([
    'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'SvelteKit',
    'Express', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
    'React Native', 'Flutter', 'Electron', 'Remix', 'Astro', 'Gatsby',
    'Laravel', 'Ruby on Rails', 'Qwik', 'SolidJS'
  ]);
  
  // 找出缺失检测的框架
  for (const framework of result.allTechnologies.frameworks) {
    const normalizedName = normalizeTechName(framework);
    if (!detectableFrameworks.has(normalizedName)) {
      result.missingDetection.frameworks.push(framework);
    }
  }
}

/**
 * 验证库检测覆盖率
 * @param result 验证结果
 */
async function validateLibraryDetection(result: TechStackValidationResult): Promise<void> {
  // 在实际实现中，这里应该检查packageDetector.ts中的逻辑是否能检测到所有库
  // 这里仅做简化模拟
  const detectableLibraries = new Set([
    'Tailwind', 'Material UI', 'Ant Design', 'Chakra UI', 'Shadcn UI',
    'Redux', 'MobX', 'Zustand', 'React Query', 'React Router', 'React Hook Form',
    'Prisma', 'TypeORM', 'Mongoose', 'Sequelize', 'Styled Components', 'Emotion'
  ]);
  
  // 找出缺失检测的库
  for (const library of result.allTechnologies.libraries) {
    const normalizedName = normalizeTechName(library);
    if (!detectableLibraries.has(normalizedName)) {
      result.missingDetection.libraries.push(library);
    }
  }
}

/**
 * 验证工具检测覆盖率
 * @param result 验证结果
 */
async function validateToolDetection(result: TechStackValidationResult): Promise<void> {
  // 在实际实现中，这里应该检查packageDetector.ts和其他检测器中的逻辑是否能检测到所有工具
  // 这里仅做简化模拟
  const detectableTools = new Set([
    'Webpack', 'Vite', 'ESLint', 'Prettier', 'Jest', 'Cypress', 'Docker',
    'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Firebase', 'Vercel',
    'GitHub Actions', 'GitLab CI', 'Nx', 'Lerna', 'Turborepo', 'Storybook',
    'Babel', 'TypeScript', 'Hardhat', 'Foundry', 'App Router', 'Detox'
  ]);
  
  // 找出缺失检测的工具
  for (const tool of result.allTechnologies.tools) {
    const normalizedName = normalizeTechName(tool);
    if (!detectableTools.has(normalizedName)) {
      result.missingDetection.tools.push(tool);
    }
  }
}

/**
 * 计算检测覆盖率
 * @param result 验证结果
 */
function calculateCoverage(result: TechStackValidationResult): void {
  const calculateTypePercentage = (type: keyof MetaRuleTechStack): number => {
    const total = result.allTechnologies[type].size;
    if (total === 0) return 100; // 如果没有要检测的项，则视为100%覆盖
    
    const missing = result.missingDetection[type].length;
    const detected = total - missing;
    return (detected / total) * 100;
  };
  
  // 计算每种类型的覆盖率
  result.coverage.languages = calculateTypePercentage('languages');
  result.coverage.frameworks = calculateTypePercentage('frameworks');
  result.coverage.libraries = calculateTypePercentage('libraries');
  result.coverage.tools = calculateTypePercentage('tools');
  
  // 计算总体覆盖率（加权平均）
  const totalTechs = 
    result.allTechnologies.languages.size +
    result.allTechnologies.frameworks.size +
    result.allTechnologies.libraries.size +
    result.allTechnologies.tools.size;
  
  if (totalTechs === 0) {
    result.coverage.overall = 100;
  } else {
    result.coverage.overall = (
      (result.coverage.languages * result.allTechnologies.languages.size) +
      (result.coverage.frameworks * result.allTechnologies.frameworks.size) +
      (result.coverage.libraries * result.allTechnologies.libraries.size) +
      (result.coverage.tools * result.allTechnologies.tools.size)
    ) / totalTechs;
  }
}

/**
 * 展示验证结果
 * @param result 验证结果
 */
export function displayValidationResults(result: TechStackValidationResult): void {
  // 打印总体覆盖率
  console.log(`总体技术栈检测覆盖率: ${result.coverage.overall.toFixed(2)}%`);
  console.log(`语言检测覆盖率: ${result.coverage.languages.toFixed(2)}%`);
  console.log(`框架检测覆盖率: ${result.coverage.frameworks.toFixed(2)}%`);
  console.log(`库检测覆盖率: ${result.coverage.libraries.toFixed(2)}%`);
  console.log(`工具检测覆盖率: ${result.coverage.tools.toFixed(2)}%`);
  
  // 打印未被检测到的技术
  if (result.missingDetection.languages.length > 0) {
    console.log('\n缺少检测的语言:');
    result.missingDetection.languages.forEach(lang => console.log(`- ${lang}`));
  }
  
  if (result.missingDetection.frameworks.length > 0) {
    console.log('\n缺少检测的框架:');
    result.missingDetection.frameworks.forEach(fw => console.log(`- ${fw}`));
  }
  
  if (result.missingDetection.libraries.length > 0) {
    console.log('\n缺少检测的库:');
    result.missingDetection.libraries.forEach(lib => console.log(`- ${lib}`));
  }
  
  if (result.missingDetection.tools.length > 0) {
    console.log('\n缺少检测的工具:');
    result.missingDetection.tools.forEach(tool => console.log(`- ${tool}`));
  }
  
  // 建议添加映射
  if (Object.values(result.missingDetection).some(arr => arr.length > 0)) {
    console.log('\n建议添加以下技术的检测支持:');
    
    // 遍历所有缺失检测的技术
    [...result.missingDetection.languages, 
     ...result.missingDetection.frameworks,
     ...result.missingDetection.libraries,
     ...result.missingDetection.tools].forEach(tech => {
      // 查找使用此技术的规则
      const normalizedTech = normalizeTechName(tech);
      const relatedRules = result.requiredMappings.get(normalizedTech) || [];
      
      console.log(`- ${tech} (用于规则: ${relatedRules.join(', ')})`);
    });
  } else {
    console.log('\n恭喜! 所有meta.json中的技术栈都能被检测到.');
  }
}

/**
 * 为VS Code命令注册验证函数
 * @param context 扩展上下文
 */
export function registerValidationCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('cursor-rules.validateTechStack', async () => {
    const result = await validateTechStackDetection(context);
    displayValidationResults(result);
    
    // 显示结果通知
    const coverage = result.coverage.overall.toFixed(0);
    if (result.coverage.overall >= 90) {
      vscode.window.showInformationMessage(
        `技术栈检测覆盖率为 ${coverage}%! 大部分技术栈都能被正确检测.`
      );
    } else {
      vscode.window.showWarningMessage(
        `技术栈检测覆盖率为 ${coverage}%. 请查看日志了解更多详情.`
      );
    }
  });
  
  context.subscriptions.push(command);
} 