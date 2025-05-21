import os
import json
import re
import yaml
from pathlib import Path

# 定义路径
RULES_DIR = "awesome-cursorrules/rules"
META_JSON_PATH = "resources/rules/meta.json"

# 读取现有的meta.json文件
def read_existing_meta():
    try:
        with open(META_JSON_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"rules": [], "version": "1.0.0", "lastUpdated": "2023-07-12"}

# 从目录名称中提取技术栈信息
def extract_tech_stack_from_dirname(dirname):
    # 移除通用后缀
    clean_name = re.sub(r'-cursorrules-prompt-file/?$', '', dirname)
    
    # 分割技术名称
    tech_parts = clean_name.split('-')
    
    languages = []
    frameworks = []
    tools = []
    
    # 常见语言
    lang_keywords = ['typescript', 'javascript', 'python', 'php', 'solidity', 'c#', 'csharp', 'rust', 'go']
    # 常见框架
    framework_keywords = ['react', 'angular', 'vue', 'nextjs', 'fastapi', 'flask', 'django', 'laravel', 'express', 'nestjs', 'tailwind', 'shadcn', 'sveltekit', 'svelte', 'qwik', 'solid']
    # 常见工具
    tool_keywords = ['vite', 'webpack', 'jest', 'cypress', 'storybook', 'pwa', 'vercel', 'netlify', 'supabase', 'mongodb', 'firebase']
    
    for part in tech_parts:
        part = part.lower()
        if part in lang_keywords:
            languages.append(part.capitalize())
        elif part in framework_keywords:
            # 特殊处理一些框架名称
            if part == 'nextjs':
                frameworks.append('Next.js')
            elif part == 'nestjs':
                frameworks.append('NestJS')
            elif part == 'fastapi':
                frameworks.append('FastAPI')
            else:
                frameworks.append(part.capitalize())
        elif part in tool_keywords:
            tools.append(part.capitalize())
    
    return {
        "languages": languages,
        "frameworks": frameworks,
        "tools": tools
    }

# 从.mdc文件中提取frontmatter和内容
def extract_mdc_info(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 检查是否有frontmatter (---...---)
        frontmatter = {}
        description = ""
        
        # 查找frontmatter
        frontmatter_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if frontmatter_match:
            frontmatter_text = frontmatter_match.group(1)
            try:
                frontmatter = yaml.safe_load(frontmatter_text)
                description = frontmatter.get('description', '')
            except:
                pass
                
        # 从文件内容中提取第一行作为标题（如果没有提取到frontmatter的描述）
        if not description:
            # 移除frontmatter并分割行
            clean_content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)
            lines = clean_content.strip().split('\n')
            
            # 提取第一个非空行作为标题
            for line in lines:
                if line.strip():
                    # 如果以#开头，则删除#和周围的空格
                    title_line = re.sub(r'^#+\s*', '', line.strip())
                    description = title_line
                    break
        
        return description, frontmatter.get('globs', '**/*.*')
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return "", "**/*.*"

# 从目录中扫描所有规则文件
def scan_rule_directory(dir_path):
    rule_files = []
    try:
        # 获取目录中所有的.mdc文件
        for filename in os.listdir(dir_path):
            if filename.endswith('.mdc') and not filename.startswith('.'):
                file_path = os.path.join(dir_path, filename)
                description, globs = extract_mdc_info(file_path)
                
                # 从文件名中提取规则ID
                rule_id = os.path.splitext(filename)[0].lower()
                
                rule_files.append({
                    "file": filename,
                    "path": os.path.relpath(file_path, "awesome-cursorrules/rules"),
                    "description": description,
                    "globs": globs,
                    "id": rule_id
                })
    except Exception as e:
        print(f"Error scanning directory {dir_path}: {e}")
    
    return rule_files

# 生成规则条目
def generate_rule_entry(rule_dir, rule_files):
    # 从目录名称生成规则ID
    base_dir_name = os.path.basename(rule_dir)
    rule_id = base_dir_name.replace('-cursorrules-prompt-file', '')
    
    # 从目录名提取技术栈信息
    tech_stack = extract_tech_stack_from_dirname(base_dir_name)
    
    # 生成标签
    tags = tech_stack['languages'] + tech_stack['frameworks'] + tech_stack['tools']
    tags = [tag.lower() for tag in tags]
    
    # 创建规则描述
    if rule_files:
        description = f"包含{len(rule_files)}个规则文件的{rule_id}技术栈规则集"
    else:
        description = f"{rule_id}技术栈规则集"
    
    # 规则路径（指向目录）
    path = os.path.relpath(rule_dir, "awesome-cursorrules/rules")
    
    # 规则名称（美化目录名）
    name = rule_id.replace('-', ' ').title() + " 规则集"
    
    # 创建规则条目
    entry = {
        "id": rule_id,
        "path": path,
        "name": name,
        "description": description,
        "techStack": tech_stack,
        "tags": tags,
        "files": [{"path": file["path"], "description": file["description"]} for file in rule_files]
    }
    
    return entry

# 主函数
def main():
    # 读取现有的meta.json
    meta_data = read_existing_meta()
    existing_rules = meta_data["rules"]
    
    # 创建一个集合来跟踪现有规则的ID
    existing_rule_ids = {rule["id"] for rule in existing_rules}
    
    # 扫描awesome-cursorrules/rules目录
    new_rules = []
    for item in os.listdir(RULES_DIR):
        item_path = os.path.join(RULES_DIR, item)
        
        # 只处理目录
        if os.path.isdir(item_path):
            # 扫描目录中的规则文件
            rule_files = scan_rule_directory(item_path)
            
            # 生成规则条目
            rule_entry = generate_rule_entry(item_path, rule_files)
            
            # 如果规则ID不在现有规则中，则添加到新规则列表
            if rule_entry["id"] not in existing_rule_ids:
                new_rules.append(rule_entry)
    
    # 将新规则添加到现有规则中
    meta_data["rules"].extend(new_rules)
    
    # 更新lastUpdated字段
    from datetime import datetime
    meta_data["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
    
    # 输出结果
    print(f"Found {len(new_rules)} new rules")
    print(f"Total rules: {len(meta_data['rules'])}")
    
    # 将结果写入meta.json
    with open(META_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(meta_data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {META_JSON_PATH}")

if __name__ == "__main__":
    main() 