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
    if (
      currentPaymentStatus === "paid" ||
      newPayStatus === currentPaymentStatus ||
      updatingStatus
    )
      return;
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
      } else if (newPayStatus === "partial" || newPayStatus === "pending") {
        // If advance was already paid, balance due stays (totalAmt - advancePayment)
        // and does NOT wipe out the advance payment
        updatePayload = {
          ...updatePayload,
          balancePaid: 0,
          balanceDue: advPaid > 0 ? remainingDue : totalAmt,
          paidAmount: advPaid,
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
  const advancePaid = Number(order.advancePayment || order.paidAmount || 0);
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
  const balanceDue =
    currentPaymentStatus === "paid"
      ? 0
      : Math.max(0, totalCalculatedAmount - advancePaid);
  const balancePaidAmount = Number(
    order.balancePaid !== undefined && order.balancePaid !== null
      ? order.balancePaid
      : balanceDue > 0
        ? balanceDue
        : Math.max(0, totalCalculatedAmount - advancePaid),
  );

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
              ({rawItems.length}{" "}
              {rawItems.length === 1 ? "Service" : "Services"})
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
              Ordered Saree Services ({rawItems.length})
            </span>
          </div>
          <div className="details-card__body">
            <div className="dossier-items-list">
              {rawItems.map((item, idx) => {
                const m = item.measurementProfile;
                const regularPrice = Number(item.servicePrice || 0);
                const offerPrice = Number(
                  item.finalPrice !== undefined && item.finalPrice !== null
                    ? item.finalPrice
                    : item.serviceDiscountedPrice || item.servicePrice || 0,
                );
                const hasDiscount = regularPrice > offerPrice && offerPrice > 0;

                return (
                  <div key={item.itemId || idx} className="dossier-item-box">
                    <div className="dossier-item-header">
                      <div className="item-title-wrap">
                        <span className="item-idx-tag">Service #{idx + 1}</span>
                        <span className="item-name-text">
                          {item.serviceName}
                        </span>
                      </div>
                      <div className="item-price-tag">
                        {hasDiscount ? (
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
          <div className="payment-card__left">
            <div className="payment-head">
              <PaymentOutlinedIcon className="pay-icon" />
              <span className="pay-title">
                {canUpdate
                  ? "Billing & Workflow Controls"
                  : "Billing & Status Overview"}
              </span>
            </div>

            {canUpdate ? (
              <>
                <div className="status-button-group">
                  <span className="status-label">Update Order Status:</span>
                  <div className="status-buttons">
                    <button
                      type="button"
                      className={`btn-status btn-status--requested ${currentStatus === "requested" ? "active" : ""}`}
                      onClick={() => handleStatusChange("requested")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-requested" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Requested</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--accepted ${currentStatus === "accepted" ? "active" : ""}`}
                      onClick={() => handleStatusChange("accepted")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-accepted" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Accepted</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--pending ${currentStatus === "pending" ? "active" : ""}`}
                      onClick={() => handleStatusChange("pending")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-pending" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--in-progress ${currentStatus === "in-progress" || currentStatus === "inprogress" ? "active" : ""}`}
                      onClick={() => handleStatusChange("in-progress")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-in-progress" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>In-Progress</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--completed ${currentStatus === "completed" ? "active" : ""}`}
                      onClick={() => handleStatusChange("completed")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-completed" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Completed</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--delivered ${currentStatus === "delivered" ? "active" : ""}`}
                      onClick={() => handleStatusChange("delivered")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-delivered" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Delivered</span>
                    </button>
                    <button
                      type="button"
                      className={`btn-status btn-status--cancelled ${currentStatus === "cancelled" ? "active" : ""}`}
                      onClick={() => handleStatusChange("cancelled")}
                      disabled={updatingStatus}
                    >
                      {updatingTarget === "order-cancelled" && (
                        <AppSpinner
                          size="xs"
                          color="inherit"
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <span>Cancelled</span>
                    </button>
                  </div>
                </div>

                <div className="status-button-group" style={{ marginTop: 12 }}>
                  <span className="status-label">Payment Status:</span>
                  {currentPaymentStatus === "paid" ? (
                    <div
                      className="payment-locked-badge"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        borderRadius: "6px",
                        color: "#10b981",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                      title="Payment is settled in full and locked against further changes"
                    >
                      <LockOutlinedIcon
                        style={{ fontSize: 15, color: "#10b981" }}
                      />
                      <span>Paid in Full (Locked)</span>
                    </div>
                  ) : (
                    <div className="status-buttons payment-buttons">
                      <button
                        type="button"
                        className={`btn-status btn-pay--paid ${currentPaymentStatus === "paid" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("paid")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-paid" && (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <span>Paid in Full</span>
                      </button>
                      <button
                        type="button"
                        className={`btn-status btn-pay--partial ${currentPaymentStatus === "partial" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("partial")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-partial" && (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <span>Partial / Advance</span>
                      </button>
                      <button
                        type="button"
                        className={`btn-status btn-pay--pending ${currentPaymentStatus === "pending" ? "active" : ""}`}
                        onClick={() => handlePaymentStatusChange("pending")}
                        disabled={updatingStatus}
                      >
                        {updatingTarget === "pay-pending" && (
                          <AppSpinner
                            size="xs"
                            color="inherit"
                            style={{ marginRight: 6 }}
                          />
                        )}
                        <span>Pending Payment</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="info-row" style={{ padding: "6px 0" }}>
                  <span className="info-label">Workflow Status</span>
                  <span className={`status-pill ${currentStatus}`}>
                    <span className="dot" />
                    {currentStatus.replace("-", " ")}
                  </span>
                </div>
                <div className="info-row" style={{ padding: "6px 0" }}>
                  <span className="info-label">Payment Status</span>
                  <span
                    className={`status-pill ${currentPaymentStatus === "paid" ? "completed" : currentPaymentStatus === "partial" ? "in-progress" : "pending"}`}
                  >
                    <span className="dot" />
                    {currentPaymentStatus === "paid"
                      ? "Paid in Full"
                      : currentPaymentStatus === "partial"
                        ? "Advance / Partial"
                        : "Pending Payment"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="payment-card__breakdown">
            <div className="pay-row">
              <span className="pay-label">Payment Method:</span>
              <span className="pay-val">
                {order.paymentMethod || "UPI / Cash"}
              </span>
            </div>
            <div className="pay-row">
              <span className="pay-label">Payment Status:</span>
              <span
                className="pay-val highlight"
                style={{ textTransform: "capitalize" }}
              >
                {currentPaymentStatus === "paid"
                  ? "Paid in Full"
                  : currentPaymentStatus === "partial"
                    ? "Advance / Partial"
                    : "Pending Payment"}
              </span>
            </div>
            <div className="pay-row">
              <span className="pay-label">Subtotal:</span>
              <span className="pay-val">
                ₹{Number(subtotalAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="pay-row">
              <span className="pay-label">Pickup & Delivery:</span>
              <span className="pay-val">
                ₹{Number(pickupCharges).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="pay-row">
              <span className="pay-label">Other Charges:</span>
              <span className="pay-val">
                ₹{Number(otherCharges).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="pay-row" style={{ color: "#10b981" }}>
              <span className="pay-label" style={{ color: "#10b981" }}>
                Discount:
              </span>
              <span className="pay-val">
                -₹{Number(discountAmount).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="pay-divider" />
            <div className="pay-row total">
              <span className="pay-total-label">Total Billed Amount:</span>
              <span className="pay-total-val">
                ₹{Number(totalCalculatedAmount).toLocaleString("en-IN")}
              </span>
            </div>
            {advancePaid > 0 && (
              <div
                className="pay-row"
                style={{ marginTop: 6, color: "#10b981" }}
              >
                <span className="pay-label" style={{ color: "#10b981" }}>
                  Paid Amount:
                </span>
                <span
                  className="pay-val"
                  style={{ color: "#10b981", fontWeight: 700 }}
                >
                  ₹{Number(advancePaid).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {currentPaymentStatus !== "paid" && Number(balanceDue) > 0 && (
              <div
                className="pay-row"
                style={{ marginTop: 4, color: "#ef4444" }}
              >
                <span className="pay-label" style={{ color: "#ef4444" }}>
                  Balance Due:
                </span>
                <span
                  className="pay-val"
                  style={{ color: "#ef4444", fontWeight: 700 }}
                >
                  ₹{Number(balanceDue).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppModal>
  );
};

export default OrderDetailsModal;
