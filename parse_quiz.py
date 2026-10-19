import json
import re
import sys

def fix_latex(text):
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

def parse():
    with open('ai_studio_code.txt', 'r', encoding='utf-8') as f:
        data = json.load(f)
    text = data['response']

    text = fix_latex(text)

    sections = [
        (1, 15, 'PHẦN 1: KỸ NĂNG NỀN TẢNG & HỌC MÁY CỔ ĐIỂN', 'Foundational Skills & Classical ML', 'Phần 1: Nền tảng & ML Cổ điển'),
        (16, 27, 'PHẦN 2: MẠNG NƠ-RON & HỌC SÂU', 'Neural Networks & Deep Learning', 'Phần 2: Mạng Nơ-ron & Học sâu'),
        (28, 34, 'PHẦN 3: THỊ GIÁC MÁY TÍNH', 'Computer Vision', 'Phần 3: Thị giác máy tính'),
        (35, 40, 'PHẦN 4: XỬ LÝ NGÔN NGỮ TỰ NHIÊN & ÂM THANH', 'NLP & Audio', 'Phần 4: NLP & Âm thanh')
    ]

    def get_section(num):
        for start, end, name, en, short in sections:
            if start <= num <= end:
                return {
                    'part_number': 1 if start == 1 else (2 if start == 16 else (3 if start == 28 else 4)),
                    'name': name,
                    'short_name': short,
                    'en': en
                }
        return {'part_number': 0, 'name': 'Khác', 'short_name': 'Khác', 'en': 'Other'}

    # Extract quick answer summary table
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

    parsed_questions = []
    for full_block, q_num_str, tag, body in q_blocks:
        q_num = int(q_num_str)
        
        # Extract options
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
        
        parsed_questions.append({
            'id': q_num,
            'tag': tag.strip() if tag else '',
            'section': get_section(q_num),
            'topic': table_data.get(q_num, {}).get('topic', ''),
            'category': table_data.get(q_num, {}).get('category', ''),
            'prompt': q_prompt,
            'options': opts,
            'correct_answer': correct_ans,
            'explanation': explanation
        })

    # Save to JSON
    with open('quiz_data.json', 'w', encoding='utf-8') as f:
        json.dump(parsed_questions, f, ensure_ascii=False, indent=2)

    # Save to JS file
    js_content = "window.QUIZ_DATA = " + json.dumps(parsed_questions, ensure_ascii=False, indent=2) + ";\n"
    with open('quiz_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Successfully processed and cleaned {len(parsed_questions)} questions!")

if __name__ == '__main__':
    parse()
