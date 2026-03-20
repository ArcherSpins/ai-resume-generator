import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './services/auth';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import CreateResumePage from './pages/CreateResumePage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 bg-slate-300" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse rounded-full h-12 w-12 bg-slate-300" />
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="create" replace />} />
        <Route path="create" element={<CreateResumePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
