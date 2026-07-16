import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { isLoggedIn, onAuthChange } from './api/apiClient';
import AuthGate from './components/AuthGate';
import TabLayout from './components/TabLayout';
import PageTransition from './components/PageTransition';
import Login from './pages/Login';
import DashboardTab from './pages/DashboardTab';
import AttendanceClockTab from './pages/AttendanceClockTab';
import ProfileTab from './pages/ProfileTab';
import EmployeeList from './pages/EmployeeList';
import AttendanceList from './pages/AttendanceList';
import LeaveList from './pages/LeaveList';
import ApplyLeave from './pages/ApplyLeave';
import AnnouncementsPage from './pages/AnnouncementsPage';

function LoginRoute() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  useEffect(() => {
    return onAuthChange(setLoggedIn);
  }, []);

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<AuthGate />}>
          <Route element={<TabLayout />}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <DashboardTab />
                </PageTransition>
              }
            />
            <Route
              path="/attendance-clock"
              element={
                <PageTransition>
                  <AttendanceClockTab />
                </PageTransition>
              }
            />
            <Route
              path="/profile"
              element={
                <PageTransition>
                  <ProfileTab />
                </PageTransition>
              }
            />
            <Route
              path="/employees"
              element={
                <PageTransition>
                  <EmployeeList />
                </PageTransition>
              }
            />
            <Route
              path="/attendance"
              element={
                <PageTransition>
                  <AttendanceList />
                </PageTransition>
              }
            />
            <Route
              path="/leaves"
              element={
                <PageTransition>
                  <LeaveList />
                </PageTransition>
              }
            />
            <Route
              path="/leaves/apply"
              element={
                <PageTransition>
                  <ApplyLeave />
                </PageTransition>
              }
            />
            <Route
              path="/announcements"
              element={
                <PageTransition>
                  <AnnouncementsPage />
                </PageTransition>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
