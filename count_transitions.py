import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('ai_studio_code.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's search for all question starts:
# How many question starts are there?
matches = list(re.finditer(r'\{"id":\s*(\d+)', text))
print("Total question ID matches:", len(matches))
for m in matches[:20]:
    start = max(0, m.start() - 20)
    end = min(len(text), m.end() + 40)
    print(f"ID {m.group(1)} at {m.start()}: {repr(text[start:end])}")
