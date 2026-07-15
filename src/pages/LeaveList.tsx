import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { apiGet, apiPut, apiDelete } from '../api/apiClient';
import {
  availableLeaveFromJson,
  leaveRequestFromJson,
  type AvailableLeave,
  type LeaveRequest,
} from '../types';

function statusColor(status: string): string {
  switch (status) {
    case 'approved':
      return '#16a34a';
    case 'rejected':
      return '#dc2626';
    case 'cancelled':
      return '#6b7280';
    default:
      return '#f97316';
  }
}

function canCancelApproved(request: LeaveRequest): boolean {
  if (request.status !== 'approved') return false;
  const start = new Date(request.startDate);
  if (isNaN(start.getTime())) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return start >= yesterday;
}

export default function LeaveList() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<AvailableLeave[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceResult, requestResult] = await Promise.all([
        apiGet('/leave/available-leave/'),
        apiGet('/leave/user-request/'),
      ]);
      setBalances(
        ((balanceResult.results as Record<string, unknown>[]) ?? []).map(
          availableLeaveFromJson,
        ),
      );
      setRequests(
        ((requestResult.results as Record<string, unknown>[]) ?? []).map(
          leaveRequestFromJson,
        ),
      );
    } catch {
      setError('Could not load leave data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openApply() {
    if (balances.length === 0) {
      alert('No leave types are available to you.');
      return;
    }
    navigate('/leaves/apply', { state: { leaveTypes: balances.map((b) => b.leaveType) } });
  }

  async function withdraw(request: LeaveRequest) {
    setMenuOpenFor(null);
    if (!confirm('Withdraw this pending leave request?')) return;
    try {
      await apiDelete(`/leave/user-request/${request.id}/`);
      load();
    } catch {
      alert('Could not withdraw the request.');
    }
  }

  async function cancelApproved(request: LeaveRequest) {
    setMenuOpenFor(null);
    if (!confirm('Cancel this approved leave?')) return;
    try {
      await apiPut(`/leave/cancel/${request.id}/`);
      load();
    } catch {
      alert('Could not cancel this leave.');
    }
  }

  return (
    <div className="relative flex min-h-full flex-col">
      <TopBar title="Leaves" showBack />

      <div className="flex-1 pb-24">
        {isLoading ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : (
          <>
            {balances.length > 0 && (
              <>
                <h2 className="px-4 pt-4 pb-2 text-base font-bold text-gray-900">
                  Leave Balance
                </h2>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2">
                  {balances.map((b) => (
                    <div
                      key={b.id}
                      className="w-32 shrink-0 rounded-lg bg-gray-100 p-3"
                    >
                      <p className="truncate text-xs text-gray-500">
                        {b.leaveType?.name ?? 'Leave'}
                      </p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {b.totalLeaveDays.toFixed(1)}
                      </p>
                      <p className="text-[11px] text-gray-500">days left</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className="px-4 pt-4 pb-2 text-base font-bold text-gray-900">
              My Requests
            </h2>
            {requests.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No leave requests yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {requests.map((r) => {
                  const dateRange =
                    r.endDate && r.endDate !== r.startDate
                      ? `${r.startDate} → ${r.endDate}`
                      : r.startDate;
                  const canManage = r.status === 'requested' || canCancelApproved(r);
                  return (
                    <li key={r.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {r.leaveType?.name ?? 'Leave'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {dateRange}
                          {r.requestedDays != null ? ` · ${r.requestedDays} day(s)` : ''}
                        </p>
                      </div>
                      <div className="relative flex shrink-0 items-center gap-1">
                        <span
                          className="rounded px-2 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${statusColor(r.status)}26`,
                            color: statusColor(r.status),
                          }}
                        >
                          {r.status}
                        </span>
                        {canManage && (
                          <>
                            <button
                              onClick={() =>
                                setMenuOpenFor(menuOpenFor === r.id ? null : r.id)
                              }
                              className="px-1 text-gray-500"
                              aria-label="Actions"
                            >
                              ⋮
                            </button>
                            {menuOpenFor === r.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenFor(null)}
                                />
                                <div className="absolute right-0 top-7 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                  {r.status === 'requested' && (
                                    <button
                                      onClick={() => withdraw(r)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                      Withdraw
                                    </button>
                                  )}
                                  {canCancelApproved(r) && (
                                    <button
                                      onClick={() => cancelApproved(r)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    >
                                      Cancel leave
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-10 flex justify-center">
        <div className="flex w-full justify-center" style={{ maxWidth: 480 }}>
          <button
            onClick={openApply}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#E5502F] px-5 py-3 font-semibold text-white shadow-lg"
          >
            + Apply
          </button>
        </div>
      </div>
    </div>
  );
}
