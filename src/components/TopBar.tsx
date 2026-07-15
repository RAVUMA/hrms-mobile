import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export default function TopBar({ title, showBack, actions }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-3">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-700"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold text-[#1E3A3A]">{title}</h1>
      {actions}
    </header>
  );
}
