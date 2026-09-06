import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
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
import { AppButton, AppInput } from "../../../components/common";
import brandLogo from "../../../assets/logo.png";
import AuthDesktopBrand from "../../components/AuthDesktopBrand/AuthDesktopBrand";
import AuthFooter from "../../components/AuthFooter/AuthFooter";
import CardStorefrontLink from "../../components/CardStorefrontLink/CardStorefrontLink";
import "./Register.scss";

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
            {/* Inside-Card Return to Storefront Link */}
            <CardStorefrontLink />

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
