import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// 3-Service Sample Order Dataset matching View Order Popup specs
const SAMPLE_INVOICE = {
  invoiceNumber: "INV-2026-0842",
  orderId: "ORD-9842",
  bookingDate: "09 Sep 2026, 02:30 PM",
  deliveryDate: "12 Sep 2026, 05:00 PM",
  occasion: "Wedding Reception & Sangeet",
  paymentStatus: "paid",
  paymentMethod: "UPI (Google Pay)",
  client: {
    name: "Sneha Reddy",
    mobile: "+91 98490 12345",
    email: "sneha.reddy@gmail.com",
    address:
      "Plot 42, Jubilee Hills Road No. 36, Hyderabad, Telangana - 500033",
  },
  services: [
    {
      id: "srv_1",
      serviceName:
        "Bridal Pure Kanchipuram Silk Saree Pre-Pleating & Box Folding",
      fabric: "Pure Kanchipuram Silk",
      measurementProfile: {
        title: "Bridal Muhurtham Profile",
        pallu: '38"',
        firstPleatSize: '5.5" (6 Pleats)',
        shoulderToRightTight: '14"',
        chest: '36"',
        hip: '38"',
        height: "5' 5\"",
        dressSize: "M",
      },
      specialCare:
        "Handle pure zari with tissue lining; steam press only. Butter paper isolation.",
      price: 1200,
    },
    {
      id: "srv_2",
      serviceName: "Designer Organza Floral Saree Pleat Setting & Pinning",
      fabric: "Organza Silk",
      measurementProfile: {
        title: "Sangeet Reception Profile",
        pallu: '36"',
        firstPleatSize: '5.0" (5 Pleats)',
        shoulderToRightTight: '13.5"',
        chest: '36"',
        hip: '38"',
        height: "5' 5\"",
      },
      specialCare:
        "Delicate hand-embroidered border; anti-slip pin cushions applied.",
      price: 800,
    },
    {
      id: "srv_3",
      serviceName: "Tussar Silk Saree Rolling, Ironing & Box Packaging",
      fabric: "Tussar Silk",
      measurementProfile: {
        title: "Classic Day Wear",
        pallu: '34"',
        firstPleatSize: '5.0" (6 Pleats)',
        shoulderToTight: '14"',
        height: "5' 5\"",
      },
      specialCare:
        "Zero-crease moisture barrier packaging with breathable cover.",
      price: 700,
    },
  ],
  notes:
    "Please pack each saree in separate luxury zip-lock pouches with butter paper to avoid friction during travel.",
  financials: {
    subtotal: 2700,
    pickupDeliveryCharges: 150,
    discount: 0,
    totalAmount: 2850,
  },
};

export function buildInvoiceHtml(data = SAMPLE_INVOICE) {
  const logoPath = path.join(projectRoot, "src", "assets", "logo-light.png");
  let logoBase64 = "";
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  }

  const sigPath = path.join(projectRoot, "src", "assets", "signature.png");
  let signatureBase64 = "";
  if (fs.existsSync(sigPath)) {
    signatureBase64 = `data:image/png;base64,${fs.readFileSync(sigPath).toString("base64")}`;
  }

  const servicesRows = (data.services || [])
    .map((s) => {
      const m = s.measurementProfile || {};
      const specsHtml = [
        s.fabric
          ? `<span class="spec-pill fabric-pill"><span class="lbl">Fabric:</span> <span class="val">${s.fabric}</span></span>`
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
          <td class="td-desc">
            <div class="service-name">${s.serviceName}</div>
            <div class="specs-wrap">${specsHtml}</div>
            ${careHtml}
          </td>
          <td class="td-amt">₹${Number(s.price).toLocaleString("en-IN")}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Details - ${data.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 4mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12.5px;
      line-height: 1.45;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .invoice-container {
      width: 100%;
      max-width: 780px;
      min-height: 100%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8px 14px 4px 14px;
      box-sizing: border-box;
    }
    .invoice-main-body {
      display: flex;
      flex-direction: column;
    }

    /* 1. Middle Top Centered Logo */
    .top-logo-row {
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      margin-bottom: 4px;
    }
    .brand-logo-img {
      width: 54%;
      max-width: 340px;
      height: auto;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }

    /* Divider */
    .divider-line {
      height: 1.5px;
      background: #cbd5e1;
      margin: 4px 0 6px 0;
      border-radius: 9999px;
    }

    /* 2. Meta Dossier Grid */
    .dossier-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin-bottom: 6px;
    }
    .dossier-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
    }
    .invoice-container svg {
      fill: none !important;
    }
    .invoice-container svg * {
      fill: none !important;
    }
    .dossier-card-head {
      background: #0f172a;
      color: #ffffff;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dossier-card-body {
      padding: 7px 10px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 3.5px;
      flex: 1;
    }

    /* Left Invoice Details Meta Table */
    .meta-line {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 12px;
    }
    .meta-line .lbl {
      color: #64748b;
      font-weight: 500;
      font-size: 12px;
    }
    .meta-line .val {
      color: #0f172a;
      font-weight: 600;
      font-size: 12.5px;
      text-align: right;
    }
    .meta-line .highlight-inv {
      font-size: 12.5px;
      font-weight: 600;
      color: #0f172a;
    }
    .meta-line .delivery {
      color: #047857;
      font-weight: 600;
      font-size: 12.5px;
    }

    /* Right Client Details */
    .client-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .client-row {
      color: #475569;
      font-size: 12px;
      line-height: 1.35;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .client-row.addr-row {
      align-items: flex-start;
    }
    .client-row.addr-row svg {
      margin-top: 2px;
    }
    .payment-spec-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 3px;
      padding-top: 3px;
      border-top: 1px dashed #cbd5e1;
    }
    .pay-mode-lbl {
      font-size: 11.5px;
      color: #475569;
      font-weight: 500;
    }
    .pay-status-pill {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    /* 3. Services Table */
    .services-title {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .services-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 10px;
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      text-align: left;
    }
    .services-table th.th-amt { width: 120px; text-align: right; }
    .services-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: top;
    }
    .services-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .service-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .specs-wrap {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      gap: 4px;
      margin-bottom: 4px;
    }
    .spec-pill {
      display: inline-flex;
      align-items: center;
      gap: 3.5px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      color: #334155;
    }
    .spec-pill .lbl {
      color: #64748b;
      font-weight: 500;
    }
    .spec-pill .val {
      color: #0f172a;
      font-weight: 600;
    }
    .spec-pill.fabric-pill {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .care-box {
      font-size: 11.5px;
      color: #334155;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      border-radius: 3px;
      margin-top: 4px;
      width: 100%;
      box-sizing: border-box;
    }
    .care-box .care-lbl {
      font-weight: 600;
      color: #1e293b;
    }
    .care-box .care-val {
      color: #334155;
    }
    .td-amt {
      text-align: right;
      font-weight: 600;
      font-size: 14px;
      color: #0f172a;
    }

    /* 4. Notes & Financial Summary (2 Column Grid) */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .notes-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-size: 11px;
      color: #334155;
    }
    .notes-card .notes-title {
      display: block;
      color: #0f172a;
      margin-bottom: 3px;
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    .notes-card ul {
      margin: 0;
      padding-left: 15px;
      line-height: 1.4;
    }
    .notes-card li {
      margin-bottom: 2px;
    }

    /* Totals Card */
    .totals-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      padding: 7px 11px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 3.5px;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #475569;
      font-size: 11.5px;
    }
    .total-line .lbl {
      color: #475569;
      font-weight: 500;
      font-size: 11.5px;
    }
    .total-line .val {
      color: #0f172a;
      font-size: 12px;
      font-weight: 600;
    }
    .total-line.grand {
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
      margin-top: 1px;
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
    .total-line.grand .val {
      font-size: 15px;
      color: #0f172a;
      font-weight: 600;
    }

    /* 5. 100% Full Width Thank You & Google Review Box (Centered, 3 Lines) */
    .review-card-full {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 9px 14px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 4px;
      margin-bottom: 6px;
      width: 100%;
      box-sizing: border-box;
    }
    .review-thank-you {
      font-weight: 600;
      color: #0f172a;
      font-size: 13.5px;
      text-align: center;
    }
    .review-prompt-line {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-size: 12.5px;
      font-weight: 500;
      color: #475569;
      text-align: center;
    }
    .review-prompt-line svg {
      flex-shrink: 0;
    }
    .review-link-line {
      text-align: center;
      margin-top: 1px;
    }
    .review-link {
      font-size: 12.5px;
      color: #1d4ed8;
      font-weight: 600;
      text-decoration: underline;
      word-break: break-all;
      display: inline-block;
    }

    /* 6. Signature row below 100% thank you box (margin-top: 60px) */
    .signature-row {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      margin-top: 30px;
      margin-bottom: 6px;
      width: 100%;
    }
    .sig-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 140px;
    }
    .sig-img {
      height: 38px;
      width: auto;
      max-width: 140px;
      object-fit: contain;
      display: block;
      margin: 0 auto 2px auto;
      transform: none;
    }
    .sig-title {
      font-size: 10.5px;
      color: #334155;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    /* 7. Studio Address (Total Bottom Full Width, Centered) */
    .footer-address-bar {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #334155;
      line-height: 1.4;
      text-align: center;
      width: 100%;
    }
    .footer-address-bar svg {
      flex-shrink: 0;
    }
    .footer-address-bar .addr-lbl {
      font-weight: 600;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-main-body">
      <!-- 1. Top Centered Logo -->
      <div class="top-logo-row">
        ${logoBase64 ? `<img src="${logoBase64}" alt="Aparna Saree Pre-Pleating" class="brand-logo-img" />` : `<h2 style="font-size: 18px; font-weight: 600; letter-spacing: 1px; color: #0f172a;">APARNA SAREE PRE-PLEATING</h2>`}
      </div>

      <div class="divider-line"></div>

      <!-- 2. Meta Dossier Grid -->
      <div class="dossier-grid">
        <!-- Left: Invoice Details Meta Table -->
        <div class="dossier-card">
          <div class="dossier-card-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill="none"/><path d="M16 8H8" fill="none"/><path d="M16 12H8" fill="none"/><path d="M13 16H8" fill="none"/></svg>
            <span>INVOICE DETAILS</span>
          </div>
          <div class="dossier-card-body">
            <div class="meta-line">
              <span class="lbl">Invoice No:</span>
              <span class="val highlight-inv">${data.invoiceNumber}</span>
            </div>
            <div class="meta-line">
              <span class="lbl">Order ID:</span>
              <span class="val">${data.orderId}</span>
            </div>
            <div class="meta-line">
              <span class="lbl">Invoice Date:</span>
              <span class="val">${data.bookingDate}</span>
            </div>
            <div class="meta-line">
              <span class="lbl">Delivery Date:</span>
              <span class="val delivery">${data.deliveryDate}</span>
            </div>
            ${
              data.occasion
                ? `
            <div class="meta-line">
              <span class="lbl">Occasion:</span>
              <span class="val">${data.occasion}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <!-- Right: Client Details Card -->
        <div class="dossier-card">
          <div class="dossier-card-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><circle cx="12" cy="7" r="4" fill="none"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none"></path></svg>
            <span>BILLED TO (CLIENT DETAILS)</span>
          </div>
          <div class="dossier-card-body">
            <div class="client-name">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path></svg>
              <span>${data.client?.name || "Client"}</span>
            </div>
            <div class="client-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              <span>${data.client?.mobile || "—"}</span>
            </div>
            <div class="client-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              <span>${data.client?.email || "—"}</span>
            </div>
            <div class="client-row addr-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: top; margin-top: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${data.client?.address || "—"}</span>
            </div>
            <div class="payment-spec-line">
              <span class="pay-mode-lbl">Mode: ${data.paymentMethod || "UPI"}</span>
              ${data.paymentStatus === "paid" ? `<span class="pay-status-pill">PAID IN FULL</span>` : ""}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Ordered Services Table -->
      <div class="services-title">ORDERED SAREE SERVICES & TAILORING SPECIFICATIONS (${data.services?.length || 0})</div>
      <table class="services-table">
        <thead>
          <tr>
            <th>Service Description, Fabric & Tailoring Specifications</th>
            <th class="th-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${servicesRows}
        </tbody>
      </table>

      <!-- 4. Notes & Financial Summary (2 Column Grid) -->
      <div class="bottom-grid">
        <!-- Left Column: Special Notes -->
        <div class="notes-card">
          <span class="notes-title">SPECIAL NOTE:</span>
          <ul>
            <li>Please use the pre-pleated saree within 2 months.</li>
            <li>After using the pre-pleated saree, please iron it before storing.</li>
            <li>Do not put weight on pre-pleated sarees, especially fluffy pleats.</li>
          </ul>
        </div>

        <!-- Right Column: Totals Card -->
        <div class="totals-card">
          <div class="total-line">
            <span class="lbl">Services Subtotal:</span>
            <span class="val">₹${Number(data.financials?.subtotal || 0).toLocaleString("en-IN")}</span>
          </div>
          <div class="total-line">
            <span class="lbl">Pickup & Delivery Charges:</span>
            <span class="val">₹${Number(data.financials?.pickupDeliveryCharges || 0).toLocaleString("en-IN")}</span>
          </div>
          ${
            data.financials?.discount > 0
              ? `
            <div class="total-line" style="color: #15803d;">
              <span class="lbl">Special Discount:</span>
              <span class="val">-₹${Number(data.financials?.discount).toLocaleString("en-IN")}</span>
            </div>
          `
              : ""
          }
          <div class="total-line grand">
            <span class="lbl">Total Amount:</span>
            <span class="val">₹${Number(data.financials?.totalAmount || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <!-- 5. 100% Full Width Thank You & Google Review Box (3 Lines) -->
      <div class="review-card-full">
        <div class="review-thank-you">Thank you for choosing Aparna Saree Pre-Pleating! ✨</div>
        <div class="review-prompt-line">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>Please review if you like our service:</span>
        </div>
        <div class="review-link-line">
          <a href="https://g.page/r/CfQ3Ljt5NC91EBM/review" class="review-link" target="_blank" rel="noopener noreferrer">https://g.page/r/CfQ3Ljt5NC91EBM/review</a>
        </div>
      </div>

      <!-- 6. Authorized Signature Row below 100% Thank you card (margin-top: 60px) -->
      <div class="signature-row">
        <div class="sig-box">
          ${signatureBase64 ? `<img src="${signatureBase64}" alt="Authorized Signature" class="sig-img" />` : ""}
          <div class="sig-title">Authorized Signatory</div>
        </div>
      </div>
    </div>

    <!-- 7. Address (Total Bottom Full Width, Centered) -->
    <div class="footer-address-bar">
      <span class="addr-lbl">Address:</span>
      <span>H.No. 4715, 1st Floor, Road No. 17, New MIG, BHEL, Hyderabad - 502032</span>
    </div>
  </div>
</body>
</html>`;
}

export async function generatePdf(
  outputPath = path.join(projectRoot, "sample-invoice.pdf"),
  data = SAMPLE_INVOICE,
) {
  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch (err) {
    console.error(
      "Puppeteer is not installed. Please run: npm install puppeteer --save-dev",
    );
    throw err;
  }

  const html = buildInvoiceHtml(data);
  const browser = await puppeteer.default.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "4mm",
        right: "6mm",
        bottom: "4mm",
        left: "6mm",
      },
    });
    console.log(`[Puppeteer] PDF successfully generated at: ${outputPath}`);
    return outputPath;
  } finally {
    await browser.close();
  }
}

// Direct CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetPath = path.join(projectRoot, "sample-invoice.pdf");
  generatePdf(targetPath)
    .then(async () => {
      console.log("Sample Invoice PDF generated successfully!");
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.default.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 800,
        height: 1120,
        deviceScaleFactor: 2,
      });
      await page.setContent(buildInvoiceHtml(SAMPLE_INVOICE), {
        waitUntil: "networkidle0",
      });
      const imgPath =
        "C:/Users/venka/.gemini/antigravity/brain/d2be3efd-3380-48df-8be4-6e568ff94b6e/invoice-preview.png";
      const elem = await page.$(".invoice-container");
      if (elem) {
        await elem.screenshot({ path: imgPath });
      } else {
        await page.screenshot({ path: imgPath, fullPage: true });
      }
      await browser.close();
      console.log("Screenshot preview saved to:", imgPath);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error generating PDF:", err);
      process.exit(1);
    });
}
