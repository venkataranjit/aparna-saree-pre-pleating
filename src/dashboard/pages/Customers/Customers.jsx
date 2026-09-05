import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
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
  Tooltip,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import SquareFootOutlinedIcon from '@mui/icons-material/SquareFootOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StatCard from '../../components/StatCard/StatCard';
import { useAuth } from '../../../auth/context/AuthContext';
import {
  getAllUsers,
  createUser,
  updateUser,
  getLocalUsers,
  getAllMeasurements,
  createCustomerMeasurement,
  updateMeasurement,
  deleteCustomerMeasurement,
  formatDateSafe,
} from '../../../firebase/dbService';
import { USER_ROLES, SUPERADMIN_EMAIL } from '../../../firebase/schema';
import './Customers.scss';

// Validation schema for creating or editing a customer
const customerValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .required('Customer Name is required'),
  userMobile: Yup.string()
    .trim()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .required('Mobile Number is required'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address')
    .required('Email Address is required'),
  userAddress: Yup.string().trim().max(150, 'Address cannot exceed 150 characters'),
});

const DRESS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'];

// Validation schema for adding/editing a measurement profile with strict validation
const measurementValidationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, 'Measurement title must be at least 2 characters')
    .max(60, 'Title cannot exceed 60 characters')
    .required('Measurement title is required (e.g. Bridal Silk Saree)'),
  pallu: Yup.string()
    .trim()
    .test('is-valid-pallu', 'Pallu length must be a valid positive number (e.g. 38 or 38.5)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 200;
    }),
  shoulderToRightTight: Yup.string()
    .trim()
    .test('is-valid-shoulder', 'Shoulder measurement must be a valid positive number (e.g. 14)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 100;
    }),
  chest: Yup.string()
    .trim()
    .test('is-valid-chest', 'Chest size must be a valid positive number (e.g. 36)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 100;
    }),
  hip: Yup.string()
    .trim()
    .test('is-valid-hip', 'Hip size must be a valid positive number (e.g. 40)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 120;
    }),
  firstPleatSize: Yup.string()
    .trim()
    .test('is-valid-pleat', 'First pleat size must be a valid positive number (e.g. 5.5)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 50;
    }),
  noOfChestPleats: Yup.string()
    .trim()
    .test('is-valid-pleats-count', 'Chest pleats count must be a positive integer (e.g. 5)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && Number.isInteger(num) && num > 0 && num <= 30;
    }),
  height: Yup.string()
    .trim()
    .test('is-valid-height', 'Height must be a valid positive number (e.g. 150 or 5.5)', (val) => {
      if (!val) return true;
      const num = Number(val);
      return !Number.isNaN(num) && num > 0 && num <= 300;
    }),
  dressSize: Yup.string()
    .trim()
    .oneOf(DRESS_SIZES, 'Please select a valid dress size'),
  notes: Yup.string()
    .trim()
    .max(300, 'Notes cannot exceed 300 characters'),
});

const Customers = () => {
  const { currentUser, userProfile, role, isSuperAdmin, canEdit, canDelete } = useAuth();
  const userRole = (role || '').toLowerCase();
  const isCustomer = !isSuperAdmin && (userRole === USER_ROLES.CUSTOMER || userRole === 'customer' || userRole === '');
  const userCanEdit = canEdit ?? (isSuperAdmin || userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPERADMIN);
  const userCanDelete = canDelete ?? (isSuperAdmin || userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.SUPERADMIN);

  // If customer accesses Customers screen, redirect to /dashboard
  if (isCustomer) {
    return <Navigate to="/dashboard" replace />;
  }

  const [customers, setCustomers] = useState([]);
  const [measurementsMap, setMeasurementsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

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
  const [measureToDelete, setMeasureToDelete] = useState(null); // In-app confirmation popup

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
            const email = (u.email || '').toLowerCase().trim();
            if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
            const r = (u.role || '').toLowerCase();
            if (r === USER_ROLES.SUPERADMIN || r === USER_ROLES.ADMIN || r === USER_ROLES.STAFF) {
              return false;
            }
            return true;
          })
          .map((u) => ({
            ...u,
            role: USER_ROLES.CUSTOMER,
            createdAt: formatDateSafe(u.createdAt, 'Recent'),
          }));
        setCustomers(onlyCustomers);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.warn('Error fetching customers from Firebase:', err);
      const cached = getLocalUsers().filter((u) => {
        const email = (u.email || '').toLowerCase().trim();
        if (email === SUPERADMIN_EMAIL.toLowerCase()) return false;
        const r = (u.role || '').toLowerCase();
        return r !== USER_ROLES.SUPERADMIN && r !== USER_ROLES.ADMIN && r !== USER_ROLES.STAFF;
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
      username: selectedCustomer?.username || '',
      userMobile: selectedCustomer?.userMobile || '',
      email: selectedCustomer?.email || '',
      userAddress: selectedCustomer?.userAddress || '',
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const updatePayload = {
          username: values.username.trim(),
          userMobile: String(values.userMobile).trim(),
          email: cleanEmail,
          userAddress: values.userAddress.trim(),
          role: USER_ROLES.CUSTOMER,
        };

        const updatedDoc = await updateUser(selectedCustomer.id, updatePayload);

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === selectedCustomer.id || (c.email && c.email.toLowerCase() === cleanEmail)
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
          type: 'success',
          message: `Customer "${values.username.trim()}" updated successfully!`,
        });
        setOpenEditModal(false);
      } catch (err) {
        console.error('Update customer error:', err);
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to update customer.',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Create Customer Formik
  const createFormik = useFormik({
    initialValues: {
      username: '',
      userMobile: '',
      email: '',
      userAddress: '',
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setFeedback(null);
      try {
        const cleanEmail = values.email.trim().toLowerCase();
        const newCustomerData = {
          username: values.username.trim(),
          email: cleanEmail,
          userMobile: String(values.userMobile).trim(),
          userAddress: values.userAddress.trim(),
          role: USER_ROLES.CUSTOMER,
        };

        const created = await createUser(newCustomerData);
        setCustomers((prev) => [
          {
            ...newCustomerData,
            id: created.id,
            createdAt: new Date().toLocaleDateString('en-IN'),
          },
          ...prev,
        ]);

        setFeedback({
          type: 'success',
          message: `Customer "${values.username.trim()}" registered successfully!`,
        });
        resetForm();
        setDialogOpen(false);
      } catch (err) {
        console.error('Customer registration error:', err);
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to create customer record.',
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
        : 'Standard Saree Pleats',
      pallu: '',
      shoulderToRightTight: '',
      chest: '',
      hip: '',
      firstPleatSize: '',
      noOfChestPleats: '',
      height: '',
      dressSize: 'M',
      notes: '',
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setFeedback(null);
      try {
        const customerId = customerForMeasure?.id;
        if (!customerId) throw new Error('Customer ID is required to record measurements.');

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

        // Update local measurements state
        setMeasurementsMap((prev) => {
          const userList = prev[customerId] ? [...prev[customerId]] : [];
          return {
            ...prev,
            [customerId]: [saved, ...userList],
          };
        });

        setFeedback({
          type: 'success',
          message: `Measurement profile "${values.title.trim()}" added successfully for ${customerForMeasure.username}!`,
        });
        resetForm();
        setOpenAddMeasureModal(false);
      } catch (err) {
        console.error('Add measurement error:', err);
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to save measurement profile.',
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
      title: selectedMeasureForEdit?.title || '',
      // Convert numeric values (stored by old sanitizeMeasure) to strings for text inputs
      pallu: selectedMeasureForEdit?.pallu != null ? String(selectedMeasureForEdit.pallu) : '',
      shoulderToRightTight: selectedMeasureForEdit?.shoulderToRightTight != null
        ? String(selectedMeasureForEdit.shoulderToRightTight) : '',
      chest: selectedMeasureForEdit?.chest != null ? String(selectedMeasureForEdit.chest) : '',
      hip: selectedMeasureForEdit?.hip != null ? String(selectedMeasureForEdit.hip) : '',
      firstPleatSize: selectedMeasureForEdit?.firstPleatSize != null
        ? String(selectedMeasureForEdit.firstPleatSize) : '',
      noOfChestPleats: selectedMeasureForEdit?.noOfChestPleats != null
        ? String(selectedMeasureForEdit.noOfChestPleats) : '',
      height: selectedMeasureForEdit?.height != null ? String(selectedMeasureForEdit.height) : '',
      dressSize: selectedMeasureForEdit?.dressSize || 'M',
      notes: selectedMeasureForEdit?.notes || '',
    },
    validationSchema: measurementValidationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setFeedback(null);
      try {
        if (!selectedMeasureForEdit?.id) throw new Error('Measurement ID is required to update.');
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
          notes: values.notes?.trim() || '',
        };

        const updatedRecord = await updateMeasurement(selectedMeasureForEdit.id, updatePayload);

        // Update local measurements state with the returned updated record
        setMeasurementsMap((prev) => {
          const userList = prev[customerId] ? [...prev[customerId]] : [];
          return {
            ...prev,
            [customerId]: userList.map((m) =>
              m.id === selectedMeasureForEdit.id
                ? { ...m, ...updatePayload, ...(typeof updatedRecord === 'object' && updatedRecord !== null ? updatedRecord : {}) }
                : m
            ),
          };
        });

        setFeedback({
          type: 'success',
          message: `Measurement profile "${values.title.trim()}" updated successfully!`,
        });
        setOpenEditMeasureModal(false);
        setSelectedMeasureForEdit(null);
      } catch (err) {
        console.error('Update measurement error:', err);
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to update measurement profile.',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Confirm and execute measurement deletion from custom popup (no browser alert/confirm)
  const confirmDeleteMeasurement = async () => {
    if (!userCanDelete || !measureToDelete) return;
    const { id: measurementId, userId: customerId, title } = measureToDelete;
    setDeletingMeasureId(measurementId);
    try {
      await deleteCustomerMeasurement(measurementId);
      setMeasurementsMap((prev) => {
        const userList = (prev[customerId] || []).filter((m) => m.id !== measurementId);
        return {
          ...prev,
          [customerId]: userList,
        };
      });
      setFeedback({
        type: 'success',
        message: `Measurement profile "${title || 'Profile'}" removed successfully.`,
      });
      setMeasureToDelete(null);
    } catch (err) {
      console.error('Delete measurement error:', err);
      setFeedback({
        type: 'error',
        message: 'Failed to delete measurement profile.',
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
        (item.username || '').toLowerCase().includes(term) ||
        (item.email || '').toLowerCase().includes(term) ||
        (item.userMobile || '').includes(term) ||
        (item.userAddress || '').toLowerCase().includes(term);

      const hasMeasurements = (measurementsMap[item.id] || []).length > 0;
      const matchesTab =
        activeTab === 'ALL' ||
        (activeTab === 'MEASURED' && hasMeasurements) ||
        (activeTab === 'PENDING' && !hasMeasurements);

      return matchesSearch && matchesTab;
    });
  }, [customers, searchTerm, activeTab, measurementsMap]);

  // Metrics calculations
  const totalCustomersCount = customers.length;
  const customersWithMeasurements = useMemo(() => {
    return customers.filter((c) => (measurementsMap[c.id] || []).length > 0).length;
  }, [customers, measurementsMap]);
  const pendingMeasurementsCount = totalCustomersCount - customersWithMeasurements;
  const totalMeasurementsCount = useMemo(() => {
    return Object.values(measurementsMap).reduce((acc, list) => acc + (list?.length || 0), 0);
  }, [measurementsMap]);

  return (
    <Box className="customers-page">
      {/* Top Header matching Dashboard and Users */}
      <Box className="customers-page__header">
        <Box>
          <Typography variant="h4" component="h1" className="page-title">
            Customers
          </Typography>
          <Typography variant="body2" className="page-subtitle">
            View customer profiles, contact info, and manage tailoring measurements
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} className="header-actions">
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon sx={{ color: '#d4af37' }} />}
            onClick={fetchCustomers}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>

          <Button
            variant="contained"
            startIcon={<PersonAddOutlinedIcon sx={{ color: '#000000 !important' }} />}
            onClick={() => {
              setFeedback(null);
              setDialogOpen(true);
            }}
            className="create-customer-btn"
          >
            Add Customer
          </Button>
        </Stack>
      </Box>

      {/* Global Alert Feedback */}
      {feedback && (
        <Alert
          severity={feedback.type}
          onClose={() => setFeedback(null)}
          className="customers-feedback-alert"
          sx={{ mb: 3 }}
        >
          {feedback.message}
        </Alert>
      )}

      {/* 4 StatCards matching Dashboard Overview Grid */}
      <Box className="customers-page__stats-grid">
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
          change={totalCustomersCount > 0 ? `${Math.round((customersWithMeasurements / totalCustomersCount) * 100)}% Profile Rate` : '0%'}
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
          trendType={pendingMeasurementsCount > 0 ? 'progress' : 'completed'}
          icon={<StraightenOutlinedIcon />}
        />
      </Box>

      {/* Filter Tabs & Search Bar matching Manage Users Toolbar */}
      <Box className="customers-page__toolbar">
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          className="customer-filter-tabs"
        >
          <Tab label={`All Customers (${customers.length})`} value="ALL" />
          <Tab label={`With Measurements (${customersWithMeasurements})`} value="MEASURED" />
          <Tab label={`Pending (${pendingMeasurementsCount})`} value="PENDING" />
        </Tabs>

        <TextField
          placeholder="Search by name, mobile, email, address..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="customers-search-field"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: '#d4af37' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: '#e6d8a3' }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Main Customers Table Card matching Users.jsx */}
      <Card className="customers-table-card">
        <TableContainer>
          <Table className="customers-table">
            <TableHead>
              <TableRow>
                <TableCell>CUSTOMER</TableCell>
                <TableCell>CONTACT DETAILS</TableCell>
                <TableCell>DELIVERY ADDRESS</TableCell>
                <TableCell align="center">MEASUREMENTS</TableCell>
                <TableCell>JOINED DATE</TableCell>
                <TableCell align="right" sx={{ minWidth: 140 }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#e6d8a3' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <CircularProgress size={32} sx={{ color: '#d4af37' }} />
                      <Typography variant="body2" sx={{ color: '#e6d8a3' }}>
                        Loading customer directory...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="empty-state-cell">
                    <PeopleOutlineIcon sx={{ fontSize: 44, color: '#d4af37', opacity: 0.5, mb: 1 }} />
                    <Typography variant="body1" sx={{ color: '#e6d8a3', fontWeight: 600 }}>
                      No customers found matching your criteria.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(230, 216, 163, 0.6)', mt: 0.5 }}>
                      Click "Add Customer" to create the first client profile.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((user) => {
                  const initial = (user.username?.charAt(0) || user.email?.charAt(0) || 'C').toUpperCase();
                  const userMeasures = measurementsMap[user.id] || [];
                  const measureCount = userMeasures.length;

                  return (
                    <TableRow key={user.id} className="customer-table-row">
                      {/* Customer Avatar & Name matching Users.jsx */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box className="user-avatar-circle">{initial}</Box>
                          <Box>
                            <Typography className="user-name-text">{user.username || 'Customer'}</Typography>
                            <Typography variant="caption" className="user-email-text" sx={{ display: 'block' }}>
                              {user.email || 'No email registered'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Contact Details */}
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                          <Typography className="mobile-cell">
                            <PhoneIphoneOutlinedIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle', color: '#d4af37' }} />
                            {user.userMobile ? `+91 ${user.userMobile}` : '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Address */}
                      <TableCell>
                        <Typography className="address-cell">
                          {user.userAddress ? (
                            <>
                              <LocationOnOutlinedIcon sx={{ fontSize: 13, mr: 0.5, verticalAlign: 'middle', color: '#d4af37' }} />
                              {user.userAddress}
                            </>
                          ) : (
                            '—'
                          )}
                        </Typography>
                      </TableCell>

                      {/* Measurements Chip */}
                      <TableCell align="center">
                        <Tooltip title="Click to view all measurements for this customer" arrow>
                          <Chip
                            icon={<StraightenOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                            label={measureCount > 0 ? `${measureCount} ${measureCount === 1 ? 'Profile' : 'Profiles'}` : 'No Measurements'}
                            size="small"
                            onClick={() => handleOpenViewDetails(user)}
                            className={`measure-chip ${measureCount > 0 ? 'measure-chip--active' : 'measure-chip--pending'}`}
                            sx={{ cursor: 'pointer' }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell>
                        <Typography className="date-cell">{formatDateSafe(user.createdAt)}</Typography>
                      </TableCell>

                      {/* Actions: View Details, Add Measurement, Edit */}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'inline-flex', gap: 0.8 }}>
                          {/* View Customer Details Icon */}
                          <Tooltip title="View Details & Measurements" arrow>
                            <IconButton
                              size="small"
                              className="action-icon-btn action-icon-btn--view"
                              onClick={() => handleOpenViewDetails(user)}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Add Measurement Icon */}
                          <Tooltip title="Add Measurement Profile" arrow>
                            <IconButton
                              size="small"
                              className="action-icon-btn action-icon-btn--measure"
                              onClick={() => handleOpenAddMeasure(user)}
                            >
                              <StraightenOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Edit Customer Details Icon */}
                          {userCanEdit && (
                            <Tooltip title="Edit Customer Details" arrow>
                              <IconButton
                                size="small"
                                className="action-icon-btn action-icon-btn--edit"
                                onClick={() => handleOpenEdit(user)}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
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
      {/* MODAL 1: VIEW CUSTOMER DETAILS & MULTIPLE MEASUREMENTS                    */}
      {/* ========================================================================= */}
      <Dialog
        open={openViewDetailsModal}
        onClose={() => setOpenViewDetailsModal(false)}
        maxWidth="md"
        fullWidth
        className="customer-dialog"
        PaperProps={{
          sx: {
            maxWidth: '940px !important',
            width: '100%',
            maxHeight: '90vh !important',
          },
        }}
      >
        <DialogTitle className="dialog-title-bar">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box className="user-avatar-circle">
              {(customerForView?.username?.charAt(0) || 'C').toUpperCase()}
            </Box>
            <Box>
              <Typography variant="h6" className="dialog-title">
                {customerForView?.username || 'Customer Profile'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(230, 216, 163, 0.6)' }}>
                Customer ID: {customerForView?.id || '—'} • Joined {formatDateSafe(customerForView?.createdAt)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditOutlinedIcon sx={{ color: '#d4af37', fontSize: 16 }} />}
              onClick={() => handleOpenEdit(customerForView || customers[0])}
              sx={{
                color: '#d4af37',
                borderColor: 'rgba(212, 175, 55, 0.4)',
                fontSize: '0.8rem',
                textTransform: 'none',
                borderRadius: '8px',
                px: 1.5,
                '&:hover': {
                  borderColor: '#d4af37',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                },
              }}
            >
              Edit Details
            </Button>
            <IconButton onClick={() => setOpenViewDetailsModal(false)} sx={{ color: '#e6d8a3' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent className="dialog-content-body">
          {/* Customer Profile Summary Card */}
          <Box className="details-summary-card">
            <Box className="summary-item">
              <PhoneIphoneOutlinedIcon sx={{ color: '#d4af37', fontSize: 18 }} />
              <Box>
                <Typography className="item-label">Mobile Number</Typography>
                <Typography className="item-value">
                  {customerForView?.userMobile ? `+91 ${customerForView.userMobile}` : 'Not provided'}
                </Typography>
              </Box>
            </Box>

            <Box className="summary-item">
              <EmailOutlinedIcon sx={{ color: '#d4af37', fontSize: 18 }} />
              <Box>
                <Typography className="item-label">Email Address</Typography>
                <Typography className="item-value">{customerForView?.email || 'Not provided'}</Typography>
              </Box>
            </Box>

            <Box className="summary-item">
              <LocationOnOutlinedIcon sx={{ color: '#d4af37', fontSize: 18 }} />
              <Box>
                <Typography className="item-label">Address</Typography>
                <Typography className="item-value">{customerForView?.userAddress || 'No address provided'}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Section Header: Measurements List & Add Action */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StraightenOutlinedIcon sx={{ color: '#d4af37', fontSize: 22 }} />
              <Typography variant="subtitle1" sx={{ color: '#e6d8a3', fontWeight: 700 }}>
                Measurement Profiles ({customerForView ? (measurementsMap[customerForView.id] || []).length : 0})
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="small"
              startIcon={<SquareFootOutlinedIcon sx={{ color: '#000000 !important' }} />}
              onClick={() => {
                setCustomerForMeasure(customerForView);
                setOpenAddMeasureModal(true);
              }}
              className="create-customer-btn"
              sx={{ padding: '5px 14px', fontSize: '0.8rem' }}
            >
              + Add Measurement
            </Button>
          </Box>

          {/* Measurement Profiles List */}
          {customerForView && (measurementsMap[customerForView.id] || []).length === 0 ? (
            <Box className="empty-measurements-box">
              <StraightenOutlinedIcon sx={{ fontSize: 40, color: '#d4af37', opacity: 0.4, mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#e6d8a3', fontWeight: 600 }}>
                No measurements recorded yet for this customer.
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(230, 216, 163, 0.6)', mt: 0.5, display: 'block' }}>
                Each customer can have multiple measurements for different sarees and draping styles.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SquareFootOutlinedIcon />}
                onClick={() => {
                  setCustomerForMeasure(customerForView);
                  setOpenAddMeasureModal(true);
                }}
                sx={{
                  mt: 2,
                  color: '#d4af37',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                  '&:hover': { borderColor: '#d4af37', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
                }}
              >
                Record First Measurement
              </Button>
            </Box>
          ) : (
            <Box className="measurements-list-container">
              {customerForView &&
                (measurementsMap[customerForView.id] || []).map((measure, idx) => (
                  <Card key={measure.id || idx} className="measurement-card">
                    {/* Card Header */}
                    <Box className="measure-card-header">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography className="measure-profile-title">
                          {measure.title || `Measurement Profile #${idx + 1}`}
                        </Typography>
                        {measure.dressSize && (
                          <Chip label={`Size: ${measure.dressSize}`} size="small" className="dress-size-chip" />
                        )}
                      </Box>

                      <Box className="measure-actions">
                        <Typography className="measure-date">
                          <CalendarTodayOutlinedIcon sx={{ fontSize: 13, mr: 0.4, verticalAlign: 'middle' }} />
                          {formatDateSafe(measure.createdAtDate || measure.createdAt, 'Saved')}
                        </Typography>

                        {/* Edit Measurement Profile Button */}
                        {userCanEdit && (
                          <Tooltip title="Edit this measurement profile" arrow>
                            <IconButton
                              size="small"
                              className="measure-action-btn measure-action-btn--edit"
                              onClick={() => handleOpenEditMeasure(measure)}
                            >
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete Measurement Profile Button (Opens custom confirmation popup) */}
                        {userCanDelete && (
                          <Tooltip title="Delete this measurement profile" arrow>
                            <IconButton
                              size="small"
                              className="measure-action-btn measure-action-btn--delete"
                              onClick={() =>
                                setMeasureToDelete({
                                  id: measure.id,
                                  title: measure.title,
                                  userId: customerForView?.id,
                                })
                              }
                              disabled={deletingMeasureId === measure.id}
                            >
                              {deletingMeasureId === measure.id ? (
                                <CircularProgress size={14} sx={{ color: '#f87171' }} />
                              ) : (
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Dimensions Grid */}
                    <Box className="measure-dimensions-grid">
                      <Box className="dim-item">
                        <Typography className="dim-label">Pallu Length</Typography>
                        <Typography className="dim-value">
                          {measure.pallu != null && measure.pallu !== '' ? `${measure.pallu}"` : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Shoulder to Tight</Typography>
                        <Typography className="dim-value">
                          {measure.shoulderToRightTight != null && measure.shoulderToRightTight !== ''
                            ? `${measure.shoulderToRightTight}"`
                            : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Chest Size</Typography>
                        <Typography className="dim-value">
                          {measure.chest != null && measure.chest !== '' ? `${measure.chest}"` : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Hip Size</Typography>
                        <Typography className="dim-value">
                          {measure.hip != null && measure.hip !== '' ? `${measure.hip}"` : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">1st Pleat Size</Typography>
                        <Typography className="dim-value">
                          {measure.firstPleatSize != null && measure.firstPleatSize !== ''
                            ? `${measure.firstPleatSize}"`
                            : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Chest Pleats</Typography>
                        <Typography className="dim-value">
                          {measure.noOfChestPleats != null && measure.noOfChestPleats !== '' ? measure.noOfChestPleats : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Height</Typography>
                        <Typography className="dim-value">
                          {measure.height != null && measure.height !== '' ? measure.height : '—'}
                        </Typography>
                      </Box>
                      <Box className="dim-item">
                        <Typography className="dim-label">Dress Size</Typography>
                        <Typography className="dim-value">
                          {measure.dressSize != null && measure.dressSize !== '' ? measure.dressSize : '—'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Notes */}
                    {measure.notes && (
                      <Box className="measure-notes-row">
                        <NotesOutlinedIcon sx={{ fontSize: 16, color: '#d4af37', mt: 0.3 }} />
                        <Typography className="measure-notes-text">
                          <strong>Notes:</strong> {measure.notes}
                        </Typography>
                      </Box>
                    )}
                  </Card>
                ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions className="dialog-actions-bar">
          <Button onClick={() => setOpenViewDetailsModal(false)} className="cancel-btn">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW MEASUREMENT FOR CUSTOMER                                 */}
      {/* ========================================================================= */}
      <Dialog
        open={openAddMeasureModal}
        onClose={() => setOpenAddMeasureModal(false)}
        maxWidth="sm"
        fullWidth
        className="customer-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Box>
            <Typography variant="h6" className="dialog-title">
              Add Measurement Profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(230, 216, 163, 0.6)' }}>
              Customer: <strong>{customerForMeasure?.username}</strong> ({customerForMeasure?.userMobile ? `+91 ${customerForMeasure.userMobile}` : customerForMeasure?.email})
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenAddMeasureModal(false)} sx={{ color: '#e6d8a3' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={measureFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Profile Title */}
              <TextField
                fullWidth
                label="Measurement Profile Title *"
                placeholder="e.g. Bridal Silk Saree, Kanchipuram Pleats, Reception Draping"
                name="title"
                value={measureFormik.values.title}
                onChange={measureFormik.handleChange}
                onBlur={measureFormik.handleBlur}
                error={measureFormik.touched.title && Boolean(measureFormik.errors.title)}
                helperText={measureFormik.touched.title && measureFormik.errors.title}
                className="custom-form-field"
                size="small"
              />

              {/* Row 1: Pallu & Shoulder */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Pallu Length (inches)"
                  placeholder="e.g. 38"
                  name="pallu"
                  value={measureFormik.values.pallu}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.pallu && Boolean(measureFormik.errors.pallu)}
                  helperText={measureFormik.touched.pallu && measureFormik.errors.pallu}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="Shoulder to Tight (inches)"
                  placeholder="e.g. 14"
                  name="shoulderToRightTight"
                  value={measureFormik.values.shoulderToRightTight}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.shoulderToRightTight && Boolean(measureFormik.errors.shoulderToRightTight)}
                  helperText={measureFormik.touched.shoulderToRightTight && measureFormik.errors.shoulderToRightTight}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 2: Chest & Hip */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Chest Size (inches)"
                  placeholder="e.g. 36"
                  name="chest"
                  value={measureFormik.values.chest}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.chest && Boolean(measureFormik.errors.chest)}
                  helperText={measureFormik.touched.chest && measureFormik.errors.chest}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="Hip Size (inches)"
                  placeholder="e.g. 40"
                  name="hip"
                  value={measureFormik.values.hip}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.hip && Boolean(measureFormik.errors.hip)}
                  helperText={measureFormik.touched.hip && measureFormik.errors.hip}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 3: First Pleat & Chest Pleats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="First Pleat Size (inches)"
                  placeholder="e.g. 6.5"
                  name="firstPleatSize"
                  value={measureFormik.values.firstPleatSize}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.firstPleatSize && Boolean(measureFormik.errors.firstPleatSize)}
                  helperText={measureFormik.touched.firstPleatSize && measureFormik.errors.firstPleatSize}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="No. of Chest Pleats"
                  placeholder="e.g. 5"
                  name="noOfChestPleats"
                  value={measureFormik.values.noOfChestPleats}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.noOfChestPleats && Boolean(measureFormik.errors.noOfChestPleats)}
                  helperText={measureFormik.touched.noOfChestPleats && measureFormik.errors.noOfChestPleats}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 4: Height & Dress Size */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Height (inches/cm)"
                  placeholder="e.g. 165 or 65"
                  name="height"
                  value={measureFormik.values.height}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.height && Boolean(measureFormik.errors.height)}
                  helperText={measureFormik.touched.height && measureFormik.errors.height}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  select
                  label="Dress Size"
                  name="dressSize"
                  value={measureFormik.values.dressSize}
                  onChange={measureFormik.handleChange}
                  onBlur={measureFormik.handleBlur}
                  error={measureFormik.touched.dressSize && Boolean(measureFormik.errors.dressSize)}
                  helperText={measureFormik.touched.dressSize && measureFormik.errors.dressSize}
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
                label="Tailoring & Draping Notes"
                placeholder="Specific pin positions, pleat stiffness, or custom preferences..."
                name="notes"
                value={measureFormik.values.notes}
                onChange={measureFormik.handleChange}
                onBlur={measureFormik.handleBlur}
                error={measureFormik.touched.notes && Boolean(measureFormik.errors.notes)}
                helperText={measureFormik.touched.notes && measureFormik.errors.notes}
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenAddMeasureModal(false)}
              className="cancel-btn"
              disabled={measureFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={measureFormik.isSubmitting}
              startIcon={measureFormik.isSubmitting ? <CircularProgress size={16} sx={{ color: '#000000' }} /> : null}
            >
              {measureFormik.isSubmitting ? 'Saving...' : 'Save Measurement Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT CUSTOMER DETAILS                                            */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
        className="customer-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Typography variant="h6" className="dialog-title">
            Edit Customer Details
          </Typography>
          <IconButton onClick={() => setOpenEditModal(false)} sx={{ color: '#e6d8a3' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={editFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Customer Full Name *"
                name="username"
                value={editFormik.values.username}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.username && Boolean(editFormik.errors.username)}
                helperText={editFormik.touched.username && editFormik.errors.username}
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                label="10-Digit Indian Mobile Number *"
                name="userMobile"
                value={editFormik.values.userMobile}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.userMobile && Boolean(editFormik.errors.userMobile)}
                helperText={editFormik.touched.userMobile && editFormik.errors.userMobile}
                className="custom-form-field"
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Email Address *"
                name="email"
                type="email"
                value={editFormik.values.email}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.email && Boolean(editFormik.errors.email)}
                helperText={editFormik.touched.email && editFormik.errors.email}
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Delivery Address"
                name="userAddress"
                value={editFormik.values.userAddress}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.userAddress && Boolean(editFormik.errors.userAddress)}
                helperText={editFormik.touched.userAddress && editFormik.errors.userAddress}
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setOpenEditModal(false)}
              className="cancel-btn"
              disabled={editFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={editFormik.isSubmitting}
              startIcon={editFormik.isSubmitting ? <CircularProgress size={16} sx={{ color: '#000000' }} /> : null}
            >
              {editFormik.isSubmitting ? 'Saving...' : 'Update Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: ADD NEW CUSTOMER                                                 */}
      {/* ========================================================================= */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="customer-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Typography variant="h6" className="dialog-title">
            Register New Customer
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#e6d8a3' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={createFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Customer Full Name *"
                name="username"
                value={createFormik.values.username}
                onChange={createFormik.handleChange}
                onBlur={createFormik.handleBlur}
                error={createFormik.touched.username && Boolean(createFormik.errors.username)}
                helperText={createFormik.touched.username && createFormik.errors.username}
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                label="10-Digit Indian Mobile Number *"
                name="userMobile"
                value={createFormik.values.userMobile}
                onChange={createFormik.handleChange}
                onBlur={createFormik.handleBlur}
                error={createFormik.touched.userMobile && Boolean(createFormik.errors.userMobile)}
                helperText={createFormik.touched.userMobile && createFormik.errors.userMobile}
                className="custom-form-field"
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                }}
              />

              <TextField
                fullWidth
                label="Email Address *"
                name="email"
                type="email"
                value={createFormik.values.email}
                onChange={createFormik.handleChange}
                onBlur={createFormik.handleBlur}
                error={createFormik.touched.email && Boolean(createFormik.errors.email)}
                helperText={createFormik.touched.email && createFormik.errors.email}
                className="custom-form-field"
                size="small"
              />

              <TextField
                fullWidth
                multiline
                rows={2.5}
                label="Delivery Address"
                name="userAddress"
                value={createFormik.values.userAddress}
                onChange={createFormik.handleChange}
                onBlur={createFormik.handleBlur}
                error={createFormik.touched.userAddress && Boolean(createFormik.errors.userAddress)}
                helperText={createFormik.touched.userAddress && createFormik.errors.userAddress}
                className="custom-form-field"
                size="small"
              />
            </Box>
          </DialogContent>

          <DialogActions className="dialog-actions-bar">
            <Button
              onClick={() => setDialogOpen(false)}
              className="cancel-btn"
              disabled={createFormik.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={createFormik.isSubmitting}
              startIcon={createFormik.isSubmitting ? <CircularProgress size={16} sx={{ color: '#000000' }} /> : null}
            >
              {createFormik.isSubmitting ? 'Creating...' : 'Register Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT MEASUREMENT PROFILE                                         */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditMeasureModal}
        onClose={() => !editMeasureFormik.isSubmitting && setOpenEditMeasureModal(false)}
        maxWidth="sm"
        fullWidth
        className="customer-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Box>
            <Typography variant="h6" className="dialog-title">
              Edit Measurement Profile
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(230, 216, 163, 0.6)' }}>
              Customer: <strong>{customerForView?.username}</strong>
            </Typography>
          </Box>
          <IconButton
            onClick={() => !editMeasureFormik.isSubmitting && setOpenEditMeasureModal(false)}
            sx={{ color: '#e6d8a3' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={editMeasureFormik.handleSubmit}>
          <DialogContent className="dialog-content-body">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
              {/* Profile Title */}
              <TextField
                fullWidth
                label="Measurement Profile Title *"
                placeholder="e.g. Bridal Silk Saree, Reception Draping"
                name="title"
                value={editMeasureFormik.values.title}
                onChange={editMeasureFormik.handleChange}
                onBlur={editMeasureFormik.handleBlur}
                error={editMeasureFormik.touched.title && Boolean(editMeasureFormik.errors.title)}
                helperText={editMeasureFormik.touched.title && editMeasureFormik.errors.title}
                className="custom-form-field"
                size="small"
              />

              {/* Row 1: Pallu & Shoulder */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Pallu Length (inches)"
                  placeholder="e.g. 38"
                  name="pallu"
                  value={editMeasureFormik.values.pallu}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.pallu && Boolean(editMeasureFormik.errors.pallu)}
                  helperText={editMeasureFormik.touched.pallu && editMeasureFormik.errors.pallu}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="Shoulder to Tight (inches)"
                  placeholder="e.g. 14"
                  name="shoulderToRightTight"
                  value={editMeasureFormik.values.shoulderToRightTight}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.shoulderToRightTight && Boolean(editMeasureFormik.errors.shoulderToRightTight)}
                  helperText={editMeasureFormik.touched.shoulderToRightTight && editMeasureFormik.errors.shoulderToRightTight}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 2: Chest & Hip */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Chest Size (inches)"
                  placeholder="e.g. 36"
                  name="chest"
                  value={editMeasureFormik.values.chest}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.chest && Boolean(editMeasureFormik.errors.chest)}
                  helperText={editMeasureFormik.touched.chest && editMeasureFormik.errors.chest}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="Hip Size (inches)"
                  placeholder="e.g. 40"
                  name="hip"
                  value={editMeasureFormik.values.hip}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.hip && Boolean(editMeasureFormik.errors.hip)}
                  helperText={editMeasureFormik.touched.hip && editMeasureFormik.errors.hip}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 3: First Pleat & Chest Pleats */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="First Pleat Size (inches)"
                  placeholder="e.g. 6.5"
                  name="firstPleatSize"
                  value={editMeasureFormik.values.firstPleatSize}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.firstPleatSize && Boolean(editMeasureFormik.errors.firstPleatSize)}
                  helperText={editMeasureFormik.touched.firstPleatSize && editMeasureFormik.errors.firstPleatSize}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  label="No. of Chest Pleats"
                  placeholder="e.g. 5"
                  name="noOfChestPleats"
                  value={editMeasureFormik.values.noOfChestPleats}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.noOfChestPleats && Boolean(editMeasureFormik.errors.noOfChestPleats)}
                  helperText={editMeasureFormik.touched.noOfChestPleats && editMeasureFormik.errors.noOfChestPleats}
                  className="custom-form-field"
                  size="small"
                />
              </Box>

              {/* Row 4: Height & Dress Size */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Height (inches/cm)"
                  placeholder="e.g. 165 or 65"
                  name="height"
                  value={editMeasureFormik.values.height}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.height && Boolean(editMeasureFormik.errors.height)}
                  helperText={editMeasureFormik.touched.height && editMeasureFormik.errors.height}
                  className="custom-form-field"
                  size="small"
                />
                <TextField
                  select
                  label="Dress Size"
                  name="dressSize"
                  value={editMeasureFormik.values.dressSize}
                  onChange={editMeasureFormik.handleChange}
                  onBlur={editMeasureFormik.handleBlur}
                  error={editMeasureFormik.touched.dressSize && Boolean(editMeasureFormik.errors.dressSize)}
                  helperText={editMeasureFormik.touched.dressSize && editMeasureFormik.errors.dressSize}
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
                label="Tailoring & Draping Notes"
                placeholder="Specific pin positions, pleat stiffness, or custom preferences..."
                name="notes"
                value={editMeasureFormik.values.notes}
                onChange={editMeasureFormik.handleChange}
                onBlur={editMeasureFormik.handleBlur}
                error={editMeasureFormik.touched.notes && Boolean(editMeasureFormik.errors.notes)}
                helperText={editMeasureFormik.touched.notes && editMeasureFormik.errors.notes}
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
                editMeasureFormik.isSubmitting ? <CircularProgress size={16} sx={{ color: '#000000' }} /> : null
              }
            >
              {editMeasureFormik.isSubmitting ? 'Updating...' : 'Update Measurement Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: CUSTOM DELETE CONFIRMATION POPUP (NO SYSTEM POPUP)               */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(measureToDelete)}
        onClose={() => !deletingMeasureId && setMeasureToDelete(null)}
        maxWidth="xs"
        fullWidth
        className="customer-dialog"
      >
        <DialogTitle className="dialog-title-bar">
          <Typography variant="h6" className="dialog-title" sx={{ color: '#f87171 !important' }}>
            Delete Measurement Profile
          </Typography>
          <IconButton
            onClick={() => !deletingMeasureId && setMeasureToDelete(null)}
            sx={{ color: '#e6d8a3' }}
            disabled={Boolean(deletingMeasureId)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className="dialog-content-body">
          <Typography variant="body1" sx={{ color: '#e6d8a3', mb: 1.5, fontSize: '0.95rem' }}>
            Are you sure you want to remove the measurement profile{' '}
            <strong style={{ color: '#d4af37' }}>
              "{measureToDelete?.title || 'this profile'}"
            </strong>
            ?
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(230, 216, 163, 0.65)', display: 'block', lineHeight: 1.5 }}>
            This measurement record will be permanently deleted from this customer's profile. This action cannot be undone.
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
              backgroundColor: '#dc2626 !important',
              color: '#ffffff !important',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              padding: '7px 20px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3) !important',
              '&:hover': {
                backgroundColor: '#ef4444 !important',
              },
            }}
            startIcon={
              deletingMeasureId ? <CircularProgress size={16} sx={{ color: '#ffffff' }} /> : null
            }
          >
            {deletingMeasureId ? 'Deleting...' : 'Delete Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
