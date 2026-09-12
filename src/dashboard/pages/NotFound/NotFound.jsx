import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import logo from '../../../assets/logo.png';
import logoDark from '../../../assets/logo-dark.png';
import logoLight from '../../../assets/logo-light.png';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../auth/context/AuthContext';
import { ThemeToggle } from '../../../components/common/ThemeToggle/ThemeToggle';
import './NotFound.scss';

const NotFound = () => {
  const { theme, isLight, isDark } = useTheme();
  const { currentUser } = useAuth();

  // Dynamic logo selection:
  // - Light theme -> logoLight (charcoal logo for light background)
  // - Dark theme  -> logoDark (silver/white logo for dark background)
  // - Default     -> logo (gold logo for black obsidian background)
  const currentLogo = isLight ? logoLight : isDark ? logoDark : logo;

  return (
    <Box className="not-found-page" data-theme={theme}>
      {/* Top right theme toggle */}
      <div className="not-found-page__top-nav">
        <ThemeToggle />
      </div>

      {/* Background ambient lighting decorations */}
      <div className="not-found-page__ambient-glow" />
      <div className="not-found-page__top-accent-bar" />

      <Container maxWidth="md" className="not-found-page__container">
        {/* Big Brand Logo with Luxury Halo */}
        <Box className="not-found-page__logo-wrap">
          <div className="logo-halo" />
          <img
            src={currentLogo}
            alt="Aparna Saree Pre-Pleating"
            className="not-found-page__brand-logo"
            key={theme}
          />
        </Box>

        {/* Modern Glass Card */}
        <Box className="not-found-card">
          <div className="not-found-card__hairline" />

          {/* Error Tag */}
          <Box className="not-found-tag">
            <SparklesIcon className="not-found-tag__icon" />
            <Typography component="span" className="not-found-tag__text">
              Error 404 • Page Not Found
            </Typography>
          </Box>

          {/* Big Modern 404 Typography */}
          <Typography variant="h1" className="not-found-card__code">
            404
          </Typography>

          {/* Catchy Boutique Saree Pre-Pleating Title */}
          <Typography variant="h4" className="not-found-card__headline">
            This Pleat Slipped Out of Fold
          </Typography>

          {/* Description */}
          <Typography variant="body1" className="not-found-card__subtext">
            The page you are looking for might have been folded away, renamed, or is temporarily unavailable.
            Even the most exquisite drape sometimes misses a crease — let's help you find your way back.
          </Typography>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            className="not-found-card__actions"
          >
            {currentUser ? (
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/dashboard"
                startIcon={<DashboardOutlinedIcon />}
                className="primary-btn"
              >
                Back to Dashboard
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/login"
                startIcon={<LoginOutlinedIcon />}
                className="primary-btn"
              >
                Go to Login
              </Button>
            )}

            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/landing"
              startIcon={<HomeOutlinedIcon />}
              className="secondary-btn"
            >
              Landing Page
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
