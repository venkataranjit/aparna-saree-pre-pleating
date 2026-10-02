import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import DryCleaningOutlinedIcon from "@mui/icons-material/DryCleaningOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";

import { AppModal, AppButton, AppSpinner } from "../../../components/common";
import {
  downloadInvoicePdfDirectly,
  shareOrderPdfToWhatsApp,
  openClientWhatsAppChat,
} from "../CustomInvoiceModal/CustomInvoiceModal";
import {
  formatDateSafe,
  formatTimeSafe,
  updateOrder,
} from "../../../firebase/dbService";
import { USER_ROLES } from "../../../firebase/schema";
import { useAuth } from "../../../auth/context/AuthContext";
import "./OrderDetailsModal.scss";

const OrderDetailsModal = ({
  open,
  onClose,
  order,
  readOnly = false,
  onStatusUpdated,
  onOrderUpdated,
}) => {
  const {
    currentUser,
    userProfile,
    isSuperAdmin,
    isAdmin,
    isStaff,
    canEdit,
    role,
  } = useAuth();
  const [currentStatus, setCurrentStatus] = useState("in-progress");
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState("paid");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTarget, setUpdatingTarget] = useState(null);

  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || order.orderStatus || "in-progress");
      setCurrentPaymentStatus(order.paymentStatus || "paid");
    }
  }, [order]);

  if (!open || !order) return null;

  // Check if active user has admin/staff permissions to update workflow & payment statuses
  const canUpdate =
    !readOnly &&
    (isSuperAdmin ||
      isAdmin ||
      isStaff ||
      canEdit ||
      role === USER_ROLES.SUPERADMIN ||
      role === USER_ROLES.ADMIN ||
      role === USER_ROLES.STAFF ||
      role === "superadmin" ||
      role === "admin" ||
      role === "staff");

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || updatingStatus) return;
    setUpdatingStatus(true);
    setUpdatingTarget(`order-${newStatus}`);
    try {
      const activeUid = currentUser?.uid || userProfile?.id || "";
      await updateOrder(order.id, {
        status: newStatus,
        orderStatus: newStatus,
        updatedBy: activeUid,
        updatedAt: new Date().toISOString(),
      });
      setCurrentStatus(newStatus);
      toast.success(`Order ${order.id} status updated to "${newStatus}"!`);
      if (onStatusUpdated) {
        onStatusUpdated(order.id, newStatus);
      }
      if (onOrderUpdated) {
        onOrderUpdated(order.id, {
          status: newStatus,
          orderStatus: newStatus,
          updatedBy: activeUid,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Status update failed:", err);
      toast.error("Failed to update status.");
    } finally {
      setUpdatingStatus(false);
      setUpdatingTarget(null);
    }
  };

  const handlePaymentStatusChange = async (newPayStatus) => {
    if (newPayStatus === currentPaymentStatus || updatingStatus) return;
    setUpdatingStatus(true);
    setUpdatingTarget(`pay-${newPayStatus}`);
    try {
      const activeUid = currentUser?.uid || userProfile?.id || "";
      const totalAmt = Number(
        order.totalAmount !== undefined && order.totalAmount !== null
          ? order.totalAmount
          : order.amount || 0,
      );
      const advPaid = Number(order.advancePayment || 0);
      const remainingDue = Math.max(0, totalAmt - advPaid);

      let updatePayload = {
        paymentStatus: newPayStatus,
        updatedBy: activeUid,
        updatedAt: new Date().toISOString(),
      };

      if (newPayStatus === "paid") {
        updatePayload = {
          ...updatePayload,
          balancePaid:
            remainingDue > 0
              ? remainingDue
              : advPaid > 0
                ? remainingDue
                : totalAmt,
          balanceDue: 0,
          paidAmount: totalAmt,
        };
      } else if (newPayStatus === "partial") {
        updatePayload = {
          ...updatePayload,
          balancePaid: 0,
          balanceDue: advPaid > 0 ? remainingDue : totalAmt,
          paidAmount: advPaid > 0 ? advPaid : 0,
        };
      } else if (newPayStatus === "pending") {
        updatePayload = {
          ...updatePayload,
          balancePaid: 0,
          balanceDue: totalAmt,
          paidAmount: 0,
        };
      }

      await updateOrder(order.id, updatePayload);
      setCurrentPaymentStatus(newPayStatus);
      const label =
        newPayStatus === "paid"
          ? "Paid in Full"
          : newPayStatus === "partial"
            ? "Advance / Partial"
            : "Pending Payment";
      toast.success(`Order ${order.id} payment updated to "${label}"!`);
      if (onOrderUpdated) {
        onOrderUpdated(order.id, updatePayload);
      }
    } catch (err) {
      console.error("Payment status update failed:", err);
      toast.error("Failed to update payment status.");
    } finally {
      setUpdatingStatus(false);
      setUpdatingTarget(null);
    }
  };

  const clientName =
    order.username ||
    order.client?.username ||
    (typeof order.client === "string" ? order.client : "Client");
  const clientMobile =
    order.userMobile || order.client?.userMobile || order.phone || "-";
  const clientEmail = order.email || order.client?.email || "-";
  const clientAddress =
    order.userAddress || order.client?.userAddress || order.address || "-";

  // Normalize items array
  const rawItems =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [
          {
            itemId: "default_1",
            serviceName: order.service || "Saree Pre-Pleating & Fold",
            servicePrice:
              Number(
                String(order.amount || order.baseAmount || "0").replace(
                  /[^0-9]/g,
                  "",
                ),
              ) || 1000,
            serviceDiscountedPrice:
              Number(String(order.amount || "0").replace(/[^0-9]/g, "")) ||
              1000,
            finalPrice:
              Number(String(order.amount || "0").replace(/[^0-9]/g, "")) ||
              1000,
            sareeType: order.sareeType || "",
            measurementProfile: {
              title: "Saved Profile",
              pallu: order.palluStyle || "Standard Pin Fold",
              firstPleatSize: order.pleatCount || '6 Pleats (5.5" width)',
              notes: order.packaging || "",
            },
            itemNotes: order.notes || "",
          },
        ];

  const pickupCharges = Number(order.pickupDeliveryCharges || 0);
  const otherCharges = Number(order.otherCharges || 0);
  const discountAmount = Number(order.discount || 0);
  const subtotalAmount = Number(
    order.subtotal !== undefined && order.subtotal !== null
      ? order.subtotal
      : 0,
  );
  const totalCalculatedAmount = Number(
    order.totalAmount !== undefined && order.totalAmount !== null
      ? order.totalAmount
      : order.amount || 0,
  );

  const isPaidInFull = currentPaymentStatus === "paid";
  const initialAdvance = Number(order.advancePayment || 0);
  const currentPaidAmount = isPaidInFull
    ? totalCalculatedAmount
    : Number(
        order.paidAmount !== undefined &&
          order.paidAmount !== null &&
          order.paidAmount !== ""
          ? order.paidAmount
          : initialAdvance,
      );

  const balanceDue = isPaidInFull
    ? 0
    : Math.max(0, totalCalculatedAmount - currentPaidAmount);

  const balancePaidAmount = isPaidInFull
    ? initialAdvance > 0
      ? Math.max(0, totalCalculatedAmount - initialAdvance)
      : totalCalculatedAmount
    : Number(
        order.balancePaid !== undefined &&
          order.balancePaid !== null &&
          !isNaN(Number(order.balancePaid))
          ? order.balancePaid
          : 0,
      );

  const totalQuantity =
    order.totalQuantity ||
    rawItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <div className="order-details-modal-title">
          <span className="order-id-label">{order.id}</span>
          <span className={`status-pill ${currentStatus}`}>
            <span className="dot" />
            {currentStatus.replace("-", " ")}
          </span>
        </div>
      }
      subtitle="Order Details"
      maxWidth="lg"
      className="order-details-app-modal"
      bodyClassName="order-details-modal-body"
      actions={
        <div className="order-details-actions-bar">
          <div className="order-summary-pill">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-val">
              ₹{Number(totalCalculatedAmount).toLocaleString("en-IN")}
            </span>
            <span className="summary-count">
              ({totalQuantity} {totalQuantity === 1 ? "Saree" : "Sarees"} •{" "}
              {rawItems.length} {rawItems.length === 1 ? "Service" : "Services"}
              )
            </span>
          </div>
          <div className="actions-right">
            <AppButton
              variant="secondary"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={() => downloadInvoicePdfDirectly(order)}
              className="custom-invoice-btn"
              title="Download Invoice (PDF)"
            ></AppButton>
            <AppButton
              variant="secondary"
              startIcon={<ShareOutlinedIcon />}
              onClick={() => shareOrderPdfToWhatsApp(order)}
              className="share-invoice-btn"
              title="Share Invoice (PDF)"
            ></AppButton>
            <AppButton
              variant="secondary"
              startIcon={<WhatsAppIcon />}
              onClick={() => openClientWhatsAppChat(order)}
              className="whatsapp-chat-btn"
              title="Chat on WhatsApp"
            ></AppButton>
            <AppButton
              variant="primary"
              onClick={onClose}
              className="close-btn"
            >
              Close
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="order-details-content">
        <div
          className="modal-grid-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          {/* 1. Client Profile */}
          <div className="details-card">
            <div className="details-card__head">
              <PersonOutlineIcon className="card-head-icon" />
              <span className="card-head-title">Client Information</span>
            </div>
            <div className="details-card__body">
              <div className="info-row">
                <span className="info-label">Full Name</span>
                <span className="info-val highlight">{clientName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Mobile</span>
                <span
                  className="info-val"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    <PhoneOutlinedIcon className="inline-icon" />
                    {clientMobile}
                  </span>
                  {clientMobile && clientMobile !== "-" && (
                    <button
                      type="button"
                      className="inline-wa-btn"
                      title="Open WhatsApp Chat"
                      onClick={() => openClientWhatsAppChat(order)}
                    >
                      <WhatsAppIcon style={{ fontSize: 14 }} />
                      <span>Chat</span>
                    </button>
                  )}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-val">
                  <EmailOutlinedIcon className="inline-icon" />
                  {clientEmail}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Address</span>
                <span className="info-val">
                  <LocationOnOutlinedIcon className="inline-icon" />
                  {clientAddress}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Timeline & Occasion */}
          <div className="details-card">
            <div className="details-card__head">
              <CalendarMonthOutlinedIcon className="card-head-icon" />
              <span className="card-head-title">Timeline & Occasion</span>
            </div>
            <div className="details-card__body">
              <div className="info-row">
                <span className="info-label">Booking Date</span>
                <span className="info-val">
                  {formatDateSafe(
                    order.orderDate || order.date || order.createdAt,
                  )}
                  {formatTimeSafe(
                    order.orderDate || order.date || order.createdAt,
                  )
                    ? ` (${formatTimeSafe(order.orderDate || order.date || order.createdAt)})`
                    : ""}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Expected Delivery</span>
                <span className="info-val highlight">
                  <EventAvailableOutlinedIcon className="inline-icon" />
                  {formatDateSafe(order.deliveryDate || order.eventDate)}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Occasion / Event</span>
                <span className="info-val">
                  <CelebrationOutlinedIcon className="inline-icon" />
                  {order.occasion && String(order.occasion).trim()
                    ? order.occasion
                    : "-"}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Total Sarees</span>
                <span className="info-val highlight">
                  {rawItems.length}{" "}
                  {rawItems.length === 1 ? "Service" : "Services"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Ordered Services & Detailed Measurement Breakdown */}
        <div className="details-card" style={{ marginBottom: "16px" }}>
          <div className="details-card__head">
            <DryCleaningOutlinedIcon className="card-head-icon" />
            <span className="card-head-title">
              Services ({rawItems.length})
            </span>
          </div>
          <div className="details-card__body">
            <div className="dossier-items-list">
              {rawItems.map((item, idx) => {
                const m = item.measurementProfile;
                const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
                const regularPrice = Number(
                  item.servicePrice || item.unitPrice || 0,
                );
                const offerPrice = Number(
                  item.serviceDiscountedPrice !== undefined &&
                    item.serviceDiscountedPrice !== null &&
                    Number(item.serviceDiscountedPrice) > 0
                    ? item.serviceDiscountedPrice
                    : regularPrice,
                );
                const unitPrice = offerPrice || regularPrice;
                const lineTotal =
                  item.finalPrice !== undefined &&
                  item.finalPrice !== null &&
                  !isNaN(Number(item.finalPrice))
                    ? Number(item.finalPrice)
                    : unitPrice * qty;
                const hasDiscount = regularPrice > offerPrice && offerPrice > 0;

                return (
                  <div key={item.itemId || idx} className="dossier-item-box">
                    <div className="dossier-item-header">
                      <div className="item-title-wrap">
                        <span className="item-idx-tag">Service #{idx + 1}</span>
                        <span className="item-name-text">
                          {item.serviceName}
                        </span>
                        {qty > 1 && (
                          <span className="item-qty-multiplier-pill">
                            × {qty}
                          </span>
                        )}
                      </div>
                      <div className="item-price-tag">
                        {qty > 1 ? (
                          <div className="item-price-combo">
                            <span className="item-calc-breakdown">
                              ₹{unitPrice.toLocaleString("en-IN")} × {qty} =
                            </span>
                            <span className="offer-price-val">
                              ₹{lineTotal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : hasDiscount ? (
                          <div className="item-price-combo">
                            <span className="regular-price-strike">
                              ₹{regularPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="offer-price-val">
                              ₹{offerPrice.toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span className="offer-price-val">
                            ₹
                            {(offerPrice || regularPrice || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Line 1: Saree Fabric, Measurement Profile, and Dress Size (compact) in one line */}
                    <div
                      className={`dossier-item-primary-grid ${m?.dressSize ? "has-dress-size" : ""}`}
                    >
                      <div className="spec-tile">
                        <DryCleaningOutlinedIcon className="spec-icon" />
                        <span className="spec-label">Saree Fabric</span>
                        <span className="spec-val highlight">
                          {item.sareeType || "-"}
                        </span>
                      </div>

                      <div className="spec-tile">
                        <StraightenOutlinedIcon className="spec-icon" />
                        <span className="spec-label">Measurement Profile</span>
                        <span className="spec-val">
                          {m?.title ||
                            (item.includeMeasurements === false
                              ? "Standard (No Measurements)"
                              : "Custom Sizing")}
                        </span>
                      </div>

                      {m?.dressSize && (
                        <div className="spec-tile spec-tile--compact">
                          <StraightenOutlinedIcon className="spec-icon" />
                          <span className="spec-label">Dress Size</span>
                          <span className="spec-val">{m.dressSize}</span>
                        </div>
                      )}
                    </div>

                    {/* Line 2: Remaining 7 Measurement Parameters in one row */}
                    {(m?.pallu ||
                      m?.shoulderToRightTight ||
                      m?.chest ||
                      m?.hip ||
                      m?.firstPleatSize ||
                      m?.noOfChestPleats ||
                      m?.height) && (
                      <div className="dossier-item-measurements-grid">
                        {m?.pallu && (
                          <div className="spec-tile">
                            <LayersOutlinedIcon className="spec-icon" />
                            <span className="spec-label">Pallu Spec</span>
                            <span className="spec-val">{m.pallu}&quot;</span>
                          </div>
                        )}

                        {m?.shoulderToRightTight && (
                          <div className="spec-tile">
                            <StraightenOutlinedIcon className="spec-icon" />
                            <span className="spec-label">
                              Shoulder to Tight
                            </span>
                            <span className="spec-val">
                              {m.shoulderToRightTight}&quot;
                            </span>
                          </div>
                        )}

                        {m?.chest && (
                          <div className="spec-tile">
                            <StraightenOutlinedIcon className="spec-icon" />
                            <span className="spec-label">Chest Size</span>
                            <span className="spec-val">{m.chest}&quot;</span>
                          </div>
                        )}

                        {m?.hip && (
                          <div className="spec-tile">
                            <StraightenOutlinedIcon className="spec-icon" />
                            <span className="spec-label">Hip Size</span>
                            <span className="spec-val">{m.hip}&quot;</span>
                          </div>
                        )}

                        {m?.firstPleatSize && (
                          <div className="spec-tile">
                            <StraightenOutlinedIcon className="spec-icon" />
                            <span className="spec-label">First Pleat</span>
                            <span className="spec-val">
                              {m.firstPleatSize}&quot;
                            </span>
                          </div>
                        )}

                        {m?.noOfChestPleats && (
                          <div className="spec-tile">
                            <LayersOutlinedIcon className="spec-icon" />
                            <span className="spec-label">Chest Pleats</span>
                            <span className="spec-val">
                              {m.noOfChestPleats}
                            </span>
                          </div>
                        )}

                        {m?.height && (
                          <div className="spec-tile">
                            <PersonOutlineIcon className="spec-icon" />
                            <span className="spec-label">Height</span>
                            <span className="spec-val">{m.height}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.itemNotes && (
                      <div className="item-note-callout">
                        <InfoOutlinedIcon style={{ fontSize: 14 }} />
                        <span>
                          <strong>Special Care:</strong> {item.itemNotes}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Special Instructions Callout */}
        {order.notes && (
          <div
            className="instructions-callout"
            style={{ marginBottom: "16px" }}
          >
            <NotesOutlinedIcon className="callout-icon" />
            <div>
              <span className="callout-title">
                Order Notes & Booking Instructions
              </span>
              <p className="callout-text">{order.notes}</p>
            </div>
          </div>
        )}

        {/* 5. Payment & Status Controls / Overview */}
        <div className="payment-card">
          {/* Left Panel: Workflow & Status Controls */}
          <div className="payment-card__workflow">
            <div className="panel-header">
              <div className="panel-header__title">
                <PaymentOutlinedIcon className="panel-icon" />
                <span>
                  {canUpdate
                    ? "Workflow & Order Controls"
                    : "Workflow & Order Status"}
                </span>
              </div>
            </div>

            {canUpdate ? (
              <div className="controls-body">
                <div className="status-section">
                  <span className="section-subtitle">Update Order Status</span>
                  <div className="status-pill-grid">
                    <button
                      type="button"
                      className={`status-chip status-chip--requested ${currentStatus === "requested" ? "active" : ""}`}
                      onClick={() => handleStatusChange("requested")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-requested" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <AssignmentOutlinedIcon className="chip-icon" />
                      )}
                      <span>Requested</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--accepted ${currentStatus === "accepted" ? "active" : ""}`}
                      onClick={() => handleStatusChange("accepted")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-accepted" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <FactCheckOutlinedIcon className="chip-icon" />
                      )}
                      <span>Accepted</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--pending ${currentStatus === "pending" ? "active" : ""}`}
                      onClick={() => handleStatusChange("pending")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-pending" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <HourglassEmptyOutlinedIcon className="chip-icon" />
                      )}
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--in-progress ${currentStatus === "in-progress" || currentStatus === "inprogress" ? "active" : ""}`}
                      onClick={() => handleStatusChange("in-progress")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-in-progress" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <AutorenewOutlinedIcon className="chip-icon" />
                      )}
                      <span>In-Progress</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--completed ${currentStatus === "completed" ? "active" : ""}`}
                      onClick={() => handleStatusChange("completed")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-completed" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <TaskAltOutlinedIcon className="chip-icon" />
                      )}
                      <span>Completed</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--delivered ${currentStatus === "delivered" ? "active" : ""}`}
                      onClick={() => handleStatusChange("delivered")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-delivered" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <LocalShippingOutlinedIcon className="chip-icon" />
                      )}
                      <span>Delivered</span>
                    </button>
                    <button
                      type="button"
                      className={`status-chip status-chip--cancelled ${currentStatus === "cancelled" ? "active" : ""}`}
                      onClick={() => handleStatusChange("cancelled")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-cancelled" ? (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <CancelOutlinedIcon className="chip-icon" />
                      )}
                      <span>Cancelled</span>
                    </button>
                  </div>
                </div>

                <div className="status-section">
                  <span className="section-subtitle">Payment Settlement</span>
                  {currentPaymentStatus === "paid" ? (
                    <div
                      className="payment-locked-card"
                      title="Payment is settled in full and locked against further changes"
                    >
                      <div className="locked-icon-badge">
                        <LockOutlinedIcon className="lock-svg" />
                      </div>
                      <div className="locked-meta">
                        <span className="locked-headline">Paid in Full (Locked)</span>
                        <span className="locked-caption">
                          Settled & Verified • Read-only
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="payment-chips-grid">
                      <button
                        type="button"
                        className={`pay-chip pay-chip--paid ${currentPaymentStatus === "paid" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("paid")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-paid" ? (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        ) : (
                          <PaidOutlinedIcon className="chip-icon" />
                        )}
                        <span>Paid in Full</span>
                      </button>
                      <button
                        type="button"
                        className={`pay-chip pay-chip--partial ${currentPaymentStatus === "partial" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("partial")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-partial" ? (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        ) : (
                          <AccountBalanceWalletOutlinedIcon className="chip-icon" />
                        )}
                        <span>Partial / Advance</span>
                      </button>
                      <button
                        type="button"
                        className={`pay-chip pay-chip--pending ${currentPaymentStatus === "pending" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("pending")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-pending" ? (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        ) : (
                          <PendingActionsOutlinedIcon className="chip-icon" />
                        )}
                        <span>Pending Payment</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="readonly-status-box">
                <div className="info-row">
                  <span className="info-label">Workflow Status</span>
                  <span className={`status-pill ${currentStatus}`}>
                    {currentStatus === "completed" ? (
                      <TaskAltOutlinedIcon style={{ fontSize: 14 }} />
                    ) : currentStatus === "delivered" ? (
                      <LocalShippingOutlinedIcon style={{ fontSize: 14 }} />
                    ) : currentStatus === "cancelled" ? (
                      <CancelOutlinedIcon style={{ fontSize: 14 }} />
                    ) : currentStatus === "in-progress" || currentStatus === "inprogress" ? (
                      <AutorenewOutlinedIcon style={{ fontSize: 14 }} />
                    ) : (
                      <HourglassEmptyOutlinedIcon style={{ fontSize: 14 }} />
                    )}
                    {currentStatus.replace("-", " ")}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Payment Status</span>
                  <span
                    className={`status-pill ${currentPaymentStatus === "paid" ? "completed" : currentPaymentStatus === "partial" ? "in-progress" : "pending"}`}
                  >
                    {currentPaymentStatus === "paid" ? (
                      <PaidOutlinedIcon style={{ fontSize: 14 }} />
                    ) : currentPaymentStatus === "partial" ? (
                      <AccountBalanceWalletOutlinedIcon style={{ fontSize: 14 }} />
                    ) : (
                      <PendingActionsOutlinedIcon style={{ fontSize: 14 }} />
                    )}
                    {currentPaymentStatus === "paid"
                      ? "Paid in Full"
                      : currentPaymentStatus === "partial"
                        ? "Advance / Partial"
                        : "Pending Payment"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Financial Breakdown */}
          <div className="payment-card__financials">
            <div className="panel-header">
              <div className="panel-header__title">
                <ReceiptLongOutlinedIcon className="panel-icon" />
                <span>Financial Breakdown</span>
              </div>
            </div>

            <div className="payment-meta-pills">
              <div className="meta-badge">
                <span className="meta-label">Method</span>
                <span className="meta-value">{order.paymentMethod || "UPI / Cash"}</span>
              </div>
              <div className={`meta-badge status-tag status-tag--${currentPaymentStatus}`}>
                {currentPaymentStatus === "paid" ? (
                  <PaidOutlinedIcon className="tag-icon" />
                ) : currentPaymentStatus === "partial" ? (
                  <AccountBalanceWalletOutlinedIcon className="tag-icon" />
                ) : (
                  <PendingActionsOutlinedIcon className="tag-icon" />
                )}
                <span className="meta-value">
                  {currentPaymentStatus === "paid"
                    ? "Paid in Full"
                    : currentPaymentStatus === "partial"
                      ? "Advance / Partial"
                      : "Pending Payment"}
                </span>
              </div>
            </div>

            <div className="financial-rows">
              <div className="fin-row">
                <span className="fin-label">Subtotal</span>
                <span className="fin-val">
                  ₹{Number(subtotalAmount).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="fin-row">
                <span className="fin-label">Pickup & Delivery</span>
                <span className="fin-val">
                  ₹{Number(pickupCharges).toLocaleString("en-IN")}
                </span>
              </div>

              {Number(otherCharges) > 0 && (
                <div className="fin-row">
                  <span className="fin-label">Other Charges</span>
                  <span className="fin-val">
                    ₹{Number(otherCharges).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {Number(discountAmount) > 0 && (
                <div className="fin-row fin-row--discount">
                  <span className="fin-label">Discount</span>
                  <span className="fin-val">
                    -₹{Number(discountAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <div className="total-highlight-banner">
              <div className="banner-label-group">
                <span className="banner-title">TOTAL BILLED AMOUNT</span>
                <span className="banner-sub">Inclusive of all items & charges</span>
              </div>
              <span className="banner-amount">
                ₹{Number(totalCalculatedAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="settlement-breakdown">
              {initialAdvance > 0 && initialAdvance < totalCalculatedAmount && (
                <div className="fin-row fin-row--advance">
                  <span className="fin-label">Advance Paid</span>
                  <span className="fin-val">
                    ₹{Number(initialAdvance).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {isPaidInFull &&
                initialAdvance > 0 &&
                initialAdvance < totalCalculatedAmount && (
                  <div className="fin-row fin-row--balance-paid">
                    <span className="fin-label">Balance Paid</span>
                    <span className="fin-val">
                      ₹{Number(balancePaidAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              {currentPaidAmount > 0 && (
                <div className="fin-row fin-row--total-paid">
                  <span className="fin-label">Total Amount Paid</span>
                  <span className="fin-val">
                    ₹{Number(currentPaidAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {!isPaidInFull && Number(balanceDue) > 0 && (
                <div className="fin-row fin-row--balance-due">
                  <span className="fin-label">Balance Due</span>
                  <span className="fin-val">
                    ₹{Number(balanceDue).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};

export default OrderDetailsModal;
