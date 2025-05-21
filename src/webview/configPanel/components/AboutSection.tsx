/**
 * configPanel/components/AboutSection.tsx
 * 
 * 关于部分组件，显示Cursor Rules的相关信息
 */
import * as React from 'react';
import { AboutSectionProps } from '../types';
import '../styles/AboutSection.css';

/**
 * 关于部分组件
 */
export const AboutSection: React.FC<AboutSectionProps> = () => {
  return (
    <div className="about-section-container">
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
    </div>
  );
}; 