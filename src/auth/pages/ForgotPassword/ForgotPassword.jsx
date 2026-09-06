import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import { AppButton, AppInput } from '../../../components/common';
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
    <div className="forgot-screen">
      {/* Ambient luxury background lighting */}
      <div className="forgot-screen__glow forgot-screen__glow--top" />
      <div className="forgot-screen__glow forgot-screen__glow--bottom" />

      {/* Top back navigation link */}
      <div className="forgot-screen__top-nav">
        <Link to="/landing" className="back-link">
          <ArrowBackIcon className="back-icon" />
          <span>Return to Storefront</span>
        </Link>
      </div>

      {/* Centered Forgot Password Card */}
      <div className="forgot-screen__container">
        <div className="forgot-card">
          <div className="forgot-card__top-bar" />

          <div className="forgot-card__content">
            {/* Brand Crest & Header with enlarged logo */}
            <div className="forgot-card__header">
              <div className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img"
                />
              </div>
              <h1 className="forgot-title">
                Forgot Password
              </h1>
              <p className="forgot-subtitle">
                Enter your registered email address and we'll send you recovery instructions.
              </p>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="feedback-alert error-alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="alert-close-btn"
                  onClick={() => setError('')}
                >
                  &times;
                </button>
              </div>
            )}

            {successMsg && (
              <div className="feedback-alert success-alert">
                <CheckCircleOutlineIcon className="alert-inline-icon" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Password Reset Form */}
            <form onSubmit={handleReset} className="forgot-form" noValidate>
              <AppInput
                label="Registered Email Address"
                id="forgot-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                autoFocus
                startAdornment={<EmailOutlinedIcon />}
              />

              {/* Primary Send Button */}
              <AppButton
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                icon={<LockResetIcon className="btn-icon" />}
                className="submit-btn"
              >
                Send Reset Link
              </AppButton>

              {/* Cross-Screen Navigation Links */}
              <div className="auth-links-group">
                <Link to="/login" className="back-to-login-link">
                  <ArrowBackIcon className="inline-arrow" />
                  <span>Back to Sign In</span>
                </Link>

                <div className="auth-switch-row">
                  <p className="switch-prompt">
                    Don't have an account?{' '}
                    <Link to="/register" className="auth-highlight-link">
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            </form>

            {/* Footer Security Badge */}
            <div className="forgot-card__footer">
              <SecurityIcon className="security-icon" />
              <span className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End Encryption
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
