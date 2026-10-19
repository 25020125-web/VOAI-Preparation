import json, re

with open('quiz_data_v2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total questions: {len(data)}")
diagrams = [q for q in data if q.get('diagram_code')]
print(f"Questions with diagram_code: {len(diagrams)}")

img_markdown = [q for q in data if re.search(r'!\[.*?\]\(.*?\)', q.get('prompt', ''))]
print(f"Questions with markdown ![...](...): {len(img_markdown)}")

img_tags = [q for q in data if '<img' in q.get('prompt', '')]
print(f"Questions with <img>: {len(img_tags)}")

for q in diagrams[:5]:
    print(f"Q{q['id']}: {q['diagram_code'][:60]}")
