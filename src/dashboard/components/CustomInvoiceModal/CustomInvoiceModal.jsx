import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { formatDateSafe } from "../../../firebase/dbService";
import pdfHeaderImg from "../../../assets/pdf-header.jpg";
import signatureImg from "../../../assets/signature.png";
import reviewQrImg from "../../../assets/review-qr.png";
import thankyouImg from "../../../assets/thankyou.jpg";
import flowerImg from "../../../assets/flower.png";
import "./CustomInvoiceModal.scss";

/**
 * Convert any Firestore order record into the standard Invoice Details dataset
 */
export const mapOrderToInvoiceData = (order) => {
  if (!order) return null;
  if (order.financials && order.services && order.client) {
    return order;
  }

  const rawItems =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [
          {
            itemId: "item_1",
            serviceName: order.service || "Saree Pre-Pleating Service",
            servicePrice:
              Number(
                String(order.amount || order.baseAmount || "0").replace(
                  /[^0-9]/g,
                  "",
                ),
              ) || 0,
            finalPrice:
              Number(String(order.amount || "0").replace(/[^0-9]/g, "")) || 0,
            sareeType: order.sareeType || "Silk Saree",
            measurementProfile: {
              title: order.measurementProfile?.title || "Standard Sizing",
              pallu: order.palluStyle || order.measurementProfile?.pallu || "",
              firstPleatSize:
                order.pleatCount ||
                order.measurementProfile?.firstPleatSize ||
                "",
              shoulderToRightTight:
                order.measurementProfile?.shoulderToRightTight || "",
              chest: order.measurementProfile?.chest || "",
              hip: order.measurementProfile?.hip || "",
              height: order.measurementProfile?.height || "",
              dressSize: order.measurementProfile?.dressSize || "",
            },
            itemNotes: order.notes || "",
            specialCare: order.specialCare || "",
          },
        ];

  const services = rawItems.map((it, idx) => {
    const m = it.measurementProfile || it.customMeasurement || {};
    const specialCare =
      it.specialCare ||
      it.itemNotes ||
      m.notes ||
      m.specialCare ||
      m.careInstructions ||
      "";
    return {
      id: it.itemId || it.id || `srv_${idx + 1}`,
      serviceName: it.serviceName || "Saree Pre-Pleating Service",
      fabric: it.sareeType || "",
      measurementProfile: {
        title: m.title || "Standard Profile",
        pallu: m.pallu || m.palluLength || "",
        firstPleatSize: m.firstPleatSize || m.firstPleat || "",
        shoulderToRightTight: m.shoulderToRightTight || m.shoulder || "",
        shoulderToTight: m.shoulderToTight || "",
        chest: m.chest || m.chestSize || "",
        noOfChestPleats: m.noOfChestPleats || "",
        hip: m.hip || m.hipSize || "",
        height: m.height || "",
        dressSize: m.dressSize || "",
        notes: m.notes || "",
      },
      specialCare,
      regularPrice: Number(it.servicePrice) || 0,
      price:
        Number(it.finalPrice) !== undefined &&
        !Number.isNaN(Number(it.finalPrice))
          ? Number(it.finalPrice)
          : Number(it.serviceDiscountedPrice) || Number(it.servicePrice) || 0,
    };
  });

  const subtotal = Number(
    order.subtotal !== undefined && order.subtotal !== null
      ? order.subtotal
      : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
  );
  const pickupDeliveryCharges = Number(order.pickupDeliveryCharges || 0);
  const otherCharges = Number(order.otherCharges || 0);
  const discount = Number(order.discount || 0);
  const totalAmount = Number(
    order.totalAmount !== undefined && order.totalAmount !== null
      ? order.totalAmount
      : order.amount || 0,
  );
  const advancePaid = Number(order.advancePayment || order.paidAmount || 0);
  const rawBalanceDue = Number(order.balanceDue);
  const balanceDue =
    order.balanceDue !== undefined &&
    order.balanceDue !== null &&
    !isNaN(rawBalanceDue)
      ? rawBalanceDue
      : order.paymentStatus === "paid"
        ? 0
        : Math.max(0, totalAmount - advancePaid);
  const rawBalancePaid = Number(order.balancePaid);
  const balancePaid =
    order.balancePaid !== undefined &&
    order.balancePaid !== null &&
    !isNaN(rawBalancePaid) &&
    rawBalancePaid > 0
      ? rawBalancePaid
      : order.paymentStatus === "paid"
        ? advancePaid > 0
          ? Math.max(0, totalAmount - advancePaid)
          : totalAmount
        : 0;

  const clientName =
    order.username ||
    order.client?.username ||
    (typeof order.client === "string" ? order.client : "Client");
  const clientMobile =
    order.userMobile || order.client?.userMobile || order.phone || "-";
  const clientEmail = order.email || order.client?.email || "-";
  const clientAddress =
    order.userAddress || order.client?.userAddress || order.address || "-";

  const orderId = order.id || "A-NEW-SPP";
  const invNumber =
    order.invoiceNumber ||
    `INV-${orderId.replace(/[^0-9]/g, "") || new Date().getFullYear()}`;

  const bookingDateStr = order.orderDate
    ? formatDateSafe(order.orderDate)
    : order.createdAt
      ? formatDateSafe(order.createdAt)
      : "-";
  const deliveryDateStr = order.deliveryDate
    ? formatDateSafe(order.deliveryDate)
    : "Standard Delivery";

  const orderStatus = order.status || order.orderStatus || "in-progress";
  const paymentStatus =
    order.paymentStatus ||
    (advancePaid >= totalAmount && totalAmount > 0
      ? "paid"
      : advancePaid > 0
        ? "partial"
        : "pending");

  return {
    invoiceNumber: invNumber,
    orderId: orderId,
    bookingDate: bookingDateStr,
    deliveryDate: deliveryDateStr,
    occasion:
      order.occasion && String(order.occasion).trim()
        ? String(order.occasion).trim()
        : "-",
    orderStatus,
    paymentStatus,
    paymentMethod: order.paymentMethod || "UPI / Cash",
    client: {
      name: clientName,
      mobile: clientMobile,
      email: clientEmail,
      address: clientAddress,
    },
    services,
    notes: order.notes || "",
    financials: {
      subtotal,
      pickupDeliveryCharges,
      otherCharges,
      discount,
      totalAmount,
      advancePaid,
      balanceDue,
      balancePaid,
    },
  };
};

export const getOrderStatusMeta = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "requested") {
    return {
      label: "Requested",
      style: "background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;",
    };
  }
  if (s === "accepted") {
    return {
      label: "Accepted",
      style: "background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff;",
    };
  }
  if (s === "completed") {
    return {
      label: "Completed",
      style: "background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;",
    };
  }
  if (s === "delivered") {
    return {
      label: "Delivered",
      style: "background: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4;",
    };
  }
  if (s === "in-progress" || s === "inprogress") {
    return {
      label: "In-Progress",
      style: "background: #ffedd5; color: #ea580c; border: 1px solid #fed7aa;",
    };
  }
  if (s === "cancelled") {
    return {
      label: "Cancelled",
      style: "background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;",
    };
  }
  return {
    label: "Pending",
    style: "background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;",
  };
};

export const getPaymentStatusMeta = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "paid") {
    return {
      label: "Paid in Full",
      style: "background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;",
    };
  }
  if (s === "partial") {
    return {
      label: "Advance / Partial",
      style: "background: #fef9c3; color: #ca8a04; border: 1px solid #fef08a;",
    };
  }
  return {
    label: "Pending Payment",
    style: "background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;",
  };
};

/**
 * Clean Internal CSS Stylesheet for PDF Generation
 */
export const INVOICE_PDF_INTERNAL_CSS = `
  #order-pdf-export-container,
  .invoice-pdf-page,
  .invoice-pdf-wrapper {
    width: 816px;
    min-width: 816px;
    max-width: 816px;
    height: 1400px;
    min-height: 1400px;
    max-height: 1400px;
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #0f172a;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    box-sizing: border-box;
    font-size: 11.5px;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
  }

  #order-pdf-export-container .pdf-header-banner {
    width: 100%;
    margin: 0;
    padding: 0;
    line-height: 0;
    font-size: 0;
    display: block;
  }

  #order-pdf-export-container .pdf-header-banner img {
    width: 100%;
    height: auto;
    display: block;
    margin: 0;
    padding: 0;
    border: none;
  }

  #order-pdf-export-container .pdf-content-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px 22px 6px 22px;
    box-sizing: border-box;
  }

  #order-pdf-export-container .pdf-main-heading-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 2px 0 10px 0;
  }

  #order-pdf-export-container .pdf-heading-line {
    flex: 1;
    height: 1.5px;
    border-radius: 2px;
  }

  #order-pdf-export-container .pdf-heading-line.line-left {
    background: linear-gradient(90deg, rgba(8, 24, 43, 0.05), rgba(8, 24, 43, 0.35));
  }

  #order-pdf-export-container .pdf-heading-line.line-right {
    background: linear-gradient(90deg, rgba(8, 24, 43, 0.35), rgba(8, 24, 43, 0.05));
  }

  #order-pdf-export-container .pdf-main-heading {
    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    font-size: 20px;
    font-weight: 800;
    color: #08182b;
    letter-spacing: 2.2px;
    text-transform: uppercase;
    margin: 0;
    white-space: nowrap;
  }

  #order-pdf-export-container .pdf-dossier-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  #order-pdf-export-container .pdf-panel-card {
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
  }

  /* Left Panel: Order Information */
  #order-pdf-export-container .order-info-panel {
    border: 1px solid #d0e2f2;
    background: #f6f6fc;
  }

  #order-pdf-export-container .order-info-panel .panel-header {
    background: #e4f1fb;
    border-bottom: 1px solid #d0e2f2;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #08182b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #order-pdf-export-container .order-info-panel .panel-body {
    background: #f6f6fc;
    padding: 8px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
  }

  /* Right Panel: Client Details */
  #order-pdf-export-container .client-info-panel {
    border: 1px solid #f0dfcf;
    background: #fcf8f4;
  }

  #order-pdf-export-container .client-info-panel .panel-header {
    background: #faf2ea;
    border-bottom: 1px solid #f0dfcf;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #08182b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #order-pdf-export-container .client-info-panel .panel-body {
    background: #fcf8f4;
    padding: 8px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
  }

  #order-pdf-export-container .info-kv-table {
    width: 100%;
    border-collapse: collapse;
  }

  #order-pdf-export-container .info-kv-table tr td {
    padding: 2.5px 0;
    font-size: 11px;
    line-height: 1.35;
    vertical-align: middle;
  }

  #order-pdf-export-container .info-kv-table .kv-key {
    color: #475569;
    font-weight: 500;
    width: 95px;
    white-space: nowrap;
    text-align: left;
  }

  #order-pdf-export-container .info-kv-table .kv-val {
    color: #0f172a;
    font-weight: 500;
    word-break: break-word;
    text-align: right;
  }

  #order-pdf-export-container .info-kv-table .kv-val-bold {
    color: #08182b;
    font-weight: 700;
    text-align: right;
  }

  #order-pdf-export-container .info-kv-table .kv-val-delivery {
    color: #15803d;
    font-weight: 700;
    text-align: right;
  }

  #order-pdf-export-container .panel-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    padding-top: 6px;
  }

  #order-pdf-export-container .order-info-panel .panel-footer-row {
    border-top: 1px dashed #d0e2f2;
  }

  #order-pdf-export-container .client-info-panel .panel-footer-row {
    border-top: 1px dashed #f0dfcf;
  }

  #order-pdf-export-container .footer-label-text {
    font-size: 10.5px;
    color: #08182b;
    font-weight: 500;
  }

  #order-pdf-export-container .pay-pill {
    padding: 2.5px 9px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  #order-pdf-export-container .pay-pill-paid {
    background: #dcfce7;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  #order-pdf-export-container .pill-check-icon {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #15803d;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5px;
    font-weight: 900;
  }

  #order-pdf-export-container .pill-dot-icon {
    font-size: 8px;
    display: inline-flex;
    align-items: center;
  }

  #order-pdf-export-container .pay-pill-partial {
    background: #ffedd5;
    color: #ea580c;
    border: 1px solid #fed7aa;
  }

  #order-pdf-export-container .pay-pill-cancelled {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  #order-pdf-export-container .pay-pill-pending {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  #order-pdf-export-container .pdf-services-card {
    border: 1px solid #d0e2f2;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
    background: #ffffff;
    box-sizing: border-box;
  }

  #order-pdf-export-container .services-header-bar {
    background: #0f2540;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  #order-pdf-export-container .services-table {
    width: 100%;
    border-collapse: collapse;
  }

  #order-pdf-export-container .services-table thead tr {
    background: #faf2ea;
    border-bottom: 1px solid #f0dfcf;
  }

  #order-pdf-export-container .services-table th {
    padding: 6px 10px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #08182b;
  }

  #order-pdf-export-container .services-table th.th-num {
    width: 38px;
    text-align: center;
    padding-left: 8px;
    padding-right: 4px;
  }

  #order-pdf-export-container .services-table th.th-desc {
    text-align: left;
    padding-left: 6px;
  }

  #order-pdf-export-container .services-table th.th-amt {
    width: 90px;
    text-align: right;
    padding-right: 12px;
  }

  #order-pdf-export-container .service-row td {
    padding: 8px 10px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }

  #order-pdf-export-container .service-row:last-child td {
    border-bottom: none;
  }

  #order-pdf-export-container .td-num {
    width: 38px;
    text-align: center;
    padding-left: 8px;
    padding-right: 4px;
    vertical-align: top;
    padding-top: 10px;
  }

  #order-pdf-export-container .num-badge {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #08182b;
  }

  #order-pdf-export-container .td-desc {
    padding-left: 6px;
  }

  #order-pdf-export-container .service-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #08182b;
    margin-bottom: 5px;
  }

  #order-pdf-export-container .specs-wrap {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 5px;
    margin-bottom: 2px;
  }

  #order-pdf-export-container .spec-pill {
    font-size: 10px;
    padding: 2.5px 7px;
    border-radius: 4px;
    background: #f1f6fa;
    color: #475569;
    border: 1px solid #e2edf6;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  #order-pdf-export-container .spec-pill .lbl {
    color: #64748b;
    font-weight: 500;
  }

  #order-pdf-export-container .spec-pill .val {
    color: #08182b;
    font-weight: 700;
  }

  #order-pdf-export-container .care-box {
    font-size: 10px;
    background: #f1f6fa;
    border: 1px solid #e2edf6;
    border-radius: 4px;
    padding: 4px 8px;
    margin-top: 5px;
    color: #08182b;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  #order-pdf-export-container .care-box .care-lbl {
    font-weight: 700;
    color: #08182b;
  }

  #order-pdf-export-container .care-box .care-val {
    font-weight: 500;
    color: #334155;
  }

  #order-pdf-export-container .td-amt {
    text-align: right;
    font-weight: 700;
    color: #08182b;
    font-size: 14.5px;
    padding-right: 12px;
    vertical-align: top;
    padding-top: 10px;
  }

  #order-pdf-export-container .td-amt .amt-combo {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
  }

  #order-pdf-export-container .td-amt .regular-strike {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    text-decoration: line-through;
    line-height: 1.2;
  }

  #order-pdf-export-container .td-amt .offer-val {
    font-size: 14.5px;
    font-weight: 700;
    color: #08182b;
    line-height: 1.2;
  }

  #order-pdf-export-container .pdf-bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 8px;
  }

  /* Bottom Left Panel: Special Notes */
  #order-pdf-export-container .special-notes-panel {
    border: 1px solid #d0e2f2;
    background: #f6f6fc;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
  }

  #order-pdf-export-container .special-notes-panel .panel-header {
    background: #e4f1fb;
    border-bottom: 1px solid #d0e2f2;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #08182b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #order-pdf-export-container .special-notes-panel .panel-body {
    background: #f6f6fc;
    padding: 12px 14px 10px 14px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    box-sizing: border-box;
  }

  #order-pdf-export-container .notes-list {
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 10.5px;
    color: #334155;
    line-height: 1.55;
  }

  #order-pdf-export-container .notes-list li {
    position: relative;
    padding-left: 12px;
    margin-bottom: 5px;
  }

  #order-pdf-export-container .notes-list li:last-child {
    margin-bottom: 0;
  }

  #order-pdf-export-container .notes-list li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #475569;
    font-weight: bold;
    font-size: 13px;
    line-height: 1.2;
  }

  /* Bottom Right Panel: Payment Summary */
  #order-pdf-export-container .payment-summary-panel {
    border: 1px solid #f0dfcf;
    background: #fcf8f4;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100%;
  }

  #order-pdf-export-container .payment-summary-panel .panel-header {
    background: #faf2ea;
    border-bottom: 1px solid #f0dfcf;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #08182b;
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #order-pdf-export-container .payment-summary-panel .panel-body {
    background: #fcf8f4;
    padding: 8px 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    box-sizing: border-box;
  }

  #order-pdf-export-container .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #order-pdf-export-container .total-row .total-lbl {
    color: #475569;
    font-weight: 500;
    font-size: 10.5px;
  }

  #order-pdf-export-container .total-row .total-val {
    color: #0f172a;
    font-weight: 600;
    font-size: 11px;
  }

  #order-pdf-export-container .discount-row {
    color: #475569;
  }

  #order-pdf-export-container .discount-row.has-discount {
    color: #15803d;
  }

  #order-pdf-export-container .grand-total-row {
    padding-top: 3px;
    border-top: 1.5px solid #08182b;
    margin-top: 2px;
  }

  #order-pdf-export-container .grand-total-row .grand-lbl {
    font-weight: 700;
    color: #08182b;
    font-size: 11.5px;
  }

  #order-pdf-export-container .grand-total-row .grand-val {
    font-weight: 700;
    color: #08182b;
    font-size: 13.5px;
  }

  #order-pdf-export-container .advance-paid-row {
    color: #475569;
    padding-top: 1px;
  }

  #order-pdf-export-container .balance-row {
    padding-top: 1px;
    color: #dc2626;
  }

  #order-pdf-export-container .balance-row .balance-lbl {
    font-weight: 700;
    font-size: 10.5px;
    color: #dc2626;
  }

  #order-pdf-export-container .balance-row .balance-val {
    font-weight: 700;
    font-size: 11.5px;
    color: #dc2626;
  }

  /* 6. Thank You & Google Review Banner Card */
  #order-pdf-export-container .thankyou-banner-card {
    position: relative;
    background: #faf6f0;
    border: 1px solid #ebdccb;
    border-radius: 8px;
    padding: 10px 20px 10px 16px;
    min-height: 86px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 5px;
    margin-bottom: 6px;
    box-sizing: border-box;
    overflow: hidden;
    width: 100%;
  }

  #order-pdf-export-container .thankyou-bg-flower {
    position: absolute;
    left: -8px;
    bottom: -10px;
    height: 130%;
    width: auto;
    max-width: 145px;
    object-fit: contain;
    pointer-events: none;
    z-index: 0;
    opacity: 0.95;
    mix-blend-mode: multiply;
  }

  #order-pdf-export-container .thankyou-content-center {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    padding: 0 12px 0 42px;
  }

  #order-pdf-export-container .thankyou-script-img {
    height: 42px;
    width: auto;
    max-width: 155px;
    object-fit: contain;
    display: block;
    margin: 0 auto 2px auto;
    mix-blend-mode: multiply;
  }

  #order-pdf-export-container .thankyou-for-choosing {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-size: 14px;
    font-weight: 700;
    color: #08182b;
    line-height: 1.25;
    letter-spacing: 0.3px;
    margin-top: 2px;
  }

  #order-pdf-export-container .thankyou-heart-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px 0 1px 0;
  }

  #order-pdf-export-container .thankyou-heart {
    color: #caa368;
    font-size: 12px;
    line-height: 1;
  }

  #order-pdf-export-container .thankyou-tradition {
    font-size: 11.5px;
    font-weight: 600;
    color: #334155;
    line-height: 1.25;
    letter-spacing: 0.2px;
  }

  #order-pdf-export-container .thankyou-vert-divider {
    position: relative;
    z-index: 1;
    width: 1px;
    height: 68px;
    background: #caa368;
    opacity: 0.55;
    margin: 0 16px 0 12px;
    flex-shrink: 0;
  }

  #order-pdf-export-container .thankyou-right-col {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  #order-pdf-export-container .thankyou-qr-wrapper {
    background: #ffffff;
    border: 1px solid #ebdccb;
    border-radius: 6px;
    padding: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  #order-pdf-export-container .thankyou-qr-img {
    width: 66px;
    height: 66px;
    display: block;
    object-fit: contain;
  }

  #order-pdf-export-container .thankyou-cta-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
  }

  #order-pdf-export-container .cta-share-text {
    font-size: 13.5px;
    font-weight: 700;
    color: #08182b;
    line-height: 1.2;
    white-space: nowrap;
  }

  #order-pdf-export-container .cta-stars {
    color: #f59e0b;
    font-size: 15px;
    line-height: 1;
    letter-spacing: 2.5px;
  }

  #order-pdf-export-container .cta-review-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #08182b;
    color: #ffffff !important;
    text-decoration: none !important;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.3px;
    margin-top: 2px;
    box-shadow: 0 2px 4px rgba(8, 24, 43, 0.15);
  }

  #order-pdf-export-container .cta-arrow-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 13px;
    line-height: 1;
    margin-left: 2px;
  }

  #order-pdf-export-container .thankyou-follow-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }

  #order-pdf-export-container .thankyou-follow-row .follow-label {
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    color: #475569;
    text-transform: uppercase;
  }

  #order-pdf-export-container .thankyou-follow-row .social-icons-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  #order-pdf-export-container .thankyou-follow-row .social-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 21px;
    height: 21px;
    border-radius: 50%;
    background: #ffffff;
    border: 1px solid #ebdccb;
    color: #08182b;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  #order-pdf-export-container .signature-section {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    margin-top: 6px;
    margin-bottom: 6px;
  }

  #order-pdf-export-container .signature-wrapper {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 130px;
  }

  #order-pdf-export-container .signature-wrapper img {
    height: 34px;
    width: auto;
    max-width: 130px;
    object-fit: contain;
    display: block;
    margin: 0 auto 2px auto;
  }

  #order-pdf-export-container .signatory-title {
    font-size: 9.5px;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  #order-pdf-export-container .pdf-tagline-strip {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 6px 32px 8px 32px;
    box-sizing: border-box;
  }

  #order-pdf-export-container .pdf-tagline-strip .tagline-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(8, 24, 43, 0.05), rgba(8, 24, 43, 0.3));
  }

  #order-pdf-export-container .pdf-tagline-strip .tagline-line.line-right {
    background: linear-gradient(90deg, rgba(8, 24, 43, 0.3), rgba(8, 24, 43, 0.05));
  }

  #order-pdf-export-container .tagline-text {
    font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 3.5px;
    color: #08182b;
    text-transform: uppercase;
    white-space: nowrap;
    line-height: 1;
  }

  #order-pdf-export-container .pdf-luxury-footer {
    margin-top: auto;
    width: 100%;
    padding: 12px 36px 12px 36px;
    box-sizing: border-box;
    background: #08182b;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 9px;
    border: none;
  }

  #order-pdf-export-container .footer-row-contacts {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    line-height: 1;
  }

  #order-pdf-export-container .footer-row-address {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    line-height: 1;
  }

  #order-pdf-export-container .footer-divider-line {
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }

  #order-pdf-export-container .footer-item {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    vertical-align: middle;
  }

  #order-pdf-export-container .footer-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #dfb772;
    flex-shrink: 0;
    line-height: 0;
    font-size: 0;
    position: relative;
    top: 1.5px;
  }

  #order-pdf-export-container .footer-icon svg {
    display: block;
    width: 15px;
    height: 15px;
    color: #dfb772;
    margin: 0;
    padding: 0;
  }

  #order-pdf-export-container .footer-text {
    font-size: 12px;
    color: #ffffff;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.25px;
    white-space: nowrap;
    display: inline-block;
    vertical-align: middle;
  }
`;

/**
 * Modular HTML Builders for Invoice Components
 */
export const buildHeaderBannerHtml = () => `
  <div class="pdf-header-banner">
    <img src="${pdfHeaderImg}" alt="Aparna Saree Pre-Pleating" />
  </div>
`;

export const buildMainHeadingHtml = (title = "ORDER DETAILS") => `
  <div class="pdf-main-heading-wrap">
    <div class="pdf-heading-line line-left"></div>
    <div class="pdf-main-heading">${title}</div>
    <div class="pdf-heading-line line-right"></div>
  </div>
`;

export const buildDossierGridHtml = (data = {}) => {
  const orderDetailsIcon = renderToStaticMarkup(
    <ReceiptLongOutlinedIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );
  const billedToIcon = renderToStaticMarkup(
    <PersonOutlineIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );

  const occasionRowHtml =
    data.occasion &&
    data.occasion !== "-" &&
    String(data.occasion).trim() !== ""
      ? `
        <tr>
          <td class="kv-key">Occasion</td>
          <td class="kv-val">${data.occasion}</td>
        </tr>
      `
      : "";

  let orderStatusPillHtml = "";
  const sStatus = String(data.orderStatus || "in-progress").toLowerCase();
  if (sStatus === "requested") {
    orderStatusPillHtml = `
      <span class="pay-pill" style="background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">
        <span class="pill-dot-icon">●</span>
        <span>REQUESTED</span>
      </span>
    `;
  } else if (sStatus === "accepted") {
    orderStatusPillHtml = `
      <span class="pay-pill" style="background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff;">
        <span class="pill-dot-icon">●</span>
        <span>ACCEPTED</span>
      </span>
    `;
  } else if (sStatus === "completed") {
    orderStatusPillHtml = `
      <span class="pay-pill pay-pill-paid">
        <span class="pill-check-icon">✓</span>
        <span>COMPLETED</span>
      </span>
    `;
  } else if (sStatus === "delivered") {
    orderStatusPillHtml = `
      <span class="pay-pill" style="background: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4;">
        <span class="pill-check-icon">✓</span>
        <span>DELIVERED</span>
      </span>
    `;
  } else if (sStatus === "in-progress" || sStatus === "inprogress") {
    orderStatusPillHtml = `
      <span class="pay-pill pay-pill-partial">
        <span class="pill-dot-icon">●</span>
        <span>IN-PROGRESS</span>
      </span>
    `;
  } else if (sStatus === "cancelled") {
    orderStatusPillHtml = `
      <span class="pay-pill pay-pill-cancelled">
        <span>CANCELLED</span>
      </span>
    `;
  } else {
    orderStatusPillHtml = `
      <span class="pay-pill pay-pill-pending">
        <span>PENDING</span>
      </span>
    `;
  }

  const isPaid = String(data.paymentStatus || "").toLowerCase() === "paid";
  let paymentPillHtml = "";
  if (isPaid) {
    paymentPillHtml = `
      <span class="pay-pill pay-pill-paid">
        <span class="pill-check-icon">✓</span>
        <span>PAID IN FULL</span>
      </span>
    `;
  } else if (String(data.paymentStatus || "").toLowerCase() === "partial") {
    paymentPillHtml = `
      <span class="pay-pill pay-pill-partial">
        <span>ADVANCE / PARTIAL</span>
      </span>
    `;
  } else {
    paymentPillHtml = `
      <span class="pay-pill pay-pill-pending">
        <span>PENDING PAYMENT</span>
      </span>
    `;
  }

  return `
    <div class="pdf-dossier-grid">
      <div class="pdf-panel-card order-info-panel">
        <div class="panel-header">
          ${orderDetailsIcon}
          <span>ORDER INFORMATION</span>
        </div>
        <div class="panel-body">
          <table class="info-kv-table">
            <tbody>
              <tr>
                <td class="kv-key">Invoice No</td>
                <td class="kv-val kv-val-bold">${data.invoiceNumber || data.orderId}</td>
              </tr>
              <tr>
                <td class="kv-key">Order ID</td>
                <td class="kv-val kv-val-bold">${data.orderId}</td>
              </tr>
              <tr>
                <td class="kv-key">Order Date</td>
                <td class="kv-val kv-val-bold">${data.bookingDate}</td>
              </tr>
              <tr>
                <td class="kv-key">Delivery Date</td>
                <td class="kv-val kv-val-delivery">${data.deliveryDate}</td>
              </tr>
              ${occasionRowHtml}
            </tbody>
          </table>
          <div class="panel-footer-row">
            <span class="footer-label-text">Order Status</span>
            ${orderStatusPillHtml}
          </div>
        </div>
      </div>

      <div class="pdf-panel-card client-info-panel">
        <div class="panel-header">
          ${billedToIcon}
          <span>CLIENT DETAILS</span>
        </div>
        <div class="panel-body">
          <table class="info-kv-table">
            <tbody>
              <tr>
                <td class="kv-key">Client Name</td>
                <td class="kv-val kv-val-bold">${data.client?.name || "Valued Client"}</td>
              </tr>
              <tr>
                <td class="kv-key">Phone</td>
                <td class="kv-val">${data.client?.mobile || "-"}</td>
              </tr>
              <tr>
                <td class="kv-key">Email</td>
                <td class="kv-val">${data.client?.email || "-"}</td>
              </tr>
              <tr>
                <td class="kv-key">Address</td>
                <td class="kv-val">${data.client?.address || "-"}</td>
              </tr>
            </tbody>
          </table>
          <div class="panel-footer-row">
            <span class="footer-label-text">Mode of Payment &nbsp;(${data.paymentMethod || "UPI"})</span>
            ${paymentPillHtml}
          </div>
        </div>
      </div>
    </div>
  `;
};

export const formatInch = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const str = String(val).trim();
  if (!str) return "";
  if (
    str.endsWith('"') ||
    str.endsWith("″") ||
    str.toLowerCase().endsWith("in") ||
    str.toLowerCase().endsWith("inch") ||
    str.toLowerCase().endsWith("inches")
  ) {
    return str;
  }
  return `${str}"`;
};

export const buildServiceRowHtml = (s, idx) => {
  const m = s.measurementProfile || {};
  const specsHtml = [
    s.fabric
      ? `<span class="spec-pill"><span class="lbl">Fabric:</span> <span class="val">${s.fabric}</span></span>`
      : "",
    m.title
      ? `<span class="spec-pill"><span class="lbl">Profile:</span> <span class="val">${m.title}</span></span>`
      : "",
    m.pallu
      ? `<span class="spec-pill"><span class="lbl">Pallu:</span> <span class="val">${formatInch(m.pallu)}</span></span>`
      : "",
    m.firstPleatSize
      ? `<span class="spec-pill"><span class="lbl">First Pleat:</span> <span class="val">${formatInch(m.firstPleatSize)}</span></span>`
      : "",
    m.shoulderToRightTight || m.shoulderToTight
      ? `<span class="spec-pill"><span class="lbl">Shoulder-Tight:</span> <span class="val">${formatInch(m.shoulderToRightTight || m.shoulderToTight)}</span></span>`
      : "",
    m.chest
      ? `<span class="spec-pill"><span class="lbl">Chest:</span> <span class="val">${formatInch(m.chest)}</span></span>`
      : "",
    m.noOfChestPleats
      ? `<span class="spec-pill"><span class="lbl">Chest Pleats:</span> <span class="val">${m.noOfChestPleats}</span></span>`
      : "",
    m.hip
      ? `<span class="spec-pill"><span class="lbl">Hip:</span> <span class="val">${formatInch(m.hip)}</span></span>`
      : "",
    m.height
      ? `<span class="spec-pill"><span class="lbl">Height:</span> <span class="val">${m.height}</span></span>`
      : "",
    m.dressSize
      ? `<span class="spec-pill"><span class="lbl">Dress Size:</span> <span class="val">${m.dressSize}</span></span>`
      : "",
    m.notes
      ? `<span class="spec-pill"><span class="lbl">Care Note:</span> <span class="val">${m.notes}</span></span>`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const careText = s.specialCare || m.notes || "";
  const careHtml = careText
    ? `<div class="care-box"><span class="care-lbl">Special Care / Note:</span> <span class="care-val">${careText}</span></div>`
    : "";

  return `
    <tr class="service-row">
      <td class="td-num">
        <span class="num-badge">${idx + 1}</span>
      </td>
      <td class="td-desc">
        <div class="service-name">${s.serviceName}</div>
        <div class="specs-wrap">${specsHtml}</div>
        ${careHtml}
      </td>
      <td class="td-amt">
        ${
          s.regularPrice > s.price && s.price > 0
            ? `<div class="amt-combo"><span class="regular-strike">₹${Number(s.regularPrice).toLocaleString("en-IN")}</span> <span class="offer-val">₹${Number(s.price || 0).toLocaleString("en-IN")}</span></div>`
            : `₹${Number(s.price || 0).toLocaleString("en-IN")}`
        }
      </td>
    </tr>
  `;
};

export const buildServicesTableHtml = (rowsHtml, isContinued = false) => {
  const hangerIcon = renderToStaticMarkup(
    <CheckroomOutlinedIcon style={{ fontSize: 16, color: "#ffffff" }} />,
  );

  return `
    <div class="pdf-services-card">
      <div class="services-header-bar">
        ${hangerIcon}
        <span>SERVICES${isContinued ? " (CONTINUED)" : ""}</span>
      </div>
      <table class="services-table">
        <thead>
          <tr>
            <th class="th-num">#</th>
            <th class="th-desc">SERVICE DESCRIPTION</th>
            <th class="th-amt">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
};

export const buildBottomGridHtml = (data = {}) => {
  const noteIcon = renderToStaticMarkup(
    <InfoOutlinedIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );
  const walletIcon = renderToStaticMarkup(
    <AccountBalanceWalletOutlinedIcon
      style={{ fontSize: 13, color: "#08182b" }}
    />,
  );

  const isPaid = String(data.paymentStatus || "").toLowerCase() === "paid";
  const discountAmount = Number(data.financials?.discount || 0);
  const balanceDueAmount =
    data.financials?.balanceDue !== undefined &&
    Number(data.financials?.balanceDue) > 0
      ? Number(data.financials?.balanceDue)
      : Math.max(
          0,
          Number(data.financials?.totalAmount || 0) -
            Number(data.financials?.advancePaid || 0),
        );

  return `
    <div class="pdf-bottom-grid">
      <div class="pdf-panel-card special-notes-panel">
        <div class="panel-header">
          ${noteIcon}
          <span>SPECIAL NOTE</span>
        </div>
        <div class="panel-body">
          <ul class="notes-list">
            <li>Please use the pre-pleated saree within 2 months.</li>
            <li>After using the pre-pleated saree, please iron it before storing.</li>
            <li>Do not put weight on pre-pleated sarees, especially fluffy pleats.</li>
            <li>Avoid folding or pressing the pleats unnecessarily.</li>
            <li>Keep the pre-pleated saree in a dry and clean place.</li>
            <li>For any issues, please contact Aparna Saree Pre-Pleating.</li>
            </ul>
        </div>
      </div>

      <div class="pdf-panel-card payment-summary-panel">
        <div class="panel-header">
          ${walletIcon}
          <span>PAYMENT SUMMARY</span>
        </div>
        <div class="panel-body">
          <div class="total-row">
            <span class="total-lbl">Services Subtotal</span>
            <span class="total-val">₹${Number(data.financials?.subtotal || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="total-row">
            <span class="total-lbl">Pickup &amp; Delivery Charges</span>
            <span class="total-val">₹${Number(data.financials?.pickupDeliveryCharges || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="total-row">
            <span class="total-lbl">Other Charges</span>
            <span class="total-val">₹${Number(data.financials?.otherCharges || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="total-row discount-row ${discountAmount > 0 ? "has-discount" : ""}">
            <span class="total-lbl">Discount</span>
            <span class="total-val">${discountAmount > 0 ? "-₹" + discountAmount.toLocaleString("en-IN") : "₹0"}</span>
          </div>
          <div class="total-row grand-total-row">
            <span class="grand-lbl">TOTAL BILLED AMOUNT</span>
            <span class="grand-val">₹${Number(data.financials?.totalAmount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="total-row advance-paid-row">
            <span class="total-lbl">Paid Amount</span>
            <span class="total-val">₹${Number(data.financials?.advancePaid || 0).toLocaleString("en-IN")}</span>
          </div>
          ${
            !isPaid && balanceDueAmount > 0
              ? `<div class="total-row balance-row">
            <span class="balance-lbl">Balance Due</span>
            <span class="balance-val">₹${Number(balanceDueAmount).toLocaleString("en-IN")}</span>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
};

export const buildThankYouBannerHtml = () => {
  const arrowIcon = renderToStaticMarkup(
    <ArrowForwardRoundedIcon
      style={{ fontSize: 14, color: "#ffffff", verticalAlign: "middle" }}
    />,
  );
  const instaIcon = renderToStaticMarkup(
    <InstagramIcon style={{ fontSize: 14, color: "#08182b" }} />,
  );
  const waIcon = renderToStaticMarkup(
    <WhatsAppIcon style={{ fontSize: 14, color: "#08182b" }} />,
  );
  const fbIcon = renderToStaticMarkup(
    <FacebookIcon style={{ fontSize: 14, color: "#08182b" }} />,
  );

  return `
    <div class="thankyou-banner-card">
      <img src="${flowerImg}" alt="" class="thankyou-bg-flower" />
      <div class="thankyou-content-center">
        <img src="${thankyouImg}" alt="Thank You" class="thankyou-script-img" />
        <div class="thankyou-for-choosing">for choosing Aparna Saree Pre-Pleating!</div>
        <div class="thankyou-heart-wrap">
          <span class="thankyou-heart">♥</span>
        </div>
        <div class="thankyou-tradition">Your trust keeps our tradition alive.</div>
      </div>
      <div class="thankyou-vert-divider"></div>
      <div class="thankyou-right-col">
        <div class="thankyou-qr-wrapper">
          <img src="${reviewQrImg}" alt="Scan to Review" class="thankyou-qr-img" />
        </div>
        <div class="thankyou-cta-col">
          <div class="cta-share-text">Share your experience</div>
          <div class="cta-stars">★★★★★</div>
          <a href="https://g.page/r/CfQ3Ljt5NC91EBM/review" target="_blank" rel="noopener noreferrer" class="cta-review-btn">
            <span>Review Us</span>
            <span class="cta-arrow-icon">${arrowIcon}</span>
          </a>
          <div class="thankyou-follow-row">
            <span class="follow-label">Follow Us:</span>
            <div class="social-icons-row">
              <span class="social-icon" title="Instagram">${instaIcon}</span>
              <span class="social-icon" title="WhatsApp">${waIcon}</span>
              <span class="social-icon" title="Facebook">${fbIcon}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const buildSignatureSectionHtml = () => `
  <div class="signature-section">
    <div class="signature-wrapper">
      <img src="${signatureImg}" alt="Authorized Signature" />
      <div class="signatory-title">AUTHORIZED SIGNATORY</div>
    </div>
  </div>
`;

export const buildLuxuryFooterHtml = () => {
  const locIcon = renderToStaticMarkup(
    <LocationOnOutlinedIcon
      style={{ fontSize: 15, color: "#dfb772", display: "block" }}
    />,
  );
  const phoneIcon = renderToStaticMarkup(
    <PhoneOutlinedIcon
      style={{ fontSize: 15, color: "#dfb772", display: "block" }}
    />,
  );
  const emailIcon = renderToStaticMarkup(
    <EmailOutlinedIcon
      style={{ fontSize: 15, color: "#dfb772", display: "block" }}
    />,
  );
  const webIcon = renderToStaticMarkup(
    <LanguageOutlinedIcon
      style={{ fontSize: 15, color: "#dfb772", display: "block" }}
    />,
  );

  const studioEmail =
    import.meta.env.VITE_STUDIO_EMAIL || "aparnaaarvi@gmail.com";
  const studioWebsite =
    import.meta.env.VITE_APP_URL || "https://aparnapleats.vercel.app";

  return `
    <div class="pdf-tagline-strip">
      <div class="tagline-line line-left"></div>
      <span class="tagline-text">DRAPE TODAY &nbsp;•&nbsp; MEMORIES FOREVER</span>
      <div class="tagline-line line-right"></div>
    </div>
    <div class="pdf-luxury-footer">
      <div class="footer-row-contacts">
       
        <div class="footer-item footer-phone">
          <span class="footer-icon">${phoneIcon}</span>
          <span class="footer-text">+91 95539 00003</span>
        </div>
         <div class="footer-item footer-website">
          <span class="footer-icon">${webIcon}</span>
          <span class="footer-text">${studioWebsite}</span>
        </div>
        <div class="footer-item footer-email">
          <span class="footer-icon">${emailIcon}</span>
          <span class="footer-text">${studioEmail}</span>
        </div>
      </div>
      <div class="footer-divider-line"></div>
      <div class="footer-row-address">
        <div class="footer-item footer-address">
          <span class="footer-icon">${locIcon}</span>
          <span class="footer-text">H.No. 4715, 1st Floor, Road No. 17, New MIG, BHEL, Hyderabad - 502032</span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Generates single-page HTML snippet for backward compatibility
 */
export const buildInvoiceHtmlSnippet = (data = {}) => {
  const serviceRowsHtml = (data.services || [])
    .map((s, idx) => buildServiceRowHtml(s, idx))
    .join("");

  return `
    <div class="invoice-pdf-page">
      ${buildHeaderBannerHtml()}
      <div class="pdf-content-body">
        ${buildMainHeadingHtml("ORDER DETAILS")}
        ${buildDossierGridHtml(data)}
        ${buildServicesTableHtml(serviceRowsHtml, false)}
        ${buildBottomGridHtml(data)}
        ${buildThankYouBannerHtml()}
        ${buildSignatureSectionHtml()}
      </div>
      ${buildLuxuryFooterHtml()}
    </div>
  `;
};

/**
 * Unified Core PDF Generator
 * Dynamically computes component heights, intelligently packs intact containers across A4 pages,
 * and renders high-definition multi-page jsPDF instance without breaking any containers.
 */
export const generateOrderInvoicePdf = async (
  order,
  { progressMessage = null } = {},
) => {
  if (!order) {
    toast.error("No order selected for invoice generation.");
    return null;
  }

  const data = mapOrderToInvoiceData(order);
  if (!data) {
    toast.error("Unable to format invoice data.");
    return null;
  }

  const orderId = data.orderId || "Order";
  const clientName = data.client?.name || "Client";
  const clientMobileRaw =
    data.client?.mobile || order.userMobile || order.clientMobile || "";
  const cleanDigits = String(clientMobileRaw).replace(/[^0-9]/g, "");
  const formattedPhone =
    cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  const totalAmount =
    data.financials?.totalAmount != null
      ? `₹${Number(data.financials.totalAmount).toLocaleString("en-IN")}`
      : "";
  const orderStatus = (data.orderStatus || "Confirmed").toUpperCase();
  const deliveryDate = data.deliveryDate
    ? `\nTarget Delivery: ${data.deliveryDate}`
    : "";

  const whatsappMessage = `Hello ${clientName} ji,\n\nHere are your *Order Details* for *Order #${orderId}* from *Aparna Saree Pre-Pleating Studio*.\n\n*Status:* ${orderStatus}\n*Total Amount:* ${totalAmount}${deliveryDate}\n\nPlease find your official Order Details PDF attached.\n\nThank you for choosing Aparna Saree Pre-Pleating Studio! ✨`;

  const toastId = progressMessage
    ? toast.info(progressMessage, { autoClose: false })
    : null;

  const totalServices = (data.services || []).length;

  const estimateRowHeight = (s) => {
    let h = 55;
    const m = s.measurementProfile || {};
    const specCount = [
      s.fabric,
      m.title,
      m.pallu,
      m.firstPleatSize,
      m.shoulderToRightTight,
      m.shoulderToTight,
      m.chest,
      m.noOfChestPleats,
      m.hip,
      m.height,
      m.dressSize,
      m.notes,
    ].filter(Boolean).length;
    if (specCount > 4) h += 26;
    if (s.specialCare || m.notes) h += 28;
    return h;
  };

  const rowHeights = (data.services || []).map(estimateRowHeight);
  const totalServicesHeight =
    totalServices > 0 ? 55 + rowHeights.reduce((sum, h) => sum + h, 0) : 0;

  // Bottom cards: Special Notes & Payment Summary (175) + Thank You (92) + Signature (60) = 327px
  const BOTTOM_BLOCKS_HEIGHT = 330;
  // Available body height on Page 1 when Heading (38) + Dossier (185) are present:
  // 1344 (Legal height) - 140 (header) - 80 (footer) - 20 (padding) - 38 (heading) - 185 (dossier) = 881px
  const PAGE1_AVAILABLE_FOR_REST = 881;
  const PAGE2_AVAILABLE = 1066;

  // Multi-page luxury invoice flow for Legal size (816px x 1344px):
  const pages = [];
  let serviceIdx = 0;

  // Check if everything fits on a single Legal page
  if (totalServicesHeight + BOTTOM_BLOCKS_HEIGHT <= PAGE1_AVAILABLE_FOR_REST) {
    const allRows = (data.services || []).map((s, idx) =>
      buildServiceRowHtml(s, idx),
    );
    const singlePageBody = [
      buildMainHeadingHtml("ORDER DETAILS"),
      buildDossierGridHtml(data),
      allRows.length > 0 ? buildServicesTableHtml(allRows.join(""), false) : "",
      buildBottomGridHtml(data),
      buildThankYouBannerHtml(),
      buildSignatureSectionHtml(),
    ].join("");
    pages.push(singlePageBody);
  } else {
    // Multi-page flow:
    const page1Rows = [];
    let page1TableHeight = totalServices > 0 ? 55 : 0;

    while (
      serviceIdx < totalServices &&
      page1TableHeight + rowHeights[serviceIdx] <= PAGE1_AVAILABLE_FOR_REST - 30
    ) {
      page1Rows.push(
        buildServiceRowHtml(data.services[serviceIdx], serviceIdx),
      );
      page1TableHeight += rowHeights[serviceIdx];
      serviceIdx++;
    }

    const page1Body = [
      buildMainHeadingHtml("ORDER DETAILS"),
      buildDossierGridHtml(data),
      page1Rows.length > 0
        ? buildServicesTableHtml(page1Rows.join(""), false)
        : "",
    ].join("");

    pages.push(page1Body);

    // Subsequent pages if there are remaining services:
    while (serviceIdx < totalServices) {
      const currentPageRows = [];
      let currentPageTableHeight = 55;

      while (
        serviceIdx < totalServices &&
        currentPageTableHeight +
          rowHeights[serviceIdx] +
          BOTTOM_BLOCKS_HEIGHT <=
          PAGE2_AVAILABLE
      ) {
        currentPageRows.push(
          buildServiceRowHtml(data.services[serviceIdx], serviceIdx),
        );
        currentPageTableHeight += rowHeights[serviceIdx];
        serviceIdx++;
      }

      if (currentPageRows.length === 0 && serviceIdx < totalServices) {
        while (
          serviceIdx < totalServices &&
          currentPageTableHeight + rowHeights[serviceIdx] <=
            PAGE2_AVAILABLE - 30
        ) {
          currentPageRows.push(
            buildServiceRowHtml(data.services[serviceIdx], serviceIdx),
          );
          currentPageTableHeight += rowHeights[serviceIdx];
          serviceIdx++;
        }
      }

      const pageBodyParts = [
        buildMainHeadingHtml(
          serviceIdx >= totalServices
            ? "PAYMENT & CARE SUMMARY"
            : "ORDER DETAILS (CONTINUED)",
        ),
        currentPageRows.length > 0
          ? buildServicesTableHtml(currentPageRows.join(""), true)
          : "",
      ];

      if (serviceIdx >= totalServices) {
        pageBodyParts.push(buildBottomGridHtml(data));
        pageBodyParts.push(buildThankYouBannerHtml());
        pageBodyParts.push(buildSignatureSectionHtml());
      }

      pages.push(pageBodyParts.join(""));
    }

    // If services filled Page 1 but bottom blocks need a page
    if (pages.length === 1) {
      const page2Body = [
        buildMainHeadingHtml("PAYMENT & CARE SUMMARY"),
        buildBottomGridHtml(data),
        buildThankYouBannerHtml(),
        buildSignatureSectionHtml(),
      ].join("");
      pages.push(page2Body);
    }
  }

  // Create export container with intact individual Legal page divs
  const container = document.createElement("div");
  container.id = "order-pdf-export-container";
  container.style.position = "fixed";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.width = "816px";
  container.style.background = "#ffffff";
  container.style.zIndex = "-9999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.boxSizing = "border-box";

  const inlineStyles = document.createElement("style");
  inlineStyles.innerHTML = INVOICE_PDF_INTERNAL_CSS;
  container.appendChild(inlineStyles);

  pages.forEach((pageBodyHtml) => {
    const pageEl = document.createElement("div");
    pageEl.className = "invoice-pdf-page";
    pageEl.innerHTML = `
      ${buildHeaderBannerHtml()}
      <div class="pdf-content-body">
        ${pageBodyHtml}
      </div>
      ${buildLuxuryFooterHtml()}
    `;
    container.appendChild(pageEl);
  });

  document.body.appendChild(container);

  try {
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 800);
            }
          }),
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "legal",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const pageDivs = Array.from(
      container.querySelectorAll(".invoice-pdf-page"),
    );

    for (let pageIdx = 0; pageIdx < pageDivs.length; pageIdx++) {
      const pageDiv = pageDivs[pageIdx];

      const pageCanvas = await html2canvas(pageDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 816,
        windowHeight: 1344,
      });

      if (pageIdx > 0) {
        pdf.addPage();
      }

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

      // Map clickable link annotations for this specific page
      const anchors = Array.from(pageDiv.querySelectorAll("a"));
      const pageRect = pageDiv.getBoundingClientRect();

      if (pageRect.width > 0 && pageRect.height > 0) {
        anchors.forEach((anchor) => {
          if (!anchor.href) return;
          const linkRect = anchor.getBoundingClientRect();
          const relX =
            ((linkRect.left - pageRect.left) / pageRect.width) * pdfWidth;
          const relY =
            ((linkRect.top - pageRect.top) / pageRect.height) * pdfHeight;
          const relW = (linkRect.width / pageRect.width) * pdfWidth;
          const relH = (linkRect.height / pageRect.height) * pdfHeight;

          try {
            pdf.setPage(pageIdx + 1);
            pdf.link(relX, relY, relW, relH, { url: anchor.href });
          } catch (linkErr) {
            console.warn("Could not set PDF link annotation:", linkErr);
          }
        });
      }
    }

    const fileName = `Order-Details-${orderId}.pdf`;

    return {
      pdf,
      data,
      orderId,
      fileName,
      clientName,
      formattedPhone,
      toastId,
    };
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Direct PDF Download using html2canvas & jsPDF
 */
export const downloadInvoicePdfDirectly = async (order) => {
  const orderId = order?.id || order?.orderId || "Order";
  let toastId = null;

  try {
    const result = await generateOrderInvoicePdf(order, {
      progressMessage: `Preparing invoice for ${orderId}...`,
    });
    if (!result) return;

    toastId = result.toastId;
    const { pdf, fileName } = result;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // Save to Cache directory (has native FileProvider authority for sharing/opening)
      await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      // Also save a copy to Documents directory for permanent device storage
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });
      } catch (docErr) {
        console.warn("Could not save secondary copy in Documents:", docErr);
      }

      if (toastId) toast.dismiss(toastId);
      toast.success(
        `Order details PDF saved to your device for Order #${orderId}`,
      );
    } else {
      // Browser download (Desktop / Web)
      pdf.save(fileName);
      if (toastId) toast.dismiss(toastId);
      toast.success(`Downloaded ${fileName}`);
    }
  } catch (err) {
    console.error("Direct PDF export failed:", err);
    if (toastId) toast.dismiss(toastId);
    toast.error("Failed to generate PDF download. Please try again.");
  }
};

/**
 * Generates Order Details PDF and shares it to WhatsApp / Native Share Sheet
 */
export const shareOrderPdfToWhatsApp = async (order) => {
  const orderId = order?.id || order?.orderId || "Order";
  let toastId = null;

  try {
    const result = await generateOrderInvoicePdf(order, {
      progressMessage: `Preparing Order PDF for ${orderId}...`,
    });
    if (!result) return;

    toastId = result.toastId;
    const { pdf, fileName, clientName, formattedPhone, whatsappMessage } =
      result;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = pdf.output("datauristring").split(",")[1];

      // Save PDF to Cache for WhatsApp file attachment
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      // Also save to Documents for user records
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
        });
      } catch (docErr) {
        console.warn("Could not save to Documents:", docErr);
      }

      if (toastId) toast.dismiss(toastId);

      // Open Android/iOS Share Intent with PDF file attached + message text
      try {
        await Share.share({
          title: `Order Details - ${orderId}`,
          text: whatsappMessage,
          url: savedFile.uri,
          dialogTitle: `Send Invoice to WhatsApp`,
        });
        toast.success(
          `PDF attached! Select WhatsApp to send to ${clientName}.`,
        );
      } catch (shareErr) {
        if (shareErr?.message !== "Share canceled") {
          const encoded = encodeURIComponent(whatsappMessage);
          const waUrl = formattedPhone
            ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
            : `https://api.whatsapp.com/send?text=${encoded}`;
          window.open(waUrl, "_system");
        }
      }
    } else {
      // Web platform (Desktop / Mobile Browser)
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], fileName, {
        type: "application/pdf",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        if (toastId) toast.dismiss(toastId);
        try {
          await navigator.share({
            title: `Order Details - ${orderId}`,
            text: whatsappMessage,
            files: [pdfFile],
          });
          toast.success(
            `PDF attached! Select WhatsApp to send to ${clientName}.`,
          );
        } catch (shareErr) {
          if (shareErr.name !== "AbortError") {
            pdf.save(fileName);
            const encoded = encodeURIComponent(whatsappMessage);
            const waUrl = formattedPhone
              ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
              : `https://api.whatsapp.com/send?text=${encoded}`;
            window.open(waUrl, "_blank");
            toast.info(
              `PDF downloaded. Attach the downloaded PDF in WhatsApp chat.`,
            );
          }
        }
      } else {
        // Desktop Web Browser: download PDF + open WhatsApp Web chat
        pdf.save(fileName);
        if (toastId) toast.dismiss(toastId);

        const encoded = encodeURIComponent(whatsappMessage);
        const waUrl = formattedPhone
          ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
          : `https://web.whatsapp.com/send?text=${encoded}`;

        window.open(waUrl, "_blank");
        toast.info(
          `Invoice PDF downloaded! WhatsApp chat opened - click 📎 to attach the downloaded PDF.`,
        );
      }
    }
  } catch (err) {
    console.error("WhatsApp Order PDF share failed:", err);
    if (toastId) toast.dismiss(toastId);
    toast.error("Failed to generate Order PDF for WhatsApp. Please try again.");
  }
};

/**
 * Opens client's direct WhatsApp chat window.
 * If client phone number is available, launches wa.me direct chat with order greeting.
 */
export const openClientWhatsAppChat = (order) => {
  if (!order) {
    toast.error("No order selected.");
    return;
  }

  const clientMobileRaw =
    order.clientMobile ||
    order.userMobile ||
    order.phone ||
    order.mobile ||
    order.customerMobile ||
    order.clientPhone ||
    order.customerPhone ||
    order.client?.mobile ||
    "";

  const cleanDigits = String(clientMobileRaw).replace(/[^0-9]/g, "");
  if (!cleanDigits || cleanDigits.length < 10) {
    toast.warning("No valid client mobile number found to open WhatsApp.");
    return;
  }

  const formattedPhone =
    cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  const clientName =
    order.clientName ||
    order.customerName ||
    order.name ||
    order.client?.name ||
    "";

  const message = ``;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

/**
 * Backward-compatible alias for any legacy callers
 */
export const printOrderInvoiceDirectly = downloadInvoicePdfDirectly;

export const CustomInvoiceModal = () => null;

export default CustomInvoiceModal;
