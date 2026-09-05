import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  updateUser,
  getAllMeasurements,
  createCustomerMeasurement,
  updateMeasurement,
  deleteCustomerMeasurement,
  formatDateSafe,
} from "../../../firebase/dbService";
import { USER_ROLES } from "../../../firebase/schema";
import "./MyProfile.scss";

// Validation schema for editing personal profile
const profileValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("Your Full Name is required"),
  userMobile: Yup.string()
    .trim()
    .matches(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number"
    )
    .required("Mobile Number is required"),
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email Address is required"),
  userAddress: Yup.string()
    .trim()
    .max(200, "Address cannot exceed 200 characters"),
});

const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];

// Validation schema for adding/editing a measurement profile
const measurementValidationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "Measurement title must be at least 2 characters")
    .max(60, "Title cannot exceed 60 characters")
    .required("Measurement title is required (e.g. Bridal Silk Saree)"),
  pallu: Yup.string()
    .trim()
    .test(
      "is-valid-pallu",
      "Pallu length must be a valid positive number (e.g. 38 or 38.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 200;
      }
    ),
  shoulderToRightTight: Yup.string()
    .trim()
    .test(
      "is-valid-shoulder",
      "Shoulder measurement must be a valid positive number (e.g. 14)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 100;
      }
    ),
  chest: Yup.string()
    .trim()
    .test(
      "is-valid-chest",
      "Chest size must be a valid positive number (e.g. 36)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 100;
      }
    ),
  hip: Yup.string()
    .trim()
    .test(
      "is-valid-hip",
      "Hip size must be a valid positive number (e.g. 40)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 120;
      }
    ),
  firstPleatSize: Yup.string()
    .trim()
    .test(
      "is-valid-pleat",
      "First pleat size must be a valid positive number (e.g. 5.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 50;
      }
    ),
  noOfChestPleats: Yup.string()
    .trim()
    .test(
      "is-valid-pleats-count",
      "Chest pleats count must be a positive integer (e.g. 5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return (
          !Number.isNaN(num) && Number.isInteger(num) && num > 0 && num <= 30
        );
      }
    ),
  height: Yup.string()
    .trim()
    .test(
      "is-valid-height",
      "Height must be a valid positive number (e.g. 150 or 5.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 300;
      }
    ),
  dressSize: Yup.string()
    .trim()
    .oneOf(DRESS_SIZES, "Please select a valid dress size"),
  notes: Yup.string().trim().max(300, "Notes cannot exceed 300 characters"),
});

const MyProfile = () => {
  const { currentUser, userProfile, isSuperAdmin, role, refreshProfile, loading: authLoading } =
    useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [openEditProfileModal, setOpenEditProfileModal] = useState(false);
  const [openAddMeasureModal, setOpenAddMeasureModal] = useState(false);
  const [openEditMeasureModal, setOpenEditMeasureModal] = useState(false);
  const [selectedMeasureForEdit, setSelectedMeasureForEdit] = useState(null);
  const [measureToDelete, setMeasureToDelete] = useState(null);
  const [deletingMeasureId, setDeletingMeasureId] = useState(null);

  const currentUid = currentUser?.uid || userProfile?.id;
  const displayName =
    userProfile?.username || currentUser?.displayName || (currentUser?.email ? currentUser.email.split("@")[0] : "");
  const displayEmail =
    userProfile?.email || currentUser?.email || "";
  const displayMobile =
    userProfile?.userMobile || currentUser?.phoneNumber || "";
  const displayAddress = userProfile?.userAddress || "";
  const avatarChar = displayName ? displayName.charAt(0).toUpperCase() : "";

  const roleLabel =
    isSuperAdmin || role === "superadmin"
      ? "Super Admin"
      : role === "admin"
      ? "Admin"
      : role === "staff"
      ? "Staff"
      : (currentUser || userProfile ? "Customer" : "");

  // Fetch measurements for the logged-in user
  const fetchMyMeasurements = async () => {
    setLoading(true);
    try {
      if (!currentUid) {
        setMeasurements([]);
        setLoading(false);
        return;
      }
      const allMeasures = await getAllMeasurements();
      const myMeasures = allMeasures.filter(
        (m) => m.userId === currentUid || m.userId === userProfile?.id
      );
      setMeasurements(myMeasures);
    } catch (err) {
      console.warn("Error fetching personal measurements:", err);
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyMeasurements();
  }, [currentUid, userProfile]);

  // Edit Profile Formik
  const editProfileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: displayName,
      userMobile: displayMobile
        ? displayMobile.replace(/\D/g, "").slice(-10)
        : "",
      email: displayEmail,
      userAddress: displayAddress,
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const updatePayload = {
          username: values.username.trim(),
          userMobile: String(values.userMobile).trim(),
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role: userProfile?.role || USER_ROLES.CUSTOMER,
        };

        if (currentUid) {
          await updateUser(currentUid, updatePayload);
        }

        if (refreshProfile) {
          try {
            await refreshProfile();
          } catch {}
        }

        setFeedback({
          type: "success",
          message: "Your profile details have been updated successfully!",
        });
        setOpenEditProfileModal(false);
      } catch (err) {
        console.error("Update profile error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to update profile details.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Add Measurement Formik
  const addMeasureFormik = useFormik({
    initialValues: {
      title: "",
      pallu: "",
      shoulderToRightTight: "",
      chest: "",
      hip: "",
      firstPleatSize: "",
      noOfChestPleats: "",
      height: "",
      dressSize: "M",
      notes: "",
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setFeedback(null);
      try {
        const measurementPayload = {
          userId: currentUid,
          customerName: displayName,
          customerMobile: displayMobile,
          title: values.title.trim(),
          pallu: values.pallu.trim() || null,
          shoulderToRightTight: values.shoulderToRightTight.trim() || null,
          chest: values.chest.trim() || null,
          hip: values.hip.trim() || null,
          firstPleatSize: values.firstPleatSize.trim() || null,
          noOfChestPleats: values.noOfChestPleats.trim() || null,
          height: values.height.trim() || null,
          dressSize: values.dressSize.trim() || null,
          notes: values.notes.trim(),
        };

        const saved = await createCustomerMeasurement(measurementPayload);
        setMeasurements((prev) => [saved, ...prev]);

        setFeedback({
          type: "success",
          message: `Measurement profile "${values.title.trim()}" added successfully!`,
        });
        resetForm();
        setOpenAddMeasureModal(false);
      } catch (err) {
        console.error("Add measurement error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to save measurement profile.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Edit Measurement Formik
  const editMeasureFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: selectedMeasureForEdit?.title || "",
      pallu:
        selectedMeasureForEdit?.pallu != null
          ? String(selectedMeasureForEdit.pallu)
          : "",
      shoulderToRightTight:
        selectedMeasureForEdit?.shoulderToRightTight != null
          ? String(selectedMeasureForEdit.shoulderToRightTight)
          : "",
      chest:
        selectedMeasureForEdit?.chest != null
          ? String(selectedMeasureForEdit.chest)
          : "",
      hip:
        selectedMeasureForEdit?.hip != null
          ? String(selectedMeasureForEdit.hip)
          : "",
      firstPleatSize:
        selectedMeasureForEdit?.firstPleatSize != null
          ? String(selectedMeasureForEdit.firstPleatSize)
          : "",
      noOfChestPleats:
        selectedMeasureForEdit?.noOfChestPleats != null
          ? String(selectedMeasureForEdit.noOfChestPleats)
          : "",
      height:
        selectedMeasureForEdit?.height != null
          ? String(selectedMeasureForEdit.height)
          : "",
      dressSize: selectedMeasureForEdit?.dressSize || "M",
      notes: selectedMeasureForEdit?.notes || "",
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        if (!selectedMeasureForEdit?.id)
          throw new Error("Measurement ID is required to update.");

        const updatePayload = {
          title: values.title.trim(),
          pallu: values.pallu?.trim() || null,
          shoulderToRightTight: values.shoulderToRightTight?.trim() || null,
          chest: values.chest?.trim() || null,
          hip: values.hip?.trim() || null,
          firstPleatSize: values.firstPleatSize?.trim() || null,
          noOfChestPleats: values.noOfChestPleats?.trim() || null,
          height: values.height?.trim() || null,
          dressSize: values.dressSize?.trim() || null,
          notes: values.notes?.trim() || "",
        };

        const updatedRecord = await updateMeasurement(
          selectedMeasureForEdit.id,
          updatePayload
        );
        setMeasurements((prev) =>
          prev.map((m) =>
            m.id === selectedMeasureForEdit.id
              ? {
                  ...m,
                  ...updatePayload,
                  ...(typeof updatedRecord === "object" &&
                  updatedRecord !== null
                    ? updatedRecord
                    : {}),
                }
              : m
          )
        );

        setFeedback({
          type: "success",
          message: `Measurement profile "${values.title.trim()}" updated successfully!`,
        });
        setOpenEditMeasureModal(false);
        setSelectedMeasureForEdit(null);
      } catch (err) {
        console.error("Update measurement error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to update measurement profile.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Delete measurement
  const confirmDeleteMeasurement = async () => {
    if (!measureToDelete) return;
    const { id: measurementId, title } = measureToDelete;
    setDeletingMeasureId(measurementId);
    try {
      await deleteCustomerMeasurement(measurementId);
      setMeasurements((prev) => prev.filter((m) => m.id !== measurementId));
      setFeedback({
        type: "success",
        message: `Measurement profile "${
          title || "Profile"
        }" deleted successfully.`,
      });
      setMeasureToDelete(null);
    } catch (err) {
      console.error("Delete measurement error:", err);
      setFeedback({
        type: "error",
        message: "Failed to delete measurement profile.",
      });
    } finally {
      setDeletingMeasureId(null);
    }
  };

  if (authLoading && !currentUser && !userProfile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={36} sx={{ color: "#d4af37" }} />
      </Box>
    );
  }

  return (
    <Box className="my-profile-page">
      {/* Top Header */}
      <Box className="my-profile-page__header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            My Profile
          </Typography>
          <Typography variant="body2" className="page-subtitle">
            Manage your personal profile details and custom saree pleating
            measurements
          </Typography>
        </Box>

        <Box className="header-actions">
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon sx={{ color: "#d4af37" }} />}
            onClick={fetchMyMeasurements}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon sx={{ color: "#d4af37" }} />}
            onClick={() => setOpenEditProfileModal(true)}
            className="edit-profile-btn"
          >
            Edit Profile
          </Button>

          <Button
            variant="contained"
            startIcon={
              <SquareFootOutlinedIcon sx={{ color: "#000000 !important" }} />
            }
            onClick={() => setOpenAddMeasureModal(true)}
            className="primary-action-btn"
          >
            Add Measurement
          </Button>
        </Box>
      </Box>

      {/* Global Feedback Alert */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          className="profile-feedback-alert"
        >
          {feedback.message}
        </Alert>
      )}

      {/* Profile Overview Hero Card */}
      <Card className="profile-hero-card">
        <Box className="hero-main-row">
          <Box className="hero-identity">
            <Avatar
              className="profile-avatar-large"
              alt={displayName}
              src={userProfile?.photoURL || currentUser?.photoURL}
            >
              {avatarChar || <PersonOutlineIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            <Box>
              <Typography className="user-display-name">
                {displayName || "User Profile"}
              </Typography>
              <Box className="role-badge-chip">
                <VerifiedUserOutlinedIcon sx={{ fontSize: 14 }} />
                <span>{roleLabel || "Customer"}</span>
              </Box>
            </Box>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<EditOutlinedIcon sx={{ color: "#d4af37" }} />}
            onClick={() => setOpenEditProfileModal(true)}
            className="edit-profile-btn"
          >
            Edit My Details
          </Button>
        </Box>

        {/* Contact and address grid */}
        <Box className="hero-info-grid">
          <Box className="info-box">
            <Box className="info-icon-wrap">
              <PhoneIphoneOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography className="info-label">Mobile Number</Typography>
              <Typography className="info-value">
                {displayMobile
                  ? `+91 ${displayMobile.replace(/\D/g, "").slice(-10)}`
                  : "Not provided"}
              </Typography>
            </Box>
          </Box>

          <Box className="info-box">
            <Box className="info-icon-wrap">
              <EmailOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography className="info-label">Email Address</Typography>
              <Typography className="info-value">{displayEmail}</Typography>
            </Box>
          </Box>

          <Box className="info-box">
            <Box className="info-icon-wrap">
              <LocationOnOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography className="info-label">Delivery Address</Typography>
              <Typography className="info-value">
                {displayAddress || "No address provided yet"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Saree Pleating Measurements Section */}
      <Box className="section-title-bar">
        <Typography className="section-title">
          <StraightenOutlinedIcon />
          My Saree Pleating Measurements
        </Typography>
        <Chip
          label={`${measurements.length} ${
            measurements.length === 1 ? "Measurement" : "Measurements"
          }`}
          size="small"
          className="count-chip"
        />
      </Box>

      {loading && measurements.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} sx={{ color: "#d4af37" }} />
        </Box>
      ) : measurements.length === 0 ? (
        <Card className="empty-measurements-card">
          <StraightenOutlinedIcon className="empty-icon" />
          <Typography className="empty-title">
            No Measurements Recorded Yet
          </Typography>
          <Typography className="empty-desc">
            Save custom saree pleating profiles with your preferred pallu
            length, chest size, pleat count, and draping notes.
          </Typography>
          <Button
            variant="contained"
            startIcon={
              <SquareFootOutlinedIcon sx={{ color: "#000000 !important" }} />
            }
            onClick={() => setOpenAddMeasureModal(true)}
            className="primary-action-btn"
            sx={{ mt: 2.5 }}
          >
            Add Your First Measurement
          </Button>
        </Card>
      ) : (
        <Box className="measurements-grid">
          {measurements.map((measure, idx) => (
            <Card key={measure.id || idx} className="measurement-card">
              <Box className="measure-card-header">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SquareFootOutlinedIcon sx={{ color: "#d4af37", fontSize: 22 }} />
                    <Typography className="profile-title-text">
                      {measure.title || `Measurement Profile #${idx + 1}`}
                    </Typography>
                  </Box>
                  {measure.dressSize && (
                    <Chip
                      label={`Dress Size: ${measure.dressSize}`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#d4af37",
                        borderColor: "rgba(212,175,55,0.4)",
                        backgroundColor: "rgba(212,175,55,0.08)",
                      }}
                      variant="outlined"
                    />
                  )}
                </Box>

                <Box className="card-actions">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditOutlinedIcon sx={{ fontSize: 16 }} />}
                    className="action-edit-btn"
                    onClick={() => {
                      setSelectedMeasureForEdit(measure);
                      setOpenEditMeasureModal(true);
                    }}
                  >
                    Edit
                  </Button>

                  <IconButton
                    size="small"
                    className="action-delete-btn"
                    title="Delete Measurement"
                    onClick={() => setMeasureToDelete(measure)}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              <Box className="measure-card-body">
                <Box className="dimensions-grid">
                  <Box className="dim-cell">
                    <Typography className="dim-name">Pallu Length</Typography>
                    <Typography className="dim-val">
                      {measure.pallu != null && measure.pallu !== ""
                        ? `${measure.pallu}"`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">
                      Shoulder to Tight
                    </Typography>
                    <Typography className="dim-val">
                      {measure.shoulderToRightTight != null &&
                      measure.shoulderToRightTight !== ""
                        ? `${measure.shoulderToRightTight}"`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">Chest Size</Typography>
                    <Typography className="dim-val">
                      {measure.chest != null && measure.chest !== ""
                        ? `${measure.chest}"`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">Hip Size</Typography>
                    <Typography className="dim-val">
                      {measure.hip != null && measure.hip !== ""
                        ? `${measure.hip}"`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">1st Pleat Size</Typography>
                    <Typography className="dim-val">
                      {measure.firstPleatSize != null &&
                      measure.firstPleatSize !== ""
                        ? `${measure.firstPleatSize}"`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">Chest Pleats</Typography>
                    <Typography className="dim-val">
                      {measure.noOfChestPleats != null &&
                      measure.noOfChestPleats !== ""
                        ? `${measure.noOfChestPleats} Pleats`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">Height</Typography>
                    <Typography className="dim-val">
                      {measure.height != null && measure.height !== ""
                        ? `${measure.height}`
                        : "—"}
                    </Typography>
                  </Box>
                  <Box className="dim-cell">
                    <Typography className="dim-name">Dress Size</Typography>
                    <Typography className="dim-val">
                      {measure.dressSize || "—"}
                    </Typography>
                  </Box>
                </Box>

                {measure.notes && (
                  <Box className="measure-notes-box">
                    <Typography className="notes-label">
                      Tailoring & Draping Notes
                    </Typography>
                    <Typography className="notes-content">
                      {measure.notes}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1.5, borderTop: "1px solid rgba(212, 175, 55, 0.12)" }}>
                  <Typography className="measure-footer-date" sx={{ mt: "0 !important" }}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: "#d4af37" }} />
                    Recorded {formatDateSafe(measure.createdAtDate || measure.createdAt, "Recent")}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT PERSONAL PROFILE                                             */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditProfileModal}
        onClose={() => setOpenEditProfileModal(false)}
        maxWidth="sm"
        fullWidth
        className="profile-modal"
        PaperProps={{
          sx: {
            maxWidth: "560px !important",
            width: "100%",
          },
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d4af37 0%, #a28220 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.35)",
                flexShrink: 0,
              }}
            >
              <EditOutlinedIcon sx={{ color: "#000000", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" className="dialog-title">
                Edit My Profile Details
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(230, 216, 163, 0.65)",
                  fontSize: "0.76rem",
                  display: "block",
                }}
              >
                Update your contact information and delivery address
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenEditProfileModal(false)}
            sx={{
              color: "#e6d8a3",
              padding: "6px",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                color: "#d4af37",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={editProfileFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                fullWidth
                label="Your Full Name *"
                name="username"
                value={editProfileFormik.values.username}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={
                  editProfileFormik.touched.username &&
                  Boolean(editProfileFormik.errors.username)
                }
                helperText={
                  editProfileFormik.touched.username &&
                  editProfileFormik.errors.username
                }
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                label="10-Digit Mobile Number *"
                name="userMobile"
                value={editProfileFormik.values.userMobile}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={
                  editProfileFormik.touched.userMobile &&
                  Boolean(editProfileFormik.errors.userMobile)
                }
                helperText={
                  editProfileFormik.touched.userMobile &&
                  editProfileFormik.errors.userMobile
                }
                className="custom-form-field"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">+91</InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email Address *"
                name="email"
                type="email"
                value={editProfileFormik.values.email}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={
                  editProfileFormik.touched.email &&
                  Boolean(editProfileFormik.errors.email)
                }
                helperText={
                  editProfileFormik.touched.email &&
                  editProfileFormik.errors.email
                }
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Delivery Address"
                name="userAddress"
                placeholder="Flat / House No., Street, City, Pincode"
                value={editProfileFormik.values.userAddress}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={
                  editProfileFormik.touched.userAddress &&
                  Boolean(editProfileFormik.errors.userAddress)
                }
                helperText={
                  editProfileFormik.touched.userAddress &&
                  editProfileFormik.errors.userAddress
                }
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenEditProfileModal(false)}
              className="cancel-btn"
              disabled={editProfileFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={editProfileFormik.isSubmitting}
              startIcon={
                editProfileFormik.isSubmitting ? (
                  <CircularProgress size={16} sx={{ color: "#000000" }} />
                ) : null
              }
            >
              {editProfileFormik.isSubmitting ? "Saving..." : "Save My Details"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: ADD MEASUREMENT PROFILE                                           */}
      {/* ========================================================================= */}
      <Dialog
        open={openAddMeasureModal}
        onClose={() => setOpenAddMeasureModal(false)}
        maxWidth="md"
        fullWidth
        className="profile-modal"
        PaperProps={{
          sx: {
            maxWidth: "700px !important",
            width: "100%",
          },
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d4af37 0%, #a28220 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.35)",
                flexShrink: 0,
              }}
            >
              <SquareFootOutlinedIcon sx={{ color: "#000000", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" className="dialog-title">
                Add Saree Pleating Measurement
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(230, 216, 163, 0.65)",
                  fontSize: "0.76rem",
                  display: "block",
                }}
              >
                Save custom draping & pleating dimensions to your profile
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenAddMeasureModal(false)}
            sx={{
              color: "#e6d8a3",
              padding: "6px",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                color: "#d4af37",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={addMeasureFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
              <TextField
                fullWidth
                label="Measurement Profile Title *"
                placeholder="e.g. Bridal Silk Saree, Reception Draping, Kanchi Pleats"
                name="title"
                value={addMeasureFormik.values.title}
                onChange={addMeasureFormik.handleChange}
                onBlur={addMeasureFormik.handleBlur}
                error={
                  addMeasureFormik.touched.title &&
                  Boolean(addMeasureFormik.errors.title)
                }
                helperText={
                  addMeasureFormik.touched.title &&
                  addMeasureFormik.errors.title
                }
                className="custom-form-field"
                size="small"
              />

              {/* Row 1: Pallu & Shoulder */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Pallu Length"
                  placeholder="e.g. 38"
                  name="pallu"
                  value={addMeasureFormik.values.pallu}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.pallu &&
                    Boolean(addMeasureFormik.errors.pallu)
                  }
                  helperText={
                    addMeasureFormik.touched.pallu &&
                    addMeasureFormik.errors.pallu
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Shoulder to Right Tight"
                  placeholder="e.g. 14"
                  name="shoulderToRightTight"
                  value={addMeasureFormik.values.shoulderToRightTight}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.shoulderToRightTight &&
                    Boolean(addMeasureFormik.errors.shoulderToRightTight)
                  }
                  helperText={
                    addMeasureFormik.touched.shoulderToRightTight &&
                    addMeasureFormik.errors.shoulderToRightTight
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 2: Chest & Hip */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Chest / Bust Size"
                  placeholder="e.g. 36"
                  name="chest"
                  value={addMeasureFormik.values.chest}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.chest &&
                    Boolean(addMeasureFormik.errors.chest)
                  }
                  helperText={
                    addMeasureFormik.touched.chest &&
                    addMeasureFormik.errors.chest
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Hip / Waist Size"
                  placeholder="e.g. 40"
                  name="hip"
                  value={addMeasureFormik.values.hip}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.hip &&
                    Boolean(addMeasureFormik.errors.hip)
                  }
                  helperText={
                    addMeasureFormik.touched.hip && addMeasureFormik.errors.hip
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 3: First Pleat & Chest Pleats */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="First Pleat Size"
                  placeholder="e.g. 6.5"
                  name="firstPleatSize"
                  value={addMeasureFormik.values.firstPleatSize}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.firstPleatSize &&
                    Boolean(addMeasureFormik.errors.firstPleatSize)
                  }
                  helperText={
                    addMeasureFormik.touched.firstPleatSize &&
                    addMeasureFormik.errors.firstPleatSize
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="No. of Chest Pleats"
                  placeholder="e.g. 5"
                  name="noOfChestPleats"
                  value={addMeasureFormik.values.noOfChestPleats}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.noOfChestPleats &&
                    Boolean(addMeasureFormik.errors.noOfChestPleats)
                  }
                  helperText={
                    addMeasureFormik.touched.noOfChestPleats &&
                    addMeasureFormik.errors.noOfChestPleats
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">pleats</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 4: Height & Dress Size */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Height"
                  placeholder="e.g. 165 or 5.5"
                  name="height"
                  value={addMeasureFormik.values.height}
                  onChange={addMeasureFormik.handleChange}
                  onBlur={addMeasureFormik.handleBlur}
                  error={
                    addMeasureFormik.touched.height &&
                    Boolean(addMeasureFormik.errors.height)
                  }
                  helperText={
                    addMeasureFormik.touched.height &&
                    addMeasureFormik.errors.height
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">cm / in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  label="Dress Size"
                  name="dressSize"
                  value={addMeasureFormik.values.dressSize}
                  onChange={addMeasureFormik.handleChange}
                  className="custom-form-field"
                  size="small"
                >
                  {DRESS_SIZES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Tailoring & Draping Notes (Optional)"
                placeholder="Specific pin positions, pleat stiffness, or custom preferences..."
                name="notes"
                value={addMeasureFormik.values.notes}
                onChange={addMeasureFormik.handleChange}
                onBlur={addMeasureFormik.handleBlur}
                error={
                  addMeasureFormik.touched.notes &&
                  Boolean(addMeasureFormik.errors.notes)
                }
                helperText={
                  addMeasureFormik.touched.notes &&
                  addMeasureFormik.errors.notes
                }
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenAddMeasureModal(false)}
              className="cancel-btn"
              disabled={addMeasureFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={addMeasureFormik.isSubmitting}
              startIcon={
                addMeasureFormik.isSubmitting ? (
                  <CircularProgress size={16} sx={{ color: "#000000" }} />
                ) : null
              }
            >
              {addMeasureFormik.isSubmitting
                ? "Saving..."
                : "Save Measurement Profile"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDIT MEASUREMENT PROFILE                                          */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditMeasureModal}
        onClose={() => setOpenEditMeasureModal(false)}
        maxWidth="md"
        fullWidth
        className="profile-modal"
        PaperProps={{
          sx: {
            maxWidth: "700px !important",
            width: "100%",
          },
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d4af37 0%, #a28220 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.35)",
                flexShrink: 0,
              }}
            >
              <EditOutlinedIcon sx={{ color: "#000000", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" className="dialog-title">
                Edit Measurement Profile
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(230, 216, 163, 0.65)",
                  fontSize: "0.76rem",
                  display: "block",
                }}
              >
                Update your saree pleating & draping dimensions
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenEditMeasureModal(false)}
            sx={{
              color: "#e6d8a3",
              padding: "6px",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                color: "#d4af37",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={editMeasureFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
              <TextField
                fullWidth
                label="Measurement Profile Title *"
                name="title"
                value={editMeasureFormik.values.title}
                onChange={editMeasureFormik.handleChange}
                onBlur={editMeasureFormik.handleBlur}
                error={
                  editMeasureFormik.touched.title &&
                  Boolean(editMeasureFormik.errors.title)
                }
                helperText={
                  editMeasureFormik.touched.title &&
                  editMeasureFormik.errors.title
                }
                className="custom-form-field"
                size="small"
              />

              {/* Row 1: Pallu & Shoulder */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Pallu Length"
                  placeholder="e.g. 38"
                  name="pallu"
                  value={editMeasureFormik.values.pallu}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.pallu &&
                    Boolean(editMeasureFormik.errors.pallu)
                  }
                  helperText={
                    editMeasureFormik.touched.pallu &&
                    editMeasureFormik.errors.pallu
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Shoulder to Right Tight"
                  placeholder="e.g. 14"
                  name="shoulderToRightTight"
                  value={editMeasureFormik.values.shoulderToRightTight}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.shoulderToRightTight &&
                    Boolean(editMeasureFormik.errors.shoulderToRightTight)
                  }
                  helperText={
                    editMeasureFormik.touched.shoulderToRightTight &&
                    editMeasureFormik.errors.shoulderToRightTight
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 2: Chest & Hip */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Chest / Bust Size"
                  placeholder="e.g. 36"
                  name="chest"
                  value={editMeasureFormik.values.chest}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.chest &&
                    Boolean(editMeasureFormik.errors.chest)
                  }
                  helperText={
                    editMeasureFormik.touched.chest &&
                    editMeasureFormik.errors.chest
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Hip / Waist Size"
                  placeholder="e.g. 40"
                  name="hip"
                  value={editMeasureFormik.values.hip}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.hip &&
                    Boolean(editMeasureFormik.errors.hip)
                  }
                  helperText={
                    editMeasureFormik.touched.hip &&
                    editMeasureFormik.errors.hip
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 3: First Pleat & Chest Pleats */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="First Pleat Size"
                  placeholder="e.g. 6.5"
                  name="firstPleatSize"
                  value={editMeasureFormik.values.firstPleatSize}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.firstPleatSize &&
                    Boolean(editMeasureFormik.errors.firstPleatSize)
                  }
                  helperText={
                    editMeasureFormik.touched.firstPleatSize &&
                    editMeasureFormik.errors.firstPleatSize
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="No. of Chest Pleats"
                  placeholder="e.g. 5"
                  name="noOfChestPleats"
                  value={editMeasureFormik.values.noOfChestPleats}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.noOfChestPleats &&
                    Boolean(editMeasureFormik.errors.noOfChestPleats)
                  }
                  helperText={
                    editMeasureFormik.touched.noOfChestPleats &&
                    editMeasureFormik.errors.noOfChestPleats
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">pleats</InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Row 4: Height & Dress Size */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Height"
                  placeholder="e.g. 165 or 5.5"
                  name="height"
                  value={editMeasureFormik.values.height}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={
                    editMeasureFormik.touched.height &&
                    Boolean(editMeasureFormik.errors.height)
                  }
                  helperText={
                    editMeasureFormik.touched.height &&
                    editMeasureFormik.errors.height
                  }
                  className="custom-form-field"
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">cm / in</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  select
                  label="Dress Size"
                  name="dressSize"
                  value={editMeasureFormik.values.dressSize}
                  onChange={editMeasureFormik.handleChange}
                  className="custom-form-field"
                  size="small"
                >
                  {DRESS_SIZES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Tailoring & Draping Notes (Optional)"
                placeholder="Specific pin positions, pleat stiffness, or custom preferences..."
                name="notes"
                value={editMeasureFormik.values.notes}
                onChange={editMeasureFormik.handleChange}
                onBlur={editMeasureFormik.handleBlur}
                error={
                  editMeasureFormik.touched.notes &&
                  Boolean(editMeasureFormik.errors.notes)
                }
                helperText={
                  editMeasureFormik.touched.notes &&
                  editMeasureFormik.errors.notes
                }
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenEditMeasureModal(false)}
              className="cancel-btn"
              disabled={editMeasureFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={editMeasureFormik.isSubmitting}
              startIcon={
                editMeasureFormik.isSubmitting ? (
                  <CircularProgress size={16} sx={{ color: "#000000" }} />
                ) : null
              }
            >
              {editMeasureFormik.isSubmitting
                ? "Saving..."
                : "Update Measurement Profile"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Modal for Measurement Deletion */}
      {measureToDelete && (
        <Dialog
          open={Boolean(measureToDelete)}
          onClose={() => setMeasureToDelete(null)}
          maxWidth="xs"
          fullWidth
          className="profile-modal"
        >
          <DialogTitle className="dialog-title-bar">
            <Typography
              className="dialog-title"
              sx={{ color: "#f87171 !important" }}
            >
              Confirm Deletion
            </Typography>
            <IconButton
              onClick={() => setMeasureToDelete(null)}
              sx={{ color: "#e6d8a3" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent className="dialog-content-body">
            <Typography sx={{ color: "#e6d8a3", fontSize: "0.92rem" }}>
              Are you sure you want to delete the measurement profile{" "}
              <strong style={{ color: "#d4af37" }}>
                "{measureToDelete.title}"
              </strong>
              ?
            </Typography>
          </DialogContent>
          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setMeasureToDelete(null)}
              className="cancel-btn"
              disabled={Boolean(deletingMeasureId)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteMeasurement}
              variant="contained"
              disabled={Boolean(deletingMeasureId)}
              sx={{
                backgroundColor: "#dc2626 !important",
                color: "#ffffff !important",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { backgroundColor: "#b91c1c !important" },
              }}
              startIcon={
                deletingMeasureId ? (
                  <CircularProgress size={14} sx={{ color: "#ffffff" }} />
                ) : null
              }
            >
              {deletingMeasureId ? "Deleting..." : "Delete Profile"}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MyProfile;
