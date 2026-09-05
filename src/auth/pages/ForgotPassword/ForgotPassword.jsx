import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import brandLogo from '../../../assets/logo.png';
import './ForgotPassword.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleReset = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);

    try {
      if (auth) {
        await sendPasswordResetEmail(auth, email.trim());
      }
      setSuccessMsg(`Password reset link sent to ${email.trim()}. Please check your inbox and spam folder.`);
    } catch (err) {
      console.warn('Firebase password reset error:', err);
      let message = 'Unable to send reset email. Please verify the address.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'The email address format is invalid.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a few moments before trying again.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="forgot-screen">
      {/* Ambient luxury background lighting */}
      <div className="forgot-screen__glow forgot-screen__glow--top" />
      <div className="forgot-screen__glow forgot-screen__glow--bottom" />

      {/* Top back navigation link */}
      <Box className="forgot-screen__top-nav">
        <Link to="/landing" className="back-link">
          <ArrowBackIcon className="back-icon" />
          <span>Return to Storefront</span>
        </Link>
      </Box>

      {/* Centered Forgot Password Card */}
      <Box className="forgot-screen__container">
        <Card className="forgot-card">
          <div className="forgot-card__top-bar" />

          <CardContent className="forgot-card__content">
            {/* Brand Crest & Header with enlarged logo */}
            <Box className="forgot-card__header">
              <Box className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img"
                />
              </Box>
              <Typography variant="h4" className="forgot-title">
                Forgot Password
              </Typography>
              <Typography variant="body2" className="forgot-subtitle">
                Enter your registered email address and we'll send you recovery instructions.
              </Typography>
            </Box>

            {/* Error / Success Feedback */}
            {error && (
              <Alert severity="error" className="feedback-alert error-alert" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" className="feedback-alert success-alert">
                <CheckCircleOutlineIcon className="alert-inline-icon" />
                {successMsg}
              </Alert>
            )}

            {/* Password Reset Form */}
            <Box component="form" onSubmit={handleReset} className="forgot-form" noValidate>
              {/* Email Input */}
              <Box className="input-group">
                <Typography component="label" className="input-label">
                  Registered Email Address
                </Typography>
                <TextField
                  fullWidth
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  className="luxury-text-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon className="field-icon" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Primary Send Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={<LockResetIcon className="btn-icon" />}
                className="submit-btn"
              >
                {loading ? (
                  <CircularProgress size={22} sx={{ color: '#000000' }} />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </Button>

              {/* Cross-Screen Navigation Links */}
              <Box className="auth-links-group">
                <Link to="/login" className="back-to-login-link">
                  <ArrowBackIcon className="inline-arrow" />
                  <span>Back to Sign In</span>
                </Link>

                <Box className="auth-switch-row">
                  <Typography variant="body2" className="switch-prompt">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-highlight-link">
                      Create Account
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer Security Badge */}
            <Box className="forgot-card__footer">
              <SecurityIcon className="security-icon" />
              <Typography variant="caption" className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End Encryption
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
