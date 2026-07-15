import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { apiPost, ApiError } from '../api/apiClient';
import type { LeaveType } from '../types';

const breakdownOptions: Array<[string, string]> = [
  ['full_day', 'Full Day'],
  ['first_half', 'First Half'],
  ['second_half', 'Second Half'],
];

export default function ApplyLeave() {
  const navigate = useNavigate();
  const location = useLocation();
  const leaveTypes = (location.state?.leaveTypes as (LeaveType | undefined)[] | undefined)
    ?.filter((t): t is LeaveType => !!t) ?? [];

  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>(
    leaveTypes[0]?.id ?? '',
  );
  const [startDate, setStartDate] = useState('');
  const [startBreakdown, setStartBreakdown] = useState('full_day');
  const [endDate, setEndDate] = useState('');
  const [endBreakdown, setEndBreakdown] = useState('full_day');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveTypeId) {
      setError('Select a leave type.');
      return;
    }
    if (!startDate) {
      setError('Select a start date.');
      return;
    }
    if (!description.trim()) {
      setError('Enter a reason for this leave.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiPost('/leave/user-request/', {
        leave_type_id: leaveTypeId,
        start_date: startDate,
        start_date_breakdown: startBreakdown,
        end_date: endDate || startDate,
        end_date_breakdown: endBreakdown,
        description: description.trim(),
      });
      navigate(-1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the leave request.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Apply for Leave" showBack />
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-sm text-gray-600">Leave Type</label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          >
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">Start Day Portion</label>
          <select
            value={startBreakdown}
            onChange={(e) => setStartBreakdown(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          >
            {breakdownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">
            End Date (optional, defaults to start date)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-600">End Day Portion</label>
          <select
            value={endBreakdown}
            onChange={(e) => setEndBreakdown(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          >
            {breakdownOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-600">Reason</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-lg bg-[#E5502F] py-3 font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
