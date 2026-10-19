import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

filepath = r'C:\Users\leemi\OneDrive\Documents\code\python\AI\Prepare\ai_studio_code1.txt'
with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

quiz = data['quiz']
print(f"Total questions: {len(quiz)}")

diagram_count = 0
code_snippet_count = 0
math_count = 0
issues = []

for i, q in enumerate(quiz, 1):
    qid = q.get('id', i)
    if 'question' not in q or len(q['question']) < 10:
        issues.append(f"Q{qid}: invalid question")
    opts = q.get('options', [])
    if len(opts) != 4:
        issues.append(f"Q{qid}: options count != 4 ({len(opts)})")
    c_idx = q.get('correct_answer_index')
    if c_idx not in [0, 1, 2, 3]:
        issues.append(f"Q{qid}: invalid correct_answer_index ({c_idx})")
    if 'explanation' not in q or len(q['explanation']) < 10:
        issues.append(f"Q{qid}: missing explanation")
    
    if q.get('diagram_code'):
        diagram_count += 1
    if q.get('code_snippet'):
        code_snippet_count += 1
    
    all_texts = [q.get('question', ''), q.get('explanation', '')] + opts
    if any('$' in t for t in all_texts):
        math_count += 1

print(f"Validation issues: {len(issues)}")
print(f"Questions with diagram_code: {diagram_count}/40")
print(f"Questions with code_snippet: {code_snippet_count}/40")
print(f"Questions with Math ($): {math_count}/40")

# Check control characters
raw_json = json.dumps(data)
ctrl_chars = [c for c in raw_json if ord(c) < 32 and c not in '\n\r\t']
print(f"Control chars count: {len(ctrl_chars)}")

# Sample diagram codes
print("\nSample diagram codes:")
for q in quiz[:5]:
    if q.get('diagram_code'):
        print(f"Q{q['id']}: {q['diagram_code']}")

# Sample code snippets
print("\nSample code snippets:")
for q in quiz[:5]:
    if q.get('code_snippet'):
        print(f"Q{q['id']}: {q['code_snippet']}")
