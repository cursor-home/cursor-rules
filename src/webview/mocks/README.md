# WebView模拟模块

此目录包含为WebView环境提供的模拟模块，以解决Webpack编译问题。

## vscode.ts模拟模块

### 背景

在VSCode扩展开发中，`vscode`模块是一个特殊模块：
- 在Node.js环境（扩展主线程）中，`vscode`模块通过`externals: { vscode: 'commonjs vscode' }`配置作为外部依赖引入
- 在WebView环境中，WebView代码运行在浏览器环境下，无法直接访问`vscode` API

这导致在编译WebView代码时，如果直接导入`vscode`模块，Webpack会报错：`Module not found: Error: Can't resolve 'vscode'`。

### 解决方案

我们创建了一个简化的`vscode`模块模拟实现，并通过Webpack配置使其在WebView环境中替代真实的`vscode`模块：

```javascript
// 在webpack.config.js中
resolve: {
  fallback: {
    // ...其他fallback配置
    "vscode": path.resolve(__dirname, "src/webview/mocks/vscode.ts")
  }
}
```

### 注意事项

1. 这个模拟模块**仅用于编译目的**，不提供实际功能
2. WebView代码应通过消息传递机制与扩展主线程通信，而不是直接调用`vscode` API
3. 如果WebView代码使用了模拟模块中未定义的`vscode` API，需要在模拟模块中添加相应的接口

### 最佳实践

长期来看，更好的解决方案是：
1. 重构WebView代码，避免直接依赖`vscode`模块
2. 使用消息传递机制在WebView和扩展主线程之间通信
3. 将需要访问`vscode` API的逻辑移至扩展主线程 