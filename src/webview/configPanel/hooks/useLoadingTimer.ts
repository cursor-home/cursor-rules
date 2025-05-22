import { useState, useEffect, useRef } from 'react';

/**
 * 用于管理加载状态的计时器hook
 * 
 * @param isLoading 是否正在加载
 * @returns [loadingTime, resetTimer] 加载时间和重置函数
 */
export function useLoadingTimer(isLoading: boolean): [number, () => void] {
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理函数，防止内存泄漏
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 重置计时器
  const resetTimer = () => {
    clearTimer();
    setLoadingTime(0);
  };

  // 启动/停止计时器
  useEffect(() => {
    // 如果正在加载，启动计时器
    if (isLoading) {
      // 确保没有旧计时器
      clearTimer();
      
      // 启动新计时器
      timerRef.current = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
      
      console.log('[DEBUG useLoadingTimer] 启动加载计时器');
    } else {
      // 停止计时器
      clearTimer();
      setLoadingTime(0);
      console.log('[DEBUG useLoadingTimer] 停止加载计时器');
    }

    // 清理函数
    return clearTimer;
  }, [isLoading]);

  return [loadingTime, resetTimer];
} 