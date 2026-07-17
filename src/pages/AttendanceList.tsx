import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin } from 'lucide-react';
import TopBar from '../components/TopBar';
import { SkeletonList } from '../components/Skeleton';
import { apiGet } from '../api/apiClient';
import { attendanceRecordFromJson, type AttendanceRecord } from '../types';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <span className="w-36 shrink-0 text-gray-500">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function LocationRow({
  label,
  latitude,
  longitude,
}: {
  label: string;
  latitude?: number;
  longitude?: number;
}) {
  if (latitude == null || longitude == null) return null;
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <span className="w-36 shrink-0 text-gray-500">{label}</span>
      <a
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-brand-teal underline underline-offset-2"
      >
        <MapPin size={13} /> View on map
      </a>
    </div>
  );
}

export default function AttendanceList() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selected, setSelected] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiGet('/attendance/my-attendance/');
      const results = ((result.results as Record<string, unknown>[]) ?? []).map(
        attendanceRecordFromJson,
      );
      setRecords(results);
    } catch {
      setError('Could not load attendance records.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar title="My Attendance" showBack />
      <div className="flex-1 px-4">
        {isLoading ? (
          <div className="py-2">
            <SkeletonList />
          </div>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No attendance records found.</p>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {records.map((r, i) => {
              const hasOvertime = r.overtime && r.overtime !== '00:00';
              const isComplete = !!r.clockOut;
              return (
                <motion.li
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(r)}
                  className="flex items-center justify-between rounded-2xl bg-brand-surface p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-teal">{r.attendanceDate}</p>
                    <p className="truncate text-xs text-gray-500">
                      {isComplete
                        ? `${r.clockIn ?? '--'} → ${r.clockOut ?? '--'}`
                        : r.clockIn
                          ? `Clocked in at ${r.clockIn} · still open`
                          : 'No clock-in recorded'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-brand-teal">{r.workedHour ?? '--'}</span>
                    <div className="flex gap-1">
                      {hasOvertime && (
                        <Badge
                          label={`OT ${r.overtime}`}
                          color={r.overtimeApproved ? '#c9a06a' : '#6b7280'}
                        />
                      )}
                      <Badge
                        label={r.validated ? 'Validated' : 'Pending'}
                        color={r.validated ? '#1e3a3a' : '#475569'}
                      />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-end bg-black/40"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="w-full rounded-t-3xl bg-white p-5"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 480, margin: '0 auto' }}
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />
              <h2 className="mb-3 text-lg font-bold text-brand-teal">{selected.attendanceDate}</h2>
              <DetailRow
                label="Check-in"
                value={`${selected.clockIn ?? '--'} (${selected.clockInDate ?? '--'})`}
              />
              <LocationRow
                label="Check-in location"
                latitude={selected.clockInLatitude}
                longitude={selected.clockInLongitude}
              />
              <DetailRow
                label="Check-out"
                value={
                  selected.clockOut
                    ? `${selected.clockOut} (${selected.clockOutDate ?? '--'})`
                    : 'Not clocked out yet'
                }
              />
              <LocationRow
                label="Check-out location"
                latitude={selected.clockOutLatitude}
                longitude={selected.clockOutLongitude}
              />
              <DetailRow label="Worked hours" value={selected.workedHour ?? '--'} />
              <DetailRow label="Minimum hours (shift)" value={selected.minimumHour ?? '--'} />
              <DetailRow
                label="Overtime"
                value={`${selected.overtime ?? '00:00'}${
                  selected.overtimeApproved ? ' (approved)' : ' (pending approval)'
                }`}
              />
              <DetailRow
                label="Attendance validated"
                value={selected.validated ? 'Yes' : 'Pending'}
              />
              {selected.isValidateRequest && (
                <DetailRow label="Regularization request" value="Awaiting approval" />
              )}
              {selected.isHoliday && <DetailRow label="Holiday" value="Yes" />}
              {selected.requestDescription && (
                <DetailRow label="Note" value={selected.requestDescription} />
              )}
              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full rounded-xl bg-brand-teal py-2.5 text-sm font-medium text-white"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
