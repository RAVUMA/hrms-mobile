import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
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
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-7">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-xs"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo.jpg"
            alt="HJ Holdings"
            className="h-16 w-16 rounded-2xl object-cover shadow-lg"
          />
          <h1 className="text-center text-xl font-bold text-brand-teal">
            HJ Holdings HRMS
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-brand-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-brand-teal"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-brand-surface px-3 py-2.5 pr-10 text-base outline-none transition-colors focus:border-brand-teal"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-xl bg-brand-teal py-3 font-semibold text-white shadow-[var(--shadow-card)] disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
