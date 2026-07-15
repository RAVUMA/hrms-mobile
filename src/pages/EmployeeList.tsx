import { useEffect, useState, type FormEvent } from 'react';
import TopBar from '../components/TopBar';
import { apiGet, resolveMediaUrl } from '../api/apiClient';
import { employeeFromJson, fullName, type Employee } from '../types';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(searchTerm?: string) {
    setIsLoading(true);
    setError(null);
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const result = await apiGet(`/employee/list/employees/${query}`);
      const results = ((result.results as Record<string, unknown>[]) ?? []).map(
        employeeFromJson,
      );
      setEmployees(results);
    } catch {
      setError('Could not load employees.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    load(search);
  }

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Employees" showBack />
      <form onSubmit={handleSearch} className="p-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1E3A3A]"
        />
      </form>
      <div className="flex-1">
        {isLoading ? (
          <p className="p-6 text-center text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No employees found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {employees.map((emp) => {
              const photo = resolveMediaUrl(emp.profileUrl);
              return (
                <li key={emp.id} className="flex items-center gap-3 px-4 py-3">
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                      {emp.firstName ? emp.firstName[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {fullName(emp)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {emp.jobPositionName || emp.email || ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
