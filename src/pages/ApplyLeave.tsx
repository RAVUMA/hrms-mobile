import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import TopBar from '../components/TopBar';
import { apiPost, ApiError } from '../api/apiClient';
import type { LeaveType } from '../types';

const breakdownOptions: Array<[string, string]> = [
  ['full_day', 'Full Day'],
  ['first_half', 'First Half'],
  ['second_half', 'Second Half'],
];

const fieldClass =
  'w-full rounded-xl border border-gray-200 bg-brand-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-brand-teal';

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

  async function handleSubmit(e: FormEvent) {
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

  const fields = [
    { key: 'type' },
    { key: 'start-date' },
    { key: 'start-breakdown' },
    { key: 'end-date' },
    { key: 'end-breakdown' },
    { key: 'reason' },
  ];

  return (
    <div className="flex min-h-full flex-col bg-white">
      <TopBar title="Apply for Leave" showBack />
      <motion.form
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 p-5"
      >
        {fields.map(({ key }, i) => (
          <motion.div
            key={key}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
            }}
          >
            {i === 0 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">
                  Leave Type
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                  className={fieldClass}
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {i === 1 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={fieldClass}
                />
              </>
            )}
            {i === 2 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">
                  Start Day Portion
                </label>
                <select
                  value={startBreakdown}
                  onChange={(e) => setStartBreakdown(e.target.value)}
                  className={fieldClass}
                >
                  {breakdownOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            )}
            {i === 3 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">
                  End Date (optional, defaults to start date)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={fieldClass}
                />
              </>
            )}
            {i === 4 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">
                  End Day Portion
                </label>
                <select
                  value={endBreakdown}
                  onChange={(e) => setEndBreakdown(e.target.value)}
                  className={fieldClass}
                >
                  {breakdownOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            )}
            {i === 5 && (
              <>
                <label className="mb-1 block text-sm font-medium text-brand-teal">Reason</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={fieldClass}
                />
              </>
            )}
          </motion.div>
        ))}

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-600">
            {error}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="mt-2 rounded-xl bg-brand-teal py-3 font-semibold text-white shadow-[var(--shadow-card)] disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </motion.button>
      </motion.form>
    </div>
  );
}
