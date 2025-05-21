/**
 * configPanel/index.tsx
 * 
 * Configuration panel main component, integrating navigation and page system
 */
import * as React from 'react';
import { VSCodeAPI, ConfigPanelProps } from './types';
import { useConfig } from './hooks/useConfig';
import { useNavigation } from './hooks/useNavigation';
import { NavigationBar } from './components/NavigationBar';
import { GeneralSettingsPage } from './pages/GeneralSettingsPage';
import { RuleListPage } from './pages/RuleListPage';
import { PluginSettingsPage } from './pages/PluginSettingsPage';
import { AddRulePage } from './pages/AddRulePage';
import { RuleDetailPage } from './pages/RuleDetailPage';
import './styles/ConfigPanel.css';

/**
 * Configuration panel main component
 */
export const ConfigPanel: React.FC<ConfigPanelProps> = ({ vscode }) => {
  // Use configuration Hook
  const {
    config,
    selectedTemplateIndex,
    previewContent,
    handleConfigChange,
    handleCreateTemplate
  } = useConfig(vscode);

  // Use navigation Hook
  const { activePageId, setActivePage, navItems } = useNavigation();
  
  // State for storing the current rule ID when viewing rule details
  const [currentRuleId, setCurrentRuleId] = React.useState<string | undefined>(undefined);

  // 调试当前状态
  React.useEffect(() => {
    console.log('当前页面:', activePageId, '当前规则ID:', currentRuleId);
  }, [activePageId, currentRuleId]);

  // Listen for navigation messages
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      console.log('收到消息:', message);
      
      if (message.type === 'navigateTo' && message.page) {
        console.log('处理导航消息, 页面:', message.page);
        
        // If navigating to ruleDetail, store the rule ID
        if (message.page === 'ruleDetail' && message.ruleId) {
          console.log('设置当前规则ID:', message.ruleId);
          setCurrentRuleId(message.ruleId);
        }
        
        console.log('设置当前页面为:', message.page);
        setActivePage(message.page);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setActivePage]);

  // Render corresponding page based on active page ID
  const renderActivePage = () => {
    console.log('渲染页面, activePageId:', activePageId, 'ruleId:', currentRuleId);
    
    switch (activePageId) {
      case 'general':
        return (
          <GeneralSettingsPage
            config={config}
            selectedTemplateIndex={selectedTemplateIndex}
            previewContent={previewContent}
            handleConfigChange={handleConfigChange}
            handleCreateTemplate={handleCreateTemplate}
          />
        );
      case 'rules':
        return <RuleListPage vscode={vscode} />;
      case 'plugin':
        return (
          <PluginSettingsPage
            config={config}
            handleConfigChange={handleConfigChange}
          />
        );
      case 'addRule':
        return <AddRulePage vscode={vscode} />;
      case 'ruleDetail':
        console.log('渲染规则详情页, ruleId:', currentRuleId);
        return <RuleDetailPage vscode={vscode} ruleId={currentRuleId} />;
      default:
        return (
          <GeneralSettingsPage
            config={config}
            selectedTemplateIndex={selectedTemplateIndex}
            previewContent={previewContent}
            handleConfigChange={handleConfigChange}
            handleCreateTemplate={handleCreateTemplate}
          />
        );
    }
  };

  return (
    <div className="config-panel">
      <NavigationBar
        navItems={navItems}
        activePageId={activePageId}
        setActivePage={setActivePage}
      />
      <div className="config-content">
        {renderActivePage()}
      </div>
    </div>
  );
}; 