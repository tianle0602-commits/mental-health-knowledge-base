import os

filepath = r"d:\Trae CN\xiangmu\src\data\mockData.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old = "    relatedIds: ['anxiety-4', 'anxiety-20', 'anxiety-19', 'anxiety-18'],\n    createdAt: '2025-02-18',\n  },\n\n\n  // ==================== 青少年心理 (teenager) ===================="

new_articles_file = r"d:\Trae CN\xiangmu\new_articles.txt"
with open(new_articles_file, "r", encoding="utf-8") as f:
    new_articles = f.read()

new_content = "    relatedIds: ['anxiety-4', 'anxiety-20', 'anxiety-19', 'anxiety-18'],\n    createdAt: '2025-02-18',\n  },\n" + new_articles + "\n\n\n  // ==================== 青少年心理 (teenager) ===================="

content = content.replace(old, new_content)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS")
