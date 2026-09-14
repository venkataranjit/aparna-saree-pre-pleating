import React, { useState, useMemo, useEffect, useCallback } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import OrderDetailsModal from "../OrderDetailsModal/OrderDetailsModal";
import {
  AppButton,
  AppTable,
  AppTableContainer,
  AppTableHead,
  AppTableBody,
  AppTableRow,
  AppTableCell,
  AppTableSortLabel,
  AppTablePagination,
  AppViewToggle,
  AppBadge,
  AppSpinner,
} from "../../../components/common";
import {
  formatDateSafe,
  getLatestItemTimestamp,
  getAllOrders,
} from "../../../firebase/dbService";
import { DateTimeCell } from "../DateTimeCell/DateTimeCell";
import "./OrdersTable.scss";

// Helpers for robust data access across single / multi-service and legacy formats
export const getOrderClientName = (order) => {
  if (!order) return "—";
  if (typeof order.client === "string") return order.client;
  if (order.client?.username) return order.client.username;
  if (order.username) return order.username;
  return "Client";
};

export const getOrderClientMobile = (order) => {
  if (!order) return "—";
  if (order.client?.userMobile) return order.client.userMobile;
  if (order.userMobile) return order.userMobile;
  if (order.phone) return order.phone;
  return "—";
};

export const getOrderClientEmail = (order) => {
  if (!order) return "—";
  if (order.client?.email) return order.client.email;
  if (order.email) return order.email;
  return "—";
};

export const getOrderItems = (order) => {
  if (!order) return [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  // Fallback for legacy single-service format
  return [
    {
      id: "item_legacy",
      serviceName: order.service || "Saree Pre-Pleating",
      servicePrice: Number(String(order.baseAmount || order.amount || 0).replace(/[^0-9]/g, "")) || 0,
      serviceDiscountedPrice: Number(String(order.amount || order.baseAmount || 0).replace(/[^0-9]/g, "")) || 0,
      finalPrice: Number(String(order.amount || 0).replace(/[^0-9]/g, "")) || 0,
      sareeType: order.sareeType || "Silk Saree",
      serviceDescription: order.packaging || "",
      itemNotes: order.notes || "",
    },
  ];
};

export const getOrderServiceSummary = (order) => {
  const items = getOrderItems(order);
  if (items.length === 0) return "—";
  if (items.length === 1) {
    return items[0].serviceName || "Saree Service";
  }
  return `${items[0].serviceName || "Service"} (+${items.length - 1} more)`;
};

export const getOrderFabricSummary = (order) => {
  const items = getOrderItems(order);
  if (items.length === 0) return order.sareeType || "Silk Saree";
  const fabrics = items.map((it) => it.sareeType).filter(Boolean);
  if (fabrics.length === 0) return "Standard Silk";
  if (fabrics.length === 1) return fabrics[0];
  const unique = [...new Set(fabrics)];
  if (unique.length === 1) return unique[0];
  return `${unique[0]} (+${unique.length - 1})`;
};

export const getOrderTotalAmount = (order) => {
  if (!order) return "₹0";
  if (order.totalAmount !== undefined && order.totalAmount !== null) {
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
  if (order.totalAmount !== undefined && order.totalAmount !== null) {
    return Number(order.totalAmount) || 0;
  }
  if (order.amount) {
    return Number(String(order.amount).replace(/[^0-9]/g, "")) || 0;
  }
  const items = getOrderItems(order);
  return items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);
};

const filterOptions = [
  "All",
  "requested",
  "accepted",
  "pending",
  "in-progress",
  "completed",
  "delivered",
  "cancelled",
];

const OrdersTable = ({
  orders: propOrders,
  loading: propLoading,
  onRefresh,
  onOrderUpdated,
}) => {
  const [internalOrders, setInternalOrders] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState("table");

  // Sorting and Pagination states: recently added or recently updated show at top by default
  const [sortField, setSortField] = useState("recent");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Self-fetch orders if propOrders is not provided
  const fetchOrders = useCallback(async () => {
    if (propOrders !== undefined) return;
    setInternalLoading(true);
    try {
      const data = await getAllOrders();
      setInternalOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setInternalLoading(false);
    }
  }, [propOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orders = propOrders !== undefined ? propOrders : internalOrders;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

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
          : "asc"
      );
    }
    setPage(0);
  };

  const handleStatusUpdateCallback = (orderId, newStatus) => {
    if (onOrderUpdated) {
      onOrderUpdated(orderId, newStatus);
    }
    // Also update locally if controlled internally
    setInternalOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? { ...ord, status: newStatus, orderStatus: newStatus, updatedAt: new Date().toISOString() }
          : ord
      )
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? { ...prev, status: newStatus, orderStatus: newStatus, updatedAt: new Date().toISOString() }
          : null
      );
    }
  };

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const statusVal = order.status || order.orderStatus || "in-progress";
      const matchesFilter =
        activeFilter === "All" || statusVal.toLowerCase() === activeFilter.toLowerCase();

      if (!matchesFilter) return false;
      if (!q) return true;

      const clientName = getOrderClientName(order).toLowerCase();
      const clientMobile = getOrderClientMobile(order).toLowerCase();
      const clientEmail = getOrderClientEmail(order).toLowerCase();
      const orderId = (order.id || "").toLowerCase();
      const occasion = (order.occasion || "").toLowerCase();
      const items = getOrderItems(order);
      const serviceMatch = items.some((it) =>
        (it.serviceName || "").toLowerCase().includes(q)
      );
      const fabricMatch = items.some((it) =>
        (it.sareeType || "").toLowerCase().includes(q)
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
  }, [orders, activeFilter, searchQuery]);

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

  const paginatedOrders = useMemo(() => {
    return sortedOrders.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedOrders, page, rowsPerPage]);

  return (
    <div className="orders-table-card">
      {/* Table Header */}
      <div className="orders-table-card__top">
        <div>
          <h3 className="title">Orders & Bookings</h3>
          <p className="subtitle">
            Manage multi-service pre-pleating, draping, and dispatch orders
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-chips-row">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => {
              setActiveFilter(filter);
              setPage(0);
            }}
            className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
          >
            {filter === "All" ? "All Orders" : filter.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Controls Row: View Switcher on LEFT, Search Bar on RIGHT */}
      <div className="orders-toolbar-row">
        <AppViewToggle value={viewMode} onChange={setViewMode} />
        <div className="search-field">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search client, service, fabric, ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="search-input"
          />
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <AppSpinner size="lg" color="gold" />
        </div>
      )}

      {/* Main Orders Content */}
      {!loading && filteredOrders.length === 0 ? (
        <div className="orders-empty-state">
          <p>
            {searchQuery || activeFilter !== "All"
              ? "No orders match your search or filter criteria."
              : "No orders recorded yet. Click 'Create Order' to add the first booking."}
          </p>
        </div>
      ) : !loading && viewMode === "table" ? (
        /* ========================================================== */
        /* 1. TABLE VIEW                                              */
        /* ========================================================== */
        <AppTableContainer className="table-wrapper">
          <AppTable>
            <AppTableHead>
              <AppTableRow>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "id"}
                    direction={sortField === "id" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("id")}
                  >
                    Order ID
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "client"}
                    direction={sortField === "client" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("client")}
                  >
                    Client
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "service"}
                    direction={sortField === "service" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("service")}
                  >
                    Services
                  </AppTableSortLabel>
                </AppTableCell>

                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "deliveryDate"}
                    direction={sortField === "deliveryDate" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("deliveryDate")}
                  >
                    Target Delivery
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "recent"}
                    direction={sortField === "recent" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("recent")}
                  >
                    Created / Updated
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "amount"}
                    direction={sortField === "amount" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("amount")}
                  >
                    Total Amount
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell head className="table-head-cell">
                  <AppTableSortLabel
                    active={sortField === "status"}
                    direction={sortField === "status" ? sortDirection : "asc"}
                    onClick={() => handleRequestSort("status")}
                  >
                    Status
                  </AppTableSortLabel>
                </AppTableCell>
                <AppTableCell
                  head
                  className="table-head-cell"
                  style={{ textAlign: "right" }}
                >
                  Action
                </AppTableCell>
              </AppTableRow>
            </AppTableHead>
            <AppTableBody>
              {paginatedOrders.map((order) => {
                const items = getOrderItems(order);
                const clientName = getOrderClientName(order);
                const clientMobile = getOrderClientMobile(order);
                const statusVal = order.status || order.orderStatus || "in-progress";

                return (
                  <AppTableRow
                    key={order.id}
                    className="table-row-item"
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: "pointer" }}
                  >
                    <AppTableCell className="table-body-cell order-id">
                      <div className="order-id-badge-cell">
                        <span>{order.id}</span>
                        {order.occasion && (
                          <span className="order-occasion-chip" title={order.occasion}>
                            {order.occasion}
                          </span>
                        )}
                      </div>
                    </AppTableCell>
                    <AppTableCell className="table-body-cell client-cell">
                      <div className="client-info-stack">
                        <div className="client-name">{clientName}</div>
                        {clientMobile && clientMobile !== "—" && (
                          <div className="client-subtext">
                            <PhoneIphoneOutlinedIcon style={{ fontSize: 13, marginRight: 2 }} />
                            {clientMobile}
                          </div>
                        )}
                      </div>
                    </AppTableCell>
                    <AppTableCell className="table-body-cell service-cell">
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

                    <AppTableCell className="table-body-cell date-cell">
                      {order.deliveryDate ? (
                        <div className="delivery-date-chip">
                          <CalendarTodayOutlinedIcon style={{ fontSize: 13 }} />
                          <span>{formatDateSafe(order.deliveryDate)}</span>
                        </div>
                      ) : (
                        <span className="empty-cell-dash">—</span>
                      )}
                    </AppTableCell>
                    <AppTableCell className="table-body-cell date-cell">
                      <DateTimeCell value={order.updatedAt || order.createdAt || order.orderDate || order.date} />
                    </AppTableCell>
                    <AppTableCell className="table-body-cell amount-cell">
                      {getOrderTotalAmount(order)}
                    </AppTableCell>
                    <AppTableCell className="table-body-cell">
                      <span className={`status-pill ${statusVal}`}>
                        <span className="dot" />
                        {statusVal.replace("-", " ")}
                      </span>
                    </AppTableCell>
                    <AppTableCell
                      className="table-body-cell"
                      style={{ textAlign: "right" }}
                    >
                      <AppButton
                        size="sm"
                        variant="secondary"
                        startIcon={<VisibilityIcon className="action-icon" />}
                        className="details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                      >
                        Details
                      </AppButton>
                    </AppTableCell>
                  </AppTableRow>
                );
              })}
            </AppTableBody>
          </AppTable>
          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </AppTableContainer>
      ) : !loading && viewMode === "grid" ? (
        /* ========================================================== */
        /* 2. GRID VIEW (Multi-Column Order Cards)                    */
        /* ========================================================== */
        <div className="orders-grid-wrapper">
          <div className="orders-grid">
            {paginatedOrders.map((order) => {
              const items = getOrderItems(order);
              const clientName = getOrderClientName(order);
              const clientMobile = getOrderClientMobile(order);
              const statusVal = order.status || order.orderStatus || "in-progress";

              return (
                <div
                  key={order.id}
                  className="order-grid-card"
                  onClick={() => setSelectedOrder(order)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-top-accent" />
                  <div className="card-header">
                    <span className="order-id-badge">{order.id}</span>
                    <span className={`status-pill ${statusVal}`}>
                      <span className="dot" />
                      {statusVal.replace("-", " ")}
                    </span>
                  </div>

                  <div className="card-body">
                    <h4 className="client-name">{clientName}</h4>
                    {clientMobile && clientMobile !== "—" && (
                      <div className="client-mobile-hint">{clientMobile}</div>
                    )}

                    <div className="services-grid-list">
                      <span className="service-tag">
                        {items[0]?.serviceName || "Service"}
                      </span>
                      {items.length > 1 && (
                        <span className="items-count-badge">
                          +{items.length - 1} extra service{items.length > 2 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="order-fabric-row">
                      <span className="fabric-label">Fabric:</span>
                      <span className="fabric-value">{getOrderFabricSummary(order)}</span>
                    </div>

                    {order.deliveryDate && (
                      <div className="order-delivery-row">
                        <span className="fabric-label">Target Delivery:</span>
                        <span className="delivery-val">{formatDateSafe(order.deliveryDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-pricing-row">
                    <span className="amount-label">
                      {items.length > 1 ? `Total (${items.length} Items)` : "Total Amount"}
                    </span>
                    <span className="amount-val">{getOrderTotalAmount(order)}</span>
                  </div>

                  <div className="card-footer">
                    <span className="date-info">
                      {order.deliveryDate ? `Target: ${formatDateSafe(order.deliveryDate)}` : (order.date || "—")}
                    </span>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      startIcon={<VisibilityIcon className="action-icon" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      Details
                    </AppButton>
                  </div>
                </div>
              );
            })}
          </div>

          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
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
        <div className="orders-card-list-wrapper">
          <div className="orders-card-list">
            {paginatedOrders.map((order) => {
              const items = getOrderItems(order);
              const clientName = getOrderClientName(order);
              const clientMobile = getOrderClientMobile(order);
              const statusVal = order.status || order.orderStatus || "in-progress";

              return (
                <div
                  key={order.id}
                  className="order-detailed-card"
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
                        {clientMobile && clientMobile !== "—" && (
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
                            <CelebrationOutlinedIcon style={{ fontSize: 13, marginRight: 4 }} />
                            {order.occasion}
                          </span>
                        )}
                      </div>

                      {/* Items mini chips preview */}
                      {items.length > 1 && (
                        <div className="items-mini-chips">
                          {items.map((it, idx) => (
                            <span key={it.id || idx} className="item-mini-chip">
                              <DryCleaningOutlinedIcon style={{ fontSize: 12, marginRight: 4 }} />
                              {it.serviceName} ({it.sareeType || "Saree"}) — ₹{it.finalPrice || 0}
                            </span>
                          ))}
                        </div>
                      )}

                      {order.notes && <p className="order-notes">{order.notes}</p>}
                    </div>

                    <div className="detailed-card-meta">
                      <div className="meta-tile">
                        <span className="meta-label">Saree Fabric</span>
                        <span className="meta-value">{getOrderFabricSummary(order)}</span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Target Delivery</span>
                        <span className="meta-value">
                          {order.deliveryDate ? formatDateSafe(order.deliveryDate) : "Standard"}
                        </span>
                      </div>
                      <div className="meta-tile">
                        <span className="meta-label">Services Count</span>
                        <span className="meta-value">{items.length} Item{items.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="meta-tile highlight-gold">
                        <span className="meta-label">Total Amount</span>
                        <span className="meta-value gold-amount">{getOrderTotalAmount(order)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detailed-card-actions">
                    <AppButton
                      size="sm"
                      variant="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      View Details
                    </AppButton>
                  </div>
                </div>
              );
            })}
          </div>

          <AppTablePagination
            count={sortedOrders.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Order Details Popup Modal */}
      <OrderDetailsModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onStatusUpdated={handleStatusUpdateCallback}
      />
    </div>
  );
};

export default OrdersTable;
