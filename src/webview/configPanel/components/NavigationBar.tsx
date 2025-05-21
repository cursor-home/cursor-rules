/**
 * configPanel/components/NavigationBar.tsx
 * 
 * 导航栏组件，用于在配置面板的不同页面之间切换
 */
import * as React from 'react';
import { NavItem, NavigationBarProps } from '../types';
import { useGitHubStats } from '../hooks/useGitHubStats';
import '../styles/NavigationBar.css';

/**
 * 导航栏项目组件
 */
const NavBarItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  return (
    <div 
      className={`nav-item ${isActive ? 'active' : ''}`} 
      onClick={onClick}
      title={item.label}
    >
      <div className="nav-icon">{item.icon}</div>
      <div className="nav-label">{item.label}</div>
    </div>
  );
};

/**
 * GitHub 信息组件
 */
const GitHubInfo: React.FC = () => {
  const { stats, loading, error, refreshStats } = useGitHubStats();
  
  const handleClick = () => {
    window.open('https://github.com/CC11001100/cursor-rules', '_blank');
  };
  
  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    refreshStats();
  };
  
  return (
    <div className="github-info" onClick={handleClick}>
      <div className="github-logo">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </div>
      <div className="github-stars">
        {loading ? (
          <span className="loading">加载中...</span>
        ) : error ? (
          <span className="error" title={error}>获取失败</span>
        ) : (
          <span>{stats?.stars || 0} ⭐</span>
        )}
      </div>
      <div className="github-refresh" onClick={handleRefresh} title="刷新">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
          <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      </div>
    </div>
  );
};

/**
 * 导航栏组件
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({ 
  navItems, 
  activePageId, 
  setActivePage
}) => {
  return (
    <div className="navigation-bar">
      <div className="nav-items">
        {navItems.map((item) => (
          <NavBarItem
            key={item.id}
            item={item}
            isActive={activePageId === item.id}
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </div>
      <div className="nav-footer">
        <GitHubInfo />
      </div>
    </div>
  );
}; 