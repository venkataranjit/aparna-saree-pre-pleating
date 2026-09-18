import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getLocalUsers,
  createAuthUser,
  checkUserUniqueness,
  formatDateSafe,
  formatModifiedDate,
  getTimestampMillis,
  getLatestItemTimestamp,
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
import "./Users.scss";

/**
 * Role badge styling helper for AppBadge
 */
const getRoleBadgeVariant = (role) => {
  switch ((role || "").toLowerCase()) {
    case USER_ROLES.SUPERADMIN:
    case "superadmin":
      return "superadmin";
    case USER_ROLES.ADMIN:
    case "admin":
      return "admin";
    case USER_ROLES.STAFF:
    case "staff":
      return "staff";
    case USER_ROLES.CLIENT:
    case "client":
      return "client";
    default:
      return "neutral";
  }
};

/**
 * Formik Validation Schema using Yup
 */
const userValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("User Name is required"),
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
  role: Yup.string()
    .oneOf(Object.values(USER_ROLES), "Please select a valid role")
    .required("Role selection is required"),
  password: Yup.string()
    .min(6, "Temporary password must be at least 6 characters")
    .required("Temporary password is required"),
});

const editUserValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("User Name is required"),
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
  role: Yup.string().required("Role selection is required"),
});

const Users = () => {
  const {
    currentUser,
    refreshProfile,
    role,
    isSuperAdmin,
    canEdit,
    canManageUsers,
  } = useAuth();

  const userRoleLower = (role || "").toLowerCase();
  const hasAccessToUsers =
    canManageUsers ??
    (isSuperAdmin ||
      userRoleLower === "superadmin" ||
      userRoleLower === "admin");

  const userCanEdit =
    canEdit ??
    (isSuperAdmin ||
      userRoleLower === "admin" ||
      userRoleLower === "superadmin");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");

  // User Enable / Disable state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userForStatusChange, setUserForStatusChange] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isSuperAdminUser = (u) => {
    if (!u) return false;
    const email = (u.email || "").toLowerCase().trim();
    const r = (u.role || "").toLowerCase().trim();
    return (
      email === SUPERADMIN_EMAIL.toLowerCase() ||
      r === USER_ROLES.SUPERADMIN ||
      r === "superadmin"
    );
  };

  const isSelf = (u) => {
    if (!u || !currentUser) return false;
    return (
      currentUser.uid === u.id ||
      (u.email &&
        currentUser.email &&
        u.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
    );
  };

  const handleOpenStatusModal = (user) => {
    setUserForStatusChange(user);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusToggle = async () => {
    if (!userForStatusChange) return;
    const isCurrentlyDisabled = Boolean(userForStatusChange.disabled);
    const targetDisabledState = !isCurrentlyDisabled;
    setUpdatingStatus(true);
    try {
      await toggleUserStatus(userForStatusChange.id, targetDisabledState);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userForStatusChange.id
            ? { ...u, disabled: targetDisabledState }
            : u,
        ),
      );
      toast.success(
        `User "${userForStatusChange.username || "User"}" has been ${
          targetDisabledState ? "disabled" : "enabled"
        } successfully!`,
      );
      setStatusModalOpen(false);
      setUserForStatusChange(null);
    } catch (err) {
      console.error("Error updating user status:", err);
      toast.error(
        "Failed to update user status: " + (err.message || "Please try again."),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

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

  // Expandable row state for "View More" (to view createdAt, updatedAt, etc.)
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const toggleUserExpand = (id) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const [refreshing, setRefreshing] = useState(false);

  // Load all users from Firestore with local cache fallback
  const fetchUsers = async (isManualRefresh = false) => {
    if (!hasAccessToUsers) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (isManualRefresh) setRefreshing(true);
    try {
      const data = await getAllUsers();
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        const local = getLocalUsers();
        setUsers(local);
      }
      if (isManualRefresh) {
        toast.success("Users directory refreshed from database.");
      }
    } catch (err) {
      console.warn("Could not fetch remote users, using cached users:", err);
      const local = getLocalUsers();
      setUsers(local);
      if (isManualRefresh) {
        toast.error("Failed to refresh users from database.");
      } else {
        toast.error("Using offline cached users. Check Firebase connection.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasAccessToUsers) {
      fetchUsers(false);
    }
  }, [hasAccessToUsers]);

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    editFormik.setValues({
      username: user.username || "",
      notes: user.notes || "",
      userMobile: user.userMobile || "",
      email: user.email || "",
      userAddress: user.userAddress || "",
      role: user.role || USER_ROLES.CLIENT,
    });
    setOpenEditModal(true);
  };
  const handleOpenEditModal = handleOpenEdit;

  const editFormik = useFormik({
    initialValues: {
      username: "",
      notes: "",
      userMobile: "",
      email: "",
      userAddress: "",
      role: USER_ROLES.CLIENT,
    },
    validationSchema: editUserValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!selectedUser) return;
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();

        // Validate uniqueness excluding current selected user
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
          excludeUserId: selectedUser.id,
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

        const updatedFields = {
          username: values.username.trim(),
          notes: (values.notes || "").trim(),
          userMobile: cleanMobile,
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role:
            selectedUser.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
              ? USER_ROLES.SUPERADMIN
              : values.role,
        };

        await updateUser(selectedUser.id, updatedFields);

        const editNow = new Date();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  ...updatedFields,
                  updatedAt: editNow.toISOString(),
                  rawUpdatedAt: editNow,
                }
              : u,
          ),
        );

        if (currentUser?.uid === selectedUser.id) {
          if (refreshProfile) refreshProfile();
        }

        toast.success(`User "${values.username}" updated successfully!`);
        setOpenEditModal(false);
      } catch (err) {
        console.error("Error updating user:", err);
        toast.error(
          "Failed to update user: " + (err.message || "Please try again."),
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      notes: "",
      userMobile: "",
      email: "",
      userAddress: "",
      role: USER_ROLES.CLIENT,
      password: "aparna",
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const cleanMobile = String(values.userMobile).trim();
        const isSuper = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();

        // Validate email and mobile uniqueness before proceeding
        const uniqueness = await checkUserUniqueness({
          email: cleanEmail,
          userMobile: cleanMobile,
        });

        if (!uniqueness.isUnique) {
          if (uniqueness.emailExists) {
            formik.setFieldError(
              "email",
              "This email address is already registered.",
            );
            formik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            formik.setFieldError(
              "userMobile",
              "This mobile number is already registered.",
            );
            formik.setFieldTouched("userMobile", true, false);
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
            toast.error(
              `The email "${cleanEmail}" is already registered in Firebase Authentication.`,
            );
            setSubmitting(false);
            return;
          } else if (authErr.code === "auth/weak-password") {
            toast.error(
              "Temporary password must be at least 6 characters long.",
            );
            setSubmitting(false);
            return;
          } else if (authErr.code === "auth/invalid-email") {
            toast.error("Invalid email address format.");
            setSubmitting(false);
            return;
          }
          authUid = "user-" + Date.now();
        }

        const newUserPayload = {
          id: authUid,
          username: values.username.trim(),
          notes: (values.notes || "").trim(),
          email: cleanEmail,
          userMobile: String(values.userMobile).trim(),
          userAddress: values.userAddress.trim(),
          role: isSuper ? USER_ROLES.SUPERADMIN : values.role,
        };

        await createUser(newUserPayload);

        const now = new Date();
        const newUserItem = {
          ...newUserPayload,
          createdAt: now.toISOString(),
          rawCreatedAt: now,
          updatedAt: null,
          rawUpdatedAt: null,
        };

        setUsers((prev) => [
          newUserItem,
          ...prev.filter(
            (u) =>
              u.id !== authUid && (u.email || "").toLowerCase() !== cleanEmail,
          ),
        ]);

        toast.success(
          `User "${values.username}" successfully registered in Firebase! They can now log in with email "${cleanEmail}" and default password "aparna".`,
        );
        resetForm({
          values: {
            username: "",
            notes: "",
            userMobile: "",
            email: "",
            userAddress: "",
            role: USER_ROLES.CLIENT,
            password: "aparna",
          },
        });
        setOpenModal(false);
      } catch (err) {
        console.error("Error creating user:", err);
        toast.error(
          "Failed to create user: " + (err.message || "Please try again."),
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const uRole = (u.role || "").toLowerCase();
      const tabLower = activeTab.toLowerCase();
      const matchesTab =
        activeTab === "ALL"
          ? true
          : activeTab === "DISABLED"
            ? Boolean(u.disabled)
            : uRole === tabLower;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        u.username?.toLowerCase().includes(query) ||
        u.userMobile?.includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.notes?.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      if (
        sortField === "createdAt" ||
        sortField === "updatedAt" ||
        sortField === "recent"
      ) {
        const aTime = getLatestItemTimestamp(a);
        const bTime = getLatestItemTimestamp(b);
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      if (sortField === "disabled") {
        const aVal = a.disabled ? 1 : 0;
        const bVal = b.disabled ? 1 : 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredUsers, sortField, sortDirection]);

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [sortedUsers, page, rowsPerPage]);

  // Restrict access: only Super Admin and Admin can access the Users screen.
  // Staff and Clients are redirected immediately to /dashboard.
  if (!hasAccessToUsers) {
    return <Navigate to="/dashboard" replace />;
  }

  const disabledUsersCount = users.filter((u) => Boolean(u.disabled)).length;

  const roleTabs = [
    { label: `All (${users.length})`, value: "ALL" },
    {
      label: `Super Admins (${
        users.filter(
          (u) => (u.role || "").toLowerCase() === USER_ROLES.SUPERADMIN,
        ).length
      })`,
      value: USER_ROLES.SUPERADMIN,
    },
    {
      label: `Admins (${
        users.filter((u) => (u.role || "").toLowerCase() === USER_ROLES.ADMIN)
          .length
      })`,
      value: USER_ROLES.ADMIN,
    },
    {
      label: `Staff (${
        users.filter((u) => (u.role || "").toLowerCase() === USER_ROLES.STAFF)
          .length
      })`,
      value: USER_ROLES.STAFF,
    },
    {
      label: `Clients (${
        users.filter((u) => (u.role || "").toLowerCase() === USER_ROLES.CLIENT)
          .length
      })`,
      value: USER_ROLES.CLIENT,
    },
    ...(disabledUsersCount > 0
      ? [{ label: `Disabled (${disabledUsersCount})`, value: "DISABLED" }]
      : []),
  ];

  const renderRoleBadge = (u) => {
    const roleStr = (u.role || "").toLowerCase();
    const isSuper =
      roleStr === "superadmin" ||
      (u.email && u.email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase());

    if (isSuper) {
      return (
        <AppBadge
          variant="superadmin"
          icon={<VerifiedUserOutlinedIcon style={{ fontSize: 13 }} />}
        >
          Super Admin
        </AppBadge>
      );
    }
    if (roleStr === "admin") {
      return <AppBadge variant="admin">Admin</AppBadge>;
    }
    if (roleStr === "staff") {
      return <AppBadge variant="staff">Staff</AppBadge>;
    }
    return <AppBadge variant="client">Client</AppBadge>;
  };

  return (
    <div className="users-page">
      {/* Header section */}
      <div className="users-page__header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">
            Configure team members, staff permissions, and client profiles
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
            onClick={() => fetchUsers(true)}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            startIcon={<PersonAddOutlinedIcon />}
            className="create-user-btn"
            onClick={() => {
              setOpenModal(true);
            }}
          >
            Create New User
          </AppButton>
        </div>
      </div>

      {/* 1. Filter Tabs Row */}
      <div className="users-page__tabs-row">
        <AppTabs
          tabs={roleTabs}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPage(0);
          }}
        />
      </div>

      {/* 2. Controls Row: View Mode Switcher on LEFT, Search on RIGHT */}
      <div className="users-page__toolbar">
        <AppViewToggle value={viewMode} onChange={setViewMode} />
        <div className="users-search-field">
          <AppInput
            placeholder="Search by name, mobile, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Main Users Content */}
      {loading ? (
        <div className="users-loading-wrapper">
          <AppSpinner size="lg" color="gold" />
          <span className="users-loading-text">
            Loading users from Firebase...
          </span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-empty-wrapper">
          <PersonOutlineIcon
            className="empty-state-icon"
            style={{ fontSize: 44 }}
          />
          <span className="empty-title">
            {users.length === 0
              ? "No users found in Firebase"
              : "No users found matching your filter criteria"}
          </span>
          <span className="empty-subtitle">
            {users.length === 0
              ? 'Click "Create New User" to register a new user into Firebase.'
              : "Try changing your search term or role filter."}
          </span>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================== */
        /* 1. TABLE VIEW                                              */
        /* ========================================================== */
        <div className="users-table-card">
          <AppTableContainer className="table-responsive">
            <AppTable className="users-table">
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
                      User Name
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
                      Mobile Number
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "role"}
                      direction={sortField === "role" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("role")}
                    >
                      Assigned Role
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "disabled"}
                      direction={
                        sortField === "disabled" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("disabled")}
                    >
                      Status
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell
                    head
                    style={{ textAlign: "right", minWidth: 160 }}
                  >
                    Actions
                  </AppTableCell>
                </AppTableRow>
              </AppTableHead>
              <AppTableBody>
                {paginatedUsers.map((u) => {
                  const isExpanded = expandedUsers.has(u.id);

                  return (
                    <React.Fragment key={u.id}>
                      <AppTableRow
                        className={`user-table-row ${u.disabled ? "user-table-row--disabled" : ""}`}
                        onClick={() => toggleUserExpand(u.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <AppTableCell>
                          <div className="user-cell-content">
                            <div className="user-avatar-circle">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt={u.username}
                                  className="user-avatar-img"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                              {!u.photoURL &&
                                (u.username?.charAt(0).toUpperCase() || (
                                  <PersonOutlineIcon style={{ fontSize: 16 }} />
                                ))}
                            </div>
                            <div className="user-name-wrapper">
                              <div className="user-name-text">
                                {u.username || "-"}
                              </div>
                              {u.email ? (
                                <div className="user-email-text">{u.email}</div>
                              ) : null}
                            </div>
                          </div>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="mobile-cell">
                            {u.userMobile || "-"}
                          </span>
                        </AppTableCell>
                        <AppTableCell>
                          <AppBadge variant={getRoleBadgeVariant(u.role)}>
                            {u.role ? u.role.toUpperCase() : "STAFF"}
                          </AppBadge>
                        </AppTableCell>
                        <AppTableCell>
                          <AppBadge
                            variant={u.disabled ? "danger" : "completed"}
                          >
                            {u.disabled ? "Disabled" : "Active"}
                          </AppBadge>
                        </AppTableCell>
                        <AppTableCell
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          <div className="action-btns">
                            {userCanEdit && (
                              <AppButton
                                variant="warning"
                                size="sm"
                                square
                                className="action-btn--edit"
                                title="Edit User"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(u);
                                }}
                              >
                                <EditOutlinedIcon style={{ fontSize: 16 }} />
                              </AppButton>
                            )}
                            {userCanEdit && (
                              <AppButton
                                variant={u.disabled ? "success" : "danger"}
                                size="sm"
                                square
                                className={`action-btn--status ${u.disabled ? "action-btn--enable" : "action-btn--disable"}`}
                                title={
                                  isSuperAdminUser(u)
                                    ? "Super Admin cannot be disabled"
                                    : isSelf(u)
                                      ? "Cannot disable your own account"
                                      : u.disabled
                                        ? "Enable User Account"
                                        : "Disable User Account"
                                }
                                disabled={isSuperAdminUser(u) || isSelf(u)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStatusModal(u);
                                }}
                              >
                                {u.disabled ? (
                                  <CheckCircleOutlineIcon
                                    style={{ fontSize: 16 }}
                                  />
                                ) : (
                                  <BlockOutlinedIcon style={{ fontSize: 16 }} />
                                )}
                              </AppButton>
                            )}
                            {/* Expand / View More Details Button */}
                            <AppButton
                              variant="secondary"
                              size="sm"
                              square
                              className={`action-btn--more ${isExpanded ? "is-active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserExpand(u.id);
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

                      {/* Expandable View More Row with extra fields: Email, Address, Created At, Modified At */}
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
                                    Full Address
                                  </span>
                                </div>
                                <div className="tile-content">
                                  {u.userAddress ? (
                                    <span className="address-text">
                                      {u.userAddress}
                                    </span>
                                  ) : (
                                    <span className="empty-hint">-</span>
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
                                  {u.notes ? (
                                    <span className="note-text">{u.notes}</span>
                                  ) : (
                                    <span className="empty-hint">-</span>
                                  )}
                                </div>
                              </div>

                              {/* Created At Tile */}
                              <div className="expanded-tile">
                                <div className="tile-header">
                                  <CalendarTodayOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">Created At</span>
                                </div>
                                <div className="tile-content">
                                  <DateTimeCell
                                    value={u.rawCreatedAt || u.createdAt}
                                  />
                                </div>
                              </div>

                              {/* Modified At Tile */}
                              <div className="expanded-tile">
                                <div className="tile-header">
                                  <ScheduleOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">
                                    Modified At
                                  </span>
                                </div>
                                <div className="tile-content">
                                  <DateTimeCell
                                    value={u.rawUpdatedAt || u.updatedAt}
                                    modifiedFrom={u.rawCreatedAt || u.createdAt}
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
            count={filteredUsers.length}
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
        <div className="users-grid-wrapper">
          <div className="users-grid">
            {paginatedUsers.map((u) => {
              const initial = (
                u.username?.charAt(0) ||
                u.email?.charAt(0) ||
                "U"
              ).toUpperCase();

              return (
                <div
                  key={u.id}
                  className={`user-grid-card ${u.disabled ? "user-grid-card--disabled" : ""}`}
                >
                  <div className="card-top-accent" />
                  <div className="card-header">
                    <div className="user-avatar-circle">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.username}
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
                      {renderRoleBadge(u)}
                      <AppBadge variant={u.disabled ? "danger" : "completed"}>
                        {u.disabled ? "Disabled" : "Active"}
                      </AppBadge>
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">
                      {u.username || "Team Member"}
                    </h3>
                    {u.email ? (
                      <div className="card-subtitle-email">{u.email}</div>
                    ) : null}
                    <div className="card-info-rows">
                      <div className="info-item">
                        <PhoneIphoneOutlinedIcon style={{ fontSize: 14 }} />
                        <span>{u.userMobile || "-"}</span>
                      </div>
                      <div className="info-item">
                        <EmailOutlinedIcon style={{ fontSize: 14 }} />
                        <span className="truncate-text">{u.email || "-"}</span>
                      </div>
                      {u.userAddress && (
                        <div className="info-item">
                          <LocationOnOutlinedIcon style={{ fontSize: 14 }} />
                          <span className="truncate-text">{u.userAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="card-date">
                      <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                      <DateTimeCell value={u.rawCreatedAt || u.createdAt} />
                    </div>
                    <div className="action-btns">
                      {userCanEdit && (
                        <AppButton
                          variant="warning"
                          size="sm"
                          square
                          className="action-btn--edit"
                          title="Edit User"
                          onClick={() => handleOpenEditModal(u)}
                        >
                          <EditOutlinedIcon style={{ fontSize: 16 }} />
                        </AppButton>
                      )}
                      {userCanEdit && (
                        <AppButton
                          variant={u.disabled ? "success" : "danger"}
                          size="sm"
                          square
                          className={`action-btn--status ${u.disabled ? "action-btn--enable" : "action-btn--disable"}`}
                          title={
                            isSuperAdminUser(u)
                              ? "Super Admin cannot be disabled"
                              : isSelf(u)
                                ? "Cannot disable your own account"
                                : u.disabled
                                  ? "Enable User Account"
                                  : "Disable User Account"
                          }
                          disabled={isSuperAdminUser(u) || isSelf(u)}
                          onClick={() => handleOpenStatusModal(u)}
                        >
                          {u.disabled ? (
                            <CheckCircleOutlineIcon style={{ fontSize: 16 }} />
                          ) : (
                            <BlockOutlinedIcon style={{ fontSize: 16 }} />
                          )}
                        </AppButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="users-pagination-card">
            <AppTablePagination
              count={filteredUsers.length}
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
        <div className="users-card-list-wrapper">
          <div className="users-card-list">
            {paginatedUsers.map((u) => {
              const initial = (
                u.username?.charAt(0) ||
                u.email?.charAt(0) ||
                "U"
              ).toUpperCase();

              return (
                <div
                  key={u.id}
                  className={`user-detailed-card ${u.disabled ? "user-detailed-card--disabled" : ""}`}
                >
                  <div className="detailed-card-left">
                    <div className="user-avatar-circle user-avatar-circle-lg">
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt={u.username}
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
                        <h3 className="user-heading">
                          {u.username || "Team Member"}
                        </h3>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                          }}
                        >
                          {renderRoleBadge(u)}
                          <AppBadge
                            variant={u.disabled ? "danger" : "completed"}
                          >
                            {u.disabled ? "Disabled" : "Active"}
                          </AppBadge>
                        </div>
                      </div>
                      <p className="user-address-text">
                        <LocationOnOutlinedIcon style={{ fontSize: 15 }} />
                        {u.userAddress || "No physical address specified"}
                      </p>
                    </div>

                    <div className="detailed-card-meta">
                      <div className="meta-tile">
                        <span className="meta-label">Mobile</span>
                        <span className="meta-value">
                          {u.userMobile || "-"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Email Address</span>
                        <span className="meta-value truncate-text">
                          {u.email || "-"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Account Created</span>
                        <span className="meta-value">
                          <DateTimeCell value={u.rawCreatedAt || u.createdAt} />
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Last Modified</span>
                        <span className="meta-value">
                          <DateTimeCell
                            value={u.rawUpdatedAt || u.updatedAt}
                            modifiedFrom={u.rawCreatedAt || u.createdAt}
                          />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detailed-card-actions">
                    {userCanEdit && (
                      <AppButton
                        variant="warning"
                        size="sm"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => handleOpenEditModal(u)}
                      >
                        Edit User
                      </AppButton>
                    )}
                    {userCanEdit && (
                      <AppButton
                        variant={u.disabled ? "success" : "danger"}
                        size="sm"
                        startIcon={
                          u.disabled ? (
                            <CheckCircleOutlineIcon />
                          ) : (
                            <BlockOutlinedIcon />
                          )
                        }
                        disabled={isSuperAdminUser(u) || isSelf(u)}
                        onClick={() => handleOpenStatusModal(u)}
                      >
                        {u.disabled ? "Enable User" : "Disable User"}
                      </AppButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="users-pagination-card">
            <AppTablePagination
              count={filteredUsers.length}
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
      {/* Formik-Powered User Creation Modal Dialog */}
      {/* ========================================================================= */}
      <AppModal
        open={openModal}
        onClose={() => !formik.isSubmitting && setOpenModal(false)}
        title="Create New User"
        subtitle="Enter the user details below."
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setOpenModal(false)}
              disabled={formik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={formik.handleSubmit}
              loading={formik.isSubmitting}
            >
              Create User
            </AppButton>
          </>
        }
      >
        <form
          onSubmit={formik.handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <AppInput
            label="Full Name"
            required
            id="username"
            name="username"
            placeholder="e.g. Aparna"
            value={formik.values.username}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.username && formik.errors.username}
            disabled={formik.isSubmitting}
            startAdornment={<PersonOutlineIcon />}
          />

          <AppInput
            label="Mobile Number"
            required
            id="userMobile"
            name="userMobile"
            type="tel"
            placeholder="e.g. 9848012345"
            value={formik.values.userMobile}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.userMobile && formik.errors.userMobile}
            disabled={formik.isSubmitting}
            startAdornment={<PhoneIphoneOutlinedIcon />}
          />

          <AppInput
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="aparna@example.com"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
            disabled={formik.isSubmitting}
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Address"
            id="userAddress"
            name="userAddress"
            placeholder="e.g. Banjara Hills, Hyderabad"
            value={formik.values.userAddress}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.userAddress && formik.errors.userAddress}
            disabled={formik.isSubmitting}
            startAdornment={<LocationOnOutlinedIcon />}
          />

          <AppInput
            label="Notes (Optional)"
            id="notes"
            name="notes"
            placeholder="e.g. Special role instructions, remarks..."
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.notes && formik.errors.notes}
            disabled={formik.isSubmitting}
            multiline
            rows={2}
            startAdornment={<NotesOutlinedIcon />}
          />

          <AppInput
            select
            label="Assigned Role"
            required
            id="role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.role && formik.errors.role}
            disabled={formik.isSubmitting}
          >
            <option value={USER_ROLES.CLIENT}>Client (Default)</option>
            <option value={USER_ROLES.ADMIN}>
              Admin (Operations & Orders)
            </option>
            <option value={USER_ROLES.STAFF}>
              Staff (Pleating & Handling)
            </option>
          </AppInput>

          <AppInput
            label="Temporary Password (Locked to default)"
            required
            id="password"
            name="password"
            type="text"
            value="aparna"
            disabled={true}
            helperText="Temporary password is permanently locked to 'aparna' for all new accounts (cannot be edited)"
            startAdornment={<LockOutlinedIcon />}
          />
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* Formik-Powered User Edit Modal Dialog */}
      {/* ========================================================================= */}
      <AppModal
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        title="Edit User Details"
        subtitle="Modify user profile information and access permissions below."
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
            label="Full Name"
            required
            id="edit-username"
            name="username"
            placeholder="e.g. Ananya Sharma"
            value={editFormik.values.username}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={editFormik.touched.username && editFormik.errors.username}
            disabled={editFormik.isSubmitting}
            startAdornment={<PersonOutlineIcon />}
          />

          <AppInput
            label="Mobile Number"
            required
            id="edit-userMobile"
            name="userMobile"
            placeholder="e.g. 9848012345"
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
            placeholder="e.g. user@gmail.com"
            value={editFormik.values.email}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={editFormik.touched.email && editFormik.errors.email}
            helperText={
              selectedUser?.email?.toLowerCase() ===
              SUPERADMIN_EMAIL.toLowerCase()
                ? "Super Admin primary email is locked."
                : editFormik.touched.email && editFormik.errors.email
            }
            disabled={
              editFormik.isSubmitting ||
              selectedUser?.email?.toLowerCase() ===
                SUPERADMIN_EMAIL.toLowerCase()
            }
            startAdornment={<EmailOutlinedIcon />}
          />

          <AppInput
            label="Address"
            id="edit-userAddress"
            name="userAddress"
            placeholder="e.g. Banjara Hills, Hyderabad"
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
            placeholder="e.g. Special role instructions, remarks..."
            value={editFormik.values.notes}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={editFormik.touched.notes && editFormik.errors.notes}
            disabled={editFormik.isSubmitting}
            multiline
            rows={2}
            startAdornment={<NotesOutlinedIcon />}
          />

          {selectedUser?.email?.toLowerCase() ===
            SUPERADMIN_EMAIL.toLowerCase() ||
          selectedUser?.role === USER_ROLES.SUPERADMIN ? (
            <AppInput
              label="Assigned Role"
              disabled
              value="Superadmin (Immutable - Victory Ranjit)"
              helperText="Super Admin role is exclusive and permanent."
            />
          ) : (
            <AppInput
              select
              label="Assigned Role"
              required
              id="edit-role"
              name="role"
              value={editFormik.values.role}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={editFormik.touched.role && editFormik.errors.role}
              disabled={editFormik.isSubmitting}
            >
              <option value={USER_ROLES.CLIENT}>Client (Default)</option>
              <option value={USER_ROLES.ADMIN}>
                Admin (Operations & Orders)
              </option>
              <option value={USER_ROLES.STAFF}>
                Staff (Pleating & Handling)
              </option>
            </AppInput>
          )}
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* 3. Enable / Disable User Confirmation Modal Dialog                       */}
      {/* ========================================================================= */}
      <AppModal
        open={statusModalOpen}
        onClose={() => !updatingStatus && setStatusModalOpen(false)}
        title={
          userForStatusChange?.disabled
            ? "Enable User Account"
            : "Disable User Account"
        }
        subtitle={
          userForStatusChange?.disabled
            ? `Restore login and system access for ${userForStatusChange?.username || "this user"}`
            : `Temporarily suspend login and system access for ${userForStatusChange?.username || "this user"}`
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
              variant={userForStatusChange?.disabled ? "success" : "danger"}
              onClick={handleConfirmStatusToggle}
              loading={updatingStatus}
              startIcon={
                userForStatusChange?.disabled ? (
                  <CheckCircleOutlineIcon />
                ) : (
                  <BlockOutlinedIcon />
                )
              }
            >
              {userForStatusChange?.disabled ? "Enable User" : "Disable User"}
            </AppButton>
          </>
        }
      >
        <div className="status-modal-content">
          <p>
            {userForStatusChange?.disabled ? (
              <>
                Are you sure you want to <strong>enable</strong> access for{" "}
                <strong>{userForStatusChange?.username}</strong>
                {userForStatusChange?.email
                  ? ` (${userForStatusChange.email})`
                  : ""}
                ?
                <br />
                <br />
                The user will be able to log in and access system features
                again.
              </>
            ) : (
              <>
                Are you sure you want to <strong>disable</strong> access for{" "}
                <strong>{userForStatusChange?.username}</strong>
                {userForStatusChange?.email
                  ? ` (${userForStatusChange.email})`
                  : ""}
                ?
                <br />
                <br />
                The user will be prevented from logging in until re-enabled by
                an administrator.
              </>
            )}
          </p>
        </div>
      </AppModal>
    </div>
  );
};

export default Users;
