"""
פסקול לסרטון "ארון המשפחה" – מסונתז במלואו בקוד (numpy/scipy), ללא דגימות חיצוניות.

קורא את src/video.config.json (אורכי סצנות, beats, רשימת אפקטים וחלונות קריינות)
ומפיק שלושה ערוצים נפרדים ל-public/audio:
  music.wav         – מוזיקת רקע (Light Electronic, 120 BPM, D major)
  music_ducked.wav  – אותה מוזיקה עם הנמכה אוטומטית בחלונות הקריינות
  sfx.wav           – אפקטים מסונכרנים לפעולות על המסך
שימוש: python3 audio/build_audio.py
"""
import json
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CFG = json.load(open(os.path.join(ROOT, 'src', 'video.config.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'public', 'audio')
os.makedirs(OUT, exist_ok=True)

SR = 48000
RNG = np.random.default_rng(7)

# ---------- ציר הזמן ----------
starts = {}
acc = 0.0
for s in CFG['scenes']:
    starts[s['id']] = acc
    acc += s['dur']
TOTAL = acc
N = int(TOTAL * SR) + SR
SC = {s['id']: s for s in CFG['scenes']}


def beat_t(scene, name):
    return starts[scene] + SC[scene]['beats'][name]


BPM = CFG['music']['bpm']
BEAT = 60.0 / BPM
BAR = BEAT * 4


# ---------- כלים ----------
def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def env_ad(n, a, d, curve=6.0):
    """attack ליניארי ואז דעיכה אקספוננציאלית"""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) * curve / max(d, 1e-6)))
    return e


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low')
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), 'high')
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], 'band')
    return signal.lfilter(b, a, x)


def sweep_bp(x, f0, f1, q=1.2, steps=48):
    """פילטר band-pass שהתדר שלו נע (לסווישים)"""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, steps + 1).astype(int)
    win = np.hanning(2 * (edges[1] - edges[0]) + 2)
    for i in range(steps):
        a, b = edges[i], edges[i + 1]
        fc = f0 * (f1 / f0) ** (i / max(steps - 1, 1))
        lo, hi = fc / (1 + 1 / q), fc * (1 + 1 / q)
        seg_a, seg_b = max(0, a - (b - a) // 2), min(n, b + (b - a) // 2)
        seg = bp(x[seg_a:seg_b], max(lo, 30), hi)
        w = np.hanning(len(seg))
        out[seg_a:seg_b] += seg * w
    return out / 1.0


def note_hz(name):
    names = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}
    n, o = name[:-1], int(name[-1])
    midi = 12 * (o + 1) + names[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[1] or i + len(x) <= 0:
        return
    j0 = max(0, -i)
    i = max(0, i)
    x = x[j0:]
    n = min(len(x), buf.shape[1] - i)
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += x[:n] * gain * l * 1.414
    buf[1, i:i + n] += x[:n] * gain * r * 1.414


def make_ir(dur=1.8, decay=3.2, seed=3):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    irL = rng.standard_normal(n) * np.exp(-t * decay)
    irR = rng.standard_normal(n) * np.exp(-t * decay)
    irL = lp(irL, 6000)
    irR = lp(irR, 6000)
    irL[: int(0.012 * SR)] = 0
    irR[: int(0.017 * SR)] = 0
    return irL / np.sqrt(np.sum(irL ** 2)), irR / np.sqrt(np.sum(irR ** 2))


IR = make_ir()


def reverb(st, wet=0.25):
    mono = st.mean(axis=0)
    wl = signal.fftconvolve(mono, IR[0])[: st.shape[1]]
    wr = signal.fftconvolve(mono, IR[1])[: st.shape[1]]
    return st * (1 - wet * 0.4) + np.stack([wl, wr]) * wet


# ---------- כלי נגינה ----------
def pluck(f, dur=0.45, bright=1.0):
    t = t_arr(dur)
    x = np.sin(2 * np.pi * f * t) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.2 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    return x * env_ad(len(t), 0.004, dur, 5.5)


def bell(f, dur=1.6):
    t = t_arr(dur)
    x = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1.0, 2.2), (2.0, 0.35, 3.5), (2.76, 0.28, 4.5), (5.4, 0.12, 7.0)]:
        x += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return x * np.minimum(1, t / 0.003)


def saw(f, t, voices=3, det=0.008):
    x = np.zeros_like(t)
    for k in range(voices):
        fk = f * (1 + det * (k - (voices - 1) / 2))
        ph = RNG.random()
        x += 2 * ((t * fk + ph) % 1) - 1
    return x / voices


def pad_chord(notes, dur, cutoff=1800, attack=0.6):
    t = t_arr(dur)
    x = np.zeros_like(t)
    for n in notes:
        x += saw(note_hz(n), t)
    x = lp(x, cutoff, 2)
    e = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / 0.4)
    return x * e / len(notes)


def kick():
    t = t_arr(0.42)
    f = 46 + 90 * np.exp(-t * 26)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 300) * 0.25
    return x + click


def clap():
    t = t_arr(0.3)
    n = RNG.standard_normal(len(t))
    e = np.zeros_like(t)
    for k, d in enumerate([0, 0.011, 0.022]):
        e += (t >= d) * np.exp(-(t - d).clip(0) * (90 if k < 2 else 22))
    return bp(n, 900, 3200) * e * 0.8


def hat(open_=False):
    t = t_arr(0.25 if open_ else 0.06)
    return hp(RNG.standard_normal(len(t)), 7500) * np.exp(-t * (14 if open_ else 70))


def sub_bass(f, dur):
    t = t_arr(dur)
    x = np.sin(2 * np.pi * f * t) + 0.18 * lp(saw(f, t, 2), 600)
    return x * env_ad(len(t), 0.008, dur, 2.2) * np.minimum(1, (dur - t) / 0.02)


# ---------- מוזיקה ----------
def build_music():
    st = np.zeros((2, N))
    pads = np.zeros((2, N))
    plucks = np.zeros((2, N))
    drums = np.zeros((2, N))
    bass = np.zeros((2, N))

    PROG = [  # (שורש לבס, צליל אקורד)
        ('D2', ['D3', 'F#3', 'A3', 'D4']),
        ('A1', ['C#3', 'E3', 'A3', 'C#4']),
        ('B1', ['B2', 'D3', 'F#3', 'B3']),
        ('G1', ['B2', 'D3', 'G3', 'B3']),
    ]
    HOOK = [  # (שמינית בתוך 2 תיבות, צליל)
        (0, 'D5'), (2, 'F#5'), (3, 'A5'), (4, 'B5'), (5, 'A5'), (6, 'F#5'),
        (8, 'E5'), (10, 'F#5'), (11, 'A5'), (12, 'F#5'), (13, 'E5'), (14, 'D5'),
    ]
    HOOK_B = [(0, 'A5'), (2, 'B5'), (3, 'D6'), (4, 'C#6'), (6, 'A5'), (8, 'B5'), (10, 'A5'), (11, 'F#5'), (12, 'E5'), (14, 'F#5')]

    t_sol = starts['solution']
    t_drop = beat_t('solution', 'logo')
    t_season = starts['season']
    t_shop = starts['shopping']
    t_shared = starts['shared']
    t_cta = starts['cta']
    t_brand = beat_t('cta', 'brand')

    # --- פתיחה: ארפג'ו מתוח, פילטר נפתח, היי-האט מתגבר ---
    arp = ['B3', 'D4', 'F#4', 'B4', 'G3', 'B3', 'D4', 'G4']
    k = 0
    t = 0.0
    while t < t_sol - 0.25:
        prog = t / t_sol
        n = arp[k % len(arp)]
        x = lp(pluck(note_hz(n), 0.3, 0.6 + prog), 900 + 5000 * prog ** 1.5)
        place(plucks, x, t, 0.34 + 0.2 * prog, pan=0.35 * np.sin(k))
        if t > 1.5:
            place(drums, hat(), t + BEAT / 4, 0.08 + 0.14 * prog, pan=0.3)
        k += 1
        t += BEAT / 2
    # פד נמוך שמתעצם
    p = pad_chord(['B2', 'D3', 'F#3'], t_sol - 0.2, cutoff=700, attack=2.0)
    ramp = np.linspace(0.18, 0.4, len(p))
    place(pads, p * ramp, 0.0, 1.0)

    # --- חשיפה: פד חם בפתיחה מלאה עד הדרופ ---
    p = pad_chord(['D3', 'F#3', 'A3', 'D4', 'F#4'], t_drop - t_sol + 0.3, cutoff=2400, attack=0.9)
    place(pads, p, t_sol + 0.25, 0.48)
    for i, n in enumerate(['A4', 'D5', 'F#5', 'A5']):
        place(plucks, bell(note_hz(n), 1.4), t_sol + 0.9 + i * BEAT / 2, 0.13, pan=-0.4 + i * 0.25)

    # --- הגרוב הראשי מהדרופ ועד הקריאה לפעולה ---
    bar_idx = 0
    t = t_drop
    while t < t_cta - 1e-6:
        root, chord = PROG[bar_idx % 4]
        bar_len = min(BAR, t_cta - t)
        breakdown = t_shared <= t < t_cta
        light = t_season <= t < t_shop
        # פד
        place(pads, pad_chord(chord, bar_len + 0.3, cutoff=2600 if not breakdown else 1400, attack=0.15), t, 0.2)
        # תופים
        for b4 in range(4):
            tb = t + b4 * BEAT
            if tb >= t_cta:
                break
            if not breakdown:
                place(drums, kick(), tb, 0.55)
            if b4 in (1, 3) and not breakdown:
                place(drums, clap(), tb, 0.22, pan=0.05)
            for h8 in range(2):
                th = tb + h8 * BEAT / 2 + (0.018 if h8 else 0)
                place(drums, hat(open_=(h8 == 1 and b4 == 3)), th, (0.07 if h8 == 0 else 0.11) * (0.6 if light else 1), pan=0.25)
        # בס בשמיניות עם "pump"
        if not breakdown:
            for e8 in range(8):
                te = t + e8 * BEAT / 2
                if te >= t_cta:
                    break
                place(bass, sub_bass(note_hz(root) * (2 if e8 % 2 else 1), BEAT / 2 * 0.9), te, 0.32 if e8 % 2 == 0 else 0.16)
        # מלודיה – כל זוג תיבות
        hook = HOOK if (bar_idx // 2) % 2 == 0 else HOOK_B
        if bar_idx % 2 == 0:
            for e8, n in hook:
                te = t + e8 * BEAT / 2
                if te >= t_cta - 0.05:
                    break
                place(plucks, pluck(note_hz(n), 0.5), te, 0.2 if not breakdown else 0.12, pan=0.2 * np.sin(e8))
                if light:
                    place(plucks, bell(note_hz(n) * 2, 0.9), te, 0.035, pan=-0.3)
        bar_idx += 1
        t += BAR

    # --- קריאה לפעולה: בנייה ואז אקורד סיום עם חתימת המותג ---
    t = t_cta
    while t < t_brand - 1e-6:
        prog = (t - t_cta) / (t_brand - t_cta)
        n = ['D4', 'F#4', 'A4', 'D5', 'E4', 'G4', 'B4', 'E5'][int((t - t_cta) / (BEAT / 2)) % 8]
        place(plucks, pluck(note_hz(n), 0.35), t, 0.24 + 0.14 * prog, pan=0.3 * np.sin(t * 3))
        place(drums, hat(), t, 0.04 + 0.08 * prog, pan=0.2)
        if prog > 0.5:
            place(drums, kick(), t, 0.25 * prog) if int((t - t_cta) / (BEAT / 2)) % 2 == 0 else None
        t += BEAT / 2
    p = pad_chord(['G2', 'B2', 'D3', 'G3', 'A3'], t_brand - t_cta, cutoff=1200 + 0, attack=1.5)
    place(pads, p, t_cta, 0.36)
    end_len = TOTAL - t_brand + 0.5
    final = pad_chord(['D3', 'F#3', 'A3', 'D4', 'F#4', 'A4'], end_len, cutoff=3000, attack=0.05)
    final *= np.exp(-np.arange(len(final)) / SR * 0.35)
    place(pads, final, t_brand, 0.32)
    place(bass, sub_bass(note_hz('D2'), 2.5), t_brand, 0.45)
    place(drums, kick(), t_brand, 0.6)

    # sidechain: הנמכת פד ובס לפי הקיק
    kick_env = np.zeros(N)
    t = t_drop
    while t < t_cta:
        if not (t_shared <= t < t_cta):
            i = int(t * SR)
            n = int(0.3 * SR)
            kick_env[i:i + n] = np.maximum(kick_env[i:i + n], np.exp(-np.arange(min(n, N - i)) / SR * 12))
        t += BEAT
    duck = 1 - 0.45 * kick_env
    pads *= duck
    bass *= duck

    st = reverb(pads, 0.35) + reverb(plucks, 0.3) + drums + bass
    st = hp(st, 28)
    # פייד בסוף
    fade = np.ones(N)
    fe = int((TOTAL - 1.6) * SR)
    fade[fe:] = np.linspace(1, 0, N - fe) ** 1.5
    st *= fade
    return st


# ---------- אפקטים ----------
def sfx_tap():
    t = t_arr(0.06)
    click = hp(RNG.standard_normal(len(t)), 3000) * np.exp(-t * 400) * 0.5
    blip = np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 90)
    return click + blip * 0.6


def sfx_pop(pitch=1.0):
    t = t_arr(0.12)
    f = (380 + 650 * np.exp(-t * 45)) * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 32) * np.minimum(1, t / 0.002)


def sfx_whoosh(dur=0.55, f0=350, f1=2600, deep=False):
    n = RNG.standard_normal(int(dur * SR))
    x = sweep_bp(n, f0, f1, q=1.6)
    t = t_arr(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    x = x * e
    if deep:
        x += np.sin(2 * np.pi * (60 + 40 * t / dur) * t) * e * 0.5
    return x / (np.max(np.abs(x)) + 1e-9)


def sfx_swipe():
    return sfx_whoosh(0.22, 1200, 4500) * 0.8


def sfx_card_swipe():
    x = sfx_whoosh(0.3, 800, 3800)
    x[: len(sfx_tap())] += sfx_tap() * 0.4
    return x


def sfx_chime():
    out = np.zeros(int(1.8 * SR))
    a = bell(note_hz('D6'), 1.8) * 0.6
    b = bell(note_hz('A6'), 1.6) * 0.45
    out[: len(a)] += a
    i = int(0.07 * SR)
    out[i:i + len(b)] += b[: len(out) - i]
    return out


def sfx_success():
    a = bell(note_hz('A5'), 1.0)
    b = bell(note_hz('D6'), 1.2)
    out = np.zeros(int(1.3 * SR))
    out[: len(a)] += a * 0.5
    out[int(0.09 * SR):int(0.09 * SR) + len(b)] += b[: len(out) - int(0.09 * SR)] * 0.6
    return out


def sfx_notify():
    a = bell(note_hz('E6'), 0.5)
    b = bell(note_hz('B5'), 0.7)
    out = np.zeros(int(0.9 * SR))
    out[: len(a)] += a * 0.5
    out[int(0.12 * SR):int(0.12 * SR) + len(b)] += b * 0.55
    return lp(out, 5000)


def sfx_check():
    t = t_arr(0.18)
    f = 1046 + 520 * (t > 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 18)
    return x * 0.7 + np.pad(sfx_tap(), (0, len(t) - len(sfx_tap()))) * 0.3


def sfx_ticks(dur=0.8):
    out = np.zeros(int((dur + 0.1) * SR))
    for k in range(9):
        i = int(k * dur / 9 * SR)
        tk = sfx_tap() * (0.5 + k * 0.05)
        out[i:i + len(tk)] += tk
    return out


def sfx_shimmer():
    out = np.zeros(int(1.6 * SR))
    notes = ['D6', 'F#6', 'A6', 'B6', 'D7', 'A6', 'F#6']
    for k, n in enumerate(notes):
        b = bell(note_hz(n), 0.9) * (0.35 - k * 0.03)
        i = int(k * 0.07 * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return out


def sfx_sync():
    out = np.zeros(int(1.0 * SR))
    w = sfx_whoosh(0.9, 500, 2000) * 0.25
    out[: len(w)] += w
    for k, n in enumerate(['A5', 'E6']):
        b = bell(note_hz(n), 0.7) * 0.4
        i = int((0.05 + k * 0.5) * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return out


def sfx_sonic_logo():
    out = np.zeros(int(2.4 * SR))
    for k, n in enumerate(['D5', 'F#5', 'A5', 'D6']):
        b = bell(note_hz(n), 1.8) * 0.45
        i = int(k * 0.075 * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    t = t_arr(2.4)
    shimmer = hp(RNG.standard_normal(len(t)), 9000) * np.exp(-t * 3) * 0.04
    return out + shimmer


def sfx_rustle(dur=0.7):
    n = RNG.standard_normal(int(dur * SR))
    x = bp(n, 1800, 7000)
    grains = np.zeros(len(x))
    for _ in range(26):
        c = RNG.integers(0, len(x))
        w = int(RNG.uniform(0.01, 0.04) * SR)
        g = np.hanning(w) * RNG.uniform(0.3, 1)
        grains[c:c + w] += g[: len(grains) - c]
    t = t_arr(dur)
    return x * grains * np.sin(np.pi * t / dur) * 0.6


def sfx_riser(dur=2.5):
    t = t_arr(dur)
    n = RNG.standard_normal(len(t))
    x = sweep_bp(n, 500, 7000, q=2.0) * (t / dur) ** 2
    tone = np.sin(2 * np.pi * np.cumsum(180 + 900 * (t / dur) ** 2) / SR) * (t / dur) ** 2.5 * 0.25
    out = x / (np.max(np.abs(x)) + 1e-9) * 0.8 + tone
    out[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return out


FX = {
    'tap': lambda c: sfx_tap(),
    'pop': lambda c: sfx_pop(c.get('pitch', 1.0)),
    'whoosh': lambda c: sfx_whoosh(),
    'whooshDeep': lambda c: sfx_whoosh(0.9, 150, 1400, deep=True),
    'swipe': lambda c: sfx_swipe(),
    'cardSwipe': lambda c: sfx_card_swipe(),
    'chime': lambda c: sfx_chime(),
    'success': lambda c: sfx_success(),
    'notify': lambda c: sfx_notify(),
    'check': lambda c: sfx_check(),
    'ticks': lambda c: sfx_ticks(c.get('len', 0.8)),
    'shimmer': lambda c: sfx_shimmer(),
    'sync': lambda c: sfx_sync(),
    'sonicLogo': lambda c: sfx_sonic_logo(),
    'rustle': lambda c: sfx_rustle(),
    'riser': lambda c: sfx_riser(c.get('len', 2.5)),
}
DEFAULT_GAIN = {'tap': 0.35}


def build_sfx():
    dry = np.zeros((2, N))
    wet = np.zeros((2, N))
    for c in CFG['sfx']:
        sc = c['scene']
        if c.get('spawnPops'):
            for k, sp in enumerate(SC[sc]['spawns']):
                if k > 16:
                    break
                g = 0.42 * (1 - k / 22)
                place(dry, sfx_pop(0.8 + 0.5 * RNG.random()), starts[sc] + sp, g, pan=float(RNG.uniform(-0.6, 0.6)))
            for tg in SC[sc].get('tagSpawns', []):
                place(dry, sfx_pop(1.6), starts[sc] + tg, 0.12, pan=float(RNG.uniform(-0.5, 0.5)))
            continue
        t = starts[sc] + (SC[sc]['beats'][c['beat']] if 'beat' in c else c['t'])
        typ = c['type']
        x = FX[typ](c)
        g = c.get('gain', DEFAULT_GAIN.get(typ, 0.5))
        if typ == 'riser':
            pass
        target = wet if typ in ('chime', 'success', 'notify', 'shimmer', 'sync', 'sonicLogo') else dry
        place(target, x, t, g, pan=c.get('pan', 0.0))
    out = dry + reverb(wet, 0.4)
    return hp(out, 40)


def vo_duck_curve():
    curve = np.ones(N)
    db = CFG['voiceover'].get('duckDb', -9)
    g = 10 ** (db / 20)
    ramp = int(0.15 * SR)
    for s in CFG['scenes']:
        vo = s.get('vo')
        if not vo:
            continue
        a = int((starts[s['id']] + vo['t']) * SR)
        b = int((starts[s['id']] + vo['t'] + vo['dur']) * SR)
        seg = np.ones(b - a + 2 * ramp) * g
        seg[:ramp] = np.linspace(1, g, ramp)
        seg[-ramp:] = np.linspace(g, 1, ramp)
        lo = max(0, a - ramp)
        curve[lo:lo + len(seg)] = np.minimum(curve[lo:lo + len(seg)], seg[: N - lo])
    return curve


def limit(x, ceiling=0.89):
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak * 0.95
    return np.tanh(x * 1.2) / np.tanh(1.2) * ceiling


def write(name, st):
    st = st[:, : int(TOTAL * SR)]
    wavfile.write(os.path.join(OUT, name), SR, (st.T * 32767).astype(np.int16))
    print('wrote', name, f'{st.shape[1] / SR:.2f}s')


if __name__ == '__main__':
    music = build_music()
    mgain = CFG['music'].get('gain', 0.55)
    music = limit(music) * mgain / 0.89 * 0.89
    write('music.wav', music)
    write('music_ducked.wav', music * vo_duck_curve())
    sfx = build_sfx()
    write('sfx.wav', limit(sfx, 0.8))
