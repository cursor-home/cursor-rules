# Cursor Rules 助手

这是一个VSCode扩展，帮助你管理和使用Cursor Rules，提升AI辅助编程效率。

## 功能特点

- 🔍 **自动检测项目技术栈**：智能识别项目使用的编程语言和框架
- 📝 **规则模板管理**：提供多种预定义规则模板，满足不同类型项目需求
- 🤖 **AI辅助功能**：集成Cursor AI功能，支持代码生成和高级对话
- 💬 **流式对话**：实时流式响应，提供更自然的交互体验
- 🔄 **自动配置**：检测到缺少Cursor Rules时自动配置建议

## 使用指南

### 安装后首次使用

扩展会自动检测项目是否配置了Cursor Rules。如果没有，会提示你选择以下选项：

- **自动配置**：根据项目技术栈自动选择最适合的规则模板
- **手动配置**：打开配置面板手动选择规则模板
- **暂不配置**：跳过此次配置
- **此项目不再提示**：针对当前项目禁用自动检测提示

### 命令列表

在命令面板中 (`Ctrl+Shift+P` 或 `Cmd+Shift+P`)，可以找到以下命令：

- `Cursor Rules: 打开配置面板` - 打开Cursor Rules配置界面
- `Cursor Rules: 创建规则` - 为当前项目创建新的规则文件
- `Cursor Rules: 检测技术栈` - 分析并显示当前项目使用的技术
- `Cursor Rules: 生成代码` - 使用AI生成代码片段
- `Cursor Rules: 流式对话` - 开始一个实时流式AI对话
- `Cursor Rules: 高级对话` - 开始一个多轮高级AI对话

## 配置选项

在设置中可以配置以下选项：

- `cursor-rules-assistant.enableAutoCheck`: 启动时自动检查Cursor Rules
- `cursor-rules-assistant.defaultTemplate`: 默认使用的规则模板
  
## AI功能

本扩展集成了Cursor AI的强大功能：

- **代码生成**：根据自然语言描述生成代码
- **流式对话**：实时交互式响应，提供流畅的对话体验
- **多轮对话**：支持上下文感知的多轮对话

## 技术栈检测

支持检测多种编程语言和框架，包括但不限于：

- 编程语言：TypeScript、JavaScript、Python、Java、Go等
- 前端框架：React、Vue、Angular等
- 后端框架：Express、Django、Spring Boot等
- 数据库技术：MongoDB、MySQL、PostgreSQL等

## 问题反馈

如发现任何问题或有功能建议，请提交到GitHub仓库的Issues区。

## 版本记录

### 0.0.1

- 首次发布
- 支持基本的Cursor Rules管理功能
- 集成Cursor AI代码生成和对话功能
- 添加技术栈检测能力

---

**开发者：Cursor团队**
