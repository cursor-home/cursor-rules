# Cursor Rules 国际化指南 (Internationalization Guide)

## 概述 (Overview)

本文档介绍Cursor Rules项目的国际化(i18n)支持，包括多语言数据结构和使用方法。
This document introduces the internationalization (i18n) support for the Cursor Rules project, including multilingual data structures and usage methods.

## 多语言数据结构 (Multilingual Data Structure)

新版本的`meta.json`文件支持多语言描述，采用以下结构：
The new version of the `meta.json` file supports multilingual descriptions using the following structure:

```json
{
  "rules": [
    {
      "id": "rule-id",
      "path": "rule-path",
      "name": {
        "zh": "中文名称",
        "en": "English Name"
      },
      "description": {
        "zh": "中文描述",
        "en": "English Description"
      },
      "techStack": { ... },
      "tags": [ ... ],
      "files": [
        {
          "path": "sub-rule-path",
          "description": {
            "zh": "子规则中文描述",
            "en": "Sub-rule English Description"
          }
        }
      ]
    }
  ],
  "supportedLanguages": ["zh", "en"],
  "version": "x.x.x",
  "lastUpdated": "YYYY-MM-DD"
}
```

## 如何使用 (How to Use)

### 获取翻译文本 (Get Translated Text)

在应用程序中获取翻译文本的示例代码：
Example code for getting translated text in your application:

```javascript
// 假设已加载meta.json内容到metaData变量
// Assuming meta.json content is loaded into metaData variable

function getTranslatedText(textObject, language) {
  if (typeof textObject === 'string') {
    return textObject; // 向后兼容旧格式
  }
  
  return textObject[language] || textObject['en'] || Object.values(textObject)[0];
}

// 获取规则名称
// Get rule name
const ruleName = getTranslatedText(rule.name, currentLanguage);

// 获取规则描述
// Get rule description
const ruleDescription = getTranslatedText(rule.description, currentLanguage);
```

### 添加新的语言 (Adding New Languages)

要添加新的语言支持：
To add support for a new language:

1. 修改meta.json文件中的所有name和description对象，添加新语言代码和翻译文本
   Modify all name and description objects in the meta.json file, adding the new language code and translated text

2. 更新supportedLanguages数组，添加新的语言代码
   Update the supportedLanguages array by adding the new language code

```json
"name": {
  "zh": "中文名称",
  "en": "English Name",
  "es": "Nombre en Español"
},

"supportedLanguages": ["zh", "en", "es"]
```

## 路径和技术栈 (Paths and Tech Stack)

新版本的meta.json还验证了文件路径的一致性，确保所有引用的规则文件都存在。此外，技术栈信息结构保持不变，但我们建议在应用中确保使用一致的分类标准。

The new version of meta.json also verifies file path consistency, ensuring that all referenced rule files exist. Additionally, the tech stack information structure remains unchanged, but we recommend ensuring consistent classification standards in applications.

## 转换工具使用 (Conversion Tool Usage)

项目包含一个Python脚本`meta_json_i18n_converter.py`，用于将旧格式的meta.json转换为支持多语言的新格式：
The project includes a Python script `meta_json_i18n_converter.py` for converting the old meta.json format to the new multilingual format:

```bash
# 执行转换脚本
# Run the conversion script
python meta_json_i18n_converter.py
```

转换过程将：
The conversion process will:

1. 检查文件路径一致性
   Check file path consistency
   
2. 将所有name和description字段转换为多语言格式
   Convert all name and description fields to multilingual format
   
3. 生成新的meta_i18n.json文件
   Generate a new meta_i18n.json file

**注意**：转换脚本仅创建结构，不会自动翻译文本。所有翻译需要手动完成或使用专业翻译服务。
**Note**: The conversion script only creates the structure, it does not automatically translate text. All translations need to be done manually or using professional translation services.

## 最佳实践 (Best Practices)

1. 使用一致的语言代码标识符（如'zh', 'en', 'es'等）
   Use consistent language code identifiers (e.g., 'zh', 'en', 'es', etc.)

2. 确保所有规则至少有一种语言的描述（推荐英文作为基础语言）
   Ensure all rules have descriptions in at least one language (English recommended as the base language)

3. 当添加新规则时，立即提供多语言描述
   When adding new rules, immediately provide multilingual descriptions

4. 保持翻译的专业性和准确性
   Maintain professionalism and accuracy in translations

5. 定期检查并更新翻译内容
   Regularly check and update translated content 