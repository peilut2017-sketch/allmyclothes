import { SIZE_FITS } from '../lib/constants';
import type { SizeFit } from '../lib/types';

const FITS: SizeFit[] = [-1, 0, 1];

/** שלוש נקודות קטנות: שמאל = גזרה קטנה, אמצע = במידה, ימין = גזרה גדולה */
export function FitDots({ value, className = '' }: { value: SizeFit | null; className?: string }) {
  if (value == null) return null;
  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-[3px] ${className}`}
      title={SIZE_FITS[String(value) as keyof typeof SIZE_FITS].label}
      aria-label={SIZE_FITS[String(value) as keyof typeof SIZE_FITS].label}
    >
      {FITS.map((f) => (
        <span
          key={f}
          className={`h-1.5 w-1.5 rounded-full ${f === value ? 'bg-amber-500' : 'bg-gray-300'}`}
        />
      ))}
    </span>
  );
}

/** בורר גזרה: שלוש נקודות לחיצות עם הסבר */
export function FitPicker({ value, onChange }: { value: SizeFit | null; onChange: (v: SizeFit | null) => void }) {
  return (
    <div>
      <div className="flex gap-2" dir="ltr">
        {FITS.map((f) => {
          const meta = SIZE_FITS[String(f) as keyof typeof SIZE_FITS];
          const active = value === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(active ? null : f)}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-2 text-xs font-semibold transition active:scale-95 ${
                active
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200'
                  : 'border-gray-100 bg-card text-gray-500'
              }`}
              aria-pressed={active}
            >
              <span className="flex items-center gap-1">
                {FITS.map((d) => (
                  <span
                    key={d}
                    className={`rounded-full ${d === f ? 'h-2.5 w-2.5 bg-amber-500' : 'h-1.5 w-1.5 bg-gray-300'}`}
                  />
                ))}
              </span>
              {meta.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {value != null ? SIZE_FITS[String(value) as keyof typeof SIZE_FITS].hint : 'לא חובה – משפיע על התראת ״בקרוב קטן״'}
      </p>
    </div>
  );
}
