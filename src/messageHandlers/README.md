# 消息处理器（Message Handlers）

## 目录用途

此目录包含处理WebView和扩展主线程之间消息交互的处理器。这些处理器负责：

1. 接收从WebView发送的消息请求
2. 执行相应的业务逻辑
3. 将结果通过`postMessage`发送回WebView

## 架构说明

在VSCode扩展中，WebView和扩展主线程是两个独立的执行环境：
- WebView运行在浏览器环境中，用于展示用户界面
- 扩展主线程运行在Node.js环境中，可以访问VSCode API和文件系统

两者通过消息传递机制进行通信。消息处理器位于扩展主线程一侧，处理来自WebView的各种请求。

## 文件列表

- `ruleHandlers.ts`: 处理与规则相关的操作，如获取规则列表、创建规则、编辑规则等

## 与其他模块的关系

- 消息处理器从`showConfigPanel.ts`等WebView管理文件中被调用
- 消息处理器可以访问`configPanelInstance`等WebView实例，以便向WebView发送响应
- 消息处理器通常需要访问文件系统、VSCode API和其他业务逻辑模块 