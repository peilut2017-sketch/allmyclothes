import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChildIcon, ClosetIcon, CartIcon, LooksIcon, PlusIcon } from './Icons';
import { SPRING_SNAPPY, withViewTransition } from '../lib/motion';

const tabs = [
  { to: '/', label: 'הארון', Icon: ClosetIcon },
  { to: '/looks', label: 'לוקים', Icon: LooksIcon },
  { to: null, label: 'הוספה', Icon: PlusIcon },
  { to: '/shopping', label: 'לקנות', Icon: CartIcon },
  { to: '/children', label: 'ילדים', Icon: ChildIcon },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)]" aria-label="ניווט ראשי">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {tabs.map((tab) =>
          tab.to === null ? (
            <motion.button
              key="add"
              onClick={() => navigate('/add')}
              aria-label="הוספת פריט"
              whileTap={{ scale: 0.9 }}
              transition={SPRING_SNAPPY}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/40"
            >
              <PlusIcon size={28} />
            </motion.button>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={(e) => {
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                withViewTransition(() => navigate(tab.to));
              }}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-2.5 text-[0.6875rem] font-medium transition-colors ${
                  isActive ? 'text-amber-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-amber-500"
                    />
                  )}
                  <tab.Icon />
                  {tab.label}
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
