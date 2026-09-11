import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { formatDateSafe } from "../../../firebase/dbService";
import logoLight from "../../../assets/logo-light.png";
import signatureImg from "../../../assets/signature.png";
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
 * Generates an HTML string snippet for PDF export
 */
export const buildInvoiceHtmlSnippet = (data = {}) => {
  const orderStatusMeta = getOrderStatusMeta(data.orderStatus);
  const paymentStatusMeta = getPaymentStatusMeta(data.paymentStatus);

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
        <!-- 1. Centered Brand Logo -->
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 6px; text-align: center;">
          <img src="${logoLight}" alt="Aparna Saree Pre-Pleating" style="width: 58%; max-width: 360px; height: auto; object-fit: contain; display: block; margin: 0 auto;" />
        </div>

        <div style="height: 1.5px; background: #cbd5e1; margin: 5px 0 8px 0; border-radius: 9999px;"></div>

        <!-- 2. Meta Dossier Grid (Left: Order Details, Right: Client Details) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          
          <!-- Left: Order Details Meta Card -->
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="background: #0f172a; color: #ffffff; padding: 5px 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" fill="none"/><path d="M16 8H8" fill="none"/><path d="M16 12H8" fill="none"/><path d="M13 16H8" fill="none"/></svg>
              <span>ORDER DETAILS</span>
            </div>
            <div style="padding: 7px 10px; display: flex; flex-direction: column; gap: 3.5px; flex: 1; font-size: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Order No:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.invoiceNumber || data.orderId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Order ID:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.orderId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Order Date:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.bookingDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Delivery Date:</span>
                <span style="color: #047857; font-weight: 600; font-size: 12.5px;">${data.deliveryDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Occasion:</span>
                <span style="color: #0f172a; font-weight: 600; font-size: 12.5px;">${data.occasion}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 2px; border-top: 1px dashed #cbd5e1;">
                <span style="color: #64748b; font-weight: 500; font-size: 12px;">Order Status:</span>
                <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 3px; text-transform: uppercase; ${orderStatusMeta.style}">
                  ${orderStatusMeta.label}
                </span>
              </div>
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
                <span style="font-size: 11.5px; color: #475569; font-weight: 500;">Payment Mode: ${data.paymentMethod || "UPI"}</span>
                <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 3px; text-transform: uppercase; ${paymentStatusMeta.style}">
                  ${paymentStatusMeta.label}
                </span>
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #475569; font-weight: 500; font-size: 11.5px;">Other Charges:</span>
              <span style="color: #0f172a; font-weight: 600; font-size: 12px;">₹${Number(data.financials?.otherCharges || 0).toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; color: ${Number(data.financials?.discount || 0) > 0 ? "#15803d" : "#475569"};">
              <span style="font-weight: 500; font-size: 11.5px;">Discount:</span>
              <span style="font-weight: 600; font-size: 12px;">${Number(data.financials?.discount || 0) > 0 ? "-₹" + Number(data.financials?.discount).toLocaleString("en-IN") : "₹0"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 4px; border-top: 1.5px solid #0f172a; margin-top: 1px;">
              <span style="font-weight: 700; color: #0f172a; font-size: 13px;">TOTAL BILLED AMOUNT:</span>
              <span style="font-weight: 700; color: #0f172a; font-size: 15px;">₹${Number(data.financials?.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; color: #15803d; padding-top: 2px;">
              <span style="font-weight: 500; font-size: 11.5px;">Paid Amount:</span>
              <span style="font-weight: 600; font-size: 12px;">₹${Number(data.financials?.advancePaid || 0).toLocaleString("en-IN")}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; color: ${String(data.paymentStatus || "").toLowerCase() === "paid" ? "#15803d" : "#b45309"}; padding-top: 2px;">
              <span style="font-weight: 700; font-size: 11.5px;">${String(data.paymentStatus || "").toLowerCase() === "paid" ? "Balance Paid:" : "Balance Due:"}</span>
              <span style="font-weight: 700; font-size: 12.5px;">₹${Number(
                String(data.paymentStatus || "").toLowerCase() === "paid"
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
                      ),
              ).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <!-- 5. 100% Full Width Thank You & Google Review Box (Centered) -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 9px 14px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px; margin-bottom: 6px; width: 100%; box-sizing: border-box;">
          <div style="font-size: 13.5px; font-weight: 600; color: #0f172a; text-align: center;">
            Thank you for choosing Aparna Saree Pre-Pleating! ✨
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 12.5px; font-weight: 500; color: #475569; text-align: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>Please review if you like our service:</span>
          </div>
          <div style="text-align: center; margin-top: 1px;">
            <a href="https://g.page/r/CfQ3Ljt5NC91EBM/review" target="_blank" rel="noopener noreferrer" style="font-size: 12.5px; color: #1d4ed8; font-weight: 600; text-decoration: underline; word-break: break-all; display: inline-block;">
              https://g.page/r/CfQ3Ljt5NC91EBM/review
            </a>
          </div>
        </div>

        <!-- 6. Authorized Signature Row -->
        <div style="display: flex; justify-content: flex-end; align-items: flex-end; margin-top: 30px; margin-bottom: 6px;">
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 140px;">
            <img src="${signatureImg}" alt="Authorized Signature" style="height: 38px; width: auto; max-width: 140px; object-fit: contain; display: block; margin: 0 auto 2px auto;" />
            <div style="font-size: 10.5px; font-weight: 600; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>

      <!-- 7. Address -->
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
 * Unified Core PDF Generator
 * Renders the off-screen A4 container dynamically and compiles it to high-res jsPDF instance.
 */
export const generateOrderInvoicePdf = async (order, { progressMessage = null } = {}) => {
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

  const inlineStyles = document.createElement("style");
  inlineStyles.innerHTML = `
    #order-pdf-export-container .service-row td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      vertical-align: top;
    }
    #order-pdf-export-container .service-row:nth-child(even) td {
      background: #f8fafc;
    }
    #order-pdf-export-container .service-name {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 4px;
    }
    #order-pdf-export-container .specs-wrap {
      display: flex;
      flex-wrap: wrap;
      width: 100%;
      gap: 4px;
      margin-bottom: 4px;
    }
    #order-pdf-export-container .spec-pill {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 3px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    #order-pdf-export-container .spec-pill .lbl {
      color: #64748b;
      font-weight: 500;
    }
    #order-pdf-export-container .spec-pill .val {
      color: #0f172a;
      font-weight: 600;
    }
    #order-pdf-export-container .spec-pill.fabric-pill {
      background: #fef3c7;
      color: #92400e;
      border-color: #fcd34d;
      font-weight: 600;
    }
    #order-pdf-export-container .care-box {
      font-size: 11px;
      background: #fffbeb;
      border-left: 2.5px solid #f59e0b;
      padding: 3.5px 7px;
      border-radius: 2px;
      margin-top: 3px;
      color: #78350f;
    }
  `;

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
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          }),
      ),
    );

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
      toast.success(`Order details PDF saved to your device for Order #${orderId}`);
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
    const { pdf, fileName, clientName, formattedPhone, whatsappMessage } = result;

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
        toast.success(`PDF attached! Select WhatsApp to send to ${clientName}.`);
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
          toast.success(`PDF attached! Select WhatsApp to send to ${clientName}.`);
        } catch (shareErr) {
          if (shareErr.name !== "AbortError") {
            pdf.save(fileName);
            const encoded = encodeURIComponent(whatsappMessage);
            const waUrl = formattedPhone
              ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`
              : `https://api.whatsapp.com/send?text=${encoded}`;
            window.open(waUrl, "_blank");
            toast.info(`PDF downloaded. Attach the downloaded PDF in WhatsApp chat.`);
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
