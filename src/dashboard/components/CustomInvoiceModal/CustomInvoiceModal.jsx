import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";
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
      price:
        Number(it.finalPrice) !== undefined &&
        !Number.isNaN(Number(it.finalPrice))
          ? Number(it.finalPrice)
          : Number(it.servicePrice) || 0,
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
    order.userMobile || order.client?.userMobile || order.phone || "—";
  const clientEmail = order.email || order.client?.email || "—";
  const clientAddress =
    order.userAddress || order.client?.userAddress || order.address || "—";

  const orderId = order.id || "ORD-NEW";
  const invNumber =
    order.invoiceNumber ||
    `INV-${orderId.replace(/[^0-9]/g, "") || new Date().getFullYear()}`;

  const bookingDateStr = order.orderDate
    ? formatDateSafe(order.orderDate)
    : order.createdAt
      ? formatDateSafe(order.createdAt)
      : "—";
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
  if (s === "completed") {
    return {
      label: "Completed",
      style: "background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;",
    };
  }
  if (s === "in-progress") {
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
  .invoice-pdf-wrapper {
    width: 100%;
    max-width: 794px;
    height: 100%;
    min-height: 1123px;
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
  }

  #order-pdf-export-container .balance-row.is-paid {
    color: #15803d;
  }

  #order-pdf-export-container .balance-row.is-paid .balance-lbl,
  #order-pdf-export-container .balance-row.is-paid .balance-val {
    color: #15803d;
  }

  #order-pdf-export-container .balance-row:not(.is-paid) {
    color: #dc2626;
  }

  #order-pdf-export-container .balance-row:not(.is-paid) .balance-lbl,
  #order-pdf-export-container .balance-row:not(.is-paid) .balance-val {
    color: #dc2626;
  }

  #order-pdf-export-container .balance-row .balance-lbl {
    font-weight: 700;
    font-size: 10.5px;
  }

  #order-pdf-export-container .balance-row .balance-val {
    font-weight: 700;
    font-size: 11.5px;
  }

  /* 6. Thank You & Google Review Banner Card */
  #order-pdf-export-container .thankyou-banner-card {
    position: relative;
    background: #faf6f0;
    border: 1px solid #ebdccb;
    border-radius: 8px;
    padding: 7px 18px 7px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    margin-bottom: 6px;
    box-sizing: border-box;
    overflow: hidden;
    width: 100%;
  }

  #order-pdf-export-container .thankyou-bg-flower {
    position: absolute;
    left: -8px;
    bottom: -10px;
    height: 125%;
    width: auto;
    max-width: 140px;
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
    padding: 0 10px 0 38px;
  }

  #order-pdf-export-container .thankyou-script-img {
    height: 35px;
    width: auto;
    max-width: 135px;
    object-fit: contain;
    display: block;
    margin: 0 auto 1px auto;
    mix-blend-mode: multiply;
  }

  #order-pdf-export-container .thankyou-for-choosing {
    font-family: 'Cinzel', 'Playfair Display', 'Times New Roman', Georgia, serif;
    font-size: 12px;
    font-weight: 700;
    color: #08182b;
    line-height: 1.25;
    letter-spacing: 0.3px;
    margin-top: 1px;
  }

  #order-pdf-export-container .thankyou-heart-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px 0 1px 0;
  }

  #order-pdf-export-container .thankyou-heart {
    color: #caa368;
    font-size: 9.5px;
    line-height: 1;
  }

  #order-pdf-export-container .thankyou-tradition {
    font-size: 9.5px;
    font-weight: 500;
    color: #334155;
    line-height: 1.2;
    letter-spacing: 0.2px;
  }

  #order-pdf-export-container .thankyou-vert-divider {
    position: relative;
    z-index: 1;
    width: 1px;
    height: 56px;
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
    width: 58px;
    height: 58px;
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
    font-size: 11px;
    font-weight: 600;
    color: #08182b;
    line-height: 1.2;
    white-space: nowrap;
  }

  #order-pdf-export-container .cta-stars {
    color: #f59e0b;
    font-size: 13px;
    line-height: 1;
    letter-spacing: 2px;
  }

  #order-pdf-export-container .cta-review-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #08182b;
    color: #ffffff !important;
    text-decoration: none !important;
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.3px;
    margin-top: 2px;
    box-shadow: 0 2px 4px rgba(8, 24, 43, 0.15);
  }

  #order-pdf-export-container .cta-hand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 13px;
    line-height: 1;
    margin-left: 1px;
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

  #order-pdf-export-container .pdf-luxury-footer {
    margin-top: auto;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
    background: #ffffff;
  }

  #order-pdf-export-container .footer-top-line {
    width: 100%;
    height: 1.5px;
    background: #caa368;
    margin-bottom: 8px;
  }

  #order-pdf-export-container .footer-contact-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px 8px 24px;
    gap: 12px;
    box-sizing: border-box;
  }

  #order-pdf-export-container .footer-col {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  #order-pdf-export-container .footer-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #08182b;
    flex-shrink: 0;
  }

  #order-pdf-export-container .footer-text-block {
    font-size: 10px;
    color: #08182b;
    line-height: 1.35;
    font-weight: 500;
  }

  #order-pdf-export-container .phone-num {
    font-size: 11.5px;
    font-weight: 700;
    color: #08182b;
    line-height: 1.25;
  }

  #order-pdf-export-container .timing-text {
    font-size: 9px;
    color: #475569;
    font-weight: 500;
    margin-top: 1.5px;
    line-height: 1.2;
  }

  #order-pdf-export-container .email-text {
    font-size: 10.5px;
    font-weight: 600;
    color: #08182b;
  }

  #order-pdf-export-container .footer-col-social {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex-shrink: 0;
  }

  #order-pdf-export-container .social-icons-row {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  #order-pdf-export-container .social-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #08182b;
  }

  #order-pdf-export-container .follow-us-text {
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #08182b;
    text-transform: uppercase;
  }

  #order-pdf-export-container .footer-tagline-row {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px 12px 24px;
    gap: 8px;
    box-sizing: border-box;
  }

  #order-pdf-export-container .tagline-line {
    flex: 1;
    height: 1px;
    background: #caa368;
  }

  #order-pdf-export-container .tagline-ornament {
    color: #caa368;
    font-size: 10px;
    line-height: 1;
    padding: 0 3px;
  }

  #order-pdf-export-container .tagline-text {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    color: #08182b;
    text-transform: uppercase;
    white-space: nowrap;
    padding: 0 6px;
  }
`;

/**
 * Generates an HTML string snippet for PDF export using clean semantic classes
 */
export const buildInvoiceHtmlSnippet = (data = {}) => {
  const isPaid = String(data.paymentStatus || "").toLowerCase() === "paid";
  const orderStatusClass = `status-${String(data.orderStatus || "pending").toLowerCase()}`;

  const orderStatusLabel =
    data.orderStatus === "completed"
      ? "Completed"
      : data.orderStatus === "in-progress"
        ? "In-Progress"
        : data.orderStatus === "cancelled"
          ? "Cancelled"
          : "Pending";

  const hangerIcon = renderToStaticMarkup(
    <CheckroomOutlinedIcon style={{ fontSize: 16, color: "#ffffff" }} />,
  );

  const servicesRowsHtml = (data.services || [])
    .map((s, idx) => {
      const m = s.measurementProfile || {};
      const specsHtml = [
        s.fabric
          ? `<span class="spec-pill"><span class="lbl">Fabric:</span> <span class="val">${s.fabric}</span></span>`
          : "",
        m.title
          ? `<span class="spec-pill"><span class="lbl">Profile:</span> <span class="val">${m.title}</span></span>`
          : "",
        m.pallu
          ? `<span class="spec-pill"><span class="lbl">Pallu:</span> <span class="val">${m.pallu}</span></span>`
          : "",
        m.firstPleatSize
          ? `<span class="spec-pill"><span class="lbl">First Pleat:</span> <span class="val">${m.firstPleatSize}</span></span>`
          : "",
        m.shoulderToRightTight
          ? `<span class="spec-pill"><span class="lbl">Shoulder-Tight:</span> <span class="val">${m.shoulderToRightTight}</span></span>`
          : "",
        m.shoulderToTight
          ? `<span class="spec-pill"><span class="lbl">Shoulder-Tight:</span> <span class="val">${m.shoulderToTight}</span></span>`
          : "",
        m.chest
          ? `<span class="spec-pill"><span class="lbl">Chest:</span> <span class="val">${m.chest}</span></span>`
          : "",
        m.noOfChestPleats
          ? `<span class="spec-pill"><span class="lbl">Chest Pleats:</span> <span class="val">${m.noOfChestPleats}</span></span>`
          : "",
        m.hip
          ? `<span class="spec-pill"><span class="lbl">Hip:</span> <span class="val">${m.hip}</span></span>`
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
          <td class="td-amt">₹${Number(s.price || 0).toLocaleString("en-IN")}</td>
        </tr>
      `;
    })
    .join("");

  const discountAmount = Number(data.financials?.discount || 0);
  const balanceDisplayAmount = isPaid
    ? data.financials?.balancePaid !== undefined &&
      Number(data.financials?.balancePaid) > 0
      ? data.financials?.balancePaid
      : Math.max(
          0,
          Number(data.financials?.totalAmount || 0) -
            Number(data.financials?.advancePaid || 0),
        )
    : data.financials?.balanceDue !== undefined &&
        Number(data.financials?.balanceDue) > 0
      ? data.financials?.balanceDue
      : Math.max(
          0,
          Number(data.financials?.totalAmount || 0) -
            Number(data.financials?.advancePaid || 0),
        );

  const orderDetailsIcon = renderToStaticMarkup(
    <ReceiptLongOutlinedIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );
  const billedToIcon = renderToStaticMarkup(
    <PersonOutlineIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );
  const reviewStarIcon = renderToStaticMarkup(
    <StarRoundedIcon style={{ fontSize: 14, color: "#0f172a" }} />,
  );
  const locIcon = renderToStaticMarkup(
    <LocationOnOutlinedIcon style={{ fontSize: 18, color: "#08182b" }} />,
  );
  const phoneIcon = renderToStaticMarkup(
    <PhoneOutlinedIcon style={{ fontSize: 17, color: "#08182b" }} />,
  );
  const emailIcon = renderToStaticMarkup(
    <EmailOutlinedIcon style={{ fontSize: 17, color: "#08182b" }} />,
  );
  const instaIcon = renderToStaticMarkup(
    <InstagramIcon style={{ fontSize: 16, color: "#08182b" }} />,
  );
  const waIcon = renderToStaticMarkup(
    <WhatsAppIcon style={{ fontSize: 16, color: "#08182b" }} />,
  );
  const fbIcon = renderToStaticMarkup(
    <FacebookIcon style={{ fontSize: 16, color: "#08182b" }} />,
  );
  const noteIcon = renderToStaticMarkup(
    <InfoOutlinedIcon style={{ fontSize: 13, color: "#08182b" }} />,
  );
  const walletIcon = renderToStaticMarkup(
    <AccountBalanceWalletOutlinedIcon
      style={{ fontSize: 13, color: "#08182b" }}
    />,
  );
  const touchHandIcon = renderToStaticMarkup(
    <TouchAppOutlinedIcon
      style={{ fontSize: 13, color: "#ffffff", verticalAlign: "middle" }}
    />,
  );

  const occasionRowHtml =
    data.occasion && data.occasion !== "-" && data.occasion.trim() !== ""
      ? `
        <tr>
          <td class="kv-key">Occasion</td>
          <td class="kv-val">${data.occasion}</td>
        </tr>
      `
      : "";

  let orderStatusPillHtml = "";
  const sStatus = String(data.orderStatus || "in-progress").toLowerCase();
  if (sStatus === "completed") {
    orderStatusPillHtml = `
      <span class="pay-pill pay-pill-paid">
        <span class="pill-check-icon">✓</span>
        <span>COMPLETED</span>
      </span>
    `;
  } else if (sStatus === "in-progress") {
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
    <div class="invoice-pdf-wrapper">
      
      <!-- 1. Flush Full-Width Big Poster Header Banner (0px gap top, left, right) -->
      <div class="pdf-header-banner">
        <img src="${pdfHeaderImg}" alt="Aparna Saree Pre-Pleating" />
      </div>

      <div class="pdf-content-body">
        
        <!-- 2. Main Heading: Order Details -->
        <div class="pdf-main-heading-wrap">
          <div class="pdf-heading-line line-left"></div>
          <div class="pdf-main-heading">ORDER DETAILS</div>
          <div class="pdf-heading-line line-right"></div>
        </div>

        <!-- 3. Meta Dossier Grid (Left: Order Information, Right: Client Details) -->
        <div class="pdf-dossier-grid">
          
          <!-- Left: Order Information Panel -->
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

          <!-- Right: Client Details Panel -->
          <div class="pdf-panel-card client-info-panel">
            <div class="panel-header">
              ${billedToIcon}
              <span>CLIENT DETAILS</span>
            </div>
            <div class="panel-body">
              <table class="info-kv-table">
                <tbody>
                  <tr>
                    <td class="kv-key">Name</td>
                    <td class="kv-val kv-val-bold">${data.client?.name || "Client"}</td>
                  </tr>
                  <tr>
                    <td class="kv-key">Phone</td>
                    <td class="kv-val">${data.client?.mobile || "—"}</td>
                  </tr>
                  <tr>
                    <td class="kv-key">Email</td>
                    <td class="kv-val">${data.client?.email || "—"}</td>
                  </tr>
                  <tr>
                    <td class="kv-key">Address</td>
                    <td class="kv-val">${data.client?.address || "—"}</td>
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

        <!-- 4. Ordered Services Table -->
        <div class="pdf-services-card">
          <div class="services-header-bar">
            ${hangerIcon}
            <span>SERVICES</span>
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
              ${servicesRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- 5. Notes & Financial Summary (2 Column Grid) -->
        <div class="pdf-bottom-grid">
          <!-- Left: Special Notes Panel -->
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
              </ul>
            </div>
          </div>

          <!-- Right: Payment Summary Panel -->
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
              <div class="total-row balance-row ${isPaid ? "is-paid" : ""}">
                <span class="balance-lbl">${isPaid ? "Balance Paid" : "Balance Due"}</span>
                <span class="balance-val">₹${Number(balanceDisplayAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 6. Thank You & Google Review Banner Card -->
        <div class="thankyou-banner-card">
          <!-- Left botanical flower illustration -->
          <img src="${flowerImg}" alt="" class="thankyou-bg-flower" />

          <!-- Center: Thank you message -->
          <div class="thankyou-content-center">
            <img src="${thankyouImg}" alt="Thank You" class="thankyou-script-img" />
            <div class="thankyou-for-choosing">for choosing Aparna Saree Pre-Pleating!</div>
            <div class="thankyou-heart-wrap">
              <span class="thankyou-heart">♥</span>
            </div>
            <div class="thankyou-tradition">Your trust keeps our tradition alive.</div>
          </div>

          <!-- Divider -->
          <div class="thankyou-vert-divider"></div>

          <!-- Right: QR Code & Review CTA -->
          <div class="thankyou-right-col">
            <div class="thankyou-qr-wrapper">
              <img src="${reviewQrImg}" alt="Scan to Review" class="thankyou-qr-img" />
            </div>
            <div class="thankyou-cta-col">
              <div class="cta-share-text">Share your experience</div>
              <div class="cta-stars">★★★★★</div>
              <a href="https://g.page/r/CfQ3Ljt5NC91EBM/review" target="_blank" rel="noopener noreferrer" class="cta-review-btn">
                <span>Review Us</span>
                <span class="cta-hand-icon">${touchHandIcon}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- 7. Authorized Signatory Row -->
        <div class="signature-section">
          <div class="signature-wrapper">
            <img src="${signatureImg}" alt="Authorized Signature" />
            <div class="signatory-title">AUTHORIZED SIGNATORY</div>
          </div>
        </div>
      </div>

      <!-- 8. Master Luxury Footer -->
      <div class="pdf-luxury-footer">
        <div class="footer-top-line"></div>
        
        <div class="footer-contact-row">
          <!-- 1. Address -->
          <div class="footer-col footer-col-address">
            <span class="footer-icon">${locIcon}</span>
            <div class="footer-text-block">
              <div>H.No. 4715, 1st Floor, Road No. 17,</div>
              <div>New MIG, BHEL, Hyderabad - 502032</div>
            </div>
          </div>

          <!-- 2. Phone & Timing -->
          <div class="footer-col footer-col-phone">
            <span class="footer-icon">${phoneIcon}</span>
            <div class="footer-text-block">
              <div class="phone-num">+91 98765 43210</div>
              <div class="timing-text">Mon - Sat | 10:00 AM - 7:00 PM</div>
            </div>
          </div>

          <!-- 3. Email -->
          <div class="footer-col footer-col-email">
            <span class="footer-icon">${emailIcon}</span>
            <div class="footer-text-block">
              <div class="email-text">support@aparnasaree.com</div>
            </div>
          </div>

          <!-- 4. Social Links -->
          <div class="footer-col footer-col-social">
            <div class="social-icons-row">
              <span class="social-icon">${instaIcon}</span>
              <span class="social-icon">${waIcon}</span>
              <span class="social-icon">${fbIcon}</span>
            </div>
            <div class="follow-us-text">FOLLOW US</div>
          </div>
        </div>

        <!-- Tagline Banner with Gold Flourishes -->
        <div class="footer-tagline-row">
          <div class="tagline-line line-left"></div>
          <span class="tagline-ornament">❖</span>
          <span class="tagline-text">DRAPE TODAY &nbsp;•&nbsp; MEMORIES FOREVER</span>
          <span class="tagline-ornament">❖</span>
          <div class="tagline-line line-right"></div>
        </div>
      </div>
    </div>
  `;
};

/**
 * Unified Core PDF Generator
 * Renders the off-screen A4 container dynamically and compiles it to high-res jsPDF instance.
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

  const container = document.createElement("div");
  container.id = "order-pdf-export-container";
  container.style.position = "fixed";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.width = "794px";
  container.style.height = "1123px";
  container.style.minHeight = "1123px";
  container.style.background = "#ffffff";
  container.style.zIndex = "-9999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.boxSizing = "border-box";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "space-between";
  container.style.margin = "0";
  container.style.padding = "0";

  const inlineStyles = document.createElement("style");
  inlineStyles.innerHTML = INVOICE_PDF_INTERNAL_CSS;
  container.appendChild(inlineStyles);

  const contentWrap = document.createElement("div");
  contentWrap.innerHTML = buildInvoiceHtmlSnippet(data);
  container.appendChild(contentWrap);

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

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: 1123,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const marginX = 0;
    const marginY = 0;
    const contentWidth = pdfWidth;
    const contentHeight = pdfHeight;

    pdf.addImage(
      imgData,
      "JPEG",
      marginX,
      marginY,
      contentWidth,
      contentHeight,
    );

    const reviewAnchor = container.querySelector("a");
    if (reviewAnchor) {
      const linkRect = reviewAnchor.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      if (contRect.width > 0 && contRect.height > 0) {
        const relX =
          marginX +
          ((linkRect.left - contRect.left) / contRect.width) * contentWidth;
        const relY =
          marginY +
          ((linkRect.top - contRect.top) / contRect.height) * contentHeight;
        const relW = (linkRect.width / contRect.width) * contentWidth;
        const relH = (linkRect.height / contRect.height) * contentHeight;
        pdf.link(relX, relY, relW, relH, { url: reviewAnchor.href });
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
      whatsappMessage,
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
          `Invoice PDF downloaded! WhatsApp chat opened — click 📎 to attach the downloaded PDF.`,
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
  const orderId = order.orderId || order.id || "";

  const greeting = clientName ? `Hello ${clientName} ji, ` : "Hello, ";
  const orderRef = orderId
    ? `regarding your Saree Pre-Pleating Order #${orderId}`
    : "regarding your Saree Pre-Pleating Order";
  const message = `${greeting}${orderRef} at Aparna Saree Pre-Pleating Studio.`;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
};

/**
 * Backward-compatible alias for any legacy callers
 */
export const printOrderInvoiceDirectly = downloadInvoicePdfDirectly;

export const CustomInvoiceModal = () => null;

export default CustomInvoiceModal;
