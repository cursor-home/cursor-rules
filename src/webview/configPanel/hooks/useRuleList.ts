/**
 * configPanel/hooks/useRuleList.ts
 * 
 * Rule list Hook for fetching and managing Cursor Rules
 */
import { useState, useEffect } from 'react';
import { UseRuleListReturn, VSCodeAPI } from '../types';
import { Rule } from '../../../types';

/**
 * Rule list Hook
 * 
 * @param vscode VSCode API instance
 * @returns Rule list data and related methods
 */
export const useRuleList = (vscode: VSCodeAPI): UseRuleListReturn => {
  // Rules list state
  const [rules, setRules] = useState<Rule[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch rules list
   * 
   * @param includeBuiltIn Whether to include built-in rules
   */
  const fetchRules = (includeBuiltIn: boolean = true) => {
    setLoading(true);
    setError(null);
    
    // Send message to request rule list
    vscode.postMessage({
      type: 'getRuleList',
      includeBuiltIn
    });
    
    console.log('[DEBUG useRuleList] 已发送获取规则列表请求');
  };

  /**
   * Refresh rules list
   * 
   * @param includeBuiltIn Whether to include built-in rules
   */
  const refreshRules = (includeBuiltIn: boolean = true) => {
    console.log('[DEBUG useRuleList] 刷新规则列表');
    fetchRules(includeBuiltIn);
  };

  // Listen for messages from VSCode
  useEffect(() => {
    if (!vscode) {
      console.error('[DEBUG useRuleList] vscode对象不存在，无法获取规则列表');
      setError('VSCode API not available');
      setLoading(false);
      return;
    }
    
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      console.log('[DEBUG useRuleList] 收到消息:', message);
      
      // Handle rule list data
      if (message.type === 'ruleListResult') {
        if (message.success) {
          console.log('[DEBUG useRuleList] 成功获取规则列表, 数量:', message.rules?.length);
          setRules(message.rules || []);
          setError(null);
        } else {
          console.error('[DEBUG useRuleList] 获取规则列表失败:', message.error);
          setError(message.error || 'Failed to get rule list');
          setRules([]);
        }
        setLoading(false);
      }
      
      // 处理规则删除消息
      if (message.type === 'ruleDeleted') {
        console.log('[DEBUG useRuleList] 收到规则删除消息:', message);
        
        if (message.success) {
          // 如果删除成功，立即刷新规则列表
          console.log('[DEBUG useRuleList] 规则删除成功，刷新规则列表');
          refreshRules();
        } else {
          // 如果删除失败，显示错误
          console.error('[DEBUG useRuleList] 规则删除失败:', message.error);
          // 可能的话，我们可以在UI中显示这个错误
        }
      }
    };
    
    // Add message listener
    console.log('[DEBUG useRuleList] 添加消息监听器');
    window.addEventListener('message', handleMessage);
    
    // Initial load
    console.log('[DEBUG useRuleList] 初始加载规则列表');
    fetchRules();
    
    // Cleanup function
    return () => {
      console.log('[DEBUG useRuleList] 清理消息监听器');
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  return {
    rules,
    loading,
    error,
    refreshRules
  };
}; 