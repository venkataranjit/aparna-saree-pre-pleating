import React from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { AppModal, AppButton } from "../../../components/common";
import { formatDateSafe } from "../../../firebase/dbService";
import logoLight from "../../../assets/logo-light.png";
import signatureImg from "../../../assets/signature.png";
import "./CustomInvoiceModal.scss";

// Convert any Firestore order record into the standard Tax Invoice dataset
export const mapOrderToInvoiceData = (order) => {
  if (!order) return null;

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

  const subtotal =
    order.subtotal !== undefined
      ? Number(order.subtotal)
      : services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const pickupDeliveryCharges = Number(order.pickupDeliveryCharges || 0);
  const discount = Number(order.discount || 0);
  const totalAmount =
    order.totalAmount !== undefined
      ? Number(order.totalAmount)
      : Math.max(0, subtotal + pickupDeliveryCharges - discount);

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

  return {
    invoiceNumber: invNumber,
    orderId: orderId,
    bookingDate: bookingDateStr,
    deliveryDate: deliveryDateStr,
    occasion: order.occasion || "",
    paymentStatus: order.paymentStatus || "paid",
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
      discount,
      totalAmount,
    },
  };
};

// 3-Service Sample Order Dataset
export const SAMPLE_INVOICE_DATA = {
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
        noOfChestPleats: "5",
        hip: '38"',
        height: "5' 5\"",
        dressSize: "M",
        notes: "Maintain extra crisp front box pleats for heavy bridal pallu.",
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
        noOfChestPleats: "4",
        hip: '38"',
        height: "5' 5\"",
        notes: "Hand-pleat delicately to preserve natural organza sheen.",
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

/**
 * Generates an HTML string snippet for PDF export
 */
export const buildInvoiceHtmlSnippet = (data = SAMPLE_INVOICE_DATA) => {
  const servicesRowsHtml = (data.services || [])
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
          <td class="td-amt">₹${Number(s.price || 0).toLocaleString("en-IN")}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="invoice-pdf-wrapper" style="width: 100%; max-width: 780px; height: 100%; min-height: 1120px; margin: 0 auto; background: #ffffff; color: #0f172a; padding: 10px 14px 4px 14px; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; box-sizing: border-box; font-size: 12.5px; line-height: 1.45; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div style="flex: 1; display: flex; flex-direction: column;">
        <!-- 1. Centered Brand Logo (Increased Size) -->
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 6px; text-align: center;">
          <img src="${logoLight}" alt="Aparna Saree Pre-Pleating" style="width: 58%; max-width: 360px; height: auto; object-fit: contain; display: block; margin: 0 auto;" />
        </div>

        <div style="height: 1.5px; background: #cbd5e1; margin: 5px 0 8px 0; border-radius: 9999px;"></div>

        <!-- 2. Meta Dossier Grid (Left: Tax Invoice, Right: Client Details) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          
          <!-- Left: Tax Invoice Meta Card -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill="none"/><path d="M16 8H8" fill="none"/><path d="M16 12H8" fill="none"/><path d="M13 16H8" fill="none"/></svg>
              <span>TAX INVOICE</span>
            </div>
            <div style="padding: 7px 10px; display: flex; flex-direction: column; gap: 3.5px; flex: 1; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Invoice No:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.invoiceNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Order ID:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.orderId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Invoice Date:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.bookingDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Delivery Date:</span>
                <span style="color: #047857; font-weight: 600; font-size: 12.5px;">${data.deliveryDate}</span>
              </div>
              ${
                data.occasion
                  ? `
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Occasion:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.occasion}</span>
              </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Right: Client Details Card -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><circle cx="12" cy="7" r="4" fill="none"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none"></path></svg>
              <span>BILLED TO (CLIENT DETAILS)</span>
            </div>
            <div style="padding: 7px 10px; display: flex; flex-direction: column; gap: 3.5px; flex: 1; font-size: 12px;">
              <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><circle cx="12" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path></svg>
                <span>${data.client?.name || "Client"}</span>
              </div>
              <div style="color: #475569; font-size: 12px; line-height: 1.35; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                <span>${data.client?.mobile || "—"}</span>
              </div>
              <div style="color: #475569; font-size: 12px; line-height: 1.35; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                <span>${data.client?.email || "—"}</span>
              </div>
              <div style="color: #475569; font-size: 12px; line-height: 1.35; display: flex; align-items: flex-start; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: top; margin-top: 2px; flex-shrink: 0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${data.client?.address || "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                <span style="font-size: 11.5px; color: #475569; font-weight: 500;">Mode: ${data.paymentMethod || "UPI"}</span>
                ${
                  data.paymentStatus === "paid"
                    ? `
                  <span style="font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 3px; text-transform: uppercase; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;">
                    PAID IN FULL
                  </span>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Ordered Services Table -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; font-weight: 600; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1.5px solid #0f172a;">
            ORDERED SAREE SERVICES & TAILORING SPECIFICATIONS (${data.services?.length || 0})
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 6px 10px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; text-align: left;">
                  Service Description, Fabric & Tailoring Specifications
                </th>
                <th style="padding: 6px 10px; font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; width: 120px; text-align: right;">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              ${servicesRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- 4. Notes & Financial Summary (2 Column Grid) -->
        <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 8px; margin-bottom: 8px;">
          
          <!-- Left: Special Notes Card -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 7px 10px; border-radius: 5px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 11.5px; font-weight: 600; color: #0f172a; letter-spacing: 0.4px; margin-bottom: 3px;">
              SPECIAL NOTE:
            </div>
            <ul style="margin: 0; padding-left: 15px; font-size: 11px; color: #334155; line-height: 1.4;">
              <li>Please use the pre-pleated saree within 2 months.</li>
              <li>After using the pre-pleated saree, please iron it before storing.</li>
              <li>Do not put weight on pre-pleated sarees, especially fluffy pleats.</li>
            </ul>
          </div>

          <!-- Right: Totals Card -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 7px 11px; display: flex; flex-direction: column; gap: 3.5px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #475569; font-weight: 500; font-size: 11.5px;">Services Subtotal:</span>
              <span style="color: #0f172a; font-weight: 600; font-size: 12px;">₹${Number(data.financials?.subtotal || 0).toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #475569; font-weight: 500; font-size: 11.5px;">Pickup & Delivery Charges:</span>
              <span style="color: #0f172a; font-weight: 600; font-size: 12px;">₹${Number(data.financials?.pickupDeliveryCharges || 0).toLocaleString("en-IN")}</span>
            </div>
            ${
              Number(data.financials?.discount || 0) > 0
                ? `
              <div style="display: flex; justify-content: space-between; align-items: center; color: #15803d;">
                <span style="font-weight: 500; font-size: 11.5px;">Special Discount:</span>
                <span style="font-weight: 600; font-size: 12px;">-₹${Number(data.financials?.discount).toLocaleString("en-IN")}</span>
              </div>
            `
                : ""
            }
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1.5px solid #0f172a; margin-top: 1px;">
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">Total Amount:</span>
              <span style="font-weight: 600; color: #0f172a; font-size: 15px;">₹${Number(data.financials?.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <!-- 5. 100% Full Width Thank You & Google Review Box (Centered, 3 Lines) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 9px 14px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px; margin-bottom: 6px; width: 100%; box-sizing: border-box;">
          <div style="font-size: 13.5px; font-weight: 600; color: #0f172a; text-align: center;">
            Thank you for choosing Aparna Saree Pre-Pleating! ✨
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 12.5px; font-weight: 500; color: #475569; text-align: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>Please review if you like our service:</span>
          </div>
          <div style="text-align: center; margin-top: 1px;">
            <a href="https://g.page/r/CfQ3Ljt5NC9EBM/review" target="_blank" rel="noopener noreferrer" style="font-size: 12.5px; color: #1d4ed8; font-weight: 600; text-decoration: underline; word-break: break-all; display: inline-block;">
              https://g.page/r/CfQ3Ljt5NC9EBM/review
            </a>
          </div>
        </div>

        <!-- 6. Authorized Signature Row (margin-top: 60px) -->
        <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 30px; margin-bottom: 6px;">
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 140px;">
            <img src="${signatureImg}" alt="Authorized Signature" style="height: 38px; width: auto; max-width: 140px; object-fit: contain; display: block; margin: 0 auto 2px auto;" />
            <div style="font-size: 10.5px; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Address (Total Bottom Across Full Width, Centered) -->
      <div style="margin-top: auto; padding-top: 6px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 11px; color: #334155; line-height: 1.4; width: 100%;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 5px;">
          <span style="font-weight: 600; color: #0f172a;">Address:</span>
          <span>H.No. 4715, 1st Floor, Road No. 17, New MIG, BHEL, Hyderabad - 502032</span>
        </div>
      </div>
    </div>
  `;
};

/**
 * Direct PDF Download using html2pdf.js
 * Renders the off-screen invoice container and triggers instant browser file download (Zero Print Dialog / Zero Modal).
 */
export const downloadInvoicePdfDirectly = async (order) => {
  if (!order) {
    toast.error("No order selected for invoice download.");
    return;
  }

  const data = mapOrderToInvoiceData(order);
  if (!data) {
    toast.error("Unable to format invoice data.");
    return;
  }

  const orderId = data.orderId || "Order";
  const toastId = toast.info(`Preparing invoice for ${orderId}...`, {
    autoClose: false,
  });

  // Create temporary container placed at standard origin behind viewport
  const container = document.createElement("div");
  container.id = "direct-pdf-export-container";
  container.style.position = "fixed";
  container.style.left = "0px";
  container.style.top = "0px";
  container.style.width = "780px";
  container.style.height = "1138px";
  container.style.minHeight = "1138px";
  container.style.background = "#ffffff";
  container.style.zIndex = "-9999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.boxSizing = "border-box";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.justifyContent = "space-between";

  // Inject styles specific to the table rows and spec tags
  const inlineStyles = document.createElement("style");
  inlineStyles.innerHTML = `
    #direct-pdf-export-container .service-row td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: top;
    }
    #direct-pdf-export-container .service-row:nth-child(even) td {
      background: #f8fafc;
    }
    #direct-pdf-export-container .service-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    #direct-pdf-export-container .specs-wrap {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      gap: 4px;
      margin-bottom: 4px;
    }
    #direct-pdf-export-container .spec-pill {
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
    #direct-pdf-export-container .spec-pill .lbl {
      color: #64748b;
      font-weight: 500;
    }
    #direct-pdf-export-container .spec-pill .val {
      color: #0f172a;
      font-weight: 600;
    }
    #direct-pdf-export-container .spec-pill.fabric-pill {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    #direct-pdf-export-container .care-box {
      font-size: 11.5px;
      color: #334155;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      border-radius: 3px;
      margin-top: 4px;
      box-sizing: border-box;
      width: 100%;
    }
    #direct-pdf-export-container .care-box .care-lbl {
      font-weight: 600;
      color: #1e293b;
    }
    #direct-pdf-export-container .care-box .care-val {
      color: #334155;
    }
    #direct-pdf-export-container .td-amt {
      text-align: right;
      font-weight: 600;
      font-size: 14px;
      color: #0f172a;
    }
  `;
  container.appendChild(inlineStyles);

  const contentWrap = document.createElement("div");
  contentWrap.style.width = "100%";
  contentWrap.style.height = "100%";
  contentWrap.style.display = "flex";
  contentWrap.style.flexDirection = "column";
  contentWrap.style.justifyContent = "space-between";
  contentWrap.innerHTML = buildInvoiceHtmlSnippet(data);
  container.appendChild(contentWrap);

  document.body.appendChild(container);

  try {
    // Wait for all images inside container to be fully loaded
    const images = Array.from(container.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          }),
      ),
    );

    // Brief pause for browser reflow
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: 780,
      windowHeight: 1138,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const marginX = 6;
    const marginY = 4;
    const contentWidth = pdfWidth - marginX * 2;
    const contentHeight = pdfHeight - marginY * 2;

    pdf.addImage(
      imgData,
      "JPEG",
      marginX,
      marginY,
      contentWidth,
      contentHeight,
    );

    // Make review link clickable in generated PDF
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

    pdf.save(`Tax-Invoice-${orderId}.pdf`);

    toast.dismiss(toastId);
    toast.success(`Downloaded Tax-Invoice-${orderId}.pdf`);
  } catch (err) {
    console.error("Direct PDF export failed:", err);
    toast.dismiss(toastId);
    toast.error("Failed to generate PDF download. Please try again.");
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Backward-compatible alias for any legacy callers
 */
export const printOrderInvoiceDirectly = downloadInvoicePdfDirectly;

export const CustomInvoiceModal = ({
  open,
  onClose,
  invoiceData = SAMPLE_INVOICE_DATA,
}) => {
  if (!open) return null;

  const data = invoiceData || SAMPLE_INVOICE_DATA;

  const handleDownload = () => {
    downloadInvoicePdfDirectly(data);
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        <div className="custom-invoice-modal-title">
          <span>Tax Invoice</span>
          <span className="invoice-badge-tag">{data.orderId || "INVOICE"}</span>
        </div>
      }
      subtitle="Pixel-perfect printable tax invoice & saree pre-pleating specifications"
      maxWidth="lg"
      className="custom-invoice-app-modal"
      bodyClassName="custom-invoice-modal-body"
      actions={
        <div className="custom-invoice-actions-bar">
          <div className="invoice-status-indicator">
            <span className="dot" />
            <span>Ready for Direct PDF Download</span>
          </div>
          <div className="actions-right">
            <AppButton
              variant="primary"
              startIcon={<DownloadOutlinedIcon />}
              onClick={handleDownload}
              className="print-invoice-btn"
            >
              Download PDF
            </AppButton>
            <AppButton
              variant="ghost"
              onClick={onClose}
              className="close-invoice-btn"
            >
              Close
            </AppButton>
          </div>
        </div>
      }
    >
      {/* Printable / Viewable A4 Sheet Document */}
      <div
        className="custom-invoice-document"
        id="custom-invoice-printable-sheet"
      >
        {/* 1. Centered Brand Logo */}
        <div className="invoice-top-logo-row">
          <img
            src={logoLight}
            alt="Aparna Saree Pre-Pleating"
            className="top-centered-logo"
          />
        </div>

        <div className="invoice-divider-line" />

        {/* 2. Tax Invoice Meta (LEFT) & Billed To Client Details (RIGHT) */}
        <div className="invoice-meta-dossier-grid">
          {/* LEFT: Tax Invoice Details */}
          <div className="meta-col tax-invoice-col">
            <div className="col-head">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  flexShrink: 0,
                }}
              >
                <path
                  d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"
                  fill="none"
                />
                <path d="M16 8H8" fill="none" />
                <path d="M16 12H8" fill="none" />
                <path d="M13 16H8" fill="none" />
              </svg>
              <span>TAX INVOICE</span>
            </div>
            <div className="col-body">
              <div className="meta-line">
                <span className="meta-label">Invoice No:</span>
                <span className="meta-val inv-num-highlight">
                  {data.invoiceNumber}
                </span>
              </div>
              <div className="meta-line">
                <span className="meta-label">Order ID:</span>
                <span className="meta-val">{data.orderId}</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">Invoice Date:</span>
                <span className="meta-val">{data.bookingDate}</span>
              </div>
              <div className="meta-line">
                <span className="meta-label">Delivery Date:</span>
                <span className="meta-val delivery-val">
                  {data.deliveryDate}
                </span>
              </div>
              {data.occasion && (
                <div className="meta-line">
                  <span className="meta-label">Occasion:</span>
                  <span className="meta-val">{data.occasion}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Billed To Client Information & Payment Method */}
          <div className="meta-col client-col">
            <div className="col-head">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  flexShrink: 0,
                }}
              >
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              </svg>
              <span>BILLED TO (CLIENT DETAILS)</span>
            </div>
            <div className="col-body">
              <div
                className="client-name-bold"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    flexShrink: 0,
                  }}
                >
                  <circle cx="12" cy="7" r="4"></circle>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                </svg>
                <span>{data.client?.name}</span>
              </div>
              <div
                className="client-contact-line"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    flexShrink: 0,
                  }}
                >
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                <span>{data.client?.mobile}</span>
              </div>
              <div
                className="client-contact-line"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    display: "inline-block",
                    verticalAlign: "middle",
                    flexShrink: 0,
                  }}
                >
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <span>{data.client?.email}</span>
              </div>
              <div
                className="client-contact-line"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    display: "inline-block",
                    verticalAlign: "top",
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{data.client?.address}</span>
              </div>
              <div className="payment-spec-row">
                <span className="pay-method-badge">
                  Mode: {data.paymentMethod}
                </span>
                {data.paymentStatus === "paid" && (
                  <span className="pay-status-pill pay-paid">PAID IN FULL</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Ordered Services Table with Detailed Measurement Profiles */}
        <div className="invoice-services-section">
          <div className="section-title-bar">
            <span>
              ORDERED SAREE SERVICES & SPECIFICATIONS ({data.services?.length})
            </span>
          </div>

          <table className="invoice-services-table">
            <thead>
              <tr>
                <th className="th-desc">
                  Service Description, Fabric & Tailoring Specifications
                </th>
                <th className="th-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.services?.map((service, idx) => {
                const m = service.measurementProfile;
                const careText = service.specialCare || m?.notes || "";
                return (
                  <tr key={service.id || idx} className="service-row">
                    <td className="td-desc">
                      <div className="service-item-title">
                        {service.serviceName}
                      </div>

                      {/* Measurement & Fabric Specifications */}
                      <div className="service-specs-pills">
                        {service.fabric && (
                          <div className="spec-tag fabric-tag">
                            <span className="lbl">Fabric:</span>
                            <span className="val">{service.fabric}</span>
                          </div>
                        )}
                        {m?.title && (
                          <div className="spec-tag">
                            <span className="lbl">Profile:</span>
                            <span className="val">{m.title}</span>
                          </div>
                        )}
                        {m?.pallu && (
                          <div className="spec-tag">
                            <span className="lbl">Pallu:</span>
                            <span className="val">{m.pallu}</span>
                          </div>
                        )}
                        {m?.firstPleatSize && (
                          <div className="spec-tag">
                            <span className="lbl">First Pleat:</span>
                            <span className="val">{m.firstPleatSize}</span>
                          </div>
                        )}
                        {m?.shoulderToRightTight && (
                          <div className="spec-tag">
                            <span className="lbl">Shoulder-Tight:</span>
                            <span className="val">
                              {m.shoulderToRightTight}
                            </span>
                          </div>
                        )}
                        {m?.shoulderToTight && (
                          <div className="spec-tag">
                            <span className="lbl">Shoulder-Tight:</span>
                            <span className="val">{m.shoulderToTight}</span>
                          </div>
                        )}
                        {m?.chest && (
                          <div className="spec-tag">
                            <span className="lbl">Chest:</span>
                            <span className="val">{m.chest}</span>
                          </div>
                        )}
                        {m?.noOfChestPleats && (
                          <div className="spec-tag">
                            <span className="lbl">Chest Pleats:</span>
                            <span className="val">{m.noOfChestPleats}</span>
                          </div>
                        )}
                        {m?.hip && (
                          <div className="spec-tag">
                            <span className="lbl">Hip:</span>
                            <span className="val">{m.hip}</span>
                          </div>
                        )}
                        {m?.height && (
                          <div className="spec-tag">
                            <span className="lbl">Height:</span>
                            <span className="val">{m.height}</span>
                          </div>
                        )}
                        {m?.dressSize && (
                          <div className="spec-tag">
                            <span className="lbl">Dress Size:</span>
                            <span className="val">{m.dressSize}</span>
                          </div>
                        )}
                        {m?.notes && (
                          <div className="spec-tag">
                            <span className="lbl">Care Note:</span>
                            <span className="val">{m.notes}</span>
                          </div>
                        )}
                      </div>

                      {careText && (
                        <div className="service-care-callout">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              display: "inline-block",
                              verticalAlign: "middle",
                              flexShrink: 0,
                            }}
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                          <span className="care-label">
                            Special Care / Note:
                          </span>
                          <span className="care-text">{careText}</span>
                        </div>
                      )}
                    </td>
                    <td className="td-amount">
                      ₹{Number(service.price).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Notes & Financial Summary (2 Column Grid) */}
        <div className="invoice-bottom-grid">
          {/* Left: Special Notes Card */}
          <div className="notes-box">
            <div className="notes-box-title">SPECIAL NOTE:</div>
            <ul className="special-notes-list">
              <li>Please use the pre-pleated saree within 2 months.</li>
              <li>
                After using the pre-pleated saree, please iron it before
                storing.
              </li>
              <li>
                Do not put weight on pre-pleated sarees, especially fluffy
                pleats.
              </li>
            </ul>
          </div>

          {/* Right: Totals Card */}
          <div className="invoice-totals-block">
            <div className="total-row">
              <span className="total-label">Services Subtotal:</span>
              <span className="total-val">
                ₹
                {Number(data.financials?.subtotal || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="total-row delivery-charges-row">
              <span className="total-label">Pickup & Delivery Charges:</span>
              <span className="total-val">
                ₹
                {Number(
                  data.financials?.pickupDeliveryCharges || 0,
                ).toLocaleString("en-IN")}
              </span>
            </div>
            {data.financials?.discount > 0 && (
              <div className="total-row discount-row">
                <span className="total-label">Special Discount:</span>
                <span className="total-val">
                  -₹{Number(data.financials?.discount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="total-row total-highlight-row">
              <span className="total-label">Total Amount:</span>
              <span className="total-val">
                ₹
                {Number(data.financials?.totalAmount || 0).toLocaleString(
                  "en-IN",
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 5. 100% Full Width Thank You & Google Review Box (3 Lines) */}
        <div className="google-review-box-full">
          <div className="review-thank-you">
            Thank you for choosing Aparna Saree Pre-Pleating! ✨
          </div>
          <div className="review-prompt-line">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                flexShrink: 0,
              }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Please review if you like our service:</span>
          </div>
          <div className="review-link-line">
            <a
              href="https://g.page/r/CfQ3Ljt5NC9EBM/review"
              target="_blank"
              rel="noopener noreferrer"
              className="review-link"
            >
              https://g.page/r/CfQ3Ljt5NC9EBM/review
            </a>
          </div>
        </div>

        {/* 6. Authorized Signature Row (margin-top: 60px) */}
        <div className="invoice-signature-row">
          <div className="auth-signature-wrap">
            <img
              src={signatureImg}
              alt="Authorized Signature"
              className="signature-img"
            />
            <span className="signature-text">Authorized Signatory</span>
          </div>
        </div>

        {/* 7. Studio Address (Total Bottom Full Width, Centered) */}
        <div className="invoice-bottom-address-bar">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: "inline-block",
              verticalAlign: "middle",
              flexShrink: 0,
            }}
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span className="footer-addr-label">Studio Address:</span>
          <span className="footer-addr-val">
            H.No. 4715, 1st Floor, Road No. 17, New MIG, BHEL, Hyderabad -
            502032
          </span>
        </div>
      </div>
    </AppModal>
  );
};

export default CustomInvoiceModal;
