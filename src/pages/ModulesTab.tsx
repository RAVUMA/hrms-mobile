import { Link } from 'react-router-dom';
import TopBar from '../components/TopBar';
import AccountMenu from '../components/AccountMenu';

const modules = [
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/attendance', label: 'Attendance', icon: '🗓' },
  { to: '/leaves', label: 'Leaves', icon: '🏖' },
];

export default function ModulesTab() {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Modules" actions={<AccountMenu />} />
      <div className="grid grid-cols-3 gap-4 p-4">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl bg-gray-100 text-center active:bg-gray-200"
          >
            <span className="text-3xl">{m.icon}</span>
            <span className="text-xs text-gray-700">{m.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
