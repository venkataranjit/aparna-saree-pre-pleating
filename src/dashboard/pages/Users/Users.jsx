import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Tabs,
  Tab,
  Tooltip,
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../../auth/context/AuthContext";
import {
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
  getLocalUsers,
  createAuthUser,
  formatDateSafe,
} from "../../../firebase/dbService";
import { USER_ROLES, SUPERADMIN_EMAIL } from "../../../firebase/schema";
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
  } = useAuth();
  const userCanEdit =
    canEdit ??
    (isSuperAdmin ||
      role === USER_ROLES.ADMIN ||
      role === USER_ROLES.SUPERADMIN);
  const userCanDelete =
    canDelete ??
    (isSuperAdmin ||
      role === USER_ROLES.ADMIN ||
      role === USER_ROLES.SUPERADMIN);

  // Completely block customers from accessing the Manage Users route
  const userRole = (role || "").toLowerCase();
  const isCustomer =
    !isSuperAdmin && (userRole === "customer" || userRole === "");
  if (currentUser && isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState(() => getLocalUsers());
  const [loading, setLoading] = useState(() => getLocalUsers().length === 0);
  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Fetch all users directly from Firebase Firestore with local fallback
  const fetchUsers = async () => {
    try {
      let records = await getAllUsers();
      if (!records || records.length === 0) {
        records = getLocalUsers();
      }

      // Check if logged-in user is SuperAdmin (victoryranjit@gmail.com); if not in records, ensure SuperAdmin is included
      const loggedInEmail = (currentUser?.email || "").trim().toLowerCase();
      const isSuper = loggedInEmail === SUPERADMIN_EMAIL.toLowerCase();

      if (isSuper) {
        const foundSuper = records.find(
          (u) =>
            (u.email || "").trim().toLowerCase() ===
            SUPERADMIN_EMAIL.toLowerCase()
        );
        if (!foundSuper) {
          const superAdminRecord = {
            id: currentUser?.uid || "user-superadmin",
            username: currentUser?.displayName || "Victory Ranjit",
            email: SUPERADMIN_EMAIL,
            userMobile: currentUser?.phoneNumber || "",
            userAddress: "",
            role: USER_ROLES.SUPERADMIN,
            createdAt: new Date().toLocaleDateString("en-IN"),
          };
          updateUser(
            currentUser?.uid || "user-superadmin",
            superAdminRecord
          ).catch(() => {});
          records = [superAdminRecord, ...records];
        }
      }

      // Format records and enforce superadmin role immutability
      const normalized = records.map((u) => {
        const isSuperAdminEmail =
          (u.email || "").trim().toLowerCase() ===
          SUPERADMIN_EMAIL.toLowerCase();
        return {
          ...u,
          role: isSuperAdminEmail
            ? USER_ROLES.SUPERADMIN
            : u.role || USER_ROLES.CUSTOMER,
          createdAt: formatDateSafe(u.createdAt, "Recent"),
        };
      });

      setUsers(normalized);
    } catch (err) {
      console.warn("Failed to fetch users from Firestore:", err);
      const cached = getLocalUsers();
      if (cached && cached.length > 0) {
        setUsers(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If SuperAdmin is logged in and not yet in cache, immediately set SuperAdmin so table is not blank
    const loggedInEmail = (currentUser?.email || "").trim().toLowerCase();
    if (loggedInEmail === SUPERADMIN_EMAIL.toLowerCase()) {
      const cached = getLocalUsers();
      const exists = cached.some(
        (u) => (u.email || "").toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      );
      if (!exists) {
        const initialSuper = {
          id: currentUser?.uid || "user-superadmin",
          username: currentUser?.displayName || "Victory Ranjit",
          email: SUPERADMIN_EMAIL,
          userMobile: currentUser?.phoneNumber || "",
          userAddress: "",
          role: USER_ROLES.SUPERADMIN,
          createdAt: new Date().toLocaleDateString("en-IN"),
        };
        updateUser(currentUser?.uid || "user-superadmin", initialSuper).catch(
          () => {}
        );
        setUsers((prev) => (prev.length === 0 ? [initialSuper] : prev));
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentUser]);

  const handleOpenEdit = (user) => {
    if (!userCanEdit) return;
    setSelectedUser(user);
    setOpenEditModal(true);
  };

  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      username: selectedUser?.username || "",
      userMobile: selectedUser?.userMobile || "",
      email: selectedUser?.email || "",
      userAddress: selectedUser?.userAddress || "",
      role: selectedUser?.role || USER_ROLES.CUSTOMER,
    },
    validationSchema: editUserValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const isSuper = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();

        const updatePayload = {
          username: values.username.trim(),
          userMobile: String(values.userMobile).trim(),
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role: isSuper ? USER_ROLES.SUPERADMIN : values.role,
        };

        const updatedDoc = await updateUser(selectedUser.id, updatePayload);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ||
            (u.email && u.email.toLowerCase() === cleanEmail)
              ? { ...u, ...updatePayload, id: updatedDoc.id || u.id }
              : u
          )
        );

        if (cleanEmail === (currentUser?.email || "").toLowerCase()) {
          try {
            await refreshProfile();
          } catch (profErr) {
            console.warn("Profile refresh note:", profErr);
          }
        }

        setFeedback({
          type: "success",
          message: `User "${values.username.trim()}" was updated successfully in Firebase!`,
        });
        setOpenEditModal(false);
      } catch (err) {
        console.error("Update error:", err);
        setFeedback({
          type: "error",
          message: err.message || "Failed to update user details in Firebase.",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Formik user creation flow (Temporary password locked to "aparna")
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
        const isSuper = cleanEmail === SUPERADMIN_EMAIL.toLowerCase();

        // 1. Create real login credentials in Firebase Authentication with default locked password "aparna"
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
          // Fallback if offline/network error
          authUid = "user-" + Date.now();
        }

        // 2. Persist profile with the real Auth UID to Firestore and local cache
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
          createdAt: new Date().toLocaleDateString("en-IN"),
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

  // Delete user from Firebase and local state via custom confirmation popup
  const confirmDeleteUser = async () => {
    if (!userCanDelete || !userToDelete) return;
    const { id, name } = userToDelete;
    setDeletingUser(true);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setFeedback({
        type: "info",
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

  // Filtered users by tab & search query
  const filteredUsers = users.filter((u) => {
    const matchesTab =
      activeTab === "ALL" || u.role?.toLowerCase() === activeTab.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      u.username?.toLowerCase().includes(query) ||
      u.userMobile?.includes(query) ||
      u.email?.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.SUPERADMIN:
        return {
          bg: "rgba(168, 85, 247, 0.15)",
          color: "#c084fc",
          border: "#a855f7",
        };
      case USER_ROLES.ADMIN:
        return {
          bg: "rgba(212, 175, 55, 0.18)",
          color: "#e6d8a3",
          border: "#d4af37",
        };
      case USER_ROLES.STAFF:
        return {
          bg: "rgba(56, 189, 248, 0.15)",
          color: "#38bdf8",
          border: "#0284c7",
        };
      case USER_ROLES.CUSTOMER:
      default:
        return {
          bg: "rgba(255, 255, 255, 0.08)",
          color: "#d1d5db",
          border: "#6b7280",
        };
    }
  };

  return (
    <Box className="users-page">
      {/* Header section */}
      <Box className="users-page__header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            Manage Users
          </Typography>
          <Typography variant="body2" className="page-subtitle">
            Configure team members, staff permissions, and customer profiles
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon sx={{ color: "#d4af37" }} />}
            onClick={fetchUsers}
            disabled={loading}
            sx={{
              color: "#d4af37",
              borderColor: "rgba(212, 175, 55, 0.5)",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              "&:hover": {
                borderColor: "#d4af37",
                backgroundColor: "rgba(212, 175, 55, 0.1)",
              },
            }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="contained"
            startIcon={
              <PersonAddOutlinedIcon sx={{ color: "#000000 !important" }} />
            }
            className="create-user-btn"
            onClick={() => {
              setFeedback(null);
              setOpenModal(true);
            }}
          >
            Create New User
          </Button>
        </Box>
      </Box>

      {/* Global alert feedback */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          className="users-feedback-alert"
          sx={{ mb: 3 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Filter Tabs & Search Bar */}
      <Box className="users-page__toolbar">
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          className="role-filter-tabs"
        >
          <Tab label={`All (${users.length})`} value="ALL" />
          <Tab
            label={`Super Admins (${
              users.filter((u) => u.role === USER_ROLES.SUPERADMIN).length
            })`}
            value={USER_ROLES.SUPERADMIN}
          />
          <Tab
            label={`Admins (${
              users.filter((u) => u.role === USER_ROLES.ADMIN).length
            })`}
            value={USER_ROLES.ADMIN}
          />
          <Tab
            label={`Staff (${
              users.filter((u) => u.role === USER_ROLES.STAFF).length
            })`}
            value={USER_ROLES.STAFF}
          />
          <Tab
            label={`Customers (${
              users.filter((u) => u.role === USER_ROLES.CUSTOMER).length
            })`}
            value={USER_ROLES.CUSTOMER}
          />
        </Tabs>

        <TextField
          placeholder="Search by name, mobile, email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="users-search-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: "#d4af37" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Users Table Card */}
      <Card className="users-table-card">
        <TableContainer>
          <Table className="users-table">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Mobile Number</TableCell>
                <TableCell>Address / Location</TableCell>
                <TableCell>Assigned Role</TableCell>
                <TableCell>Created On</TableCell>
                <TableCell align="right" sx={{ minWidth: 160 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "#e6d8a3" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={32} sx={{ color: "#d4af37" }} />
                      <Typography variant="body2" sx={{ color: "#e6d8a3" }}>
                        Loading users from Firebase...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "#e6d8a3" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <PersonOutlineIcon
                        sx={{ fontSize: 40, color: "rgba(212, 175, 55, 0.4)" }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{ color: "#e6d8a3", fontWeight: 600 }}
                      >
                        {users.length === 0
                          ? "No users found in Firebase"
                          : "No users found matching your filter criteria"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(230, 216, 163, 0.6)" }}
                      >
                        {users.length === 0
                          ? 'Click "Create New User" to register a new user into Firebase.'
                          : "Try changing your search term or role filter."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadgeColor(u.role);
                  return (
                    <TableRow key={u.id} className="user-table-row">
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                          }}
                        >
                          <Box className="user-avatar-circle">
                            {u.username?.charAt(0).toUpperCase()}
                          </Box>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              className="user-name-text"
                            >
                              {u.username}
                            </Typography>
                            <Typography
                              variant="caption"
                              className="user-email-text"
                            >
                              {u.email || "No email specified"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell className="mobile-cell">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <PhoneIphoneOutlinedIcon
                            sx={{ fontSize: 16, color: "#d4af37" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {u.userMobile || "—"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell className="address-cell">
                        {u.userAddress || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.role?.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                      <TableCell className="date-cell">
                        {formatDateSafe(u.createdAt)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ whiteSpace: "nowrap", minWidth: 100 }}
                      >
                        {userCanEdit && (
                          <Tooltip title="Edit User" arrow>
                            <IconButton
                              aria-label="edit user"
                              size="small"
                              className="action-edit-btn"
                              onClick={() => handleOpenEdit(u)}
                              sx={{
                                color: "#d4af37 !important",
                                backgroundColor: "rgba(212, 175, 55, 0.08)",
                                border: "1px solid rgba(212, 175, 55, 0.3)",
                                borderRadius: "6px",
                                padding: "5px",
                                mr: 1,
                                "&:hover": {
                                  backgroundColor:
                                    "rgba(212, 175, 55, 0.22) !important",
                                  borderColor: "#d4af37 !important",
                                },
                              }}
                            >
                              <EditOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {userCanDelete && (
                          <Tooltip title="Delete User" arrow>
                            <IconButton
                              aria-label="delete user"
                              size="small"
                              className="action-delete-btn"
                              onClick={() =>
                                setUserToDelete({
                                  id: u.id,
                                  name: u.username || u.name || "User",
                                })
                              }
                              sx={{
                                color: "#ef4444 !important",
                                backgroundColor: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "6px",
                                padding: "5px",
                                "&:hover": {
                                  backgroundColor:
                                    "rgba(239, 68, 68, 0.22) !important",
                                  borderColor: "#ef4444 !important",
                                },
                              }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {!userCanEdit && !userCanDelete && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "rgba(230, 216, 163, 0.5)",
                              fontStyle: "italic",
                              px: 1,
                            }}
                          >
                            View Only
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ========================================================================= */}
      {/* Formik-Powered User Creation Modal Dialog */}
      {/* ========================================================================= */}
      <Dialog
        open={openModal}
        onClose={() => !formik.isSubmitting && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "create-user-dialog",
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShieldOutlinedIcon sx={{ color: "#d4af37" }} />
            <Typography
              variant="h6"
              component="span"
              sx={{ color: "#e6d8a3", fontWeight: 800 }}
            >
              Create New User
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOpenModal(false)}
            disabled={formik.isSubmitting}
            sx={{ color: "#e6d8a3" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <DialogContent className="dialog-content-body">
            <Typography
              variant="body2"
              sx={{ color: "rgba(230, 216, 163, 0.7)", mb: 2.5 }}
            >
              Enter the user details below.
            </Typography>

            {/* Username */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Full Name *</Typography>
              <TextField
                fullWidth
                id="username"
                name="username"
                placeholder="e.g. Ananya Sharma"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.username && Boolean(formik.errors.username)
                }
                helperText={formik.touched.username && formik.errors.username}
                disabled={formik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Mobile Number */}
            <Box className="form-field-wrap">
              <Typography className="field-label">
                Mobile Number * (10 Digits)
              </Typography>
              <TextField
                fullWidth
                id="userMobile"
                name="userMobile"
                type="tel"
                placeholder="e.g. 9848012345"
                value={formik.values.userMobile}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.userMobile && Boolean(formik.errors.userMobile)
                }
                helperText={
                  formik.touched.userMobile && formik.errors.userMobile
                }
                disabled={formik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Email Address */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Email Address *</Typography>
              <TextField
                fullWidth
                id="email"
                name="email"
                type="email"
                placeholder="ananya@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={formik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Role Select Dropdown */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Assigned Role *</Typography>
              <TextField
                select
                fullWidth
                id="role"
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.role && Boolean(formik.errors.role)}
                helperText={formik.touched.role && formik.errors.role}
                disabled={formik.isSubmitting}
                className="luxury-modal-field"
              >
                <MenuItem value={USER_ROLES.ADMIN}>
                  Admin (Operations & Orders)
                </MenuItem>
                <MenuItem value={USER_ROLES.STAFF}>
                  Staff (Pleating & Handling)
                </MenuItem>
                <MenuItem value={USER_ROLES.CUSTOMER}>
                  Customer (Default)
                </MenuItem>
              </TextField>
            </Box>

            {/* Address */}
            <Box className="form-field-wrap">
              <Typography className="field-label">
                Address / Location (Optional)
              </Typography>
              <TextField
                fullWidth
                id="userAddress"
                name="userAddress"
                placeholder="e.g. Banjara Hills, Hyderabad"
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
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Temporary Password (Locked to "aparna" and disabled) */}
            <Box className="form-field-wrap">
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography className="field-label">
                  Temporary Password *
                </Typography>
                <Chip
                  label="Locked to default"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.68rem",
                    backgroundColor: "rgba(212, 175, 55, 0.15)",
                    color: "#d4af37",
                    border: "1px solid rgba(212, 175, 55, 0.35)",
                    fontWeight: 700,
                  }}
                />
              </Box>
              <TextField
                fullWidth
                id="password"
                name="password"
                type="text"
                value="aparna"
                disabled={true}
                helperText="Temporary password is permanently locked to 'aparna' for all new accounts (cannot be edited)"
                className="luxury-modal-field"
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiInputBase-root.Mui-disabled": {
                    backgroundColor: "rgba(212, 175, 55, 0.06) !important",
                    borderColor: "rgba(212, 175, 55, 0.3) !important",
                  },
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: "#e6d8a3 !important",
                    color: "#e6d8a3 !important",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    cursor: "not-allowed",
                  },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenModal(false)}
              disabled={formik.isSubmitting}
              className="dialog-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              className="dialog-submit-btn"
            >
              {formik.isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "#000000" }} />
              ) : (
                "Create User"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================================= */}
      {/* Formik-Powered User Edit Modal Dialog */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "create-user-dialog",
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <EditOutlinedIcon sx={{ color: "#d4af37" }} />
            <Typography
              variant="h6"
              component="span"
              sx={{ color: "#e6d8a3", fontWeight: 800 }}
            >
              Edit User Details
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOpenEditModal(false)}
            disabled={editFormik.isSubmitting}
            sx={{ color: "#e6d8a3" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={editFormik.handleSubmit} noValidate>
          <DialogContent className="dialog-content-body">
            <Typography
              variant="body2"
              sx={{ color: "rgba(230, 216, 163, 0.7)", mb: 2.5 }}
            >
              Modify user profile information and access permissions below.
            </Typography>

            {/* Username */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Full Name *</Typography>
              <TextField
                fullWidth
                id="edit-username"
                name="username"
                placeholder="e.g. Ananya Sharma"
                value={editFormik.values.username}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={
                  editFormik.touched.username &&
                  Boolean(editFormik.errors.username)
                }
                helperText={
                  editFormik.touched.username && editFormik.errors.username
                }
                disabled={editFormik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Mobile Number */}
            <Box className="form-field-wrap">
              <Typography className="field-label">
                10-Digit Mobile Number *
              </Typography>
              <TextField
                fullWidth
                id="edit-userMobile"
                name="userMobile"
                placeholder="e.g. 9848012345"
                value={editFormik.values.userMobile}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={
                  editFormik.touched.userMobile &&
                  Boolean(editFormik.errors.userMobile)
                }
                helperText={
                  editFormik.touched.userMobile && editFormik.errors.userMobile
                }
                disabled={editFormik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIphoneOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Email */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Email Address *</Typography>
              <TextField
                fullWidth
                id="edit-email"
                name="email"
                type="email"
                placeholder="e.g. user@gmail.com"
                value={editFormik.values.email}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={
                  editFormik.touched.email && Boolean(editFormik.errors.email)
                }
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
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Role Select Dropdown */}
            <Box className="form-field-wrap">
              <Typography className="field-label">Assigned Role *</Typography>
              {selectedUser?.email?.toLowerCase() ===
                SUPERADMIN_EMAIL.toLowerCase() ||
              selectedUser?.role === USER_ROLES.SUPERADMIN ? (
                <TextField
                  fullWidth
                  disabled
                  value="Superadmin (Immutable - Victory Ranjit)"
                  className="luxury-modal-field"
                  helperText="Super Admin role is exclusive and permanent."
                />
              ) : (
                <TextField
                  select
                  fullWidth
                  id="edit-role"
                  name="role"
                  value={editFormik.values.role}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  error={
                    editFormik.touched.role && Boolean(editFormik.errors.role)
                  }
                  helperText={editFormik.touched.role && editFormik.errors.role}
                  disabled={editFormik.isSubmitting}
                  className="luxury-modal-field"
                >
                  <MenuItem value={USER_ROLES.ADMIN}>
                    Admin (Operations & Orders)
                  </MenuItem>
                  <MenuItem value={USER_ROLES.STAFF}>
                    Staff (Pleating & Handling)
                  </MenuItem>
                  <MenuItem value={USER_ROLES.CUSTOMER}>
                    Customer (Default)
                  </MenuItem>
                </TextField>
              )}
            </Box>

            {/* Address */}
            <Box className="form-field-wrap">
              <Typography className="field-label">
                Address / Location (Optional)
              </Typography>
              <TextField
                fullWidth
                id="edit-userAddress"
                name="userAddress"
                placeholder="e.g. Banjara Hills, Hyderabad"
                value={editFormik.values.userAddress}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={
                  editFormik.touched.userAddress &&
                  Boolean(editFormik.errors.userAddress)
                }
                helperText={
                  editFormik.touched.userAddress &&
                  editFormik.errors.userAddress
                }
                disabled={editFormik.isSubmitting}
                className="luxury-modal-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnOutlinedIcon sx={{ color: "#d4af37" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenEditModal(false)}
              disabled={editFormik.isSubmitting}
              className="dialog-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={editFormik.isSubmitting}
              className="dialog-submit-btn"
            >
              {editFormik.isSubmitting ? (
                <CircularProgress size={20} sx={{ color: "#000000" }} />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ========================================================================= */}
      {/* Custom Delete Confirmation Dialog Popup (No Browser window.confirm)       */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(userToDelete)}
        onClose={() => !deletingUser && setUserToDelete(null)}
        maxWidth="xs"
        fullWidth
        className="create-user-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Typography
            variant="h6"
            className="dialog-title"
            sx={{ color: "#f87171 !important" }}
          >
            Delete User Account
          </Typography>
          <IconButton
            onClick={() => !deletingUser && setUserToDelete(null)}
            sx={{ color: "#e6d8a3" }}
            disabled={deletingUser}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className="dialog-content-body">
          <Typography
            variant="body1"
            sx={{ color: "#e6d8a3", mb: 1.5, fontSize: "0.95rem" }}
          >
            Are you sure you want to remove user{" "}
            <strong style={{ color: "#d4af37" }}>
              "{userToDelete?.name || "this user"}"
            </strong>{" "}
            from Firebase?
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(230, 216, 163, 0.65)",
              display: "block",
              lineHeight: 1.5,
            }}
          >
            This will permanently remove the user from the database and
            invalidate their access.
          </Typography>
        </DialogContent>

        <DialogActions className="dialog-actions-bar">
          <Button
            onClick={() => setUserToDelete(null)}
            className="dialog-cancel-btn"
            disabled={deletingUser}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteUser}
            variant="contained"
            disabled={deletingUser}
            sx={{
              backgroundColor: "#dc2626 !important",
              color: "#ffffff !important",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              padding: "7px 20px",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3) !important",
              "&:hover": {
                backgroundColor: "#ef4444 !important",
              },
            }}
            startIcon={
              deletingUser ? (
                <CircularProgress size={16} sx={{ color: "#ffffff" }} />
              ) : null
            }
          >
            {deletingUser ? "Deleting..." : "Delete User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
