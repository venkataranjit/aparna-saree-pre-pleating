import React from 'react';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar/Navbar';
import Hero from '../components/Hero/Hero';
import Footer from '../components/Footer/Footer';
import './LandingPage.scss';

const LandingPage = () => {
  return (
    <Box className="landing-page-container">
      <Navbar />
      <Hero />
      <Footer />
    </Box>
  );
};

export default LandingPage;
