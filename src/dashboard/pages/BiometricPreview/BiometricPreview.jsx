import React, { useState } from "react";
import { BiometricLockScreenView } from "../../components/BiometricAuthGuard/BiometricAuthGuard";
import { ThemeToggle } from "../../../components/common";
import "./BiometricPreview.scss";

export default function BiometricPreview() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const simulateScan = () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setIsSuccess(false);

    setTimeout(() => {
      setIsAuthenticating(false);
    }, 1500);
  };

  const simulateSuccess = () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setTimeout(() => {
      setIsAuthenticating(false);
      setIsSuccess(true);
    }, 800);
  };

  const simulateError = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthError("Fingerprint not recognized. Tap sensor to retry or use PIN.");
    }, 900);
  };

  const resetState = () => {
    setIsAuthenticating(false);
    setAuthError(null);
    setIsSuccess(false);
  };

  return (
    <div className="biometric-preview-container">
      {/* Floating Preview Control Bar */}
      <div className="preview-toolbar">
        <span className="preview-label">Live Biometric UI Preview</span>
        <ThemeToggle variant="segmented" size="sm" showLabels={false} />
        <div className="preview-btn-group">
          <button
            type="button"
            className="btn-sim scan"
            onClick={simulateScan}
          >
            Simulate Scan
          </button>
          <button
            type="button"
            className="btn-sim success"
            onClick={simulateSuccess}
          >
            Simulate Success
          </button>
          <button
            type="button"
            className="btn-sim error"
            onClick={simulateError}
          >
            Simulate Error
          </button>
          <button
            type="button"
            className="btn-sim reset"
            onClick={resetState}
          >
            Reset
          </button>
        </div>
      </div>

      {isSuccess ? (
        <div className="preview-unlocked-banner">
          <div className="unlocked-card">
            <h3>Authentication Successful</h3>
            <p>Dashboard Unlocked Successfully</p>
            <button
              type="button"
              className="btn-re-lock"
              onClick={resetState}
            >
              Lock Again
            </button>
          </div>
        </div>
      ) : (
        <BiometricLockScreenView
          isAuthenticating={isAuthenticating}
          authError={authError}
          onAuthenticate={simulateScan}
          onLogout={() => {
            alert("Logout triggered from preview");
          }}
        />
      )}
    </div>
  );
}
