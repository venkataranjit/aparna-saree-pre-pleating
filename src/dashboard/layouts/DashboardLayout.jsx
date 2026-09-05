import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import './DashboardLayout.scss';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setMobileOpen(false);
  };

  return (
    <Box className={`dashboard-layout ${collapsed ? 'is-collapsed' : ''}`}>
      {/* Sidebar with desktop collapse and mobile drawer support */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <Box className="mobile-backdrop" onClick={closeMobileSidebar} />
      )}

      <Box className="dashboard-layout__content-wrapper">
        <Header onMobileMenuToggle={toggleMobileSidebar} />
        <Box component="main" className="dashboard-layout__main">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
