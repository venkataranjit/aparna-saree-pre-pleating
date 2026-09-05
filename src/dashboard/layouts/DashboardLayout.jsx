import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { useAuth } from '../../auth/context/AuthContext';
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

  // If loading without any cached user session, render minimal loader to prevent identity flicker
  if (loading && !currentUser && !userProfile) {
    return (
      <Box
        sx={{
          height: '100dvh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080808',
        }}
      >
        <CircularProgress sx={{ color: '#d4af37' }} size={36} thickness={4} />
      </Box>
    );
  }

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
