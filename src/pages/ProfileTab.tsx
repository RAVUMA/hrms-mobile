import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import Dialog from '../components/Dialog';
import { apiGet, getStoredEmployee, logout, resolveMediaUrl } from '../api/apiClient';
import { employeeDetailFromJson, fullName, type EmployeeDetail } from '../types';

function Section({
  title,
  rows,
  delay,
}: {
  title: string;
  rows: [string, string][];
  delay: number;
}) {
  if (rows.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="rounded-2xl bg-brand-surface p-4"
    >
      <h2 className="mb-3 text-sm font-bold text-brand-teal">{title}</h2>
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 py-1 text-sm">
          <span className="w-32 shrink-0 text-gray-500">{label}</span>
          <span className="text-gray-900">{value}</span>
        </div>
      ))}
    </motion.div>
  );
}

export default function ProfileTab() {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const stored = getStoredEmployee();
      const id = stored?.id;
      if (!id) throw new Error('No logged-in employee found.');
      const result = await apiGet(`/employee/employees/${id}/`);
      setEmployee(employeeDetailFromJson(result));
    } catch {
      setError('Could not load your profile.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleLogout() {
    setConfirmLogout(false);
    logout();
  }

  const photoUrl = employee ? resolveMediaUrl(employee.profileUrl) : null;
  const location = employee
    ? [employee.city, employee.state, employee.country].filter(Boolean).join(', ')
    : '';

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div
        className="flex flex-col items-center px-5 pb-8 pt-8 text-white"
        style={{
          background:
            'linear-gradient(160deg, var(--color-brand-teal-light) 0%, var(--color-brand-teal) 45%, var(--color-brand-teal-dark) 100%)',
        }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="rounded-full" />
            <div className="h-22 w-22" style={{ height: 88, width: 88 }}>
              <Skeleton className="h-full w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : error ? (
          <p className="text-sm text-brand-cream/80">{error}</p>
        ) : employee ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="rounded-full object-cover ring-4 ring-white/10"
                style={{ height: 88, width: 88 }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-brand-gold ring-4 ring-white/10"
                style={{ height: 88, width: 88 }}
              >
                {employee.firstName ? employee.firstName[0].toUpperCase() : '?'}
              </div>
            )}
            <p className="mt-3 text-xl font-bold">{fullName(employee)}</p>
            {employee.badgeId && (
              <p className="text-sm text-brand-cream/70">ID: {employee.badgeId}</p>
            )}
            {(employee.jobPositionName || employee.departmentName) && (
              <p className="text-sm text-brand-cream/70">
                {[employee.jobPositionName, employee.departmentName]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </motion.div>
        ) : null}
      </div>

      <div className="flex-1 p-5">
        {employee && (
          <div className="flex flex-col gap-4">
            <Section
              delay={0.05}
              title="Contact Information"
              rows={[
                ['Email', employee.email],
                ['Phone', employee.phone],
                ...(location ? ([['Location', location]] as [string, string][]) : []),
                ...(employee.address
                  ? ([['Address', employee.address]] as [string, string][])
                  : []),
              ]}
            />

            <Section
              delay={0.1}
              title="Personal Information"
              rows={[
                ...(employee.dob ? ([['Date of Birth', employee.dob]] as [string, string][]) : []),
                ...(employee.gender ? ([['Gender', employee.gender]] as [string, string][]) : []),
                ...(employee.maritalStatus
                  ? ([['Marital Status', employee.maritalStatus]] as [string, string][])
                  : []),
                ...(employee.children != null
                  ? ([['Children', String(employee.children)]] as [string, string][])
                  : []),
                ...(employee.qualification
                  ? ([['Qualification', employee.qualification]] as [string, string][])
                  : []),
                ...(employee.experience != null
                  ? ([['Experience', `${employee.experience} years`]] as [string, string][])
                  : []),
              ]}
            />

            {employee.emergencyContact && (
              <Section
                delay={0.15}
                title="Emergency Contact"
                rows={[
                  ...(employee.emergencyContactName
                    ? ([['Name', employee.emergencyContactName]] as [string, string][])
                    : []),
                  ['Phone', employee.emergencyContact],
                  ...(employee.emergencyContactRelation
                    ? ([['Relation', employee.emergencyContactRelation]] as [string, string][])
                    : []),
                ]}
              />
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmLogout(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 font-semibold text-red-600"
            >
              <LogOut size={17} /> Log out
            </motion.button>
          </div>
        )}
      </div>

      <Dialog
        open={confirmLogout}
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
