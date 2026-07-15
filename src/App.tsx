import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, onAuthChange } from './api/apiClient';
import AuthGate from './components/AuthGate';
import TabLayout from './components/TabLayout';
import Login from './pages/Login';
import ModulesTab from './pages/ModulesTab';
import AttendanceClockTab from './pages/AttendanceClockTab';
import ProfileTab from './pages/ProfileTab';
import EmployeeList from './pages/EmployeeList';
import AttendanceList from './pages/AttendanceList';
import LeaveList from './pages/LeaveList';
import ApplyLeave from './pages/ApplyLeave';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<AuthGate />}>
          <Route element={<TabLayout />}>
            <Route path="/" element={<ModulesTab />} />
            <Route path="/attendance-clock" element={<AttendanceClockTab />} />
            <Route path="/profile" element={<ProfileTab />} />
          </Route>
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/leaves" element={<LeaveList />} />
          <Route path="/leaves/apply" element={<ApplyLeave />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
