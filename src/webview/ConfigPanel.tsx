import * as React from 'react';
import { useState, useEffect } from 'react';
import './ConfigPanel.css';
import { Rule } from '../types';
import { vscode } from './vscode';

// 定义VSCode API接口
interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

// 定义组件属性
interface ConfigPanelProps {
  vscode: VSCodeAPI;
}

// 定义配置项接口
interface ConfigItem {
  id: string;
  label: string;
  value: string | boolean | number;
  type: 'string' | 'boolean' | 'number';
}

// 配置项组件接口
interface ConfigItemProps {
  title: string;
  description: string;
  onSelect: () => void;
  isActive: boolean;
}

// 配置项组件
const ConfigItem: React.FC<ConfigItemProps> = ({ title, description, onSelect, isActive }) => {
  return (
    <div className={`config-item ${isActive ? 'active' : ''}`} onClick={onSelect}>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="select-button">选择</button>
    </div>
  );
};

// 定义技术栈信息接口
interface TechStackInfo {
  languages: string[];
  frameworks: string[];
  libraries: string[];
  tools: string[];
  confidence: number;
}

// 预定义的规则模板，这个模板应该和manager.ts中的保持一致
// 由于webview与扩展主进程运行在不同的上下文中，所以需要在这里重新定义
// 而不是直接导入，确保两边的模板数据一致
const ruleTemplates: Rule[] = [
  {
    id: 'basic',
    name: '基础规则',
    description: '适用于所有项目的通用规则',
    content: `---
description: 通用项目规则
---
# 通用编码规范

## 代码风格
- 使用一致的缩进和格式
- 变量命名采用驼峰命名法
- 避免过长的函数和嵌套层级
- 总是添加适当的注释

## 安全规则
- 避免硬编码密钥或敏感信息
- 确保正确处理用户输入
- 使用安全的API调用方式

## 项目特定规则
- 在此添加项目特有的规则和惯例
`
  },
  {
    id: 'typescript',
    name: 'TypeScript规则',
    description: '适用于TypeScript项目的规则',
    content: `---
description: TypeScript项目规则
globs: "**/*.ts,**/*.tsx"
---
# TypeScript项目规范

## 类型声明
- 总是显式声明类型，尽量避免any
- 使用接口（interface）定义对象类型
- 使用类型别名（type）定义复杂类型
- 使用枚举（enum）定义固定选项集合

## 函数规范
- 所有函数必须有返回类型声明
- 使用函数重载表达复杂的类型关系
- 尽量使用箭头函数保持this上下文

## 项目组织
- 每个文件只导出一个主要类或函数
- 相关功能放在同一目录下
- 使用index.ts统一导出API
`
  },
  {
    id: 'react',
    name: 'React规则',
    description: '适用于React项目的规则',
    content: `---
description: React项目规则
globs: "**/*.tsx,**/*.jsx"
---
# React项目规范

## 组件设计
- 优先使用函数组件和Hooks
- 组件尽量保持纯函数，避免副作用
- 使用自定义Hook封装复杂逻辑
- 大型组件拆分为小组件

## 状态管理
- 使用useState管理简单状态
- 复杂状态使用useReducer
- 跨组件状态使用Context API
- 避免过度使用全局状态

## 性能优化
- 使用React.memo避免不必要的重新渲染
- 使用useCallback缓存回调函数
- 使用useMemo缓存计算结果
`
  }
];

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ vscode }) => {
  // 通用配置项状态
  const [config, setConfig] = useState<ConfigItem[]>([
    { id: 'enableAutoCheck', label: '启动时自动检查Cursor Rules', value: true, type: 'boolean' },
    { id: 'defaultTemplate', label: '默认模板', value: 'basic', type: 'string' },
    { id: 'enableTechStackDetection', label: '启用技术栈检测', value: true, type: 'boolean' }
  ]);
  
  // 选中的模板
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  
  // 模板预览
  const [previewContent, setPreviewContent] = useState<string>('');
  
  // 技术栈信息
  const [techStackInfo, setTechStackInfo] = useState<TechStackInfo | null>(null);
  
  // 技术栈检测状态
  const [detecting, setDetecting] = useState<boolean>(false);
  
  // 加载保存的配置
  useEffect(() => {
    // 监听来自扩展的消息
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'configLoaded') {
        setConfig(message.config);
        
        // 设置默认模板
        const defaultTemplate = message.config.find((item: ConfigItem) => item.id === 'defaultTemplate');
        if (defaultTemplate) {
          setSelectedTemplateIndex(ruleTemplates.findIndex(t => t.id === defaultTemplate.value as string));
        }
      } else if (message.type === 'techStackDetected') {
        setTechStackInfo(message.techStackInfo);
        setDetecting(false);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // 请求初始配置
    vscode.postMessage({ type: 'getConfig' });
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [vscode]);
  
  // 更新模板预览
  useEffect(() => {
    if (selectedTemplateIndex !== null) {
      setPreviewContent(ruleTemplates[selectedTemplateIndex].content);
    }
  }, [selectedTemplateIndex]);
  
  // 处理配置更改
  const handleConfigChange = (id: string, value: string | boolean | number) => {
    const newConfig = config.map(item => 
      item.id === id ? { ...item, value } : item
    );
    
    setConfig(newConfig);
    
    // 发送更新到扩展
    vscode.postMessage({
      type: 'updateConfig',
      config: newConfig
    });
    
    // 如果更改的是默认模板，则更新预览
    if (id === 'defaultTemplate') {
      setSelectedTemplateIndex(ruleTemplates.findIndex(t => t.id === value as string));
    }
  };
  
  // 创建选中的模板
  const handleCreateTemplate = () => {
    vscode.postMessage({
      type: 'createTemplate',
      templateId: ruleTemplates[selectedTemplateIndex as number].id
    });
  };
  
  // 处理技术栈检测
  const handleDetectTechStack = () => {
    setDetecting(true);
    setTechStackInfo(null);
    
    // 发送检测命令到扩展
    vscode.postMessage({
      type: 'detectTechStack'
    });
  };
  
  // 根据技术栈推荐模板
  const getRecommendedTemplate = (): string => {
    if (!techStackInfo) {
      return ruleTemplates[selectedTemplateIndex as number].id;
    }
    
    // 如果检测到TypeScript，选用TypeScript模板
    if (techStackInfo.languages.includes('TypeScript')) {
      // 如果同时检测到React，选用React模板
      if (techStackInfo.frameworks.includes('React')) {
        return 'react';
      }
      return 'typescript';
    } 
    // 如果只检测到React但不是TypeScript，依然使用React模板
    else if (techStackInfo.frameworks.includes('React')) {
      return 'react';
    }
    
    return 'basic';
  };
  
  // 应用推荐模板
  const applyRecommendedTemplate = () => {
    const recommendedTemplate = getRecommendedTemplate();
    setSelectedTemplateIndex(ruleTemplates.findIndex(t => t.id === recommendedTemplate));
    
    // 更新默认模板配置
    const newConfig = config.map(item => 
      item.id === 'defaultTemplate' ? { ...item, value: recommendedTemplate } : item
    );
    
    setConfig(newConfig);
    
    // 发送更新到扩展
    vscode.postMessage({
      type: 'updateConfig',
      config: newConfig
    });
  };
  
  // 渲染配置项
  const renderConfigItem = (item: ConfigItem) => {
    switch (item.type) {
      case 'boolean':
        return (
          <div className="config-item" key={item.id}>
            <label className="config-label">
              <input
                type="checkbox"
                checked={item.value as boolean}
                onChange={e => handleConfigChange(item.id, e.target.checked)}
              />
              {item.label}
            </label>
          </div>
        );
        
      case 'string':
        if (item.id === 'defaultTemplate') {
          return (
            <div className="config-item" key={item.id}>
              <label className="config-label">{item.label}</label>
              <select 
                className="config-select"
                value={item.value as string}
                onChange={e => handleConfigChange(item.id, e.target.value)}
              >
                {ruleTemplates.map((template, index) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        
        return (
          <div className="config-item" key={item.id}>
            <label className="config-label">{item.label}</label>
            <input
              type="text"
              value={item.value as string}
              onChange={e => handleConfigChange(item.id, e.target.value)}
              className="config-input"
            />
          </div>
        );
        
      case 'number':
        return (
          <div className="config-item" key={item.id}>
            <label className="config-label">{item.label}</label>
            <input
              type="number"
              value={item.value as number}
              onChange={e => handleConfigChange(item.id, Number(e.target.value))}
              className="config-input"
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // 渲染技术栈信息
  const renderTechStackInfo = () => {
    if (detecting) {
      return (
        <div className="tech-stack-loading">
          <p>正在检测项目技术栈，请稍候...</p>
        </div>
      );
    }
    
    if (!techStackInfo) {
      return (
        <div className="tech-stack-empty">
          <p>点击"检测技术栈"按钮分析当前项目。</p>
          <button 
            className="config-button"
            onClick={handleDetectTechStack}
          >
            检测技术栈
          </button>
        </div>
      );
    }
    
    return (
      <div className="tech-stack-info">
        <div className="tech-stack-header">
          <h3>检测到的技术栈</h3>
          <span className="tech-stack-confidence">
            置信度: {Math.round(techStackInfo.confidence * 100)}%
          </span>
        </div>
        
        {techStackInfo.languages.length > 0 && (
          <div className="tech-stack-section">
            <h4>编程语言</h4>
            <div className="tech-stack-tags">
              {techStackInfo.languages.map(lang => (
                <span key={lang} className="tech-stack-tag">{lang}</span>
              ))}
            </div>
          </div>
        )}
        
        {techStackInfo.frameworks.length > 0 && (
          <div className="tech-stack-section">
            <h4>框架</h4>
            <div className="tech-stack-tags">
              {techStackInfo.frameworks.map(framework => (
                <span key={framework} className="tech-stack-tag">{framework}</span>
              ))}
            </div>
          </div>
        )}
        
        {techStackInfo.libraries.length > 0 && (
          <div className="tech-stack-section">
            <h4>库</h4>
            <div className="tech-stack-tags">
              {techStackInfo.libraries.map(lib => (
                <span key={lib} className="tech-stack-tag">{lib}</span>
              ))}
            </div>
          </div>
        )}
        
        {techStackInfo.tools.length > 0 && (
          <div className="tech-stack-section">
            <h4>工具</h4>
            <div className="tech-stack-tags">
              {techStackInfo.tools.map(tool => (
                <span key={tool} className="tech-stack-tag">{tool}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className="tech-stack-actions">
          <p>推荐模板: <strong>{ruleTemplates.find(t => t.id === getRecommendedTemplate())?.name}</strong></p>
          <button 
            className="config-button"
            onClick={applyRecommendedTemplate}
          >
            应用推荐模板
          </button>
          <button 
            className="config-button secondary"
            onClick={handleDetectTechStack}
          >
            重新检测
          </button>
        </div>
      </div>
    );
  };
  
  // 获取当前模板信息
  const currentTemplate = ruleTemplates[selectedTemplateIndex as number];
  
  return (
    <div className="config-panel">
      <h1 className="config-title">Cursor Rules助手</h1>
      <div className="config-description">
        配置Cursor Rules以增强AI编程体验。Cursor Rules帮助AI理解项目的特定需求和约束。
      </div>
      
      <h2 className="config-subtitle">常规设置</h2>
      <div className="config-section">
        {config.map(renderConfigItem)}
      </div>
      
      <h2 className="config-subtitle">项目技术栈</h2>
      <div className="config-section">
        {renderTechStackInfo()}
      </div>
      
      <h2 className="config-subtitle">模板预览</h2>
      <div className="config-section">
        {currentTemplate && (
          <>
            <div className="template-header">
              <h3 className="template-name">{currentTemplate.name}</h3>
              <p className="template-description">{currentTemplate.description}</p>
            </div>
            <pre className="template-content">{previewContent}</pre>
            <div className="template-actions">
              <button 
                className="config-button"
                onClick={handleCreateTemplate}
              >
                创建此模板
              </button>
            </div>
          </>
        )}
      </div>
      
      <h2 className="config-subtitle">关于Cursor Rules</h2>
      <div className="config-section info-section">
        <p>
          Cursor Rules允许您为项目定义代码规范、限制和最佳实践，帮助AI更好地理解您的项目需求。
        </p>
        <ul className="info-list">
          <li>规则存储在 <code>.cursor/rules</code> 目录下的MDC文件中</li>
          <li>您可以使用通配符 <code>globs</code> 为特定文件类型定义规则</li>
          <li>通过良好的Cursor Rules可以提高AI生成代码的质量和一致性</li>
        </ul>
      </div>
      
      <div className="config-footer">
        <button
          className="config-button secondary"
          onClick={() => vscode.postMessage({ type: 'resetConfig' })}
        >
          重置为默认值
        </button>
      </div>
    </div>
  );
}; 