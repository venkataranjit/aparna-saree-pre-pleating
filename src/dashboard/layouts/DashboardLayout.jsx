import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import CurvedBottomBar from '../components/CurvedBottomBar/CurvedBottomBar';
import { useAuth } from '../../auth/context/AuthContext';
import DashboardFooter from '../components/Footer/DashboardFooter';
import './DashboardLayout.scss';

const DashboardLayout = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Synchronous guard: If auth state is still resolving, don't render dashboard UI
  if (loading) {
    return null;
  }

  // Synchronous guard: If not authenticated, redirect directly to /login with zero content flash
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const openSidebar = () => {
    if (window.innerWidth < 900) {
      setMobileOpen(true);
    } else {
      setCollapsed(false);
    }
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <div className={`dashboard-layout ${collapsed ? 'is-collapsed' : ''}`}>
      {/* Sidebar with desktop collapse and mobile drawer support */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div className="mobile-backdrop" onClick={closeMobileSidebar} />
      )}

      <div className="dashboard-layout__content-wrapper">
        <main className="dashboard-layout__main">
          <div className="dashboard-layout__page-content">
            <Outlet />
          </div>
          <DashboardFooter />
        </main>
      </div>

      {/* Fixed Bottom Bar when sidebar is collapsed or on mobile */}
      <CurvedBottomBar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onOpenSidebar={openSidebar}
      />
    </div>
  );
};

export default DashboardLayout;
