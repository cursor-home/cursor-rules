/**
 * configPanel/components/ConfigInputItem.tsx
 * 
 * 配置输入项组件，用于处理不同类型的配置输入
 */
import * as React from 'react';
import { ConfigItem, ConfigInputItemProps } from '../types';

/**
 * 配置输入项组件
 */
export const ConfigInputItem: React.FC<ConfigInputItemProps> = ({ 
  config, 
  onChange 
}) => {
  // 根据配置项类型渲染不同的输入控件
  switch (config.type) {
    case 'boolean':
      return (
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-label">{config.label}</div>
          </div>
          <div className="config-item-content">
            <label className="switch">
              <input
                type="checkbox"
                checked={Boolean(config.value)}
                onChange={e => onChange(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      );
      
    case 'number':
      return (
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-label">{config.label}</div>
          </div>
          <div className="config-item-content">
            <input
              type="number"
              value={String(config.value)}
              onChange={e => onChange(Number(e.target.value))}
              className="number-input"
            />
          </div>
        </div>
      );
      
    case 'select':
      return (
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-label">{config.label}</div>
          </div>
          <div className="config-item-content">
            <select
              value={String(config.value)}
              onChange={e => onChange(e.target.value)}
              className="select-input"
            >
              {config.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
      
    case 'string':
    default:
      return (
        <div className="config-item">
          <div className="config-item-header">
            <div className="config-item-label">{config.label}</div>
          </div>
          <div className="config-item-content">
            <input
              type="text"
              value={String(config.value)}
              onChange={e => onChange(e.target.value)}
              className="text-input"
            />
          </div>
        </div>
      );
  }
}; 