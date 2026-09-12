import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';

/**
 * ProtectedRoute: Synchronously blocks unauthenticated access to dashboard/admin routes
 * and redirects immediately to /login with zero visual flicker or content flash.
 */
export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * PublicRoute: Blocks already-authenticated users from re-entering login/register pages
 * and redirects immediately to /dashboard.
 */
export const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
