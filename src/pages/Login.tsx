import { useState, type FormEvent } from 'react';
import { apiPost, saveSession, ApiError, UnauthorizedError } from '../api/apiClient';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost(
        '/auth/login/',
        { username: username.trim(), password },
        false,
      );

      const token = result.access as string | undefined;
      const employee = result.employee as Record<string, unknown> | undefined;
      const geoFencing = result.geo_fencing === true;

      if (!token || !employee) {
        throw new ApiError(500, 'Unexpected response from server.');
      }

      saveSession(token, employee, geoFencing);
    } catch (err) {
      if (err instanceof UnauthorizedError || err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach the server. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-7">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A3A] text-3xl text-[#E8C99B]">
            H
          </div>
          <h1 className="text-center text-xl font-bold text-[#1E3A3A]">
            HJ Holdings HRMS
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-[#1E3A3A]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-base outline-none focus:border-[#1E3A3A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-lg bg-[#E5502F] py-3 font-semibold text-white disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
