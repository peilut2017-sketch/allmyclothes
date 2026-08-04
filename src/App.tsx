import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { isConfigured } from './lib/supabase';
import { BottomNav } from './components/BottomNav';
import { LoginPage } from './pages/LoginPage';
import { ClosetPage } from './pages/ClosetPage';
import { ItemFormPage } from './pages/ItemFormPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { ShoppingPage } from './pages/ShoppingPage';
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

function Shell() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <div className="animate-pulse text-5xl">👕</div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  const hideNav = ['/add', '/edit'].some((p) => location.pathname.startsWith(p));

  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<ClosetPage />} />
        <Route path="/add" element={<ItemFormPage />} />
        <Route path="/edit/:id" element={<ItemFormPage />} />
        <Route path="/item/:id" element={<ItemDetailPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
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
