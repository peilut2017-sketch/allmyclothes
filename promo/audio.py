#!/usr/bin/env python3
"""
מסנתז את הפסקול של סרטון התדמית (ללא קבצי סאונד חיצוניים):
מוזיקת רקע (מינורית ומהוססת בסצנת הבלגן -> מז'ורית ועליזה מרגע ההצגה של האפליקציה)
+ אפקטים שמסונכרנים לאירועים ש-promo.html מייצא (events.json).

שימוש: python3 audio.py events.json out.wav
"""
import json
import sys

import numpy as np

SR = 44100
rng = np.random.default_rng(11)

events = json.load(open(sys.argv[1]))
DUR = float(events['duration'])
N = int((DUR + 1.0) * SR)

music = np.zeros((2, N))
sfx = np.zeros((2, N))


def hz(note):
    """שם תו ('C4') -> תדר"""
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    n = note[0]
    sharp = 1 if '#' in note else 0
    octave = int(note[-1])
    midi = 12 * (octave + 1) + names[n] + sharp
    return 440.0 * 2 ** ((midi - 69) / 12)


def add(buf, sig, t, pan=0.0, gain=1.0):
    """מוסיף אות מונו ל-buf בסטריאו, החל מהזמן t (שניות)"""
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: N - i]
    l = gain * np.cos((pan + 1) * np.pi / 4)
    r = gain * np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l
    buf[1, i:i + len(sig)] += sig * r


def tt(d):
    return np.arange(int(d * SR)) / SR


def env_ad(d, a=0.005, decay=6.0):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * decay)
    return e


def lowpass(x, cutoff):
    """פילטר חד-קוטבי (קבוע או משתנה בזמן)"""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


# ---------- כלי נגינה ----------
def marimba(freq, d=0.7, amp=1.0):
    t = tt(d)
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 7)
         + 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 22)
         + 0.2 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 12))
    s *= np.minimum(1, t / 0.003)
    return s * amp


def bell(freq, d=1.2, amp=1.0):
    t = tt(d)
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.2)
         + 0.45 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 5.5)
         + 0.25 * np.sin(2 * np.pi * freq * 5.4 * t) * np.exp(-t * 9)
         + 0.2 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t * 4))
    s *= np.minimum(1, t / 0.002)
    return s * amp


def pad(freqs, d, amp=1.0, a=0.5, r=0.6):
    t = tt(d)
    s = np.zeros_like(t)
    for k, f in enumerate(freqs):
        det = 1 + 0.0035 * (k - len(freqs) / 2)
        s += np.sin(2 * np.pi * f * det * t) + 0.3 * np.sin(2 * np.pi * f * 2 * det * t + 1)
    s /= len(freqs)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / r)
    return s * e * amp


def bass(freq, d=0.5, amp=1.0):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
    e = np.minimum(1, t / 0.01) * np.exp(-t * 3.5)
    return s * e * amp


def kick(amp=1.0):
    t = tt(0.28)
    f = 48 + 90 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 13) * amp


def hat(amp=1.0, d=0.05):
    n = rng.standard_normal(int(d * SR))
    return highpass(n, 6000) * np.exp(-tt(d) * 70) * amp


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------- מוזיקת רקע ----------
BPM = 112
BEAT = 60 / BPM
BAR = 4 * BEAT
T_HAPPY = 5.5

# סצנה 1: מינורית, מהוססת (Am), נקישות פיציקטו לא סדירות + פד נמוך
def music_worry():
    add(music, pad([hz('A2'), hz('E3'), hz('A3'), hz('C4')], T_HAPPY + 0.6, 0.55, a=0.8, r=0.9), 0.0, pan=0)
    notes = [('E5', 0.5), ('D5', 1.05), ('C5', 1.5), ('B4', 2.2), ('A4', 2.75), ('C5', 3.5), ('B4', 3.95), ('A4', 4.6)]
    for n, tm in notes:
        add(music, marimba(hz(n), 0.8, 0.22), tm, pan=rng.uniform(-.5, .5))
        add(music, marimba(hz(n) * 0.5 * 1.012, 0.5, 0.1), tm + 0.012, pan=rng.uniform(-.5, .5))  # מעט "שבור"
    # שעון מתקתק עצבני
    for k in range(int(T_HAPPY / 0.5)):
        add(music, hat(0.25 + 0.1 * (k % 2), 0.025), 0.25 + k * 0.5, pan=0.3)
    add(music, bass(hz('A2'), 2.2, 0.35), 0.0)
    add(music, bass(hz('F2'), 2.2, 0.35), 2.7)


# סצנות 2-8: C – G – Am – F, מז'ורי, קצבי
PROG = [
    ('C', ['C3', 'E3', 'G3', 'C4', 'E4'], 'C2', ['C5', 'E5', 'G5', 'E5']),
    ('G', ['B2', 'D3', 'G3', 'B3', 'D4'], 'G2', ['B4', 'D5', 'G5', 'D5']),
    ('Am', ['A2', 'C3', 'E3', 'A3', 'C4'], 'A2', ['A4', 'C5', 'E5', 'C5']),
    ('F', ['F2', 'A2', 'C3', 'F3', 'A3'], 'F2', ['A4', 'C5', 'F5', 'C5']),
]


def music_happy(t_start, t_end):
    t = t_start
    bar = 0
    while t < t_end - 0.01:
        name, padn, bassn, arp = PROG[bar % 4]
        last = t + BAR >= t_end - 0.01
        add(music, pad([hz(n) for n in padn], BAR + 0.15, 0.30, a=0.12, r=0.3), t, pan=0)
        for b in range(4):
            tb = t + b * BEAT
            add(music, bass(hz(bassn), BEAT * 0.9, 0.55), tb)
            if b in (0, 2) or True:
                add(music, kick(0.5 if b % 2 == 0 else 0.28), tb)
            # 8 ר
            for h in range(2):
                add(music, hat(0.22 if h else 0.12), tb + h * BEAT / 2, pan=0.35 if h else -0.35)
            # ארפג'יו של מרימבה: 8 ו-16
            for q in range(2):
                n = arp[(b * 2 + q) % 4]
                add(music, marimba(hz(n), 0.6, 0.30 if q == 0 else 0.2), tb + q * BEAT / 2, pan=-0.3 + 0.6 * q)
        # תוספת בשמיעת קצב אחר בכל מקטע רביעי: מלודיה בפעמון
        if bar % 4 in (1, 3):
            mel = {1: ['D6', 'G6', 'B5'], 3: ['C6', 'A5', 'F5']}[bar % 4]
            for q, n in enumerate(mel):
                add(music, bell(hz(n), 1.0, 0.16), t + (1.0 + q * 0.5) * BEAT, pan=0.4)
        t += BAR
        bar += 1


# ---------- אפקטים ----------
PENT = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6']


def sfx_thud(t, v):
    d = 0.3
    tn = tt(d)
    f = 45 + 80 * np.exp(-tn * 35)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tn * 14)
    n = lowpass(noise(d), 700) * np.exp(-tn * 30) * 1.3
    add(sfx, (s * 1.0 + n) * v * 0.9, t, pan=rng.uniform(-.5, .5))


def sfx_pop(t, v, p):
    d = 0.25
    tn = tt(d)
    base = hz(PENT[int(p) % len(PENT)]) * 0.5
    f = base * (1 + 1.4 * np.exp(-tn * 45))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tn * 16)
    s += 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * np.exp(-tn * 25)
    add(sfx, s * v * 0.55, t, pan=rng.uniform(-.4, .4))


def sfx_whoosh(t, v):
    d = 0.6
    n = noise(d)
    tn = tt(d)
    cut = 300 + 5000 * np.sin(np.pi * tn / d) ** 2
    s = lowpass(n, cut)
    s = highpass(s, 250)
    e = np.sin(np.pi * tn / d) ** 1.5
    s = s * e
    # פאן שמאל->ימין
    for i, (a, b) in enumerate([(0.1, 0.9)]):
        pass
    sl, sr = s * np.linspace(1, 0.4, len(s)), s * np.linspace(0.4, 1, len(s))
    i = int(t * SR)
    sfx[0, i:i + len(s)] += sl * v * 0.55
    sfx[1, i:i + len(s)] += sr * v * 0.55


def sfx_shutter(t, v):
    for k, dt in enumerate([0.0, 0.075]):
        c = highpass(noise(0.05), 2500) * np.exp(-tt(0.05) * 150)
        th = np.sin(2 * np.pi * 180 * tt(0.05)) * np.exp(-tt(0.05) * 70)
        add(sfx, (c * (1.0 - 0.3 * k) + th * .6) * v * 0.8, t + dt, pan=0.1)


def sfx_tick(t, v, p):
    d = 0.03
    tn = tt(d)
    f = [1700, 2100, 2500][int(p) % 3]
    s = np.sign(np.sin(2 * np.pi * f * tn)) * 0.4 + np.sin(2 * np.pi * f * tn)
    s = lowpass(s, 5000) * np.exp(-tn * 120)
    add(sfx, s * v * 0.28, t, pan=rng.uniform(-.2, .2))


def sfx_ding(t, v, p):
    n = ['C6', 'E6', 'G6', 'C7'][int(p) % 4]
    add(sfx, bell(hz(n), 1.3, 0.5 * v), t, pan=(int(p) - 1) * 0.4)


def sfx_sparkle(t, v):
    for k, n in enumerate(['E6', 'G6', 'C7', 'E7', 'G7']):
        add(sfx, bell(hz(n), 0.8, 0.22 * v), t + k * 0.055, pan=-0.5 + k * 0.25)


def sfx_notif(t, v):
    add(sfx, bell(hz('G5'), 0.9, 0.55 * v), t, pan=0.2)
    add(sfx, bell(hz('D6'), 1.2, 0.55 * v), t + 0.16, pan=-0.2)
    # רטט קל
    tn = tt(0.35)
    s = np.sin(2 * np.pi * 70 * tn) * np.sin(np.pi * tn / 0.35) * 0.5
    add(sfx, s * v, t, pan=0)


def sfx_check(t, v, p):
    n = ['C5', 'E5', 'G5', 'C6'][int(p) % 4]
    f = hz(n)
    tn = tt(0.5)
    s = (np.sin(2 * np.pi * f * tn) + 0.4 * np.sin(2 * np.pi * f * 2 * tn)) * np.exp(-tn * 9)
    s += 0.25 * np.sin(2 * np.pi * f * 3 * tn) * np.exp(-tn * 14)
    add(sfx, s * v * 0.45, t, pan=0.1)


def sfx_click(t, v):
    c = highpass(noise(0.04), 1800) * np.exp(-tt(0.04) * 220)
    b = np.sin(2 * np.pi * 900 * tt(0.04)) * np.exp(-tt(0.04) * 90)
    add(sfx, (c * 0.7 + b * 0.6) * v * 0.7, t)


def sfx_success(t, v):
    for k, n in enumerate(['C5', 'E5', 'G5', 'C6']):
        add(sfx, bell(hz(n), 1.2, 0.34 * v), t + k * 0.07, pan=-0.3 + k * 0.2)
    add(sfx, bell(hz('E6'), 1.5, 0.25 * v), t + 0.32, pan=0.3)


def sfx_swell(t, v):
    """ריזר של 1.0 שנ' שנגמר בנקודה t, ואז פגיעה"""
    d = 1.0
    tn = tt(d)
    n = highpass(noise(d), 800)
    n = lowpass(n, 800 + 7000 * (tn / d) ** 2)
    s = n * (tn / d) ** 2 * 0.55
    f = 220 * 2 ** (tn / d * 2)
    s += np.sin(2 * np.pi * np.cumsum(f) / SR) * (tn / d) ** 2 * 0.25
    add(sfx, s * v, t - d, pan=0)
    # פגיעה + צ'ימס
    th = np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-tt(0.5) * 20)) / SR) * np.exp(-tt(0.5) * 7)
    add(sfx, th * 0.7 * v, t)
    for k, n_ in enumerate(['C6', 'E6', 'G6', 'C7']):
        add(sfx, bell(hz(n_), 1.4, 0.2 * v), t + 0.02 + k * 0.045, pan=-0.4 + k * 0.27)


def sfx_fanfare(t, v):
    chord = [hz(n) for n in ['C4', 'E4', 'G4', 'C5', 'E5']]
    tn = tt(1.6)
    s = np.zeros_like(tn)
    for f in chord:
        s += (np.sin(2 * np.pi * f * tn) + 0.5 * np.sin(2 * np.pi * f * 2 * tn) + 0.25 * np.sin(2 * np.pi * f * 3 * tn))
    s *= np.minimum(1, tn / 0.02) * np.exp(-tn * 2.4) / len(chord)
    add(sfx, s * 0.55 * v, t)
    cym = highpass(noise(1.2), 5000) * np.exp(-tt(1.2) * 3.0)
    add(sfx, cym * 0.3 * v, t, pan=0.2)
    for k, n in enumerate(['C6', 'E6', 'G6', 'C7', 'E7', 'G7', 'C8']):
        add(sfx, bell(hz(n), 1.2, 0.14 * v), t + 0.05 + k * 0.06, pan=-0.6 + k * 0.2)


HANDLERS = {
    'thud': lambda e: sfx_thud(e['t'], e['v']),
    'pop': lambda e: sfx_pop(e['t'], e['v'], e['p']),
    'whoosh': lambda e: sfx_whoosh(e['t'], e['v']),
    'shutter': lambda e: sfx_shutter(e['t'], e['v']),
    'tick': lambda e: sfx_tick(e['t'], e['v'], e['p']),
    'ding': lambda e: sfx_ding(e['t'], e['v'], e['p']),
    'sparkle': lambda e: sfx_sparkle(e['t'], e['v']),
    'notif': lambda e: sfx_notif(e['t'], e['v']),
    'check': lambda e: sfx_check(e['t'], e['v'], e['p']),
    'click': lambda e: sfx_click(e['t'], e['v']),
    'success': lambda e: sfx_success(e['t'], e['v']),
    'swell': lambda e: sfx_swell(e['t'], e['v']),
    'fanfare': lambda e: sfx_fanfare(e['t'], e['v']),
}


def reverb(buf, wet=0.16, d=1.4):
    n = int(d * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(buf)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 3.4)
        ir = lowpass(ir, 4500)
        ir[:int(0.012 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        size = 1 << (len(buf[ch]) + n).bit_length()
        conv = np.fft.irfft(np.fft.rfft(buf[ch], size) * np.fft.rfft(ir, size), size)[:buf.shape[1]]
        out[ch] = buf[ch] * (1 - wet) + conv * wet * 1.4
    return out


def main():
    music_worry()
    music_happy(T_HAPPY, DUR + 0.9)
    for e in events['events']:
        h = HANDLERS.get(e['type'])
        if h is None:
            print('unknown event', e['type'])
            continue
        h(e)

    # מוזיקה: מעט שקטה יותר מתחת לאפקטים; נשימה קטנה (דאקינג) על אירועים חזקים
    m = reverb(music, 0.12)
    s = reverb(sfx, 0.18)
    duck = np.ones(N)
    for e in events['events']:
        if e['type'] in ('fanfare', 'swell', 'notif'):
            i = int(e['t'] * SR)
            L = int(0.5 * SR)
            duck[i:i + L] *= np.linspace(0.6, 1, min(L, N - i))
    out = m * 0.8 * duck + s * 1.0

    # פייד אין/אאוט
    fi = int(0.25 * SR)
    out[:, :fi] *= np.linspace(0, 1, fi)
    end = int(DUR * SR)
    fo = int(1.4 * SR)
    out[:, end - fo:end] *= np.linspace(1, 0, fo)
    out[:, end:] = 0
    out = out[:, :end]
    out = np.tanh(out * 0.95) / np.tanh(0.95)
    out /= max(1e-9, np.max(np.abs(out))) / 0.89
    pcm = (out.T * 32767).astype('<i2')

    import wave
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', sys.argv[2], f'{DUR:.1f}s', 'events:', len(events['events']))


main()
