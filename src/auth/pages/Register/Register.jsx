import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "../../../firebase/config";
import { createUserProfile, checkUserUniqueness } from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import { useAuth } from "../../context/AuthContext";
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
import brandLogo from "../../../assets/logo.png";
import AuthDesktopBrand from "../../components/AuthDesktopBrand/AuthDesktopBrand";
import AuthFooter from "../../components/AuthFooter/AuthFooter";
import CardStorefrontLink from "../../components/CardStorefrontLink/CardStorefrontLink";
import "./Register.scss";

// Google Official Brand Icon
const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: 'block' }}>
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
  <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: 'block' }}>
    <path
      fill="#FFFFFF"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
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
      "Please enter a valid 10-digit Indian mobile number"
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
    "You must agree to the Terms & Privacy Policy"
  ),
});

const Register = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentUser, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const { refreshProfile } = useAuth();

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
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      try {
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username: user.displayName || (isSuper ? "Victory Ranjit" : "Google User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          userAddress: "",
        });
      } catch (dbErr) {
        console.warn("Firestore Google user sync note:", dbErr);
      }

      if (refreshProfile) {
        try {
          await refreshProfile(user);
        } catch {}
      }

      setSuccessMsg(`Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Google signup error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else {
        setError("Unable to sign in with Google. Please try again.");
      }
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
        const userEmail = (user.email || "").trim().toLowerCase();
        const isSuper = userEmail === SUPERADMIN_EMAIL.toLowerCase();
        await createUserProfile(user.uid, {
          username: user.displayName || (isSuper ? "Victory Ranjit" : "Facebook User"),
          email: userEmail,
          userMobile: user.phoneNumber || "",
          userAddress: "",
        });
      } catch (dbErr) {
        console.warn("Firestore Facebook user sync note:", dbErr);
      }

      if (refreshProfile) {
        try {
          await refreshProfile(user);
        } catch {}
      }

      setSuccessMsg(`Welcome, ${user.displayName || "User"}! Redirecting to Dashboard...`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      console.warn("Facebook signup error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Facebook sign-in was cancelled.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email. Please sign in with Google or Email/Password.");
      } else {
        setError(err.message || "Unable to sign in with Facebook. Please try again.");
      }
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
            formik.setFieldError("email", "An account with this email address already exists.");
            formik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            formik.setFieldError("userMobile", "An account with this mobile number already exists.");
            formik.setFieldTouched("userMobile", true, false);
          }
          setError(uniqueness.message);
          setSubmitting(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          values.password
        );
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: values.username.trim(),
        });

        const assignedRole =
          cleanEmail === SUPERADMIN_EMAIL
            ? USER_ROLES.SUPERADMIN
            : USER_ROLES.CUSTOMER;

        await createUserProfile(user.uid, {
          username: values.username.trim(),
          email: cleanEmail,
          userMobile: values.userMobile.trim(),
          userAddress: values.userAddress.trim(),
          role: assignedRole,
          isActive: true,
          photoURL: user.photoURL || null,
        });

        setSuccessMsg("Account registered successfully! Redirecting...");
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
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="register-screen">
      {/* Ambient luxury background lighting */}
      <div className="register-screen__glow register-screen__glow--top" />
      <div className="register-screen__glow register-screen__glow--bottom" />

      {/* Register Screen Container */}
      <div className="register-screen__container">
        <AuthDesktopBrand />

        <div className="register-card">
          <div className="register-card__top-bar" />

          <div className="register-card__content">
            {/* Brand Crest & Header with enlarged logo */}
            <div className="register-card__header">
              <div className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img"
                />
              </div>
              <h1 className="register-title">
                Create Account
              </h1>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="feedback-alert error-alert">
                <span>{error}</span>
                <button
                  type="button"
                  className="alert-close-btn"
                  onClick={() => setError("")}
                >
                  &times;
                </button>
              </div>
            )}

            {successMsg && (
              <div className="feedback-alert success-alert">
                <span>{successMsg}</span>
              </div>
            )}

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
                  error={
                    formik.touched.username && formik.errors.username
                  }
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
                  error={
                    formik.touched.userMobile && formik.errors.userMobile
                  }
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
                  error={
                    formik.touched.password && formik.errors.password
                  }
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

            {/* Return to Storefront Link */}
            <CardStorefrontLink />

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
      </div>

      {/* Luxury Footer with Developer Credit */}
      <AuthFooter />
    </div>
  );
};

export default Register;
