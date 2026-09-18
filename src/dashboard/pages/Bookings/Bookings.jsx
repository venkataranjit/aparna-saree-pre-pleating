import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

// Material UI Icons
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";

// Common Components & Layout
import {
  AppButton,
  AppInput,
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
import CreateOrderModal from "../../components/CreateOrderModal/CreateOrderModal";
import OrderDetailsModal from "../../components/OrderDetailsModal/OrderDetailsModal";
import {
  downloadInvoicePdfDirectly,
  shareOrderPdfToWhatsApp,
  openClientWhatsAppChat,
} from "../../components/CustomInvoiceModal/CustomInvoiceModal";
import {
  getAllOrders,
  getLatestItemTimestamp,
  formatDateSafe,
} from "../../../firebase/dbService";
import { useAuth } from "../../../auth/context/AuthContext";
import { USER_ROLES } from "../../../firebase/schema";
import "./Bookings.scss";

// Helpers for robust data access across single / multi-service and legacy formats
export const getOrderClientName = (order) => {
  if (!order) return "-";
  if (typeof order.client === "string") return order.client;
  if (order.client?.username) return order.client.username;
  if (order.username) return order.username;
  return "Client";
};

export const getOrderClientMobile = (order) => {
  if (!order) return "-";
  if (order.client?.userMobile) return order.client.userMobile;
  if (order.userMobile) return order.userMobile;
  return "-";
};

export const getOrderClientEmail = (order) => {
  if (!order) return "-";
  if (order.client?.email) return order.client.email;
  if (order.email) return order.email;
  return "-";
};

export const getOrderItems = (order) => {
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
          String(order.amount || order.baseAmount || 0).replace(/[^0-9]/g, ""),
        ) || 0,
      sareeType: order.sareeType || "Silk Saree",
      itemNotes: order.notes || "",
    },
  ];
};

export const getOrderServiceSummary = (order) => {
  const items = getOrderItems(order);
  if (items.length === 0) return "-";
  if (items.length === 1) {
    return items[0].serviceName || "Saree Service";
  }
  return `${items[0].serviceName || "Service"} (+${items.length - 1} more)`;
};

export const getOrderFabricSummary = (order) => {
  const items = getOrderItems(order);
  if (items.length === 0) return order.sareeType || "Silk Saree";
  const fabrics = items.map((it) => it.sareeType).filter(Boolean);
  if (fabrics.length === 0) return order.sareeType || "Standard Silk";
  const unique = [...new Set(fabrics)];
  if (unique.length === 1) return unique[0];
  return `${unique[0]} (+${unique.length - 1})`;
};

export const getOrderTotalAmount = (order) => {
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

export const getOrderAmountNumeric = (order) => {
  if (!order) return 0;
  if (
    order.totalAmount !== undefined &&
    order.totalAmount !== null &&
    order.totalAmount !== ""
  ) {
    return Number(order.totalAmount) || 0;
  }
  if (order.amount) {
    return Number(String(order.amount).replace(/[^0-9]/g, "")) || 0;
  }
  const items = getOrderItems(order);
  return items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);
};

export const getOrderPaidAmountNumeric = (order) => {
  if (!order) return 0;
  if ((order.status || order.orderStatus || "").toLowerCase() === "cancelled") {
    return 0;
  }
  const paymentStatus = String(order.paymentStatus || "").toLowerCase();
  const total = getOrderAmountNumeric(order);
  if (paymentStatus === "paid") {
    return order.paidAmount !== undefined &&
      order.paidAmount !== null &&
      order.paidAmount !== ""
      ? Number(order.paidAmount) || total
      : total;
  }
  if (
    order.paidAmount !== undefined &&
    order.paidAmount !== null &&
    order.paidAmount !== ""
  ) {
    return Number(order.paidAmount) || 0;
  }
  if (
    order.advancePayment !== undefined &&
    order.advancePayment !== null &&
    order.advancePayment !== ""
  ) {
    return Number(order.advancePayment) || 0;
  }
  return 0;
};

export const getOrderPendingAmountNumeric = (order) => {
  if (!order) return 0;
  if ((order.status || order.orderStatus || "").toLowerCase() === "cancelled") {
    return 0;
  }
  const paymentStatus = String(order.paymentStatus || "").toLowerCase();
  if (paymentStatus === "paid") {
    return 0;
  }
  const total = getOrderAmountNumeric(order);
  const paid = getOrderPaidAmountNumeric(order);
  if (
    order.balanceDue !== undefined &&
    order.balanceDue !== null &&
    order.balanceDue !== ""
  ) {
    return Math.max(0, Number(order.balanceDue) || 0);
  }
  return Math.max(0, total - paid);
};

const Bookings = () => {
  const { isSuperAdmin, role } = useAuth();
  const userRole = (role || "").toLowerCase();
  const isClient =
    !isSuperAdmin &&
    (userRole === USER_ROLES.CLIENT ||
      userRole === "client" ||
      userRole === "");

  // If a client accesses the Orders screen, redirect them to My Profile
  if (isClient) {
    return <Navigate to="/dashboard/profile" replace />;
  }

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Navigation
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");

  // Sorting & Pagination: recently added or recently updated show at top by default
  const [sortField, setSortField] = useState("recent");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders
  const fetchOrders = useCallback(
    async (isManualRefresh = false) => {
      if (isClient) return;
      setLoading(true);
      if (isManualRefresh) setRefreshing(true);
      try {
        const data = await getAllOrders();
        setOrders(data || []);
        if (isManualRefresh) {
          toast.success("Orders refreshed successfully!");
        }
      } catch (err) {
        if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
          return;
        }
        console.warn("Failed to load orders:", err);
        toast.error("Failed to load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isClient],
  );

  useEffect(() => {
    fetchOrders();

    const handleSynced = () => {
      fetchOrders(false);
    };

    window.addEventListener("aspp_orders_synced", handleSynced);
    return () => {
      window.removeEventListener("aspp_orders_synced", handleSynced);
    };
  }, [fetchOrders]);

  const handleOrderCreated = (newOrder) => {
    // Put newly created order at the top immediately
    setOrders((prev) => [
      newOrder,
      ...prev.filter((o) => o.id !== newOrder.id),
    ]);
  };

  const handleStatusUpdated = (orderId, newStatus, extraUpdates = {}) => {
    const updates =
      typeof newStatus === "object"
        ? newStatus
        : { status: newStatus, orderStatus: newStatus, ...extraUpdates };

    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : ord,
      ),
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : null,
      );
    }
  };

  // Metrics calculations
  const totalOrdersCount = orders.length;

  const requestedCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "requested",
    ).length;
  }, [orders]);

  const acceptedCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "accepted",
    ).length;
  }, [orders]);

  const pendingCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "pending",
    ).length;
  }, [orders]);

  const inProgressCount = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.status || o.orderStatus || "in-progress").toLowerCase() ===
        "in-progress",
    ).length;
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "completed",
    ).length;
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "delivered",
    ).length;
  }, [orders]);

  const cancelledCount = useMemo(() => {
    return orders.filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() === "cancelled",
    ).length;
  }, [orders]);

  const activeOrdersCount = useMemo(() => {
    return acceptedCount + pendingCount + inProgressCount + completedCount;
  }, [acceptedCount, pendingCount, inProgressCount, completedCount]);

  const totalReceivedRevenue = useMemo(() => {
    return orders
      .filter(
        (o) => (o.status || o.orderStatus || "").toLowerCase() !== "cancelled",
      )
      .reduce((acc, o) => acc + getOrderPaidAmountNumeric(o), 0);
  }, [orders]);

  const totalPendingRevenue = useMemo(() => {
    return orders
      .filter(
        (o) => (o.status || o.orderStatus || "").toLowerCase() !== "cancelled",
      )
      .reduce((acc, o) => acc + getOrderPendingAmountNumeric(o), 0);
  }, [orders]);

  // Service metrics breakdown across all booked orders
  const serviceStats = useMemo(() => {
    let pleating = 0;
    let draping = 0;
    let other = 0;
    let total = 0;

    orders.forEach((order) => {
      const items = getOrderItems(order);
      items.forEach((it) => {
        total += 1;
        const type = String(it.serviceType || order.serviceType || "").trim();
        const typeLower = type.toLowerCase();
        const nameLower = String(it.serviceName || "").toLowerCase();

        if (
          type === "Draping Service" ||
          typeLower.includes("drap") ||
          nameLower.includes("drap") ||
          nameLower.includes("styling")
        ) {
          draping += 1;
        } else if (
          type === "Other Service" ||
          typeLower.includes("other") ||
          nameLower.includes("custom")
        ) {
          other += 1;
        } else {
          // Default to Pleating Service
          pleating += 1;
        }
      });
    });

    return { total, pleating, draping, other };
  }, [orders]);

  // Tabs configured strictly with { label, value } for AppTabs
  const orderTabs = useMemo(
    () => [
      { label: `All Orders (${totalOrdersCount})`, value: "ALL" },
      { label: `Requested (${requestedCount})`, value: "REQUESTED" },
      { label: `Accepted (${acceptedCount})`, value: "ACCEPTED" },
      { label: `Pending (${pendingCount})`, value: "PENDING" },
      { label: `In Progress (${inProgressCount})`, value: "IN-PROGRESS" },
      { label: `Completed (${completedCount})`, value: "COMPLETED" },
      { label: `Delivered (${deliveredCount})`, value: "DELIVERED" },
      { label: `Cancelled (${cancelledCount})`, value: "CANCELLED" },
    ],
    [
      totalOrdersCount,
      requestedCount,
      acceptedCount,
      pendingCount,
      inProgressCount,
      completedCount,
      deliveredCount,
      cancelledCount,
    ],
  );

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const statusVal = (
        order.status ||
        order.orderStatus ||
        "in-progress"
      ).toUpperCase();

      if (activeTab !== "ALL" && statusVal !== activeTab) {
        return false;
      }

      if (!q) return true;

      const clientName = getOrderClientName(order).toLowerCase();
      const clientMobile = getOrderClientMobile(order).toLowerCase();
      const clientEmail = getOrderClientEmail(order).toLowerCase();
      const orderId = (order.id || "").toLowerCase();
      const occasion = (order.occasion || "").toLowerCase();
      const items = getOrderItems(order);
      const serviceMatch = items.some((it) =>
        (it.serviceName || "").toLowerCase().includes(q),
      );
      const fabricMatch = items.some((it) =>
        (it.sareeType || "").toLowerCase().includes(q),
      );

      return (
        clientName.includes(q) ||
        clientMobile.includes(q) ||
        clientEmail.includes(q) ||
        orderId.includes(q) ||
        occasion.includes(q) ||
        serviceMatch ||
        fabricMatch
      );
    });
  }, [orders, activeTab, searchTerm]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (
        sortField === "recent" ||
        sortField === "date" ||
        sortField === "createdAt" ||
        sortField === "updatedAt"
      ) {
        const aTime = getLatestItemTimestamp(a);
        const bTime = getLatestItemTimestamp(b);
        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      if (sortField === "deliveryDate") {
        const aVal = a.deliveryDate ? new Date(a.deliveryDate).getTime() : 0;
        const bVal = b.deliveryDate ? new Date(b.deliveryDate).getTime() : 0;
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortField === "client") {
        const aVal = getOrderClientName(a);
        const bVal = getOrderClientName(b);
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortField === "service") {
        const aVal = getOrderServiceSummary(a);
        const bVal = getOrderServiceSummary(b);
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortField === "sareeType") {
        const aVal = getOrderFabricSummary(a);
        const bVal = getOrderFabricSummary(b);
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortField === "amount") {
        const aVal = getOrderAmountNumeric(a);
        const bVal = getOrderAmountNumeric(b);
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      if (sortField === "status") {
        const aVal = a.status || a.orderStatus || "";
        const bVal = b.status || b.orderStatus || "";
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredOrders, sortField, sortDirection]);

  // Pagination
  const paginatedOrders = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedOrders.slice(start, start + rowsPerPage);
  }, [sortedOrders, page, rowsPerPage]);

  const handleRequestSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(
        field === "date" ||
          field === "createdAt" ||
          field === "updatedAt" ||
          field === "recent" ||
          field === "deliveryDate"
          ? "desc"
          : "asc",
      );
    }
  };

  return (
    <div className="bookings-page">
      {/* Page Header matching Clients & Services */}
      <div className="bookings-page__header">
        <div>
          <h1 className="page-title">Bookings & Orders</h1>
          <p className="page-subtitle">Comprehensive management of orders</p>
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
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
            className="refresh-btn"
          >
            {loading || refreshing ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setDialogOpen(true)}
            className="create-order-btn"
          >
            Create Order
          </AppButton>
        </div>
      </div>

      {/* 4 StatCards Grid matching Clients & Services */}
      <div className="bookings-page__stats-grid">
        <StatCard
          title="Total Orders"
          value={String(totalOrdersCount)}
          change="All recorded bookings"
          trendType="completed"
          icon={<ReceiptLongOutlinedIcon />}
        />
        <StatCard
          title="Orders Delivered"
          value={String(deliveredCount)}
          subValue={`/ ${activeOrdersCount} Active`}
          change={`${cancelledCount} Cancelled`}
          trendType={cancelledCount > 0 ? "pending" : "completed"}
          icon={<LocalShippingOutlinedIcon />}
        />
        <StatCard
          title="Total Services"
          value={String(serviceStats.total)}
          icon={<DryCleaningOutlinedIcon />}
          customFooter={
            <div className="stat-card-breakdown-row">
              <span className="breakdown-item">
                Pleating: <strong>{serviceStats.pleating}</strong>
              </span>
              <span className="breakdown-divider">•</span>
              <span className="breakdown-item">
                Draping: <strong>{serviceStats.draping}</strong>
              </span>
              <span className="breakdown-divider">•</span>
              <span className="breakdown-item">
                Other: <strong>{serviceStats.other}</strong>
              </span>
            </div>
          }
        />
        <StatCard
          title="Total Revenue"
          value={`₹${totalReceivedRevenue.toLocaleString("en-IN")}`}
          change={
            totalPendingRevenue > 0
              ? `Pending: ₹${totalPendingRevenue.toLocaleString("en-IN")}`
              : "All Paid"
          }
          trendType={totalPendingRevenue > 0 ? "pending" : "completed"}
          icon={<CurrencyRupeeIcon />}
        />
      </div>

      {/* 1. Filter Tabs Row matching Clients & Services */}
      <div className="bookings-page__tabs-row">
        <AppTabs
          tabs={orderTabs}
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val);
            setPage(0);
          }}
        />
      </div>

      {/* 2. Controls Row: View Mode Switcher on LEFT, Search on RIGHT */}
      <div className="bookings-page__toolbar">
        <AppViewToggle value={viewMode} onChange={setViewMode} />
        <div className="bookings-search-field">
          <AppInput
            placeholder="Search by client, service, fabric, order ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            startAdornment={<SearchOutlinedIcon />}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bookings-loading-wrapper">
          <AppSpinner size="lg" color="gold" />
          <span className="bookings-loading-text">
            Loading bookings & orders...
          </span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bookings-empty-wrapper">
          <ReceiptLongOutlinedIcon
            className="empty-state-icon"
            style={{ fontSize: 44 }}
          />
          <span className="empty-title">
            {orders.length === 0
              ? "No bookings or orders recorded yet"
              : "No orders found matching your search or filter criteria"}
          </span>
          <span className="empty-subtitle">
            {orders.length === 0
              ? 'Click "Create Order" above to record the first saree pre-pleating booking.'
              : "Try adjusting your search query or tab filter."}
          </span>
        </div>
      ) : viewMode === "table" ? (
        /* ========================================================== */
        /* 1. TABLE VIEW                                              */
        /* ========================================================== */
        <div className="bookings-table-card">
          <AppTableContainer className="table-responsive">
            <AppTable className="bookings-table">
              <AppTableHead>
                <AppTableRow>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "id"}
                      direction={sortField === "id" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("id")}
                    >
                      ORDER ID
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "client"}
                      direction={sortField === "client" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("client")}
                    >
                      CLIENT DETAILS
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "service"}
                      direction={
                        sortField === "service" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("service")}
                    >
                      SERVICES
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "deliveryDate"}
                      direction={
                        sortField === "deliveryDate" ? sortDirection : "asc"
                      }
                      onClick={() => handleRequestSort("deliveryDate")}
                    >
                      TARGET DELIVERY
                    </AppTableSortLabel>
                  </AppTableCell>
                  {/* <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "recent"}
                      direction={sortField === "recent" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("recent")}
                    >
                      RECENT ACTIVITY
                    </AppTableSortLabel>
                  </AppTableCell> */}
                  <AppTableCell head>
                    <AppTableSortLabel
                      active={sortField === "amount"}
                      direction={sortField === "amount" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("amount")}
                    >
                      AMOUNT
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell head style={{ textAlign: "center" }}>
                    <AppTableSortLabel
                      active={sortField === "status"}
                      direction={sortField === "status" ? sortDirection : "asc"}
                      onClick={() => handleRequestSort("status")}
                    >
                      STATUS
                    </AppTableSortLabel>
                  </AppTableCell>
                  <AppTableCell
                    head
                    className="th-actions"
                    style={{ textAlign: "right" }}
                  >
                    ACTIONS
                  </AppTableCell>
                </AppTableRow>
              </AppTableHead>
              <AppTableBody>
                {paginatedOrders.map((order) => {
                  const items = getOrderItems(order);
                  const clientName = getOrderClientName(order);
                  const clientMobile = getOrderClientMobile(order);
                  const clientEmail = getOrderClientEmail(order);
                  const initial = (clientName?.charAt(0) || "C").toUpperCase();
                  const statusVal = (
                    order.status ||
                    order.orderStatus ||
                    "in-progress"
                  ).toLowerCase();

                  return (
                    <AppTableRow
                      key={order.id}
                      className="booking-table-row"
                      onClick={() => setSelectedOrder(order)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Order ID & Occasion */}
                      <AppTableCell>
                        <div className="order-id-cell">
                          <span className="order-id-text">{order.id}</span>
                          {order.occasion && (
                            <span
                              className="order-occasion-chip"
                              title={order.occasion}
                            >
                              {order.occasion}
                            </span>
                          )}
                        </div>
                      </AppTableCell>

                      {/* Client Info Stack */}
                      <AppTableCell>
                        <div className="client-info-stack">
                          <div className="user-name-text">{clientName}</div>
                          <div className="user-email-text">
                            {clientMobile && clientMobile !== "-"
                              ? clientMobile
                              : clientEmail || "-"}
                          </div>
                        </div>
                      </AppTableCell>

                      {/* Services List */}
                      <AppTableCell>
                        <div className="services-list-compact">
                          <span className="service-primary-name">
                            {items[0]?.serviceName || "Service"}
                          </span>
                          {items.length > 1 && (
                            <span className="items-count-badge">
                              +{items.length - 1} more
                            </span>
                          )}
                        </div>
                      </AppTableCell>

                      {/* Target Delivery */}
                      <AppTableCell>
                        {order.deliveryDate ? (
                          <div className="delivery-date-chip">
                            <CalendarTodayOutlinedIcon
                              style={{ fontSize: 13 }}
                            />
                            <span>{formatDateSafe(order.deliveryDate)}</span>
                          </div>
                        ) : (
                          <span className="empty-cell-dash">-</span>
                        )}
                      </AppTableCell>

                      {/* Recent Activity Timestamp */}
                      {/* <AppTableCell>
                        <DateTimeCell
                          value={
                            order.updatedAt ||
                            order.createdAt ||
                            order.orderDate ||
                            order.date
                          }
                        />
                      </AppTableCell> */}

                      {/* Amount & Balance Due */}
                      <AppTableCell>
                        <div className="amount-cell-stack">
                          <span className="amount-cell-text">
                            {getOrderTotalAmount(order)}
                          </span>
                          {(() => {
                            const balanceDue =
                              getOrderPendingAmountNumeric(order);
                            return balanceDue > 0 ? (
                              <span className="amount-cell-due">
                                Due: ₹{balanceDue.toLocaleString("en-IN")}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </AppTableCell>

                      {/* Status */}
                      <AppTableCell style={{ textAlign: "center" }}>
                        <span className={`status-pill ${statusVal}`}>
                          <span className="dot" />
                          {statusVal.replace("-", " ")}
                        </span>
                      </AppTableCell>

                      {/* Actions */}
                      <AppTableCell
                        style={{ textAlign: "right", whiteSpace: "nowrap" }}
                      >
                        <div className="action-btns">
                          <AppButton
                            variant="info"
                            size="sm"
                            square
                            className="action-btn--view"
                            title="View Order Details & Status"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                          >
                            <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>
                          <AppButton
                            variant="secondary"
                            size="sm"
                            square
                            className="action-btn--invoice"
                            title="Download Invoice (PDF)"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadInvoicePdfDirectly(order);
                            }}
                          >
                            <FileDownloadOutlinedIcon
                              style={{ fontSize: 16 }}
                            />
                          </AppButton>
                          <AppButton
                            variant="secondary"
                            size="sm"
                            square
                            className="action-btn--share"
                            title="Share Invoice (PDF)"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareOrderPdfToWhatsApp(order);
                            }}
                          >
                            <ShareOutlinedIcon style={{ fontSize: 16 }} />
                          </AppButton>
                          <AppButton
                            variant="secondary"
                            size="sm"
                            square
                            className="action-btn--whatsapp"
                            title="Chat on WhatsApp"
                            onClick={(e) => {
                              e.stopPropagation();
                              openClientWhatsAppChat(order);
                            }}
                          >
                            <WhatsAppIcon style={{ fontSize: 16 }} />
                          </AppButton>
                        </div>
                      </AppTableCell>
                    </AppTableRow>
                  );
                })}
              </AppTableBody>
            </AppTable>
          </AppTableContainer>

          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      ) : viewMode === "grid" ? (
        /* ========================================================== */
        /* 2. GRID VIEW (Matching Services & Clients Cards)           */
        /* ========================================================== */
        <div className="bookings-grid-wrapper">
          <div className="bookings-grid">
            {paginatedOrders.map((order) => {
              const items = getOrderItems(order);
              const clientName = getOrderClientName(order);
              const clientMobile = getOrderClientMobile(order);
              const statusVal = (
                order.status ||
                order.orderStatus ||
                "in-progress"
              ).toLowerCase();
              const paymentVal = (order.paymentStatus || "paid").toLowerCase();
              const initial = (clientName?.charAt(0) || "C").toUpperCase();

              return (
                <div
                  key={order.id}
                  className="booking-grid-card"
                  onClick={() => setSelectedOrder(order)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-top-accent" />
                  <div className="card-header">
                    <span className="order-id-badge">{order.id}</span>
                    <div className="card-header-badges">
                      <span className={`status-pill ${statusVal}`}>
                        <span className="dot" />
                        {statusVal.replace("-", " ")}
                      </span>
                      <span className={`payment-pill ${paymentVal}`}>
                        <PaymentOutlinedIcon
                          style={{ fontSize: 12, marginRight: 3 }}
                        />
                        {paymentVal}
                      </span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="client-header-row">
                      <div>
                        <h4 className="client-name">{clientName}</h4>
                        {clientMobile && clientMobile !== "-" && (
                          <div className="client-mobile-hint">
                            {clientMobile}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="services-grid-list">
                      <span className="service-tag">
                        {items[0]?.serviceName || "Service"}
                      </span>
                      {order.occasion && (
                        <span
                          className="order-occasion-chip"
                          title={order.occasion}
                        >
                          <CelebrationOutlinedIcon
                            style={{ fontSize: 12, marginRight: 3 }}
                          />
                          {order.occasion}
                        </span>
                      )}
                      {items.length > 1 && (
                        <span className="items-count-badge">
                          +{items.length - 1} extra service
                          {items.length > 2 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {order.deliveryDate && (
                      <div className="order-delivery-row">
                        <span className="fabric-label">Target Delivery:</span>
                        <span className="delivery-val">
                          {formatDateSafe(order.deliveryDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="card-pricing-row">
                    <span className="amount-label">Amount</span>
                    <div className="card-pricing-val-stack">
                      <span className="amount-val">
                        {getOrderTotalAmount(order)}
                      </span>
                      {(() => {
                        const balanceDue = getOrderPendingAmountNumeric(order);
                        return balanceDue > 0 ? (
                          <span className="card-pricing-due">
                            Due: ₹{balanceDue.toLocaleString("en-IN")}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="card-footer">
                    <span className="date-info">
                      {order.deliveryDate
                        ? `Target: ${formatDateSafe(order.deliveryDate)}`
                        : order.date || "-"}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                      }}
                    >
                      <AppButton
                        size="sm"
                        variant="info"
                        square
                        className="action-btn--view"
                        title="View Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        <VisibilityOutlinedIcon style={{ fontSize: 16 }} />
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="secondary"
                        square
                        className="action-btn--invoice"
                        title="Download Invoice (PDF)"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInvoicePdfDirectly(order);
                        }}
                      >
                        <FileDownloadOutlinedIcon style={{ fontSize: 16 }} />
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="secondary"
                        square
                        className="action-btn--share"
                        title="Share Invoice (PDF)"
                        onClick={(e) => {
                          e.stopPropagation();
                          shareOrderPdfToWhatsApp(order);
                        }}
                      >
                        <ShareOutlinedIcon style={{ fontSize: 16 }} />
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="secondary"
                        square
                        className="action-btn--whatsapp"
                        title="Chat on WhatsApp"
                        onClick={(e) => {
                          e.stopPropagation();
                          openClientWhatsAppChat(order);
                        }}
                      >
                        <WhatsAppIcon style={{ fontSize: 16 }} />
                      </AppButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      ) : (
        /* ========================================================== */
        /* 3. CARD VIEW (Detailed Full-Width Order Dossier Cards)     */
        /* ========================================================== */
        <div className="bookings-card-list-wrapper">
          <div className="bookings-card-list">
            {paginatedOrders.map((order) => {
              const items = getOrderItems(order);
              const clientName = getOrderClientName(order);
              const clientMobile = getOrderClientMobile(order);
              const statusVal = (
                order.status ||
                order.orderStatus ||
                "in-progress"
              ).toLowerCase();
              const initial = (clientName?.charAt(0) || "C").toUpperCase();

              return (
                <div
                  key={order.id}
                  className="booking-detailed-card"
                  onClick={() => setSelectedOrder(order)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="detailed-card-left">
                    <div className="order-id-pill">{order.id}</div>
                    <span className={`status-pill ${statusVal}`}>
                      <span className="dot" />
                      {statusVal.replace("-", " ")}
                    </span>
                  </div>

                  <div className="detailed-card-main">
                    <div className="detailed-card-header">
                      <div className="title-row">
                        <h3 className="client-name">{clientName}</h3>
                        {clientMobile && clientMobile !== "-" && (
                          <span className="client-phone-pill">
                            <PhoneIphoneOutlinedIcon style={{ fontSize: 13 }} />
                            {clientMobile}
                          </span>
                        )}
                        <span className="service-name">
                          {items.length > 1
                            ? `${items.length} Services Booked`
                            : items[0]?.serviceName || "Saree Pre-Pleating"}
                        </span>
                        {order.occasion && (
                          <span className="occasion-badge">
                            <CelebrationOutlinedIcon
                              style={{ fontSize: 13, marginRight: 4 }}
                            />
                            {order.occasion}
                          </span>
                        )}
                      </div>

                      <div className="amount-tag">
                        {getOrderTotalAmount(order)}
                      </div>
                    </div>

                    <div className="detailed-card-meta">
                      <div className="meta-tile">
                        <span className="meta-label">Saree Fabric</span>
                        <span className="meta-value">
                          {getOrderFabricSummary(order)}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Target Delivery</span>
                        <span className="meta-value">
                          {order.deliveryDate
                            ? formatDateSafe(order.deliveryDate)
                            : "Standard"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Services Count</span>
                        <span className="meta-value">
                          {items.length} Item{items.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="meta-tile highlight-gold">
                        <span className="meta-label">Amount</span>
                        <span className="meta-value gold-amount">
                          {getOrderTotalAmount(order)}
                        </span>
                        {(() => {
                          const balanceDue =
                            getOrderPendingAmountNumeric(order);
                          return balanceDue > 0 ? (
                            <span className="dossier-due-text">
                              Due: ₹{balanceDue.toLocaleString("en-IN")}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="detailed-card-actions">
                    <AppButton
                      size="sm"
                      variant="primary"
                      startIcon={<VisibilityOutlinedIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      View Details
                    </AppButton>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      startIcon={<FileDownloadOutlinedIcon />}
                      title="Download Invoice (PDF)"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadInvoicePdfDirectly(order);
                      }}
                    >
                      Download PDF
                    </AppButton>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      startIcon={<ShareOutlinedIcon />}
                      className="action-btn--share"
                      title="Share Invoice (PDF)"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareOrderPdfToWhatsApp(order);
                      }}
                    >
                      Share Invoice
                    </AppButton>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      startIcon={<WhatsAppIcon />}
                      className="action-btn--whatsapp"
                      title="Chat on WhatsApp"
                      onClick={(e) => {
                        e.stopPropagation();
                        openClientWhatsAppChat(order);
                      }}
                    >
                      WhatsApp Chat
                    </AppButton>
                  </div>
                </div>
              );
            })}
          </div>

          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Order Details Popup Modal */}
      <OrderDetailsModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusUpdated={handleStatusUpdated}
        onOrderUpdated={handleStatusUpdated}
      />
    </div>
  );
};

export default Bookings;
