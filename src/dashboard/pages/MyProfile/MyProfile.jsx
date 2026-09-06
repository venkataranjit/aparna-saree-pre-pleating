import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import {
  AppButton,
  AppInput,
  AppModal,
  AppBadge,
  AppSpinner,
  AppCard,
} from "../../../components/common";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  updateUser,
  getAllMeasurements,
  createCustomerMeasurement,
  updateMeasurement,
  deleteCustomerMeasurement,
  checkUserUniqueness,
  formatDateSafe,
} from "../../../firebase/dbService";
import { USER_ROLES } from "../../../firebase/schema";
import "./MyProfile.scss";
import { MeasurementModal } from "../../components/MeasurementModal/MeasurementModal";

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
        return !Number.isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 30;
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
  const {
    currentUser,
    userProfile,
    isSuperAdmin,
    role,
    refreshProfile,
    loading: authLoading,
  } = useAuth();
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
    userProfile?.username ||
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "");
  const displayEmail = userProfile?.email || currentUser?.email || "";
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
      : currentUser || userProfile
      ? "Customer"
      : "";

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
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness excluding current user's profile
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
          excludeUserId: currentUid,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            editProfileFormik.setFieldError("email", "This email address is already registered.");
            editProfileFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            editProfileFormik.setFieldError("userMobile", "This mobile number is already registered.");
            editProfileFormik.setFieldTouched("userMobile", true, false);
          }
          setFeedback({
            type: "error",
            message: uniqueness.message,
          });
          setSubmitting(false);
          return;
        }

        const updatePayload = {
          username: values.username.trim(),
          userMobile: cleanMobile,
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

  // addMeasureFormik removed — handled by <MeasurementModal> component via onSave prop.


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
      <div className="my-profile-page__loading">
        <AppSpinner size={36} />
      </div>
    );
  }

  return (
    <div className="my-profile-page">
      {/* Top Header */}
      <div className="my-profile-page__header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your personal profile details and custom saree pleating measurements
          </p>
        </div>

        <div className="header-actions">
          <AppButton
            variant="secondary"
            icon={<RefreshOutlinedIcon />}
            onClick={fetchMyMeasurements}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </AppButton>

          <AppButton
            variant="secondary"
            icon={<EditOutlinedIcon />}
            onClick={() => setOpenEditProfileModal(true)}
          >
            Edit Profile
          </AppButton>

          <AppButton
            variant="primary"
            icon={<SquareFootOutlinedIcon />}
            onClick={() => setOpenAddMeasureModal(true)}
          >
            Add Measurement
          </AppButton>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div className={`profile-feedback-alert profile-feedback-alert--${feedback.type}`}>
          <span>{feedback.message}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setFeedback(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* Profile Overview Hero Card */}
      <div className="profile-hero-card">
        <div className="hero-main-row">
          <div className="hero-identity">
            <div className="profile-avatar-large">
              {avatarChar || <PersonOutlineIcon />}
            </div>
            <div>
              <h2 className="user-display-name">
                {displayName || "User Profile"}
              </h2>
              <div className="role-badge-chip">
                <VerifiedUserOutlinedIcon />
                <span>{roleLabel || "Customer"}</span>
              </div>
            </div>
          </div>

          <AppButton
            variant="secondary"
            size="sm"
            icon={<EditOutlinedIcon />}
            onClick={() => setOpenEditProfileModal(true)}
          >
            Edit My Details
          </AppButton>
        </div>

        {/* Contact and address grid */}
        <div className="hero-info-grid">
          <div className="info-box">
            <div className="info-icon-wrap">
              <PhoneIphoneOutlinedIcon />
            </div>
            <div>
              <span className="info-label">Mobile Number</span>
              <p className="info-value">
                {displayMobile
                  ? `+91 ${displayMobile.replace(/\D/g, "").slice(-10)}`
                  : "Not provided"}
              </p>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon-wrap">
              <EmailOutlinedIcon />
            </div>
            <div>
              <span className="info-label">Email Address</span>
              <p className="info-value">{displayEmail}</p>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon-wrap">
              <LocationOnOutlinedIcon />
            </div>
            <div>
              <span className="info-label">Delivery Address</span>
              <p className="info-value">
                {displayAddress || "No address provided yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Saree Pleating Measurements Section */}
      <div className="section-title-bar">
        <h3 className="section-title">
          <StraightenOutlinedIcon />
          My Saree Pleating Measurements
        </h3>
        <span className="count-chip">
          {measurements.length} {measurements.length === 1 ? "Measurement" : "Measurements"}
        </span>
      </div>

      {loading && measurements.length === 0 ? (
        <div className="my-profile-page__loading">
          <AppSpinner size={32} />
        </div>
      ) : measurements.length === 0 ? (
        <div className="empty-measurements-card">
          <StraightenOutlinedIcon className="empty-icon" />
          <h4 className="empty-title">No Measurements Recorded Yet</h4>
          <p className="empty-desc">
            Save custom saree pleating profiles with your preferred pallu
            length, chest size, pleat count, and draping notes.
          </p>
          <AppButton
            variant="primary"
            icon={<SquareFootOutlinedIcon />}
            onClick={() => setOpenAddMeasureModal(true)}
          >
            Add Your First Measurement
          </AppButton>
        </div>
      ) : (
        <div className="measurements-grid">
          {measurements.map((measure, idx) => (
            <div key={measure.id || idx} className="measurement-card">
              <div className="measure-card-header">
                <div className="measure-card-header-left">
                  <div className="measure-title-wrap">
                    <SquareFootOutlinedIcon />
                    <h4 className="profile-title-text">
                      {measure.title || `Measurement Profile #${idx + 1}`}
                    </h4>
                  </div>
                  {measure.dressSize && (
                    <span className="dress-size-pill">
                      Dress Size: {measure.dressSize}
                    </span>
                  )}
                </div>

                <div className="card-actions">
                  <AppButton
                    size="sm"
                    variant="secondary"
                    icon={<EditOutlinedIcon />}
                    onClick={() => {
                      setSelectedMeasureForEdit(measure);
                      setOpenEditMeasureModal(true);
                    }}
                  >
                    Edit
                  </AppButton>

                  <AppButton
                    size="sm"
                    variant="icon"
                    icon={<DeleteOutlineIcon />}
                    onClick={() => setMeasureToDelete(measure)}
                    title="Delete Measurement"
                  />
                </div>
              </div>

              <div className="measure-card-body">
                <div className="dimensions-grid">
                  <div className="dim-cell">
                    <span className="dim-name">Pallu Length</span>
                    <span className="dim-val">
                      {measure.pallu != null && measure.pallu !== ""
                        ? `${measure.pallu}"`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Shoulder to Tight</span>
                    <span className="dim-val">
                      {measure.shoulderToRightTight != null &&
                      measure.shoulderToRightTight !== ""
                        ? `${measure.shoulderToRightTight}"`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Chest Size</span>
                    <span className="dim-val">
                      {measure.chest != null && measure.chest !== ""
                        ? `${measure.chest}"`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Hip Size</span>
                    <span className="dim-val">
                      {measure.hip != null && measure.hip !== ""
                        ? `${measure.hip}"`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">1st Pleat Size</span>
                    <span className="dim-val">
                      {measure.firstPleatSize != null &&
                      measure.firstPleatSize !== ""
                        ? `${measure.firstPleatSize}"`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Chest Pleats</span>
                    <span className="dim-val">
                      {measure.noOfChestPleats != null &&
                      measure.noOfChestPleats !== ""
                        ? `${measure.noOfChestPleats} Pleats`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Height</span>
                    <span className="dim-val">
                      {measure.height != null && measure.height !== ""
                        ? `${measure.height}`
                        : "—"}
                    </span>
                  </div>
                  <div className="dim-cell">
                    <span className="dim-name">Dress Size</span>
                    <span className="dim-val">
                      {measure.dressSize || "—"}
                    </span>
                  </div>
                </div>

                {measure.notes && (
                  <div className="measure-notes-box">
                    <span className="notes-label">Tailoring & Draping Notes</span>
                    <p className="notes-content">{measure.notes}</p>
                  </div>
                )}

                <div className="measure-card-footer">
                  <span className="measure-footer-date">
                    <CalendarTodayOutlinedIcon />
                    Recorded {formatDateSafe(measure.createdAtDate || measure.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Modal: Edit Profile Dialog                                             */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditProfileModal}
        onClose={() => !editProfileFormik.isSubmitting && setOpenEditProfileModal(false)}
        title="Edit My Profile Details"
        subtitle="Update your contact information and delivery address"
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setOpenEditProfileModal(false)}
              disabled={editProfileFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={editProfileFormik.handleSubmit}
              loading={editProfileFormik.isSubmitting}
            >
              Save Profile
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={editProfileFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <AppInput
            label="Your Full Name"
            required
            id="profile-username"
            name="username"
            value={editProfileFormik.values.username}
            onChange={editProfileFormik.handleChange}
            onBlur={editProfileFormik.handleBlur}
            error={
              editProfileFormik.touched.username &&
              editProfileFormik.errors.username
            }
            disabled={editProfileFormik.isSubmitting}
            startAdornment={<PersonOutlineIcon />}
          />

          <AppInput
            label="Mobile Number"
            required
            id="profile-mobile"
            name="userMobile"
            placeholder="10-digit mobile number"
            value={editProfileFormik.values.userMobile}
            onChange={editProfileFormik.handleChange}
            onBlur={editProfileFormik.handleBlur}
            error={
              editProfileFormik.touched.userMobile &&
              editProfileFormik.errors.userMobile
            }
            disabled={editProfileFormik.isSubmitting}
            startAdornment={<span>+91</span>}
          />

          <AppInput
            label="Email Address"
            required
            type="email"
            id="profile-email"
            name="email"
            value={editProfileFormik.values.email}
            onChange={editProfileFormik.handleChange}
            onBlur={editProfileFormik.handleBlur}
            error={
              editProfileFormik.touched.email &&
              editProfileFormik.errors.email
            }
            disabled={editProfileFormik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Delivery / Residential Address"
            multiline
            rows={3}
            id="profile-address"
            name="userAddress"
            placeholder="Door number, street name, landmark, pincode..."
            value={editProfileFormik.values.userAddress}
            onChange={editProfileFormik.handleChange}
            onBlur={editProfileFormik.handleBlur}
            error={
              editProfileFormik.touched.userAddress &&
              editProfileFormik.errors.userAddress
            }
            disabled={editProfileFormik.isSubmitting}
          />
        </form>
      </AppModal>


      {/* ========================================================================= */}
      {/* 2. Modal: Add Measurement Profile (reusable MeasurementModal component)    */}
      {/* ========================================================================= */}
      <MeasurementModal
        open={openAddMeasureModal}
        onClose={() => setOpenAddMeasureModal(false)}
        subtitle={`Recording measurements for ${displayName || "My Profile"}`}
        onSave={async (values) => {
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
        }}
      />

      {/* ========================================================================= */}
      {/* 3. Modal: Edit Measurement Profile Dialog                                 */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditMeasureModal}
        onClose={() => !editMeasureFormik.isSubmitting && setOpenEditMeasureModal(false)}
        title="Edit Measurement Profile"
        subtitle={selectedMeasureForEdit?.title || "Modify pleat and sizing parameters"}
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setOpenEditMeasureModal(false)}
              disabled={editMeasureFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={editMeasureFormik.handleSubmit}
              loading={editMeasureFormik.isSubmitting}
            >
              Save Changes
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={editMeasureFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Measurement Profile Title"
            required
            id="edit-measure-title"
            name="title"
            value={editMeasureFormik.values.title}
            onChange={editMeasureFormik.handleChange}
            onBlur={editMeasureFormik.handleBlur}
            error={
              editMeasureFormik.touched.title && editMeasureFormik.errors.title
            }
            disabled={editMeasureFormik.isSubmitting}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            <AppInput
              label="Pallu Length (Inches)"
              id="edit-measure-pallu"
              name="pallu"
              value={editMeasureFormik.values.pallu}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.pallu &&
                editMeasureFormik.errors.pallu
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>in</span>}
            />

            <AppInput
              label="Shoulder to Tight (Inches)"
              id="edit-measure-shoulder"
              name="shoulderToRightTight"
              value={editMeasureFormik.values.shoulderToRightTight}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.shoulderToRightTight &&
                editMeasureFormik.errors.shoulderToRightTight
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>in</span>}
            />

            <AppInput
              label="Chest Size (Inches)"
              id="edit-measure-chest"
              name="chest"
              value={editMeasureFormik.values.chest}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.chest &&
                editMeasureFormik.errors.chest
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>in</span>}
            />

            <AppInput
              label="Hip Size (Inches)"
              id="edit-measure-hip"
              name="hip"
              value={editMeasureFormik.values.hip}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.hip && editMeasureFormik.errors.hip
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>in</span>}
            />

            <AppInput
              label="First Pleat Size (Inches)"
              id="edit-measure-first-pleat"
              name="firstPleatSize"
              value={editMeasureFormik.values.firstPleatSize}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.firstPleatSize &&
                editMeasureFormik.errors.firstPleatSize
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>in</span>}
            />

            <AppInput
              label="Number of Chest Pleats"
              id="edit-measure-chest-pleats"
              name="noOfChestPleats"
              value={editMeasureFormik.values.noOfChestPleats}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.noOfChestPleats &&
                editMeasureFormik.errors.noOfChestPleats
              }
              disabled={editMeasureFormik.isSubmitting}
              endAdornment={<span>pleats</span>}
            />

            <AppInput
              label="Height (cm / ft)"
              id="edit-measure-height"
              name="height"
              value={editMeasureFormik.values.height}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.height &&
                editMeasureFormik.errors.height
              }
              disabled={editMeasureFormik.isSubmitting}
            />

            <AppInput
              select
              label="Standard Dress Size"
              id="edit-measure-dress-size"
              name="dressSize"
              value={editMeasureFormik.values.dressSize}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.dressSize &&
                editMeasureFormik.errors.dressSize
              }
              disabled={editMeasureFormik.isSubmitting}
            >
              {DRESS_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </AppInput>
          </div>

          <AppInput
            multiline
            rows={3}
            label="Special Tailoring & Draping Notes (Optional)"
            id="edit-measure-notes"
            name="notes"
            value={editMeasureFormik.values.notes}
            onChange={editMeasureFormik.handleChange}
            onBlur={editMeasureFormik.handleBlur}
            error={
              editMeasureFormik.touched.notes &&
              editMeasureFormik.errors.notes
            }
            disabled={editMeasureFormik.isSubmitting}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 4. Modal: Confirmation Modal for Measurement Deletion                     */}
      {/* ========================================================================= */}
      <AppModal
        open={Boolean(measureToDelete)}
        onClose={() => !deletingMeasureId && setMeasureToDelete(null)}
        title="Confirm Deletion"
        maxWidth="xs"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setMeasureToDelete(null)}
              disabled={Boolean(deletingMeasureId)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={confirmDeleteMeasurement}
              loading={Boolean(deletingMeasureId)}
            >
              Delete Profile
            </AppButton>
          </>
        }
      >
        <p style={{ color: "#e6d8a3", fontSize: "0.95rem", margin: "8px 0" }}>
          Are you sure you want to delete the measurement profile{" "}
          <strong style={{ color: "#d4af37" }}>
            "{measureToDelete?.title}"
          </strong>
          ? This action cannot be undone.
        </p>
      </AppModal>
    </div>
  );
};

export default MyProfile;
