import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AgentCommandCenterPage from './pages/AgentCommandCenterPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AttendancePage from './pages/AttendancePage';
import AddEmployeePage from './pages/AddEmployeePage';
import CoreHRPage from './pages/CoreHRPage';
import DashboardPage from './pages/DashboardPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeeListPage from './pages/EmployeeListPage';
import LeavePage from './pages/LeavePage';
import LoginPage from './pages/LoginPage';
import ManagerApprovalsPage from './pages/ManagerApprovalsPage';
import ManagerReports from './pages/ManagerReports';
import MyRequestsPage from './pages/MyRequestsPage';
import OnboardingPage from './pages/OnboardingPage';
import PayrollConfigPage from './pages/PayrollConfigPage';
import PayrollRunPage from './pages/PayrollRunPage';
import PayslipPage from './pages/PayslipPage';
import RecruitmentPage from './pages/RecruitmentPage';
import RegularizationRequestsPage from './pages/RegularizationRequestsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

import MyTravelPage from './pages/expenses/MyTravelPage';
import MyExpensesPage from './pages/expenses/MyExpensesPage';
import ApprovalsPage from './pages/expenses/ApprovalsPage';

import CultureHubPage from './pages/CultureHubPage';
import GrowthHubPage from './pages/GrowthHubPage';
import ManagerAppraisalsPage from './pages/ManagerAppraisalsPage';

import ITAdminDeskPage from './pages/ITAdminDeskPage';
import EmployeeServicesPage from './pages/EmployeeServicesPage';
import ExitManagementPage from './pages/ExitManagementPage';

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
          path="/core-hr"
          element={
            <ProtectedRoute roles={['hr_admin', 'manager']}>
              <CoreHRPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/core-hr/employees"
          element={
            <ProtectedRoute roles={['hr_admin', 'manager']}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/core-hr/employees/add"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <AddEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/core-hr/employees/:id"
          element={
            <ProtectedRoute roles={['hr_admin', 'manager']}>
              <EmployeeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruitment"
          element={
            <ProtectedRoute roles={['hr_admin', 'manager']}>
              <RecruitmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute roles={['hr_admin', 'manager']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
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
          path="/regularization-requests"
          element={
            <ProtectedRoute roles={['employee', 'manager']}>
              <RegularizationRequestsPage />
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
          path="/manager/reports"
          element={
            <ProtectedRoute roles={['manager', 'hr_admin']}>
              <ManagerReports />
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
        <Route
          path="/payroll/config"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <PayrollConfigPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll/runs"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <PayrollRunPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-payslips"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <PayslipPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/my-travel"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <MyTravelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/my-claims"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <MyExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/manager-approvals"
          element={
            <ProtectedRoute roles={['manager', 'hr_admin']}>
              <ApprovalsPage role="manager" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/finance-desk"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <ApprovalsPage role="finance" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/culture-hub"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <CultureHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/growth-hub"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <GrowthHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-appraisals"
          element={
            <ProtectedRoute roles={['manager', 'hr_admin']}>
              <ManagerAppraisalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/it-admin-desk"
          element={
            <ProtectedRoute roles={['hr_admin']}>
              <ITAdminDeskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-services"
          element={
            <ProtectedRoute roles={['employee', 'manager', 'hr_admin']}>
              <EmployeeServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exit-management"
          element={
            <ProtectedRoute roles={['manager', 'hr_admin']}>
              <ExitManagementPage />
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
