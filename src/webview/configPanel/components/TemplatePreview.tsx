/**
 * configPanel/components/TemplatePreview.tsx
 * 
 * 模板预览组件，用于显示模板预览和创建模板
 */
import * as React from 'react';
import { TemplatePreviewProps } from '../types';
import '../styles/TemplatePreview.css';

/**
 * 模板预览组件
 */
export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  currentTemplate,
  previewContent,
  onCreateTemplate
}) => {
  if (!currentTemplate) {
    return null;
  }
  
  return (
    <div className="template-preview-container">
      <h2 className="config-subtitle">模板预览</h2>
      <div className="config-section">
        <div className="template-header">
          <h3 className="template-name">{currentTemplate.name}</h3>
          <p className="template-description">{currentTemplate.description}</p>
        </div>
        <pre className="template-content">{previewContent}</pre>
        <div className="template-actions">
          <button 
            className="config-button"
            onClick={onCreateTemplate}
          >
            创建此模板
          </button>
        </div>
      </div>
    </div>
  );
}; 