import { useId } from 'react';
import { motion } from 'motion/react';
import { SPRING_SNAPPY } from '../lib/motion';

interface Option<T extends string> { key: T; label: string; color?: string }

/** בורר מקטעים: הידית הלבנה מחליקה בקפיץ אל המקטע שנבחר */
export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (k: T) => void; label: string }) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="flex rounded-xl bg-gray-100 p-[3px] shadow-[inset_0_0_0_0.5px_rgb(var(--c-line)/0.14)]">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.key)}
            className={`relative min-w-0 flex-1 rounded-[9px] px-2 py-[7px] text-sm font-semibold transition-colors duration-200 ${active ? 'text-ink' : 'text-gray-500'}`}
          >
            {active && (
              <motion.span
                layoutId={id}
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-[9px] bg-card shadow-[0_1px_3px_rgba(0,0,0,0.14),0_0_0_0.5px_rgb(var(--c-line)/0.12)]"
              />
            )}
            <span className="relative flex items-center justify-center gap-1.5 truncate">
              {o.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.color }} />}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
