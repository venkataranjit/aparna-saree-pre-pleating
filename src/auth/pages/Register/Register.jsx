import { ThemeToggle } from '../../../components/common/ThemeToggle/ThemeToggle';
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "../../../firebase/config";
import {
  createUserProfile,
  checkUserUniqueness,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import { useAuth } from "../../context/AuthContext";
import { initSocialAuth, performGoogleAuth } from "../../services/socialAuth";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import { AppButton, AppInput, AppSpinner } from "../../../components/common";
import brandLogo from '../../../assets/logo.png';
import logoDark from '../../../assets/logo-dark.png';
import logoLight from '../../../assets/logo-light.png';
import AuthDesktopBrand from "../../components/AuthDesktopBrand/AuthDesktopBrand";
import AuthFooter from "../../components/AuthFooter/AuthFooter";
import AuthBackground from "../../components/AuthBackground/AuthBackground";
import "./Register.scss";

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

/**
 * Validation schema using Yup
 */
const registerValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("Please enter your full name"),
  userMobile: Yup.string()
    .trim()
    .matches(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number",
    )
    .required("Mobile number is required"),
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  userAddress: Yup.string()
    .trim()
    .max(150, "Address cannot exceed 150 characters"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords do not match")
    .required("Please confirm your password"),
  agreeTerms: Yup.boolean().oneOf(
    [true],
    "You must agree to the Terms & Privacy Policy",
  ),
});

const Register = () => {
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
            userAddress: "",
          });
        } catch (dbErr) {
          console.warn("Firestore user sync after redirect note:", dbErr);
        }

        if (refreshProfile) {
          try {
            await refreshProfile(user);
          } catch {}
        }

        toast.success(
          `Welcome, ${user.displayName || "User"}! Account created successfully.`,
        );
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("OAuth redirect result note:", err);
        if (
          err.code &&
          err.code !== "auth/null-user" &&
          err.code !== "auth/popup-closed-by-user"
        ) {
          toast.error(err.message || "Failed to complete authentication.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, refreshProfile]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  const handleGoogleSignUp = async () => {
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

      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username:
            user.displayName || (isSuper ? "Victory Ranjit" : "Google User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          userAddress: "",
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

      const welcomeMsg = `Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`;
      setSuccessMsg(welcomeMsg);
      toast.success(
        `Welcome, ${user.displayName || "User"}! Account created with Google.`,
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Google signup error:", err);
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

  const handleFacebookSignUp = async () => {
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

      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username:
            user.displayName || (isSuper ? "Victory Ranjit" : "Facebook User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          userAddress: "",
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

      const welcomeMsg = `Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`;
      setSuccessMsg(welcomeMsg);
      toast.success(
        `Welcome, ${user.displayName || "User"}! Account created with Facebook.`,
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Facebook signup error:", err);
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
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setFacebookLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      username: "",
      userMobile: "",
      email: "",
      userAddress: "",
      password: "",
      confirmPassword: "",
      agreeTerms: false,
    },
    validationSchema: registerValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError("");
      setSuccessMsg("");

      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = values.userMobile.trim();

        // Validate uniqueness of email and mobile before proceeding with registration
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            formik.setFieldError(
              "email",
              "An account with this email address already exists.",
            );
            formik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            formik.setFieldError(
              "userMobile",
              "An account with this mobile number already exists.",
            );
            formik.setFieldTouched("userMobile", true, false);
          }
          setError(uniqueness.message);
          toast.error(uniqueness.message);
          setSubmitting(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          values.password,
        );
        const user = userCredential.user;

        try {
          sessionStorage.setItem("aparna_login_provider", "password");
          localStorage.setItem("aparna_auth_provider", "password");
        } catch {}

        await updateProfile(user, {
          displayName: values.username.trim(),
        });

        const assignedRole =
          cleanEmail === SUPERADMIN_EMAIL
            ? USER_ROLES.SUPERADMIN
            : USER_ROLES.CLIENT;

        await createUserProfile(user.uid, {
          username: values.username.trim(),
          email: cleanEmail,
          userMobile: values.userMobile.trim(),
          userAddress: values.userAddress.trim(),
          role: assignedRole,
          isActive: true,
          photoURL: user.photoURL || null,
          authProvider: "password",
        });

        const successText = "Account registered successfully! Redirecting...";
        setSuccessMsg(successText);
        toast.success(
          `Welcome, ${values.username.trim()}! Account registered successfully.`,
        );
        resetForm();

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1200);
      } catch (err) {
        console.error("Registration error:", err);
        let message = "Failed to create account. Please try again.";

        if (err.code === "auth/email-already-in-use") {
          message =
            "An account with this email address already exists. Please sign in instead.";
        } else if (err.code === "auth/invalid-email") {
          message = "The email address entered is not valid.";
        } else if (err.code === "auth/weak-password") {
          message =
            "The password is too weak. Please use at least 6 characters.";
        } else if (err.code === "auth/network-request-failed") {
          message =
            "Network error. Please check your internet connection and retry.";
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="register-screen">
      {/* Royal Silk Aurora Luxury Background */}
      <AuthBackground />

      
      {/* Register Screen Container */}
      <div className="register-screen__container">
        <AuthDesktopBrand />

        <div className="auth-card-wrapper">
        <div className="register-card">
          <div className="register-card__top-bar" />

          <div className="register-card__content">
            {/* Brand Crest & Header with enlarged logo */}
            <div className="register-card__header">
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
              <h1 className="register-title">Create Account</h1>
            </div>

            {/* Error / Success Feedback */}

            {/* Register Form */}
            <form
              onSubmit={formik.handleSubmit}
              className="register-form"
              noValidate
            >
              <div className="register-form__grid">
                {/* Full Name Input */}
                <AppInput
                  label="Full Name"
                  required
                  id="username"
                  name="username"
                  placeholder="e.g. Priya Sharma"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.username && formik.errors.username}
                  disabled={formik.isSubmitting}
                  autoComplete="name"
                  startAdornment={<PersonOutlineIcon />}
                />

                {/* Mobile Number Input */}
                <AppInput
                  label="Mobile Number (10 Digits)"
                  required
                  id="userMobile"
                  name="userMobile"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formik.values.userMobile}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.userMobile && formik.errors.userMobile}
                  disabled={formik.isSubmitting}
                  autoComplete="tel"
                  startAdornment={<PhoneIphoneOutlinedIcon />}
                />

                {/* Email Address Input */}
                <AppInput
                  label="Email Address"
                  required
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && formik.errors.email}
                  disabled={formik.isSubmitting}
                  autoComplete="email"
                  startAdornment={<EmailOutlinedIcon />}
                />

                {/* Address Input */}
                <AppInput
                  label="Address"
                  id="userAddress"
                  name="userAddress"
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  value={formik.values.userAddress}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.userAddress && formik.errors.userAddress
                  }
                  disabled={formik.isSubmitting}
                  autoComplete="street-address"
                  startAdornment={<LocationOnOutlinedIcon />}
                />

                {/* Password Input */}
                <AppInput
                  label="Password (min 6 characters)"
                  required
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && formik.errors.password}
                  disabled={formik.isSubmitting}
                  autoComplete="new-password"
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

                {/* Confirm Password Input */}
                <AppInput
                  label="Confirm Password"
                  required
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                  }
                  disabled={formik.isSubmitting}
                  autoComplete="new-password"
                  startAdornment={<LockOutlinedIcon />}
                  endAdornment={
                    <button
                      type="button"
                      className="visibility-toggle-btn"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </button>
                  }
                />

                {/* Terms & Conditions Checkbox */}
                <div className="options-row full-col">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      checked={formik.values.agreeTerms}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="gold-checkbox"
                    />
                    <span>I agree to Terms & Privacy Policy</span>
                  </label>
                  {formik.touched.agreeTerms && formik.errors.agreeTerms && (
                    <div className="field-error-text">
                      {formik.errors.agreeTerms}
                    </div>
                  )}
                </div>

                {/* Primary Create Account Button */}
                <div className="full-col">
                  <AppButton
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={formik.isSubmitting}
                    className="submit-btn"
                  >
                    Create Account
                  </AppButton>
                </div>

                {/* Link to Login */}
                <div className="auth-switch-row full-col">
                  <p className="switch-prompt">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-highlight-link">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </form>

            {/* Divider & Social Sign Up */}
            <div className="auth-divider">
              <span>OR SIGN UP WITH</span>
            </div>

            <div className="social-auth-buttons">
              <button
                type="button"
                className="social-icon-btn social-icon-btn--google"
                onClick={handleGoogleSignUp}
                disabled={formik.isSubmitting || googleLoading || facebookLoading}
                title="Sign up with Google"
                aria-label="Sign up with Google"
              >
                {googleLoading ? <GoogleLoader /> : <GoogleIcon />}
              </button>

              <button
                type="button"
                className="social-icon-btn social-icon-btn--facebook"
                onClick={handleFacebookSignUp}
                disabled={formik.isSubmitting || googleLoading || facebookLoading}
                title="Sign up with Facebook"
                aria-label="Sign up with Facebook"
              >
                {facebookLoading ? <FacebookLoader /> : <FacebookIcon />}
              </button>
            </div>

            {/* Footer Security Badge */}
            <div className="register-card__footer">
              <SecurityIcon className="security-icon" />
              <span className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End
                Encryption
              </span>
            </div>
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

export default Register;
