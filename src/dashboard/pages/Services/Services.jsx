import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useFormik } from "formik";
import * as Yup from "yup";

// Material UI Icons
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import IronOutlinedIcon from "@mui/icons-material/IronOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import ChildCareOutlinedIcon from "@mui/icons-material/ChildCareOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";

// Common Components & Layout
import {
  AppButton,
  AppInput,
  AppModal,
  AppTabs,
  AppTable,
  AppTableContainer,
  AppTableHead,
  AppTableBody,
  AppTableRow,
  AppTableCell,
  AppTableSortLabel,
  AppTablePagination,
  AppBadge,
  AppSpinner,
  AppViewToggle,
} from "../../../components/common";
import StatCard from "../../components/StatCard/StatCard";
import DateTimeCell from "../../components/DateTimeCell/DateTimeCell";
import { useAuth } from "../../../auth/context/AuthContext";
import { USER_ROLES } from "../../../firebase/schema";
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  getLatestItemTimestamp,
  getTimestampMillis,
  formatDateSafe,
} from "../../../firebase/dbService";
import "./Services.scss";

// Helper to choose relevant icon based on service name
const getServiceIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("iron") || n.includes("press") || n.includes("steam")) {
    return <IronOutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("box") || n.includes("fold") || n.includes("pack")) {
    return <Inventory2OutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("hanger")) {
    return <CheckroomOutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("bridal") || n.includes("wedding") || n.includes("maharani")) {
    return <CelebrationOutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("kid") || n.includes("child")) {
    return <ChildCareOutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("hair") || n.includes("style") || n.includes("make")) {
    return <AutoAwesomeOutlinedIcon className="service-icon-svg" />;
  }
  if (n.includes("lehenga") || n.includes("dupatta") || n.includes("pallu")) {
    return <StyleOutlinedIcon className="service-icon-svg" />;
  }
  return <DryCleaningOutlinedIcon className="service-icon-svg" />;
};

// Form Validation Schema
const serviceValidationSchema = Yup.object({
  serviceName: Yup.string()
    .trim()
    .required("Service title is required")
    .min(3, "Service name must be at least 3 characters")
    .max(80, "Service name cannot exceed 80 characters"),
  servicePrice: Yup.number()
    .typeError("Regular price must be a valid number")
    .min(0, "Price cannot be negative")
    .required("Regular price is required"),
  serviceDiscountedPrice: Yup.number()
    .typeError("Discounted price must be a valid number")
    .min(0, "Discounted price cannot be negative")
    .test(
      "is-discount-valid",
      "Discount price cannot be higher than regular price",
      function (val) {
        const { servicePrice } = this.parent;
        if (val === undefined || val === null || val === "") return true;
        if (servicePrice === undefined || servicePrice === null) return true;
        return Number(val) <= Number(servicePrice);
      },
    ),
  description: Yup.string()
    .trim()
    .max(250, "Description cannot exceed 250 characters"),
  active: Yup.boolean(),
});

const Services = () => {
  const { role, isSuperAdmin, canEdit, canDelete } = useAuth();
  const userCanEdit =
    canEdit ??
    (isSuperAdmin ||
      role === USER_ROLES.ADMIN ||
      role === USER_ROLES.SUPERADMIN ||
      role === USER_ROLES.STAFF);
  const userCanDelete =
    canDelete ??
    (isSuperAdmin ||
      role === USER_ROLES.ADMIN ||
      role === USER_ROLES.SUPERADMIN);

  // Core Data & State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Table pagination & sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [expandedServices, setExpandedServices] = useState(new Set());

  // Modal States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Load Services from Firestore
  const fetchServices = useCallback(async (isManualRefresh = false) => {
    setLoading(true);
    if (isManualRefresh) setRefreshing(true);

    try {
      const data = await getAllServices(false);
      setServices(data || []);
      if (isManualRefresh) {
        toast.success("Services catalog refreshed from database.");
      }
    } catch (err) {
      console.error("Error loading services:", err);
      toast.error("Failed to load services catalog.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Add Service Formik
  const createFormik = useFormik({
    initialValues: {
      serviceName: "",
      servicePrice: "",
      serviceDiscountedPrice: "",
      description: "",
      active: true,
    },
    validationSchema: serviceValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const payload = {
          serviceName: values.serviceName.trim(),
          servicePrice: Number(values.servicePrice) || 0,
          serviceDiscountedPrice:
            values.serviceDiscountedPrice !== "" &&
            values.serviceDiscountedPrice !== null
              ? Number(values.serviceDiscountedPrice)
              : Number(values.servicePrice),
          description: values.description.trim(),
          active: Boolean(values.active),
        };

        const created = await createService(payload);
        const now = new Date();
        const createdWithTimestamps = {
          ...created,
          createdAt: formatDateSafe(now),
          rawCreatedAt: now.toISOString(),
          updatedAt: null,
          rawUpdatedAt: null,
        };
        setServices((prev) => [createdWithTimestamps, ...prev.filter((s) => s.id !== created.id)]);
        toast.success(`Service "${payload.serviceName}" added to catalog!`);
        resetForm();
        setDialogOpen(false);
      } catch (err) {
        console.error("Create service error:", err);
        toast.error("Failed to add service. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Edit Service Formik
  const editFormik = useFormik({
    initialValues: {
      serviceName: "",
      servicePrice: "",
      serviceDiscountedPrice: "",
      description: "",
      active: true,
    },
    validationSchema: serviceValidationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (!selectedServiceForEdit) return;
      try {
        const payload = {
          serviceName: values.serviceName.trim(),
          servicePrice: Number(values.servicePrice) || 0,
          serviceDiscountedPrice:
            values.serviceDiscountedPrice !== "" &&
            values.serviceDiscountedPrice !== null
              ? Number(values.serviceDiscountedPrice)
              : Number(values.servicePrice),
          description: values.description.trim(),
          active: Boolean(values.active),
        };

        const updated = await updateService(selectedServiceForEdit.id, payload);
        const editNow = new Date();
        setServices((prev) =>
          prev.map((s) =>
            s.id === selectedServiceForEdit.id
              ? {
                  ...s,
                  ...updated,
                  updatedAt: formatDateSafe(editNow),
                  rawUpdatedAt: editNow.toISOString(),
                }
              : s,
          ),
        );
        toast.success(`Service "${payload.serviceName}" updated successfully!`);
        resetForm();
        setOpenEditModal(false);
        setSelectedServiceForEdit(null);
      } catch (err) {
        console.error("Update service error:", err);
        toast.error("Failed to update service.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Toggle Active Status
  const handleToggleActive = async (service) => {
    const newStatus = !service.active;
    setActionLoadingId(service.id);
    try {
      await toggleServiceActive(service.id, newStatus);
      const editNow = new Date();
      setServices((prev) =>
        prev.map((s) =>
          s.id === service.id
            ? {
                ...s,
                active: newStatus,
                updatedAt: formatDateSafe(editNow),
                rawUpdatedAt: editNow.toISOString(),
              }
            : s,
        ),
      );
      toast.success(
        `"${service.serviceName}" is now ${newStatus ? "Active in catalog" : "Hidden/Inactive"}.`,
      );
    } catch (err) {
      console.error("Toggle service status error:", err);
      toast.error("Failed to change service status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Service
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setActionLoadingId(serviceToDelete.id);
    try {
      await deleteService(serviceToDelete.id);
      setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
      toast.success(`Service "${serviceToDelete.serviceName}" deleted.`);
      setOpenDeleteModal(false);
      setServiceToDelete(null);
    } catch (err) {
      console.error("Delete service error:", err);
      toast.error("Failed to delete service.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Modal with populated values
  const handleOpenEdit = (service) => {
    setSelectedServiceForEdit(service);
    editFormik.setValues({
      serviceName: service.serviceName || "",
      servicePrice: service.servicePrice ?? "",
      serviceDiscountedPrice: service.serviceDiscountedPrice ?? "",
      description: service.description || "",
      active: service.active !== false,
    });
    setOpenEditModal(true);
  };

  // Toggle row expand for table view
  const toggleRowExpand = (id) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Statistics Calculations
  const totalCount = services.length;
  const activeCount = services.filter((s) => s.active).length;
  const inactiveCount = services.filter((s) => !s.active).length;
  const averagePrice =
    totalCount > 0
      ? Math.round(
          services.reduce(
            (acc, s) => acc + (s.serviceDiscountedPrice || s.servicePrice || 0),
            0,
          ) / totalCount,
        )
      : 0;

  // Tabs configured strictly with { label, value } for AppTabs
  const serviceTabs = useMemo(
    () => [
      { label: `All Services (${totalCount})`, value: "ALL" },
      { label: `Active (${activeCount})`, value: "ACTIVE" },
      { label: `Inactive (${inactiveCount})`, value: "INACTIVE" },
    ],
    [totalCount, activeCount, inactiveCount],
  );

  // Filter & Search Logic
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Tab filter
      if (activeTab === "ACTIVE" && !service.active) return false;
      if (activeTab === "INACTIVE" && service.active) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (service.serviceName || "").toLowerCase().includes(q);
        const descMatch = (service.description || "").toLowerCase().includes(q);
        const priceMatch = String(service.servicePrice || "").includes(q);
        return nameMatch || descMatch || priceMatch;
      }

      return true;
    });
  }, [services, activeTab, searchTerm]);

  // Sorting: recently added or recently updated show at top by default
  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      if (
        sortField === "createdAt" ||
        sortField === "updatedAt" ||
        sortField === "recent"
      ) {
        const aTime = getLatestItemTimestamp(a);
        const bTime = getLatestItemTimestamp(b);
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      if (
        sortField === "servicePrice" ||
        sortField === "serviceDiscountedPrice"
      ) {
        const valA = Number(a[sortField]) || 0;
        const valB = Number(b[sortField]) || 0;
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      if (sortField === "active") {
        const valA = a.active ? 1 : 0;
        const valB = b.active ? 1 : 0;
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      const valA = String(a[sortField] || "").toLowerCase();
      const valB = String(b[sortField] || "").toLowerCase();
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }, [filteredServices, sortField, sortDirection]);

  // Pagination for Table View
  const paginatedServices = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedServices.slice(start, start + rowsPerPage);
  }, [sortedServices, page, rowsPerPage]);

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
  };

  return (
    <div className="services-page">
      {/* Page Header matching Clients Page */}
      <div className="services-page__header">
        <div>
          <h1 className="page-title">Pre-Pleating Services</h1>
          <p className="page-subtitle">
            Manage live saree pre-pleating offerings, packages, pricing, and
            active catalog
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
            onClick={() => fetchServices(true)}
            disabled={loading || refreshing}
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </AppButton>
          {userCanEdit && (
            <AppButton
              variant="primary"
              size="md"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                createFormik.resetForm();
                setDialogOpen(true);
              }}
              className="add-service-btn"
            >
              Add Service
            </AppButton>
          )}
        </div>
      </div>

      {/* 4 StatCards Grid matching Clients Page */}
      <div className="services-page__stats-grid">
        <StatCard
          title="Total Services"
          value={String(totalCount)}
          change="All Saree Offerings"
          trendType="completed"
          icon={<LayersOutlinedIcon />}
        />
        <StatCard
          title="Active Catalog"
          value={String(activeCount)}
          change="Available for booking"
          trendType="completed"
          icon={<VerifiedOutlinedIcon />}
        />
        <StatCard
          title="Inactive / Hidden"
          value={String(inactiveCount)}
          change={
            inactiveCount > 0 ? "Hidden from storefront" : "All services active"
          }
          trendType={inactiveCount > 0 ? "pending" : "completed"}
          icon={<WarningAmberOutlinedIcon />}
        />
        <StatCard
          title="Average Price"
          value={`₹${averagePrice.toLocaleString("en-IN")}`}
          change="Catalog average rate"
          trendType="completed"
          icon={<CurrencyRupeeIcon />}
        />
      </div>

      {/* 1. Filter Tabs Row */}
      <div className="services-page__tabs-row">
        <AppTabs
          tabs={serviceTabs}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPage(0);
          }}
        />
      </div>

      {/* 2. Controls Row: View Mode Switcher on LEFT (below All Services), Search on RIGHT */}
      <div className="services-page__toolbar">
        <AppViewToggle value={viewMode} onChange={setViewMode} />
        <div className="services-search-field">
          <AppInput
            placeholder="Search by service name, description, price..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Main Services View Content */}
      {loading || refreshing ? (
        <div className="services-loading-wrapper">
          <AppSpinner size="lg" color="gold" />
          <span className="services-loading-text">
            {refreshing
              ? "Refreshing services catalog..."
              : "Loading services catalog..."}
          </span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="services-empty-wrapper">
          <DryCleaningOutlinedIcon
            className="empty-state-icon"
            style={{ fontSize: 44 }}
          />
          <span className="empty-title">
            No services found matching your criteria.
          </span>
          <span className="empty-subtitle">
            {searchTerm || activeTab !== "ALL"
              ? "Try changing your search term or active tab filter."
              : 'Click "Add Service" to create the first saree pre-pleating service.'}
          </span>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================== */
        /* 1. TABLE VIEW                                              */
        /* ========================================================== */
        <div className="services-table-card">
          <AppTableContainer className="table-responsive">
            <AppTable className="services-table">
              <AppTableHead>
                <AppTableRow>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "serviceName"}
                      direction={
                        sortField === "serviceName" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("serviceName")}
                    >
                      SERVICE NAME
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "servicePrice"}
                      direction={
                        sortField === "servicePrice" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("servicePrice")}
                    >
                      REGULAR PRICE
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "serviceDiscountedPrice"}
                      direction={
                        sortField === "serviceDiscountedPrice"
                          ? sortDirection
                          : "asc"
                      }
                      onClick={() =>
                        handleRequestSort("serviceDiscountedPrice")
                      }
                    >
                      OFFER PRICE
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head style={{ textAlign: "center" }}>
                    <AppTableSortLabel
                      active={sortField === "active"}
                      direction={sortField === "active" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("active")}
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
                {paginatedServices.map((service) => {
                  const isExpanded = expandedServices.has(service.id);
                  const discount =
                    service.servicePrice >
                    (service.serviceDiscountedPrice || service.servicePrice)
                      ? service.servicePrice -
                        (service.serviceDiscountedPrice || service.servicePrice)
                      : 0;

                  return (
                    <React.Fragment key={service.id}>
                      <AppTableRow
                        className={`service-table-row ${!service.active ? "is-row-inactive" : ""}`}
                        onClick={() => toggleRowExpand(service.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <AppTableCell>
                          <div className="service-name-cell">
                            <div className="user-avatar-circle service-icon-circle">
                              {getServiceIcon(service.serviceName)}
                            </div>
                            <div>
                              <div className="user-name-text">
                                {service.serviceName}
                              </div>
                              <div className="user-email-text">
                                {service.description &&
                                service.description.length > 50
                                  ? service.description.substring(0, 50) + "..."
                                  : service.description}
                              </div>
                            </div>
                          </div>
                        </AppTableCell>
                        <AppTableCell>
                          <span className="price-text regular">
                            ₹
                            {(service.servicePrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </AppTableCell>
                        <AppTableCell>
                          <div className="offer-price-cell">
                            <span className="price-text offer">
                              ₹
                              {(
                                service.serviceDiscountedPrice ||
                                service.servicePrice ||
                                0
                              ).toLocaleString("en-IN")}
                            </span>
                            {discount > 0 && (
                              <span className="table-discount-pill">
                                Save ₹{discount}
                              </span>
                            )}
                          </div>
                        </AppTableCell>
                        <AppTableCell style={{ textAlign: "center" }}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (userCanEdit) handleToggleActive(service);
                            }}
                            style={{
                              cursor: userCanEdit ? "pointer" : "default",
                            }}
                            title={
                              service.active
                                ? "Click to Deactivate Service"
                                : "Click to Activate Service"
                            }
                          >
                            <AppBadge
                              variant={service.active ? "completed" : "pending"}
                            >
                              {service.active ? "✓ Active" : "● Inactive"}
                            </AppBadge>
                          </span>
                        </AppTableCell>
                        <AppTableCell
                          style={{ textAlign: "right", whiteSpace: "nowrap" }}
                        >
                          <div className="action-btns">
                            {/* 1. Edit Service Button (Warm Amber Gold) */}
                            {userCanEdit && (
                              <AppButton
                                variant="warning"
                                size="sm"
                                square
                                className="action-btn--edit"
                                title="Edit Service"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(service);
                                }}
                              >
                                <EditOutlinedIcon style={{ fontSize: 16 }} />
                              </AppButton>
                            )}

                            {/* 2. Toggle Status Shortcut */}
                            {userCanEdit && (
                              <AppButton
                                variant={service.active ? "success" : "danger"}
                                size="sm"
                                square
                                className={
                                  service.active
                                    ? "action-btn--measure"
                                    : "action-btn--delete"
                                }
                                title={
                                  service.active
                                    ? "Deactivate Service"
                                    : "Activate Service"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(service);
                                }}
                                disabled={actionLoadingId === service.id}
                              >
                                {service.active ? (
                                  <CheckCircleOutlineIcon
                                    style={{ fontSize: 16 }}
                                  />
                                ) : (
                                  <CancelOutlinedIcon
                                    style={{ fontSize: 16 }}
                                  />
                                )}
                              </AppButton>
                            )}

                            {/* 3. Delete Service Button (Rose Red) */}
                            {userCanDelete && (
                              <AppButton
                                variant="danger"
                                size="sm"
                                square
                                className="action-btn--delete"
                                title="Delete Service"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setServiceToDelete(service);
                                  setOpenDeleteModal(true);
                                }}
                              >
                                <DeleteOutlineIcon style={{ fontSize: 16 }} />
                              </AppButton>
                            )}

                            {/* 4. Revamped View More Pill Button */}
                            <button
                              type="button"
                              className={`view-more-pill-btn ${isExpanded ? "is-active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpand(service.id);
                              }}
                              aria-expanded={isExpanded}
                              title={
                                isExpanded
                                  ? "Hide Details"
                                  : "View More Details"
                              }
                            >
                              <span className="btn-text">
                                {isExpanded ? "Less" : "More"}
                              </span>
                              <span
                                className={`chevron-wrap ${isExpanded ? "rotated" : ""}`}
                              >
                                <KeyboardArrowDownIcon />
                              </span>
                            </button>
                          </div>
                        </AppTableCell>
                      </AppTableRow>

                      {/* Expandable View More Row with Description, Created At, Modified At */}
                      {isExpanded && (
                        <AppTableRow className="table-expanded-row">
                          <AppTableCell
                            colSpan={5}
                            className="table-expanded-cell"
                          >
                            <div className="table-expanded-container">
                              {/* Service Description Tile */}
                              <div className="expanded-tile expanded-tile--address">
                                <div className="tile-header">
                                  <DescriptionOutlinedIcon className="tile-icon" />
                                  <span className="tile-label">
                                    Service Description & Draping Notes
                                  </span>
                                </div>
                                <div className="tile-content">
                                  {service.description ? (
                                    <span className="address-text">
                                      {service.description}
                                    </span>
                                  ) : (
                                    <span className="empty-hint">
                                      Specialized saree pre-pleating, precision
                                      steam press & pleat setting, safety pin
                                      reinforcement, and pristine packaging.
                                    </span>
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
                                    value={
                                      service.rawCreatedAt || service.createdAt
                                    }
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
                                    value={
                                      service.rawUpdatedAt || service.updatedAt
                                    }
                                    modifiedFrom={
                                      service.rawCreatedAt || service.createdAt
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
            count={filteredServices.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </div>
      ) : viewMode === "grid" ? (
        /* ========================================================== */
        /* 2. GRID VIEW (Multi-Column Luxury Cards)                   */
        /* ========================================================== */
        <div className="services-grid-wrapper">
          <div className="services-grid">
            {paginatedServices.map((service) => {
              const discount =
                service.servicePrice >
                (service.serviceDiscountedPrice || service.servicePrice)
                  ? service.servicePrice -
                    (service.serviceDiscountedPrice || service.servicePrice)
                  : 0;

              return (
                <div
                  key={service.id}
                  className={`service-grid-card ${!service.active ? "is-inactive" : ""}`}
                >
                  <div className="card-top-accent" />
                  <div className="card-header">
                    <div className="user-avatar-circle service-icon-circle">
                      {getServiceIcon(service.serviceName)}
                    </div>
                    <span
                      onClick={() => userCanEdit && handleToggleActive(service)}
                      style={{ cursor: userCanEdit ? "pointer" : "default" }}
                      title={
                        service.active
                          ? "Click to Deactivate"
                          : "Click to Activate"
                      }
                    >
                      <AppBadge
                        variant={service.active ? "completed" : "pending"}
                      >
                        {service.active ? "✓ Active" : "● Inactive"}
                      </AppBadge>
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">{service.serviceName}</h3>
                    <p className="card-description">
                      {service.description ||
                        "Specialized saree pre-pleating, precision steam press & pleat setting."}
                    </p>
                  </div>

                  <div className="card-pricing">
                    <div className="price-stack">
                      <span className="price-offer">
                        ₹
                        {(
                          service.serviceDiscountedPrice ||
                          service.servicePrice ||
                          0
                        ).toLocaleString("en-IN")}
                      </span>
                      {service.serviceDiscountedPrice &&
                        service.serviceDiscountedPrice <
                          service.servicePrice && (
                          <span className="price-regular">
                            ₹
                            {(service.servicePrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                    </div>
                    {discount > 0 && (
                      <span className="table-discount-pill">
                        Save ₹{discount}
                      </span>
                    )}
                  </div>

                  <div className="card-footer">
                    <div className="card-date">
                      <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                      <DateTimeCell
                        value={service.rawCreatedAt || service.createdAt}
                      />
                    </div>
                    <div className="action-btns">
                      {userCanEdit && (
                        <AppButton
                          variant="warning"
                          size="sm"
                          square
                          className="action-btn--edit"
                          title="Edit Service"
                          onClick={() => handleOpenEdit(service)}
                        >
                          <EditOutlinedIcon style={{ fontSize: 16 }} />
                        </AppButton>
                      )}
                      {userCanEdit && (
                        <AppButton
                          variant={service.active ? "success" : "danger"}
                          size="sm"
                          square
                          className={
                            service.active
                              ? "action-btn--measure"
                              : "action-btn--delete"
                          }
                          title={
                            service.active
                              ? "Deactivate Service"
                              : "Activate Service"
                          }
                          onClick={() => handleToggleActive(service)}
                          disabled={actionLoadingId === service.id}
                        >
                          {service.active ? (
                            <CheckCircleOutlineIcon style={{ fontSize: 16 }} />
                          ) : (
                            <CancelOutlinedIcon style={{ fontSize: 16 }} />
                          )}
                        </AppButton>
                      )}
                      {userCanDelete && (
                        <AppButton
                          variant="danger"
                          size="sm"
                          square
                          className="action-btn--delete"
                          title="Delete Service"
                          onClick={() => {
                            setServiceToDelete(service);
                            setOpenDeleteModal(true);
                          }}
                        >
                          <DeleteOutlineIcon style={{ fontSize: 16 }} />
                        </AppButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="services-pagination-card">
            <AppTablePagination
              count={filteredServices.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* 3. CARD VIEW (Detailed Full-Width Dossier Cards)           */
        /* ========================================================== */
        <div className="services-card-list-wrapper">
          <div className="services-card-list">
            {paginatedServices.map((service) => {
              const discount =
                service.servicePrice >
                (service.serviceDiscountedPrice || service.servicePrice)
                  ? service.servicePrice -
                    (service.serviceDiscountedPrice || service.servicePrice)
                  : 0;

              return (
                <div
                  key={service.id}
                  className={`service-detailed-card ${!service.active ? "is-inactive" : ""}`}
                >
                  <div className="detailed-card-left">
                    <div className="user-avatar-circle service-icon-circle-lg">
                      {getServiceIcon(service.serviceName)}
                    </div>
                  </div>

                  <div className="detailed-card-main">
                    <div className="detailed-card-header">
                      <div className="detailed-card-title-row">
                        <h3 className="service-heading">
                          {service.serviceName}
                        </h3>
                        <span
                          onClick={() =>
                            userCanEdit && handleToggleActive(service)
                          }
                          style={{
                            cursor: userCanEdit ? "pointer" : "default",
                          }}
                          title={
                            service.active
                              ? "Click to Deactivate"
                              : "Click to Activate"
                          }
                        >
                          <AppBadge
                            variant={service.active ? "completed" : "pending"}
                          >
                            {service.active
                              ? "✓ Active in Catalog"
                              : "● Inactive / Hidden"}
                          </AppBadge>
                        </span>
                      </div>
                      <p className="service-notes">
                        {service.description ||
                          "Specialized saree pre-pleating, precision steam press & pleat setting, safety pin reinforcement, and pristine packaging."}
                      </p>
                    </div>

                    <div className="detailed-card-meta">
                      <div className="meta-tile">
                        <span className="meta-label">Regular Price</span>
                        <span className="meta-value regular-strike">
                          ₹{(service.servicePrice || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="meta-tile highlight-gold">
                        <span className="meta-label">Offer Price</span>
                        <div className="offer-wrap">
                          <span className="meta-value offer-gold">
                            ₹
                            {(
                              service.serviceDiscountedPrice ||
                              service.servicePrice ||
                              0
                            ).toLocaleString("en-IN")}
                          </span>
                          {discount > 0 && (
                            <span className="table-discount-pill">
                              Save ₹{discount}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Created At</span>
                        <span className="meta-value">
                          <DateTimeCell
                            value={service.rawCreatedAt || service.createdAt}
                          />
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Modified At</span>
                        <span className="meta-value">
                          <DateTimeCell
                            value={service.rawUpdatedAt || service.updatedAt}
                            modifiedFrom={
                              service.rawCreatedAt || service.createdAt
                            }
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
                        onClick={() => handleOpenEdit(service)}
                      >
                        Edit
                      </AppButton>
                    )}
                    {userCanEdit && (
                      <AppButton
                        variant={service.active ? "secondary" : "success"}
                        size="sm"
                        startIcon={
                          service.active ? (
                            <CancelOutlinedIcon />
                          ) : (
                            <CheckCircleOutlineIcon />
                          )
                        }
                        onClick={() => handleToggleActive(service)}
                        disabled={actionLoadingId === service.id}
                      >
                        {service.active ? "Deactivate" : "Activate"}
                      </AppButton>
                    )}
                    {userCanDelete && (
                      <AppButton
                        variant="danger"
                        size="sm"
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => {
                          setServiceToDelete(service);
                          setOpenDeleteModal(true);
                        }}
                      >
                        Delete
                      </AppButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="services-pagination-card">
            <AppTablePagination
              count={filteredServices.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. MODAL: Add New Service                                     */}
      {/* ============================================================== */}
      <AppModal
        open={dialogOpen}
        onClose={() => !createFormik.isSubmitting && setDialogOpen(false)}
        title="Add Pre-Pleating Service"
        subtitle="Register a new saree draping or pleating offering in the catalog"
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                createFormik.resetForm();
                setDialogOpen(false);
              }}
              disabled={createFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => createFormik.handleSubmit()}
              loading={createFormik.isSubmitting}
            >
              Create Service
            </AppButton>
          </>
        }
      >
        <div className="service-form-dialog">
          <AppInput
            label="Service Title"
            name="serviceName"
            placeholder="e.g. Bridal Kanjeevaram Saree Pre-Pleating"
            value={createFormik.values.serviceName}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={
              createFormik.touched.serviceName &&
              Boolean(createFormik.errors.serviceName)
            }
            helperText={
              createFormik.touched.serviceName &&
              createFormik.errors.serviceName
            }
            startAdornment={<DryCleaningOutlinedIcon />}
            disabled={createFormik.isSubmitting}
            autoFocus
          />

          <div className="service-form-grid-2">
            <AppInput
              label="Regular Price (₹)"
              name="servicePrice"
              type="number"
              placeholder="e.g. 750"
              value={createFormik.values.servicePrice}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              error={
                createFormik.touched.servicePrice &&
                Boolean(createFormik.errors.servicePrice)
              }
              helperText={
                createFormik.touched.servicePrice &&
                createFormik.errors.servicePrice
              }
              startAdornment={<CurrencyRupeeIcon />}
              disabled={createFormik.isSubmitting}
            />

            <AppInput
              label="Offer / Discounted Price (₹)"
              name="serviceDiscountedPrice"
              type="number"
              placeholder="e.g. 499"
              value={createFormik.values.serviceDiscountedPrice}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              error={
                createFormik.touched.serviceDiscountedPrice &&
                Boolean(createFormik.errors.serviceDiscountedPrice)
              }
              helperText={
                createFormik.touched.serviceDiscountedPrice &&
                createFormik.errors.serviceDiscountedPrice
              }
              startAdornment={<LocalOfferOutlinedIcon />}
              disabled={createFormik.isSubmitting}
            />
          </div>

          <AppInput
            label="Description & Draping Notes"
            name="description"
            placeholder="Describe the specialized pleating technique, fabric types supported, and packaging included..."
            value={createFormik.values.description}
            onChange={createFormik.handleChange}
            onBlur={createFormik.handleBlur}
            error={
              createFormik.touched.description &&
              Boolean(createFormik.errors.description)
            }
            helperText={
              createFormik.touched.description &&
              createFormik.errors.description
            }
            multiline={true}
            rows={3}
            startAdornment={
              <DescriptionOutlinedIcon
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              />
            }
            disabled={createFormik.isSubmitting}
          />

          <div className="service-status-card">
            <div className="status-text-wrap">
              <span className="status-title">Active in Public Catalog</span>
              <span className="status-hint">
                When enabled, clients can view and book this service.
              </span>
            </div>
            <label
              className="luxury-switch-toggle"
              htmlFor="service-add-active"
            >
              <input
                type="checkbox"
                id="service-add-active"
                name="active"
                checked={createFormik.values.active}
                onChange={createFormik.handleChange}
                disabled={createFormik.isSubmitting}
              />
              <span className="luxury-switch-slider" />
            </label>
          </div>
        </div>
      </AppModal>

      {/* ============================================================== */}
      {/* 2. MODAL: Edit Existing Service                               */}
      {/* ============================================================== */}
      <AppModal
        open={openEditModal}
        onClose={() => !editFormik.isSubmitting && setOpenEditModal(false)}
        title="Edit Service Details"
        subtitle={`Editing "${selectedServiceForEdit?.serviceName || "Service"}"`}
        maxWidth="sm"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                editFormik.resetForm();
                setOpenEditModal(false);
                setSelectedServiceForEdit(null);
              }}
              disabled={editFormik.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => editFormik.handleSubmit()}
              loading={editFormik.isSubmitting}
            >
              Save Changes
            </AppButton>
          </>
        }
      >
        <div className="service-form-dialog">
          <AppInput
            label="Service Title"
            name="serviceName"
            value={editFormik.values.serviceName}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.serviceName &&
              Boolean(editFormik.errors.serviceName)
            }
            helperText={
              editFormik.touched.serviceName && editFormik.errors.serviceName
            }
            startAdornment={<DryCleaningOutlinedIcon />}
            disabled={editFormik.isSubmitting}
          />

          <div className="service-form-grid-2">
            <AppInput
              label="Regular Price (₹)"
              name="servicePrice"
              type="number"
              value={editFormik.values.servicePrice}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={
                editFormik.touched.servicePrice &&
                Boolean(editFormik.errors.servicePrice)
              }
              helperText={
                editFormik.touched.servicePrice &&
                editFormik.errors.servicePrice
              }
              startAdornment={<CurrencyRupeeIcon />}
              disabled={editFormik.isSubmitting}
            />

            <AppInput
              label="Offer / Discounted Price (₹)"
              name="serviceDiscountedPrice"
              type="number"
              value={editFormik.values.serviceDiscountedPrice}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={
                editFormik.touched.serviceDiscountedPrice &&
                Boolean(editFormik.errors.serviceDiscountedPrice)
              }
              helperText={
                editFormik.touched.serviceDiscountedPrice &&
                editFormik.errors.serviceDiscountedPrice
              }
              startAdornment={<LocalOfferOutlinedIcon />}
              disabled={editFormik.isSubmitting}
            />
          </div>

          <AppInput
            label="Description & Draping Notes"
            name="description"
            placeholder="Describe the specialized pleating technique, fabric types supported, and packaging included..."
            value={editFormik.values.description}
            onChange={editFormik.handleChange}
            onBlur={editFormik.handleBlur}
            error={
              editFormik.touched.description &&
              Boolean(editFormik.errors.description)
            }
            helperText={
              editFormik.touched.description && editFormik.errors.description
            }
            multiline={true}
            rows={3}
            startAdornment={
              <DescriptionOutlinedIcon
                style={{ alignSelf: "flex-start", marginTop: 2 }}
              />
            }
            disabled={editFormik.isSubmitting}
          />

          <div className="service-status-card">
            <div className="status-text-wrap">
              <span className="status-title">Active in Public Catalog</span>
              <span className="status-hint">
                When enabled, clients can view and book this service.
              </span>
            </div>
            <label
              className="luxury-switch-toggle"
              htmlFor="service-edit-active"
            >
              <input
                type="checkbox"
                id="service-edit-active"
                name="active"
                checked={editFormik.values.active}
                onChange={editFormik.handleChange}
                disabled={editFormik.isSubmitting}
              />
              <span className="luxury-switch-slider" />
            </label>
          </div>
        </div>
      </AppModal>

      {/* ============================================================== */}
      {/* 3. MODAL: Confirm Delete Service                              */}
      {/* ============================================================== */}
      <AppModal
        open={openDeleteModal}
        onClose={() => !actionLoadingId && setOpenDeleteModal(false)}
        title="Delete Service"
        subtitle="This will permanently remove the service from the catalog."
        maxWidth="xs"
        actions={
          <>
            <AppButton
              variant="ghost"
              onClick={() => {
                setOpenDeleteModal(false);
                setServiceToDelete(null);
              }}
              disabled={Boolean(actionLoadingId)}
            >
              Cancel
            </AppButton>
            <AppButton
              variant="danger"
              onClick={handleConfirmDelete}
              loading={actionLoadingId === serviceToDelete?.id}
            >
              Delete Service
            </AppButton>
          </>
        }
      >
        <div className="delete-confirm-body">
          <p>
            Are you sure you want to delete{" "}
            <strong>"{serviceToDelete?.serviceName}"</strong>?
          </p>
          <p className="delete-warning-text">
            This action cannot be undone. Any historical orders referencing this
            service will retain their recorded names.
          </p>
        </div>
      </AppModal>
    </div>
  );
};

export default Services;
