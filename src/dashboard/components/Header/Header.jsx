import React from 'react';
import { AppBar, Toolbar, Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import './Header.scss';

const Header = ({ onMobileMenuToggle }) => {
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

        {/* Empty Spacer to maintain perfect center alignment on mobile */}
        <Box className="mobile-spacer" />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
