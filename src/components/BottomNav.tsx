import { NavLink, useNavigate } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'הארון', icon: '👕' },
  { to: '/shopping', label: 'לקנות', icon: '🛒' },
  { to: null, label: 'הוספה', icon: '+' },
  { to: '/children', label: 'ילדים', icon: '🧒' },
  { to: '/stats', label: 'סיכום', icon: '📊' },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map((tab) =>
          tab.to === null ? (
            <button
              key="add"
              onClick={() => navigate('/add')}
              aria-label="הוספת פריט"
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-3xl font-light text-white shadow-lg shadow-amber-500/40 transition active:scale-95"
            >
              +
            </button>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition ${
                  isActive ? 'text-amber-600' : 'text-gray-400'
                }`
              }
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
