/**
 * configPanel/hooks/useGitHubStats.ts
 * 
 * GitHub统计信息Hook，用于获取并缓存GitHub仓库信息
 */
import { useState, useEffect } from 'react';
import { GitHubStats, UseGitHubStatsReturn } from '../types';

// GitHub仓库信息
const GITHUB_REPO = {
  owner: 'CC11001100',
  repo: 'cursor-rules',
  url: 'https://github.com/CC11001100/cursor-rules'
};

// 缓存过期时间（1小时）
const CACHE_EXPIRY_MS = 60 * 60 * 1000;

// 缓存键名
const CACHE_KEY = 'github_stats_cache';

/**
 * 从缓存中获取GitHub统计数据
 */
const getStatsFromCache = (): GitHubStats | null => {
  try {
    const cacheJson = localStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    const now = Date.now();
    
    // 检查缓存是否过期
    if (now - cache.lastUpdated > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return cache;
  } catch (error) {
    console.error('Failed to get GitHub stats from cache:', error);
    return null;
  }
};

/**
 * 将GitHub统计数据保存到缓存
 */
const saveStatsToCache = (stats: GitHubStats): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...stats,
      lastUpdated: Date.now()
    }));
  } catch (error) {
    console.error('Failed to save GitHub stats to cache:', error);
  }
};

/**
 * GitHub统计信息Hook
 */
export const useGitHubStats = (): UseGitHubStatsReturn => {
  const [stats, setStats] = useState<GitHubStats | null>(() => getStatsFromCache());
  const [loading, setLoading] = useState<boolean>(!stats);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取GitHub统计数据
   */
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 构建API URL
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO.owner}/${GITHUB_REPO.repo}`;
      
      // 发起请求
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`GitHub API responded with status: ${response.status}`);
      }
      
      // 解析响应
      const data = await response.json();
      
      // 提取所需数据
      const statsData: GitHubStats = {
        stars: data.stargazers_count,
        forks: data.forks_count,
        lastUpdated: Date.now()
      };
      
      // 更新状态和缓存
      setStats(statsData);
      saveStatsToCache(statsData);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch GitHub stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch GitHub stats');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 手动刷新统计数据
   */
  const refreshStats = () => {
    fetchStats();
  };

  // 初始加载时获取数据
  useEffect(() => {
    if (!stats) {
      fetchStats();
    }
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats
  };
}; 