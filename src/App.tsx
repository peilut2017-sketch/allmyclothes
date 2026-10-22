import { useLayoutEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigationType, type Location } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { isConfigured } from './lib/supabase';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { ClosetPage } from './pages/ClosetPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { SeasonSwapPage } from './pages/SeasonSwapPage';
import { LooksPage } from './pages/LooksPage';
import { LookEditorPage } from './pages/LookEditorPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';

function SetupNotice() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-8 text-center">
      <div className="mb-4 text-5xl">🔧</div>
      <h1 className="mb-2 text-xl font-bold text-ink">חסרה הגדרת Supabase</h1>
      <p className="max-w-sm text-sm text-gray-500">
        העתיקו את <code dir="ltr">.env.example</code> לקובץ <code dir="ltr">.env</code> ומלאו את כתובת
        הפרויקט והמפתח מלוח הבקרה של Supabase. פרטים מלאים בקובץ README.
      </p>
    </div>
  );
}

/** מקום הגלילה האחרון, נשמר בזמן אמת כדי שנוכל לשמור אותו ברגע הניווט (אחרי שהעמוד כבר הוחלף) */
const scrollPosRef = { y: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => { scrollPosRef.y = window.scrollY; }, { passive: true });
}

function Shell() {
  const { session, loading } = useAuth();
  const location = useLocation();

  // ניהול גלילה: עמוד חדש נפתח תמיד מלמעלה (אחרת, למשל באנדרואיד, פתיחת פריט מרשימה גלולה
  // נשארה באמצע עמוד הפריט ודילגה על התמונה). חזרה אחורה משחזרת את מקום הגלילה הקודם.
  // layout effect – כדי שהגלילה תתבצע לפני הציור, גם בתוך מעבר תצוגה.
  const navType = useNavigationType();
  const scrollByKey = useRef(new Map<string, number>());
  const prevKey = useRef(location.key);
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);
  useLayoutEffect(() => {
    scrollByKey.current.set(prevKey.current, scrollPosRef.y);
    prevKey.current = location.key;
    // פתיחת פריט כשכבה מעל הרשימה: הרשימה נשארת במקומה ולכן לא נוגעים בגלילה
    if ((location.state as { backgroundLocation?: unknown } | null)?.backgroundLocation) return;
    const saved = navType === 'POP' ? scrollByKey.current.get(location.key) : undefined;
    window.scrollTo(0, saved ?? 0);
  }, [location.key, navType]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="animate-pulse text-5xl">👕</div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  const hideNav = ['/add', '/edit', '/season-swap', '/looks/'].some((p) => location.pathname.startsWith(p));

  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation;

  return (
    <DataProvider>
     <ToastProvider>
      <Routes location={background ?? location}>
        <Route path="/" element={<ClosetPage />} />
        <Route path="/add" element={<ItemFormPage />} />
        <Route path="/edit/:id" element={<ItemFormPage />} />
        <Route path="/item/:id" element={<ItemDetailPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/season-swap" element={<SeasonSwapPage />} />
        <Route path="/looks" element={<LooksPage />} />
        <Route path="/looks/new" element={<LookEditorPage />} />
        <Route path="/looks/:id/edit" element={<LookEditorPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/item/:id" element={<ItemDetailPage />} />
        </Routes>
      )}
      {!hideNav && <BottomNav />}
     </ToastProvider>
    </DataProvider>
  );
}

export default function App() {
  if (!isConfigured) return <SetupNotice />;
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}
