import { useEffect, useState } from 'react';
import TopBar from '../components/TopBar';
import { apiGet, getStoredEmployee, logout, resolveMediaUrl } from '../api/apiClient';
import { employeeDetailFromJson, fullName, type EmployeeDetail } from '../types';

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl bg-gray-100 p-4">
      <h2 className="mb-3 text-sm font-bold text-gray-900">{title}</h2>
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 py-1 text-sm">
          <span className="w-32 shrink-0 text-gray-500">{label}</span>
          <span className="text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProfileTab() {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (confirm('Log out? You will need to sign in again to continue.')) {
      logout();
    }
  }

  const photoUrl = employee ? resolveMediaUrl(employee.profileUrl) : null;
  const location = employee
    ? [employee.city, employee.state, employee.country].filter(Boolean).join(', ')
    : '';

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Profile" />
      <div className="flex-1 p-5">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-center text-gray-500">{error}</p>
        ) : employee ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-22 w-22 rounded-full object-cover"
                  style={{ height: 88, width: 88 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-600"
                  style={{ height: 88, width: 88 }}
                >
                  {employee.firstName ? employee.firstName[0].toUpperCase() : '?'}
                </div>
              )}
              <p className="text-xl font-bold text-gray-900">{fullName(employee)}</p>
              {employee.badgeId && (
                <p className="text-sm text-gray-500">ID: {employee.badgeId}</p>
              )}
              {(employee.jobPositionName || employee.departmentName) && (
                <p className="text-sm text-gray-500">
                  {[employee.jobPositionName, employee.departmentName]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>

            <Section
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

            <button
              onClick={handleLogout}
              className="rounded-lg border border-red-600 py-3 font-semibold text-red-600"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
