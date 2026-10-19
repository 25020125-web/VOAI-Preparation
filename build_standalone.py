"""
Build script to generate offline standalone HTML files for both quiz versions:
- Exam 1 (ai_studio_code.txt): standalone_quiz.html & standalone_quiz_v1.html
- Exam 2 (ai_studio_code2.txt): standalone_quiz_v2.html
"""

def build():
    # 1. Read shared CSS & JS
    with open('style.css', 'r', encoding='utf-8') as f:
        css = f.read()

    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    # 2. Read quiz data
    with open('quiz_data.js', 'r', encoding='utf-8') as f:
        quiz_data_v1 = f.read()

    with open('quiz_data_v2.js', 'r', encoding='utf-8') as f:
        quiz_data_v2 = f.read()

    # 3. Build Exam 1 (ai_studio_code.txt)
    with open('index.html', 'r', encoding='utf-8') as f:
        html1 = f.read()

    html1 = html1.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
    html1 = html1.replace('<script src="quiz_data.js"></script>', f'<script>\n{quiz_data_v1}\n</script>')
    html1 = html1.replace('<script src="app.js"></script>', f'<script>\n{app_js}\n</script>')
    # In standalone mode, link switcher to standalone_quiz_v2.html
    html1 = html1.replace('href="index_v2.html"', 'href="standalone_quiz_v2.html"')

    with open('standalone_quiz.html', 'w', encoding='utf-8') as f:
        f.write(html1)
    with open('standalone_quiz_v1.html', 'w', encoding='utf-8') as f:
        f.write(html1)

    print(f"Generated standalone_quiz.html & standalone_quiz_v1.html ({len(html1)} bytes) [Exam 1: ai_studio_code.txt]")

    # 4. Build Exam 2 (ai_studio_code1.txt)
    with open('index_v2.html', 'r', encoding='utf-8') as f:
        html2 = f.read()

    html2 = html2.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
    html2 = html2.replace('<script src="quiz_data_v2.js"></script>', f'<script>\n{quiz_data_v2}\n</script>')
    html2 = html2.replace('<script src="app.js"></script>', f'<script>\n{app_js}\n</script>')
    # In standalone mode, link switcher to standalone_quiz.html
    html2 = html2.replace('href="index.html"', 'href="standalone_quiz.html"')

    with open('standalone_quiz_v2.html', 'w', encoding='utf-8') as f:
        f.write(html2)

    print(f"Generated standalone_quiz_v2.html ({len(html2)} bytes) [Exam 2: ai_studio_code2.txt]")

if __name__ == '__main__':
    build()
