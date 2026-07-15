import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn, onAuthChange } from '../api/apiClient';

/** Mirrors the Flutter app's `_SessionGate`: redirects to /login whenever
 * the session is cleared from anywhere (user logout, or an auto-detected
 * expired/invalid token), and reactively lets a fresh login back in. */
export default function AuthGate() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    return onAuthChange(setLoggedIn);
  }, []);

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
