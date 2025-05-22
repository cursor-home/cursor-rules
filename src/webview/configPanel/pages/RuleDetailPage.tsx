/**
 * configPanel/pages/RuleDetailPage.tsx
 * 
 * Rule detail page component for displaying and editing rule information
 */
import * as React from 'react';
import { Rule, RuleSource } from '../../../types';
import '../styles/RuleDetail.css';

// 添加RuleFile接口定义
interface RuleFile {
  path: string;
  content: string;
  name: string;
  description?: string;
}

export interface RuleDetailPageProps {
  vscode: any;
  ruleId?: string;
  rule?: Rule | null; // 可选的预加载规则对象
}

export const RuleDetailPage: React.FC<RuleDetailPageProps> = ({ vscode, ruleId, rule: initialRule }) => {
  const [rule, setRule] = React.useState<Rule | null>(initialRule || null);
  const [loading, setLoading] = React.useState<boolean>(!initialRule);
  const [error, setError] = React.useState<string | null>(null);
  const [requestSent, setRequestSent] = React.useState<boolean>(false); // 跟踪是否已发送请求
  
  // 添加规则文件状态
  const [ruleFiles, setRuleFiles] = React.useState<RuleFile[]>([]);
  const [loadingFiles, setLoadingFiles] = React.useState<boolean>(false);
  const [selectedFileIndex, setSelectedFileIndex] = React.useState<number>(0);
  // 添加加载时间状态
  const [loadingTime, setLoadingTime] = React.useState<number>(0);
  
  // 辅助函数：获取文件名（替代path.basename）
  const getFileName = (filePath: string): string => {
    if (!filePath) return '';
    const parts = filePath.split('/');
    return parts[parts.length - 1] || '';
  };

  // 调试组件挂载和props
  React.useEffect(() => {
    console.log('[DEBUG RuleDetailPage] 组件挂载或更新 - ruleId:', ruleId, 'vscode对象存在:', !!vscode);
    console.log('[DEBUG RuleDetailPage] 初始规则对象:', initialRule);
    if (vscode) {
      console.log('[DEBUG RuleDetailPage] vscode对象类型:', typeof vscode, 'postMessage方法存在:', !!vscode.postMessage);
    }
    if (initialRule) {
      console.log('[DEBUG RuleDetailPage] 使用从父组件传入的规则对象，跳过加载');
    }
  }, []);

  // 如果有initialRule，直接使用
  React.useEffect(() => {
    if (initialRule) {
      console.log('[DEBUG RuleDetailPage] 使用预加载的规则对象:', initialRule.id);
      setRule(initialRule);
      setLoading(false);
      setError(null);
    }
  }, [initialRule]);

  // 调试ruleId变化
  React.useEffect(() => {
    console.log('[DEBUG RuleDetailPage] ruleId变更为:', ruleId);
  }, [ruleId]);

  // Fetch rule details when component mounts or ruleId changes
  React.useEffect(() => {
    // 如果有初始规则数据或已发送请求，则无需再次请求
    if (initialRule || requestSent) {
      console.log('[DEBUG RuleDetailPage] 已有规则数据或已发送请求，跳过请求');
      return;
    }

    if (!ruleId) {
      console.log('[DEBUG RuleDetailPage] 没有提供ruleId');
      setError('No rule ID provided');
      setLoading(false);
      return;
    }

    if (!vscode) {
      console.error('[DEBUG RuleDetailPage] vscode对象不存在，无法发送消息');
      setError('VSCode API not available');
      setLoading(false);
      return;
    }

    console.log(`[DEBUG RuleDetailPage] 准备请求规则详情: ${ruleId} - vscode对象类型:`, typeof vscode, '方法:', Object.keys(vscode));
    
    try {
      setLoading(true);
      setError(null);
      setRequestSent(true); // 标记请求已发送
      
      console.log(`[DEBUG RuleDetailPage] 发送getRuleDetail消息...`);
      const message = {
        type: 'getRuleDetail',
        ruleId
      };
      console.log(`[DEBUG RuleDetailPage] 消息内容:`, JSON.stringify(message));
      
      // 设置超时，确保请求发送成功
      setTimeout(() => {
        vscode.postMessage(message);
        console.log(`[DEBUG RuleDetailPage] 已发送getRuleDetail消息, ruleId: ${ruleId}`);
      }, 100);
    } catch (err) {
      console.error(`[DEBUG RuleDetailPage] 发送消息时出错:`, err);
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
    
  }, [ruleId, vscode, initialRule, requestSent]);

  // Add message handler for rule detail response
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[DEBUG RuleDetailPage] 收到消息类型:', message.type, '完整消息:', JSON.stringify(message).substring(0, 200));
      
      // Handle rule detail response
      if (message.type === 'ruleDetail') {
        console.log('[DEBUG RuleDetailPage] 处理ruleDetail消息: 成功状态=', message.success);
        setLoading(false);
        
        if (message.success) {
          const receivedRule = message.rule;
          console.log('[DEBUG RuleDetailPage] 规则详情接收成功:', receivedRule?.name);
          console.log('[DEBUG RuleDetailPage] 规则内容接收成功，长度:', receivedRule?.content?.length || 0);
          console.log('[DEBUG RuleDetailPage] 规则内容片段:', receivedRule?.content?.substring(0, 100));
          setRule(receivedRule);
          setError(null);
        } else {
          console.error('[DEBUG RuleDetailPage] 获取规则详情错误:', message.error);
          setRule(null);
          setError(message.error || 'Failed to load rule details');
        }
      } else if (message.type === 'ruleDeleted') {
        console.log('[DEBUG RuleDetailPage] 收到规则删除消息:', message);
        // 规则已删除，返回列表页面
        handleGoBack();
      } else if (message.type === 'ruleFiles') {
        // 处理规则文件响应
        console.log('[DEBUG RuleDetailPage] 处理ruleFiles消息');
        console.log('[DEBUG RuleDetailPage] 文件数量:', message.files?.length || 0);
        
        // 停止加载状态
        setLoadingFiles(false);
        
        if (message.files && Array.isArray(message.files)) {
          const receivedFiles = message.files;
          
          // 详细日志每个文件信息
          console.log('[DEBUG RuleDetailPage] 收到规则文件列表:');
          receivedFiles.forEach((file: RuleFile, index: number) => {
            console.log(`[DEBUG RuleDetailPage] 文件[${index}]: ${file.name}, 路径: ${file.path}, 内容长度: ${file.content?.length || 0}`);
            // 如果内容为空，记录警告
            if (!file.content) {
              console.warn(`[DEBUG RuleDetailPage] 警告: 文件 ${file.name} 内容为空`);
            } else if (file.content.length < 10) {
              console.warn(`[DEBUG RuleDetailPage] 警告: 文件 ${file.name} 内容太短 (${file.content.length}字符): "${file.content}"`);
            }
          });
          
          if (receivedFiles.length > 0) {
            console.log('[DEBUG RuleDetailPage] 设置文件内容和选择第一个文件');
            setRuleFiles(receivedFiles);
            setSelectedFileIndex(0);
          } else {
            console.warn('[DEBUG RuleDetailPage] 警告: 收到的文件列表为空');
            setRuleFiles([]);
          }
        } else if (message.error) {
          console.error('[DEBUG RuleDetailPage] 获取规则文件错误:', message.error);
          setError(`获取规则文件失败: ${message.error}`);
        } else {
          console.warn('[DEBUG RuleDetailPage] 警告: 收到的ruleFiles消息格式不正确');
          console.warn('[DEBUG RuleDetailPage] 消息内容:', JSON.stringify(message));
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

  // 请求规则文件
  React.useEffect(() => {
    if (!ruleId || !vscode) return;
    
    // 只有在规则加载成功后才请求规则文件
    if (rule && rule.id) {
      console.log(`[DEBUG RuleDetailPage] 发送getRuleFiles消息，ruleId: ${ruleId}`);
      setLoadingFiles(true);
      setLoadingTime(0); // 重置加载时间
      
      try {
        vscode.postMessage({
          type: 'getRuleFiles',
          ruleId: ruleId
        });
        console.log(`[DEBUG RuleDetailPage] 已发送getRuleFiles消息`);
      } catch (err) {
        console.error(`[DEBUG RuleDetailPage] 发送getRuleFiles消息时出错:`, err);
        setLoadingFiles(false);
      }
    }
  }, [ruleId, vscode, rule]);

  // 加载时间计时器
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (loadingFiles) {
      // 启动计时器
      timer = setInterval(() => {
        setLoadingTime(prevTime => prevTime + 1);
      }, 1000);
      
      console.log('[DEBUG RuleDetailPage] 启动加载计时器');
    } else if (timer) {
      // 停止计时器并重置时间
      clearInterval(timer);
      setLoadingTime(0);
      console.log('[DEBUG RuleDetailPage] 停止加载计时器');
    }
    
    // 清理函数
    return () => {
      if (timer) {
        clearInterval(timer);
        console.log('[DEBUG RuleDetailPage] 清理加载计时器');
      }
    };
  }, [loadingFiles]);

  // Handle edit button click
  const handleEdit = () => {
    if (!rule) return;
    
    console.log('[DEBUG RuleDetailPage] 发送编辑规则消息:', rule.id);
    vscode.postMessage({
      type: 'editRule',
      rule: rule
    });
  };

  // Handle delete button click
  const handleDelete = () => {
    if (!rule) return;
    
    if (window.confirm(`确定要删除规则 "${rule.name}" 吗？此操作不可撤销。`)) {
      console.log('[DEBUG RuleDetailPage] 发送删除规则消息:', rule.id);
      vscode.postMessage({
        type: 'deleteRule',
        ruleId: rule.id
      });
    }
  };

  // Handle go back button click
  const handleGoBack = () => {
    console.log('[DEBUG RuleDetailPage] 返回规则列表页面');
    console.log('[DEBUG RuleDetailPage] 发送navigateTo消息返回');
    vscode.postMessage({
      type: 'navigateTo',
      pageId: 'rules'  // 使用pageId
    });
  };

  // Handle open file button click
  const handleOpenFile = () => {
    if (!rule?.filePath) return;
    
    console.log('[DEBUG RuleDetailPage] 发送打开规则文件消息:', rule.filePath);
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
    console.log(`[DEBUG RuleDetailPage] 渲染内容预览，ruleId: ${rule?.id}, 文件数: ${ruleFiles?.length || 0}`);
    
    // 添加调试信息
    let debugInfo = null;
    const showDebugInfo = true; // 始终显示调试信息，帮助排查问题
    if (showDebugInfo) {
        debugInfo = (
            <div className="debug-info">
                <details>
                    <summary>调试信息</summary>
                    <div className="debug-content">
                        <div>规则ID: {rule?.id}</div>
                        <div>文件列表: {ruleFiles?.map((f: any) => f.name).join(', ') || '无文件'}</div>
                        <div>文件数量: {ruleFiles?.length || 0}</div>
                        <div>正在加载: {loadingFiles ? '是' : '否'}</div>
                        {ruleFiles && ruleFiles.length > 0 && selectedFileIndex !== undefined && (
                            <>
                                <div>当前文件: {ruleFiles[selectedFileIndex]?.name || '未选择'}</div>
                                <div>当前文件路径: {ruleFiles[selectedFileIndex]?.path || '未知'}</div>
                                <div>内容长度: {ruleFiles[selectedFileIndex]?.content?.length || 0} 字符</div>
                                <div>内容前100字符: <pre>{ruleFiles[selectedFileIndex]?.content?.substring(0, 100) || ''}</pre></div>
                            </>
                        )}
                    </div>
                </details>
            </div>
        );
    }
    
    // 如果没有规则，显示提示信息
    if (!rule) {
        return (
            <>
                <div className="no-content">
                    请在左侧选择一条规则查看详情。
                </div>
                {debugInfo}
            </>
        );
    }
    
    // 如果正在加载文件，显示加载状态
    if (loadingFiles) {
        // 重新加载规则文件的函数
        const reloadRuleFiles = () => {
            if (rule && vscode) {
                console.log(`[DEBUG RuleDetailPage] 重新加载规则文件, ruleId: ${rule.id}`);
                setLoadingFiles(true);
                setLoadingTime(0);
                vscode.postMessage({
                    type: 'getRuleFiles',
                    ruleId: rule.id,
                    id: `reload-${Date.now()}` // 添加时间戳避免重复
                });
            }
        };
        
        return (
            <>
                <div className="loading-content">
                    <div className="spinner"></div>
                    <div className="loading-text">正在加载规则内容...</div>
                    {loadingTime > 3 && (
                        <div className="loading-status">
                            已加载 {loadingTime} 秒
                            {loadingTime > 10 && (
                                <button 
                                    className="reload-button" 
                                    onClick={reloadRuleFiles}
                                >
                                    重试
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {debugInfo}
            </>
        );
    }
    
    // 如果没有文件内容，显示错误信息
    if (!ruleFiles || ruleFiles.length === 0) {
        return (
            <>
                <div className="no-content">
                    无法加载规则内容，请检查规则文件是否存在。
                </div>
                {debugInfo}
            </>
        );
    }
    
    // 如果有多个文件，显示文件选择器
    let fileSelector = null;
    if (ruleFiles.length > 1) {
        fileSelector = (
            <div className="file-selector">
                <label>选择文件:</label>
                <select 
                    value={selectedFileIndex} 
                    onChange={(e) => setSelectedFileIndex(parseInt(e.target.value))}
                >
                    {ruleFiles.map((file, index) => (
                        <option key={index} value={index}>
                            {file.name} {file.content ? `(${file.content.length} 字符)` : ''}
                        </option>
                    ))}
                </select>
            </div>
        );
    }
    
    // 获取当前选中的文件
    const selectedFile = ruleFiles[selectedFileIndex !== undefined ? selectedFileIndex : 0];
    
    // 检查是否有内容
    if (!selectedFile || !selectedFile.content) {
        return (
            <>
                <div className="no-content">
                    选中的文件没有内容。
                </div>
                {fileSelector}
                {debugInfo}
            </>
        );
    }
    
    // 创建内容类名 - 用于应用样式
    const contentClassName = selectedFile.content.length > 500 ? "content-preview-box full-content" : "content-preview-box";
    
    // 日志一下内容长度
    console.log(`[DEBUG RuleDetailPage] 渲染内容，长度: ${selectedFile.content.length}`);
    
    return (
        <>
            <h3>规则内容</h3>
            {fileSelector}
            <div className={contentClassName}>
                {selectedFile.content}
            </div>
            {debugInfo}
        </>
    );
  };
  
  // 渲染规则文件选项卡
  const renderRuleFiles = () => {
    if (loadingFiles) {
      // 如果加载时间超过10秒，显示重试按钮
      const showRetryButton = loadingTime > 10;
      
      return (
        <div className="rule-content-preview">
          <h3>规则文件</h3>
          <div className="loading-indicator">
            <div className="spinner"></div>
            <div>
              加载规则文件内容...{loadingTime > 3 ? `(${loadingTime}秒)` : ''}
              {showRetryButton && (
                <div className="retry-container">
                  <p>加载时间过长，可能遇到了问题。</p>
                  <button 
                    className="retry-button"
                    onClick={() => {
                      console.log('[DEBUG RuleDetailPage] 重新加载规则文件');
                      setLoadingFiles(true);
                      setLoadingTime(0); // 重置加载时间
                      // 重新发送请求
                      if (vscode && rule && rule.id) {
                        try {
                          vscode.postMessage({
                            type: 'getRuleFiles',
                            ruleId: ruleId || rule.id
                          });
                          console.log(`[DEBUG RuleDetailPage] 已重新发送getRuleFiles消息, ruleId: ${ruleId || rule.id}`);
                        } catch (err) {
                          console.error(`[DEBUG RuleDetailPage] 重新发送getRuleFiles消息时出错:`, err);
                          setLoadingFiles(false);
                        }
                      } else {
                        console.error('[DEBUG RuleDetailPage] 缺少重新发送所需的参数: vscode=', !!vscode, 'rule=', !!rule);
                        setLoadingFiles(false);
                      }
                    }}
                  >
                    重试加载
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    if (ruleFiles.length === 0) {
      // 如果规则文件加载完成但没有内容，且rule.content也不存在，则显示提示
      if (!rule?.content) {
        return (
          <div className="rule-content-preview">
            <h3>规则内容</h3>
            <div className="empty-content-notice">
              <p>此规则没有可显示的内容。</p>
            </div>
          </div>
        );
      }
      return null; // 如果有rule.content，则由renderContentPreview处理
    }
    
    console.log('[DEBUG RuleDetailPage] 渲染规则文件选项卡，文件数量:', ruleFiles.length);
    
    // 如果只有一个文件，就不显示选项卡，直接显示内容
    if (ruleFiles.length === 1) {
      const file = ruleFiles[0];
      return (
        <div className="rule-content-preview">
          <h3>规则内容 - {file.name || getFileName(file.path) || "文件"}</h3>
          <pre className="content-preview-box full-content">
            {file.content || '无内容'}
          </pre>
        </div>
      );
    }
    
    // 多文件时显示选项卡
    return (
      <div className="rule-content-preview">
        <h3>规则文件内容</h3>
        <div className="rule-files-container">
          <div className="rule-files-tabs">
            {ruleFiles.map((file, index) => (
              <div 
                key={index} 
                className={`rule-file-tab ${index === selectedFileIndex ? 'active' : ''}`}
                onClick={() => setSelectedFileIndex(index)}
                title={file.description || ''}
              >
                {file.name || getFileName(file.path) || `文件 ${index + 1}`}
              </div>
            ))}
          </div>
          <div className="rule-file-content">
            <pre className="content-preview-box full-content">
              {ruleFiles[selectedFileIndex]?.content || '无内容'}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // 添加调试面板，显示组件内部状态
  const renderDebugPanel = () => {
    return (
      <div className="debug-panel">
        <details>
          <summary>调试信息</summary>
          <div className="debug-content">
            <h4>状态数据</h4>
            <div>ruleId: {ruleId || '无'}</div>
            <div>rule?: {rule ? `${rule.id} (${rule.name})` : '无'}</div>
            <div>loading: {loading ? '是' : '否'}</div>
            <div>error: {error || '无'}</div>
            <div>loadingFiles: {loadingFiles ? '是' : '否'}</div>
            <div>loadingTime: {loadingTime}秒</div>
            <div>ruleFiles数量: {ruleFiles?.length || 0}</div>
            <div>selectedFileIndex: {selectedFileIndex}</div>
            
            <h4>文件列表</h4>
            {ruleFiles && ruleFiles.length > 0 ? (
              <ul className="debug-file-list">
                {ruleFiles.map((file, idx) => (
                  <li key={idx} className={idx === selectedFileIndex ? "selected-file" : ""}>
                    {file.name} ({file.content?.length || 0}字符)
                    {idx === selectedFileIndex && (
                      <div className="file-preview">
                        <div>前100字符: <pre>{file.content?.substring(0, 100) || ''}</pre></div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div>无文件</div>
            )}
            
            <h4>操作</h4>
            <div className="debug-actions">
              <button onClick={() => {
                if (rule) {
                  setLoadingFiles(true);
                  setLoadingTime(0);
                  vscode.postMessage({
                    type: 'getRuleFiles',
                    ruleId: rule.id,
                    id: `debug-reload-${Date.now()}`
                  });
                }
              }}>重新加载文件</button>
              
              <button onClick={() => {
                // 调整定时器避免消息堆积
                console.log('清除并重置状态');
                setLoadingFiles(false);
                setLoadingTime(0);
              }}>重置加载状态</button>
            </div>
          </div>
        </details>
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
              
              {/* 调试信息 */}
              <div className="metadata-item debug-info">
                <details>
                  <summary>调试信息</summary>
                  <div className="debug-content">
                    <div><strong>规则ID:</strong> {ruleId || rule.id}</div>
                    {ruleFiles.length > 0 && (
                      <div>
                        <strong>已加载文件数:</strong> {ruleFiles.length}
                        <ul className="debug-file-list">
                          {ruleFiles.map((file, index) => (
                            <li key={index}>
                              <strong>{file.name || getFileName(file.path)}:</strong> {file.path}
                              <div className="file-content-preview">
                                内容长度: {file.content?.length || 0} 字符
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {loadingFiles && (
                      <div className="loading-status">
                        <strong>加载状态:</strong> 正在加载 ({loadingTime}秒)
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
            
            {renderTechStack()}
            {renderContentPreview()}
            {renderRuleFiles()}
            
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
      
      {/* 添加调试面板 */}
      {renderDebugPanel()}
    </div>
  );
}; 