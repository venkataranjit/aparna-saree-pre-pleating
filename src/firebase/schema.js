import { serverTimestamp } from "firebase/firestore";

/**
 * Cloud Firestore Collection Names
 */
export const COLLECTIONS = {
  BUSINESSES: "businesses",
  USERS: "users",
  SERVICES: "services",
  CLIENTS: "clients",
  ORDERS: "orders",
  MEASUREMENTS: "measurements",
  EXPENSES: "expenses",
  COUNTERS: "counters",
};

/**
 * User Roles
 */
export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  STAFF: "staff",
  CLIENT: "client",
};

/**
 * Exclusive Super Admin Email
 * Only victoryranjit@gmail.com is hardcoded and authorized as SuperAdmin.
 */
export const SUPERADMIN_EMAIL = "victoryranjit@gmail.com";

/**
 * Payment & Order Statuses
 */
export const PAYMENT_STATUS = {
  PAID: "Paid",
  PENDING: "Pending",
  PARTIAL: "Partial",
  FAILED: "Failed",
};

export const ORDER_STATUS = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/**
 * Expense Categories & Payment Methods
 */
export const EXPENSE_CATEGORIES = {
  STORE_ITEMS: "Store Items",
  TRAVELLING: "Travelling",
  PAID_REVIEWS: "Paid Reviews",
  OTHERS: "Others",
};

export const EXPENSE_PAYMENT_METHODS = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
};



/**
 * Measurement Fields (Client-provided, no hardcoded defaults)
 * Includes: pallu, shoulderToRightTight, chest, hip, firstPleatSize, noOfChestPleats
 */
export const MEASUREMENT_FIELDS = [
  "pallu",
  "shoulderToRightTight",
  "chest",
  "hip",
  "firstPleatSize",
  "noOfChestPleats",
  "dressSize",
  "height",
];

/**
 * Factory Data Models with Type Safeguards & Timestamps
 */

/**
 * 1. Business Model
 * @param {Object} data
 * @param {string} data.ownerName
 * @param {string} data.ownerMobile
 * @param {string} data.businessAddress
 */
export const createBusinessModel = ({
  ownerName = "",
  ownerMobile = "",
  businessAddress = "",
} = {}) => ({
  ownerName: String(ownerName).trim(),
  ownerMobile: String(ownerMobile).trim(),
  businessAddress: String(businessAddress).trim(),
  createdAt: serverTimestamp(),
});

/**
 * 2. User Model
 * @param {Object} data
 * @param {string} data.username
 * @param {string} [data.nickName]
 * @param {string} data.userMobile
 * @param {string} data.userAddress
 * @param {('superadmin'|'admin'|'staff'|'client')} [data.role='client']
 * @param {string|null} [data.measurementId=null] - Reference to measurements collection
 */
export const createUserModel = ({
  username = "",
  nickName = "",
  notes = "",
  email = "",
  userMobile = "",
  userAddress = "",
  role = null,
  measurementId = null,
} = {}) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  let assignedRole = USER_ROLES.CLIENT;

  if (normalizedEmail === SUPERADMIN_EMAIL.toLowerCase()) {
    assignedRole = USER_ROLES.SUPERADMIN;
  } else if (
    role &&
    [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT].includes(role)
  ) {
    assignedRole = role;
  }

  return {
    username: String(username).trim(),
    nickName: String(nickName || "").trim(),
    notes: String(notes || "").trim(),
    email: normalizedEmail,
    userMobile: String(userMobile).trim(),
    userAddress: String(userAddress).trim(),
    role: assignedRole,
    measurementId: measurementId ? String(measurementId).trim() : null,
    createdAt: serverTimestamp(),
  };
};

/**
 * Service Types
 */
export const SERVICE_TYPES = [
  "Pleating Service",
  "Draping Service",
  "Other Service",
];

/**
 * 3. Service Model
 * @param {Object} data
 * @param {string} data.serviceName
 * @param {string} [data.serviceType='Pleating Service']
 * @param {number} data.servicePrice
 * @param {number} data.serviceDiscountedPrice
 * @param {string} [data.description]
 * @param {boolean} [data.active=true]
 * @param {number} [data.displayOrder=0]
 */
export const createServiceModel = ({
  serviceName = "",
  serviceType = "Pleating Service",
  servicePrice = 0,
  serviceDiscountedPrice = 0,
  description = "",
  active = true,
  displayOrder = 0,
} = {}) => ({
  serviceName: String(serviceName).trim(),
  serviceType: String(serviceType || "Pleating Service").trim(),
  servicePrice: Number(servicePrice) || 0,
  serviceDiscountedPrice: Number(serviceDiscountedPrice) || 0,
  description: String(description || "").trim(),
  active: Boolean(active),
  displayOrder: Number(displayOrder) || 0,
  createdAt: serverTimestamp(),
});

/**
 * 4. Client Model
 * @param {Object} data
 * @param {string} [data.clientName]
 * @param {string} [data.nickName]
 * @param {string} [data.notes]
 * @param {string} [data.clientMobile] (stored strictly as string)
 * @param {string} [data.clientAddress]
 * @param {string|null} [data.userId] - Optional mapped user document ID
 * @param {string|null} [data.measurementId] - Reference to measurements collection document
 */
export const createClientModel = ({
  clientName = "",
  nickName = "",
  notes = "",
  clientMobile = "",
  clientAddress = "",
  userId = null,
  measurementId = null,
} = {}) => {
  const resolvedName = String(clientName || "").trim();
  const resolvedNickName = String(nickName || "").trim();
  const resolvedNotes = String(notes || "").trim();
  const resolvedMobile = String(clientMobile || "").trim();
  const resolvedAddress = String(clientAddress || "").trim();

  return {
    clientName: resolvedName,
    nickName: resolvedNickName,
    notes: resolvedNotes,
    clientMobile: resolvedMobile, // Mobile must be stored as string
    clientAddress: resolvedAddress,
    userId: userId ? String(userId).trim() : null,
    measurementId: measurementId ? String(measurementId).trim() : null,
    createdAt: serverTimestamp(),
  };
};

/**
 * 5. Measurement Model (Mapped to Users collection)
 * Client must provide their exact details; no default values.
 *
 * @param {Object} data
 * @param {string} data.userId - Reference to User document ID in users collection
 * @param {number|string|null} [data.pallu] - Pallu length (inches/cm)
 * @param {number|string|null} [data.shoulderToRightTight] - Shoulder to right tight (inches/cm)
 * @param {number|string|null} [data.chest] - Chest size (inches/cm)
 * @param {number|string|null} [data.hip] - Hip size (inches/cm)
 * @param {number|string|null} [data.firstPleatSize] - First pleat size (inches/cm)
 * @param {number|string|null} [data.noOfChestPleats] - Number of chest pleats
 * @param {string} [data.notes] - Tailoring & draping preferences
 */
export const createMeasurementModel = ({
  userId = "",
  title = "Standard Measurement",
  pallu = null,
  shoulderToRightTight = null,
  chest = null,
  hip = null,
  firstPleatSize = null,
  noOfChestPleats = null,
  height = null,
  dressSize = "",
  notes = "",
  createdAt = null,
} = {}) => {
  const sanitizeMeasure = (val) => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return Number.isNaN(num) ? String(val).trim() : num;
  };

  return {
    userId: String(userId).trim(),
    title: String(title || "Standard Measurement").trim(),
    pallu: sanitizeMeasure(pallu),
    shoulderToRightTight: sanitizeMeasure(shoulderToRightTight),
    chest: sanitizeMeasure(chest),
    hip: sanitizeMeasure(hip),
    firstPleatSize: sanitizeMeasure(firstPleatSize),
    noOfChestPleats: sanitizeMeasure(noOfChestPleats),
    height: sanitizeMeasure(height),
    dressSize: String(dressSize || "").trim(),
    notes: String(notes || "").trim(),
    createdAt: createdAt || serverTimestamp(),
  };
};

/**
 * 6. Order Model
/**
 * Create an Order Data Model for Firestore
 * @param {Object} data
 */
export const createOrderModel = ({
  id = "",
  orderId = "",
  clientId = "",
  username = "",
  nickName = "",
  userMobile = "",
  email = "",
  userAddress = "",
  client = null,
  serviceType = "",
  items = [],
  subtotal = 0,
  pickupDeliveryCharges = 0,
  otherCharges = 0,
  advancePayment = 0,
  balanceDue = undefined,
  balancePaid = 0,
  discount = 0,
  totalAmount = 0,
  paidAmount = 0,
  paymentStatus = PAYMENT_STATUS.PENDING,
  paymentMethod = "UPI",
  orderStatus = ORDER_STATUS.PENDING,
  status = "",
  occasion = "",
  orderDate = null,
  deliveryDate = null,
  notes = "",
  createdBy = "",
  tempOrderId = null,
  isOfflinePending = false,
} = {}) => {
  const resolvedOrderId = String(orderId || id || "").trim();
  const cleanStatus = String(status || orderStatus || ORDER_STATUS.PENDING).toLowerCase();
  const clientObj = client || {
    clientId: String(clientId || "").trim(),
    username: String(username || "").trim(),
    nickName: String(nickName || "").trim(),
    userMobile: String(userMobile || "").trim(),
    email: String(email || "").trim(),
    userAddress: String(userAddress || "").trim(),
  };

  const cleanItems = (Array.isArray(items) ? items : []).map((it, idx) => ({
    itemId: it.itemId || `item_${idx + 1}_${Date.now()}`,
    serviceId: it.serviceId || "",
    serviceName: it.serviceName || "",
    serviceType: String(it.serviceType || serviceType || "Pleating Service").trim(),
    servicePrice: Number(it.servicePrice) || 0,
    serviceDiscountedPrice: Number(it.serviceDiscountedPrice) || 0,
    serviceDescription: it.serviceDescription || it.description || "",
    finalPrice: Number(it.finalPrice !== undefined ? it.finalPrice : it.serviceDiscountedPrice || it.servicePrice) || 0,
    sareeType: it.sareeType || "Kanjeevaram Silk",
    includeMeasurements: it.includeMeasurements !== false,
    measurementProfile: it.measurementProfile || null,
    itemNotes: it.itemNotes || "",
  }));

  const calculatedSubtotal = cleanItems.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);
  const resolvedSubtotal = subtotal > 0 ? Number(subtotal) : calculatedSubtotal;
  const resolvedDeliveryCharges = Number(pickupDeliveryCharges) || 0;
  const resolvedOtherCharges = Number(otherCharges) || 0;
  const resolvedDiscount = Number(discount) || 0;
  const calculatedTotal = Math.max(0, resolvedSubtotal + resolvedDeliveryCharges + resolvedOtherCharges - resolvedDiscount);
  const finalTotal = totalAmount > 0 ? Number(totalAmount) : calculatedTotal;
  const resolvedAdvance = Math.min(Number(advancePayment) || 0, finalTotal);
  const resolvedPaymentStatus = String(paymentStatus || PAYMENT_STATUS.PENDING);
  const rawPaid = Number(paidAmount) || (resolvedAdvance > 0 ? resolvedAdvance : (resolvedPaymentStatus === "paid" ? finalTotal : 0));
  const resolvedPaid = Math.min(rawPaid, finalTotal);
  const resolvedBalanceDue = balanceDue !== undefined && balanceDue !== null && !isNaN(Number(balanceDue))
    ? Number(balanceDue)
    : (resolvedPaymentStatus === "paid" ? 0 : Math.max(0, finalTotal - resolvedPaid));
  const resolvedBalancePaid = balancePaid !== undefined && balancePaid !== null && !isNaN(Number(balancePaid)) && Number(balancePaid) > 0
    ? Number(balancePaid)
    : (resolvedPaymentStatus === "paid" ? (resolvedAdvance > 0 ? Math.max(0, finalTotal - resolvedAdvance) : finalTotal) : 0);

  return {
    id: resolvedOrderId || undefined,
    orderId: resolvedOrderId || undefined,
    tempOrderId: tempOrderId || null,
    isOfflinePending: Boolean(isOfflinePending),
    clientId: String(clientObj.clientId || clientId || "").trim(),
    username: String(clientObj.username || username || "").trim(),
    nickName: String(clientObj.nickName || nickName || "").trim(),
    userMobile: String(clientObj.userMobile || userMobile || "").trim(),
    email: String(clientObj.email || email || "").trim(),
    userAddress: String(clientObj.userAddress || userAddress || "").trim(),
    client: clientObj,
    serviceType: String(serviceType || cleanItems[0]?.serviceType || "Pleating Service").trim(),
    items: cleanItems,
    totalItems: cleanItems.length,
    subtotal: resolvedSubtotal,
    pickupDeliveryCharges: resolvedDeliveryCharges,
    otherCharges: resolvedOtherCharges,
    discount: resolvedDiscount,
    advancePayment: resolvedAdvance,
    balanceDue: resolvedBalanceDue,
    balancePaid: resolvedBalancePaid,
    totalAmount: finalTotal,
    paidAmount: resolvedPaid,
    paymentStatus: resolvedPaymentStatus,
    paymentMethod: String(paymentMethod || "UPI"),
    orderStatus: cleanStatus,
    status: cleanStatus,
    occasion: String(occasion || "").trim(),
    orderDate: orderDate || serverTimestamp(),
    deliveryDate: deliveryDate || null,
    notes: String(notes || "").trim(),
    createdBy: String(createdBy || "").trim(),
    createdAt: serverTimestamp(),
  };
};

/**
 * 7. Expense Model
 * @param {Object} data
 * @param {('Store Items'|'Travelling'|'Paid Reviews'|'Others')} data.categoryType
 * @param {string} data.name - Expense Name / Vendor / Person
 * @param {string} [data.description] - Description / Notes / Itemization
 * @param {number} data.amount - Amount in INR
 * @param {('Cash'|'UPI'|'Bank Transfer'|'Card')} data.paymentMethod
 * @param {string} [data.createdBy] - Name/email of user who recorded the expense
 * @param {string} [data.updatedBy] - Name/email of user who last modified the expense
 */
export const createExpenseModel = ({
  categoryType = EXPENSE_CATEGORIES.STORE_ITEMS,
  name = "",
  description = "",
  amount = 0,
  paymentMethod = EXPENSE_PAYMENT_METHODS.UPI,
  createdBy = "",
  updatedBy = null,
  expenseDate = null,
} = {}) => ({
  categoryType: String(categoryType || EXPENSE_CATEGORIES.STORE_ITEMS).trim(),
  name: String(name || "").trim(),
  description: String(description || "").trim(),
  amount: Number(amount) || 0,
  paymentMethod: String(paymentMethod || EXPENSE_PAYMENT_METHODS.UPI).trim(),
  expenseDate: expenseDate || serverTimestamp(),
  createdBy: String(createdBy || "").trim(),
  createdAt: serverTimestamp(),
  updatedBy: updatedBy ? String(updatedBy).trim() : null,
  updatedAt: null,
});

