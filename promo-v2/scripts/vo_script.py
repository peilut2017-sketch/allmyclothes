"""מפיק את תסריט הקריינות (Markdown) וקובץ כתוביות SRT עם תזמונים מתוך src/video.config.json.
שימוש: python3 scripts/vo_script.py  →  out/voiceover-script.md, out/voiceover.srt"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, 'src', 'video.config.json'), encoding='utf-8'))
out = os.path.join(ROOT, 'out')
os.makedirs(out, exist_ok=True)

TITLES = {
    'problem': 'הבעיה',
    'solution': 'הפתרון',
    'closet': 'הארון הדיגיטלי',
    'growth': 'גדילה והעברה בין אחים',
    'season': 'החלפת עונה',
    'shopping': 'קניות חכמות',
    'shared': 'ארון משפחתי משותף',
    'cta': 'קריאה לפעולה',
}


def ts(t, srt=False):
    m, s = divmod(t, 60)
    if srt:
        h = 0
        ms = int(round((s - int(s)) * 1000))
        return f'{h:02d}:{int(m):02d}:{int(s):02d},{ms:03d}'
    return f'{int(m):02d}:{s:05.2f}'


acc = 0.0
md = ['# תסריט קריינות – ארון המשפחה', '',
      'קריינות בעברית טבעית, חמה ואמינה. קצב נינוח עם נשימה בין משפטים – לא תשדיר מכירה.',
      'הזמנים מוחלטים מתחילת הסרטון. "חלון" = הזמן שבו המוזיקה מונמכת אוטומטית לקריינות.', '',
      '| # | סצנה | התחלה | חלון | טקסט |', '|---|---|---|---|---|']
srt = []
k = 1
for s in cfg['scenes']:
    vo = s.get('vo')
    if vo:
        a = acc + vo['t']
        b = a + vo['dur']
        md.append(f"| {k} | {TITLES.get(s['id'], s['id'])} | {ts(a)} | {vo['dur']:.1f} ש׳ | {vo['text']} |")
        srt += [str(k), f'{ts(a, True)} --> {ts(b, True)}', vo['text'], '']
        k += 1
    acc += s['dur']
md += ['', '## הוראות הקלטה', '',
       '- להקליט כל משפט כקובץ נפרד, או את כולם ברצף לפי הזמנים בטבלה (קובץ אחד באורך הסרטון).',
       '- לשמור כ-`public/audio/vo.wav` (48kHz) – קובץ אחד באורך הסרטון, כשכל משפט מתחיל בזמן שבטבלה.',
       '- להפעיל `"voiceover": { "enabled": true }` ב-`src/video.config.json` ולהריץ `npm run render -- --vo`.',
       '- אם משפט ארוך מהחלון – לעדכן את `vo.dur` של הסצנה, כדי שההנמכה של המוזיקה תכסה אותו.',
       '- `voiceover.srt` מצורף לנוחות: אפשר לייבא אותו לתוכנת עריכה כמדריך תזמון או ככתוביות.']
open(os.path.join(out, 'voiceover-script.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
open(os.path.join(out, 'voiceover.srt'), 'w', encoding='utf-8').write('\n'.join(srt))
print('\n'.join(md))
