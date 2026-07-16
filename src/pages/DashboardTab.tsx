import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  CalendarCheck,
  Palmtree,
  ChevronRight,
  Clock,
  Timer,
  Megaphone,
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { Skeleton } from '../components/Skeleton';
import { apiGet, getStoredEmployee } from '../api/apiClient';
import {
  attendanceRecordFromJson,
  availableLeaveFromJson,
  announcementFromJson,
  type Announcement,
} from '../types';

const quickLinks = [
  { to: '/employees', label: 'Employees', Icon: Users },
  { to: '/attendance', label: 'Attendance', Icon: CalendarCheck },
  { to: '/leaves', label: 'Leaves', Icon: Palmtree },
];

function parseHoursToMinutes(hhmm?: string): number {
  if (!hhmm) return 0;
  const match = hhmm.match(/(\d+):(\d{2})/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function DashboardTab() {
  const navigate = useNavigate();
  const employee = getStoredEmployee();
  const firstName = (employee?.employee_first_name as string) ?? '';

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [monthlyMinutes, setMonthlyMinutes] = useState<number | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const now = new Date();
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();

      const [statusResult, page1, balanceResult, announcementResult] = await Promise.allSettled([
        apiGet('/attendance/checking-in'),
        apiGet('/attendance/my-attendance/'),
        apiGet('/leave/available-leave/'),
        apiGet('/base/announcement-view'),
      ]);
      if (cancelled) return;

      if (statusResult.status === 'fulfilled') {
        setIsClockedIn(statusResult.value.status === true);
        setClockInTime((statusResult.value.clock_in as string) ?? null);
      }

      if (page1.status === 'fulfilled') {
        const records = ((page1.value.results as Record<string, unknown>[]) ?? []).map(
          attendanceRecordFromJson,
        );
        let minutes = 0;
        for (const r of records) {
          const d = new Date(r.attendanceDate);
          if (!isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth) {
            minutes += parseHoursToMinutes(r.workedHour);
          }
        }
        setMonthlyMinutes(minutes);
      }

      if (balanceResult.status === 'fulfilled') {
        const balances = ((balanceResult.value.results as Record<string, unknown>[]) ?? []).map(
          availableLeaveFromJson,
        );
        setLeaveBalance(balances.reduce((sum, b) => sum + b.totalLeaveDays, 0));
      }

      if (announcementResult.status === 'fulfilled') {
        const items = ((announcementResult.value.results as Record<string, unknown>[]) ?? []).map(
          announcementFromJson,
        );
        setAnnouncements(items.slice(0, 3));
      }

      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-xl font-bold text-brand-teal">{firstName || 'Dashboard'}</h1>
        </div>
        <NotificationBell />
      </div>

      <div className="flex flex-col gap-4 p-4">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/attendance-clock')}
          className="flex items-center gap-4 rounded-2xl p-4 text-left text-white shadow-[var(--shadow-card)]"
          style={{
            background:
              'linear-gradient(160deg, var(--color-brand-teal-light) 0%, var(--color-brand-teal) 45%, var(--color-brand-teal-dark) 100%)',
          }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-gold">
            <Clock size={20} strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">
              {isLoading ? 'Checking status...' : isClockedIn ? 'Clocked In' : 'Not Clocked In'}
            </span>
            <span className="block text-sm text-brand-cream/70">
              {isClockedIn && clockInTime ? `Since ${clockInTime}` : 'Tap to clock in for today'}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-brand-cream/70" />
        </motion.button>

        <div className="flex gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="flex-1 rounded-2xl bg-brand-surface p-3.5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
              <Timer size={15} strokeWidth={2} />
            </span>
            <p className="mt-2 text-xs text-gray-500">Hours this month</p>
            {isLoading || monthlyMinutes === null ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="text-lg font-bold text-brand-teal">{formatMinutes(monthlyMinutes)}</p>
            )}
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/leaves')}
            className="flex-1 rounded-2xl bg-brand-surface p-3.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
              <Palmtree size={15} strokeWidth={2} />
            </span>
            <p className="mt-2 text-xs text-gray-500">Leave balance</p>
            {isLoading || leaveBalance === null ? (
              <Skeleton className="mt-1 h-6 w-16" />
            ) : (
              <p className="text-lg font-bold text-brand-teal">
                {leaveBalance.toFixed(1)} days
              </p>
            )}
          </motion.button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-teal">Announcements</h2>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs font-semibold text-brand-gold-dark"
            >
              View all
            </button>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="rounded-2xl bg-brand-surface p-4 text-sm text-gray-500">
              No announcements right now.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {announcements.map((a, i) => (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/announcements')}
                  className="flex items-start gap-3 rounded-2xl bg-brand-surface p-3.5 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
                    <Megaphone size={15} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-brand-teal">
                        {a.title}
                      </span>
                      {!a.hasViewed && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                      )}
                    </span>
                    <span className="line-clamp-1 block text-xs text-gray-500">
                      {a.content[0]?.text ?? formatDate(a.createdAt)}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-base font-bold text-brand-teal">Quick Access</h2>
          <div className="flex flex-col gap-2">
            {quickLinks.map((m, i) => (
              <motion.button
                key={m.to}
                onClick={() => navigate(m.to)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.25 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 rounded-2xl bg-brand-surface p-3.5 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-teal shadow-sm">
                  <m.Icon size={16} strokeWidth={2} />
                </span>
                <span className="flex-1 text-sm font-semibold text-brand-teal">{m.label}</span>
                <ChevronRight size={16} className="shrink-0 text-gray-400" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
