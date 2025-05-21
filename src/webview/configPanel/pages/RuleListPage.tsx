/**
 * configPanel/pages/RuleListPage.tsx
 * 
 * Rule list page component for displaying all Cursor Rules in the current project
 */
import * as React from 'react';
import { RuleListPageProps } from '../types';
import { useRuleList } from '../hooks/useRuleList';
import { Rule, RuleSource } from '../../../types';
import '../styles/Pages.css';

/**
 * Rule card component
 */
const RuleCard: React.FC<{rule: Rule, vscode: any}> = ({ rule, vscode }) => {
  const handleClick = () => {
    // 使用props传入的vscode实例而非window.vscode
    console.log('规则卡片点击 - 发送导航消息:', rule.id);
    
    vscode.postMessage({
      type: 'navigateTo',
      page: 'ruleDetail',
      ruleId: rule.id
    });
    
    console.log('消息已发送，rule.id:', rule.id);
  };

  // 添加打开文件按钮的处理函数
  const handleOpenFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到卡片的点击事件
    
    console.log('打开文件按钮点击 - 文件路径:', rule.filePath);
    
    // 使用props传入的vscode实例而非window.vscode
    if (rule.filePath) {
      vscode.postMessage({
        type: 'openRule',
        path: rule.filePath
      });
    }
  };

  // Determine badge type based on rule source
  const getBadgeClass = () => {
    if (rule.source === RuleSource.BuiltIn) {
      return 'badge-builtin';
    } else if (rule.source === RuleSource.Custom) {
      return 'badge-custom';
    }
    return 'badge-local';
  };

  return (
    <div className="rule-card" onClick={handleClick}>
      <div className="rule-card-header">
        <div className="rule-name">{rule.name || 'Unnamed Rule'}</div>
        {rule.source && (
          <div className={`rule-badge ${getBadgeClass()}`}>
            {rule.source}
          </div>
        )}
      </div>
      {rule.description && (
        <div className="rule-description">{rule.description}</div>
      )}
      <div className="rule-path">
        {rule.filePath || 'No path information'}
        {rule.filePath && (
          <button 
            className="open-file-button" 
            onClick={handleOpenFile}
            title="在编辑器中打开"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path fillRule="evenodd" d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 0 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Rule list page component
 */
export const RuleListPage: React.FC<RuleListPageProps> = ({ vscode }) => {
  // Use rule list Hook
  const { rules, loading, error, refreshRules } = useRuleList(vscode);

  // Handle add rule button click
  const handleAddRule = () => {
    // 使用props中的vscode实例而非window.vscode
    vscode.postMessage({
      type: 'navigateTo',
      page: 'addRule'
    });
  };

  return (
    <div className="page-content">
      <div className="page-header with-actions">
        <div>
          <h2>Project Rules List</h2>
          <p className="page-description">
            View and manage all Cursor Rules in the current project. Click on a rule card to open and edit the rule file.
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="add-button"
            onClick={handleAddRule}
            title="Add New Rule"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            Add Rule
          </button>
          <button 
            className="refresh-button"
            onClick={() => refreshRules()}
            title="Refresh Rules List"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="rule-list">
        {loading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>Loading rules list...</div>
          </div>
        ) : error ? (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <div>
              <div className="error-title">Loading Failed</div>
              <div className="error-detail">{error}</div>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">
              <div className="empty-title">No Rules Found</div>
              <div className="empty-description">
                There are no Cursor Rules in the current project.
                <br />
                You can create a new rule using the "Add Rule" button above.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rule-count">{rules.length} rules</div>
            <div className="rule-grid">
              {rules.map((rule, index) => (
                <RuleCard key={`rule-${index}`} rule={rule} vscode={vscode} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 