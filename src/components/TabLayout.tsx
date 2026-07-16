import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutGrid, Clock, User } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Modules', Icon: LayoutGrid, end: true },
  { to: '/attendance-clock', label: 'Attendance', Icon: Clock, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
];

export default function TabLayout() {
  const location = useLocation();

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <nav className="relative flex items-end justify-around bg-brand-teal px-2 pb-3 pt-2">
        {tabs.map((tab) => {
          const isActive = tab.end
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to);

          return (
            <NavLink key={tab.to} to={tab.to} className="flex flex-1 flex-col items-center">
              <div className="relative flex h-14 w-14 items-center justify-center">
                {isActive && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute -top-7 h-14 w-14 rounded-full bg-brand-gold shadow-[0_10px_20px_rgba(232,201,155,0.45)] ring-4 ring-white"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <motion.span
                  animate={{
                    y: isActive ? -28 : 0,
                    color: isActive ? '#1e3a3a' : 'rgba(244,239,230,0.55)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  whileTap={{ scale: 0.88 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <tab.Icon size={22} strokeWidth={2} />
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
