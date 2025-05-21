/**
 * 类型声明文件 - vscode-cache
 * 
 * 为vscode-cache模块提供类型定义
 */

declare module 'vscode-cache' {
  import { ExtensionContext } from 'vscode';

  /**
   * VSCode缓存类
   */
  class Cache {
    /**
     * 创建一个新的Cache实例
     * @param context VSCode扩展上下文
     * @param namespace 可选的缓存命名空间
     */
    constructor(context: ExtensionContext, namespace?: string);

    /**
     * 将项目存储在缓存中，可选设置过期时间
     * @param key 缓存项的唯一键
     * @param value 要缓存的值
     * @param expiration 可选的过期时间（秒）
     * @returns VSCode Thenable(Promise)
     */
    put(key: string, value: any, expiration?: number): Thenable<void>;

    /**
     * 从缓存中获取项目，或返回可选的默认值
     * @param key 缓存项的唯一键
     * @param defaultValue 可选的默认值，当缓存项不存在或已过期时返回
     * @returns 缓存的值或可选的默认值
     */
    get<T = any>(key: string, defaultValue?: T): T;

    /**
     * 检查缓存中是否存在未过期的项目
     * @param key 缓存项的唯一键
     * @returns 如果存在未过期的项目则返回true
     */
    has(key: string): boolean;

    /**
     * 从缓存中移除项目
     * @param key 缓存项的唯一键
     * @returns 如果移除成功则返回Thenable，如果键不存在则返回false
     */
    forget(key: string): Thenable<void> | false;

    /**
     * 获取所有缓存项的键数组
     * @returns 所有缓存项的键数组
     */
    keys(): string[];

    /**
     * An alias for `get`
     */
    getValue: typeof Cache.prototype.get;

    /**
     * An alias for `has`
     */
    hasValid: typeof Cache.prototype.has;

    /**
     * 返回所有缓存项的对象
     * @returns 所有缓存项的对象
     */
    all(): Record<string, any>;

    /**
     * 清除缓存中的所有项目
     * @returns VSCode Thenable(Promise)
     */
    flush(): Thenable<void>;

    /**
     * 获取缓存项的过期时间
     * @param key 缓存项的唯一键
     * @returns 过期时间（Unix时间戳，秒）
     */
    expiration(key: string): number;

    /**
     * 检查缓存项是否已过期
     * @param item 缓存项对象
     * @returns 如果缓存项已过期则返回true
     */
    isExpired(item: object): boolean;
  }

  export = Cache;
} 