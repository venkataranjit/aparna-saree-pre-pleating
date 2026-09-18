import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
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
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import SquareFootOutlinedIcon from "@mui/icons-material/SquareFootOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StatCard from "../../components/StatCard/StatCard";
import CreateOrderModal from "../../components/CreateOrderModal/CreateOrderModal";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getLocalUsers,
  getAllMeasurements,
  createClientMeasurement,
  updateMeasurement,
  deleteClientMeasurement,
  checkUserUniqueness,
  formatDateSafe,
  formatModifiedDate,
  getTimestampMillis,
  getLatestItemTimestamp,
  createAuthUser,
  resetUserPassword,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
import { DateTimeCell } from "../../components/DateTimeCell/DateTimeCell";
import {
  AppButton,
  AppInput,
  AppModal,
  AppBadge,
  AppTabs,
  AppSpinner,
  AppTable,
  AppTableContainer,
  AppTableHead,
  AppTableBody,
  AppTableRow,
  AppTableCell,
  AppTableSortLabel,
  AppTablePagination,
  AppViewToggle,
} from "../../../components/common";
import "./Clients.scss";
import { MeasurementModal } from "../../components/MeasurementModal/MeasurementModal";

// Validation schema for creating or editing a client
const clientValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("Client Name is required"),
  notes: Yup.string().trim().max(500, "Notes cannot exceed 500 characters"),
  userMobile: Yup.string()
    .trim()
    .matches(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number",
    )
    .required("Mobile Number is required"),
  email: Yup.string().trim().email("Please enter a valid email address"),
  userAddress: Yup.string()
    .trim()
    .max(150, "Address cannot exceed 150 characters"),
});

const DRESS_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Custom"];

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
        return !Number.isNaN(num) && num > 0 && num <= 300;
      },
    ),
  shoulderToRightTight: Yup.string()
    .trim()
    .test(
      "is-valid-shoulder",
      "Shoulder to Right Tight must be a valid positive number (e.g. 14 or 14.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 300;
      },
    ),
  chest: Yup.string()
    .trim()
    .test(
      "is-valid-chest",
      "Chest must be a valid positive number (e.g. 36 or 36.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 300;
      },
    ),
  hip: Yup.string()
    .trim()
    .test(
      "is-valid-hip",
      "Hip must be a valid positive number (e.g. 40 or 40.5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 300;
      },
    ),
  firstPleatSize: Yup.string()
    .trim()
    .test(
      "is-valid-firstPleat",
      "First Pleat Size must be a valid positive number (e.g. 5.5 or 6)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 300;
      },
    ),
  noOfChestPleats: Yup.string()
    .trim()
    .test(
      "is-valid-noOfChestPleats",
      "Number of Chest Pleats must be a valid positive number (e.g. 4 or 5)",
      (val) => {
        if (!val) return true;
        const num = Number(val);
        return !Number.isNaN(num) && num > 0 && num <= 50;
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

const Clients = () => {
  const {
    currentUser,
    refreshProfile,
    userProfile,
    role,
    isSuperAdmin,
    canEdit,
    canDelete,
  } = useAuth();
  const userRole = (role || "").toLowerCase();
  const isClient =
    !isSuperAdmin &&
    (userRole === USER_ROLES.CLIENT ||
      userRole === "client" ||
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

  // If client accesses Clients screen, redirect to /dashboard
  if (isClient) {
    return <Navigate to="/dashboard" replace />;
  }

  const [clients, setClients] = useState([]);
  const [measurementsMap, setMeasurementsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");

  // Sorting and Pagination states
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(
        field === "createdAt" || field === "updatedAt" || field === "recent"
          ? "desc"
          : "asc",
      );
    }
    setPage(0);
  };

  // Expandable row state for "View More" (to view joined date, modified date, etc.)
  const [expandedClients, setExpandedClients] = useState(new Set());
  const toggleClientExpand = (id) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Modal Dialog states
  const [dialogOpen, setDialogOpen] = useState(false); // Add Client Modal
  const [openEditModal, setOpenEditModal] = useState(false); // Edit Client Modal
  const [openAddMeasureModal, setOpenAddMeasureModal] = useState(false); // Add Measurement Modal
  const [openViewDetailsModal, setOpenViewDetailsModal] = useState(false); // View Client Details Modal
  const [openEditMeasureModal, setOpenEditMeasureModal] = useState(false); // Edit Measurement Modal

  // Active items in modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientForMeasure, setClientForMeasure] = useState(null);
  const [clientForView, setClientForView] = useState(null);
  const [selectedMeasureForEdit, setSelectedMeasureForEdit] = useState(null);
  const [deletingMeasureId, setDeletingMeasureId] = useState(null);
  const [measureToDelete, setMeasureToDelete] = useState(null);
  const [orderForClient, setOrderForClient] = useState(null); // Create Order per client

  // Client Enable / Disable status modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [clientForStatusChange, setClientForStatusChange] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleOpenStatusModal = (client) => {
    setClientForStatusChange(client);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!clientForStatusChange) return;
    const isCurrentlyDisabled = Boolean(clientForStatusChange.disabled);
    const targetDisabledState = !isCurrentlyDisabled;
    setUpdatingStatus(true);
    try {
      await toggleUserStatus(clientForStatusChange.id, targetDisabledState);
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientForStatusChange.id
            ? { ...c, disabled: targetDisabledState }
            : c,
        ),
      );
      toast.success(
        `Client "${clientForStatusChange.username || "Client"}" has been ${
          targetDisabledState ? "disabled" : "enabled"
        } successfully!`,
      );
      setStatusModalOpen(false);
      setClientForStatusChange(null);
    } catch (err) {
      console.error("Error updating client status:", err);
      toast.error(
        "Failed to update client status: " +
          (err.message || "Please try again."),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  // Fetch only Client details and their measurements
  const fetchClients = async (isManualRefresh = false) => {
    setLoading(true);
    if (isManualRefresh) setRefreshing(true);
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
        const onlyClients = records
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
            role: USER_ROLES.CLIENT,
            disabled: Boolean(u.disabled),
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            rawCreatedAt: u.rawCreatedAt || u.createdAt,
            rawUpdatedAt: u.rawUpdatedAt || u.updatedAt,
          }));
        setClients(onlyClients);
      } else {
        setClients([]);
      }
      if (isManualRefresh) {
        toast.success("Clients directory refreshed from database.");
      }
    } catch (err) {
      console.warn("Error fetching clients from Firebase:", err);
      const cached = getLocalUsers()
        .filter((u) => {
          const email = (u.email || "").toLowerCase().trim();
          if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
          const r = (u.role || "").toLowerCase();
          return (
            r !== USER_ROLES.SUPERADMIN &&
            r !== USER_ROLES.ADMIN &&
            r !== USER_ROLES.STAFF
          );
        })
        .map((u) => ({
          ...u,
          role: USER_ROLES.CLIENT,
          disabled: Boolean(u.disabled),
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          rawCreatedAt: u.rawCreatedAt || u.createdAt,
          rawUpdatedAt: u.rawUpdatedAt || u.updatedAt,
        }));
      setClients(cached || []);
      if (isManualRefresh) {
        toast.error("Failed to refresh clients from database.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients(false);
  }, [currentUser, userProfile, role]);

  // Handle opening Edit Modal
  const handleOpenEdit = (client) => {
    if (!userCanEdit || client?.disabled) return;
    setSelectedClient(client);
    setOpenEditModal(true);
  };

  // Handle opening Add Measurement Modal
  const handleOpenAddMeasure = (client) => {
    if (client?.disabled) return;
    setClientForMeasure(client);
    setOpenAddMeasureModal(true);
  };

  // Handle opening View Details Modal
  const handleOpenViewDetails = (client) => {
    setClientForView(client);
    setOpenViewDetailsModal(true);
  };

  // Edit Client Formik
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: selectedClient?.username || "",
      notes: selectedClient?.notes || "",
      userMobile: selectedClient?.userMobile || "",
      email: selectedClient?.email || "",
      userAddress: selectedClient?.userAddress || "",
      newPassword: "",
    },
    validationSchema: clientValidationSchema.shape({
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .notRequired(),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness excluding current selected client
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
          excludeUserId: selectedClient?.id,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            editFormik.setFieldError(
              "email",
              "This email address is already registered.",
            );
            editFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            editFormik.setFieldError(
              "userMobile",
              "This mobile number is already registered.",
            );
            editFormik.setFieldTouched("userMobile", true, false);
          }
          toast.error(uniqueness.message);
          setSubmitting(false);
          return;
        }

        const updatePayload = {
          username: values.username.trim(),
          notes: (values.notes || "").trim(),
          userMobile: cleanMobile,
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role: USER_ROLES.CLIENT,
        };

        const updatedDoc = await updateUser(selectedClient.id, updatePayload);

        // Reset password if a new one was provided
        let pwFeedbackNote = "";
        if (values.newPassword && values.newPassword.trim()) {
          try {
            const pwResult = await resetUserPassword({
              email: cleanEmail,
              currentPassword: "aparna",
              newPassword: values.newPassword.trim(),
              displayName: values.username.trim(),
            });
            if (pwResult?.method === "email_sent") {
              pwFeedbackNote = ` Note: ${pwResult.message}`;
            } else {
              pwFeedbackNote = " Password updated successfully.";
            }
          } catch (pwErr) {
            console.warn("Password update note:", pwErr);
            toast.error(
              `Profile saved, but password update failed: ${pwErr.message}`,
            );
            setSubmitting(false);
            return;
          }
        }

        const editNow = new Date();
        setClients((prev) =>
          prev.map((c) =>
            c.id === selectedClient.id ||
            (c.email && c.email.toLowerCase() === cleanEmail)
              ? {
                  ...c,
                  ...updatePayload,
                  id: updatedDoc.id || c.id,
                  updatedAt: editNow.toISOString(),
                  rawUpdatedAt: editNow,
                }
              : c,
          ),
        );

        if (clientForView && clientForView.id === selectedClient.id) {
          setClientForView((prev) => ({ ...prev, ...updatePayload }));
        }

        if (refreshProfile) {
          try {
            await refreshProfile();
          } catch {}
        }

        toast.success(
          `Client "${values.username.trim()}" updated successfully!${pwFeedbackNote}`,
        );
        setOpenEditModal(false);
      } catch (err) {
        console.error("Update client error:", err);
        toast.error(err.message || "Failed to update client.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Create Client Formik
  const createFormik = useFormik({
    initialValues: {
      username: "",
      notes: "",
      userMobile: "",
      email: "",
      userAddress: "",
    },
    validationSchema: clientValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness before creating client
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            createFormik.setFieldError(
              "email",
              "This email address is already registered.",
            );
            createFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            createFormik.setFieldError(
              "userMobile",
              "This mobile number is already registered.",
            );
            createFormik.setFieldTouched("userMobile", true, false);
          }
          toast.error(uniqueness.message);
          setSubmitting(false);
          return;
        }

        let authUid;
        try {
          const authResult = await createAuthUser({
            email: cleanEmail,
            password: "aparna",
            displayName: values.username.trim(),
          });
          authUid = authResult.uid;
        } catch (authErr) {
          console.warn("Firebase Auth creation note:", authErr);
          if (authErr.code === "auth/email-already-in-use") {
            createFormik.setFieldError(
              "email",
              "This email address is already registered in Authentication.",
            );
            createFormik.setFieldTouched("email", true, false);
            toast.error(
              `The email "${cleanEmail}" is already registered in Firebase Authentication.`,
            );
            setSubmitting(false);
            return;
          }
          authUid = "user-" + Date.now();
        }

        const newClientData = {
          id: authUid,
          username: values.username.trim(),
          notes: (values.notes || "").trim(),
          email: cleanEmail,
          userMobile: cleanMobile,
          userAddress: values.userAddress.trim(),
          role: USER_ROLES.CLIENT,
        };

        const created = await createUser(newClientData);
        const now = new Date();
        setClients((prev) => [
          {
            ...newClientData,
            id: created.id || authUid,
            createdAt: now.toISOString(),
            rawCreatedAt: now,
            updatedAt: null,
            rawUpdatedAt: null,
          },
          ...prev,
        ]);

        toast.success(
          `Client "${values.username.trim()}" registered successfully!`,
        );
        resetForm();
        setDialogOpen(false);
      } catch (err) {
        console.error("Client registration error:", err);
        toast.error(err.message || "Failed to create client record.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // measureFormik removed — handled by <MeasurementModal> component via onSave prop.

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
      dressSize: selectedMeasureForEdit?.dressSize || "",
      notes: selectedMeasureForEdit?.notes || "",
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (!selectedMeasureForEdit?.id)
          throw new Error("Measurement ID is required to update.");
        const clientId = selectedMeasureForEdit.userId || clientForView?.id;

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

        setMeasurementsMap((prev) => {
          const userList = prev[clientId] ? [...prev[clientId]] : [];
          return {
            ...prev,
            [clientId]: userList.map((m) =>
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
          };
        });

        const editNow = new Date();
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  updatedAt: editNow.toISOString(),
                  rawUpdatedAt: editNow,
                }
              : c,
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

  // Confirm and execute measurement deletion from custom popup
  const confirmDeleteMeasurement = async () => {
    if (!userCanDelete || !measureToDelete) return;
    const { id: measurementId, userId: clientId, title } = measureToDelete;
    setDeletingMeasureId(measurementId);
    try {
      await deleteClientMeasurement(measurementId);
      setMeasurementsMap((prev) => {
        const userList = (prev[clientId] || []).filter(
          (m) => m.id !== measurementId,
        );
        return {
          ...prev,
          [clientId]: userList,
        };
      });
      toast.success(
        `Measurement profile "${title || "Profile"}" removed successfully.`,
      );
      setMeasureToDelete(null);
    } catch (err) {
      console.error("Delete measurement error:", err);
      toast.error("Failed to delete measurement profile.");
    } finally {
      setDeletingMeasureId(null);
    }
  };

  // Filtered client list by search term and tabs
  const filteredClients = useMemo(() => {
    return clients.filter((item) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (item.username || "").toLowerCase().includes(term) ||
        (item.email || "").toLowerCase().includes(term) ||
        (item.userMobile || "").includes(term) ||
        (item.userAddress || "").toLowerCase().includes(term) ||
        (item.notes || "").toLowerCase().includes(term);

      const hasMeasurements = (measurementsMap[item.id] || []).length > 0;
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "MEASURED" && hasMeasurements && !item.disabled) ||
        (activeTab === "PENDING" && !hasMeasurements && !item.disabled) ||
        (activeTab === "DISABLED" && Boolean(item.disabled));

      return matchesSearch && matchesTab;
    });
  }, [clients, searchTerm, activeTab, measurementsMap]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (sortField === "measureCount") {
        const aCount = (measurementsMap[a.id] || []).length;
        const bCount = (measurementsMap[b.id] || []).length;
        return sortDirection === "asc" ? aCount - bCount : bCount - aCount;
      }
      if (sortField === "disabled") {
        const aVal = a.disabled ? 1 : 0;
        const bVal = b.disabled ? 1 : 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (
        sortField === "createdAt" ||
        sortField === "updatedAt" ||
        sortField === "recent"
      ) {
        const aTime = getLatestItemTimestamp(a);
        const bTime = getLatestItemTimestamp(b);
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredClients, sortField, sortDirection, measurementsMap]);

  const paginatedClients = useMemo(() => {
    return sortedClients.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [sortedClients, page, rowsPerPage]);

  // Metrics calculations
  const totalClientsCount = clients.length;
  const clientsWithMeasurements = useMemo(() => {
    return clients.filter((c) => (measurementsMap[c.id] || []).length > 0)
      .length;
  }, [clients, measurementsMap]);
  const pendingMeasurementsCount = totalClientsCount - clientsWithMeasurements;
  const totalMeasurementsCount = useMemo(() => {
    return Object.values(measurementsMap).reduce(
      (acc, list) => acc + (list?.length || 0),
      0,
    );
  }, [measurementsMap]);

  const disabledClientsCount = clients.filter((c) =>
    Boolean(c.disabled),
  ).length;

  const clientTabs = [
    { label: `All Clients (${clients.length})`, value: "ALL" },
    {
      label: `With Measurements (${clientsWithMeasurements})`,
      value: "MEASURED",
    },
    {
      label: `Pending Measurements (${pendingMeasurementsCount})`,
      value: "PENDING",
    },
    ...(disabledClientsCount > 0
      ? [{ label: `Disabled (${disabledClientsCount})`, value: "DISABLED" }]
      : []),
  ];

  return (
    <div className="clients-page">
      {/* Top Header matching Dashboard and Users */}
      <div className="clients-page__header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">
            View client profiles, contact info, and manage tailoring
            measurements
          </p>
        </div>

        <div className="header-actions">
          <AppButton
            variant="secondary"
            size="md"
            startIcon={
              <RefreshOutlinedIcon
                className={loading || refreshing ? "spin-icon" : ""}
              />
            }
            onClick={() => fetchClients(true)}
            disabled={loading || refreshing}
            className="refresh-btn"
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </AppButton>

          <AppButton
            variant="primary"
            size="md"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => {
              setDialogOpen(true);
            }}
            className="create-client-btn"
          >
            Add Client
          </AppButton>
        </div>
      </div>

      {/* 4 StatCards matching Dashboard Overview Grid */}
      <div className="clients-page__stats-grid">
        <StatCard
          title="Clients"
          value={String(totalClientsCount)}
          change="All Registered Clients"
          trendType="completed"
          icon={<PeopleOutlineIcon />}
        />
        <StatCard
          title="With Measurements"
          value={String(clientsWithMeasurements)}
          change={
            totalClientsCount > 0
              ? `${Math.round(
                  (clientsWithMeasurements / totalClientsCount) * 100,
                )}% Profile Rate`
              : "0%"
          }
          trendType="up"
          icon={<StraightenOutlinedIcon />}
        />
        <StatCard
          title="Total Measurements"
          value={String(totalMeasurementsCount)}
          change="Multi-profile Records"
          trendType="completed"
          icon={<SquareFootOutlinedIcon />}
        />
        <StatCard
          title="Pending Measurements"
          value={String(pendingMeasurementsCount)}
          change={
            pendingMeasurementsCount > 0
              ? "Awaiting Measurement"
              : "All Profiles Completed"
          }
          trendType={pendingMeasurementsCount > 0 ? "pending" : "completed"}
          icon={<PendingActionsOutlinedIcon />}
        />
      </div>

      {/* 1. Filter Tabs Row */}
      <div className="clients-page__tabs-row">
        <AppTabs
          tabs={clientTabs}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPage(0);
          }}
        />
      </div>

      {/* 2. Controls Row: View Mode Switcher on LEFT, Search on RIGHT */}
      <div className="clients-page__toolbar">
        <AppViewToggle value={viewMode} onChange={setViewMode} />
        <div className="clients-search-field">
          <AppInput
            placeholder="Search by name, mobile, email, address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Main Clients Content */}
      {loading ? (
        <div className="clients-loading-wrapper">
          <AppSpinner size="lg" color="gold" />
          <span className="clients-loading-text">
            Loading client directory...
          </span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="clients-empty-wrapper">
          <PeopleOutlineIcon
            className="empty-state-icon"
            style={{ fontSize: 44 }}
          />
          <span className="empty-title">
            No clients found matching your criteria.
          </span>
          <span className="empty-subtitle">
            {searchTerm || activeTab !== "ALL"
              ? "Try changing your search term or active tab filter."
              : 'Click "Add Client" to register the first client profile.'}
          </span>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================== */
        /* 1. TABLE VIEW                                              */
        /* ========================================================== */
        <div className="clients-table-card">
          <AppTableContainer className="table-responsive">
            <AppTable className="clients-table">
              <AppTableHead>
                <AppTableRow>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "username"}
                      direction={
                        sortField === "username" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("username")}
                    >
                      CLIENT NAME
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "userMobile"}
                      direction={
                        sortField === "userMobile" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("userMobile")}
                    >
                      MOBILE
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head style={{ textAlign: "center" }}>
                    <AppTableSortLabel
                      active={sortField === "measureCount"}
                      direction={
                        sortField === "measureCount" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("measureCount")}
                    >
                      MEASUREMENTS
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head style={{ textAlign: "center" }}>
                    <AppTableSortLabel
                      active={sortField === "disabled"}
                      direction={
                        sortField === "disabled" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("disabled")}
                    >
                      STATUS
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell
                    head
                    style={{ textAlign: "right", minWidth: 160 }}
                  >
                    ACTIONS
                  </AppTableCell>
                </AppTableRow>
              </AppTableHead>

              <AppTableBody>
                {paginatedClients.map((user) => {
                  const initial = (
                    user.username?.charAt(0) ||
                    user.email?.charAt(0) ||
                    "C"
                  ).toUpperCase();
                  const userMeasures = measurementsMap[user.id] || [];
                  const measureCount = userMeasures.length;
                  const isExpanded = expandedClients.has(user.id);

                  return (
                    <React.Fragment key={user.id}>
                      <AppTableRow
                        className={`client-table-row ${user.disabled ? "client-table-row--disabled" : ""}`}
                        onClick={() => toggleClientExpand(user.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Client Avatar & Name */}
                        <AppTableCell>
                          <div className="user-cell-content">
                            <div className="user-avatar-circle">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.username}
                                  className="user-avatar-img"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                              {!user.photoURL &&
                                (initial || (
                                  <PersonOutlineIcon style={{ fontSize: 16 }} />
                                ))}
                            </div>
                            <div className="user-name-wrapper">
                              <div className="user-name-text">
                                {user.username || "Client"}
                              </div>
                            </div>
                          </div>
                        </AppTableCell>

                        {/* Mobile Number */}
                        <AppTableCell>
                          <span className="mobile-cell">
                            {user.userMobile || "—"}
                          </span>
                        </AppTableCell>

                        {/* Measurement Profiles Badge */}
                        <AppTableCell style={{ textAlign: "center" }}>
                          {measureCount > 0 ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewDetails(user);
                              }}
                              style={{ cursor: "pointer" }}
                              title="Click to view measurement profiles"
                            >
                              <AppBadge variant="completed">
                                {measureCount} Profile
                                {measureCount > 1 ? "s" : ""}
                              </AppBadge>
                            </span>
                          ) : user.disabled ? (
                            <AppBadge variant="neutral">No Profiles</AppBadge>
                          ) : (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddMeasure(user);
                              }}
                              style={{ cursor: "pointer" }}
                              title="Add Measurement"
                            >
                              <AppBadge variant="pending">
                                + Add Measurements
                              </AppBadge>
                            </span>
                          )}
                        </AppTableCell>

                        {/* Status Badge */}
                        <AppTableCell style={{ textAlign: "center" }}>
                          <AppBadge
                            variant={user.disabled ? "danger" : "completed"}
                          >
                            {user.disabled ? "Disabled" : "Active"}
                          </AppBadge>
                        </AppTableCell>

                        {/* Row Action Buttons */}
                        <AppTableCell
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          <div className="action-btns">
                            {/* 1. View Details Button (Always Available) */}
                            <AppButton
                              variant="info"
                              size="sm"
                              square
                              className="action-btn--view"
                              title="View Client Profile & Measurements"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenViewDetails(user);
                              }}
                            >
                              <VisibilityOutlinedIcon
                                style={{ fontSize: 16 }}
                              />
                            </AppButton>

                            {/* 2. Add Measurement Shortcut (Only when active) */}
                            {userCanEdit && !user.disabled && (
                              <AppButton
                                variant="success"
                                size="sm"
                                square
                                className="action-btn--measure"
                                title="Add Measurement Profile"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddMeasure(user);
                                }}
                              >
                                <StraightenOutlinedIcon
                                  style={{ fontSize: 16 }}
                                />
                              </AppButton>
                            )}

                            {/* 3. Edit Client Info (Only when active) */}
                            {userCanEdit && !user.disabled && (
                              <AppButton
                                variant="warning"
                                size="sm"
                                square
                                className="action-btn--edit"
                                title="Edit Client Info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(user);
                                }}
                              >
                                <EditOutlinedIcon style={{ fontSize: 16 }} />
                              </AppButton>
                            )}

                            {/* 4. Enable / Disable Client Button */}
                            {userCanEdit && (
                              <AppButton
                                variant={user.disabled ? "success" : "danger"}
                                size="sm"
                                square
                                className={`action-btn--status ${user.disabled ? "action-btn--enable" : "action-btn--disable"}`}
                                title={
                                  user.disabled
                                    ? "Enable Client Account"
                                    : "Disable Client Account"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStatusModal(user);
                                }}
                              >
                                {user.disabled ? (
                                  <CheckCircleOutlineIcon
                                    style={{ fontSize: 16 }}
                                  />
                                ) : (
                                  <BlockOutlinedIcon style={{ fontSize: 16 }} />
                                )}
                              </AppButton>
                            )}

                            {/* 5. Create Order Button (Only when active) */}
                            {!user.disabled && (
                              <AppButton
                                variant="secondary"
                                size="sm"
                                square
                                className="action-btn--order"
                                title="Create Order"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderForClient(user);
                                }}
                              >
                                <ShoppingCartOutlinedIcon
                                  style={{ fontSize: 16 }}
                                />
                              </AppButton>
                            )}

                            {/* 6. Expand / View More Details Button */}
                            <AppButton
                              variant="secondary"
                              size="sm"
                              square
                              className={`action-btn--more ${isExpanded ? "is-active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleClientExpand(user.id);
                              }}
                              aria-expanded={isExpanded}
                              title={
                                isExpanded
                                  ? "Hide Details"
                                  : "View More Details"
                              }
                            >
                              <KeyboardArrowDownIcon
                                style={{
                                  fontSize: 18,
                                  transform: isExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                  transition: "transform 0.25s ease",
                                }}
                              />
                            </AppButton>
                          </div>
                        </AppTableCell>
                      </AppTableRow>

                      {/* Expandable View More Row */}
                      {isExpanded && (
                        <AppTableRow className="table-expanded-row">
                          <AppTableCell
                            colSpan={5}
                            className="table-expanded-cell"
                          >
                            <div className="table-expanded-container">
                              {/* Address Tile (Half Width Top Row) */}
                              <div className="expanded-tile expanded-tile--address">
                                <div className="tile-header">
                                  <LocationOnOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">
                                    Delivery / Boutique Address
                                  </span>
                                </div>
                                <div className="tile-content">
                                  {user.userAddress ? (
                                    <span className="address-text">
                                      {user.userAddress}
                                    </span>
                                  ) : (
                                    <span className="empty-hint">
                                      No address on file
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Notes Tile (Half Width Top Row) */}
                              <div className="expanded-tile expanded-tile--note">
                                <div className="tile-header">
                                  <NotesOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">Notes</span>
                                </div>
                                <div className="tile-content">
                                  {user.notes ? (
                                    <span className="note-text">
                                      {user.notes}
                                    </span>
                                  ) : (
                                    <span className="empty-hint">-</span>
                                  )}
                                </div>
                              </div>

                              {/* Email Tile */}
                              <div className="expanded-tile">
                                <div className="tile-header">
                                  <EmailOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">
                                    Email Address
                                  </span>
                                </div>
                                <div className="tile-content">
                                  {user.email ? (
                                    <span className="email-text">
                                      {user.email}
                                    </span>
                                  ) : (
                                    <span className="empty-hint">
                                      -
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Joined Date Tile */}
                              <div className="expanded-tile">
                                <div className="tile-header">
                                  <CalendarTodayOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">Joined</span>
                                </div>
                                <div className="tile-content">
                                  <DateTimeCell
                                    value={user.rawCreatedAt || user.createdAt}
                                  />
                                </div>
                              </div>

                              {/* Modified Date Tile */}
                              <div className="expanded-tile">
                                <div className="tile-header">
                                  <ScheduleOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">Modified</span>
                                </div>
                                <div className="tile-content">
                                  <DateTimeCell
                                    value={user.rawUpdatedAt || user.updatedAt}
                                    modifiedFrom={
                                      user.rawCreatedAt || user.createdAt
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </AppTableCell>
                        </AppTableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </AppTableBody>
            </AppTable>
          </AppTableContainer>
          <AppTablePagination
            count={filteredClients.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </div>
      ) : viewMode === "grid" ? (
        /* ========================================================== */
        /* 2. GRID VIEW (Multi-Column Luxury Gold Cards)              */
        /* ========================================================== */
        <div className="clients-grid-wrapper">
          <div className="clients-grid">
            {paginatedClients.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "48px 16px",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  borderRadius: "12px",
                  border: "1px solid var(--surface-border)",
                }}
              >
                {searchTerm || activeTab !== "ALL"
                  ? "No clients match your search criteria."
                  : "No clients registered yet. Click 'Add Client' to create the first profile."}
              </div>
            ) : (
              paginatedClients.map((user) => {
                const initial = (
                  user.username?.charAt(0) ||
                  user.email?.charAt(0) ||
                  "C"
                ).toUpperCase();
                const userMeasures = measurementsMap[user.id] || [];
                const measureCount = userMeasures.length;

                return (
                  <div
                    key={user.id}
                    className={`client-grid-card ${user.disabled ? "client-grid-card--disabled" : ""}`}
                  >
                    <div className="card-top-accent" />
                    <div className="card-header">
                      <div className="user-avatar-circle">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.username}
                            className="user-avatar-img"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          initial
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          alignItems: "center",
                        }}
                      >
                        <span
                          onClick={() =>
                            measureCount > 0
                              ? handleOpenViewDetails(user)
                              : !user.disabled
                                ? handleOpenAddMeasure(user)
                                : null
                          }
                          style={{
                            cursor:
                              measureCount > 0 || !user.disabled
                                ? "pointer"
                                : "default",
                          }}
                          title={
                            measureCount > 0
                              ? "View Measurement Profiles"
                              : !user.disabled
                                ? "Add Measurement Profile"
                                : "Disabled"
                          }
                        >
                          <AppBadge
                            variant={
                              measureCount > 0
                                ? "completed"
                                : user.disabled
                                  ? "neutral"
                                  : "pending"
                            }
                          >
                            {measureCount > 0
                              ? `${measureCount} Profile${measureCount > 1 ? "s" : ""}`
                              : user.disabled
                                ? "No Profiles"
                                : "+ Add Measure"}
                          </AppBadge>
                        </span>
                        <AppBadge
                          variant={user.disabled ? "danger" : "completed"}
                        >
                          {user.disabled ? "Disabled" : "Active"}
                        </AppBadge>
                      </div>
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">
                        {user.username || "Client"}
                      </h3>
                      <div className="card-info-rows">
                        <div className="info-item">
                          <PhoneIphoneOutlinedIcon style={{ fontSize: 14 }} />
                          <span>{user.userMobile || "—"}</span>
                        </div>
                        <div className="info-item">
                          <EmailOutlinedIcon style={{ fontSize: 14 }} />
                          <span className="truncate-text">
                            {user.email || "No email"}
                          </span>
                        </div>
                        {user.userAddress && (
                          <div className="info-item">
                            <LocationOnOutlinedIcon style={{ fontSize: 14 }} />
                            <span className="truncate-text">
                              {user.userAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="card-date">
                        <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                        <DateTimeCell
                          value={user.rawCreatedAt || user.createdAt}
                        />
                      </div>
                      <div className="action-btns">
                        <AppButton
                          variant="info"
                          size="sm"
                          square
                          className="action-btn--view"
                          title="View Client Profile"
                          onClick={() => handleOpenViewDetails(user)}
                        >
                          <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                        </AppButton>
                        {userCanEdit && !user.disabled && (
                          <AppButton
                            variant="success"
                            size="sm"
                            square
                            className="action-btn--measure"
                            title="Add Measurement"
                            onClick={() => handleOpenAddMeasure(user)}
                          >
                            <StraightenOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>
                        )}
                        {userCanEdit && !user.disabled && (
                          <AppButton
                            variant="warning"
                            size="sm"
                            square
                            className="action-btn--edit"
                            title="Edit Client"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <EditOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>
                        )}
                        {userCanEdit && (
                          <AppButton
                            variant={user.disabled ? "success" : "danger"}
                            size="sm"
                            square
                            className={`action-btn--status ${user.disabled ? "action-btn--enable" : "action-btn--disable"}`}
                            title={
                              user.disabled
                                ? "Enable Client Account"
                                : "Disable Client Account"
                            }
                            onClick={() => handleOpenStatusModal(user)}
                          >
                            {user.disabled ? (
                              <CheckCircleOutlineIcon
                                style={{ fontSize: 16 }}
                              />
                            ) : (
                              <BlockOutlinedIcon style={{ fontSize: 16 }} />
                            )}
                          </AppButton>
                        )}
                        {!user.disabled && (
                          <AppButton
                            variant="secondary"
                            size="sm"
                            square
                            className="action-btn--order"
                            title="Create Order"
                            onClick={() => setOrderForClient(user)}
                          >
                            <ShoppingCartOutlinedIcon
                              style={{ fontSize: 16 }}
                            />
                          </AppButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="clients-pagination-card">
            <AppTablePagination
              count={filteredClients.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* 3. CARD VIEW (Detailed Full-Width Dossier Cards)           */
        /* ========================================================== */
        <div className="clients-card-list-wrapper">
          <div className="clients-card-list">
            {paginatedClients.map((user) => {
              const initial = (
                user.username?.charAt(0) ||
                user.email?.charAt(0) ||
                "C"
              ).toUpperCase();
              const userMeasures = measurementsMap[user.id] || [];
              const measureCount = userMeasures.length;

              return (
                <div
                  key={user.id}
                  className={`client-detailed-card ${user.disabled ? "client-detailed-card--disabled" : ""}`}
                >
                  <div className="detailed-card-left">
                    <div className="user-avatar-circle user-avatar-circle-lg">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.username}
                          className="user-avatar-img"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        initial
                      )}
                    </div>
                  </div>

                  <div className="detailed-card-main">
                    <div className="detailed-card-header">
                      <div className="detailed-card-title-row">
                        <div>
                          <h3 className="client-heading">
                            {user.username || "Client"}
                          </h3>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            onClick={() =>
                              measureCount > 0
                                ? handleOpenViewDetails(user)
                                : !user.disabled
                                  ? handleOpenAddMeasure(user)
                                  : null
                            }
                            style={{
                              cursor:
                                measureCount > 0 || !user.disabled
                                  ? "pointer"
                                  : "default",
                            }}
                          >
                            <AppBadge
                              variant={
                                measureCount > 0
                                  ? "completed"
                                  : user.disabled
                                    ? "neutral"
                                    : "pending"
                              }
                            >
                              {measureCount > 0
                                ? `${measureCount} Measurement Profile${measureCount > 1 ? "s" : ""}`
                                : user.disabled
                                  ? "No Profiles"
                                  : "No Measurements Saved"}
                            </AppBadge>
                          </span>
                          <AppBadge
                            variant={user.disabled ? "danger" : "completed"}
                          >
                            {user.disabled ? "Disabled" : "Active"}
                          </AppBadge>
                        </div>
                      </div>
                      <p className="client-address-text">
                        <LocationOnOutlinedIcon style={{ fontSize: 15 }} />
                        {user.userAddress || "No physical address specified"}
                      </p>
                    </div>

                    <div className="detailed-card-meta">
                      <div className="meta-tile">
                        <span className="meta-label">Mobile</span>
                        <span className="meta-value">
                          {user.userMobile || "—"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Email</span>
                        <span className="meta-value truncate-text">
                          {user.email || "—"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Joined</span>
                        <span className="meta-value">
                          <DateTimeCell
                            value={user.rawCreatedAt || user.createdAt}
                          />
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Last Updated</span>
                        <span className="meta-value">
                          <DateTimeCell
                            value={user.rawUpdatedAt || user.updatedAt}
                            modifiedFrom={user.rawCreatedAt || user.createdAt}
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detailed-card-actions">
                    <AppButton
                      variant="info"
                      size="sm"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={() => handleOpenViewDetails(user)}
                    >
                      View Details
                    </AppButton>
                    {userCanEdit && !user.disabled && (
                      <AppButton
                        variant="success"
                        size="sm"
                        startIcon={<StraightenOutlinedIcon />}
                        onClick={() => handleOpenAddMeasure(user)}
                      >
                        Add Measure
                      </AppButton>
                    )}
                    {userCanEdit && !user.disabled && (
                      <AppButton
                        variant="warning"
                        size="sm"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => handleOpenEdit(user)}
                      >
                        Edit
                      </AppButton>
                    )}
                    {userCanEdit && (
                      <AppButton
                        variant={user.disabled ? "success" : "danger"}
                        size="sm"
                        startIcon={
                          user.disabled ? (
                            <CheckCircleOutlineIcon />
                          ) : (
                            <BlockOutlinedIcon />
                          )
                        }
                        onClick={() => handleOpenStatusModal(user)}
                      >
                        {user.disabled ? "Enable Client" : "Disable Client"}
                      </AppButton>
                    )}
                    {!user.disabled && (
                      <AppButton
                        variant="primary"
                        size="sm"
                        startIcon={<ShoppingCartOutlinedIcon />}
                        onClick={() => setOrderForClient(user)}
                      >
                        Order Now
                      </AppButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="clients-pagination-card">
            <AppTablePagination
              count={filteredClients.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 0. Create Order Modal (per client)                                       */}
      {/* ========================================================================= */}
      <CreateOrderModal
        open={!!orderForClient}
        onClose={() => setOrderForClient(null)}
        initialClient={orderForClient}
        onOrderCreated={() => setOrderForClient(null)}
      />

      {/* ========================================================================= */}
      {/* 1. Modal: Add New Client Dialog                                         */}
      {/* ========================================================================= */}
      <AppModal
        open={dialogOpen}
        onClose={() => !createFormik.isSubmitting && setDialogOpen(false)}
        title="Register New Client"
        subtitle="Enter client contact details below."
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
              Add Client
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={createFormik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Client Full Name"
            required
            id="create-username"
            name="username"
            placeholder="e.g. Aparna"
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
            id="create-email"
            name="email"
            type="email"
            placeholder="e.g. aparna@example.com"
            value={createFormik.values.email}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={createFormik.touched.email && createFormik.errors.email}
            disabled={createFormik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <div className="form-row-2col">
            <AppInput
              label="Address"
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

            <AppInput
              label="Notes (Optional)"
              id="create-notes"
              name="notes"
              placeholder="e.g. Saree preferences, special handling notes..."
              value={createFormik.values.notes}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              error={createFormik.touched.notes && createFormik.errors.notes}
              disabled={createFormik.isSubmitting}
              multiline
              rows={2}
              startAdornment={<NotesOutlinedIcon />}
            />
          </div>

          <AppInput
            label="Temporary Password (Locked to default)"
            required
            id="create-password"
            name="password"
            type="text"
            value="aparna"
            disabled={true}
            helperText="Temporary password is permanently locked to 'aparna' for all new client accounts"
            startAdornment={<LockOutlinedIcon />}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 2. Modal: Edit Client Dialog                                            */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        title="Edit Client Profile"
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
            label="Client Full Name"
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

          <div className="form-row-2col">
            <AppInput
              label="Residential / Delivery Address / City"
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

            <AppInput
              label="Notes (Optional)"
              id="edit-notes"
              name="notes"
              placeholder="e.g. Saree preferences, special handling notes..."
              value={editFormik.values.notes}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={editFormik.touched.notes && editFormik.errors.notes}
              disabled={editFormik.isSubmitting}
              multiline
              rows={2}
              startAdornment={<NotesOutlinedIcon />}
            />
          </div>

          <AppInput
            label="Reset Password (Optional)"
            id="edit-newPassword"
            name="newPassword"
            type="password"
            placeholder="Leave blank to keep current password"
            value={editFormik.values.newPassword}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.newPassword && editFormik.errors.newPassword
            }
            disabled={editFormik.isSubmitting}
            helperText="Enter a new password to reset. Leave blank to keep existing password."
            startAdornment={<LockOutlinedIcon />}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 3. Modal: View Client Details & Measurement Profiles                    */}
      {/* ========================================================================= */}
      <AppModal
        open={openViewDetailsModal}
        onClose={() => setOpenViewDetailsModal(false)}
        title={clientForView?.username || "Client Profile"}
        subtitle="Client contact info & tailored saree measurement specifications"
        maxWidth="md"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => {
                setOpenViewDetailsModal(false);
                handleOpenAddMeasure(clientForView);
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
        {clientForView && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Client Summary Card */}
            <div className="details-summary-card">
              <div className="summary-item">
                <PhoneIphoneOutlinedIcon className="summary-item-icon" />
                <div>
                  <div className="item-label">Phone</div>
                  <div className="item-value">
                    {clientForView.userMobile || "—"}
                  </div>
                </div>
              </div>

              <div className="summary-item">
                <EmailOutlinedIcon className="summary-item-icon" />
                <div>
                  <div className="item-label">Email</div>
                  <div className="item-value">{clientForView.email || "—"}</div>
                </div>
              </div>

              <div className="summary-item">
                <LocationOnOutlinedIcon className="summary-item-icon" />
                <div>
                  <div className="item-label">Address</div>
                  <div className="item-value">
                    {clientForView.userAddress || "—"}
                  </div>
                </div>
              </div>

              {clientForView.notes ? (
                <div className="summary-item">
                  <NotesOutlinedIcon className="summary-item-icon" />
                  <div>
                    <div className="item-label">Notes</div>
                    <div
                      className="item-value"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {clientForView.notes}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="summary-item">
                <CalendarTodayOutlinedIcon className="summary-item-icon" />
                <div>
                  <div className="item-label">Joined</div>
                  <div className="item-value">
                    <DateTimeCell
                      value={
                        clientForView.rawCreatedAt || clientForView.createdAt
                      }
                    />
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
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                }}
              >
                Saree Measurement Profiles (
                {measurementsMap[clientForView.id]?.length || 0})
              </span>
            </div>

            {/* List of Measurement Cards */}
            {!measurementsMap[clientForView.id] ||
            measurementsMap[clientForView.id].length === 0 ? (
              <div className="empty-measurements-box">
                <StraightenOutlinedIcon
                  className="empty-state-icon"
                  style={{
                    fontSize: 36,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  No saree measurements recorded for this client yet.
                </div>
                <p
                  style={{
                    color: "var(--text-muted)",
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
                    handleOpenAddMeasure(clientForView);
                  }}
                >
                  Record Measurements Now
                </AppButton>
              </div>
            ) : (
              <div className="measurements-list-container">
                {measurementsMap[clientForView.id].map((measure, idx) => (
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
                          {measure.rawCreatedAt || measure.createdAt ? (
                            <DateTimeCell
                              value={measure.rawCreatedAt || measure.createdAt}
                            />
                          ) : (
                            ""
                          )}
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
                                userId: clientForView.id,
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
                        <span className="dim-label">Client Height</span>
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
                        <NotesOutlinedIcon className="measure-notes-icon" />
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
      {/* 4. Modal: Add Measurement Profile (reusable MeasurementModal component)    */}
      {/* ========================================================================= */}
      <MeasurementModal
        open={openAddMeasureModal}
        onClose={() => setOpenAddMeasureModal(false)}
        subtitle={`Recording measurements for ${clientForMeasure?.username || "Client"}`}
        // initialValues={{
        //   title: clientForMeasure?.username
        //     ? `${clientForMeasure.username} Measurements`
        //     : "Standard Saree Pleats",
        // }}
        onSave={async (values) => {
          const clientId = clientForMeasure?.id;
          if (!clientId)
            throw new Error("Client ID is required to record measurements.");

          const measurementPayload = {
            userId: clientId,
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

          setMeasurementsMap((prev) => {
            const userList = prev[clientId] ? [...prev[clientId]] : [];
            return { ...prev, [clientId]: [savedRecord, ...userList] };
          });

          const editNow = new Date();
          setClients((prev) =>
            prev.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    updatedAt: editNow.toISOString(),
                    rawUpdatedAt: editNow,
                  }
                : c,
            ),
          );

          toast.success(
            `Measurement profile "${values.title.trim()}" added successfully for ${clientForMeasure.username}!`,
          );
        }}
      />

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

          <div className="measurement-modal-grid">
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
            color: "var(--text-primary, #e6d8a3)",
            fontSize: "0.95rem",
            marginBottom: 10,
            marginTop: 0,
          }}
        >
          Are you sure you want to remove measurement profile{" "}
          <strong style={{ color: "var(--color-gold)" }}>
            "{measureToDelete?.title || "this profile"}"
          </strong>
          ?
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          This will permanently delete this tailoring specification.
        </p>
      </AppModal>

      {/* ========================================================================= */}
      {/* 7. Modal: Enable / Disable Client Confirmation Dialog                     */}
      {/* ========================================================================= */}
      <AppModal
        open={statusModalOpen}
        onClose={() => !updatingStatus && setStatusModalOpen(false)}
        title={
          clientForStatusChange?.disabled
            ? "Enable Client Account"
            : "Disable Client Account"
        }
        subtitle={
          clientForStatusChange?.disabled
            ? `Restore access for ${clientForStatusChange?.username || "this client"}`
            : `Temporarily suspend access for ${clientForStatusChange?.username || "this client"}`
        }
        maxWidth="xs"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setStatusModalOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </AppButton>
            <AppButton
              variant={clientForStatusChange?.disabled ? "success" : "danger"}
              onClick={handleConfirmStatusToggle}
              loading={updatingStatus}
              startIcon={
                clientForStatusChange?.disabled ? (
                  <CheckCircleOutlineIcon />
                ) : (
                  <BlockOutlinedIcon />
                )
              }
            >
              {clientForStatusChange?.disabled
                ? "Enable Client"
                : "Disable Client"}
            </AppButton>
          </>
        }
      >
        <div className="status-modal-content">
          <p>
            {clientForStatusChange?.disabled ? (
              <>
                Are you sure you want to <strong>enable</strong> access for{" "}
                <strong>{clientForStatusChange?.username}</strong>
                {clientForStatusChange?.email
                  ? ` (${clientForStatusChange.email})`
                  : ""}
                ?
                <br />
                <br />
                The client will be active and orders/measurements can be
                created.
              </>
            ) : (
              <>
                Are you sure you want to <strong>disable</strong> access for{" "}
                <strong>{clientForStatusChange?.username}</strong>
                {clientForStatusChange?.email
                  ? ` (${clientForStatusChange.email})`
                  : ""}
                ?
                <br />
                <br />
                This will prevent new orders, measurements, and profile edits
                for this client until re-enabled.
              </>
            )}
          </p>
        </div>
      </AppModal>
    </div>
  );
};

export default Clients;
