import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  actions?: ReactNode;
}

export default function TopBar({ title, showBack, actions }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-white px-4 py-4">
      {showBack && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-brand-teal"
        >
          <ChevronLeft size={22} strokeWidth={2.2} />
        </motion.button>
      )}
      <h1 className="flex-1 truncate text-xl font-bold text-brand-teal">{title}</h1>
      {actions}
    </header>
  );
}
