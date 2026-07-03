with open(r"d:\Trae CN\xiangmu\new_articles.txt", "r", encoding="utf-8") as f:
    content = f.read()
# Find all article IDs
import re
ids = re.findall(r"id: '([^']+)'", content)
for i, aid in enumerate(ids):
    print(f"{i+1}. {aid}")
print(f"\nTotal: {len(ids)}")
