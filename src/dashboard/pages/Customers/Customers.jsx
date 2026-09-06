import React, { useState, useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import StatCard from "../../components/StatCard/StatCard";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllUsers,
  createUser,
  updateUser,
  getLocalUsers,
  getAllMeasurements,
  createCustomerMeasurement,
  updateMeasurement,
  deleteCustomerMeasurement,
  checkUserUniqueness,
  formatDateSafe,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import {
  AppButton,
  AppInput,
  AppModal,
  AppBadge,
  AppTabs,
  AppSpinner,
} from "../../../components/common";
import "./Customers.scss";

// Validation schema for creating or editing a customer
const customerValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("Customer Name is required"),
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
    .max(150, "Address cannot exceed 150 characters"),
});

const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];

// Validation schema for adding/editing a measurement profile with strict validation
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

const Customers = () => {
  const { currentUser, userProfile, role, isSuperAdmin, canEdit, canDelete } =
    useAuth();
  const userRole = (role || "").toLowerCase();
  const isCustomer =
    !isSuperAdmin &&
    (userRole === USER_ROLES.CUSTOMER ||
      userRole === "customer" ||
      userRole === "");
  const userCanEdit =
    canEdit ??
    (isSuperAdmin ||
      userRole === USER_ROLES.ADMIN ||
      userRole === USER_ROLES.SUPERADMIN);
  const userCanDelete =
    canDelete ??
    (isSuperAdmin ||
      userRole === USER_ROLES.ADMIN ||
      userRole === USER_ROLES.SUPERADMIN);

  // If customer accesses Customers screen, redirect to /dashboard
  if (isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  const [customers, setCustomers] = useState([]);
  const [measurementsMap, setMeasurementsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  // Modal Dialog states
  const [dialogOpen, setDialogOpen] = useState(false); // Add Customer Modal
  const [openEditModal, setOpenEditModal] = useState(false); // Edit Customer Modal
  const [openAddMeasureModal, setOpenAddMeasureModal] = useState(false); // Add Measurement Modal
  const [openViewDetailsModal, setOpenViewDetailsModal] = useState(false); // View Customer Details Modal
  const [openEditMeasureModal, setOpenEditMeasureModal] = useState(false); // Edit Measurement Modal

  // Active items in modals
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForMeasure, setCustomerForMeasure] = useState(null);
  const [customerForView, setCustomerForView] = useState(null);
  const [selectedMeasureForEdit, setSelectedMeasureForEdit] = useState(null);
  const [deletingMeasureId, setDeletingMeasureId] = useState(null);
  const [measureToDelete, setMeasureToDelete] = useState(null);

  // Fetch only Customer details and their measurements
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let records = await getAllUsers();
      if (!records || records.length === 0) {
        records = getLocalUsers();
      }

      const allMeasures = await getAllMeasurements();
      const mMap = {};
      allMeasures.forEach((m) => {
        if (m.userId) {
          if (!mMap[m.userId]) mMap[m.userId] = [];
          mMap[m.userId].push(m);
        }
      });
      setMeasurementsMap(mMap);

      if (records && records.length > 0) {
        const onlyCustomers = records
          .filter((u) => {
            const email = (u.email || "").toLowerCase().trim();
            if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
            const r = (u.role || "").toLowerCase();
            if (
              r === USER_ROLES.SUPERADMIN ||
              r === USER_ROLES.ADMIN ||
              r === USER_ROLES.STAFF
            ) {
              return false;
            }
            return true;
          })
          .map((u) => ({
            ...u,
            role: USER_ROLES.CUSTOMER,
            createdAt: formatDateSafe(u.createdAt),
          }));
        setCustomers(onlyCustomers);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.warn("Error fetching customers from Firebase:", err);
      const cached = getLocalUsers().filter((u) => {
        const email = (u.email || "").toLowerCase().trim();
        if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
        const r = (u.role || "").toLowerCase();
        return (
          r !== USER_ROLES.SUPERADMIN &&
          r !== USER_ROLES.ADMIN &&
          r !== USER_ROLES.STAFF
        );
      });
      setCustomers(cached || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentUser, userProfile, role]);

  // Handle opening Edit Modal
  const handleOpenEdit = (customer) => {
    if (!userCanEdit) return;
    setSelectedCustomer(customer);
    setOpenEditModal(true);
  };

  // Handle opening Add Measurement Modal
  const handleOpenAddMeasure = (customer) => {
    setCustomerForMeasure(customer);
    setOpenAddMeasureModal(true);
  };

  // Handle opening View Details Modal
  const handleOpenViewDetails = (customer) => {
    setCustomerForView(customer);
    setOpenViewDetailsModal(true);
  };

  // Edit Customer Formik
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: selectedCustomer?.username || "",
      userMobile: selectedCustomer?.userMobile || "",
      email: selectedCustomer?.email || "",
      userAddress: selectedCustomer?.userAddress || "",
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness excluding current selected customer
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
          excludeUserId: selectedCustomer?.id,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            editFormik.setFieldError("email", "This email address is already registered.");
            editFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            editFormik.setFieldError("userMobile", "This mobile number is already registered.");
            editFormik.setFieldTouched("userMobile", true, false);
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
          role: USER_ROLES.CUSTOMER,
        };

        const updatedDoc = await updateUser(selectedCustomer.id, updatePayload);

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomer.id ||
            (c.email && c.email.toLowerCase() === cleanEmail)
              ? { ...c, ...updatePayload, id: updatedDoc.id || c.id }
              : c
          )
        );

        if (customerForView && customerForView.id === selectedCustomer.id) {
          setCustomerForView((prev) => ({ ...prev, ...updatePayload }));
        }

        if (refreshProfile) {
          try {
            await refreshProfile();
          } catch {}
        }

        setFeedback({
          type: "success",
          message: `Customer "${values.username.trim()}" updated successfully!`,
        });
        setOpenEditModal(false);
      } catch (err) {
        console.error("Update customer error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to update customer.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Create Customer Formik
  const createFormik = useFormik({
    initialValues: {
      username: "",
      userMobile: "",
      email: "",
      userAddress: "",
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness before creating customer
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            createFormik.setFieldError("email", "This email address is already registered.");
            createFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            createFormik.setFieldError("userMobile", "This mobile number is already registered.");
            createFormik.setFieldTouched("userMobile", true, false);
          }
          setFeedback({
            type: "error",
            message: uniqueness.message,
          });
          setSubmitting(false);
          return;
        }

        const newCustomerData = {
          username: values.username.trim(),
          email: cleanEmail,
          userMobile: cleanMobile,
          userAddress: values.userAddress.trim(),
          role: USER_ROLES.CUSTOMER,
        };

        const created = await createUser(newCustomerData);
        setCustomers((prev) => [
          {
            ...newCustomerData,
            id: created.id,
            createdAt: formatDateSafe(new Date()),
          },
          ...prev,
        ]);

        setFeedback({
          type: "success",
          message: `Customer "${values.username.trim()}" registered successfully!`,
        });
        resetForm();
        setDialogOpen(false);
      } catch (err) {
        console.error("Customer registration error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to create customer record.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Add Measurement Formik
  const measureFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: customerForMeasure?.username
        ? `${customerForMeasure.username} Measurements`
        : "Standard Saree Pleats",
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
        const customerId = customerForMeasure?.id;
        if (!customerId)
          throw new Error("Customer ID is required to record measurements.");

        const measurementPayload = {
          userId: customerId,
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

        setMeasurementsMap((prev) => {
          const userList = prev[customerId] ? [...prev[customerId]] : [];
          return {
            ...prev,
            [customerId]: [saved, ...userList],
          };
        });

        setFeedback({
          type: "success",
          message: `Measurement profile "${values.title.trim()}" added successfully for ${
            customerForMeasure.username
          }!`,
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

  // Open Edit Measurement Modal
  const handleOpenEditMeasure = (measure) => {
    if (!userCanEdit) return;
    setSelectedMeasureForEdit(measure);
    setOpenEditMeasureModal(true);
  };

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
        const customerId = selectedMeasureForEdit.userId || customerForView?.id;

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

        setMeasurementsMap((prev) => {
          const userList = prev[customerId] ? [...prev[customerId]] : [];
          return {
            ...prev,
            [customerId]: userList.map((m) =>
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
            ),
          };
        });

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

  // Confirm and execute measurement deletion from custom popup
  const confirmDeleteMeasurement = async () => {
    if (!userCanDelete || !measureToDelete) return;
    const { id: measurementId, userId: customerId, title } = measureToDelete;
    setDeletingMeasureId(measurementId);
    try {
      await deleteCustomerMeasurement(measurementId);
      setMeasurementsMap((prev) => {
        const userList = (prev[customerId] || []).filter(
          (m) => m.id !== measurementId
        );
        return {
          ...prev,
          [customerId]: userList,
        };
      });
      setFeedback({
        type: "success",
        message: `Measurement profile "${
          title || "Profile"
        }" removed successfully.`,
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

  // Filtered customer list by search term and tabs
  const filteredCustomers = useMemo(() => {
    return customers.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (item.username || "").toLowerCase().includes(term) ||
        (item.email || "").toLowerCase().includes(term) ||
        (item.userMobile || "").includes(term) ||
        (item.userAddress || "").toLowerCase().includes(term);

      const hasMeasurements = (measurementsMap[item.id] || []).length > 0;
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "MEASURED" && hasMeasurements) ||
        (activeTab === "PENDING" && !hasMeasurements);

      return matchesSearch && matchesTab;
    });
  }, [customers, searchTerm, activeTab, measurementsMap]);

  // Metrics calculations
  const totalCustomersCount = customers.length;
  const customersWithMeasurements = useMemo(() => {
    return customers.filter((c) => (measurementsMap[c.id] || []).length > 0)
      .length;
  }, [customers, measurementsMap]);
  const pendingMeasurementsCount =
    totalCustomersCount - customersWithMeasurements;
  const totalMeasurementsCount = useMemo(() => {
    return Object.values(measurementsMap).reduce(
      (acc, list) => acc + (list?.length || 0),
      0
    );
  }, [measurementsMap]);

  const customerTabs = [
    { label: `All Customers (${customers.length})`, value: "ALL" },
    {
      label: `With Measurements (${customersWithMeasurements})`,
      value: "MEASURED",
    },
    { label: `Pending (${pendingMeasurementsCount})`, value: "PENDING" },
  ];

  return (
    <div className="customers-page">
      {/* Top Header matching Dashboard and Users */}
      <div className="customers-page__header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            View customer profiles, contact info, and manage tailoring
            measurements
          </p>
        </div>

        <div className="header-actions">
          <AppButton
            variant="secondary"
            size="md"
            startIcon={<RefreshOutlinedIcon />}
            onClick={fetchCustomers}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </AppButton>

          <AppButton
            variant="primary"
            size="md"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => {
              setFeedback(null);
              setDialogOpen(true);
            }}
            className="create-customer-btn"
          >
            Add Customer
          </AppButton>
        </div>
      </div>

      {/* Global Alert Feedback */}
      {feedback && (
        <div
          className={`customers-feedback-alert customers-feedback-alert--${feedback.type}`}
        >
          {feedback.type === "success" ? (
            <CheckCircleOutlineIcon fontSize="small" />
          ) : (
            <ErrorOutlineIcon fontSize="small" />
          )}
          <span style={{ flex: 1 }}>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 StatCards matching Dashboard Overview Grid */}
      <div className="customers-page__stats-grid">
        <StatCard
          title="Customers"
          value={String(totalCustomersCount)}
          change="All Registered Clients"
          trendType="completed"
          icon={<PeopleOutlineIcon />}
        />
        <StatCard
          title="With Measurements"
          value={String(customersWithMeasurements)}
          change={
            totalCustomersCount > 0
              ? `${Math.round(
                  (customersWithMeasurements / totalCustomersCount) * 100
                )}% Profile Rate`
              : "0%"
          }
          trendType="up"
          icon={<StraightenOutlinedIcon />}
        />
        <StatCard
          title="Measurement Records"
          value={String(totalMeasurementsCount)}
          change="Multi-profile Records"
          trendType="completed"
          icon={<SquareFootOutlinedIcon />}
        />
        <StatCard
          title="Pending Profiles"
          value={String(pendingMeasurementsCount)}
          change="Awaiting Measurements"
          trendType={pendingMeasurementsCount > 0 ? "progress" : "completed"}
          icon={<StraightenOutlinedIcon />}
        />
      </div>

      {/* Filter Tabs & Search Bar matching Manage Users Toolbar */}
      <div className="customers-page__toolbar">
        <AppTabs
          tabs={customerTabs}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
        />

        <div className="customers-search-field">
          <AppInput
            placeholder="Search by name, mobile, email, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="customers-table-card">
        <div className="table-responsive">
          <table className="customers-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>CONTACT DETAILS</th>
                <th>DELIVERY ADDRESS</th>
                <th style={{ textAlign: "center" }}>MEASUREMENTS</th>
                <th>JOINED DATE</th>
                <th style={{ textAlign: "right", minWidth: 140 }}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading && customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "48px 16px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <AppSpinner size="lg" color="gold" />
                      <span style={{ color: "#e6d8a3", fontSize: "0.9rem" }}>
                        Loading customer directory...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-cell">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <PeopleOutlineIcon
                        style={{ fontSize: 44, color: "#d4af37", opacity: 0.5 }}
                      />
                      <span
                        style={{
                          color: "#e6d8a3",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        No customers found matching your criteria.
                      </span>
                      <span
                        style={{
                          color: "rgba(230, 216, 163, 0.6)",
                          fontSize: "0.8rem",
                        }}
                      >
                        Click "Add Customer" to create the first client profile.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((user) => {
                  const initial = (
                    user.username?.charAt(0) ||
                    user.email?.charAt(0) ||
                    "C"
                  ).toUpperCase();
                  const userMeasures = measurementsMap[user.id] || [];
                  const measureCount = userMeasures.length;

                  return (
                    <tr key={user.id} className="customer-table-row">
                      {/* Customer Avatar & Name */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div className="user-avatar-circle">{initial}</div>
                          <div>
                            <div className="user-name-text">
                              {user.username || "Customer"}
                            </div>
                            <div className="user-email-text">
                              {user.email || "No email registered"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="mobile-cell">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <PhoneIphoneOutlinedIcon
                            style={{ fontSize: 16, color: "#d4af37" }}
                          />
                          <span style={{ fontFamily: "monospace" }}>
                            {user.userMobile || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="address-cell">
                        {user.userAddress || "—"}
                      </td>

                      {/* Saree Measurement Status */}
                      <td style={{ textAlign: "center" }}>
                        {measureCount > 0 ? (
                          <span
                            onClick={() => handleOpenViewDetails(user)}
                            style={{ cursor: "pointer" }}
                            title="View Measurements"
                          >
                            <AppBadge variant="completed">
                              ✓ {measureCount} Profile
                              {measureCount > 1 ? "s" : ""}
                            </AppBadge>
                          </span>
                        ) : (
                          <span
                            onClick={() => handleOpenAddMeasure(user)}
                            style={{ cursor: "pointer" }}
                            title="Add Measurement"
                          >
                            <AppBadge variant="pending">
                              + Add Measurements
                            </AppBadge>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="date-cell">
                        {formatDateSafe(user.createdAt)}
                      </td>

                      {/* Row Action Buttons */}
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="action-btns">
                          {/* 1. View Details Button */}
                          <AppButton
                            variant="secondary"
                            size="sm"
                            title="View Customer Profile & Measurements"
                            onClick={() => handleOpenViewDetails(user)}
                          >
                            <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>

                          {/* 2. Add Measurement Shortcut */}
                          <AppButton
                            variant="secondary"
                            size="sm"
                            title="Add Measurement Profile"
                            onClick={() => handleOpenAddMeasure(user)}
                          >
                            <StraightenOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>

                          {/* 3. Edit Customer Info */}
                          {userCanEdit && (
                            <AppButton
                              variant="secondary"
                              size="sm"
                              title="Edit Customer Info"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <EditOutlinedIcon style={{ fontSize: 16 }} />
                            </AppButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Modal: Add New Customer Dialog                                         */}
      {/* ========================================================================= */}
      <AppModal
        open={dialogOpen}
        onClose={() => !createFormik.isSubmitting && setDialogOpen(false)}
        title="Register New Customer"
        subtitle="Enter customer contact details below."
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              disabled={createFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={createFormik.handleSubmit}
              loading={createFormik.isSubmitting}
            >
              Add Customer
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={createFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Customer Full Name"
            required
            id="create-username"
            name="username"
            placeholder="e.g. Sravanti Reddy"
            value={createFormik.values.username}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={
              createFormik.touched.username && createFormik.errors.username
            }
            disabled={createFormik.isSubmitting}
            startAdornment={<PersonOutlineIcon />}
          />

          <AppInput
            label="10-Digit Mobile Number"
            required
            id="create-userMobile"
            name="userMobile"
            placeholder="e.g. 9848012345"
            value={createFormik.values.userMobile}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={
              createFormik.touched.userMobile && createFormik.errors.userMobile
            }
            disabled={createFormik.isSubmitting}
            startAdornment={<PhoneIphoneOutlinedIcon />}
          />

          <AppInput
            label="Email Address"
            required
            id="create-email"
            name="email"
            type="email"
            placeholder="e.g. sravanti@example.com"
            value={createFormik.values.email}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={createFormik.touched.email && createFormik.errors.email}
            disabled={createFormik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Delivery Address / City (Optional)"
            id="create-userAddress"
            name="userAddress"
            placeholder="e.g. Jubilee Hills, Hyderabad"
            value={createFormik.values.userAddress}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={
              createFormik.touched.userAddress &&
              createFormik.errors.userAddress
            }
            disabled={createFormik.isSubmitting}
            startAdornment={<LocationOnOutlinedIcon />}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 2. Modal: Edit Customer Dialog                                            */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        title="Edit Customer Profile"
        subtitle="Update contact and location information."
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setOpenEditModal(false)}
              disabled={editFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={editFormik.handleSubmit}
              loading={editFormik.isSubmitting}
            >
              Save Changes
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={editFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Customer Full Name"
            required
            id="edit-username"
            name="username"
            value={editFormik.values.username}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={editFormik.touched.username && editFormik.errors.username}
            disabled={editFormik.isSubmitting}
            startAdornment={<PersonOutlineIcon />}
          />

          <AppInput
            label="10-Digit Mobile Number"
            required
            id="edit-userMobile"
            name="userMobile"
            value={editFormik.values.userMobile}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.userMobile && editFormik.errors.userMobile
            }
            disabled={editFormik.isSubmitting}
            startAdornment={<PhoneIphoneOutlinedIcon />}
          />

          <AppInput
            label="Email Address"
            required
            id="edit-email"
            name="email"
            type="email"
            value={editFormik.values.email}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={editFormik.touched.email && editFormik.errors.email}
            disabled={editFormik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Delivery Address / City"
            id="edit-userAddress"
            name="userAddress"
            value={editFormik.values.userAddress}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.userAddress && editFormik.errors.userAddress
            }
            disabled={editFormik.isSubmitting}
            startAdornment={<LocationOnOutlinedIcon />}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 3. Modal: View Customer Details & Measurement Profiles                    */}
      {/* ========================================================================= */}
      <AppModal
        open={openViewDetailsModal}
        onClose={() => setOpenViewDetailsModal(false)}
        title={customerForView?.username || "Customer Profile"}
        subtitle="Customer contact info & tailored saree measurement specifications"
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => {
                setOpenViewDetailsModal(false);
                handleOpenAddMeasure(customerForView);
              }}
              startIcon={<StraightenOutlinedIcon />}
            >
              Add New Measurement Profile
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => setOpenViewDetailsModal(false)}
            >
              Close
            </AppButton>
          </>
        }
      >
        {customerForView && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Customer Summary Card */}
            <div className="details-summary-card">
              <div className="summary-item">
                <PhoneIphoneOutlinedIcon
                  style={{ fontSize: 20, color: "#d4af37" }}
                />
                <div>
                  <div className="item-label">Phone</div>
                  <div className="item-value">
                    {customerForView.userMobile || "—"}
                  </div>
                </div>
              </div>

              <div className="summary-item">
                <EmailOutlinedIcon style={{ fontSize: 20, color: "#d4af37" }} />
                <div>
                  <div className="item-label">Email</div>
                  <div className="item-value">
                    {customerForView.email || "—"}
                  </div>
                </div>
              </div>

              <div className="summary-item">
                <LocationOnOutlinedIcon
                  style={{ fontSize: 20, color: "#d4af37" }}
                />
                <div>
                  <div className="item-label">Address</div>
                  <div className="item-value">
                    {customerForView.userAddress || "—"}
                  </div>
                </div>
              </div>

              <div className="summary-item">
                <CalendarTodayOutlinedIcon
                  style={{ fontSize: 20, color: "#d4af37" }}
                />
                <div>
                  <div className="item-label">Joined</div>
                  <div className="item-value">
                    {formatDateSafe(customerForView.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Profiles Title */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "#e6d8a3",
                  fontSize: "0.95rem",
                }}
              >
                Saree Measurement Profiles (
                {measurementsMap[customerForView.id]?.length || 0})
              </span>
            </div>

            {/* List of Measurement Cards */}
            {!measurementsMap[customerForView.id] ||
            measurementsMap[customerForView.id].length === 0 ? (
              <div className="empty-measurements-box">
                <StraightenOutlinedIcon
                  style={{
                    fontSize: 36,
                    color: "#d4af37",
                    opacity: 0.5,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    color: "#e6d8a3",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  No saree measurements recorded for this customer yet.
                </div>
                <p
                  style={{
                    color: "rgba(230, 216, 163, 0.6)",
                    fontSize: "0.8rem",
                    marginTop: 4,
                    marginBottom: 12,
                  }}
                >
                  Add a measurement profile so pre-pleating orders can be
                  tailored to exact body fit.
                </p>
                <AppButton
                  variant="primary"
                  size="sm"
                  startIcon={<StraightenOutlinedIcon />}
                  onClick={() => {
                    setOpenViewDetailsModal(false);
                    handleOpenAddMeasure(customerForView);
                  }}
                >
                  Record Measurements Now
                </AppButton>
              </div>
            ) : (
              <div className="measurements-list-container">
                {measurementsMap[customerForView.id].map((measure, idx) => (
                  <div key={measure.id || idx} className="measurement-card">
                    <div className="measure-card-header">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span className="measure-profile-title">
                          {measure.title || `Measurement Profile #${idx + 1}`}
                        </span>
                        {measure.dressSize && (
                          <AppBadge variant="neutral">
                            Size: {measure.dressSize}
                          </AppBadge>
                        )}
                      </div>

                      <div className="measure-actions">
                        <span className="measure-date">
                          {measure.createdAt
                            ? formatDateSafe(measure.createdAt)
                            : ""}
                        </span>

                        {userCanEdit && (
                          <button
                            type="button"
                            className="measure-action-btn measure-action-btn--edit"
                            title="Edit Measurement"
                            onClick={() => handleOpenEditMeasure(measure)}
                          >
                            <EditOutlinedIcon style={{ fontSize: 16 }} />
                          </button>
                        )}

                        {userCanDelete && (
                          <button
                            type="button"
                            className="measure-action-btn measure-action-btn--delete"
                            title="Delete Measurement"
                            onClick={() =>
                              setMeasureToDelete({
                                id: measure.id,
                                userId: customerForView.id,
                                title: measure.title,
                              })
                            }
                          >
                            <DeleteOutlineIcon style={{ fontSize: 16 }} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="measure-dimensions-grid">
                      <div className="dim-item">
                        <span className="dim-label">Pallu Length</span>
                        <span className="dim-value">
                          {measure.pallu ? `${measure.pallu}"` : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Shoulder to Tight</span>
                        <span className="dim-value">
                          {measure.shoulderToRightTight
                            ? `${measure.shoulderToRightTight}"`
                            : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Chest Size</span>
                        <span className="dim-value">
                          {measure.chest ? `${measure.chest}"` : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Hip Size</span>
                        <span className="dim-value">
                          {measure.hip ? `${measure.hip}"` : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">First Pleat Width</span>
                        <span className="dim-value">
                          {measure.firstPleatSize
                            ? `${measure.firstPleatSize}"`
                            : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Chest Pleats</span>
                        <span className="dim-value">
                          {measure.noOfChestPleats || "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Customer Height</span>
                        <span className="dim-value">
                          {measure.height ? `${measure.height}` : "—"}
                        </span>
                      </div>

                      <div className="dim-item">
                        <span className="dim-label">Dress Size</span>
                        <span className="dim-value">
                          {measure.dressSize || "—"}
                        </span>
                      </div>
                    </div>

                    {measure.notes && (
                      <div className="measure-notes-row">
                        <NotesOutlinedIcon
                          style={{
                            fontSize: 16,
                            color: "#d4af37",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <span className="measure-notes-text">
                          <strong>Notes:</strong> {measure.notes}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* ========================================================================= */}
      {/* 4. Modal: Add Measurement Profile Dialog                                  */}
      {/* ========================================================================= */}
      <AppModal
        open={openAddMeasureModal}
        onClose={() =>
          !measureFormik.isSubmitting && setOpenAddMeasureModal(false)
        }
        title="Add Saree Measurement Profile"
        subtitle={`Recording measurements for ${
          customerForMeasure?.username || "Customer"
        }`}
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setOpenAddMeasureModal(false)}
              disabled={measureFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={measureFormik.handleSubmit}
              loading={measureFormik.isSubmitting}
            >
              Save Measurements
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={measureFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Measurement Profile Title (e.g. Bridal Silk Saree)"
            required
            id="measure-title"
            name="title"
            placeholder="e.g. Kanjeevaram Saree / Reception Saree"
            value={measureFormik.values.title}
            onChange={measureFormik.handleChange}
            onBlur={measureFormik.handleBlur}
            error={measureFormik.touched.title && measureFormik.errors.title}
            disabled={measureFormik.isSubmitting}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <AppInput
              label="Pallu Length (inches)"
              id="measure-pallu"
              name="pallu"
              placeholder="e.g. 38"
              value={measureFormik.values.pallu}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={measureFormik.touched.pallu && measureFormik.errors.pallu}
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="Shoulder to Tight (in)"
              id="measure-shoulder"
              name="shoulderToRightTight"
              placeholder="e.g. 14"
              value={measureFormik.values.shoulderToRightTight}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={
                measureFormik.touched.shoulderToRightTight &&
                measureFormik.errors.shoulderToRightTight
              }
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="Chest (inches)"
              id="measure-chest"
              name="chest"
              placeholder="e.g. 36"
              value={measureFormik.values.chest}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={measureFormik.touched.chest && measureFormik.errors.chest}
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="Hip (inches)"
              id="measure-hip"
              name="hip"
              placeholder="e.g. 40"
              value={measureFormik.values.hip}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={measureFormik.touched.hip && measureFormik.errors.hip}
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="First Pleat Size (in)"
              id="measure-firstPleat"
              name="firstPleatSize"
              placeholder="e.g. 5.5"
              value={measureFormik.values.firstPleatSize}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={
                measureFormik.touched.firstPleatSize &&
                measureFormik.errors.firstPleatSize
              }
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="Chest Pleats (count)"
              id="measure-noOfChestPleats"
              name="noOfChestPleats"
              placeholder="e.g. 5"
              value={measureFormik.values.noOfChestPleats}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={
                measureFormik.touched.noOfChestPleats &&
                measureFormik.errors.noOfChestPleats
              }
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              label="Height (cm / ft)"
              id="measure-height"
              name="height"
              placeholder="e.g. 160"
              value={measureFormik.values.height}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={
                measureFormik.touched.height && measureFormik.errors.height
              }
              disabled={measureFormik.isSubmitting}
            />

            <AppInput
              select
              label="Dress Size"
              id="measure-dressSize"
              name="dressSize"
              value={measureFormik.values.dressSize}
              onChange={measureFormik.handleChange}
              onBlur={measureFormik.handleBlur}
              error={
                measureFormik.touched.dressSize &&
                measureFormik.errors.dressSize
              }
              disabled={measureFormik.isSubmitting}
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
            rows={2}
            label="Special Tailoring Notes (Optional)"
            id="measure-notes"
            name="notes"
            placeholder="e.g. Extra pins for heavy silk border, left-side drape..."
            value={measureFormik.values.notes}
            onChange={measureFormik.handleChange}
            onBlur={measureFormik.handleBlur}
            error={measureFormik.touched.notes && measureFormik.errors.notes}
            disabled={measureFormik.isSubmitting}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 5. Modal: Edit Measurement Profile Dialog                                 */}
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
            label="Profile Title"
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
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
            }}
          >
            <AppInput
              label="Pallu Length (inches)"
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
            />

            <AppInput
              label="Shoulder to Tight (in)"
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
            />

            <AppInput
              label="Chest (inches)"
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
            />

            <AppInput
              label="Hip (inches)"
              id="edit-measure-hip"
              name="hip"
              value={editMeasureFormik.values.hip}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.hip && editMeasureFormik.errors.hip
              }
              disabled={editMeasureFormik.isSubmitting}
            />

            <AppInput
              label="First Pleat Size (in)"
              id="edit-measure-firstPleat"
              name="firstPleatSize"
              value={editMeasureFormik.values.firstPleatSize}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.firstPleatSize &&
                editMeasureFormik.errors.firstPleatSize
              }
              disabled={editMeasureFormik.isSubmitting}
            />

            <AppInput
              label="Chest Pleats (count)"
              id="edit-measure-noOfChestPleats"
              name="noOfChestPleats"
              value={editMeasureFormik.values.noOfChestPleats}
              onChange={editMeasureFormik.handleChange}
              onBlur={editMeasureFormik.handleBlur}
              error={
                editMeasureFormik.touched.noOfChestPleats &&
                editMeasureFormik.errors.noOfChestPleats
              }
              disabled={editMeasureFormik.isSubmitting}
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
              label="Dress Size"
              id="edit-measure-dressSize"
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
            rows={2}
            label="Special Tailoring Notes"
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
      {/* 6. Modal: In-App Delete Confirmation Popup                                */}
      {/* ========================================================================= */}
      <AppModal
        open={Boolean(measureToDelete)}
        onClose={() => !deletingMeasureId && setMeasureToDelete(null)}
        title="Delete Measurement Profile"
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
            color: "#e6d8a3",
            fontSize: "0.95rem",
            marginBottom: 10,
            marginTop: 0,
          }}
        >
          Are you sure you want to remove measurement profile{" "}
          <strong style={{ color: "#d4af37" }}>
            "{measureToDelete?.title || "this profile"}"
          </strong>
          ?
        </p>
        <p
          style={{
            color: "rgba(230, 216, 163, 0.65)",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          This will permanently delete this tailoring specification.
        </p>
      </AppModal>
    </div>
  );
};

export default Customers;
