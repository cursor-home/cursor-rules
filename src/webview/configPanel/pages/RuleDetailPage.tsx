/**
 * configPanel/pages/RuleDetailPage.tsx
 * 
 * Rule detail page component for displaying and editing specific rule information
 */
import * as React from 'react';
import { Rule, RuleSource } from '../../../types';
import '../styles/RuleDetail.css';

export interface RuleDetailPageProps {
  vscode: any;
  ruleId?: string;
}

export const RuleDetailPage: React.FC<RuleDetailPageProps> = ({ vscode, ruleId }) => {
  const [rule, setRule] = React.useState<Rule | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // 调试组件挂载和props
  React.useEffect(() => {
    console.log('[DEBUG RuleDetailPage] 组件挂载或更新 - ruleId:', ruleId);
  }, []);

  // 调试ruleId变化
  React.useEffect(() => {
    console.log('[DEBUG RuleDetailPage] ruleId变更为:', ruleId);
  }, [ruleId]);

  // Fetch rule details when component mounts or ruleId changes
  React.useEffect(() => {
    if (!ruleId) {
      console.log('[DEBUG RuleDetailPage] 没有提供ruleId');
      setError('No rule ID provided');
      setLoading(false);
      return;
    }

    console.log(`[DEBUG RuleDetailPage] 请求规则详情: ${ruleId}`);
    
    setLoading(true);
    setError(null);
    
    vscode.postMessage({
      type: 'getRuleDetail',
      ruleId
    });
    console.log(`[DEBUG RuleDetailPage] 已发送getRuleDetail消息, ruleId: ${ruleId}`);
    
  }, [ruleId, vscode]);

  // Add message handler for rule detail response - 使用与useRuleList相同的监听方式
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[DEBUG RuleDetailPage] 收到消息:', JSON.stringify(message));
      
      // Handle rule detail response
      if (message.type === 'ruleDetail') {
        console.log('[DEBUG RuleDetailPage] 收到ruleDetail消息:', JSON.stringify(message));
        setLoading(false);
        
        if (message.success) {
          console.log('[DEBUG RuleDetailPage] 规则详情接收成功:', message.rule?.name);
          setRule(message.rule);
          setError(null);
        } else {
          console.log('[DEBUG RuleDetailPage] 获取规则详情错误:', message.error);
          setRule(null);
          setError(message.error || 'Failed to load rule details');
        }
      }
    };
    
    console.log('[DEBUG RuleDetailPage] 添加消息监听器');
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      console.log('[DEBUG RuleDetailPage] 清理消息监听器');
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Handle edit button click
  const handleEdit = () => {
    if (!rule) return;
    
    vscode.postMessage({
      type: 'editRule',
      rule: rule
    });
  };

  // Handle delete button click
  const handleDelete = () => {
    if (!rule) return;
    
    if (window.confirm(`确定要删除规则 "${rule.name}" 吗？此操作不可撤销。`)) {
      vscode.postMessage({
        type: 'deleteRule',
        ruleId: rule.id
      });
    }
  };

  // Handle go back button click
  const handleGoBack = () => {
    vscode.postMessage({
      type: 'navigateTo',
      page: 'rules'
    });
  };

  // Handle open file button click
  const handleOpenFile = () => {
    if (!rule?.filePath) return;
    
    vscode.postMessage({
      type: 'openRule',
      path: rule.filePath
    });
  };

  // Format last updated date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render badge based on rule source
  const renderSourceBadge = () => {
    if (!rule?.source) return null;
    
    const getBadgeClass = () => {
      if (rule.source === RuleSource.BuiltIn) {
        return 'badge-builtin';
      } else if (rule.source === RuleSource.Custom) {
        return 'badge-custom';
      }
      return 'badge-local';
    };

    return (
      <div className={`rule-detail-badge ${getBadgeClass()}`}>
        {rule.source}
      </div>
    );
  };

  // Render tech stack information
  const renderTechStack = () => {
    if (!rule?.techStack) return null;
    
    const { languages = [], frameworks = [], libraries = [], tools = [] } = rule.techStack;
    
    if (!languages.length && !frameworks.length && !libraries.length && !tools.length) {
      return null;
    }
    
    return (
      <div className="rule-detail-tech-stack">
        <h3>适用技术栈</h3>
        
        {languages.length > 0 && (
          <div className="tech-stack-section">
            <h4>语言</h4>
            <div className="tech-stack-tags">
              {languages.map((lang, index) => (
                <span key={`lang-${index}`} className="tech-tag lang-tag">{lang}</span>
              ))}
            </div>
          </div>
        )}
        
        {frameworks.length > 0 && (
          <div className="tech-stack-section">
            <h4>框架</h4>
            <div className="tech-stack-tags">
              {frameworks.map((framework, index) => (
                <span key={`framework-${index}`} className="tech-tag framework-tag">{framework}</span>
              ))}
            </div>
          </div>
        )}
        
        {libraries.length > 0 && (
          <div className="tech-stack-section">
            <h4>库</h4>
            <div className="tech-stack-tags">
              {libraries.map((lib, index) => (
                <span key={`lib-${index}`} className="tech-tag lib-tag">{lib}</span>
              ))}
            </div>
          </div>
        )}
        
        {tools.length > 0 && (
          <div className="tech-stack-section">
            <h4>工具</h4>
            <div className="tech-stack-tags">
              {tools.map((tool, index) => (
                <span key={`tool-${index}`} className="tech-tag tool-tag">{tool}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render content preview
  const renderContentPreview = () => {
    if (!rule?.content) return null;
    
    return (
      <div className="rule-content-preview">
        <h3>规则内容预览</h3>
        <pre className="content-preview-box">{rule.content.substring(0, 500)}
          {rule.content.length > 500 ? '...' : ''}
        </pre>
      </div>
    );
  };

  return (
    <div className="page-content rule-detail-page">
      <div className="rule-detail-header">
        <button className="back-button" onClick={handleGoBack} title="返回规则列表">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
          返回列表
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <div>加载规则详情...</div>
        </div>
      ) : error ? (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div>
            <div className="error-title">加载失败</div>
            <div className="error-detail">{error}</div>
          </div>
        </div>
      ) : rule ? (
        <div className="rule-detail-content">
          <div className="rule-detail-main">
            <div className="rule-detail-title-section">
              <h2 className="rule-detail-title">{rule.name || 'Unnamed Rule'}</h2>
              {renderSourceBadge()}
            </div>
            
            {rule.description && (
              <div className="rule-detail-description">
                <p>{rule.description}</p>
              </div>
            )}
            
            <div className="rule-detail-metadata">
              <div className="metadata-item">
                <span className="metadata-label">ID:</span>
                <span className="metadata-value">{rule.id}</span>
              </div>
              
              {rule.filePath && (
                <div className="metadata-item">
                  <span className="metadata-label">文件路径:</span>
                  <span className="metadata-value path-value">
                    {rule.filePath}
                    <button 
                      className="icon-button" 
                      onClick={handleOpenFile}
                      title="在编辑器中打开"
                    >
                      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                        <path fillRule="evenodd" d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 0 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                      </svg>
                    </button>
                  </span>
                </div>
              )}
              
              {rule.lastUpdated && (
                <div className="metadata-item">
                  <span className="metadata-label">上次更新:</span>
                  <span className="metadata-value">{formatDate(rule.lastUpdated)}</span>
                </div>
              )}
            </div>
            
            {renderTechStack()}
            {renderContentPreview()}
            
            <div className="rule-detail-actions">
              {(rule.source === RuleSource.Custom || rule.source === RuleSource.Local) && (
                <>
                  <button 
                    className="action-button edit-button" 
                    onClick={handleEdit}
                    disabled={false}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                    编辑规则
                  </button>
                  <button 
                    className="action-button delete-button" 
                    onClick={handleDelete}
                    disabled={false}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                    </svg>
                    删除规则
                  </button>
                </>
              )}
              
              {rule.source === RuleSource.BuiltIn && (
                <div className="builtin-notice">
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                  内置规则不可编辑或删除
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">
            <div className="empty-title">规则不存在</div>
            <div className="empty-description">
              找不到指定的规则。
              <br />
              请返回规则列表查看可用规则。
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 