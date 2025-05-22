/**
 * configPanel/index.tsx
 * 
 * Configuration panel main component, integrating navigation and page system
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { VSCodeAPI, ConfigPanelProps } from './types';
import { useConfig } from './hooks/useConfig';
import { useNavigation } from './hooks/useNavigation';
import { useRuleList } from './hooks/useRuleList';
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
  const { activePageId, setActivePage, navItems } = useNavigation('rules');
  
  console.log('[DEBUG ConfigPanel] 渲染ConfigPanel，当前页面:', activePageId);
  
  // Rule列表状态
  const { rules, loading, error, refreshRules } = useRuleList(vscode);
  
  // 当前选中的rule
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(null);
  
  console.log('[DEBUG ConfigPanel] 当前RuleID:', currentRuleId);
  
  // 监听消息
  useEffect(() => {
    // 初始检查URL参数，支持直接打开指定规则
    try {
      // 解析URL中的参数
      const urlParams = new URLSearchParams(window.location.search);
      const ruleId = urlParams.get('ruleId');
      
      // 如果URL中包含规则ID，直接导航到规则详情
      if (ruleId) {
        console.log(`[DEBUG ConfigPanel] 从URL参数中检测到规则ID: ${ruleId}，直接导航到规则详情页`);
        setCurrentRuleId(ruleId);
        setActivePage('ruleDetail');
      }
    } catch (err) {
      console.error('[DEBUG ConfigPanel] 处理URL参数时出错:', err);
    }
    
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[DEBUG ConfigPanel] 收到消息:', message);
      
      // 处理导航消息
      if (message.type === 'navigateTo') {
        console.log('[DEBUG ConfigPanel] 处理导航消息，目标页面:', message.pageId);
        setActivePage(message.pageId);
        
        // 如果是导航到规则详情，设置当前规则ID
        if (message.pageId === 'ruleDetail' && message.ruleId) {
          console.log('[DEBUG ConfigPanel] 设置当前规则ID:', message.ruleId);
          setCurrentRuleId(message.ruleId);
        }
      }
      
      // 处理刷新规则列表消息
      if (message.type === 'refreshRules') {
        console.log('[DEBUG ConfigPanel] 刷新规则列表');
        refreshRules();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [setActivePage, refreshRules]);

  // 临时解决方案：添加单击处理函数，在不通过消息传递的情况下导航到规则详情
  const handleRuleCardClick = (ruleId: string) => {
    console.log(`[DEBUG ConfigPanel] 处理规则卡片直接点击, ruleId: ${ruleId}`);
    setCurrentRuleId(ruleId);
    setActivePage('ruleDetail');
  };

  // Render corresponding page based on active page ID
  const renderActivePage = () => {
    console.log('[DEBUG ConfigPanel] 渲染页面:', activePageId, '当前规则ID:', currentRuleId);
    
    switch (activePageId) {
      case 'general':
        console.log('[DEBUG ConfigPanel] 渲染通用设置页面');
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
        console.log('[DEBUG ConfigPanel] 渲染规则列表页面');
        return <RuleListPage 
          vscode={vscode}
          onRuleCardClick={handleRuleCardClick} // 传递直接点击处理函数
        />;
      case 'plugin':
        console.log('[DEBUG ConfigPanel] 渲染插件设置页面');
        return (
          <PluginSettingsPage
            config={config}
            handleConfigChange={handleConfigChange}
          />
        );
      case 'addRule':
        console.log('[DEBUG ConfigPanel] 渲染添加规则页面');
        return <AddRulePage vscode={vscode} />;
      case 'ruleDetail':
        if (currentRuleId) {
          console.log('[DEBUG ConfigPanel] 渲染规则详情页，规则ID:', currentRuleId);
          const currentRule = rules.find((r) => r.id === currentRuleId);
          console.log('[DEBUG ConfigPanel] 找到的规则:', currentRule);
          if (currentRule) {
            console.log('[DEBUG ConfigPanel] 规则内容长度:', currentRule.content?.length || 0);
            console.log('[DEBUG ConfigPanel] 规则内容前100个字符:', currentRule.content?.substring(0, 100) || 'No content');
          } else {
            console.log('[DEBUG ConfigPanel] 未找到规则对象，可能需要通过getRuleDetail请求');
          }
          return <RuleDetailPage 
            vscode={vscode}
            ruleId={currentRuleId}
            rule={currentRule}
          />;
        } else {
          console.warn('[DEBUG ConfigPanel] 尝试渲染规则详情页，但规则ID为空');
          setActivePage('rules');
          return <RuleListPage 
            vscode={vscode}
            onRuleCardClick={handleRuleCardClick} // 传递直接点击处理函数
          />;
        }
      default:
        console.warn('[DEBUG ConfigPanel] 未知页面ID:', activePageId);
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