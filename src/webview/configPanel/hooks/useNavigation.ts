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
  
  // 设置活动页面
  const setActivePage = (pageId: string) => {
    if (navItems.some(item => item.id === pageId)) {
      setActivePageId(pageId);
      
      // 保存当前页面到状态中，以便在下次打开时恢复
      try {
        localStorage.setItem('cursor-rules-assistant-active-page', pageId);
      } catch (error) {
        console.error('Failed to save active page to localStorage:', error);
      }
    }
  };
  
  // 从localStorage恢复上次的页面
  useEffect(() => {
    try {
      const savedPageId = localStorage.getItem('cursor-rules-assistant-active-page');
      if (savedPageId && navItems.some(item => item.id === savedPageId)) {
        setActivePageId(savedPageId);
      }
    } catch (error) {
      console.error('Failed to restore active page from localStorage:', error);
    }
  }, [navItems]);
  
  return {
    activePageId,
    setActivePage,
    navItems
  };
}; 