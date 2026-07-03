import os

filepath = r"d:\Trae CN\xiangmu\src\data\mockData.ts"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

old = "    relatedIds: ['anxiety-4', 'anxiety-20', 'anxiety-19', 'anxiety-18'],\n    createdAt: '2025-02-18',\n  },\n\n\n  // ==================== 青少年心理 (teenager) ===================="

idx = content.find(old)
print(f"Found at index: {idx}")
if idx >= 0:
    print("SUCCESS: Old string found")
else:
    print("FAILED: Old string not found")
    # Debug: show what's around the relatedIds
    search = "relatedIds: ['anxiety-4', 'anxiety-20', 'anxiety-19', 'anxiety-18']"
    idx2 = content.find(search)
    if idx2 >= 0:
        chunk = content[idx2:idx2+300]
        print("Chunk around anchor:")
        print(repr(chunk))
