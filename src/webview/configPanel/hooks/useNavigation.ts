/**
 * useNavigation.ts
 * 
 * 管理导航栏状态的自定义Hook
 */
import { useState, useEffect } from 'react';
import { NavItem, UseNavigationReturn } from '../types';

// 默认导航项
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'general',
    label: '常规设置',
    icon: 'settings'
  },
  {
    id: 'rules',
    label: 'Rule列表',
    icon: 'list-unordered'
  },
  {
    id: 'plugin',
    label: '插件设置',
    icon: 'extensions'
  }
];

/**
 * 导航状态管理Hook
 * 
 * @param initialPageId 初始选中的页面ID
 * @returns 导航状态和方法
 */
export const useNavigation = (initialPageId: string = 'general'): UseNavigationReturn => {
  // 当前活动页面ID
  const [activePageId, setActivePageId] = useState<string>(initialPageId);
  
  // 导航项列表
  const [navItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  
  // 初始化日志
  console.log('[DEBUG useNavigation] 初始化完成，初始页面:', initialPageId);
  
  // 设置活动页面
  const setActivePage = (pageId: string) => {
    console.log('[DEBUG useNavigation] 尝试设置页面为:', pageId);
    
    // 检查页面ID是否在导航项中
    const validPageIds = ['general', 'rules', 'plugin', 'addRule', 'ruleDetail']; // 包含非导航项的有效页面
    if (validPageIds.includes(pageId)) {
      console.log('[DEBUG useNavigation] 页面ID有效，设置activePageId:', pageId);
      setActivePageId(pageId);
      
      // 保存当前页面到状态中，以便在下次打开时恢复
      try {
        localStorage.setItem('cursor-rules-assistant-active-page', pageId);
        console.log('[DEBUG useNavigation] 页面已保存到localStorage');
      } catch (error) {
        console.error('[DEBUG useNavigation] 无法保存页面到localStorage:', error);
      }
    } else {
      console.warn('[DEBUG useNavigation] 无效的页面ID:', pageId, '有效的页面IDs:', validPageIds);
    }
  };
  
  // 从localStorage恢复上次的页面
  useEffect(() => {
    try {
      const savedPageId = localStorage.getItem('cursor-rules-assistant-active-page');
      console.log('[DEBUG useNavigation] 从localStorage恢复页面, 保存的页面ID:', savedPageId);
      
      if (savedPageId) {
        const validPageIds = ['general', 'rules', 'plugin', 'addRule', 'ruleDetail'];
        if (validPageIds.includes(savedPageId)) {
          console.log('[DEBUG useNavigation] 使用localStorage恢复页面ID:', savedPageId);
          setActivePageId(savedPageId);
        } else {
          console.warn('[DEBUG useNavigation] 已保存的页面ID无效:', savedPageId);
        }
      }
    } catch (error) {
      console.error('[DEBUG useNavigation] 从localStorage恢复页面失败:', error);
    }
  }, []);
  
  // 状态变化跟踪
  useEffect(() => {
    console.log('[DEBUG useNavigation] 活动页面ID已更新:', activePageId);
  }, [activePageId]);
  
  return {
    activePageId,
    setActivePage,
    navItems
  };
}; 