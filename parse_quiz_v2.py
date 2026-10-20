import json
import os
import re
import sys

def parse_v2():
    base_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else '.'
    filepath = os.path.join(base_dir, 'ai_studio_code 3.txt')
    if not os.path.exists(filepath):
        filepath = os.path.join(base_dir, 'ai_studio_code2.txt')
    if not os.path.exists(filepath):
        filepath = 'ai_studio_code 3.txt'

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    raw_quiz = data.get('quiz', [])

    def get_section(qid):
        if 1 <= qid <= 16:
            return {
                'part_number': 1,
                'name': 'PHẦN 1: NỀN TẢNG SYLLABUS IOAI 2026',
                'short_name': 'Phần 1: Syllabus Core',
                'en': 'IOAI Syllabus Core Foundations'
            }
        elif 17 <= qid <= 23:
            return {
                'part_number': 2,
                'name': 'PHẦN 2: THỬ THÁCH DAY 1 (ROBOT CHASING & POTATO)',
                'short_name': 'Phần 2: Day 1 Tasks',
                'en': 'Individual Contest Day 1'
            }
        elif 24 <= qid <= 34:
            return {
                'part_number': 3,
                'name': 'PHẦN 3: THỬ THÁCH DAY 2 (DOUBLE AGENT, GHOST & IOAI FIELD)',
                'short_name': 'Phần 3: Day 2 Tasks',
                'en': 'Individual Contest Day 2'
            }
        else:
            return {
                'part_number': 4,
                'name': 'PHẦN 4: THỬ THÁCH AT-HOME (ROBOT DELIVERY & JOHN WILKINS)',
                'short_name': 'Phần 4: At-Home Tasks',
                'en': 'At-Home Round Tasks'
            }

    parsed = []
    option_letters = ['A', 'B', 'C', 'D']

    for q in raw_quiz:
        qid = q['id']
        question_text = q['question']
        
        # Extract tag from question if present
        tag_match = re.search(r'\*\*\[(.*?)\]\*\*', question_text)
        tag = tag_match.group(1).strip() if tag_match else ''
        
        # Clean prompt text (keep the full text, formatted cleanly)
        prompt = question_text.strip()
        
        # Options mapping
        opts_raw = q.get('options', [])
        opts_dict = {}
        for idx, opt in enumerate(opts_raw):
            letter = option_letters[idx] if idx < len(option_letters) else f'OPT_{idx}'
            opts_dict[letter] = opt.strip()
        
        c_idx = q.get('correct_answer_index', 0)
        correct_letter = option_letters[c_idx] if 0 <= c_idx < 4 else 'A'
        
        diagram_code = q.get('diagram_code', '').strip()
        code_snippet = q.get('code_snippet', '').strip()
        explanation = q.get('explanation', '').strip()

        parsed.append({
            'id': qid,
            'tag': tag,
            'section': get_section(qid),
            'prompt': prompt,
            'diagram_code': diagram_code,
            'code_snippet': code_snippet,
            'options': opts_dict,
            'correct_answer': correct_letter,
            'correct_answer_index': c_idx,
            'explanation': explanation
        })

    json_path = os.path.join(base_dir, 'quiz_data_v2.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)

    js_path = os.path.join(base_dir, 'quiz_data_v2.js')
    js_content = "window.QUIZ_DATA = " + json.dumps(parsed, ensure_ascii=False, indent=2) + ";\n"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Successfully processed {len(parsed)} questions from {os.path.basename(filepath)} into {json_path} and {js_path}!")

if __name__ == '__main__':
    parse_v2()
