import React from 'react';
import { C, SHADOW_CARD, SHADOW_SHEET } from '../theme';
import { Garment, GarmentKind } from '../components/Garment';
import { DemoItem, KIDS, SEASONS, STATUSES, Season, Status } from './data';

/**
 * שחזור רכיבי הממשק של האפליקציה (ItemCard, BottomNav, FitDots, ConditionPicker, Modal...)
 * לפי הקוד שב-src/components ו-src/pages – אותם צבעים, ריווחים, רדיוסים וטקסטים.
 * יחידות: פיקסלים לוגיים של מסך 390×844.
 */

export function ProductShot({ kind, color, accent, bg, size }: { kind: GarmentKind; color: string; accent?: string; bg: string; size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(circle at 50% 38%, #ffffff 0%, ${bg} 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', bottom: '9%', width: '56%', height: '7%', borderRadius: '50%', background: 'rgba(0,0,0,0.08)', filter: 'blur(4px)' }} />
      <Garment kind={kind} color={color} accent={accent} size={size} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.12))' }} />
    </div>
  );
}

export function FitDots({ value, big }: { value: -1 | 0 | 1 | null; big?: boolean }) {
  if (value == null) return null;
  const d = big ? 8 : 6;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, direction: 'ltr' }}>
      {[-1, 0, 1].map((f) => (
        <span key={f} style={{ width: d, height: d, borderRadius: 99, background: f === value ? C.amber500 : C.g300 }} />
      ))}
    </span>
  );
}

export function ItemCard({ item, width, highlight = 0, alert = 0 }: { item: DemoItem; width: number; highlight?: number; alert?: number }) {
  const child = item.child ? KIDS[item.child] : null;
  const season = SEASONS[item.season];
  return (
    <div
      style={{
        width,
        borderRadius: 16,
        background: C.card,
        boxShadow: highlight > 0 ? `0 0 0 ${3 * highlight}px ${C.amber400}, ${SHADOW_CARD}` : SHADOW_CARD,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', width, height: width, background: C.g50 }}>
        <ProductShot kind={item.kind} color={item.color} accent={item.accent} bg={item.bg} size={width * 0.78} />
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
          }}
        >
          {season.emoji}
        </span>
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          {item.qty && item.qty > 1 && <Pill bg="rgba(0,0,0,0.6)">×{item.qty}</Pill>}
          {(item.outgrow || alert > 0) && (
            <span style={{ transform: `scale(${item.outgrow && alert === 0 ? 1 : alert})`, transformOrigin: 'left top' }}>
              <Pill bg="rgba(244,63,94,0.9)">⏰</Pill>
            </span>
          )}
        </div>
        {child && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: child.color }} />}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
        <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, fontSize: 12, color: C.g500 }}>
          <span style={{ whiteSpace: 'nowrap' }}>{child ? `${child.emoji} ${child.name}` : 'כללי'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, background: C.g100, padding: '2px 6px', fontWeight: 500, color: C.g600 }}>
            {item.size}
            <FitDots value={item.fit} />
          </span>
        </div>
      </div>
    </div>
  );
}

export function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <span style={{ borderRadius: 99, background: bg, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', display: 'inline-block' }}>{children}</span>;
}

export function ChildChip({ label, color, active, press = 0 }: { label: string; color?: string; active: boolean; press?: number }) {
  return (
    <span
      style={{
        flexShrink: 0,
        borderRadius: 99,
        border: `1px solid ${active ? 'transparent' : C.g200}`,
        padding: '6px 14px',
        fontSize: 14,
        fontWeight: 600,
        background: active ? color ?? C.ink : C.card,
        color: active ? '#fff' : C.g600,
        transform: `scale(${1 - press * 0.05})`,
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}

export function SeasonBadge({ season }: { season: Season }) {
  const s = SEASONS[season];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 99, padding: '2px 8px', fontSize: 12, fontWeight: 500, background: s.chipBg, color: s.chipFg }}>
      {s.emoji} {s.label}
    </span>
  );
}

export function StatusBadge({ status, scale = 1 }: { status: Status; scale?: number }) {
  const s = STATUSES[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 99,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 500,
        background: s.bg,
        color: s.fg,
        transform: `scale(${scale})`,
      }}
    >
      {s.emoji} {s.label}
    </span>
  );
}

/** ConditionPicker – עשרה כפתורים, value עשוי להיות שברי (לאנימציית מילוי) */
export function ConditionBar({ value, press }: { value: number; press?: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, direction: 'ltr' }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const on = n <= value;
        const bg = on ? (n >= 8 ? C.emerald500 : n >= 5 ? C.amber500 : C.rose500) : C.g100;
        return (
          <span
            key={n}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              background: bg,
              color: on ? '#fff' : C.g400,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: press !== undefined && n === Math.round(value) ? `scale(${1 - press * 0.12})` : undefined,
            }}
          >
            {n === 10 ? '✨' : n}
          </span>
        );
      })}
    </div>
  );
}

const TABS = [
  { label: 'הארון', icon: '👕' },
  { label: 'לקנות', icon: '🛒' },
  { label: 'הוספה', icon: '+' },
  { label: 'ילדים', icon: '🧒' },
  { label: 'סיכום', icon: '📊' },
];

/** BottomNav – active: אינדקס הלשונית הפעילה; bounce: קפיצה של לשונית "הארון" */
export function BottomNav({ active, bounce = 0, fabPress = 0 }: { active: number; bounce?: number; fabPress?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: `1px solid ${C.g100}`,
        background: 'rgba(255,255,255,0.95)',
        paddingBottom: 26,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', direction: 'rtl' }}>
        {TABS.map((t, i) =>
          t.icon === '+' ? (
            <span
              key={i}
              style={{
                marginTop: -20,
                width: 56,
                height: 56,
                borderRadius: 99,
                background: C.amber500,
                color: '#fff',
                fontSize: 30,
                fontWeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 15px -3px rgba(245,158,11,0.4)',
                transform: `scale(${1 - fabPress * 0.08})`,
              }}
            >
              +
            </span>
          ) : (
            <span
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 500,
                color: i === active ? C.amber600 : C.g400,
                transform: i === 0 ? `translateY(${-bounce * 6}px) scale(${1 + bounce * 0.18})` : undefined,
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
              {t.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/** Modal / bottom sheet של האפליקציה. p: 0..1 כניסה */
export function Sheet({ p, title, children, height }: { p: number; title?: string; children: React.ReactNode; height?: number }) {
  if (p <= 0.001) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.5 * p})` }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: C.card,
          padding: '20px 20px 32px',
          boxShadow: SHADOW_SHEET,
          transform: `translateY(${(1 - p) * 105}%)`,
          direction: 'rtl',
        }}
      >
        <div style={{ margin: '0 auto 12px', width: 40, height: 6, borderRadius: 99, background: C.g200 }} />
        {title && <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 700, color: C.ink }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function FilterChip({ active, children, press = 0 }: { active: boolean; children: React.ReactNode; press?: number }) {
  return (
    <span
      style={{
        borderRadius: 99,
        border: `1px solid ${active ? C.amber500 : C.g200}`,
        background: active ? C.amber500 : C.card,
        color: active ? '#fff' : C.g600,
        padding: '6px 12px',
        fontSize: 14,
        fontWeight: 500,
        display: 'inline-block',
        transform: `scale(${1 - press * 0.06})`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function ScreenBg({ children, bg = C.cream }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: bg, direction: 'rtl', fontFamily: 'Heebo, sans-serif', color: C.ink, overflow: 'hidden' }}>
      {children}
    </div>
  );
}
