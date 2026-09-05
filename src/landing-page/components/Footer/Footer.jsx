import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import './Footer.scss';

const Footer = () => {
  return (
    <Box component="footer" className="landing-footer">
      <Container maxWidth="lg">
        <Typography variant="body2">
          &copy; {new Date().getFullYear()} Aparna Saree Pre-Pleating. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
