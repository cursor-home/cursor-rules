/**
 * configPanel/pages/GeneralSettingsPage.tsx
 * 
 * 通用设置页面组件，用于显示并管理常规配置项
 */
import * as React from 'react';
import { GeneralSettingsPageProps, ConfigItem } from '../types';
import { ConfigInputItem } from '../components/ConfigInputItem';
import { ruleTemplates } from '../constants';
import '../styles/Pages.css';

/**
 * 通用设置页面组件
 */
export const GeneralSettingsPage: React.FC<GeneralSettingsPageProps> = ({ 
  config, 
  selectedTemplateIndex, 
  previewContent, 
  handleConfigChange, 
  handleCreateTemplate 
}) => {
  const [showPreview, setShowPreview] = React.useState(false);

  // 默认模板选择项
  const defaultTemplateItem = config.find(item => item.id === 'defaultTemplate');
  
  // 过滤出不属于特殊设置的常规配置项（不包括旧版规则转换相关设置）
  const generalConfigItems = config.filter(item => 
    !item.id.includes('autoConvertLegacyRules') && 
    !item.id.includes('dontAskForConversion')
  );

  // 切换预览显示
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>通用设置</h2>
        <p className="page-description">
          配置 Cursor Rules Assistant 的基本行为，包括模板选择和自动检查设置。
        </p>
      </div>

      <div className="settings-section">
        <div className="settings-group">
          {generalConfigItems.map(item => (
            <ConfigInputItem
              key={item.id}
              config={item}
              onChange={value => handleConfigChange(item.id, value)}
            />
          ))}
        </div>
      </div>

      {defaultTemplateItem && (
        <div className="settings-section">
          <h3>默认模板</h3>
          <p className="section-description">
            选择创建新规则时使用的默认模板。
          </p>
          
          <div className="template-section">
            <div className="template-select">
              <label htmlFor="templateSelect">选择模板:</label>
              <select
                id="templateSelect"
                value={selectedTemplateIndex !== null ? ruleTemplates[selectedTemplateIndex].id : ''}
                onChange={e => {
                  const templateId = e.target.value;
                  handleConfigChange(
                    'defaultTemplate',
                    templateId
                  );
                }}
              >
                {ruleTemplates.map((template, index) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              <div className="template-description">
                {selectedTemplateIndex !== null && ruleTemplates[selectedTemplateIndex].description}
              </div>
            </div>
            
            <div className="template-actions">
              <button 
                className="config-button preview-button" 
                onClick={togglePreview}
              >
                {showPreview ? '隐藏预览' : '显示预览'}
              </button>
              
              <button 
                className="config-button create-button" 
                onClick={handleCreateTemplate}
              >
                创建此模板
              </button>
            </div>
            
            {showPreview && (
              <div className="template-preview">
                <h4>模板预览</h4>
                <pre>{previewContent}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 