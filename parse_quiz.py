import json
import os
import re
import sys

def fix_latex(text):
    if not isinstance(text, str):
        return text
    # Fix backspace escapes (\b)
    text = text.replace('\x08eta', r'\beta')
    text = text.replace('\x08w', r'\mathbf{w}')
    text = text.replace('\x08x', r'\mathbf{x}')
    text = text.replace('\x08W', r'\mathbf{W}')
    text = re.sub(r'\\bw\b', r'\\mathbf{w}', text)
    text = re.sub(r'\\bx\b', r'\\mathbf{x}', text)
    text = re.sub(r'\\bW\b', r'\\mathbf{W}', text)

    # Fix form feed escapes (\f)
    text = text.replace('\x0crac', r'\frac')
    text = text.replace('\x0capprox', r'\approx')
    text = text.replace('\x0cll', r'\ll')
    text = text.replace('\x0csqrt', r'\sqrt')
    text = text.replace('\x0cge', r'\ge')
    text = text.replace('\x0ccdot', r'\cdot')
    text = text.replace('\x0cnabla', r'\nabla')
    text = text.replace('\x0cmax', r'\max')
    text = text.replace('\x0cle', r'\le')
    text = text.replace('\x0chat', r'\hat')
    text = text.replace('\x0cgg', r'\gg')
    text = re.sub(r'\\f(approx|ll|sqrt|ge|cdot|nabla|max|le|hat|gg)\b', r'\\\1', text)

    # Fix tab escapes (\t)
    text = text.replace('\text', r'\text')
    text = text.replace('\times', r'\times')
    text = text.replace('\to', r'\to')

    return text

def get_section(qid):
    if 1 <= qid <= 25:
        return {
            'part_number': 1,
            'name': 'PHẦN 1: NỀN TẢNG KỸ NĂNG & HỌC MÁY CỔ ĐIỂN',
            'short_name': 'Phần 1: Nền tảng & ML Cổ điển',
            'en': 'Foundational Skills & Classical ML'
        }
    elif 26 <= qid <= 38:
        return {
            'part_number': 2,
            'name': 'PHẦN 2: MẠNG NƠ-RON & HỌC SÂU',
            'short_name': 'Phần 2: Mạng Nơ-ron & Học sâu',
            'en': 'Neural Networks & Deep Learning'
        }
    elif 39 <= qid <= 46:
        return {
            'part_number': 3,
            'name': 'PHẦN 3: THỊ GIÁC MÁY TÍNH',
            'short_name': 'Phần 3: Thị giác máy tính',
            'en': 'Computer Vision'
        }
    else:
        return {
            'part_number': 4,
            'name': 'PHẦN 4: XỬ LÝ NGÔN NGỮ TỰ NHIÊN & ÂM THANH',
            'short_name': 'Phần 4: NLP & Âm thanh',
            'en': 'NLP & Audio'
        }

def parse():
    base_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else '.'
    filepath = os.path.join(base_dir, 'ai_studio_code.txt')

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    option_letters = ['A', 'B', 'C', 'D']
    parsed = []

    # Case 1: Structured JSON format {"quiz": [...]}
    if isinstance(data, dict) and 'quiz' in data:
        raw_quiz = data.get('quiz', [])
        for q in raw_quiz:
            qid = q.get('id', len(parsed) + 1)
            question_text = fix_latex(q.get('question', ''))
            
            tag_match = re.search(r'\*\*\[(.*?)\]\*\*', question_text)
            tag = tag_match.group(1).strip() if tag_match else ''
            
            prompt = question_text.strip()
            
            opts_raw = q.get('options', [])
            opts_dict = {}
            for idx, opt in enumerate(opts_raw):
                letter = option_letters[idx] if idx < len(option_letters) else f'OPT_{idx}'
                opts_dict[letter] = fix_latex(opt.strip())
            
            c_idx = q.get('correct_answer_index', 0)
            correct_letter = option_letters[c_idx] if 0 <= c_idx < 4 else 'A'
            
            diagram_code = q.get('diagram_code', '').strip()
            code_snippet = q.get('code_snippet', '').strip()
            explanation = fix_latex(q.get('explanation', '').strip())

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

    # Case 2: Legacy markdown inside {"response": "..."}
    elif isinstance(data, dict) and 'response' in data:
        text = fix_latex(data['response'])
        
        table_pattern = re.compile(r'\|\s*\*\*(\d+)\*\*\s*\|\s*\*\*([A-D])\*\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|')
        table_data = {}
        for m in table_pattern.finditer(text):
            q_id = int(m.group(1))
            ans = m.group(2).strip()
            topic = m.group(3).strip()
            cat = m.group(4).strip()
            table_data[q_id] = {'answer': ans, 'topic': topic, 'category': cat}

        q_blocks = re.findall(
            r'(###\s+Câu\s+(\d+)\s*(?:\[(.*?)\])?\n([\s\S]*?))(?=(?:###\s+Câu\s+\d+|##\s+BẢNG\s+TỔNG\s+HỢP|$))',
            text
        )

        for full_block, q_num_str, tag, body in q_blocks:
            q_num = int(q_num_str)
            
            opt_pattern = re.compile(r'[-*]\s+\*\*([A-D])\.\*\*\s+([\s\S]*?)(?=(?:[-*]\s+\*\*[A-D]\.\*\*|>\s+\*\*Đáp án đúng:|$))')
            opts = {}
            for om in opt_pattern.finditer(body):
                letter = om.group(1)
                opt_text = om.group(2).strip()
                opts[letter] = opt_text
            
            opt_start = re.search(r'[-*]\s+\*\*A\.\*\*', body)
            q_prompt = body[:opt_start.start()].strip() if opt_start else ''
            
            ans_m = re.search(r'>\s+\*\*Đáp án đúng:\*\*\s*\*\*([A-D])\*\*', body)
            correct_ans = ans_m.group(1) if ans_m else table_data.get(q_num, {}).get('answer', '')
            
            expl_m = re.search(r'>\s+\*\*Giải thích:\*\*\s*([\s\S]*?)(?=\n---\n|$)', body)
            explanation = expl_m.group(1).strip() if expl_m else ''
            explanation = re.sub(r'\n---\s*$', '', explanation).strip()
            
            parsed.append({
                'id': q_num,
                'tag': tag.strip() if tag else '',
                'section': get_section(q_num),
                'prompt': q_prompt,
                'diagram_code': '',
                'code_snippet': '',
                'options': opts,
                'correct_answer': correct_ans,
                'correct_answer_index': option_letters.index(correct_ans) if correct_ans in option_letters else 0,
                'explanation': explanation
            })

    json_path = os.path.join(base_dir, 'quiz_data.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)

    js_path = os.path.join(base_dir, 'quiz_data.js')
    js_content = "window.QUIZ_DATA = " + json.dumps(parsed, ensure_ascii=False, indent=2) + ";\n"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Successfully processed {len(parsed)} questions from {os.path.basename(filepath)} into {json_path} and {js_path}!")

if __name__ == '__main__':
    parse()
