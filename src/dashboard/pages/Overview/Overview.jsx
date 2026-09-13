import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StatCard from "../../components/StatCard/StatCard";
import { AppButton, AppSpinner, AppBadge } from "../../../components/common";
import CreateOrderModal from "../../components/CreateOrderModal/CreateOrderModal";
import OrderDetailsModal from "../../components/OrderDetailsModal/OrderDetailsModal";
import DateTimeCell from "../../components/DateTimeCell/DateTimeCell";
import { useAuth } from "../../../auth/context/AuthContext";
import { USER_ROLES } from "../../../firebase/schema";
import {
  getAllOrders,
  getAllServices,
  getAllClients,
  getAllUsers,
  getOrdersByUserId,
  getMeasurementsByUserId,
  formatDateSafe,
} from "../../../firebase/dbService";
import "./Overview.scss";

const Overview = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, role, isSuperAdmin } = useAuth();
  const userRole = (role || "").toLowerCase();
  const isClient =
    !isSuperAdmin &&
    (userRole === USER_ROLES.CLIENT ||
      userRole === "client" ||
      userRole === "");

  const currentUid = currentUser?.uid || userProfile?.id;
  const displayName =
    userProfile?.username ||
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split("@")[0] : "Client");

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [clientMeasurements, setClientMeasurements] = useState([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const deckScrollRef = React.useRef(null);

  const scrollDeckLeft = () => {
    if (deckScrollRef.current) {
      deckScrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollDeckRight = () => {
    if (deckScrollRef.current) {
      deckScrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const loadOverviewData = useCallback(async () => {
    setLoading(true);
    try {
      if (isClient) {
        // Strictly isolated client loader: fetch only current client's data
        if (currentUid) {
          const [myOrdersData, myMeasuresData, activeServicesData] =
            await Promise.all([
              getOrdersByUserId(currentUid).catch(() => []),
              getMeasurementsByUserId(currentUid).catch(() => []),
              getAllServices(true).catch(() => []),
            ]);
          setOrders(myOrdersData || []);
          setClientMeasurements(myMeasuresData || []);
          setServices(activeServicesData || []);
        } else {
          setOrders([]);
          setClientMeasurements([]);
          setServices([]);
        }
      } else {
        // Standard Admin / Staff Loader
        const [ordersData, servicesData, clientsData, usersData] =
          await Promise.all([
            getAllOrders().catch(() => []),
            getAllServices(false).catch(() => []),
            getAllClients().catch(() => []),
            getAllUsers().catch(() => []),
          ]);

        setOrders(ordersData || []);
        setServices(servicesData || []);

        const clientIds = new Set();
        (clientsData || []).forEach((c) => {
          if (c && c.id) clientIds.add(c.id);
        });
        (usersData || []).forEach((u) => {
          if (u && (u.role === USER_ROLES.CLIENT || !u.role)) {
            clientIds.add(u.id || u.email);
          }
        });
        setClientsCount(clientIds.size);
      }
    } catch (err) {
      console.error("Failed to load overview metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [isClient, currentUid]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  // Admin calculations
  const totalOrders = orders.length;
  const totalServices = services.length;
  const totalReceivedRevenue = orders
    .filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() !== "cancelled",
    )
    .reduce((sum, ord) => {
      const paymentStatus = String(ord.paymentStatus || "").toLowerCase();
      const total =
        Number(ord.totalAmount) ||
        Number(String(ord.amount || 0).replace(/[^0-9]/g, "")) ||
        0;
      if (paymentStatus === "paid") {
        return (
          sum +
          (ord.paidAmount !== undefined &&
          ord.paidAmount !== null &&
          ord.paidAmount !== ""
            ? Number(ord.paidAmount) || total
            : total)
        );
      }
      const paid = Number(ord.paidAmount) || Number(ord.advancePayment) || 0;
      return sum + paid;
    }, 0);

  const totalPendingRevenue = orders
    .filter(
      (o) => (o.status || o.orderStatus || "").toLowerCase() !== "cancelled",
    )
    .reduce((sum, ord) => {
      const paymentStatus = String(ord.paymentStatus || "").toLowerCase();
      if (paymentStatus === "paid") return sum;
      const total =
        Number(ord.totalAmount) ||
        Number(String(ord.amount || 0).replace(/[^0-9]/g, "")) ||
        0;
      const paid = Number(ord.paidAmount) || Number(ord.advancePayment) || 0;
      const pending =
        ord.balanceDue !== undefined &&
        ord.balanceDue !== null &&
        ord.balanceDue !== ""
          ? Math.max(0, Number(ord.balanceDue) || 0)
          : Math.max(0, total - paid);
      return sum + pending;
    }, 0);

  // Client calculations
  const clientInProgressCount = orders.filter(
    (o) =>
      (o.status || o.orderStatus || "in-progress").toLowerCase() ===
      "in-progress",
  ).length;

  const clientCompletedCount = orders.filter(
    (o) => (o.status || o.orderStatus || "").toLowerCase() === "completed",
  ).length;

  const recentOrders = orders.slice(0, 4);

  return (
    <div className="overview-page">
      {/* Header Section with Dashboard Title and Action Buttons */}
      <div className="overview-page__header">
        <div className="overview-header-title-wrap">
          <h1 className="overview-page-title">
            {isClient ? `Welcome, ${displayName}` : "Dashboard"}
          </h1>
          <p className="overview-page-caption">
            {isClient
              ? "Track your saree pre-pleating orders, scheduling & tailored profiles"
              : "Real-time overview of saree pre-pleating operations, orders & revenue"}
          </p>
        </div>

        <div className="action-buttons">
          <AppButton
            variant="secondary"
            startIcon={
              <RefreshOutlinedIcon className={loading ? "spin-icon" : ""} />
            }
            className="refresh-btn"
            onClick={loadOverviewData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </AppButton>
          <AppButton
            variant="primary"
            startIcon={<AddIcon />}
            className="new-booking-btn"
            onClick={() => setOpenCreateModal(true)}
          >
            {isClient ? "Book Saree" : "New Booking"}
          </AppButton>
        </div>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0",
          }}
        >
          <AppSpinner size="lg" color="gold" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Admin & Staff Overview                                                 */}
      {/* ========================================================================= */}
      {!loading && !isClient && (
        <>
          <div className="overview-page__stats-grid">
            <StatCard
              title="Orders"
              value={String(totalOrders)}
              change={
                totalOrders === 1
                  ? "1 Active Job"
                  : `${totalOrders} Orders Total`
              }
              trendType="completed"
              icon={<ReceiptLongOutlinedIcon />}
            />

            <StatCard
              title="Services"
              value={String(totalServices)}
              change={
                totalServices === 1
                  ? "1 Active Offering"
                  : `${totalServices} Saree Offerings`
              }
              trendType="completed"
              icon={<DryCleaningOutlinedIcon />}
            />

            <StatCard
              title="Clients"
              value={String(clientsCount)}
              change={
                clientsCount === 1
                  ? "1 Registered Client"
                  : `${clientsCount} Registered Clients`
              }
              trendType="completed"
              icon={<PeopleOutlineIcon />}
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

          {/* Saree Lookbook Horizontal Overlapping Zigzag Deck (Frameless) */}
          <div className="overview-horizontal-deck-wrapper" ref={deckScrollRef}>
            <div className="wrapper">
              <div>
                <img
                  src="https://picsum.photos/id/660/1200/1200"
                  alt="sparkler"
                />
              </div>
              <div>
                <img src="https://picsum.photos/id/669/1200/1200" alt="hat" />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/823/1200/1200"
                  alt="camera"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/64/1200/1200"
                  alt="flowers"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/836/1200/1200"
                  alt="guitar"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/1027/1200/1200"
                  alt="pensive"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/646/1200/1200"
                  alt="sunlight"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/634/1200/1200"
                  alt="misty morning"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/228/1200/1200"
                  alt="harvest"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/661/1200/1200"
                  alt="waiting"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/380/1200/1200"
                  alt="time"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/392/1200/1200"
                  alt="crossover"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/238/1200/1200"
                  alt="city"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/469/1200/1200"
                  alt="boat trip"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/311/1200/1200"
                  alt="stories"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/515/1200/1200"
                  alt="portrait"
                />
              </div>
              <div>
                <img
                  src="https://picsum.photos/id/521/1200/1200"
                  alt="perfect day"
                />
              </div>
            </div>
          </div>

          {/* Centered Prev & Next Navigation Buttons */}
          <div className="deck-bottom-nav-controls">
            <button
              type="button"
              className="deck-nav-btn"
              onClick={scrollDeckLeft}
              aria-label="Previous image"
            >
              <ChevronLeftIcon />
              <span>Prev</span>
            </button>

            <button
              type="button"
              className="deck-nav-btn"
              onClick={scrollDeckRight}
              aria-label="Next image"
            >
              <span>Next</span>
              <ChevronRightIcon />
            </button>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. Client Overview (Isolated & Tailored Experience)                       */}
      {/* ========================================================================= */}
      {!loading && isClient && (
        <div className="client-overview-wrap">
          {/* Client Metrics Grid */}
          <div className="overview-page__stats-grid">
            <StatCard
              title="My Orders"
              value={String(totalOrders)}
              change={
                totalOrders === 1
                  ? "1 Saree Order"
                  : `${totalOrders} Total Bookings`
              }
              trendType="completed"
              icon={<ReceiptLongOutlinedIcon />}
            />

            <StatCard
              title="In Progress"
              value={String(clientInProgressCount)}
              change="Active pre-pleating jobs"
              trendType="pending"
              icon={<PendingActionsOutlinedIcon />}
            />

            <StatCard
              title="Completed"
              value={String(clientCompletedCount)}
              change="Delivered & Ready"
              trendType="completed"
              icon={<CheckCircleOutlineIcon />}
            />

            <StatCard
              title="Measurement Profiles"
              value={String(clientMeasurements.length)}
              change="Saved sizing profiles"
              trendType="completed"
              icon={<StraightenOutlinedIcon />}
            />
          </div>

          {/* Client Quick Action Banner */}
          <div className="client-hero-action-card">
            <div className="hero-content">
              <span className="hero-badge">Aparna Saree Pre-Pleating</span>
              <h2 className="hero-heading">
                Perfect Pleats & Flawless Drapes for Every Saree
              </h2>
              <p className="hero-desc">
                Book professional pre-pleating, box folding, or custom tailoring
                using your saved measurements with doorstep delivery.
              </p>
              <div className="hero-btns">
                <AppButton
                  variant="primary"
                  size="md"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateModal(true)}
                >
                  Book New Saree
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="md"
                  startIcon={<StraightenOutlinedIcon />}
                  onClick={() => navigate("/dashboard/profile")}
                >
                  My Measurements
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="md"
                  startIcon={<ReceiptLongOutlinedIcon />}
                  onClick={() => navigate("/dashboard/profile")}
                >
                  View My Orders
                </AppButton>
              </div>
            </div>
          </div>

          {/* Recent Orders Showcase */}
          <div className="client-recent-orders-card">
            <div className="section-title-row">
              <div>
                <h3 className="section-title">My Recent Bookings</h3>
                <p className="section-subtitle">
                  Latest status of your saree pre-pleating orders
                </p>
              </div>
              <AppButton
                variant="ghost"
                size="sm"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate("/dashboard/profile")}
              >
                View All Orders
              </AppButton>
            </div>

            {orders.length === 0 ? (
              <div className="empty-orders-state">
                <ReceiptLongOutlinedIcon className="empty-icon" />
                <h4>No bookings yet</h4>
                <p>
                  You haven't placed any saree pre-pleating orders yet. Click
                  below to book your first order!
                </p>
                <AppButton
                  variant="primary"
                  size="sm"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateModal(true)}
                >
                  Book Your First Saree
                </AppButton>
              </div>
            ) : (
              <div className="recent-orders-grid">
                {recentOrders.map((ord) => {
                  const items = Array.isArray(ord.items) ? ord.items : [];
                  const serviceName =
                    items[0]?.serviceName ||
                    ord.service ||
                    "Saree Pre-Pleating";
                  const totalAmt =
                    ord.totalAmount !== undefined && ord.totalAmount !== null
                      ? `₹${Number(ord.totalAmount).toLocaleString("en-IN")}`
                      : ord.amount
                        ? String(ord.amount).includes("₹")
                          ? ord.amount
                          : `₹${ord.amount}`
                        : "₹0";
                  const status = (
                    ord.status ||
                    ord.orderStatus ||
                    "pending"
                  ).toLowerCase();
                  const deliveryStr = formatDateSafe(ord.deliveryDate);

                  return (
                    <div key={ord.id} className="recent-order-item">
                      <div className="order-top">
                        <span className="order-id">{ord.id}</span>
                        <AppBadge
                          variant={
                            status === "completed"
                              ? "success"
                              : status === "in-progress"
                                ? "warning"
                                : status === "cancelled"
                                  ? "danger"
                                  : "neutral"
                          }
                        >
                          {status === "in-progress" ? "In Progress" : status}
                        </AppBadge>
                      </div>

                      <div className="order-service">
                        <DryCleaningOutlinedIcon className="svc-icon" />
                        <span className="svc-name">
                          {serviceName}
                          {items.length > 1 && ` (+ ${items.length - 1} more)`}
                        </span>
                      </div>

                      <div className="order-meta-row">
                        <div className="meta-item">
                          <CalendarTodayOutlinedIcon className="meta-icon" />
                          <span>Delivery: {deliveryStr}</span>
                        </div>
                        <span className="order-price">{totalAmt}</span>
                      </div>

                      <div className="order-actions">
                        <AppButton
                          variant="secondary"
                          size="sm"
                          fullWidth
                          startIcon={<VisibilityOutlinedIcon />}
                          onClick={() => setSelectedOrderForView(ord)}
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
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onOrderCreated={loadOverviewData}
        clientMode={isClient}
        initialClient={
          isClient
            ? {
                id: currentUid,
                username: displayName,
                userMobile: userProfile?.userMobile || "",
                email: userProfile?.email || currentUser?.email || "",
                userAddress: userProfile?.userAddress || "",
                role: USER_ROLES.CLIENT,
              }
            : null
        }
        initialMeasurements={isClient ? clientMeasurements : null}
      />

      {/* Order Details Modal (Client Read-Only) */}
      <OrderDetailsModal
        open={Boolean(selectedOrderForView)}
        onClose={() => setSelectedOrderForView(null)}
        order={selectedOrderForView}
        readOnly={true}
      />
    </div>
  );
};

export default Overview;
