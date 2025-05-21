/**
 * 日志模块
 * 
 * 提供统一的日志记录功能，将日志输出到VSCode的Output面板。
 * 支持不同级别的日志（DEBUG, INFO, WARN, ERROR），并使用不同的前缀进行标识。
 */
import * as vscode from 'vscode';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * 日志级别名称映射
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR'
};

/**
 * 日志级别前缀
 * VSCode的Output面板不支持颜色，所以使用特殊符号作为前缀
 */
const LOG_LEVEL_PREFIXES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: '📝',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌'
};

/**
 * 日志记录器类
 */
export class Logger {
  private outputChannel: vscode.OutputChannel;
  private minLevel: LogLevel;
  private static instance: Logger | null = null;

  /**
   * 获取日志记录器实例（单例模式）
   * 
   * @param channelName - 输出通道名称，默认为'Cursor Rules Assistant'
   * @param level - 最低日志级别，默认为INFO
   * @returns 日志记录器实例
   */
  public static getInstance(channelName: string = 'Cursor Rules Assistant', level: LogLevel = LogLevel.INFO): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(channelName, level);
    }
    return Logger.instance;
  }

  /**
   * 构造函数
   * 
   * @param channelName - 输出通道名称
   * @param level - 最低日志级别
   */
  private constructor(channelName: string, level: LogLevel) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
    this.minLevel = level;
  }

  /**
   * 设置日志级别
   * 
   * @param level - 新的日志级别
   */
  public setLevel(level: LogLevel): void {
    this.minLevel = level;
    this.debug(`日志级别已设置为: ${LOG_LEVEL_NAMES[level]}`);
  }

  /**
   * 获取当前日志级别
   * 
   * @returns 当前日志级别
   */
  public getLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * 记录调试日志
   * 
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * 记录信息日志
   * 
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * 记录警告日志
   * 
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * 记录错误日志
   * 
   * @param message - 日志消息
   * @param error - 错误对象或额外数据（可选）
   */
  public error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * 显示输出面板
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * 清空日志
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * 记录日志
   * 
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 额外数据（可选）
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 检查是否应该记录此级别的日志
    if (level < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const prefix = LOG_LEVEL_PREFIXES[level];
    const levelName = LOG_LEVEL_NAMES[level];
    
    // 构建基本日志消息
    let logMessage = `${timestamp} ${prefix} [${levelName}] ${message}`;
    
    // 如果有额外数据，添加到日志中
    if (data !== undefined) {
      if (data instanceof Error) {
        // 处理错误对象
        logMessage += `\n  错误: ${data.message}`;
        if (data.stack) {
          logMessage += `\n  堆栈: ${data.stack}`;
        }
      } else if (typeof data === 'object') {
        // 处理对象
        try {
          const jsonStr = JSON.stringify(data, null, 2);
          logMessage += `\n  数据: ${jsonStr}`;
        } catch (e) {
          logMessage += `\n  数据: [无法序列化的对象]`;
        }
      } else {
        // 处理其他类型的数据
        logMessage += `\n  数据: ${data}`;
      }
    }
    
    // 输出日志
    this.outputChannel.appendLine(logMessage);
    
    // 对于错误级别的日志，自动显示输出面板
    if (level === LogLevel.ERROR) {
      this.outputChannel.show(true);
    }
  }
}

/**
 * 默认日志记录器实例
 */
export const logger = Logger.getInstance();

/**
 * 调试日志
 * 
 * @param message - 日志消息
 * @param data - 额外数据（可选）
 */
export function debug(message: string, data?: any): void {
  logger.debug(message, data);
}

/**
 * 信息日志
 * 
 * @param message - 日志消息
 * @param data - 额外数据（可选）
 */
export function info(message: string, data?: any): void {
  logger.info(message, data);
}

/**
 * 警告日志
 * 
 * @param message - 日志消息
 * @param data - 额外数据（可选）
 */
export function warn(message: string, data?: any): void {
  logger.warn(message, data);
}

/**
 * 错误日志
 * 
 * @param message - 日志消息
 * @param error - 错误对象或额外数据（可选）
 */
export function error(message: string, error?: any): void {
  logger.error(message, error);
}

/**
 * 设置日志级别
 * 
 * @param level - 新的日志级别
 */
export function setLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

/**
 * 显示日志面板
 */
export function showLogs(): void {
  logger.show();
}

/**
 * 清空日志
 */
export function clearLogs(): void {
  logger.clear();
}

/**
 * 初始化日志系统
 * 
 * 根据用户配置设置适当的日志级别，并初始化日志系统
 * 
 * @param {string} configuredLogLevel - 从用户配置中读取的日志级别设置
 * @returns {void} 无返回值
 */
export function initializeLogging(configuredLogLevel: string): void {
	// 根据配置设置日志级别
	switch (configuredLogLevel.toLowerCase()) {
		case 'debug':
			// 调试级别：显示所有日志信息，包括详细的调试信息
			setLogLevel(LogLevel.DEBUG);
			break;
		case 'info':
			// 信息级别：显示信息、警告和错误日志，但不显示调试信息
			setLogLevel(LogLevel.INFO);
			break;
		case 'warn':
		case 'warning':
			// 警告级别：只显示警告和错误日志
			setLogLevel(LogLevel.WARN);
			break;
		case 'error':
			// 错误级别：只显示错误日志
			setLogLevel(LogLevel.ERROR);
			break;
		default:
			// 如果配置无效，默认使用信息级别
			setLogLevel(LogLevel.INFO);
	}
	
	// 记录扩展激活信息
	info('Cursor Rules Assistant 已激活！');
} 