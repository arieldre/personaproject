import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import { useThemeStore } from './context/themeStore';

// Layouts
import MainLayout from './components/common/MainLayout';
import AuthLayout from './components/common/AuthLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import InvitePage from './pages/InvitePage';
import DashboardPage from './pages/DashboardPage';
import PersonasPage from './pages/PersonasPage';
import PersonaDetailPage from './pages/PersonaDetailPage';
import ChatPage from './pages/ChatPage';
import FindPersonaPage from './pages/FindPersonaPage';
import QuestionnairesPage from './pages/QuestionnairesPage';
import QuestionnaireCreatePage from './pages/QuestionnaireCreatePage';
import QuestionnaireDetailPage from './pages/QuestionnaireDetailPage';
import QuestionnaireResponsePage from './pages/QuestionnaireResponsePage';
import UsersPage from './pages/UsersPage';
import CompaniesPage from './pages/CompaniesPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import VCPQPage from './pages/VCPQPage';

// Loading spinner
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};

function App() {
  const { initialize, isLoading } = useAuthStore();
  const { initialize: initializeTheme } = useThemeStore();

  useEffect(() => {
    initialize();
    initializeTheme();
  }, [initialize, initializeTheme]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
      </Route>

      {/* Public questionnaire response */}
      <Route path="/q/:code" element={<QuestionnaireResponsePage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/personas/:id" element={<PersonaDetailPage />} />
        <Route path="/personas/:id/chat" element={<ChatPage />} />
        <Route path="/personas/:id/chat/:conversationId" element={<ChatPage />} />
        <Route path="/find-persona" element={<FindPersonaPage />} />
        <Route path="/vcpq" element={<VCPQPage />} />
        <Route path="/vcpq/:id" element={<VCPQPage />} />

        {/* Admin routes */}
        <Route
          path="/questionnaires"
          element={
            <ProtectedRoute roles={['super_admin', 'company_admin']}>
              <QuestionnairesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questionnaires/new"
          element={
            <ProtectedRoute roles={['super_admin', 'company_admin']}>
              <QuestionnaireCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questionnaires/:id"
          element={
            <ProtectedRoute roles={['super_admin', 'company_admin']}>
              <QuestionnaireDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['super_admin', 'company_admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Super admin routes */}
        <Route
          path="/companies"
          element={
            <ProtectedRoute roles={['super_admin']}>
              <CompaniesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;


