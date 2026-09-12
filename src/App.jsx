import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { dashboardRoutes } from './dashboard/routes/dashboardRoutes';
import { landingRoutes } from './landing-page/routes/landingRoutes';
import Login from './auth/pages/Login/Login';
import Register from './auth/pages/Register/Register';
import ForgotPassword from './auth/pages/ForgotPassword/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword/ResetPassword';
import NotFound from './dashboard/pages/NotFound/NotFound';
import { AuthProvider, useAuth } from './auth/context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PageLoader } from './components/common';
import { PublicRoute } from './components/routes/ProtectedRoute';
import './App.scss';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [animationDone, setAnimationDone] = React.useState(false);
  const [pageLoaded, setPageLoaded] = React.useState(false);

  React.useEffect(() => {
    // Page load is complete once the 0-100 animation finishes AND initial auth has resolved
    if (animationDone && !loading) {
      setPageLoaded(true);
    }
  }, [animationDone, loading]);

  // Safety fallback: Never keep user waiting more than 500ms after 0-100 animation finishes even if offline or network slow
  React.useEffect(() => {
    if (animationDone && !pageLoaded) {
      const timer = setTimeout(() => {
        setPageLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animationDone, pageLoaded]);

  // PageLoader runs strictly ONCE on page load/refresh
  if (!pageLoaded) {
    return <PageLoader onComplete={() => setAnimationDone(true)} />;
  }

  return (
    <div className="app-root">
      <Routes>
        {/* Default route: If authenticated -> /dashboard, if unauthenticated -> /login directly */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Dashboard module routes (Guarded by ProtectedRoute) */}
        {dashboardRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element}>
            {route.children?.map((child) => (
              <Route
                key={child.index ? 'index' : child.path}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        ))}

        {/* Landing page module routes */}
        {landingRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Authentication routes (Public Only) */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/action" element={<ResetPassword />} />
        <Route path="/__/auth/action" element={<ResetPassword />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

