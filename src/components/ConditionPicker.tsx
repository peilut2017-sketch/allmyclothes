import { useRef } from 'react';
import { conditionLabel } from '../lib/constants';

interface ConditionPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  allowClear?: boolean;
}

const color = (n: number) => (n >= 8 ? 'rgb(var(--c-ok))' : n >= 5 ? 'rgb(var(--c-accent))' : 'rgb(var(--c-warn))');

/** דירוג מצב הבגד 1–10: מחליקים עם האצבע על הפסים (או נוגעים בפס), והצבע משתנה לפי הציון */
export function ConditionPicker({ value, onChange, allowClear = true }: ConditionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useRef(false);

  const setFromX = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    // הפסים LTR: 1 משמאל, 10 מימין
    const n = Math.min(10, Math.max(1, Math.ceil(((clientX - r.left) / r.width) * 10)));
    if (n !== value) onChange(n);
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <b className="text-2xl font-extrabold tabular-nums tracking-tight" style={{ color: value != null ? color(value) : undefined }}>
          {value != null ? `${value}/10` : '—'}
        </b>
        <span className="text-sm text-gray-500">{value != null ? conditionLabel(value) : 'לא דורג עדיין'}</span>
      </div>
      <div
        ref={ref}
        dir="ltr"
        role="slider"
        aria-label="מצב הבגד"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value ?? undefined}
        className="flex h-10 cursor-pointer touch-pan-y gap-1"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); active.current = true; setFromX(e.clientX); }}
        onPointerMove={(e) => active.current && setFromX(e.clientX)}
        onPointerUp={() => { active.current = false; }}
        onPointerCancel={() => { active.current = false; }}
      >
        {Array.from({ length: 10 }, (_, i) => {
          const on = value != null && i < value;
          return (
            <i
              key={i}
              className="flex-1 origin-bottom rounded-lg transition-[background-color,transform] duration-200 ease-out"
              style={{
                backgroundColor: on ? color(value!) : 'rgb(var(--c-g100))',
                boxShadow: on ? 'none' : 'inset 0 0 0 0.5px rgb(var(--c-line) / 0.14)',
                transform: i + 1 === value ? 'scaleY(1.12)' : undefined,
              }}
            />
          );
        })}
      </div>
      {allowClear && value !== null && (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-sm font-semibold text-gray-500 underline-offset-2 active:opacity-60">
          ניקוי
        </button>
      )}
    </div>
  );
}
