import React from 'react';
import { AppBar, Toolbar, Box, Typography, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/context/AuthContext';
import './Header.scss';

const Header = ({ onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    navigate('/login', { replace: true });
  };

  return (
    <AppBar position="sticky" className="dashboard-header">
      <Toolbar className="dashboard-header__toolbar">
        {/* Mobile menu hamburger toggle - visible only on mobile/tablet */}
        <IconButton
          onClick={onMobileMenuToggle}
          className="mobile-menu-trigger"
          aria-label="open navigation menu"
        >
          <MenuIcon sx={{ color: '#d4af37 !important', fontSize: 26 }} />
        </IconButton>

        {/* Mobile Navigation Title */}
        <Box className="dashboard-header__title-container">
          <Typography variant="h6" className="dashboard-header__title">
            Dashboard
          </Typography>
        </Box>

        {/* Mobile Logout Action */}
        <Tooltip title="Log Out" arrow>
          <IconButton
            onClick={handleLogout}
            className="mobile-logout-btn"
            aria-label="logout"
            sx={{
              color: '#d4af37 !important',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '10px',
              width: 44,
              height: 44,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.15) !important',
                color: '#ef4444 !important',
                borderColor: '#ef4444',
              },
            }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
