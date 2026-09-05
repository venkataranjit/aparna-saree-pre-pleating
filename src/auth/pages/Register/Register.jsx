import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useFormik } from "formik";
import * as Yup from "yup";
import { auth } from "../../../firebase/config";
import { createUserProfile } from "../../../firebase/dbService";
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
import brandLogo from "../../../assets/logo.png";
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
  agreeTerms: Yup.boolean()
    .oneOf([true], "You must agree to the Terms & Privacy Policy")
    .required("You must agree to the Terms & Privacy Policy"),
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
      agreeTerms: true,
    },
    validationSchema: registerValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError("");
      setSuccessMsg("");

      try {
        let uid = "user_" + Date.now();

        // 1. Create Firebase Auth user
        if (auth) {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            values.email.trim(),
            values.password
          );
          uid = userCredential.user.uid;

          if (values.username.trim() && userCredential.user) {
            try {
              await updateProfile(userCredential.user, {
                displayName: values.username.trim(),
              });
            } catch (profileErr) {
              console.warn("Profile name update warning:", profileErr);
            }
          }
        }

        // 2. Persist user document in Firestore 'users' collection
        const normalizedEmail = values.email.trim().toLowerCase();
        const isSuper = normalizedEmail === SUPERADMIN_EMAIL.toLowerCase();

        await createUserProfile(uid, {
          username: values.username.trim(),
          email: normalizedEmail,
          userMobile: String(values.userMobile).trim(), // strictly stored as string
          userAddress: values.userAddress.trim(),
          role: isSuper ? USER_ROLES.SUPERADMIN : USER_ROLES.CUSTOMER,
        });

        setSuccessMsg(
          "Account created successfully! Redirecting to Dashboard..."
        );
        setTimeout(() => {
          navigate("/dashboard");
        }, 900);
      } catch (err) {
        console.warn("Firebase registration error:", err);
        let message = "Unable to create account. Please try again.";
        if (
          err.code === "auth/configuration-not-found" ||
          err.message?.includes("CONFIGURATION_NOT_FOUND")
        ) {
          message =
            'Firebase Authentication is not activated yet in Firebase Console. Please go to Firebase Console > Build > Authentication > Sign-in method and enable "Email/Password".';
        } else if (err.code === "auth/operation-not-allowed") {
          message =
            'Email/Password sign-in is disabled. Please enable "Email/Password" in Firebase Console > Build > Authentication > Sign-in method.';
        } else if (err.code === "auth/email-already-in-use") {
          message = "This email is already registered. Please sign in instead.";
        } else if (err.code === "auth/invalid-email") {
          message = "The email format is invalid.";
        } else if (err.code === "auth/weak-password") {
          message = "Password is too weak. Please use a stronger password.";
        } else if (err.code === "auth/network-request-failed") {
          message = "Network error. Please verify your internet connection.";
        }
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box className="register-screen">
      {/* Ambient luxury background lighting */}
      <div className="register-screen__glow register-screen__glow--top" />
      <div className="register-screen__glow register-screen__glow--bottom" />

      {/* Top back navigation link */}
      <Box className="register-screen__top-nav">
        <Link to="/landing" className="back-link">
          <ArrowBackIcon className="back-icon" />
          <span>Return to Storefront</span>
        </Link>
      </Box>

      {/* Centered Register Card */}
      <Box className="register-screen__container">
        <Card className="register-card">
          <div className="register-card__top-bar" />

          <CardContent className="register-card__content">
            {/* Brand Crest & Header with enlarged logo */}
            <Box className="register-card__header">
              <Box className="brand-logo-wrap">
                <img
                  src={brandLogo}
                  alt="Aparna Saree Pre-Pleating"
                  className="brand-logo-img"
                />
              </Box>
              <Typography variant="h4" className="register-title">
                Create Account
              </Typography>
            </Box>

            {/* Error / Success Feedback */}
            {error && (
              <Alert
                severity="error"
                className="feedback-alert error-alert"
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            {successMsg && (
              <Alert
                severity="success"
                className="feedback-alert success-alert"
              >
                {successMsg}
              </Alert>
            )}

            {/* Register Form */}
            <Box
              component="form"
              onSubmit={formik.handleSubmit}
              className="register-form"
              noValidate
            >
              <Box className="register-form__grid">
                {/* Full Name Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Full Name *
                  </Typography>
                  <TextField
                    fullWidth
                    id="username"
                    name="username"
                    placeholder="e.g. Priya Sharma"
                    value={formik.values.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.username && Boolean(formik.errors.username)
                    }
                    helperText={
                      formik.touched.username && formik.errors.username
                    }
                    disabled={formik.isSubmitting}
                    autoComplete="name"
                    className="luxury-text-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon className="field-icon" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Mobile Number Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Mobile Number * (10 Digits)
                  </Typography>
                  <TextField
                    fullWidth
                    id="userMobile"
                    name="userMobile"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formik.values.userMobile}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.userMobile &&
                      Boolean(formik.errors.userMobile)
                    }
                    helperText={
                      formik.touched.userMobile && formik.errors.userMobile
                    }
                    disabled={formik.isSubmitting}
                    autoComplete="tel"
                    className="luxury-text-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIphoneOutlinedIcon className="field-icon" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Email Address Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Email Address *
                  </Typography>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    disabled={formik.isSubmitting}
                    autoComplete="email"
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

                {/* Address Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Address / Location (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    id="userAddress"
                    name="userAddress"
                    placeholder="e.g. Jubilee Hills, Hyderabad"
                    value={formik.values.userAddress}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.userAddress &&
                      Boolean(formik.errors.userAddress)
                    }
                    helperText={
                      formik.touched.userAddress && formik.errors.userAddress
                    }
                    disabled={formik.isSubmitting}
                    autoComplete="street-address"
                    className="luxury-text-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnOutlinedIcon className="field-icon" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Password Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Password * (min 6 characters)
                  </Typography>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.password && Boolean(formik.errors.password)
                    }
                    helperText={
                      formik.touched.password && formik.errors.password
                    }
                    disabled={formik.isSubmitting}
                    autoComplete="new-password"
                    className="luxury-text-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon className="field-icon" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            className="visibility-btn"
                          >
                            {showPassword ? (
                              <VisibilityOffOutlinedIcon />
                            ) : (
                              <VisibilityOutlinedIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Confirm Password Input */}
                <Box className="input-group">
                  <Typography component="label" className="input-label">
                    Confirm Password *
                  </Typography>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.confirmPassword &&
                      Boolean(formik.errors.confirmPassword)
                    }
                    helperText={
                      formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                    }
                    disabled={formik.isSubmitting}
                    autoComplete="new-password"
                    className="luxury-text-field"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon className="field-icon" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                            className="visibility-btn"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOffOutlinedIcon />
                            ) : (
                              <VisibilityOutlinedIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Terms & Conditions Checkbox */}
                <Box className="options-row full-col">
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="agreeTerms"
                        name="agreeTerms"
                        checked={formik.values.agreeTerms}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="gold-checkbox"
                      />
                    }
                    label="I agree to Terms & Privacy Policy"
                    className="checkbox-label"
                  />
                  {formik.touched.agreeTerms && formik.errors.agreeTerms && (
                    <FormHelperText
                      error
                      sx={{ color: "#f87171", ml: 1, mt: 0 }}
                    >
                      {formik.errors.agreeTerms}
                    </FormHelperText>
                  )}
                </Box>

                {/* Primary Create Account Button */}
                <Box className="full-col">
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={formik.isSubmitting}
                    className="submit-btn"
                  >
                    {formik.isSubmitting ? (
                      <CircularProgress size={22} sx={{ color: "#000000" }} />
                    ) : (
                      <span>Create Account</span>
                    )}
                  </Button>
                </Box>

                {/* Link to Login */}
                <Box className="auth-switch-row full-col">
                  <Typography variant="body2" className="switch-prompt">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-highlight-link">
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer Security Badge */}
            <Box className="register-card__footer">
              <SecurityIcon className="security-icon" />
              <Typography variant="caption" className="security-text">
                Protected by 256-bit Firebase Authentication & End-to-End
                Encryption
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
