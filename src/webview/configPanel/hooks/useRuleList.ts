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
  };

  /**
   * Refresh rules list
   * 
   * @param includeBuiltIn Whether to include built-in rules
   */
  const refreshRules = (includeBuiltIn: boolean = true) => {
    fetchRules(includeBuiltIn);
  };

  // Listen for messages from VSCode
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      // Handle rule list data
      if (message.type === 'ruleListResult') {
        if (message.success) {
          setRules(message.rules || []);
          setError(null);
        } else {
          setError(message.error || 'Failed to get rule list');
          setRules([]);
        }
        setLoading(false);
      }
    };
    
    // Add message listener
    window.addEventListener('message', handleMessage);
    
    // Initial load
    fetchRules();
    
    // Cleanup function
    return () => {
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