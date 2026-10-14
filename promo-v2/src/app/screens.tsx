import React from 'react';
import { C, SHADOW_CARD } from '../theme';
import { BottomNav, ChildChip, ConditionBar, FitDots, ItemCard, Pill, ProductShot, ScreenBg, SeasonBadge, Sheet, StatusBadge, FilterChip } from './ui';
import { DemoItem, GAPS, KIDS, KID_ORDER, SEASONS, STATUSES, ShopRow, Status, conditionLabel, itemById } from './data';
import { AppIcon } from '../components/Backdrop';

/* =====================================================================
   מסכי האפליקציה – שחזור נאמן של ClosetPage, ItemDetailPage, ChildrenPage,
   SeasonSwapPage ו-ShoppingPage. כל מסך הוא פונקציה טהורה של ה-props.
   ===================================================================== */

export const SAFE_TOP = 47;

/* ---------------- הארון ---------------- */

export const CLOSET_LAYOUT = {
  gridTop: 199,
  cardW: 173,
  rowH: 247,
  colX: [201, 16], // עמודה ימנית, שמאלית
  chips: [
    { id: null as string | null, label: '👨‍👩‍👧‍👦 כולם', w: 84 },
    { id: 'yehuda', label: '👦 יהודה', w: 90 },
    { id: 'shira', label: '👧 שירה', w: 84 },
    { id: 'moishi', label: '🧒 מוישי', w: 88 },
    { id: 'general', label: '🏠 כללי', w: 80 },
  ],
  chipsY: 162,
  filterBtn: { x: 140, y: 112 },
};

/** מרכז הצ'יפ ה-i בשורת הילדים (RTL – מתחיל מימין) */
export function chipCenter(i: number) {
  let right = 374;
  for (let k = 0; k < i; k++) right -= CLOSET_LAYOUT.chips[k].w + 8;
  return { x: right - CLOSET_LAYOUT.chips[i].w / 2, y: CLOSET_LAYOUT.chipsY };
}

export function cardPos(idx: number, scroll = 0) {
  const col = idx % 2;
  const row = Math.floor(idx / 2);
  return { x: CLOSET_LAYOUT.colX[col], y: CLOSET_LAYOUT.gridTop + row * CLOSET_LAYOUT.rowH - scroll, w: CLOSET_LAYOUT.cardW };
}

export interface CardAnim {
  o: number;
  s: number;
  dx?: number;
  dy?: number;
  highlight?: number;
}

export function ClosetScreen({
  ids,
  scroll = 0,
  activeChild = null,
  chipPress,
  filterCount = 0,
  filterPress = 0,
  cardAnim,
  countLabel,
  fabPress = 0,
  bottomNav = true,
  title = 'הארון שלנו 👕',
}: {
  ids: string[];
  scroll?: number;
  activeChild?: string | null;
  chipPress?: { i: number; p: number };
  filterCount?: number;
  filterPress?: number;
  cardAnim?: (id: string, idx: number) => CardAnim;
  countLabel?: string;
  fabPress?: number;
  bottomNav?: boolean;
  title?: string;
}) {
  const L = CLOSET_LAYOUT;
  return (
    <ScreenBg>
      {/* רשת הכרטיסים */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {ids.map((id, idx) => {
          const p = cardPos(idx, scroll);
          if (p.y > 900 || p.y < -260) return null;
          const a = cardAnim ? cardAnim(id, idx) : { o: 1, s: 1 };
          if (a.o <= 0.001) return null;
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: p.x + (a.dx ?? 0),
                top: p.y + (a.dy ?? 0),
                opacity: a.o,
                transform: `scale(${a.s})`,
                transformOrigin: '50% 40%',
              }}
            >
              <ItemCard item={itemById(id)} width={L.cardW} highlight={a.highlight} />
            </div>
          );
        })}
      </div>
      {/* כותרת דביקה */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 191, background: 'rgba(250,247,242,0.96)', zIndex: 10 }}>
        <div style={{ position: 'absolute', top: SAFE_TOP, left: 16, right: 16, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{title}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: C.g500 }}>{countLabel ?? `${ids.length} פריטים`}</span>
            <span style={{ fontSize: 18, color: C.g400 }}>⚙️</span>
          </span>
        </div>
        <div style={{ position: 'absolute', top: 91, left: 16, right: 16, height: 42, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, borderRadius: 16, border: `1px solid ${C.g200}`, background: C.card, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: C.g400, gap: 8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span>🔍</span> חיפוש: שם, תיאור, חנות...
          </div>
          <div
            style={{
              position: 'relative',
              borderRadius: 16,
              border: `1px solid ${C.g200}`,
              background: C.card,
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: C.g600,
              transform: `scale(${1 - filterPress * 0.06})`,
            }}
          >
            סינון
            {filterCount > 0 && (
              <span style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: 99, background: C.amber500, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {filterCount}
              </span>
            )}
          </div>
          <div style={{ borderRadius: 16, border: `1px solid ${C.g200}`, background: C.card, padding: '0 8px', display: 'flex', alignItems: 'center', fontSize: 14, color: C.g600 }}>
            חדש בארון ⌄
          </div>
        </div>
        <div style={{ position: 'absolute', top: 145, right: 16, left: -40, display: 'flex', gap: 8, direction: 'rtl' }}>
          {L.chips.map((c, i) => {
            const kid = c.id && KIDS[c.id];
            return (
              <span key={i} style={{ width: c.w, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <ChildChip label={c.label} color={kid ? kid.color : undefined} active={activeChild === c.id} press={chipPress?.i === i ? chipPress.p : 0} />
              </span>
            );
          })}
        </div>
      </div>
      {bottomNav && <BottomNav active={0} fabPress={fabPress} />}
    </ScreenBg>
  );
}

/* ---------------- סינון ---------------- */

export function FilterSheetView({ p, winter, size56, press }: { p: number; winter: boolean; size56: boolean; press?: { k: string; p: number } }) {
  const pr = (k: string) => (press?.k === k ? press.p : 0);
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: C.g500 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  );
  return (
    <Sheet p={p} title="סינון הארון">
      <Section title="עונה">
        <FilterChip active={winter} press={pr('winter')}>❄️ חורף</FilterChip>
        <FilterChip active={false}>☀️ קיץ</FilterChip>
        <FilterChip active={false}>🍂 עונות מעבר</FilterChip>
        <FilterChip active={false}>🌈 כל השנה</FilterChip>
      </Section>
      <Section title="סטטוס">
        {(['active', 'waiting', 'to_buy', 'outgrown'] as Status[]).map((s) => (
          <FilterChip key={s} active={false}>
            {STATUSES[s].emoji} {STATUSES[s].label}
          </FilterChip>
        ))}
      </Section>
      <Section title="מידה">
        {['3-4', '5-6', '6-7', '7-8', '30'].map((s) => (
          <FilterChip key={s} active={s === '5-6' && size56} press={s === '5-6' ? pr('size') : 0}>
            {s}
          </FilterChip>
        ))}
      </Section>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <span style={{ flex: 1, borderRadius: 16, background: C.amber500, color: '#fff', padding: '12px 0', textAlign: 'center', fontWeight: 600, transform: `scale(${1 - pr('show') * 0.04})` }}>הצגת תוצאות</span>
        <span style={{ borderRadius: 16, background: C.g100, color: C.g600, padding: '12px 20px', fontWeight: 600 }}>איפוס</span>
      </div>
    </Sheet>
  );
}
/** מיקומי לחיצה בגיליון הסינון (במסך) – נבדק מול רינדור */
export const FILTER_TAPS = { winter: { x: 335, y: 492 }, size: { x: 292, y: 712 }, show: { x: 250, y: 782 } };

/* ---------------- עמוד פריט ---------------- */

export function DetailScreen({
  item,
  childId,
  condition,
  status,
  gallery = 0,
  btnPress,
  rowFlash,
}: {
  item: DemoItem;
  childId?: string | null;
  condition?: number;
  status?: Status;
  gallery?: number;
  btnPress?: { k: string; p: number };
  rowFlash?: { k: string; p: number };
}) {
  const kid = (childId === undefined ? item.child : childId) ? KIDS[(childId === undefined ? item.child : childId)!] : null;
  const cond = condition ?? item.condition ?? null;
  const st = status ?? item.status ?? 'active';
  const pr = (k: string) => (btnPress?.k === k ? btnPress.p : 0);
  const flash = (k: string) => (rowFlash?.k === k ? rowFlash.p : 0);
  const rows: [string, string, string][] = [
    ['child', 'שיוך', kid ? `${kid.emoji} ${kid.name}` : '🏠 כללי'],
    ['size', 'מידה / גיל', item.size],
    ['fit', '📏 גזרה', item.fit === -1 ? 'גזרה קטנה' : item.fit === 1 ? 'גזרה גדולה' : 'במידה'],
    ['cond', '🧵 מצב הבגד', cond != null ? `${cond}/10 · ${conditionLabel(cond)}` : 'לחצו לדירוג'],
    ['loc', '📍 מיקום אחסון', 'ארון חדר ילדים'],
  ];
  const nImg = 4;
  return (
    <ScreenBg>
      <div style={{ position: 'relative', width: 390, height: 390, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', direction: 'ltr', transform: `translateX(${gallery * 390}px)` }}>
          {/* בגלריה RTL התמונה הבאה נכנסת משמאל */}
          {[0, 1].map((k) => (
            <div key={k} style={{ position: 'absolute', left: -k * 390, width: 390, height: 390 }}>
              <ProductShot kind={item.kind} color={item.color} accent={item.accent} bg={k === 0 ? item.bg : '#f5f5f4'} size={k === 0 ? 300 : 380} />
            </div>
          ))}
        </div>
        <span style={{ position: 'absolute', top: SAFE_TOP + 8, right: 16, width: 40, height: 40, borderRadius: 99, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>→</span>
        <span style={{ position: 'absolute', top: SAFE_TOP + 8, left: 16, borderRadius: 99, background: 'rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: '8px 16px', fontSize: 14, fontWeight: 700 }}>✏️ עריכה</span>
        <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {Array.from({ length: nImg }, (_, i) => {
            const act = Math.max(0, 1 - Math.abs(i - gallery));
            return <span key={i} style={{ height: 8, width: 8 + 12 * act, borderRadius: 99, background: `rgba(255,255,255,${0.6 + 0.4 * act})`, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />;
          })}
        </div>
      </div>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ marginBottom: 4, display: 'flex', gap: 8 }}>
          <SeasonBadge season={item.season} />
          <span style={{ transform: `scale(${1 - pr('status') * 0.1})`, display: 'inline-block' }}>
            <StatusBadge status={st} />
          </span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{item.name}</div>
        <div style={{ marginTop: 14, borderRadius: 16, background: C.card, padding: '0 16px', boxShadow: SHADOW_CARD }}>
          {rows.map(([k, label, value], i) => (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                fontSize: 14,
                borderTop: i ? `1px solid ${C.g100}` : undefined,
                background: flash(k) ? `rgba(254,243,199,${flash(k)})` : undefined,
                margin: '0 -16px',
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              <span style={{ color: C.g500 }}>{label}</span>
              <span style={{ fontWeight: 600, color: k === 'cond' ? C.amber600 : C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                {value}
                {k === 'size' && <FitDots value={item.fit} big />}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['status', '🔁', 'שינוי סטטוס'],
            ['transfer', '🎁', 'העברה לילד אחר'],
          ].map(([k, e, l]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, background: C.card, padding: '14px 0', fontSize: 14, fontWeight: 700, boxShadow: SHADOW_CARD, transform: `scale(${1 - pr(k) * 0.05})` }}>
              <span style={{ fontSize: 18 }}>{e}</span>
              {l}
            </span>
          ))}
        </div>
      </div>
    </ScreenBg>
  );
}
export const DETAIL_TAPS = { transfer: { x: 106, y: 731 }, status: { x: 298, y: 731 }, statusBadge: { x: 268, y: 418 }, cond: { x: 200, y: 625 } };

/** גיליון "למי להעביר את הפריט?" */
export function TransferSheet({ p, exclude, press, title, swap }: { p: number; exclude: string; press?: { id: string; p: number }; title?: string; swap?: boolean }) {
  return (
    <Sheet p={p} title={title ?? 'למי להעביר את הפריט?'}>
      {!swap && <div style={{ marginBottom: 12, fontSize: 14, color: C.g500 }}>מושלם לבגדים שעוברים בין אחים 🎁 הפריט יסומן ״בארון״ אצל היעד החדש.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {KID_ORDER.filter((k) => k !== exclude).map((k) => {
          const kid = KIDS[k];
          const pp = press?.id === k ? press.p : 0;
          return (
            <span
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                border: `2px solid ${pp > 0 ? C.amber400 : C.g100}`,
                background: C.card,
                padding: '12px 16px',
                fontWeight: 600,
                color: C.g700,
                transform: `scale(${1 - pp * 0.03})`,
              }}
            >
              <span style={{ width: 36, height: 36, borderRadius: 99, background: `${kid.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{kid.emoji}</span>
              {kid.name}
            </span>
          );
        })}
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, border: `2px solid ${C.g100}`, background: C.card, padding: '12px 16px', fontWeight: 600, color: C.g700 }}>
          <span style={{ width: 36, height: 36, borderRadius: 99, background: C.g100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</span>
          {swap ? 'לכללי (בהמתנה)' : 'ללא שיוך (כללי)'}
        </span>
      </div>
    </Sheet>
  );
}

/** גיליון "מה מצב הבגד?" */
export function ConditionSheet({ p, value, sub, press, skipPress = 0, skip = false }: { p: number; value: number; sub: string; press?: number; skipPress?: number; skip?: boolean }) {
  return (
    <Sheet p={p} title={undefined}>
      <div style={{ marginBottom: 4, fontSize: 18, fontWeight: 700 }}>מה מצב הבגד? 🧵</div>
      <div style={{ marginBottom: 12, fontSize: 14, color: C.g500 }}>{sub}</div>
      <ConditionBar value={value} press={press} />
      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: C.g600 }}>{value >= 1 ? `${Math.round(value)}/10 · ${conditionLabel(Math.round(value))}` : 'לא דורג עדיין'}</div>
      <div style={{ marginTop: 16, borderRadius: 16, background: skip ? C.g100 : C.amber500, color: skip ? C.g600 : '#fff', padding: '12px 0', textAlign: 'center', fontWeight: 600, transform: `scale(${1 - skipPress * 0.04})` }}>
        {skip ? 'דילוג – בלי לעדכן' : 'סגירה'}
      </div>
    </Sheet>
  );
}

/* ---------------- ילדים ---------------- */

export function ChildrenScreen({ alertP, rowPress = 0 }: { alertP: number; rowPress?: number }) {
  const sweater = itemById('i3');
  const kidCard = (k: string, active: number, waiting: number, w: number, s: number) => {
    const kid = KIDS[k];
    return (
      <div key={k} style={{ overflow: 'hidden', borderRadius: 16, background: C.card, boxShadow: SHADOW_CARD }}>
        <div style={{ height: 6, background: kid.color }} />
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 48, height: 48, borderRadius: 99, background: `${kid.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{kid.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{kid.name}</div>
              <div style={{ fontSize: 14, color: C.g500 }}>גיל: {kid.age}</div>
            </div>
            <span style={{ borderRadius: 12, background: C.g50, padding: '6px 12px', fontSize: 14, fontWeight: 600, color: C.g500 }}>עריכה</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 500 }}>
            <span style={{ borderRadius: 99, background: C.emerald50, color: C.emerald700, padding: '4px 10px' }}>✅ {active} בארון</span>
            {waiting > 0 && <span style={{ borderRadius: 99, background: C.blue50, color: C.blue700, padding: '4px 10px' }}>📦 {waiting} שמורים לגדילה</span>}
            <span style={{ borderRadius: 99, background: SEASONS.winter.chipBg, color: SEASONS.winter.chipFg, padding: '4px 10px' }}>❄️ {w} לחורף</span>
            <span style={{ borderRadius: 99, background: SEASONS.summer.chipBg, color: SEASONS.summer.chipFg, padding: '4px 10px' }}>☀️ {s} לקיץ</span>
          </div>
        </div>
      </div>
    );
  };
  const ah = 152 * alertP;
  return (
    <ScreenBg>
      <div style={{ position: 'absolute', top: SAFE_TOP, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 24, fontWeight: 800 }}>הילדים שלנו 🧒</span>
        <span style={{ borderRadius: 16, background: C.amber500, color: '#fff', padding: '8px 16px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 6px rgba(245,158,11,0.3)' }}>+ ילד/ה</span>
      </div>
      <div style={{ position: 'absolute', top: 104, left: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: ah, overflow: 'hidden', opacity: Math.min(1, alertP * 1.5) }}>
          <div style={{ borderRadius: 16, border: `1px solid ${C.rose100}`, background: C.rose50, padding: 16, transform: `scale(${0.96 + 0.04 * alertP})` }}>
            <div style={{ marginBottom: 4, fontSize: 14, fontWeight: 700, color: C.rose700 }}>⏰ שווה לבדוק – אולי כבר קטנים</div>
            <div style={{ marginBottom: 12, fontSize: 12, color: 'rgba(225,29,72,0.8)' }}>לפי גיל הילד מול המידה שרשומה על הבגד</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: C.card, padding: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transform: `scale(${1 - rowPress * 0.03})` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{sweater.name}</div>
                <div style={{ fontSize: 12, color: C.g500 }}>👦 יהודה · מידה 6-7 · בקרוב קטן</div>
              </div>
              <span style={{ borderRadius: 12, background: C.rose100, color: C.rose700, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>📏 קטן</span>
              <span style={{ fontSize: 14, color: C.g400, padding: '0 4px' }}>✕</span>
            </div>
          </div>
        </div>
        {kidCard('yehuda', 23, 0, 9, 11)}
        {kidCard('shira', 26, 3, 12, 10)}
        {kidCard('moishi', 19, 6, 8, 9)}
      </div>
      <BottomNav active={3} />
    </ScreenBg>
  );
}
export const CHILDREN_TAPS = { row: { x: 230, y: 214 } };
export const TRANSFER_TAPS = { shira: { x: 200, y: 637 }, moishi: { x: 200, y: 709 } };
/** גיליון מצב הבגד (כשנפתח מעל מסך מלא): כפתור n וכפתור סגירה/דילוג */
export const COND_TAPS = { n: (n: number) => ({ x: 35 + (n - 1) * 35.4, y: 714 }), close: { x: 195, y: 792 } };

/* ---------------- החלפת עונה ---------------- */

export function SwapScreen({
  index,
  total,
  item,
  out,
  inP,
  press,
}: {
  index: number;
  total: number;
  item: DemoItem;
  /** 0..1 יציאת הכרטיס הקודם; dir: 1 שמאלה */
  out?: { item: DemoItem; p: number; dir: number };
  inP: number;
  press?: { k: 'outgrown' | 'transfer' | 'keep'; p: number };
}) {
  const card = (it: DemoItem, style: React.CSSProperties) => {
    const kid = it.child ? KIDS[it.child] : null;
    return (
      <div style={{ position: 'absolute', left: 16, right: 16, top: 150, borderRadius: 24, background: C.card, boxShadow: SHADOW_CARD, overflow: 'hidden', ...style }}>
        <div style={{ width: '100%', height: 358 }}>
          <ProductShot kind={it.kind} color={it.color} accent={it.accent} bg={it.bg} size={290} />
        </div>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{it.name}</div>
          <div style={{ marginTop: 4, fontSize: 14, color: C.g500 }}>
            {kid ? `${kid.emoji} ${kid.name}` : '🏠 כללי'} · מידה {it.size} · {SEASONS[it.season].emoji} {SEASONS[it.season].label}
            {it.condition != null ? ` · 🧵 ${it.condition}/10` : ''}
          </div>
        </div>
      </div>
    );
  };
  const pr = (k: string) => (press?.k === k ? press.p : 0);
  const btn = (k: 'outgrown' | 'transfer' | 'keep', emoji: string, label: string, bg: string, fg: string) => (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        borderRadius: 16,
        padding: '14px 0',
        fontWeight: 700,
        background: bg,
        color: fg,
        boxShadow: SHADOW_CARD,
        transform: `scale(${1 - pr(k) * 0.06})`,
      }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 14 }}>{label}</span>
    </span>
  );
  return (
    <ScreenBg>
      <div style={{ position: 'absolute', top: SAFE_TOP + 6, left: 16, right: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22 }}>✕</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.g500, direction: 'ltr' }}>
            {index + 1} / {total}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.g500 }}>דילוג</span>
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: C.g200, overflow: 'hidden', direction: 'rtl' }}>
          <div style={{ height: '100%', borderRadius: 99, background: C.amber500, width: `${(index / total) * 100}%` }} />
        </div>
      </div>
      {out && out.p < 1 && card(out.item, { transform: `translateX(${-out.dir * out.p * 460}px) rotate(${-out.dir * out.p * 14}deg)`, opacity: 1 - out.p * 0.6 })}
      {card(item, { transform: `scale(${0.9 + 0.1 * inP}) translateY(${(1 - inP) * 30}px)`, opacity: inP })}
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {btn('outgrown', '📏', 'קטן מדי', C.rose100, C.rose700)}
        {btn('transfer', '🎁', 'עובר הלאה', C.blue100, C.blue700)}
        {btn('keep', '✅', 'נשאר', C.emerald100, C.emerald700)}
      </div>
    </ScreenBg>
  );
}
/** בגריד RTL: הכפתור הראשון (קטן מדי) מימין */
export const SWAP_TAPS = { outgrown: { x: 318, y: 758 }, transfer: { x: 195, y: 758 }, keep: { x: 72, y: 758 } };
export const SHOP_TAPS = { addGap: { x: 108, y: 552 }, check: (row: number) => ({ x: 343, y: 152 + row * 74 }), closetTab: { x: 351, y: 806 } };

/* ---------------- רשימת קניות ---------------- */

export function ShoppingScreen({
  rows,
  rowAnim,
  gapsShown,
  addPress = 0,
  checkPress,
  bounce = 0,
}: {
  rows: ShopRow[];
  rowAnim?: (id: string) => { h: number; o: number; s: number; x?: number; checked?: number };
  gapsShown: string[];
  addPress?: number;
  checkPress?: { id: string; p: number };
  bounce?: number;
}) {
  const total = rows.reduce((a, r) => a + r.price * (r.qty ?? 1), 0);
  return (
    <ScreenBg>
      <div style={{ position: 'absolute', top: SAFE_TOP, left: 16, right: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 800 }}>לקנות 🛒</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <span style={{ borderRadius: 16, background: C.card, padding: '8px 14px', fontSize: 14, fontWeight: 700, boxShadow: SHADOW_CARD }}>📤 שיתוף</span>
            <span style={{ borderRadius: 16, background: C.amber500, color: '#fff', padding: '8px 16px', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 6px rgba(245,158,11,0.3)' }}>+ הוספה</span>
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: C.g500 }}>
          {rows.filter((r) => (rowAnim ? rowAnim(r.id).h > 0.5 : true)).length} פריטים ברשימה · סה״כ משוער: ₪{total}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 120, left: 16, right: 16, display: 'flex', flexDirection: 'column' }}>
        {rows.map((r) => {
          const a = rowAnim ? rowAnim(r.id) : { h: 1, o: 1, s: 1 };
          const kid = KIDS[r.child];
          const cp = checkPress?.id === r.id ? checkPress.p : 0;
          const checked = a.checked ?? 0;
          return (
            <div key={r.id} style={{ height: 74 * a.h, overflow: 'visible' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 16,
                  background: C.card,
                  padding: 12,
                  boxShadow: SHADOW_CARD,
                  opacity: a.o,
                  transform: `translateX(${a.x ?? 0}px) scale(${a.s})`,
                  height: 64,
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: 99,
                    border: `2px solid ${checked > 0.5 ? C.emerald500 : C.emerald300}`,
                    background: checked > 0.5 ? C.emerald500 : C.emerald50,
                    color: checked > 0.5 ? '#fff' : C.emerald500,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${1 - cp * 0.12 + checked * 0.08 * Math.sin(checked * Math.PI)})`,
                  }}
                >
                  ✓
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {r.name}
                    {r.qty && r.qty > 1 ? <span style={{ marginRight: 6, fontSize: 14, color: C.g400 }}>×{r.qty}</span> : null}
                  </div>
                  <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.g500 }}>
                    <span style={{ borderRadius: 99, padding: '2px 8px', fontWeight: 500, background: `${kid.color}22`, color: kid.color }}>
                      {kid.emoji} {kid.name}
                    </span>
                    <span>מידה {r.size}</span>
                    <span>{r.type}</span>
                    <span>{SEASONS[r.season].emoji}</span>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.g600 }}>{r.price ? `₪${r.price * (r.qty ?? 1)}` : ''}</span>
              </div>
            </div>
          );
        })}
        <div style={{ paddingTop: 6, textAlign: 'center', fontSize: 12, color: C.g400 }}>לחיצה על ✓ מעבירה את הפריט לארון · לחיצה על השם פותחת לעריכה</div>
        <div style={{ marginTop: 16, borderRadius: 16, border: `1px solid ${C.amber200}`, background: C.amber50, padding: 16 }}>
          <div style={{ marginBottom: 4, fontSize: 14, fontWeight: 700, color: C.amber800 }}>💡 אולי חסר לחורף?</div>
          <div style={{ marginBottom: 12, fontSize: 12, color: 'rgba(180,83,9,0.8)' }}>פריטים בסיסיים שלא מצאנו בארון · לחיצה על + מוסיפה לרשימה</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GAPS.filter((g) => gapsShown.includes(g.key)).map((g, i) => {
              const kid = KIDS[g.child];
              return (
                <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: C.card, padding: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <span style={{ flex: 1, fontSize: 14 }}>
                    אין ל<b>{kid.name}</b> {kid.emoji} — <b>{g.type}</b>
                  </span>
                  <span style={{ borderRadius: 12, background: C.amber500, color: '#fff', padding: '6px 12px', fontSize: 12, fontWeight: 700, transform: `scale(${1 - (i === 0 ? addPress : 0) * 0.1})` }}>+ לרשימה</span>
                  <span style={{ fontSize: 14, color: C.g400, padding: '0 4px' }}>✕</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <BottomNav active={1} bounce={bounce} />
    </ScreenBg>
  );
}

/* ---------------- מסך פתיחה ---------------- */

export function SplashScreen({ p }: { p: number }) {
  return (
    <ScreenBg bg="linear-gradient(180deg,#fffaf0 0%, #fdf1dc 100%)">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <div style={{ transform: `scale(${0.6 + 0.4 * p})`, opacity: p }}>
          <AppIcon size={120} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>ארון המשפחה</div>
      </div>
    </ScreenBg>
  );
}
