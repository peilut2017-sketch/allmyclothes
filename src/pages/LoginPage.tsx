import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || undefined } },
        });
        if (err) throw err;
        if (!data.session) {
          setInfo('נשלח אליכם מייל אימות – היכנסו לקישור שבו כדי להשלים את ההרשמה');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Invalid login credentials')) setError('אימייל או סיסמה שגויים');
      else if (msg.includes('already registered')) setError('כתובת האימייל כבר רשומה – נסו להתחבר');
      else if (msg.includes('at least 6')) setError('הסיסמה צריכה להכיל לפחות 6 תווים');
      else setError(msg || 'משהו השתבש, נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-cream px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 text-6xl">👕</div>
          <h1 className="text-3xl font-extrabold text-ink">ארון המשפחה</h1>
          <p className="mt-2 text-gray-500">
            כל הבגדים של הילדים במקום אחד –<br />
            מה יש, לאיזה גיל ולאיזו עונה
          </p>
        </div>

        <div className="mb-5 flex rounded-2xl bg-card p-1 shadow-card">
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                mode === m ? 'bg-amber-500 text-white shadow' : 'text-gray-500'
              }`}
            >
              {m === 'signin' ? 'התחברות' : 'הרשמה'}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => void submit(e)} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם המשפחה (למשל: משפחת לוי)"
              className="w-full rounded-2xl border border-gray-200 bg-card px-4 py-3.5 text-ink outline-none focus:border-amber-400"
            />
          )}
          <input
            type="email"
            required
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="אימייל"
            className="w-full rounded-2xl border border-gray-200 bg-card px-4 py-3.5 text-left text-ink outline-none focus:border-amber-400"
          />
          <input
            type="password"
            required
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמה (לפחות 6 תווים)"
            minLength={6}
            className="w-full rounded-2xl border border-gray-200 bg-card px-4 py-3.5 text-left text-ink outline-none focus:border-amber-400"
          />

          {error && <p className="rounded-xl bg-rose-50 dark:bg-rose-500/15 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          {info && <p className="rounded-xl bg-emerald-50 dark:bg-emerald-500/15 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-amber-500 py-3.5 text-lg font-bold text-white shadow-md shadow-amber-500/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? 'רגע...' : mode === 'signin' ? 'כניסה לארון' : 'פתיחת חשבון'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          הנתונים שלכם שמורים בחשבון פרטי ומאובטח – רק אתם רואים אותם
        </p>
      </div>
    </div>
  );
}
