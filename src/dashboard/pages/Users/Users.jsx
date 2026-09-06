import React, { useState, useEffect, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
  getLocalUsers,
  createAuthUser,
  checkUserUniqueness,
  formatDateSafe,
  formatModifiedDate,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
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
} from "../../../components/common";
import "./Users.scss";

/**
 * Formik Validation Schema using Yup
 */
const userValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .required("User Name is required"),
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
  role: Yup.string().required("Role selection is required"),
});

const Users = () => {
  const {
    currentUser,
    refreshProfile,
    role,
    isSuperAdmin,
    canEdit,
    canDelete,
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
  const userCanDelete =
    canDelete ?? (isSuperAdmin || userRoleLower === "superadmin");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Sorting and Pagination states
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
    setPage(0);
  };

  // Load all users from Firestore with local cache fallback
  const fetchUsers = async () => {
    if (!hasAccessToUsers) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAllUsers();
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        const local = getLocalUsers();
        setUsers(local);
      }
    } catch (err) {
      console.warn("Could not fetch remote users, using cached users:", err);
      const local = getLocalUsers();
      setUsers(local);
      setFeedback({
        type: "error",
        message: "Using offline cached users. Check Firebase connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccessToUsers) {
      fetchUsers();
    }
  }, [hasAccessToUsers]);

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    editFormik.setValues({
      username: user.username || "",
      userMobile: user.userMobile || "",
      email: user.email || "",
      userAddress: user.userAddress || "",
      role: user.role || USER_ROLES.STAFF,
    });
    setOpenEditModal(true);
  };

  const editFormik = useFormik({
    initialValues: {
      username: "",
      userMobile: "",
      email: "",
      userAddress: "",
      role: USER_ROLES.STAFF,
    },
    validationSchema: editUserValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      if (!selectedUser) return;
      setFeedback(null);
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
              "This email address is already registered."
            );
            editFormik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            editFormik.setFieldError(
              "userMobile",
              "This mobile number is already registered."
            );
            editFormik.setFieldTouched("userMobile", true, false);
          }
          setFeedback({
            type: "error",
            message: uniqueness.message,
          });
          setSubmitting(false);
          return;
        }

        const updatedFields = {
          username: values.username.trim(),
          userMobile: cleanMobile,
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role:
            selectedUser.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
              ? USER_ROLES.SUPERADMIN
              : values.role,
        };

        await updateUser(selectedUser.id, updatedFields);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, ...updatedFields } : u
          )
        );

        if (currentUser?.uid === selectedUser.id) {
          if (refreshProfile) refreshProfile();
        }

        setFeedback({
          type: "success",
          message: `User "${values.username}" updated successfully!`,
        });
        setOpenEditModal(false);
      } catch (err) {
        console.error("Error updating user:", err);
        setFeedback({
          type: "error",
          message:
            "Failed to update user: " + (err.message || "Please try again."),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      userMobile: "",
      email: "",
      userAddress: "",
      role: USER_ROLES.STAFF,
      password: "aparna",
    },
    validationSchema: userValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setFeedback(null);
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
              "This email address is already registered."
            );
            formik.setFieldTouched("email", true, false);
          }
          if (uniqueness.mobileExists) {
            formik.setFieldError(
              "userMobile",
              "This mobile number is already registered."
            );
            formik.setFieldTouched("userMobile", true, false);
          }
          setFeedback({
            type: "error",
            message: uniqueness.message,
          });
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
            setFeedback({
              type: "error",
              message: `The email "${cleanEmail}" is already registered in Firebase Authentication.`,
            });
            setSubmitting(false);
            return;
          } else if (authErr.code === "auth/weak-password") {
            setFeedback({
              type: "error",
              message: "Temporary password must be at least 6 characters long.",
            });
            setSubmitting(false);
            return;
          } else if (authErr.code === "auth/invalid-email") {
            setFeedback({
              type: "error",
              message: "Invalid email address format.",
            });
            setSubmitting(false);
            return;
          }
          authUid = "user-" + Date.now();
        }

        const newUserPayload = {
          id: authUid,
          username: values.username.trim(),
          email: cleanEmail,
          userMobile: String(values.userMobile).trim(),
          userAddress: values.userAddress.trim(),
          role: isSuper ? USER_ROLES.SUPERADMIN : values.role,
        };

        await updateUser(authUid, newUserPayload);

        const newUserItem = {
          ...newUserPayload,
          createdAt: formatDateSafe(new Date()),
        };

        setUsers((prev) => [
          newUserItem,
          ...prev.filter(
            (u) =>
              u.id !== authUid && (u.email || "").toLowerCase() !== cleanEmail
          ),
        ]);

        setFeedback({
          type: "success",
          message: `User "${values.username}" successfully registered in Firebase! They can now log in with email "${cleanEmail}" and default password "aparna".`,
        });
        resetForm({
          values: {
            username: "",
            userMobile: "",
            email: "",
            userAddress: "",
            role: USER_ROLES.STAFF,
            password: "aparna",
          },
        });
        setOpenModal(false);
      } catch (err) {
        console.error("Error creating user:", err);
        setFeedback({
          type: "error",
          message:
            "Failed to create user: " + (err.message || "Please try again."),
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const confirmDeleteUser = async () => {
    if (!userCanDelete || !userToDelete) return;
    const { id, name } = userToDelete;
    setDeletingUser(true);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setFeedback({
        type: "success",
        message: `User "${name}" has been removed from Firebase.`,
      });
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setFeedback({
        type: "error",
        message:
          "Failed to delete user: " + (err.message || "Permission denied"),
      });
    } finally {
      setDeletingUser(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesTab =
        activeTab === "ALL" ||
        u.role?.toLowerCase() === activeTab.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        u.username?.toLowerCase().includes(query) ||
        u.userMobile?.includes(query) ||
        u.email?.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal = a[sortField] ?? "";
      let bVal = b[sortField] ?? "";

      if (sortField === "createdAt" || sortField === "updatedAt") {
        const aTime = aVal?.toDate
          ? aVal.toDate().getTime()
          : new Date(aVal || 0).getTime() || 0;
        const bTime = bVal?.toDate
          ? bVal.toDate().getTime()
          : new Date(bVal || 0).getTime() || 0;
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredUsers, sortField, sortDirection]);

  const paginatedUsers = useMemo(() => {
    return sortedUsers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedUsers, page, rowsPerPage]);

  // Restrict access: only Super Admin and Admin can access the Users screen.
  // Staff and Customers are redirected immediately to /dashboard.
  if (!hasAccessToUsers) {
    return <Navigate to="/dashboard" replace />;
  }

  const roleTabs = [
    { label: `All (${users.length})`, value: "ALL" },
    {
      label: `Super Admins (${
        users.filter((u) => u.role === USER_ROLES.SUPERADMIN).length
      })`,
      value: USER_ROLES.SUPERADMIN,
    },
    {
      label: `Admins (${
        users.filter((u) => u.role === USER_ROLES.ADMIN).length
      })`,
      value: USER_ROLES.ADMIN,
    },
    {
      label: `Staff (${
        users.filter((u) => u.role === USER_ROLES.STAFF).length
      })`,
      value: USER_ROLES.STAFF,
    },
    {
      label: `Customers (${
        users.filter((u) => u.role === USER_ROLES.CUSTOMER).length
      })`,
      value: USER_ROLES.CUSTOMER,
    },
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
          icon={<ShieldOutlinedIcon style={{ fontSize: 13 }} />}
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
    return <AppBadge variant="customer">Customer</AppBadge>;
  };

  return (
    <div className="users-page">
      {/* Header section */}
      <div className="users-page__header">
        <div>
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">
            Configure team members, staff permissions, and customer profiles
          </p>
        </div>
        <div className="header-actions">
          <AppButton
            variant="secondary"
            size="md"
            startIcon={<RefreshOutlinedIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            startIcon={<PersonAddOutlinedIcon />}
            className="create-user-btn"
            onClick={() => {
              setFeedback(null);
              setOpenModal(true);
            }}
          >
            Create New User
          </AppButton>
        </div>
      </div>

      {/* Global alert feedback */}
      {feedback && (
        <div
          className={`users-feedback-alert users-feedback-alert--${feedback.type}`}
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

      {/* Filter Tabs & Search Bar */}
      <div className="users-page__toolbar">
        <AppTabs
          tabs={roleTabs}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
        />

        <div className="users-search-field">
          <AppInput
            placeholder="Search by name, mobile, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="users-table-card">
        <AppTableContainer className="table-responsive">
          <AppTable className="users-table">
            <AppTableHead>
              <AppTableRow>
                <AppTableCell head>
                  <AppTableSortLabel
                    active={sortField === "username"}
                    direction={sortField === "username" ? sortDirection : "asc"}
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
                    active={sortField === "userAddress"}
                    direction={
                      sortField === "userAddress" ? sortDirection : "asc"
                    }
                    onClick={() => handleRequestSort("userAddress")}
                  >
                    Address
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
                    active={sortField === "createdAt"}
                    direction={
                      sortField === "createdAt" ? sortDirection : "asc"
                    }
                    onClick={() => handleRequestSort("createdAt")}
                  >
                    Created On
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head>
                  <AppTableSortLabel
                    active={sortField === "updatedAt"}
                    direction={
                      sortField === "updatedAt" ? sortDirection : "asc"
                    }
                    onClick={() => handleRequestSort("updatedAt")}
                  >
                    Modified On
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head style={{ textAlign: "right", minWidth: 100 }}>
                  Actions
                </AppTableCell>
              </AppTableRow>
            </AppTableHead>
            <AppTableBody>
              {loading ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={7}
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
                        Loading users from Firebase...
                      </span>
                    </div>
                  </AppTableCell>
                </AppTableRow>
              ) : filteredUsers.length === 0 ? (
                <AppTableRow>
                  <AppTableCell colSpan={7} className="empty-state-cell">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <PersonOutlineIcon
                        style={{
                          fontSize: 40,
                          color: "rgba(212, 175, 55, 0.4)",
                        }}
                      />
                      <span style={{ color: "#e6d8a3", fontWeight: 600 }}>
                        {users.length === 0
                          ? "No users found in Firebase"
                          : "No users found matching your filter criteria"}
                      </span>
                      <span
                        style={{
                          color: "rgba(230, 216, 163, 0.6)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {users.length === 0
                          ? 'Click "Create New User" to register a new user into Firebase.'
                          : "Try changing your search term or role filter."}
                      </span>
                    </div>
                  </AppTableCell>
                </AppTableRow>
              ) : (
                paginatedUsers.map((u) => {
                  return (
                    <AppTableRow key={u.id} className="user-table-row">
                      <AppTableCell>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div className="user-avatar-circle">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name-text">{u.username}</div>
                            <div className="user-email-text">
                              {u.email || "No email specified"}
                            </div>
                          </div>
                        </div>
                      </AppTableCell>
                      <AppTableCell className="mobile-cell">
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
                            {u.userMobile || "—"}
                          </span>
                        </div>
                      </AppTableCell>
                      <AppTableCell className="address-cell">
                        {u.userAddress || "—"}
                      </AppTableCell>
                      <AppTableCell>{renderRoleBadge(u)}</AppTableCell>
                      <AppTableCell className="date-cell">
                        {formatDateSafe(u.createdAt)}
                      </AppTableCell>
                      <AppTableCell className="date-cell">
                        {formatModifiedDate(u.updatedAt, u.createdAt)}
                      </AppTableCell>
                      <AppTableCell
                        style={{ textAlign: "right", whiteSpace: "nowrap" }}
                      >
                        <div className="action-btns">
                          {userCanEdit && (
                            <AppButton
                              variant="secondary"
                              size="sm"
                              title="Edit User"
                              onClick={() => handleOpenEdit(u)}
                            >
                              <EditOutlinedIcon style={{ fontSize: 16 }} />
                            </AppButton>
                          )}
                          {userCanDelete && (
                            <AppButton
                              variant="danger"
                              size="sm"
                              title="Delete User"
                              onClick={() =>
                                setUserToDelete({
                                  id: u.id,
                                  name: u.username || u.name || "User",
                                })
                              }
                            >
                              <DeleteOutlineIcon style={{ fontSize: 16 }} />
                            </AppButton>
                          )}
                          {!userCanEdit && !userCanDelete && (
                            <span
                              style={{
                                color: "rgba(230, 216, 163, 0.5)",
                                fontStyle: "italic",
                                padding: "0 8px",
                                fontSize: "0.78rem",
                              }}
                            >
                              View Only
                            </span>
                          )}
                        </div>
                      </AppTableCell>
                    </AppTableRow>
                  );
                })
              )}
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
            label="Mobile Number (10 Digits)"
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
            required
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
            <option value={USER_ROLES.ADMIN}>
              Admin (Operations & Orders)
            </option>
            <option value={USER_ROLES.STAFF}>
              Staff (Pleating & Handling)
            </option>
            <option value={USER_ROLES.CUSTOMER}>Customer (Default)</option>
          </AppInput>

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
            label="10-Digit Mobile Number"
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
            required
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
              <option value={USER_ROLES.ADMIN}>
                Admin (Operations & Orders)
              </option>
              <option value={USER_ROLES.STAFF}>
                Staff (Pleating & Handling)
              </option>
              <option value={USER_ROLES.CUSTOMER}>Customer (Default)</option>
            </AppInput>
          )}

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
        </form>
      </AppModal>

      {/* ========================================================================= */}
      {/* Custom Delete Confirmation Dialog Popup                                   */}
      {/* ========================================================================= */}
      <AppModal
        open={Boolean(userToDelete)}
        onClose={() => !deletingUser && setUserToDelete(null)}
        title="Delete User Account"
        maxWidth="xs"
        actions={
          <>
            <AppButton
              variant="secondary"
              onClick={() => setUserToDelete(null)}
              disabled={deletingUser}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={confirmDeleteUser}
              loading={deletingUser}
            >
              Delete User
            </AppButton>
          </>
        }
      >
        <p
          style={{
            color: "#e6d8a3",
            fontSize: "0.95rem",
            marginBottom: 12,
            marginTop: 0,
          }}
        >
          Are you sure you want to remove user{" "}
          <strong style={{ color: "#d4af37" }}>
            "{userToDelete?.name || "this user"}"
          </strong>{" "}
          from Firebase?
        </p>
        <p
          style={{
            color: "rgba(230, 216, 163, 0.65)",
            fontSize: "0.82rem",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          This will permanently remove the user from the database and invalidate
          their access.
        </p>
      </AppModal>
    </div>
  );
};

export default Users;
