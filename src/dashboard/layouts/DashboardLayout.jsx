import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import CurvedBottomBar from '../components/CurvedBottomBar/CurvedBottomBar';
import { useAuth } from '../../auth/context/AuthContext';
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
