import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AgentCommandCenterPage from './pages/AgentCommandCenterPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AttendancePage from './pages/AttendancePage';
import DashboardPage from './pages/DashboardPage';
import LeavePage from './pages/LeavePage';
import LoginPage from './pages/LoginPage';
import ManagerApprovalsPage from './pages/ManagerApprovalsPage';
import MyRequestsPage from './pages/MyRequestsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/agent-command-center"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <AgentCommandCenterPage />
            </ProtectedRoute>
          }
        />
        <Route path="/ai-assistant" element={<Navigate to="/agent-command-center" replace />} />
        <Route
          path="/leave"
          element={
            <ProtectedRoute roles={['employee']}>
              <LeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute roles={['employee']}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-requests"
          element={
            <ProtectedRoute roles={['employee']}>
              <MyRequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/approvals"
          element={
            <ProtectedRoute roles={['manager']}>
              <ManagerApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit/logs"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
