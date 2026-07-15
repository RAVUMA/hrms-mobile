import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { apiGet } from '../api/apiClient';
import { attendanceRecordFromJson, type AttendanceRecord } from '../types';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
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
    <div className="flex min-h-full flex-col">
      <TopBar title="My Attendance" showBack />
      <div className="flex-1">
        {isLoading ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No attendance records found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {records.map((r) => {
              const hasOvertime = r.overtime && r.overtime !== '00:00';
              const isComplete = !!r.clockOut;
              return (
                <li
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="flex items-center justify-between px-4 py-3 active:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{r.attendanceDate}</p>
                    <p className="truncate text-xs text-gray-500">
                      {isComplete
                        ? `${r.clockIn ?? '--'} → ${r.clockOut ?? '--'}`
                        : r.clockIn
                          ? `Clocked in at ${r.clockIn} · still open`
                          : 'No clock-in recorded'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold">{r.workedHour ?? '--'}</span>
                    <div className="flex gap-1">
                      {hasOvertime && (
                        <Badge
                          label={`OT ${r.overtime}`}
                          color={r.overtimeApproved ? '#f97316' : '#6b7280'}
                        />
                      )}
                      <Badge
                        label={r.validated ? 'Validated' : 'Pending'}
                        color={r.validated ? '#16a34a' : '#475569'}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full rounded-t-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, margin: '0 auto' }}
          >
            <h2 className="mb-3 text-lg font-bold text-gray-900">{selected.attendanceDate}</h2>
            <DetailRow
              label="Check-in"
              value={`${selected.clockIn ?? '--'} (${selected.clockInDate ?? '--'})`}
            />
            <DetailRow
              label="Check-out"
              value={
                selected.clockOut
                  ? `${selected.clockOut} (${selected.clockOutDate ?? '--'})`
                  : 'Not clocked out yet'
              }
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
              className="mt-4 w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
