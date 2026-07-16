import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import TopBar from '../components/TopBar';
import { SkeletonList } from '../components/Skeleton';
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
    <div className="flex min-h-full flex-col bg-white">
      <TopBar title="Employees" showBack />
      <form onSubmit={handleSearch} className="px-4 pb-2">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-xl border border-gray-200 bg-brand-surface py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-teal"
          />
        </div>
      </form>
      <div className="flex-1 px-4">
        {isLoading ? (
          <div className="py-2">
            <SkeletonList />
          </div>
        ) : error ? (
          <p className="p-6 text-center text-gray-500">{error}</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No employees found.</p>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {employees.map((emp, i) => {
              const photo = resolveMediaUrl(emp.profileUrl);
              return (
                <motion.li
                  key={emp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.2 }}
                  className="flex items-center gap-3 rounded-2xl bg-brand-surface p-3"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal text-sm font-semibold text-brand-gold">
                      {emp.firstName ? emp.firstName[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-teal">
                      {fullName(emp)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {emp.jobPositionName || emp.email || ''}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
