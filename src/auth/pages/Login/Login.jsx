import { ThemeToggle } from '../../../components/common/ThemeToggle/ThemeToggle';
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../../../firebase/config";
import { createUserProfile } from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import { useAuth } from "../../context/AuthContext";
import { initSocialAuth, performGoogleAuth } from "../../services/socialAuth";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import DialpadOutlinedIcon from "@mui/icons-material/DialpadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { AppButton, AppInput, AppSpinner } from "../../../components/common";
import brandLogo from '../../../assets/logo.png';
import logoDark from '../../../assets/logo-dark.png';
import logoLight from '../../../assets/logo-light.png';
import AuthDesktopBrand from "../../components/AuthDesktopBrand/AuthDesktopBrand";
import AuthFooter from "../../components/AuthFooter/AuthFooter";
import AuthBackground from "../../components/AuthBackground/AuthBackground";
import "./Login.scss";

// Google Official Brand Icon
const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

// Facebook Official Brand Icon
const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: "block" }}>
    <path
      fill="#FFFFFF"
      d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"
    />
  </svg>
);

// Google Official 4-Color Animated Loader
const GoogleLoader = () => (
  <svg className="google-loader" viewBox="0 0 50 50">
    <circle
      className="google-loader-path"
      cx="25"
      cy="25"
      r="20"
      fill="none"
      strokeWidth="4"
    />
  </svg>
);

// Facebook Official White Animated Loader
const FacebookLoader = () => (
  <div className="facebook-loader">
    <svg viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="4.5"
      />
      <circle
        className="facebook-loader-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, refreshProfile } = useAuth();

  // Synchronous guard: If already authenticated, redirect directly to dashboard
  if (!authLoading && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  // Initialize Social Auth for Native Android & Web
  useEffect(() => {
    initSocialAuth();
  }, []);

  // Handle OAuth Redirect Result (for Mobile WebViews and Browsers)
  useEffect(() => {
    let isMounted = true;
    if (!auth) return;

    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        const user = result.user;
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();

        try {
          await createUserProfile(user.uid, {
            username: user.displayName || (isSuper ? "Victory Ranjit" : "User"),
            email: userEmail,
            userMobile: user.phoneNumber || "",
            photoURL: user.photoURL || null,
            authProvider: "google",
          });
        } catch (dbErr) {
          console.warn("Firestore user sync after redirect note:", dbErr);
        }

        if (refreshProfile) {
          try {
            await refreshProfile(user);
          } catch {}
        }

        toast.success(`Welcome, ${user.displayName || "User"}! Signed in successfully.`);
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("OAuth redirect result note:", err);
        if (err.code && err.code !== "auth/null-user" && err.code !== "auth/popup-closed-by-user") {
          toast.error(err.message || "Failed to complete authentication.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  // Login Mode: 'email' | 'phone'
  const [loginMethod, setLoginMethod] = useState("email");

  // Email & Password States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone OTP States
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpError, setOtpError] = useState(false);
  const otpInputRefs = useRef([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cleanup reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {
          // ignore
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // Helper to get or create invisible reCAPTCHA verifier
  const getRecaptchaVerifier = () => {
    let container = document.getElementById("recaptcha-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "recaptcha-container";
      document.body.appendChild(container);
    }

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Error clearing previous reCAPTCHA:", e);
      }
      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        setError("reCAPTCHA expired. Please try requesting OTP again.");
      },
    });

    return window.recaptchaVerifier;
  };

  // 1. Email & Password Sign In
  const handleEmailSignIn = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email.trim() || !password) {
      const msg = "Please enter both email and password.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch (persErr) {
          console.warn("Set persistence note:", persErr);
        }
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        try {
          sessionStorage.setItem("aparna_login_provider", "password");
          localStorage.setItem("aparna_auth_provider", "password");
        } catch {}
        if (userCredential?.user && refreshProfile) {
          try {
            await refreshProfile(userCredential.user);
          } catch (pErr) {
            console.warn("Profile refresh after login note:", pErr);
          }
        }
        setSuccessMsg("Welcome back! Redirecting to Dashboard...");
        toast.success("Welcome back! Signed in successfully.");
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } else {
        toast.success("Welcome back! Redirecting to Dashboard...");
        navigate("/dashboard");
      }
    } catch (err) {
      console.warn("Firebase login warning:", err);
      let message = "Invalid email or password.";
      if (
        err.code === "auth/configuration-not-found" ||
        err.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        message =
          'Firebase Authentication is not activated yet in Firebase Console. Please enable "Email/Password" in Firebase Console > Build > Authentication > Sign-in method.';
      } else if (err.code === "auth/operation-not-allowed") {
        message =
          'Email/Password sign-in is disabled. Please enable "Email/Password" in Firebase Console > Build > Authentication > Sign-in method.';
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        message =
          "Invalid email or password. If you signed in with Google, you can continue with Google or use 'Forgot Password' to set your account password.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/user-disabled") {
        message =
          "This account has been disabled. Please contact the administrator.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many attempts. Please try again in a few moments.";
      } else if (err.code === "auth/network-request-failed") {
        message = "Network error. Please check your internet connection.";
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone Number OTP Request
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      const msg = "Please enter a valid 10-digit Indian mobile number.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const appVerifier = getRecaptchaVerifier();
      const fullPhoneNumber = `+91${cleanPhone}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        appVerifier,
      );
      setConfirmationResult(confirmation);
      setOtpSent(true);
      const successText = `OTP sent to ${fullPhoneNumber}. Please enter the 6-digit verification code below.`;
      setSuccessMsg(successText);
      toast.success(successText);
    } catch (err) {
      console.error("Phone sign-in error:", err);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
        window.recaptchaVerifier = null;
      }
      let msg = "Failed to send OTP. Please try again.";
      if (err.code === "auth/invalid-phone-number") {
        msg =
          "Invalid phone number format. Please enter a valid 10-digit Indian mobile number.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg =
          'Phone authentication is disabled. Please enable "Phone" in Firebase Console > Authentication > Sign-in method.';
      } else if (
        err.code === "auth/configuration-not-found" ||
        err.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        msg =
          'Phone provider is not configured. Please enable "Phone" in Firebase Console > Authentication > Sign-in method.';
      } else if (err.code === "auth/too-many-requests") {
        msg =
          "Too many requests sent. Please wait a few moments before trying again.";
      } else if (err.code === "auth/captcha-check-failed") {
        msg =
          "reCAPTCHA verification failed. Please refresh the page and try again.";
      } else if (err.code === "auth/quota-exceeded") {
        msg =
          "SMS quota exceeded for this Firebase project. Add test phone numbers in Firebase Console or upgrade plan.";
      } else if (err.code === "auth/invalid-app-credential") {
        msg =
          "Firebase app verification failed. Check Authorized Domains in Firebase Console or configure Test Phone Numbers.";
      } else if (err.code === "auth/billing-not-enabled") {
        msg =
          'SMS delivery requires billing or configuring "Phone numbers for testing" in Firebase Console.';
      } else if (err.message) {
        msg = `Failed to send OTP: ${err.message}`;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit Change Handlers for 6 Boxes
  const handleOtpDigitChange = (index, value) => {
    if (otpError) setOtpError(false);
    // Only allow single digit
    const cleaned = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Handle fast typing or autofill
      const chars = cleaned.slice(0, 6 - index).split("");
      chars.forEach((char, i) => {
        if (index + i < 6) {
          newDigits[index + i] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + chars.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (otpError) setOtpError(false);
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        // If current box is empty, delete previous and move focus back
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        // Clear current box
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    if (otpError) setOtpError(false);
    const pasteData = e.clipboardData
      .getData("text")
      .trim()
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    pasteData.split("").forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });
    setOtpDigits(newDigits);

    const targetFocus = Math.min(pasteData.length, 5);
    otpInputRefs.current[targetFocus]?.focus();
  };

  // 3. Phone OTP Confirmation
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    setOtpError(false);

    const cleanOtp = otpDigits.join("").trim();
    if (cleanOtp.length !== 6) {
      const msg = "Please enter all 6 digits of your OTP code.";
      setError(msg);
      setOtpError(true);
      toast.error(msg);
      return;
    }

    if (!confirmationResult) {
      const msg = "Session expired. Please request a new OTP code.";
      setError(msg);
      setOtpError(true);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch {}
      }
      const result = await confirmationResult.confirm(cleanOtp);
      const user = result.user;

      try {
        sessionStorage.setItem("aparna_login_provider", "phone_otp");
        localStorage.setItem("aparna_auth_provider", "phone_otp");
      } catch {}

      // Sync client record to Firestore users collection
      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username: user.displayName || (isSuper ? "Victory Ranjit" : "Client"),
          email: userEmail,
          userMobile: user.phoneNumber || `+91${phone.trim()}`,
          photoURL: user.photoURL || null,
          authProvider: "phone_otp",
        });
      } catch (dbErr) {
        console.warn("Firestore profile sync note:", dbErr);
      }

      if (refreshProfile) {
        try {
          await refreshProfile(user);
        } catch {}
      }

      setSuccessMsg("Phone verified successfully! Redirecting to Dashboard...");
      toast.success("Phone verified successfully! Welcome back.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("OTP verification error:", err);
      setOtpError(true);
      let msg = "Invalid verification code. Please check and re-enter.";
      if (err.code === "auth/invalid-verification-code") {
        msg = "Invalid OTP code. Please verify the numbers and try again.";
      } else if (err.code === "auth/code-expired") {
        msg = "The verification code has expired. Please request a new OTP.";
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setSuccessMsg("");
    setGoogleLoading(true);

    try {
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch {}
      }

      const user = await performGoogleAuth(auth);
      if (!user) return;

      try {
        sessionStorage.setItem("aparna_login_provider", "google");
        localStorage.setItem("aparna_auth_provider", "google");
      } catch {}

      // Sync user profile in Firestore
      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username:
            user.displayName || (isSuper ? "Victory Ranjit" : "Google User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          photoURL: user.photoURL || null,
          authProvider: "google",
        });
      } catch (dbErr) {
        console.warn("Firestore Google user sync note:", dbErr);
      }

      if (refreshProfile) {
        try {
          await refreshProfile(user);
        } catch {}
      }

      setSuccessMsg(
        `Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`,
      );
      toast.success(
        `Welcome, ${user.displayName || "User"}! Signed in with Google.`,
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Google sign-in error:", err);
      let msg = "Unable to sign in with Google. Please try again.";
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.message?.includes("closed") ||
        err.message?.includes("cancelled") ||
        err.message?.includes("Canceled") ||
        err.message?.includes("user cancelled") ||
        err.message?.includes("User cancelled")
      ) {
        msg = "Google sign-in was cancelled.";
      } else if (err.code === "auth/cancelled-popup-request") {
        return;
      } else if (
        err.code === "auth/configuration-not-found" ||
        err.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        msg =
          "Google Sign-in is not enabled in Firebase Console. Please enable Google provider.";
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  // 5. Facebook Sign-In
  const handleFacebookSignIn = async () => {
    setError("");
    setSuccessMsg("");
    setFacebookLoading(true);

    try {
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
        } catch {}
      }
      const provider = new FacebookAuthProvider();
      provider.addScope("email");
      provider.addScope("public_profile");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      try {
        sessionStorage.setItem("aparna_login_provider", "facebook");
        localStorage.setItem("aparna_auth_provider", "facebook");
      } catch {}

      // Sync user profile in Firestore
      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username:
            user.displayName || (isSuper ? "Victory Ranjit" : "Facebook User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          photoURL: user.photoURL || null,
          authProvider: "facebook",
        });
      } catch (dbErr) {
        console.warn("Firestore Facebook user sync note:", dbErr);
      }

      if (refreshProfile) {
        try {
          await refreshProfile(user);
        } catch {}
      }

      setSuccessMsg(
        `Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`,
      );
      toast.success(
        `Welcome, ${user.displayName || "User"}! Signed in with Facebook.`,
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Facebook sign-in error:", err);
      let msg = "Unable to sign in with Facebook. Please try again.";
      if (err.code === "auth/popup-closed-by-user") {
        msg = "Facebook sign-in was cancelled.";
      } else if (err.code === "auth/cancelled-popup-request") {
        return;
      } else if (
        err.code === "auth/configuration-not-found" ||
        err.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        msg =
          "Facebook Sign-in is not enabled in Firebase Console. Please enable Facebook provider in Firebase Console > Authentication > Sign-in method.";
      } else if (err.code === "auth/account-exists-with-different-credential") {
        msg =
          "An account already exists with the same email. Please sign in with Google or Email/Password.";
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setFacebookLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div id="recaptcha-container"></div>

      {/* Royal Silk Aurora Luxury Background */}
      <AuthBackground />

      
      {/* Login Screen Container */}
      <div className="login-screen__container">
        <AuthDesktopBrand />

        <div className="auth-card-wrapper">
        <div className="login-card">
          <div className="login-card__top-bar" />

          <div className="login-card__content">
            {/* Brand Crest & Header */}
            <div className="login-card__header">
              <div className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img brand-logo-img--default"
                />
                <img
                  src={logoDark}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img brand-logo-img--dark"
                />
                <img
                  src={logoLight}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img brand-logo-img--light"
                />
              </div>
              <h1 className="login-title">Login</h1>
            </div>

            {/* Method Switcher Tabs (Email vs Phone OTP) */}
            <div className="login-method-switch">
              <button
                type="button"
                className={`method-tab-btn ${loginMethod === "email" ? "active" : ""}`}
                onClick={() => {
                  setLoginMethod("email");
                  setError("");
                }}
              >
                <EmailOutlinedIcon />
                <span>Email</span>
              </button>
              <button
                type="button"
                className={`method-tab-btn ${loginMethod === "phone" ? "active" : ""}`}
                onClick={() => {
                  setLoginMethod("phone");
                  setError("");
                }}
              >
                <PhoneIphoneOutlinedIcon />
                <span>Phone OTP</span>
              </button>
            </div>

            {/* Error / Success Feedback */}

            {/* =================================================================== */}
            {/* 1. Email & Password Form */}
            {/* =================================================================== */}
            {loginMethod === "email" && (
              <form
                onSubmit={handleEmailSignIn}
                className="login-form"
                noValidate
              >
                {/* Email Input */}
                <AppInput
                  label="Email Address"
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="admin@aparnasaree.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                  autoComplete="email"
                  startAdornment={<EmailOutlinedIcon />}
                />

                {/* Password Input */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div className="password-header-row">
                    <span className="app-input-label">Password</span>
                    <Link to="/forgot-password" className="forgot-link-btn">
                      Forgot Password?
                    </Link>
                  </div>
                  <AppInput
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || googleLoading}
                    autoComplete="current-password"
                    startAdornment={<LockOutlinedIcon />}
                    endAdornment={
                      <button
                        type="button"
                        className="visibility-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon />
                        ) : (
                          <VisibilityOutlinedIcon />
                        )}
                      </button>
                    }
                  />
                </div>

                {/* Remember Me Checkbox */}
                <div className="options-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="gold-checkbox"
                    />
                    <span>Remember this device</span>
                  </label>
                </div>

                {/* Primary Sign In Button */}
                <AppButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  className="submit-btn"
                >
                  Sign In
                </AppButton>
              </form>
            )}

            {/* =================================================================== */}
            {/* 2. Phone Number OTP Form */}
            {/* =================================================================== */}
            {loginMethod === "phone" && (
              <div className="login-form">
                {!otpSent ? (
                  // Step 2A: Enter Mobile Number
                  <form onSubmit={handleSendOtp}>
                    <AppInput
                      label="Mobile Number (10 Digits)"
                      id="phone-number"
                      type="tel"
                      placeholder="9848012345"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading || googleLoading}
                      autoComplete="tel"
                      startAdornment={<span>+91</span>}
                      hint="We will send a 6-digit OTP code to your phone via SMS."
                    />

                    <div style={{ marginTop: "16px" }}>
                      <AppButton
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                        className="submit-btn"
                      >
                        Send OTP Code
                      </AppButton>
                    </div>
                  </form>
                ) : (
                  // Step 2B: Enter 6-Digit OTP in 6 distinct boxes
                  <form
                    onSubmit={handleVerifyOtp}
                    className="otp-verification-section"
                  >
                    <div className="otp-header-row">
                      <span className="input-label-text">
                        Enter 6-Digit OTP
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpDigits(["", "", "", "", "", ""]);
                          setError("");
                        }}
                        className="change-phone-btn"
                      >
                        Change Number
                      </button>
                    </div>

                    {/* 6 OTP Boxes */}
                    <div
                      className={`otp-boxes-container ${otpError ? "has-error" : ""}`}
                      onPaste={handleOtpPaste}
                    >
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          autoFocus={index === 0}
                          disabled={loading || googleLoading}
                          onChange={(e) =>
                            handleOtpDigitChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`otp-digit-box ${digit ? "filled" : ""} ${otpError ? "error" : ""}`}
                          aria-label={`OTP digit ${index + 1}`}
                        />
                      ))}
                    </div>

                    <span className="otp-instruction-text">
                      Sent to +91 {phone.trim()}
                    </span>

                    <div style={{ marginTop: "18px" }}>
                      <AppButton
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={loading}
                        disabled={
                          loading ||
                          googleLoading ||
                          otpDigits.join("").length !== 6
                        }
                        className="submit-btn"
                      >
                        Verify & Sign In
                      </AppButton>
                    </div>

                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="resend-otp-btn"
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 3. Divider & Social Sign-In */}
            <div className="auth-divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-auth-buttons">
              <button
                type="button"
                className="social-icon-btn social-icon-btn--google"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading || facebookLoading}
                title="Sign in with Google"
                aria-label="Sign in with Google"
              >
                {googleLoading ? <GoogleLoader /> : <GoogleIcon />}
              </button>

              <button
                type="button"
                className="social-icon-btn social-icon-btn--facebook"
                onClick={handleFacebookSignIn}
                disabled={loading || googleLoading || facebookLoading}
                title="Sign in with Facebook"
                aria-label="Sign in with Facebook"
              >
                {facebookLoading ? <FacebookLoader /> : <FacebookIcon />}
              </button>
            </div>

            {/* Link to Register */}
            <div className="auth-switch-row">
              <p className="switch-prompt">
                Don't have an account?{" "}
                <Link to="/register" className="auth-highlight-link">
                  Create Account
                </Link>
              </p>
            </div>

            {/* Footer Security Badge */}
            <div className="login-card__footer">
              <SecurityIcon className="security-icon" />
              <span className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End
                Encryption
              </span>
            </div>

            {/* Invisible reCAPTCHA container required for Firebase Phone Auth */}
            <div id="recaptcha-container"></div>
          </div>
        </div>

          {/* Theme Selector directly below the card */}
          <div className="auth-card-theme-bar">
            <ThemeToggle variant="segmented" size="sm" showLabels={true} />
          </div>
        </div>
      </div>

      {/* Luxury Footer with Developer Credit */}
      <AuthFooter />
    </div>
  );
};

export default Login;
