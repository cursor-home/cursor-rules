# Cursor Rules 规则仓库

这个目录包含了用于Cursor AI的规则文件集合，按照技术栈分类组织。

## 目录结构

- `/typescript`: TypeScript相关规则
- `/react`: React相关规则
- `/vue`: Vue相关规则
- `/python`: Python相关规则

## 规则文件格式

规则文件使用`.mdc`扩展名，包含YAML格式的frontmatter和Markdown格式的内容：

```
---
description: 规则描述
globs: "适用的文件类型"
---
# 规则标题

## 第一部分
- 规则内容
- 更多规则内容

## 第二部分
- 规则内容
- 更多规则内容
```

## 贡献规则

欢迎通过Pull Request贡献新的规则！请确保您的规则文件遵循上述格式，并放在合适的技术栈目录下。 