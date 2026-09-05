import React from 'react';
import { AppBar, Toolbar, Box, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import './Navbar.scss';

const Navbar = () => {
  return (
    <AppBar position="static" elevation={0} className="landing-navbar">
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box component={RouterLink} to="/" className="landing-navbar__brand">
            <img src={logo} alt="Aparna Saree Pre-Pleating" />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/dashboard"
            >
              Go to Dashboard
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
