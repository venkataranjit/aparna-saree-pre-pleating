import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../../firebase/config';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { AppButton, AppInput, AppSpinner } from '../../../components/common';
import brandLogo from '../../../assets/logo.png';
import AuthDesktopBrand from '../../components/AuthDesktopBrand/AuthDesktopBrand';
import AuthFooter from '../../components/AuthFooter/AuthFooter';
import CardStorefrontLink from '../../components/CardStorefrontLink/CardStorefrontLink';
import './ResetPassword.scss';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Firebase passes oobCode in query params
  const oobCode = searchParams.get('oobCode');

  const [verifyingCode, setVerifyingCode] = useState(true);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [codeError, setCodeError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate the oobCode with Firebase on mount
  useEffect(() => {
    if (!oobCode) {
      setCodeError('No password reset code found in link. Please request a new password reset link.');
      setVerifyingCode(false);
      return;
    }

    const verifyCode = async () => {
      try {
        if (!auth) throw new Error('Firebase Auth is not initialized');
        const email = await verifyPasswordResetCode(auth, oobCode);
        setVerifiedEmail(email);
      } catch (err) {
        console.warn('verifyPasswordResetCode error:', err);
        if (err.code === 'auth/expired-action-code') {
          setCodeError('This password reset link has expired. Please request a new link.');
        } else if (err.code === 'auth/invalid-action-code') {
          setCodeError('This password reset link is invalid or has already been used.');
        } else {
          setCodeError(err.message || 'Unable to verify reset link. Please request a new one.');
        }
      } finally {
        setVerifyingCode(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitError('');

    if (!password || password.length < 6) {
      setSubmitError('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setSubmitting(true);

    try {
      if (!auth) throw new Error('Firebase Auth is not initialized');
      await confirmPasswordReset(auth, oobCode, password.trim());
      setResetSuccess(true);
    } catch (err) {
      console.error('confirmPasswordReset error:', err);
      if (err.code === 'auth/weak-password') {
        setSubmitError('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/expired-action-code') {
        setSubmitError('Your reset link has expired. Please request a new one.');
      } else {
        setSubmitError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reset-screen">
      {/* Ambient luxury background glow */}
      <div className="reset-screen__glow reset-screen__glow--top" />
      <div className="reset-screen__glow reset-screen__glow--bottom" />

      {/* Reset Password Screen Container */}
      <div className="reset-screen__container">
        <AuthDesktopBrand />

        <div className="reset-card">
          <div className="reset-card__top-bar" />

          <div className="reset-card__content">
            {/* Inside-Card Return to Storefront Link */}
            <CardStorefrontLink />

            {/* Brand Crest & Header */}
            <div className="reset-card__header">
              <div className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img"
                />
              </div>
              <h1 className="reset-title">Set New Password</h1>
              <p className="reset-subtitle">
                {verifiedEmail
                  ? `Choose a secure new password for ${verifiedEmail}`
                  : 'Enter your new account password below to regain portal access.'}
              </p>
            </div>

            {/* Verifying Link State */}
            {verifyingCode && (
              <div className="reset-state-box">
                <AppSpinner size="lg" color="gold" />
                <p className="state-text">Verifying security link with Firebase...</p>
              </div>
            )}

            {/* Invalid or Expired Code Error */}
            {!verifyingCode && codeError && (
              <div className="reset-state-box">
                <div className="feedback-alert error-alert">
                  <ErrorOutlineIcon className="alert-inline-icon" />
                  <span>{codeError}</span>
                </div>
                <div style={{ marginTop: '20px', width: '100%' }}>
                  <AppButton
                    variant="primary"
                    fullWidth
                    onClick={() => navigate('/forgot-password')}
                  >
                    Request New Reset Link
                  </AppButton>
                </div>
              </div>
            )}

            {/* Success State */}
            {!verifyingCode && resetSuccess && (
              <div className="reset-state-box">
                <div className="feedback-alert success-alert">
                  <CheckCircleOutlineIcon className="alert-inline-icon" />
                  <span>Your password has been reset successfully!</span>
                </div>
                <p className="success-instruction">
                  You can now use your new password to sign in to your Aparna Saree Pre-Pleating dashboard.
                </p>
                <div style={{ marginTop: '24px', width: '100%' }}>
                  <AppButton
                    variant="primary"
                    fullWidth
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/login')}
                  >
                    Proceed to Sign In
                  </AppButton>
                </div>
              </div>
            )}

            {/* Reset Password Form */}
            {!verifyingCode && !codeError && !resetSuccess && (
              <form onSubmit={handleSubmit} className="reset-form" noValidate>
                {submitError && (
                  <div className="feedback-alert error-alert">
                    <ErrorOutlineIcon className="alert-inline-icon" />
                    <span>{submitError}</span>
                    <button
                      type="button"
                      className="alert-close-btn"
                      onClick={() => setSubmitError('')}
                    >
                      &times;
                    </button>
                  </div>
                )}

                <AppInput
                  label="New Password"
                  id="new-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                  autoFocus
                  startAdornment={<LockOutlinedIcon />}
                  endAdornment={
                    <button
                      type="button"
                      tabIndex="-1"
                      className="toggle-pw-btn"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </button>
                  }
                />

                <AppInput
                  label="Confirm New Password"
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="new-password"
                  startAdornment={<LockOutlinedIcon />}
                />

                <AppButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={submitting}
                  className="submit-btn"
                >
                  Save New Password
                </AppButton>

                <div className="auth-links-group">
                  <Link to="/login" className="back-to-login-link">
                    <ArrowBackIcon className="inline-arrow" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </form>
            )}

            {/* Footer Security Badge */}
            <div className="reset-card__footer">
              <SecurityIcon className="security-icon" />
              <span className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End Encryption
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Luxury Footer with Developer Credit */}
      <AuthFooter />
    </div>
  );
};

export default ResetPassword;
