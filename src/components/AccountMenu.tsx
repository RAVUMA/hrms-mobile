import { useState } from 'react';
import { getStoredEmployee, logout } from '../api/apiClient';

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const employee = getStoredEmployee();
  const fullName = (employee?.full_name as string) ?? '';

  function handleLogout() {
    setOpen(false);
    if (confirm('Log out? You will need to sign in again to continue.')) {
      logout();
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-700"
      >
        ☺
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {fullName && (
              <div className="border-b border-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                {fullName}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
