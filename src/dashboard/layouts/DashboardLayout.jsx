import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { useAuth } from '../../auth/context/AuthContext';
import { AppSpinner } from '../../components/common';
import DashboardFooter from '../components/Footer/DashboardFooter';
import './DashboardLayout.scss';

const DashboardLayout = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [loading, currentUser, navigate]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  // If loading authentication or resolving user profile, render minimal loader to prevent role flicker
  if (loading || (currentUser && !userProfile)) {
    return (
      <div className="dashboard-loading-screen">
        <AppSpinner size="lg" color="gold" />
      </div>
    );
  }

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
        <Header onMobileMenuToggle={toggleMobileSidebar} />
        <main className="dashboard-layout__main">
          <div className="dashboard-layout__page-content">
            <Outlet />
          </div>
          <DashboardFooter />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
