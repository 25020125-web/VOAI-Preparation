import sys
sys.stdout.reconfigure(encoding='utf-8')

fpath = r'C:\Users\leemi\AppData\Roaming\Code\User\History\243ccb10\ElbF.txt'
with open(fpath, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect the first 10 questions in Text A and Text B
# Look at where switches occur:
# Can we identify markers of JSON structure?
# Keys: "id", "question", "diagram_code", "code_snippet", "options", "correct_answer_index", "explanation"
# Notice: every question has these 7 keys in order!
# Let's see: what if we trace the keys of Stream A and Stream B?

print("Length of ElbF:", len(text))
