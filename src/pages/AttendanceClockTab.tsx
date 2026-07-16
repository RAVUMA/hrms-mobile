import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Building2, LogIn, Timer } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import Dialog from '../components/Dialog';
import { apiGet, apiPostRaw, getStoredEmployee, isGeoFencingEnabled } from '../api/apiClient';

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported on this device/browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        reject(
          new Error('Location permission is required to clock in/out at this workplace.'),
        );
      } else {
        reject(new Error('Could not determine your location. Please try again.'));
      }
    }, { enableHighAccuracy: true, timeout: 15000 });
  });
}

/** Parses a "03:12 PM" clock-in time (today) into a Date, for the live timer. */
function parseClockInToday(clockIn: string): Date | null {
  const match = clockIn.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

const infoRowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.15 + i * 0.06, duration: 0.25 },
  }),
};

export default function AttendanceClockTab() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pendingAction, setPendingAction] = useState<'clock-in' | 'clock-out' | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadStatus() {
    setIsLoadingStatus(true);
    try {
      const result = await apiGet('/attendance/checking-in');
      const clockedIn = result.status === true;
      const clockIn = (result.clock_in as string) ?? null;
      setIsClockedIn(clockedIn);
      setClockInTime(clockIn);
      setDuration((result.duration as string) ?? null);

      if (tickRef.current) clearInterval(tickRef.current);
      if (clockedIn && clockIn) {
        const start = parseClockInToday(clockIn);
        if (start) {
          const tick = () =>
            setElapsed(Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000)));
          tick();
          tickRef.current = setInterval(tick, 1000);
        }
      } else {
        setElapsed(0);
      }
    } catch {
      // keep last-known status; user can retry
    } finally {
      setIsLoadingStatus(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const stored = getStoredEmployee();
    const id = stored?.id;
    if (id) {
      apiGet(`/employee/employees/${id}/`)
        .then((r) => setDepartment((r.department_name as string) ?? null))
        .catch(() => {});
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClock(action: 'clock-in' | 'clock-out') {
    setPendingAction(null);
    setIsSubmitting(true);
    setMessage(null);
    try {
      let body: Record<string, unknown> | undefined;
      if (isGeoFencingEnabled()) {
        const position = await getCurrentPosition();
        body = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      const [statusCode, response] = await apiPostRaw(`/attendance/${action}/`, body);
      const text =
        (response.message as string) ?? (response.error as string) ?? 'Something went wrong.';
      setMessage({ text, ok: statusCode === 200 });
      await loadStatus();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Something went wrong.', ok: false });
    } finally {
      setIsSubmitting(false);
    }
  }

  const infoRows = [
    { label: 'Department', value: department ?? '—', Icon: Building2 },
    { label: 'Check-In', value: clockInTime ?? '—', Icon: LogIn },
    { label: 'Worked Today', value: duration ?? '—', Icon: Timer },
  ];

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Big brand-colored header with a subtle gradient for depth */}
      <div
        className="px-5 pb-9 pt-5 text-white"
        style={{
          background:
            'linear-gradient(160deg, var(--color-brand-teal-light) 0%, var(--color-brand-teal) 45%, var(--color-brand-teal-dark) 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {isClockedIn ? 'Clocked In' : 'Clock In'}
          </span>
          <NotificationBell light />
        </div>

        <div className="mt-8 flex flex-col items-center">
          <motion.span
            animate={isClockedIn ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 2, repeat: isClockedIn ? Infinity : 0, ease: 'easeInOut' }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-brand-gold"
          >
            <Clock size={26} strokeWidth={1.8} />
          </motion.span>
          <span className="mt-3 text-3xl font-bold tabular-nums">
            {isLoadingStatus ? '--:--:--' : formatElapsed(elapsed)}
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={isClockedIn ? 'in' : 'out'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-1 text-sm text-brand-cream/80"
            >
              {isLoadingStatus
                ? 'Loading...'
                : isClockedIn && clockInTime
                  ? `Clocked In: Today at ${clockInTime}`
                  : 'Not clocked in yet today'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-6 pb-6">
        {/* Info card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="divide-y divide-gray-100">
            {infoRows.map((row, i) => (
              <motion.div
                key={row.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={infoRowVariants}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-surface text-brand-teal">
                  <row.Icon size={15} strokeWidth={2} />
                </span>
                <span className="flex-1 text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{row.value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {message && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`text-center text-sm ${message.ok ? 'text-green-600' : 'text-red-600'}`}
            >
              {message.text}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-auto flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPendingAction('clock-in')}
            disabled={isSubmitting || isClockedIn}
            className="rounded-2xl bg-brand-teal py-3.5 font-semibold text-white shadow-[var(--shadow-card)] transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            Clock In
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPendingAction('clock-out')}
            disabled={isSubmitting || !isClockedIn}
            className="rounded-2xl bg-brand-gold py-3.5 font-semibold text-brand-teal shadow-[var(--shadow-raised)] transition-opacity disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            Clock Out
          </motion.button>
        </div>
      </div>

      <Dialog
        open={pendingAction !== null}
        title={pendingAction === 'clock-in' ? 'Clock in now?' : 'Clock out now?'}
        message={
          pendingAction === 'clock-in'
            ? 'This will record your check-in time as right now.'
            : 'This will end your session for today and record your check-out time as right now.'
        }
        confirmLabel={pendingAction === 'clock-in' ? 'Clock In' : 'Clock Out'}
        cancelLabel="Cancel"
        onConfirm={() => pendingAction && handleClock(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
