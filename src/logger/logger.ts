/**
 * Logger Module
 * 
 * Provides unified logging functionality, outputting logs to VSCode's Output panel.
 * Supports different log levels (DEBUG, INFO, WARN, ERROR), each identified with different prefixes.
 */
import * as vscode from 'vscode';

/**
 * Log level enumeration
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Log level name mapping
 */
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR'
};

/**
 * Log level prefixes
 * VSCode's Output panel doesn't support colors, so special symbols are used as prefixes
 */
const LOG_LEVEL_PREFIXES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: '📝',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌'
};

/**
 * Logger class
 */
export class Logger {
  private outputChannel: vscode.OutputChannel;
  private minLevel: LogLevel;
  private static instance: Logger | null = null;

  /**
   * Get logger instance (singleton pattern)
   * 
   * @param channelName - Output channel name, defaults to 'Cursor Rules Assistant'
   * @param level - Minimum log level, defaults to INFO
   * @returns Logger instance
   */
  public static getInstance(channelName: string = 'Cursor Rules Assistant', level: LogLevel = LogLevel.INFO): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(channelName, level);
    }
    return Logger.instance;
  }

  /**
   * Constructor
   * 
   * @param channelName - Output channel name
   * @param level - Minimum log level
   */
  private constructor(channelName: string, level: LogLevel) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
    this.minLevel = level;
  }

  /**
   * Set log level
   * 
   * @param level - New log level
   */
  public setLevel(level: LogLevel): void {
    this.minLevel = level;
    this.debug(`Log level set to: ${LOG_LEVEL_NAMES[level]}`);
  }

  /**
   * Get current log level
   * 
   * @returns Current log level
   */
  public getLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * Log debug message
   * 
   * @param message - Log message
   * @param data - Additional data (optional)
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   * 
   * @param message - Log message
   * @param data - Additional data (optional)
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   * 
   * @param message - Log message
   * @param data - Additional data (optional)
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   * 
   * @param message - Log message
   * @param error - Error object or additional data (optional)
   */
  public error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }

  /**
   * Show output panel
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * Clear logs
   */
  public clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Log message
   * 
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data (optional)
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // Check if this level should be logged
    if (level < this.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const prefix = LOG_LEVEL_PREFIXES[level];
    const levelName = LOG_LEVEL_NAMES[level];
    
    // Build basic log message
    let logMessage = `${timestamp} ${prefix} [${levelName}] ${message}`;
    
    // If additional data exists, add to log
    if (data !== undefined) {
      if (data instanceof Error) {
        // Handle error object
        logMessage += `\n  Error: ${data.message}`;
        if (data.stack) {
          logMessage += `\n  Stack: ${data.stack}`;
        }
      } else if (typeof data === 'object') {
        // Handle object
        try {
          const jsonStr = JSON.stringify(data, null, 2);
          logMessage += `\n  Data: ${jsonStr}`;
        } catch (e) {
          logMessage += `\n  Data: [Non-serializable object]`;
        }
      } else {
        // Handle other types of data
        logMessage += `\n  Data: ${data}`;
      }
    }
    
    // Output log
    this.outputChannel.appendLine(logMessage);
    
    // For error level logs, automatically show the output panel
    if (level === LogLevel.ERROR) {
      this.outputChannel.show(true);
    }
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance();

/**
 * Debug log
 * 
 * @param message - Log message
 * @param data - Additional data (optional)
 */
export function debug(message: string, data?: any): void {
  logger.debug(message, data);
}

/**
 * Info log
 * 
 * @param message - Log message
 * @param data - Additional data (optional)
 */
export function info(message: string, data?: any): void {
  logger.info(message, data);
}

/**
 * Warning log
 * 
 * @param message - Log message
 * @param data - Additional data (optional)
 */
export function warn(message: string, data?: any): void {
  logger.warn(message, data);
}

/**
 * Error log
 * 
 * @param message - Log message
 * @param error - Error object or additional data (optional)
 */
export function error(message: string, error?: any): void {
  logger.error(message, error);
}

/**
 * Set log level
 * 
 * @param level - New log level
 */
export function setLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

/**
 * Show logs panel
 */
export function showLogs(): void {
  logger.show();
}

/**
 * Clear logs
 */
export function clearLogs(): void {
  logger.clear();
}

/**
 * Initialize logging system
 * 
 * Set appropriate log level based on user configuration and initialize the logging system
 * 
 * @param {string} configuredLogLevel - Log level setting from user configuration
 */
export function initializeLogging(configuredLogLevel: string): void {
  // Set log level based on configuration
  if (configuredLogLevel === 'debug') {
    // Debug level: Show all logs including detailed debug information
    setLogLevel(LogLevel.DEBUG);
  } else if (configuredLogLevel === 'info') {
    // Info level: Show info, warning and error logs, but not debug logs
    setLogLevel(LogLevel.INFO);
  } else if (configuredLogLevel === 'warn') {
    // Warning level: Only show warning and error logs
    setLogLevel(LogLevel.WARN);
  } else if (configuredLogLevel === 'error') {
    // Error level: Only show error logs
    setLogLevel(LogLevel.ERROR);
  } else {
    // Default to info level
    setLogLevel(LogLevel.INFO);
  }
} 