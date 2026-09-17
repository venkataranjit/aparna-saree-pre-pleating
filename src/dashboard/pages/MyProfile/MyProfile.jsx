import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
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
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import { updatePassword } from "firebase/auth";
import { auth } from "../../../firebase/config";
import {
  AppButton,
  AppInput,
  AppModal,
  AppBadge,
  AppSpinner,
  AppCard,
  AppTabs,
  ThemeToggle,
} from "../../../components/common";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  updateUser,
  getMeasurementsByUserId,
  createClientMeasurement,
  updateMeasurement,
  deleteClientMeasurement,
  checkUserUniqueness,
  formatDateSafe,
  formatTimeSafe,
  resetUserPassword,
  getOrdersByUserId,
} from "../../../firebase/dbService";
import { USER_ROLES } from "../../../firebase/schema";
import "./MyProfile.scss";
import { MeasurementModal } from "../../components/MeasurementModal/MeasurementModal";
import CreateOrderModal from "../../components/CreateOrderModal/CreateOrderModal";
import OrderDetailsModal from "../../components/OrderDetailsModal/OrderDetailsModal";

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
      "Please enter a valid 10-digit Indian mobile number",
    )
    .required("Mobile Number is required"),
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email Address is required"),
  userAddress: Yup.string()
    .trim()
    .max(200, "Address cannot exceed 200 characters"),
  newPassword: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .notRequired(),
});

const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Custom"];

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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    ),
  dressSize: Yup.string().trim().nullable(),
  notes: Yup.string().trim().max(300, "Notes cannot exceed 300 characters"),
});

// Helpers for parsing orders in client profile
const getOrderItems = (order) => {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  return [
    {
      id: "item_legacy",
      serviceName: order.service || "Saree Pre-Pleating",
      finalPrice:
        Number(
          String(order.amount || order.totalAmount || 0).replace(/[^0-9]/g, ""),
        ) || 0,
      sareeType: order.sareeType || "Silk Saree",
      itemNotes: order.notes || "",
    },
  ];
};

const getOrderTotalAmount = (order) => {
  if (!order) return "₹0";
  if (
    order.totalAmount !== undefined &&
    order.totalAmount !== null &&
    order.totalAmount !== ""
  ) {
    return `₹${Number(order.totalAmount).toLocaleString("en-IN")}`;
  }
  if (order.amount) {
    if (String(order.amount).includes("₹")) return order.amount;
    return `₹${Number(order.amount).toLocaleString("en-IN")}`;
  }
  const items = getOrderItems(order);
  const sum = items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);
  return `₹${sum.toLocaleString("en-IN")}`;
};

const getOrderFabricSummary = (order) => {
  const items = getOrderItems(order);
  if (items.length === 0) return order.sareeType || "Silk Saree";
  const fabrics = items.map((it) => it.sareeType).filter(Boolean);
  if (fabrics.length === 0) return order.sareeType || "Standard Silk";
  const unique = [...new Set(fabrics)];
  if (unique.length === 1) return unique[0];
  return `${unique[0]} (+${unique.length - 1})`;
};

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
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderForView, setOrderForView] = useState(null);

  // Modals
  const [openCreateOrderModal, setOpenCreateOrderModal] = useState(false);
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
            ? "Client"
            : "";

  // Fetch measurements for the logged-in user (strictly isolated: never fetch other users' measurements)
  const fetchMyMeasurements = async () => {
    setLoading(true);
    try {
      if (!currentUid) {
        setMeasurements([]);
        setLoading(false);
        return;
      }
      const myMeasures = await getMeasurementsByUserId(currentUid);
      if (userProfile?.id && userProfile.id !== currentUid) {
        const profileMeasures = await getMeasurementsByUserId(userProfile.id);
        const map = new Map();
        [...myMeasures, ...profileMeasures].forEach((m) => {
          if (m && m.id) map.set(m.id, m);
        });
        setMeasurements(Array.from(map.values()));
      } else {
        setMeasurements(myMeasures);
      }
    } catch (err) {
      console.warn("Error fetching personal measurements:", err);
      setMeasurements([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders for the logged-in user (strictly isolated: never fetch other users' orders)
  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      if (!currentUid && !displayEmail && !displayMobile) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }
      const myOrders = await getOrdersByUserId(
        currentUid,
        displayEmail,
        displayMobile,
      );
      setOrders(myOrders || []);
    } catch (err) {
      console.warn("Error fetching personal orders:", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRefreshAll = () => {
    fetchMyMeasurements();
    fetchMyOrders();
  };

  useEffect(() => {
    fetchMyMeasurements();
    fetchMyOrders();
  }, [currentUid, displayEmail, displayMobile, userProfile]);

  // Determine if logged in user is coming from Gmail/Google, Facebook, or Mobile OTP:
  // If so, do not show the Change Password option in the Edit My Profile Details popup
  const canChangePassword = useMemo(() => {
    // Any account with an email can set or update their account password to enable dual login
    const email = (
      currentUser?.email ||
      userProfile?.email ||
      ""
    ).trim();
    return Boolean(email && email.length > 0 && email.includes("@"));
  }, [currentUser, userProfile]);

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
      newPassword: "",
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
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
            editProfileFormik.setFieldError(
              "email",
              "This email address is already registered.",
            );
            editProfileFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            editProfileFormik.setFieldError(
              "userMobile",
              "This mobile number is already registered.",
            );
            editProfileFormik.setFieldTouched("userMobile", true, false);
          }
          toast.error(uniqueness.message);
          setSubmitting(false);
          return;
        }

        const updatePayload = {
          username: values.username.trim(),
          userMobile: cleanMobile,
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role: userProfile?.role || USER_ROLES.CLIENT,
        };

        if (currentUid) {
          await updateUser(currentUid, updatePayload);
        }

        // Update password if eligible and provided
        let pwFeedbackNote = "";
        if (
          canChangePassword &&
          values.newPassword &&
          values.newPassword.trim()
        ) {
          const pass = values.newPassword.trim();
          let passwordUpdated = false;

          // 1. Try direct update on active Firebase Auth session
          if (auth?.currentUser) {
            try {
              await updatePassword(auth.currentUser, pass);
              passwordUpdated = true;
              pwFeedbackNote = " Password updated successfully.";
            } catch (authPwErr) {
              console.warn("Direct updatePassword note:", authPwErr);
            }
          }

          // 2. Fall back to resetUserPassword
          if (!passwordUpdated) {
            try {
              const pwResult = await resetUserPassword({
                email: cleanEmail,
                currentPassword: "aparna",
                newPassword: pass,
                displayName: values.username.trim(),
              });
              if (pwResult?.method === "email_sent") {
                pwFeedbackNote = ` Note: ${pwResult.message}`;
              } else {
                pwFeedbackNote = " Password updated successfully.";
              }
            } catch (pwErr) {
              console.warn("Password reset fallback failed:", pwErr);
              toast.error(
                `Profile saved, but password update failed: ${pwErr.message}`,
              );
              setSubmitting(false);
              return;
            }
          }
        }

        if (refreshProfile) {
          try {
            await refreshProfile();
          } catch {}
        }

        toast.success(
          `Your profile details have been updated successfully!${pwFeedbackNote}`,
        );
        resetForm();
        setOpenEditProfileModal(false);
      } catch (err) {
        console.error("Update profile error:", err);
        toast.error(err.message || "Failed to update profile details.");
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
      dressSize: selectedMeasureForEdit?.dressSize || "",
      notes: selectedMeasureForEdit?.notes || "",
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
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
          updatePayload,
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
              : m,
          ),
        );

        toast.success(
          `Measurement profile "${values.title.trim()}" updated successfully!`,
        );
        setOpenEditMeasureModal(false);
        setSelectedMeasureForEdit(null);
      } catch (err) {
        console.error("Update measurement error:", err);
        toast.error(err.message || "Failed to update measurement profile.");
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
      await deleteClientMeasurement(measurementId);
      setMeasurements((prev) => prev.filter((m) => m.id !== measurementId));
      toast.success(
        `Measurement profile "${title || "Profile"}" deleted successfully.`,
      );
      setMeasureToDelete(null);
    } catch (err) {
      console.error("Delete measurement error:", err);
      toast.error("Failed to delete measurement profile.");
    } finally {
      setDeletingMeasureId(null);
    }
  };

  if (authLoading && !currentUser && !userProfile) {
    return (
      <div className="my-profile-page__full-loading">
        <AppSpinner size="lg" color="gold" />
        <span className="loading-text">Loading profile...</span>
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
            Manage your personal profile details and custom saree pleating
            measurements
          </p>
        </div>

        <div className="header-actions">
          <AppButton
            variant="secondary"
            className="refresh-btn"
            startIcon={
              <RefreshOutlinedIcon
                className={loading || loadingOrders ? "spin-icon" : ""}
              />
            }
            onClick={handleRefreshAll}
            disabled={loading || loadingOrders}
          >
            {loading || loadingOrders ? "Refreshing..." : "Refresh"}
          </AppButton>

          {activeTab === "orders" ? (
            <AppButton
              variant="primary"
              className="primary-action-btn"
              startIcon={<DryCleaningOutlinedIcon />}
              onClick={() => setOpenCreateOrderModal(true)}
            >
              Create Order
            </AppButton>
          ) : (
            <AppButton
              variant="primary"
              className="primary-action-btn"
              startIcon={<SquareFootOutlinedIcon />}
              onClick={() => setOpenAddMeasureModal(true)}
            >
              Add Measurement
            </AppButton>
          )}
        </div>
      </div>

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
                <span>{roleLabel || "Client"}</span>
              </div>
            </div>
          </div>

          <div
            className="hero-action-buttons"
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <AppButton
              variant="primary"
              size="sm"
              className="create-order-hero-btn"
              startIcon={<DryCleaningOutlinedIcon />}
              onClick={() => setOpenCreateOrderModal(true)}
            >
              Create Order
            </AppButton>

            <AppButton
              variant="secondary"
              size="sm"
              className="edit-profile-btn"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setOpenEditProfileModal(true)}
            >
              Edit My Details
            </AppButton>
          </div>
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

      {/* Tab Navigation: Orders vs Measurements vs Appearance */}
      <div className="my-profile-page__tabs-bar">
        <AppTabs
          tabs={[
            {
              value: "orders",
              label: `My Orders (${orders.length})`,
              icon: <ReceiptLongOutlinedIcon style={{ fontSize: 18 }} />,
            },
            {
              value: "measurements",
              label: `My Measurements (${measurements.length})`,
              icon: <StraightenOutlinedIcon style={{ fontSize: 18 }} />,
            },
            // {
            //   value: "appearance",
            //   label: "Appearance & Theme",
            //   icon: <PaletteOutlinedIcon style={{ fontSize: 18 }} />,
            // },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
        />
      </div>

      {/* Orders Tab Pane */}
      {activeTab === "orders" && (
        <div className="profile-orders-section">
          <div className="section-title-bar">
            <h3 className="section-title">
              <ReceiptLongOutlinedIcon />
              My Orders & Bookings
            </h3>
            <span className="count-chip">
              {orders.length} {orders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>

          {loadingOrders ? (
            <div className="my-profile-page__loading">
              <AppSpinner size="lg" color="gold" />
              <span className="loading-text">Loading your orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-measurements-card empty-orders-card">
              <ReceiptLongOutlinedIcon className="empty-icon" />
              <h4 className="empty-title">No Orders Placed Yet</h4>
              <p className="empty-desc">
                You haven't placed any saree pre-pleating, draping, or box
                folding orders yet. Book your first order with your tailored
                measurements!
              </p>
              <AppButton
                variant="primary"
                className="primary-action-btn"
                startIcon={<DryCleaningOutlinedIcon />}
                onClick={() => setOpenCreateOrderModal(true)}
              >
                Book Saree Pre-Pleating
              </AppButton>
            </div>
          ) : (
            <div className="profile-orders-grid">
              {orders.map((order) => {
                const items = getOrderItems(order);
                const statusVal =
                  order.status || order.orderStatus || "in-progress";
                const paymentVal = order.paymentStatus || "paid";
                const fabricSummary = getOrderFabricSummary(order);
                const totalAmountStr = getOrderTotalAmount(order);

                return (
                  <div key={order.id} className="profile-order-card">
                    <div className="profile-order-card__header">
                      <div className="order-id-badge-wrap">
                        <span className="order-id-pill">{order.id}</span>
                      </div>

                      <div className="order-badges-wrap">
                        <span className={`status-pill ${statusVal}`}>
                          <span className="dot" />
                          {statusVal.replace("-", " ")}
                        </span>
                        <span className={`payment-pill ${paymentVal}`}>
                          <PaymentOutlinedIcon
                            style={{ fontSize: 12, marginRight: 4 }}
                          />
                          {paymentVal}
                        </span>
                      </div>
                    </div>

                    <div className="profile-order-card__body">
                      <div className="order-main-info">
                        <div className="service-title-wrap">
                          <h4 className="service-headline">
                            {items.length > 1
                              ? `${items.length} Services Booked`
                              : items[0]?.serviceName || "Saree Pre-Pleating"}
                          </h4>
                          {order.occasion && (
                            <span
                              className="order-occasion-chip"
                              title={order.occasion}
                            >
                              <CelebrationOutlinedIcon
                                style={{ fontSize: 13, marginRight: 4 }}
                              />
                              {order.occasion}
                            </span>
                          )}
                        </div>
                      </div>

                      {items.length > 1 && (
                        <div className="items-mini-chips">
                          {items.map((it, idx) => (
                            <span key={it.id || idx} className="item-mini-chip">
                              <DryCleaningOutlinedIcon
                                style={{ fontSize: 12, marginRight: 4 }}
                              />
                              {it.serviceName} — ₹{it.finalPrice || 0}
                            </span>
                          ))}
                        </div>
                      )}

                      {order.notes && (
                        <p className="order-notes-snippet">{order.notes}</p>
                      )}

                      <div className="order-dates-grid">
                        <div className="date-tile">
                          <span className="date-label">Booked On</span>
                          <span className="date-value">
                            <CalendarTodayOutlinedIcon
                              style={{ fontSize: 13, marginRight: 4 }}
                            />
                            {formatDateSafe(
                              order.createdAt || order.orderDate || order.date,
                            )}
                          </span>
                        </div>
                        <div className="date-tile">
                          <span className="date-label">Target Delivery</span>
                          <span className="date-value date-value--delivery">
                            <CalendarTodayOutlinedIcon
                              style={{ fontSize: 13, marginRight: 4 }}
                            />
                            {order.deliveryDate
                              ? formatDateSafe(order.deliveryDate)
                              : "Standard"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-order-card__footer">
                      <div className="order-amount-wrap">
                        <span className="amount-label">Total Amount</span>
                        <span className="amount-val">{totalAmountStr}</span>
                      </div>

                      <AppButton
                        size="sm"
                        variant="secondary"
                        className="view-order-details-btn"
                        startIcon={
                          <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                        }
                        onClick={() => setOrderForView(order)}
                      >
                        View Details
                      </AppButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Measurements Tab Pane */}
      {activeTab === "measurements" && (
        <div className="profile-measurements-section">
          <div className="section-title-bar">
            <h3 className="section-title">
              <StraightenOutlinedIcon />
              My Saree Pleating Measurements
            </h3>
            <span className="count-chip">
              {measurements.length}{" "}
              {measurements.length === 1 ? "Measurement" : "Measurements"}
            </span>
          </div>

          {loading ? (
            <div className="my-profile-page__loading">
              <AppSpinner size="lg" color="gold" />
              <span className="loading-text">
                Loading measurement profiles...
              </span>
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
                className="primary-action-btn"
                startIcon={<SquareFootOutlinedIcon />}
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
                        className="action-edit-btn"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => {
                          setSelectedMeasureForEdit(measure);
                          setOpenEditMeasureModal(true);
                        }}
                      >
                        Edit
                      </AppButton>

                      <AppButton
                        size="sm"
                        variant="danger"
                        square
                        className="action-delete-btn"
                        onClick={() => setMeasureToDelete(measure)}
                        title="Delete Measurement Profile"
                      >
                        <DeleteOutlineIcon style={{ fontSize: 16 }} />
                      </AppButton>
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
                        <span className="notes-label">
                          Tailoring & Draping Notes
                        </span>
                        <p className="notes-content">{measure.notes}</p>
                      </div>
                    )}

                    <div className="measure-card-footer">
                      <span className="measure-footer-date">
                        <CalendarTodayOutlinedIcon />
                        Recorded{" "}
                        {formatDateSafe(
                          measure.rawCreatedAt || measure.createdAt,
                        )}
                        {formatTimeSafe(
                          measure.rawCreatedAt || measure.createdAt,
                        )
                          ? ` ${formatTimeSafe(measure.rawCreatedAt || measure.createdAt)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appearance & Theme Preferences Tab Pane */}
      {/* {activeTab === "appearance" && (
        <div className="profile-appearance-section">
          <div className="section-title-bar">
            <h3 className="section-title">
              <PaletteOutlinedIcon />
              Appearance & Theme Preferences
            </h3>
            <span className="count-chip">3 Modes Available</span>
          </div>

          <div className="appearance-card">
            <div className="appearance-card__header">
              <h4 className="appearance-title">Choose Application Theme</h4>
              <p className="appearance-subtitle">
                Select your preferred visual style across the entire
                application. Your choice is instantly applied across all
                dashboards, tables, dialogs, and controls, and saved to your
                device.
              </p>
            </div>

            <div className="appearance-tiles-wrapper">
              <ThemeToggle variant="tiles" />
            </div>
          </div>
        </div>
      )} */}

      {/* ========================================================================= */}
      {/* 1. Modal: Edit Profile Dialog                                             */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditProfileModal}
        onClose={() =>
          !editProfileFormik.isSubmitting && setOpenEditProfileModal(false)
        }
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
              editProfileFormik.touched.email && editProfileFormik.errors.email
            }
            disabled={editProfileFormik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Address"
            multiline
            rows={3}
            id="profile-address"
            name="userAddress"
            placeholder="Enter your address"
            value={editProfileFormik.values.userAddress}
            onChange={editProfileFormik.handleChange}
            onBlur={editProfileFormik.handleBlur}
            error={
              editProfileFormik.touched.userAddress &&
              editProfileFormik.errors.userAddress
            }
            disabled={editProfileFormik.isSubmitting}
          />

          {canChangePassword && (
            <AppInput
              label="Change Password (Optional)"
              id="profile-newPassword"
              name="newPassword"
              type="password"
              placeholder="Leave blank to keep current password"
              value={editProfileFormik.values.newPassword}
              onChange={editProfileFormik.handleChange}
              onBlur={editProfileFormik.handleBlur}
              error={
                editProfileFormik.touched.newPassword &&
                editProfileFormik.errors.newPassword
              }
              disabled={editProfileFormik.isSubmitting}
              helperText="Enter a new password (min 6 characters) to update. Leave blank to keep existing password."
              startAdornment={<LockOutlinedIcon />}
            />
          )}
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
            clientName: displayName,
            clientMobile: displayMobile,
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
          const saved = await createClientMeasurement(measurementPayload);
          const now = new Date();
          const nowIso = now.toISOString();
          const savedRecord = {
            ...saved,
            createdAt: saved?.createdAt || nowIso,
            rawCreatedAt: saved?.rawCreatedAt || now,
          };
          setMeasurements((prev) => [savedRecord, ...prev]);
          toast.success(
            `Measurement profile "${values.title.trim()}" added successfully!`,
          );
        }}
      />

      {/* ========================================================================= */}
      {/* 3. Modal: Edit Measurement Profile Dialog                                 */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditMeasureModal}
        onClose={() =>
          !editMeasureFormik.isSubmitting && setOpenEditMeasureModal(false)
        }
        title="Edit Measurement Profile"
        subtitle={
          selectedMeasureForEdit?.title || "Modify pleat and sizing parameters"
        }
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

          <div className="measurement-modal-grid">
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
              placeholder="Select Size"
              value={editMeasureFormik.values.dressSize}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.dressSize &&
                editMeasureFormik.errors.dressSize
              }
              disabled={editMeasureFormik.isSubmitting}
            >
              <option value="">Select Size</option>
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
              editMeasureFormik.touched.notes && editMeasureFormik.errors.notes
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
        <p
          style={{
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            margin: "8px 0",
          }}
        >
          Are you sure you want to delete the measurement profile{" "}
          <strong style={{ color: "var(--color-gold)" }}>
            "{measureToDelete?.title}"
          </strong>
          ? This action cannot be undone.
        </p>
      </AppModal>

      {/* ========================================================================= */}
      {/* 5. Modal: Order Details Modal                                             */}
      {/* ========================================================================= */}
      {/* 5. Modal: Order Details Modal (Client View: Read-Only)                     */}
      {/* ========================================================================= */}
      <OrderDetailsModal
        open={Boolean(orderForView)}
        onClose={() => setOrderForView(null)}
        order={orderForView}
        readOnly={true}
        onStatusUpdated={fetchMyOrders}
        onOrderUpdated={fetchMyOrders}
      />

      {/* ========================================================================= */}
      {/* 6. Modal: Create Order Modal (Client Mode - Strict Data Isolation)       */}
      {/* ========================================================================= */}
      <CreateOrderModal
        open={openCreateOrderModal}
        onClose={() => setOpenCreateOrderModal(false)}
        onOrderCreated={(newOrder) => {
          fetchMyOrders();
          fetchMyMeasurements();
          setActiveTab("orders");
        }}
        clientMode={true}
        initialClient={{
          id: currentUid,
          username: displayName,
          userMobile: displayMobile
            ? displayMobile.replace(/\D/g, "").slice(-10)
            : "",
          email: displayEmail,
          userAddress: displayAddress,
          role: USER_ROLES.CLIENT,
        }}
        initialMeasurements={measurements}
      />
    </div>
  );
};

export default MyProfile;
