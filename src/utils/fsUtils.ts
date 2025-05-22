/**
 * fsUtils.ts
 * 
 * 文件系统工具函数集合
 * 提供文件系统操作相关的辅助函数
 */
import * as vscode from 'vscode';
import { error } from '../logger/logger';

/**
 * 检查文件是否存在
 * 
 * 使用VS Code API检查文件是否存在
 * 确保跨平台兼容性，包括Web环境和远程工作区
 * 
 * @param uri 文件URI
 * @returns 文件是否存在
 */
export async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在
 * 
 * 使用VS Code API创建目录（如果不存在）
 * 支持递归创建多级目录
 * 
 * @param uri 目录URI
 * @returns 是否操作成功
 */
export async function ensureDirectory(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.createDirectory(uri);
    return true;
  } catch (err) {
    error(`创建目录失败 ${uri.fsPath}:`, err);
    return false;
  }
}

/**
 * 安全读取文件内容
 * 
 * 使用VS Code API读取文件内容，处理可能的错误
 * 如果文件不存在或读取失败，返回null
 * 
 * @param uri 文件URI
 * @param encoding 文件编码，默认为'utf-8'
 * @returns 文件内容字符串或null(如果读取失败)
 */
export async function readFileContent(uri: vscode.Uri, encoding: BufferEncoding = 'utf-8'): Promise<string | null> {
  try {
    // 先检查文件是否存在
    const exists = await fileExists(uri);
    if (!exists) {
      return null;
    }
    
    // 读取文件内容
    const fileData = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(fileData).toString(encoding);
  } catch (err) {
    error(`读取文件失败 ${uri.fsPath}:`, err);
    return null;
  }
}

/**
 * 安全写入文件内容
 * 
 * 使用VS Code API写入文件内容，处理可能的错误
 * 如果目录不存在会自动创建
 * 
 * @param uri 文件URI
 * @param content 要写入的内容
 * @returns 是否写入成功
 */
export async function writeFileContent(uri: vscode.Uri, content: string): Promise<boolean> {
  try {
    // 确保父目录存在
    const dirUri = vscode.Uri.joinPath(uri, '..');
    await ensureDirectory(dirUri);
    
    // 写入文件内容
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    return true;
  } catch (err) {
    error(`写入文件失败 ${uri.fsPath}:`, err);
    return false;
  }
}

/**
 * 确保目录结构存在
 * 
 * 创建指定的多级目录结构，确保所有层级都存在
 * 用于快速创建多级目录结构
 * 
 * @param baseUri 基础URI
 * @param paths 要创建的目录路径数组
 * @returns 最后一级目录的URI和操作是否成功
 */
export async function ensureDirectoryStructure(
  baseUri: vscode.Uri, 
  paths: string[]
): Promise<{uri: vscode.Uri, success: boolean}> {
  try {
    let currentUri = baseUri;
    
    for (const pathSegment of paths) {
      currentUri = vscode.Uri.joinPath(currentUri, pathSegment);
      await ensureDirectory(currentUri);
    }
    
    return { uri: currentUri, success: true };
  } catch (err) {
    error(`创建目录结构失败:`, err);
    return { uri: baseUri, success: false };
  }
} 