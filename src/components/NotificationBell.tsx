import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { apiGet } from '../api/apiClient';
import { announcementFromJson } from '../types';

interface NotificationBellProps {
  /** Use on dark backgrounds (e.g. the brand-teal header) so the icon is visible. */
  light?: boolean;
}

export default function NotificationBell({ light }: NotificationBellProps) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet('/base/announcement-view')
      .then((result) => {
        if (cancelled) return;
        const items = ((result.results as Record<string, unknown>[]) ?? []).map(
          announcementFromJson,
        );
        setUnread(items.filter((a) => !a.hasViewed).length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/announcements')}
      aria-label="Announcements"
      className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
        light ? 'bg-white/10 text-white' : 'text-brand-teal'
      }`}
    >
      <Bell size={19} strokeWidth={2} />
      {unread > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-gold ring-2 ring-white" />
      )}
    </motion.button>
  );
}
