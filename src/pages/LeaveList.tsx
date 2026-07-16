import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoreVertical } from 'lucide-react';
import TopBar from '../components/TopBar';
import Dialog from '../components/Dialog';
import { Skeleton, SkeletonList } from '../components/Skeleton';
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
      return '#1e3a3a';
    case 'rejected':
      return '#dc2626';
    case 'cancelled':
      return '#6b7280';
    default:
      return '#c9a06a';
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
  const [confirmAction, setConfirmAction] = useState<
    { type: 'withdraw' | 'cancel'; request: LeaveRequest } | null
  >(null);
  const [infoDialog, setInfoDialog] = useState<string | null>(null);

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
      setInfoDialog('No leave types are available to you.');
      return;
    }
    navigate('/leaves/apply', { state: { leaveTypes: balances.map((b) => b.leaveType) } });
  }

  async function performConfirmedAction() {
    if (!confirmAction) return;
    const { type, request } = confirmAction;
    setConfirmAction(null);
    try {
      if (type === 'withdraw') {
        await apiDelete(`/leave/user-request/${request.id}/`);
      } else {
        await apiPut(`/leave/cancel/${request.id}/`);
      }
      load();
    } catch {
      setInfoDialog(
        type === 'withdraw' ? 'Could not withdraw the request.' : 'Could not cancel this leave.',
      );
    }
  }

  return (
    <div className="relative flex min-h-full flex-col bg-white">
      <TopBar title="Leaves" showBack />

      <div className="flex-1 pb-40">
        {isLoading ? (
          <div className="flex flex-col gap-4 px-4 pt-4">
            <div className="flex gap-3">
              <Skeleton className="h-24 w-32 shrink-0 rounded-2xl" />
              <Skeleton className="h-24 w-32 shrink-0 rounded-2xl" />
            </div>
            <SkeletonList count={3} />
          </div>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : (
          <>
            {balances.length > 0 && (
              <>
                <h2 className="px-4 pt-4 pb-2 text-base font-bold text-brand-teal">
                  Leave Balance
                </h2>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2">
                  {balances.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                      className="w-32 shrink-0 rounded-2xl bg-brand-teal p-3 shadow-[var(--shadow-card)]"
                    >
                      <p className="truncate text-xs text-brand-cream/70">
                        {b.leaveType?.name ?? 'Leave'}
                      </p>
                      <p className="mt-1 text-xl font-bold text-brand-gold">
                        {b.totalLeaveDays.toFixed(1)}
                      </p>
                      <p className="text-[11px] text-brand-cream/70">days left</p>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            <h2 className="px-4 pt-4 pb-2 text-base font-bold text-brand-teal">
              My Requests
            </h2>
            {requests.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No leave requests yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 px-4">
                {requests.map((r, i) => {
                  const dateRange =
                    r.endDate && r.endDate !== r.startDate
                      ? `${r.startDate} → ${r.endDate}`
                      : r.startDate;
                  const canManage = r.status === 'requested' || canCancelApproved(r);
                  return (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.2 }}
                      className="flex items-center justify-between rounded-2xl bg-brand-surface p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-teal">
                          {r.leaveType?.name ?? 'Leave'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {dateRange}
                          {r.requestedDays != null ? ` · ${r.requestedDays} day(s)` : ''}
                        </p>
                      </div>
                      <div className="relative flex shrink-0 items-center gap-1">
                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${statusColor(r.status)}26`,
                            color: statusColor(r.status),
                          }}
                        >
                          {r.status}
                        </span>
                        {canManage && (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                setMenuOpenFor(menuOpenFor === r.id ? null : r.id)
                              }
                              className="p-1 text-gray-500"
                              aria-label="Actions"
                            >
                              <MoreVertical size={16} />
                            </motion.button>
                            <AnimatePresence>
                              {menuOpenFor === r.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpenFor(null)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
                                  >
                                    {r.status === 'requested' && (
                                      <button
                                        onClick={() => {
                                          setMenuOpenFor(null);
                                          setConfirmAction({ type: 'withdraw', request: r });
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                      >
                                        Withdraw
                                      </button>
                                    )}
                                    {canCancelApproved(r) && (
                                      <button
                                        onClick={() => {
                                          setMenuOpenFor(null);
                                          setConfirmAction({ type: 'cancel', request: r });
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                      >
                                        Cancel leave
                                      </button>
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-10 flex justify-center">
        <div className="flex w-full justify-center" style={{ maxWidth: 480 }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={openApply}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-brand-teal px-5 py-3 font-semibold text-brand-gold shadow-[var(--shadow-raised)]"
          >
            <Plus size={18} strokeWidth={2.5} /> Apply
          </motion.button>
        </div>
      </div>

      <Dialog
        open={confirmAction !== null}
        title={confirmAction?.type === 'withdraw' ? 'Withdraw request?' : 'Cancel leave?'}
        message={
          confirmAction?.type === 'withdraw'
            ? 'This pending leave request will be withdrawn.'
            : 'This approved leave will be cancelled.'
        }
        confirmLabel={confirmAction?.type === 'withdraw' ? 'Withdraw' : 'Cancel Leave'}
        cancelLabel="Back"
        danger
        onConfirm={performConfirmedAction}
        onCancel={() => setConfirmAction(null)}
      />

      <Dialog
        open={infoDialog !== null}
        title="Leaves"
        message={infoDialog ?? ''}
        confirmLabel="OK"
        onConfirm={() => setInfoDialog(null)}
      />
    </div>
  );
}
