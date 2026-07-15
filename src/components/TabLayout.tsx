import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Modules', icon: '▦', end: true },
  { to: '/attendance-clock', label: 'Attendance', icon: '◷', end: false },
  { to: '/profile', label: 'Profile', icon: '☺', end: false },
];

export default function TabLayout() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <nav className="flex border-t border-gray-200 bg-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive ? 'text-[#1E3A3A] font-semibold' : 'text-gray-400'
              }`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
