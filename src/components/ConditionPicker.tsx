import { conditionLabel } from '../lib/constants';

interface ConditionPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  allowClear?: boolean;
}

/** דירוג מצב הבגד: 1 (לזריקה) עד 10 (חדש) */
export function ConditionPicker({ value, onChange, allowClear = true }: ConditionPickerProps) {
  return (
    <div>
      <div className="flex gap-1" dir="ltr">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`מצב ${n} – ${conditionLabel(n)}`}
            className={`h-9 flex-1 rounded-lg text-xs font-bold transition active:scale-90 ${
              value !== null && n <= value
                ? n >= 8
                  ? 'bg-emerald-500 text-white'
                  : n >= 5
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {n === 10 ? '✨' : n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-600">
          {value !== null ? `${value}/10 · ${conditionLabel(value)}` : 'לא דורג עדיין'}
        </span>
        {allowClear && value !== null && (
          <button type="button" onClick={() => onChange(null)} className="text-gray-400 underline">
            ניקוי
          </button>
        )}
      </div>
    </div>
  );
}
