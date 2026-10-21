import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TitleBlock } from '../components/Headline';
import { Phone, Tap, lerpPose, PHONE_W, PHONE_H, SCREEN_W, SCREEN_H } from '../components/Phone';
import { SHOP_TAPS, ShoppingScreen, SwapScreen } from '../app/screens';
import { ProductShot } from '../app/ui';
import { GAP_ROW, KIDS, SHOP_LIST, itemById } from '../app/data';
import { Garment } from '../components/Garment';
import { FPS, beat, copy, scene } from '../config';
import { clamp, ease, easeIn, easeInOut, qbez, spr } from '../anim';
import { C, FONT } from '../theme';
import { POSE } from './shared';

const press = (f: number, at: number) => (f < at ? 0 : f < at + 4 ? (f - at) / 4 : Math.max(0, 1 - (f - at - 4) / 6));

/** כרטיס "חסר לעונה" לצד הטלפון */
function MissingCard({ x, y, p, kind, color, accent, label, kid, status }: { x: number; y: number; p: number; kind: any; color: string; accent?: string; label: string; kid: string; status: 'missing' | 'added' }) {
  if (p <= 0.001) return null;
  const k = KIDS[kid];
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 165,
        top: y - 190,
        width: 330,
        borderRadius: 34,
        background: '#fff',
        boxShadow: '0 24px 50px rgba(80,50,10,0.16), 0 4px 12px rgba(80,50,10,0.08)',
        overflow: 'hidden',
        transform: `scale(${p})`,
        opacity: clamp(p * 1.5),
        direction: 'rtl',
        fontFamily: FONT,
      }}
    >
      <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', background: status === 'missing' ? 'repeating-linear-gradient(135deg,#fffaf0 0 18px,#fdf3e1 18px 36px)' : '#fffbeb', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 18, borderRadius: 24, border: `3px dashed ${status === 'missing' ? C.amber300 : 'transparent'}` }} />
        <div style={{ opacity: status === 'missing' ? 0.45 : 1, filter: status === 'missing' ? 'grayscale(0.4)' : undefined }}>
          <Garment kind={kind} color={color} accent={accent} size={180} />
        </div>
      </div>
      <div style={{ padding: '18px 24px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: C.ink }}>{label}</span>
          <span style={{ borderRadius: 99, background: `${k.color}22`, color: k.color, padding: '4px 16px', fontSize: 26, fontWeight: 700 }}>
            {k.emoji} {k.name}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          {status === 'missing' ? (
            <span style={{ borderRadius: 99, background: C.amber100, color: C.amber800, padding: '6px 18px', fontSize: 26, fontWeight: 700 }}>{copy('shopping', 'missing')} לחורף</span>
          ) : (
            <span style={{ borderRadius: 99, background: C.emerald100, color: C.emerald800, padding: '6px 18px', fontSize: 26, fontWeight: 700 }}>✓ ברשימת הקניות</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** סצנה 6 – קניות חכמות: מוסיפים חוסר לרשימה, מסמנים שנקנה והפריט עובר לארון */
export const S6Shopping: React.FC = () => {
  const f = useCurrentFrame();
  const dur = scene('shopping').dur * FPS;
  const b = (n: string) => beat('shopping', n);

  const pose = lerpPose(POSE.season, POSE.shop, spr(f, 0, { damping: 20, stiffness: 80 }));
  const toShop = ease(f, 0, 10);

  const inserted = f >= b('inserted');
  const rows = inserted ? [GAP_ROW, ...SHOP_LIST] : SHOP_LIST;
  const rowAnim = (id: string) => {
    if (id === GAP_ROW.id) {
      const p = spr(f, b('inserted'), { damping: 15, stiffness: 160 });
      return { h: clamp(p), o: clamp(p * 1.4), s: 0.9 + 0.1 * p };
    }
    const checkAt = id === 's1' ? b('tapCheck1') : id === 's2' ? b('tapCheck2') : 1e9;
    const flyAt = id === 's1' ? b('fly1') : id === 's2' ? b('fly2') : 1e9;
    const checked = ease(f, checkAt + 2, checkAt + 8);
    const gone = ease(f, flyAt, flyAt + 10, easeIn);
    return { h: 1 - ease(f, flyAt + 4, flyAt + 14, easeInOut), o: 1 - gone, s: 1 - 0.06 * gone, x: -gone * 60, checked };
  };
  const gapsShown = inserted ? ['g2'] : ['g1', 'g2'];

  // ✓ על השורה – אחרי ההוספה מגפי הגשם בשורה 1, ואחרי שהם יוצאים הסוודר עולה לשורה 1
  const taps = [
    { at: b('tapAdd'), ...SHOP_TAPS.addGap },
    { at: b('tapCheck1'), ...SHOP_TAPS.check(1) },
    { at: b('tapCheck2'), ...SHOP_TAPS.check(1) },
  ];

  // פריט שעף מהשורה אל לשונית "הארון"
  const flyItem = (row: (typeof SHOP_LIST)[number], at: number, home: number) => {
    const t = ease(f, at, home, easeInOut);
    if (f < at || f > home + 2) return null;
    const from = SHOP_TAPS.check(1);
    const [x, y] = qbez([from.x - 150, from.y], [80, 420], [SHOP_TAPS.closetTab.x, SHOP_TAPS.closetTab.y - 8], t);
    const s = 1 - 0.55 * t;
    return (
      <div style={{ position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: 18, overflow: 'hidden', transform: `scale(${s})`, boxShadow: '0 10px 24px rgba(0,0,0,0.22)', zIndex: 110 }}>
        <ProductShot kind={row.kind} color={row.color} accent={row.accent} bg="#fff7ed" size={70} />
      </div>
    );
  };
  const bounce = Math.max(f >= b('home1') ? Math.sin(clamp((f - b('home1')) / 10) * Math.PI) : 0, f >= b('home2') ? Math.sin(clamp((f - b('home2')) / 10) * Math.PI) : 0);

  // כרטיסי חוסרים: הראשון נשאב אל הטלפון בזמן "+ לרשימה"
  const side1 = spr(f, b('side'), { damping: 14, stiffness: 150 });
  const side2 = spr(f, b('side') + 5, { damping: 14, stiffness: 150 });
  const suckT = ease(f, b('tapAdd') + 1, b('inserted') + 2, easeIn);
  const card1Visible = f < b('inserted') + 2;
  // מיקום השורה החדשה בטלפון, במרחב הקומפוזיציה
  const rowScreen = { x: 195, y: 152 };
  const target = {
    x: pose.x + (rowScreen.x - SCREEN_W / 2) * pose.s,
    y: pose.y + (rowScreen.y - SCREEN_H / 2) * pose.s,
  };
  const c1 = { x: 215, y: 980 };
  const [sx, sy] = qbez([c1.x, c1.y], [c1.x + 120, c1.y - 360], [target.x, target.y], suckT);

  return (
    <AbsoluteFill>
      <Phone pose={pose}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SwapScreen index={3} total={9} item={itemById('i1')} inP={1} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: toShop }}>
          <ShoppingScreen rows={rows} rowAnim={rowAnim} gapsShown={gapsShown} addPress={press(f, b('tapAdd'))} checkPress={f < b('tapCheck2') - 4 ? { id: 's1', p: press(f, b('tapCheck1')) } : { id: 's2', p: press(f, b('tapCheck2')) }} bounce={bounce} />
        </div>
        {flyItem(SHOP_LIST[0], b('fly1'), b('home1'))}
        {flyItem(SHOP_LIST[1], b('fly2'), b('home2'))}
        {taps.map((tp, k) => (
          <Tap key={k} x={tp.x} y={tp.y} f={f - tp.at} />
        ))}
      </Phone>

      {card1Visible && (
        <div style={{ position: 'absolute', inset: 0, transformOrigin: `${sx}px ${sy}px` }}>
          <div style={{ position: 'absolute', left: sx - c1.x, top: sy - c1.y, width: 1080, height: 1920, transform: `scale(1)`, opacity: 1 - Math.pow(suckT, 2) * 0.9 }}>
            <div style={{ position: 'absolute', left: c1.x, top: c1.y, transform: `scale(${1 - 0.75 * suckT})`, transformOrigin: '0 0' }}>
              <MissingCard x={0} y={0} p={side1} kind="coat" color={GAP_ROW.color} accent={GAP_ROW.accent} label="מעיל" kid="moishi" status="missing" />
            </div>
          </div>
        </div>
      )}
      <MissingCard x={215} y={1430} p={side2} kind="hat" color="#f97316" accent="#fff" label="כובע" kid="yehuda" status="missing" />

      <TitleBlock title={copy('shopping', 'title')} sub={copy('shopping', 'sub')} f={f} inAt={b('title')} subAt={b('sub')} outAt={dur - 14} size={96} subSize={48} />
    </AbsoluteFill>
  );
};
