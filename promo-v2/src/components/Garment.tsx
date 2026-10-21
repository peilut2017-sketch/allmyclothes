import React, { useId } from 'react';

/** בגדי ילדים וקטוריים עם הצללה רכה ועומק – לשימוש כאלמנטים תלת-ממדיים וכ"תמונות" בכרטיסי הפריטים */

export type GarmentKind =
  | 'tshirt'
  | 'sweater'
  | 'coat'
  | 'dress'
  | 'pants'
  | 'skirt'
  | 'pajama'
  | 'hoodie'
  | 'boots'
  | 'hat'
  | 'shirt'
  | 'tights';

function hexToRgb(h: string) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function shade(h: string, amt: number) {
  const [r, g, b] = hexToRgb(h);
  if (amt < 0) return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
  return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
}

const LONG_SLEEVE =
  'M62 38 L84 29 Q100 41 116 29 L138 38 Q158 47 165 78 L177 158 L155 163 L143 94 L142 170 Q100 177 58 170 L57 94 L45 163 L23 158 L35 78 Q42 47 62 38 Z';

const OUTLINES: Record<GarmentKind, string> = {
  tshirt: 'M60 40 L83 29 Q100 42 117 29 L140 40 L172 68 L154 92 L140 82 L141 170 Q100 177 59 170 L60 82 L46 92 L28 68 Z',
  sweater: LONG_SLEEVE,
  coat: 'M60 36 L82 24 Q100 34 118 24 L140 36 Q160 46 166 78 L178 162 L154 167 L144 96 L145 176 Q100 183 55 176 L56 96 L46 167 L22 162 L34 78 Q40 46 60 36 Z',
  dress: 'M74 34 L89 27 Q100 37 111 27 L126 34 L140 52 L131 66 L126 62 L124 92 L166 170 Q100 184 34 170 L76 92 L74 62 L69 66 L60 52 Z',
  pants: 'M60 28 L140 28 L148 172 L111 174 L100 84 L89 174 L52 172 Z',
  skirt: 'M66 50 L134 50 L136 66 L164 158 Q100 172 36 158 L64 66 Z',
  pajama: LONG_SLEEVE,
  hoodie: 'M62 42 L80 34 Q78 18 100 14 Q122 18 120 34 L138 42 Q158 50 165 80 L177 158 L155 163 L143 96 L142 170 Q100 177 58 170 L57 96 L45 163 L23 158 L35 80 Q42 50 62 42 Z',
  boots: 'M58 46 L106 46 L108 118 Q146 120 164 140 Q174 156 164 166 L58 166 Q52 140 58 46 Z',
  hat: 'M44 128 Q44 58 100 54 Q156 58 156 128 Z',
  shirt: LONG_SLEEVE,
  tights: 'M66 26 L134 26 L136 60 L126 164 Q120 176 104 172 L101 92 L99 92 L96 172 Q80 176 74 164 L64 60 Z',
};

export function Garment({
  kind,
  color,
  accent = '#ffffff',
  size = 200,
  depth = 0,
  style,
}: {
  kind: GarmentKind;
  color: string;
  accent?: string;
  size?: number;
  /** עובי "חיתוך" תלת-ממדי בפיקסלים של ה-viewBox */
  depth?: number;
  style?: React.CSSProperties;
}) {
  const uid = useId().replace(/:/g, '');
  const light = shade(color, 0.28);
  const dark = shade(color, -0.22);
  const darker = shade(color, -0.4);
  const outline = OUTLINES[kind];
  const g = `g${uid}`;
  const clip = `c${uid}`;
  const sheen = `s${uid}`;

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible', display: 'block', ...style }}>
      <defs>
        <linearGradient id={g} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={sheen} cx="0.35" cy="0.25" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}>
          <path d={outline} />
        </clipPath>
      </defs>
      {depth > 0 && <path d={outline} fill={darker} transform={`translate(${depth * 0.5} ${depth})`} />}
      <path d={outline} fill={`url(#${g})`} stroke={dark} strokeWidth={1.6} strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        <Details kind={kind} color={color} accent={accent} dark={dark} light={light} />
        <rect x="0" y="0" width="200" height="200" fill={`url(#${sheen})`} />
      </g>
      {kind === 'hat' && (
        <>
          <rect x="38" y="118" width="124" height="34" rx="12" fill={dark} />
          {[52, 66, 80, 94, 108, 122, 136, 150].map((x) => (
            <line key={x} x1={x} y1="122" x2={x} y2="148" stroke={darker} strokeWidth="2" opacity="0.5" />
          ))}
          <circle cx="100" cy="48" r="17" fill={accent} />
          <circle cx="95" cy="43" r="6" fill="#fff" opacity="0.5" />
        </>
      )}
      {kind === 'boots' && (
        <>
          <path d="M54 158 L168 158 Q172 166 164 172 L56 172 Z" fill={darker} />
          <rect x="54" y="38" width="56" height="16" rx="8" fill={accent} />
        </>
      )}
      {kind === 'skirt' && <rect x="62" y="44" width="76" height="16" rx="5" fill={dark} />}
      {kind === 'pants' && <rect x="58" y="24" width="84" height="14" rx="4" fill={dark} />}
    </svg>
  );
}

function Details({ kind, color, accent, dark, light }: { kind: GarmentKind; color: string; accent: string; dark: string; light: string }) {
  const stitch = { stroke: dark, strokeWidth: 1.4, strokeDasharray: '4 3', fill: 'none', opacity: 0.6 } as const;
  const fold = { fill: dark, opacity: 0.16 } as const;
  switch (kind) {
    case 'tshirt':
      return (
        <>
          <path d="M83 29 Q100 50 117 29" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
          <path d="M60 160 L141 160" {...stitch} />
          <path d="M120 90 Q132 130 124 168 L141 170 L140 82 Z" {...fold} />
          <circle cx="82" cy="104" r="11" fill={accent} opacity="0.9" />
        </>
      );
    case 'sweater':
      return (
        <>
          <path d="M84 29 Q100 46 116 29" fill="none" stroke={dark} strokeWidth="7" strokeLinecap="round" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <line key={i} x1={62 + i * 9} y1="160" x2={62 + i * 9} y2="172" stroke={dark} strokeWidth="2" opacity="0.5" />
          ))}
          <path d="M23 152 L45 156" stroke={dark} strokeWidth="6" />
          <path d="M155 156 L177 152" stroke={dark} strokeWidth="6" />
          <path d="M70 92 L130 92 M70 104 L130 104" stroke={accent} strokeWidth="5" opacity="0.85" />
          <path d="M118 110 Q130 140 124 168 L142 170 L143 94 Z" {...fold} />
        </>
      );
    case 'coat':
      return (
        <>
          {[66, 92, 118, 144].map((y) => (
            <path key={y} d={`M20 ${y} Q100 ${y + 10} 180 ${y}`} fill="none" stroke={dark} strokeWidth="2.4" opacity="0.55" />
          ))}
          <line x1="100" y1="34" x2="100" y2="182" stroke={dark} strokeWidth="3" />
          <rect x="97" y="58" width="6" height="12" rx="2" fill={accent} />
          <path d="M82 24 Q100 40 118 24 L122 40 Q100 52 78 40 Z" fill={light} />
          <path d="M116 100 Q132 140 126 176 L145 176 L144 96 Z" {...fold} />
        </>
      );
    case 'dress':
      return (
        <>
          <path d="M89 27 Q92 44 100 44 Q108 44 111 27 Q100 36 89 27 Z" fill={accent} />
          <ellipse cx="91" cy="40" rx="10" ry="6" fill={accent} />
          <ellipse cx="109" cy="40" rx="10" ry="6" fill={accent} />
          <rect x="70" y="86" width="60" height="9" fill={dark} opacity="0.8" />
          <path d="M100 95 L76 172 M100 95 L124 172 M100 95 L100 178" stroke={dark} strokeWidth="1.5" opacity="0.35" />
          <path d="M34 166 Q100 180 166 166" {...stitch} />
          <circle cx="100" cy="56" r="2.6" fill={accent} />
          <circle cx="100" cy="68" r="2.6" fill={accent} />
        </>
      );
    case 'pants':
      return (
        <>
          <path d="M64 42 Q72 56 86 50" fill="none" stroke={dark} strokeWidth="2" opacity="0.6" />
          <path d="M136 42 Q128 56 114 50" fill="none" stroke={dark} strokeWidth="2" opacity="0.6" />
          <line x1="72" y1="60" x2="70" y2="170" stroke={light} strokeWidth="2" opacity="0.5" />
          <line x1="128" y1="60" x2="130" y2="170" stroke={dark} strokeWidth="2" opacity="0.35" />
          <path d="M52 162 L89 164 M111 164 L148 162" {...stitch} />
          <path d="M100 38 L100 80" stroke={dark} strokeWidth="1.6" opacity="0.6" />
        </>
      );
    case 'skirt':
      return (
        <>
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${100 + i * 10} 62 L${100 + i * 19} 168`} stroke={dark} strokeWidth="2" opacity="0.4" />
          ))}
          <path d="M36 152 Q100 166 164 152" {...stitch} />
        </>
      );
    case 'pajama':
      return (
        <>
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="0" y={20 + i * 14} width="200" height="6" fill={accent} opacity="0.75" />
          ))}
          <path d="M84 29 Q100 46 116 29" fill="none" stroke={dark} strokeWidth="6" strokeLinecap="round" />
          {[60, 84, 108, 132].map((y) => (
            <circle key={y} cx="100" cy={y} r="3.6" fill={dark} />
          ))}
          <path d="M118 110 Q130 140 124 168 L142 170 L143 94 Z" {...fold} />
        </>
      );
    case 'hoodie':
      return (
        <>
          <path d="M80 34 Q78 18 100 14 Q122 18 120 34 Q100 52 80 34 Z" fill={dark} />
          <path d="M86 34 Q100 46 114 34" fill="none" stroke={shade(color, -0.45)} strokeWidth="4" />
          <line x1="93" y1="44" x2="91" y2="72" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
          <line x1="107" y1="44" x2="109" y2="72" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M72 122 L128 122 L136 152 L64 152 Z" fill={dark} opacity="0.55" />
          <path d="M62 162 L142 162" stroke={dark} strokeWidth="6" opacity="0.6" />
        </>
      );
    case 'boots':
      return (
        <>
          <path d="M70 64 L100 64 M70 80 L100 80 M70 96 L100 96" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M108 124 Q140 128 158 146" fill="none" stroke={light} strokeWidth="3" opacity="0.6" />
        </>
      );
    case 'hat':
      return (
        <>
          {[60, 80, 100, 120, 140].map((x) => (
            <path key={x} d={`M${x} 128 Q${x + (100 - x) * 0.25} 80 100 56`} stroke={dark} strokeWidth="2" fill="none" opacity="0.35" />
          ))}
        </>
      );
    case 'shirt':
      return (
        <>
          <path d="M84 29 L100 52 L116 29 L122 40 L104 62 L100 56 L96 62 L78 40 Z" fill={light} stroke={dark} strokeWidth="1.2" />
          <line x1="100" y1="56" x2="100" y2="172" stroke={dark} strokeWidth="1.6" opacity="0.6" />
          {[72, 94, 116, 138].map((y) => (
            <circle key={y} cx="104" cy={y} r="3" fill={accent} stroke={dark} strokeWidth="0.8" />
          ))}
          <rect x="66" y="80" width="20" height="16" rx="2" fill="none" stroke={dark} strokeWidth="1.3" opacity="0.6" />
          <path d="M118 110 Q130 140 124 168 L142 170 L143 94 Z" {...fold} />
        </>
      );
    case 'tights':
      return (
        <>
          <rect x="60" y="26" width="80" height="12" fill={dark} opacity="0.6" />
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx={76 + (i % 2) * 48} cy={56 + i * 14} r="3" fill={accent} opacity="0.8" />
          ))}
        </>
      );
  }
}
