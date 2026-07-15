import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import AccountMenu from '../components/AccountMenu';
import { apiGet, apiPostRaw, isGeoFencingEnabled } from '../api/apiClient';

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

export default function AttendanceClockTab() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function loadStatus() {
    setIsLoadingStatus(true);
    try {
      const result = await apiGet('/attendance/checking-in');
      setIsClockedIn(result.status === true);
      setClockInTime((result.clock_in as string) ?? null);
      setDuration((result.duration as string) ?? null);
    } catch {
      // keep last-known status; user can retry
    } finally {
      setIsLoadingStatus(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleClock(action: 'clock-in' | 'clock-out') {
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

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Attendance" actions={<AccountMenu />} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {isLoadingStatus ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="rounded-xl bg-gray-100 p-5 text-center">
            <div className={`text-4xl ${isClockedIn ? 'text-green-600' : 'text-gray-400'}`}>
              {isClockedIn ? '✔' : '◷'}
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900">
              {isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
            </p>
            {isClockedIn && clockInTime && (
              <p className="mt-1 text-sm text-gray-600">Since {clockInTime}</p>
            )}
            {duration && (
              <p className="mt-1 text-sm text-gray-500">Worked today: {duration}</p>
            )}
          </div>
        )}

        {message && (
          <p className={`text-center text-sm ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={() => handleClock('clock-in')}
          disabled={isSubmitting || isClockedIn}
          className="rounded-lg bg-green-600 py-3.5 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400"
        >
          Clock In
        </button>
        <button
          onClick={() => handleClock('clock-out')}
          disabled={isSubmitting || !isClockedIn}
          className="rounded-lg bg-[#E5502F] py-3.5 font-semibold text-white disabled:bg-gray-200 disabled:text-gray-400"
        >
          Clock Out
        </button>
      </div>
    </div>
  );
}
