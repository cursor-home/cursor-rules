/**
 * techStack/utils.ts
 * 
 * 技术栈工具函数模块，提供技术栈信息的处理工具
 * 
 * 主要功能：
 * 1. 计算技术栈检测结果的置信度
 * 2. 生成技术栈信息的可读字符串描述
 * 3. 技术栈名称规范化
 * 
 * 这个模块被技术栈检测主模块所使用，为其提供辅助功能，
 * 包括对检测结果进行后处理和格式化，使结果更易于理解和展示
 */
import { TechStackInfo } from './types';

/**
 * 技术栈名称映射表
 * 用于统一技术栈名称，确保检测到的技术名称与meta.json中的名称一致
 * 
 * 格式：{ 检测到的名称: meta.json中使用的标准名称 }
 */
const techStackNameMap: Record<string, string> = {
  // 语言名称统一
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'java': 'Java',
  'c#': 'C#',
  'c++': 'C++',
  'go': 'Go',
  'ruby': 'Ruby',
  'rust': 'Rust',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'objective-c': 'Objective-C',
  'dart': 'Dart',
  'solidity': 'Solidity',
  'rell': 'Rell',
  'webassembly': 'WebAssembly',
  'sql': 'SQL',
  'css': 'CSS',
  'html': 'HTML',
  
  // 框架名称统一
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'vue': 'Vue',
  'vue.js': 'Vue.js', 
  'vuejs': 'Vue.js',
  'angular': 'Angular',
  'angularjs': 'Angular',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'nuxt': 'Nuxt',
  'nuxtjs': 'Nuxt',
  'nuxt.js': 'Nuxt',
  'svelte': 'Svelte',
  'sveltejs': 'Svelte',
  'svelte.js': 'Svelte',
  'sveltekit': 'SvelteKit',
  'gatsby': 'Gatsby',
  'express': 'Express',
  'expressjs': 'Express',
  'nestjs': 'NestJS',
  'nest.js': 'NestJS',
  'fastapi': 'FastAPI',
  'django': 'Django',
  'django rest framework': 'Django REST Framework',
  'flask': 'Flask',
  'spring': 'Spring',
  'spring boot': 'Spring Boot',
  'symfony': 'Symfony',
  'laravel': 'Laravel',
  'asp.net': 'ASP.NET',
  'asp.net core': 'ASP.NET Core',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  
  // 库和工具名称统一
  'tailwind': 'Tailwind',
  'tailwindcss': 'Tailwind',
  'tailwind css': 'Tailwind',
  'shadcn': 'Shadcn',
  'shadcn/ui': 'Shadcn UI',
  'shadcn ui': 'Shadcn UI',
  'chakra': 'Chakra UI',
  'chakra ui': 'Chakra UI',
  'chakra-ui': 'Chakra UI',
  'styled components': 'Styled Components',
  'styled-components': 'Styled Components',
  'styledcomponents': 'Styled Components',
  'mobx': 'MobX',
  'redux': 'Redux',
  'jest': 'Jest',
  'detox': 'Detox',
  'cypress': 'Cypress',
  'playwright': 'Playwright',
  'pnpm': 'pnpm',
  'yarn': 'Yarn',
  'npm': 'npm',
  'vite': 'Vite',
  'webpack': 'Webpack',
  'eslint': 'ESLint',
  'tslint': 'TSLint',
  'prettier': 'Prettier',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'aws': 'AWS',
  'azure': 'Azure',
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'firebase': 'Firebase',
  'supabase': 'Supabase',
  'vercel': 'Vercel',
  'netlify': 'Netlify',
  'heroku': 'Heroku',
  'graphql': 'GraphQL',
  'apollo': 'Apollo GraphQL',
  'apollo graphql': 'Apollo GraphQL',
  'trpc': 'tRPC',
  'prisma': 'Prisma',
  'typeorm': 'TypeORM',
  'sequelize': 'Sequelize',
  'mongoose': 'Mongoose',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongodb': 'MongoDB',
  'redis': 'Redis',
  'sqlite': 'SQLite',
  'foundry': 'Foundry',
  'hardhat': 'Hardhat',
  'truffle': 'Truffle',
  'clasp': 'Clasp',
  'llm': 'LLM',
  'ml': 'ML',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'scikit-learn': 'Scikit-Learn',
  'scikit learn': 'Scikit-Learn',
  'app router': 'App Router',
};

/**
 * 规范化技术栈名称
 * 将检测到的技术名称转换为meta.json中使用的标准名称
 * 
 * @param name 原始技术名称
 * @returns 规范化后的技术名称
 */
export function normalizeTechName(name: string): string {
  // 转换为小写，用于查找映射
  const lowerName = name.toLowerCase();
  
  // 如果存在于映射表中，使用映射表中的标准名称
  if (techStackNameMap[lowerName]) {
    return techStackNameMap[lowerName];
  }
  
  // 否则保持原名，但确保首字母大写
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * 规范化技术栈信息中的所有技术名称
 * 
 * @param techStack 技术栈信息对象
 * @returns 规范化后的技术栈信息对象
 */
export function normalizeTechStackNames(techStack: TechStackInfo): TechStackInfo {
  return {
    languages: techStack.languages.map(normalizeTechName),
    frameworks: techStack.frameworks.map(normalizeTechName),
    libraries: techStack.libraries.map(normalizeTechName),
    tools: techStack.tools.map(normalizeTechName),
    confidence: techStack.confidence
  };
}

/**
 * 计算技术栈检测的置信度 (0-1)
 * 
 * 基于检测到的技术数量、其类别分布，和内部一致性来计算置信度。
 * 不同技术类别有不同的权重：
 * - 语言: 较重（通常一个项目只有1-2种主要语言）
 * - 框架: 中等（框架通常明确标识项目类型）
 * - 库: 中等（多个库的组合可以增强置信度）
 * - 工具: 较轻（工具通常是辅助性的）
 * 
 * @param techStack 技术栈信息对象
 * @returns 置信度 (0-1)
 */
export function calculateConfidence(techStack: TechStackInfo): number {
  // 如果没有检测到任何技术，置信度为0
  if (
    techStack.languages.length === 0 &&
    techStack.frameworks.length === 0 &&
    techStack.libraries.length === 0 &&
    techStack.tools.length === 0
  ) {
    return 0;
  }
  
  // 权重设置
  const weights = {
    languages: 0.4,  // 语言是最重要的指标
    frameworks: 0.3, // 框架次之
    libraries: 0.2,  // 库再次之
    tools: 0.1       // 工具权重最低
  };
  
  // 基于数量的初始分数计算
  let baseScore = 0;
  
  // 语言得分 (0-1)
  const languageScore = calculateCategoryScore(techStack.languages.length, 1, 3);
  
  // 框架得分 (0-1)
  const frameworkScore = calculateCategoryScore(techStack.frameworks.length, 1, 4);
  
  // 库得分 (0-1)
  const libraryScore = calculateCategoryScore(techStack.libraries.length, 2, 8);
  
  // 工具得分 (0-1)
  const toolScore = calculateCategoryScore(techStack.tools.length, 1, 5);
  
  // 应用权重计算加权得分
  baseScore = (
    weights.languages * languageScore + 
    weights.frameworks * frameworkScore + 
    weights.libraries * libraryScore + 
    weights.tools * toolScore
  );
  
  // 应用一致性奖励
  const consistencyBonus = applyConsistencyBonus(techStack);
  
  // 计算最终置信度，应用一致性奖励，并确保结果在0-1范围内
  let confidence = Math.min(baseScore + consistencyBonus, 1);
  confidence = Math.max(confidence, 0);
  
  // 保留两位小数
  return Math.round(confidence * 100) / 100;
}

/**
 * 计算单个类别的得分
 * @param count 检测到的数量
 * @param min 最小期望数量
 * @param max 最大期望数量
 * @returns 类别得分 (0-1)
 */
function calculateCategoryScore(count: number, min: number, max: number): number {
  if (count === 0) {
    return 0;
  }
  
  if (count >= max) {
    return 1; // 达到或超过最大期望数量，满分
  }
  
  // 线性映射到 0.4-1.0 范围
  // 即使只检测到1个，也至少得到0.4的基础分
  return 0.4 + (0.6 * (count - min) / (max - min));
}

/**
 * 应用一致性奖励
 * 
 * 当检测到的技术之间存在一致性（如语言和框架之间的匹配）时，
 * 增加置信度。这表明检测结果更可能是准确的。
 * 
 * @param techStack 技术栈信息
 * @returns 一致性奖励 (0-0.2)
 */
function applyConsistencyBonus(techStack: TechStackInfo): number {
  let bonus = 0;
  
  // 检查语言和框架的一致性
  if (techStack.languages.length > 0 && techStack.frameworks.length > 0) {
    // 语言和框架的常见匹配
    const matchPairs = [
      { lang: 'JavaScript', framework: 'React' },
      { lang: 'JavaScript', framework: 'Vue.js' },
      { lang: 'JavaScript', framework: 'Angular' },
      { lang: 'TypeScript', framework: 'React' },
      { lang: 'TypeScript', framework: 'Vue.js' },
      { lang: 'TypeScript', framework: 'Angular' },
      { lang: 'TypeScript', framework: 'NestJS' },
      { lang: 'Java', framework: 'Spring' },
      { lang: 'Java', framework: 'Spring Boot' },
      { lang: 'Python', framework: 'Django' },
      { lang: 'Python', framework: 'Flask' },
      { lang: 'Python', framework: 'FastAPI' },
      { lang: 'C#', framework: 'ASP.NET' },
      { lang: 'C#', framework: 'ASP.NET Core' },
      { lang: 'Ruby', framework: 'Rails' },
      { lang: 'PHP', framework: 'Laravel' },
      { lang: 'PHP', framework: 'Symfony' },
      { lang: 'Go', framework: 'Gin' },
      { lang: 'Go', framework: 'Echo' },
    ];
    
    // 检查是否有匹配
    for (const pair of matchPairs) {
      if (
        techStack.languages.includes(pair.lang) && 
        techStack.frameworks.includes(pair.framework)
      ) {
        bonus += 0.1; // 每个匹配增加0.1
        break; // 只计算一次语言-框架匹配
      }
    }
  }
  
  // 检查框架和库的一致性
  if (techStack.frameworks.length > 0 && techStack.libraries.length > 0) {
    // 框架和库的常见匹配
    const frameworkLibPairs = [
      { framework: 'React', lib: 'Redux' },
      { framework: 'React', lib: 'MobX' },
      { framework: 'React', lib: 'React Router' },
      { framework: 'Vue.js', lib: 'Vuex' },
      { framework: 'Vue.js', lib: 'Vue Router' },
      { framework: 'Angular', lib: 'RxJS' },
      { framework: 'Spring Boot', lib: 'Spring Data' },
      { framework: 'Spring Boot', lib: 'Spring Security' },
      { framework: 'Django', lib: 'Django REST framework' },
    ];
    
    // 检查是否有匹配
    for (const pair of frameworkLibPairs) {
      if (
        techStack.frameworks.includes(pair.framework) && 
        techStack.libraries.includes(pair.lib)
      ) {
        bonus += 0.05; // 每个匹配增加0.05
      }
    }
  }
  
  // 工具与其他技术的一致性
  if (techStack.tools.length > 0) {
    // 工具和语言/框架的常见匹配
    const toolMatchPairs = [
      { tool: 'Docker', others: ['Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions'] },
      { tool: 'Webpack', others: ['React', 'Vue.js', 'JavaScript', 'TypeScript'] },
      { tool: 'ESLint', others: ['JavaScript', 'TypeScript'] },
      { tool: 'Jest', others: ['React', 'JavaScript', 'TypeScript'] },
      { tool: 'Maven', others: ['Java', 'Spring', 'Spring Boot'] },
      { tool: 'Gradle', others: ['Java', 'Kotlin', 'Spring', 'Spring Boot'] },
      { tool: 'Pip', others: ['Python', 'Django', 'Flask'] },
    ];
    
    // 检查是否有匹配
    for (const pair of toolMatchPairs) {
      if (techStack.tools.includes(pair.tool)) {
        for (const other of pair.others) {
          if (
            techStack.languages.includes(other) || 
            techStack.frameworks.includes(other) ||
            techStack.libraries.includes(other) ||
            techStack.tools.includes(other)
          ) {
            bonus += 0.03; // 每个匹配增加0.03
            break; // 每个工具只计算一次
          }
        }
      }
    }
  }
  
  // 限制最大奖励值
  return Math.min(bonus, 0.2);
}

/**
 * 获取技术栈的人类可读描述
 * 
 * 根据检测到的技术栈信息生成一个描述性的文本，概述项目使用的技术。
 * 描述会根据置信度和检测到的信息量调整详细程度。
 * 
 * @param techStack 技术栈信息
 * @returns 技术栈描述
 */
export function getTechStackDescription(techStack: TechStackInfo): string {
  // 如果没有检测到任何技术，返回一个通用消息
  if (
    techStack.languages.length === 0 &&
    techStack.frameworks.length === 0 &&
    techStack.libraries.length === 0 &&
    techStack.tools.length === 0
  ) {
    return '未能检测到任何技术栈信息。';
  }
  
  // 根据置信度级别选择适当的起始语句
  const confidencePrefix = getConfidencePrefix(techStack.confidence);
  let description = `${confidencePrefix}`;
  
  // 添加主要语言
  if (techStack.languages.length > 0) {
    description += ` 使用${formatList(techStack.languages)}`;
    
    // 如果有框架，添加框架信息
    if (techStack.frameworks.length > 0) {
      description += `，基于${formatList(techStack.frameworks)}框架`;
    }
    
    // 使用逗号或句号结束，取决于是否还有更多信息
    if (techStack.libraries.length > 0 || techStack.tools.length > 0) {
      description += '，';
    } else {
      description += '。';
    }
  } else if (techStack.frameworks.length > 0) {
    // 如果没有检测到语言但有框架
    description += ` 使用${formatList(techStack.frameworks)}框架`;
    
    // 使用逗号或句号结束
    if (techStack.libraries.length > 0 || techStack.tools.length > 0) {
      description += '，';
    } else {
      description += '。';
    }
  }
  
  // 添加库信息（如果有）
  if (techStack.libraries.length > 0) {
    // 如果是句子的开始
    if (techStack.languages.length === 0 && techStack.frameworks.length === 0) {
      description += ` 使用${formatList(techStack.libraries)}库`;
    } else {
      description += `集成了${formatList(techStack.libraries)}库`;
    }
    
    // 使用逗号或句号结束
    if (techStack.tools.length > 0) {
      description += '，';
    } else {
      description += '。';
    }
  }
  
  // 添加工具信息（如果有）
  if (techStack.tools.length > 0) {
    // 如果是句子的开始
    if (techStack.languages.length === 0 && techStack.frameworks.length === 0 && techStack.libraries.length === 0) {
      description += ` 使用${formatList(techStack.tools)}工具`;
    } else {
      description += `使用了${formatList(techStack.tools)}等工具`;
    }
    
    description += '。';
  }
  
  // 添加置信度附注
  if (techStack.confidence < 0.5) {
    description += ' 这个分析可能不完整，建议手动验证。';
  } else if (techStack.confidence >= 0.9) {
    description += ' 这个分析具有很高的可信度。';
  }
  
  return description;
}

/**
 * 根据置信度获取适当的描述前缀
 */
function getConfidencePrefix(confidence: number): string {
  if (confidence >= 0.9) {
    return '这个项目明确地';
  } else if (confidence >= 0.7) {
    return '这个项目很可能';
  } else if (confidence >= 0.5) {
    return '这个项目似乎';
  } else {
    return '这个项目可能';
  }
}

/**
 * 格式化技术列表为可读的字符串
 */
function formatList(items: string[]): string {
  if (items.length === 0) {
    return '';
  }
  
  if (items.length === 1) {
    return items[0];
  }
  
  if (items.length === 2) {
    return `${items[0]}和${items[1]}`;
  }
  
  // 超过两个项目，使用逗号分隔，最后一个使用"和"
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, items.length - 1);
  
  return `${otherItems.join('、')}和${lastItem}`;
} 