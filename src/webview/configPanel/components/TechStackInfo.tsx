/**
 * configPanel/components/TechStackInfo.tsx
 * 
 * 技术栈信息组件，用于显示技术栈信息和处理技术栈检测
 */
import * as React from 'react';
import { TechStackInfoProps } from '../types';
import '../styles/TechStackInfo.css';

/**
 * 技术栈信息组件
 */
export const TechStackInfo: React.FC<TechStackInfoProps> = ({ 
  techStackInfo,
  detecting,
  onDetect,
  onApplyRecommendedTemplate,
  getRecommendedTemplate,
  ruleTemplates
}) => {
  if (detecting) {
    return (
      <div className="tech-stack-container">
        <h2 className="config-subtitle">项目技术栈</h2>
        <div className="config-section">
          <div className="tech-stack-loading">
            <p>正在检测项目技术栈，请稍候...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!techStackInfo) {
    return (
      <div className="tech-stack-container">
        <h2 className="config-subtitle">项目技术栈</h2>
        <div className="config-section">
          <div className="tech-stack-empty">
            <p>点击"检测技术栈"按钮分析当前项目。</p>
            <button 
              className="config-button"
              onClick={onDetect}
            >
              检测技术栈
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tech-stack-container">
      <h2 className="config-subtitle">项目技术栈</h2>
      <div className="config-section">
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
          
          {techStackInfo.libraries && techStackInfo.libraries.length > 0 && (
            <div className="tech-stack-section">
              <h4>库</h4>
              <div className="tech-stack-tags">
                {techStackInfo.libraries.map(lib => (
                  <span key={lib} className="tech-stack-tag">{lib}</span>
                ))}
              </div>
            </div>
          )}
          
          {techStackInfo.tools && techStackInfo.tools.length > 0 && (
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
              onClick={onApplyRecommendedTemplate}
            >
              应用推荐模板
            </button>
            <button 
              className="config-button secondary"
              onClick={onDetect}
            >
              重新检测
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 