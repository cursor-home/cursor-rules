/**
 * configPanel/pages/PluginSettingsPage.tsx
 * 
 * 插件设置页面组件，用于管理Cursor Rules Assistant特有的配置项
 */
import * as React from 'react';
import { PluginSettingsPageProps, ConfigItem } from '../types';
import { ConfigInputItem } from '../components/ConfigInputItem';
import '../styles/Pages.css';

/**
 * 插件设置页面组件
 */
export const PluginSettingsPage: React.FC<PluginSettingsPageProps> = ({ 
  config,
  handleConfigChange
}) => {
  // 过滤出旧版规则转换相关设置
  const legacyRulesConfig = config.filter(item => 
    item.id.includes('autoConvertLegacyRules') || 
    item.id.includes('dontAskForConversion')
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>插件设置</h2>
        <p className="page-description">
          管理Cursor Rules Assistant扩展的高级设置，包括旧版规则转换功能。
        </p>
      </div>

      <div className="settings-section">
        <h3>旧版规则兼容性</h3>
        <p className="section-description">
          配置如何处理旧版Cursor Rules（不带globs的规则）。
        </p>
        
        <div className="settings-group">
          {legacyRulesConfig.map(item => (
            <ConfigInputItem
              key={item.id}
              config={item}
              onChange={value => handleConfigChange(item.id, value)}
            />
          ))}
        </div>
        
        <div className="info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <p><strong>自动转换模式：</strong>遇到旧版规则时会自动转换为新格式，不会弹出提示。</p>
            <p><strong>不再询问：</strong>禁用转换提示，但不自动转换。遇到旧规则时会忽略处理。</p>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>GitHub设置</h3>
        <p className="section-description">
          Cursor Rules Assistant与GitHub相关的配置项。
        </p>
        
        <div className="github-info-panel">
          <div className="github-header">
            <div className="github-project">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              <a 
                href="https://github.com/CC11001100/cursor-rules" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                CC11001100/cursor-rules
              </a>
            </div>
            <a 
              className="github-star-link" 
              href="https://github.com/CC11001100/cursor-rules/stargazers" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              ⭐ Star
            </a>
          </div>
          
          <div className="github-description">
            <p>
              Cursor Rules Assistant是一个开源项目，您可以通过GitHub了解更多信息、反馈问题或贡献代码。
            </p>
            <div className="github-links">
              <a 
                href="https://github.com/CC11001100/cursor-rules/issues/new" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                报告问题
              </a>
              <a 
                href="https://github.com/CC11001100/cursor-rules#readme" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                查看文档
              </a>
              <a 
                href="https://github.com/CC11001100/cursor-rules/releases" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                查看更新日志
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 