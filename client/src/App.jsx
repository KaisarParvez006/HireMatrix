import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './state';
import { ToastProvider } from './Components/Toast';
import Landing from './Components/Landing';
import AuthPage from './Components/AuthPage';
import DashboardLayout from './Components/DashboardLayout';
import Overview from './User/Overview';
import Jobs from './User/Jobs';
import ApplicationsPage from './User/ApplicationsPage';
import Interviews from './User/Interviews';
import Analytics from './Admin/Analytics';
import UserGovernance from './Admin/UserGovernance';

const ROLE_SECTIONS = {
  Applicant:     ['overview', 'jobs', 'applications', 'interviews'],
  Recruiter:     ['overview', 'jobs', 'applications', 'interviews'],
  HR:            ['overview', 'jobs', 'applications', 'interviews', 'analytics'],
  HiringManager: ['overview', 'applications', 'interviews'],
  Admin:         ['overview', 'jobs', 'applications', 'analytics', 'users'],
};

function SectionGuard({ section, children }) {
  const { user } = useAuth();
  const allowed = ROLE_SECTIONS[user?.role] || [];
  if (!allowed.includes(section)) {
    return <Navigate to={`/dashboard/${allowed[0] || 'overview'}`} replace />;
  }
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  const defaultSection = (ROLE_SECTIONS[user.role] || ['overview'])[0];

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultSection} replace />} />
        <Route path="overview" element={<SectionGuard section="overview"><Overview /></SectionGuard>} />
        <Route path="jobs" element={<SectionGuard section="jobs"><Jobs /></SectionGuard>} />
        <Route path="applications" element={<SectionGuard section="applications"><ApplicationsPage /></SectionGuard>} />
        <Route path="interviews" element={<SectionGuard section="interviews"><Interviews /></SectionGuard>} />
        <Route path="analytics" element={<SectionGuard section="analytics"><Analytics /></SectionGuard>} />
        <Route path="users" element={<SectionGuard section="users"><UserGovernance /></SectionGuard>} />
        <Route path="*" element={<Navigate to={defaultSection} replace />} />
      </Routes>
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard/*" element={user ? <DashboardRouter /> : <Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
