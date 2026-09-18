import React, { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import FingerprintOutlinedIcon from "@mui/icons-material/FingerprintOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../../../auth/context/AuthContext";
import ladyLogo from "../../../assets/lady-logo.png";
import "./BiometricAuthGuard.scss";

const SESSION_KEY = "aparna_dashboard_biometric_unlocked";

export default function BiometricAuthGuard({ children }) {
  const isNative = Capacitor.isNativePlatform();
  const { currentUser, logout } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(() => {
    // Web browsers do not use native biometric guard, immediately unlock with zero screen flash
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [biometryInfo, setBiometryInfo] = useState(null);

  // Mutex lock to strictly prevent concurrent / overlapping biometric prompts
  const isAuthenticatingRef = useRef(false);
  const hasAutoPromptedRef = useRef(false);

  const performBiometricAuth = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setIsUnlocked(true);
      return;
    }

    if (!currentUser || isUnlocked || isAuthenticatingRef.current) return;

    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);
    setAuthError(null);

    // Native Capacitor Platform
    try {
      const info = await BiometricAuth.checkBiometry();
      setBiometryInfo(info);

      if (info.isAvailable) {
        await BiometricAuth.authenticate({
          reason:
            "Scan your fingerprint or enter device PIN to unlock the Dashboard",
          cancelTitle: "Cancel",
          allowDeviceCredential: true,
          iosFallbackTitle: "Use Passcode",
        });

        // Authentication Successful
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsUnlocked(true);
        setAuthError(null);
      } else {
        // Device has no enrolled biometrics, allow access with device credentials or fallback
        sessionStorage.setItem(SESSION_KEY, "true");
        setIsUnlocked(true);
      }
    } catch (err) {
      console.warn(
        "[BiometricAuthGuard] Biometric auth rejected or failed:",
        err,
      );
      setAuthError(
        err.message?.includes("cancel") || err.code === 10
          ? "Authentication cancelled. Tap below to scan fingerprint."
          : "Fingerprint not recognized. Tap below to retry or use device PIN.",
      );
    } finally {
      setIsAuthenticating(false);
      isAuthenticatingRef.current = false;
    }
  }, [currentUser, isUnlocked]);

  // Trigger auto-prompt exactly ONCE per session on mount when user is authenticated (Native Only)
  useEffect(() => {
    if (!isNative || isUnlocked || !currentUser || hasAutoPromptedRef.current)
      return;

    hasAutoPromptedRef.current = true;
    const timer = setTimeout(() => {
      performBiometricAuth();
    }, 250);

    return () => clearTimeout(timer);
  }, [isNative, isUnlocked, currentUser, performBiometricAuth]);

  // If not on native platform or already unlocked, render dashboard immediately
  if (!isNative || isUnlocked) {
    return children;
  }

  // Otherwise, render luxury Biometric Lock Screen
  return (
    <div className="biometric-lock-screen">
      <div className="biometric-lock-aura" />
      <div className="biometric-lock-card">
        {/* Brand Header */}
        <div className="biometric-brand-wrap">
          <div className="biometric-logo-ring">
            <img
              src={ladyLogo}
              alt="Aparna Saree Atelier"
              className="biometric-brand-logo"
            />
          </div>
          <h2 className="biometric-portal-title">Aparna Saree Pre-Pleating</h2>
          <span className="biometric-portal-badge">
            <SecurityOutlinedIcon className="badge-icon" />
            Protected Management Portal
          </span>
        </div>

        {/* Animated Scanner Visual */}
        <div
          className={`biometric-scanner-ring ${isAuthenticating ? "is-scanning" : ""} ${
            authError ? "has-error" : ""
          }`}
          onClick={performBiometricAuth}
          role="button"
          tabIndex={0}
          aria-label="Scan Fingerprint"
        >
          <div className="scanner-beam" />
          <FingerprintOutlinedIcon className="fingerprint-scan-icon" />
          <div className="scanner-pulse-halo" />
        </div>

        {/* Instruction and Feedback Text */}
        <div className="biometric-text-wrap">
          <h3 className="biometric-action-title">
            <LockOutlinedIcon className="lock-mini-icon" />
            Dashboard Locked
          </h3>
          <p className="biometric-subtext">
            {authError ||
              "Place your registered finger on the sensor or tap below to authenticate."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="biometric-actions-row">
          <button
            type="button"
            className="biometric-cta-unlock"
            onClick={performBiometricAuth}
            disabled={isAuthenticating}
          >
            <FingerprintOutlinedIcon className="btn-ico" />
            <span>
              {isAuthenticating
                ? "Scanning Sensor..."
                : "Scan Fingerprint to Unlock"}
            </span>
          </button>

          <button
            type="button"
            className="biometric-cta-logout"
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              logout();
            }}
          >
            <LogoutOutlinedIcon className="btn-ico" />
            <span>Logout / Switch User</span>
          </button>
        </div>
      </div>
    </div>
  );
}
