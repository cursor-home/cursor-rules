/**
 * configPanel/components/GeneralSettings.tsx
 * 
 * 常规设置组件，用于显示和编辑基本配置项
 */
import * as React from 'react';
import { GeneralSettingsProps } from '../types';
import { ConfigInputItem } from './ConfigInputItem';
import '../styles/GeneralSettings.css';

/**
 * 常规设置组件
 */
export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  config, 
  onConfigChange,
  ruleTemplates
}) => {
  return (
    <div className="settings-container">
      <h2 className="config-subtitle">常规设置</h2>
      <div className="config-section">
        {config.map((item) => (
          <ConfigInputItem 
            key={item.id}
            config={item}
            onChange={(value) => onConfigChange(item.id, value)}
          />
        ))}
      </div>
    </div>
  );
}; 