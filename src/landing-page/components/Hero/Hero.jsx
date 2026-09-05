import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link as RouterLink } from 'react-router-dom';
import './Hero.scss';

const Hero = () => {
  return (
    <Container maxWidth="lg" className="landing-hero">
      <Box className="landing-hero__content">
        <Typography variant="overline" className="landing-hero__tagline">
          Luxury Pre-Pleating & Box Folding
        </Typography>
        <Typography variant="h2" component="h1" className="landing-hero__title">
          Flawless Saree Draping, Every Single Time
        </Typography>
        <Typography variant="h6" className="landing-hero__subtitle">
          Professional pleating, ironing, and box-folding crafted for brides, celebrations, and festive events.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/dashboard"
            startIcon={<DashboardIcon sx={{ color: '#000000 !important' }} />}
          >
            Launch Dashboard
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<AutoAwesomeIcon sx={{ color: '#d4af37 !important' }} />}
          >
            Explore Services
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default Hero;
