#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import sys
from pathlib import Path

# 配置检查规则目录的路径
RULES_DIR = "resources/rules"

def load_meta_json(file_path):
    """加载meta.json文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading meta.json: {e}")
        return None

def save_meta_json(data, file_path):
    """保存meta.json文件"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully saved to {file_path}")
        return True
    except Exception as e:
        print(f"Error saving meta.json: {e}")
        return False

def convert_to_multilingual(meta_data):
    """转换meta.json为多语言格式"""
    updated_rules = []
    
    for rule in meta_data["rules"]:
        # 处理规则名称和描述
        updated_rule = rule.copy()
        
        # 名称转换为多语言格式
        if isinstance(rule.get("name"), str):
            # 假设原始文本是中文，需要创建英文版本
            zh_name = rule["name"]
            # 通常英文名称需要专业翻译，这里仅创建结构
            en_name = rule["name"]  # 这里理想情况下应该有翻译逻辑
            
            updated_rule["name"] = {
                "zh": zh_name,
                "en": en_name
            }
        
        # 描述转换为多语言格式
        if isinstance(rule.get("description"), str):
            zh_description = rule["description"]
            # 同样，英文描述理想情况应该是专业翻译
            en_description = rule["description"]  # 这里理想情况下应该有翻译逻辑
            
            updated_rule["description"] = {
                "zh": zh_description,
                "en": en_description
            }
        
        # 处理子规则文件
        if "files" in rule:
            updated_files = []
            for file_item in rule["files"]:
                updated_file = file_item.copy()
                
                if isinstance(file_item.get("description"), str):
                    file_zh_desc = file_item["description"]
                    # 同样需要专业翻译
                    file_en_desc = file_item["description"]  # 这里理想情况下应该有翻译逻辑
                    
                    updated_file["description"] = {
                        "zh": file_zh_desc,
                        "en": file_en_desc
                    }
                
                updated_files.append(updated_file)
            
            updated_rule["files"] = updated_files
        
        # 检查技术栈格式
        if "techStack" in rule:
            # 暂时保持原有格式，未来可以考虑添加版本信息
            pass
        
        updated_rules.append(updated_rule)
    
    # 更新规则列表
    result = meta_data.copy()
    result["rules"] = updated_rules
    
    # 添加语言支持信息
    result["supportedLanguages"] = ["zh", "en"]
    
    return result

def check_file_paths(meta_data, base_dir):
    """检查meta.json中的路径是否与文件系统一致"""
    issues = []
    
    for rule in meta_data["rules"]:
        # 检查主规则路径
        rule_path = rule.get("path")
        if rule_path:
            full_path = os.path.join(base_dir, rule_path)
            if not os.path.exists(full_path):
                issues.append(f"Rule '{rule['id']}': Path '{rule_path}' does not exist")
        
        # 检查子规则文件路径
        if "files" in rule:
            for file_item in rule["files"]:
                file_path = file_item.get("path")
                if file_path:
                    # 根据实际情况处理相对路径
                    # 这里假设子规则文件的路径是相对于规则目录的
                    if rule_path and os.path.isdir(os.path.join(base_dir, rule_path)):
                        full_file_path = os.path.join(base_dir, rule_path, file_path)
                    else:
                        full_file_path = os.path.join(base_dir, file_path)
                    
                    if not os.path.exists(full_file_path):
                        issues.append(f"Rule '{rule['id']}': File '{file_path}' does not exist")
    
    return issues

def main():
    """主函数"""
    meta_file_path = os.path.join(RULES_DIR, "meta.json")
    output_file_path = os.path.join(RULES_DIR, "meta_i18n.json")
    
    # 加载meta.json
    meta_data = load_meta_json(meta_file_path)
    if not meta_data:
        return
    
    # 检查文件路径
    path_issues = check_file_paths(meta_data, RULES_DIR)
    if path_issues:
        print("Path issues found:")
        for issue in path_issues:
            print(f"  - {issue}")
        print("\nConsider fixing these issues before converting.")
        response = input("Continue with conversion? (y/n): ")
        if response.lower() != 'y':
            return
    
    # 转换为多语言格式
    i18n_meta = convert_to_multilingual(meta_data)
    
    # 保存转换后的结果
    save_meta_json(i18n_meta, output_file_path)
    
    print("\nConversion completed!")
    print(f"Original file: {meta_file_path}")
    print(f"Converted file: {output_file_path}")

if __name__ == "__main__":
    main() 