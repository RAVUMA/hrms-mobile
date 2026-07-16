import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone } from 'lucide-react';
import TopBar from '../components/TopBar';
import { SkeletonList } from '../components/Skeleton';
import { apiGet } from '../api/apiClient';
import { announcementFromJson, type Announcement } from '../types';

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet('/base/announcement-view');
      setAnnouncements(
        ((result.results as Record<string, unknown>[]) ?? []).map(announcementFromJson),
      );
      setNextPage((result.next as string) ?? null);
    } catch {
      setError('Could not load announcements.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (!nextPage || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const url = new URL(nextPage);
      const result = await apiGet(`/base/announcement-view${url.search}`);
      setAnnouncements((prev) => [
        ...prev,
        ...((result.results as Record<string, unknown>[]) ?? []).map(announcementFromJson),
      ]);
      setNextPage((result.next as string) ?? null);
    } catch {
      // keep what's already loaded
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar title="Announcements" showBack />
      <div className="flex-1 px-4 pb-6">
        {isLoading ? (
          <div className="py-2">
            <SkeletonList />
          </div>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : announcements.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No announcements yet.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3 py-2">
              {announcements.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.2 }}
                  className="rounded-2xl bg-brand-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
                      <Megaphone size={16} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-brand-teal">
                          {a.title}
                        </p>
                        {!a.hasViewed && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                        )}
                      </div>
                      {a.createdAt && (
                        <p className="text-[11px] text-gray-400">{formatDate(a.createdAt)}</p>
                      )}
                      <div className="mt-1.5 space-y-1 text-sm text-gray-600">
                        {a.content.length > 0 ? (
                          a.content.map((block, idx) => (
                            <p
                              key={idx}
                              className={
                                block.type === 'heading'
                                  ? 'font-semibold text-gray-800'
                                  : 'leading-relaxed'
                              }
                            >
                              {block.text}
                            </p>
                          ))
                        ) : (
                          <p className="italic text-gray-400">No description.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
            {nextPage && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={loadMore}
                disabled={isLoadingMore}
                className="mt-1 w-full rounded-xl bg-brand-surface py-2.5 text-sm font-semibold text-brand-teal disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
