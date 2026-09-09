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
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
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
 * Initial Services Catalog (Default empty array, services are loaded from Firestore)
 */
export const INITIAL_SERVICES = [];

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
 * @param {string} data.userMobile
 * @param {string} data.userAddress
 * @param {('superadmin'|'admin'|'staff'|'client')} [data.role='client']
 * @param {string|null} [data.measurementId=null] - Reference to measurements collection
 */
export const createUserModel = ({
  username = "",
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
    email: normalizedEmail,
    userMobile: String(userMobile).trim(),
    userAddress: String(userAddress).trim(),
    role: assignedRole,
    measurementId: measurementId ? String(measurementId).trim() : null,
    createdAt: serverTimestamp(),
  };
};

/**
 * 3. Service Model
 * @param {Object} data
 * @param {string} data.serviceName
 * @param {number} data.servicePrice
 * @param {number} data.serviceDiscountedPrice
 * @param {string} [data.description]
 * @param {boolean} [data.active=true]
 */
export const createServiceModel = ({
  serviceName = "",
  servicePrice = 0,
  serviceDiscountedPrice = 0,
  description = "",
  active = true,
} = {}) => ({
  serviceName: String(serviceName).trim(),
  servicePrice: Number(servicePrice) || 0,
  serviceDiscountedPrice: Number(serviceDiscountedPrice) || 0,
  description: String(description || "").trim(),
  active: Boolean(active),
  createdAt: serverTimestamp(),
});

/**
 * 4. Client Model
 * @param {Object} data
 * @param {string} [data.clientName]
 * @param {string} [data.clientMobile] (stored strictly as string)
 * @param {string} [data.clientAddress]
 * @param {string|null} [data.userId] - Optional mapped user document ID
 * @param {string|null} [data.measurementId] - Reference to measurements collection document
 */
export const createClientModel = ({
  clientName = "",
  clientMobile = "",
  clientAddress = "",
  userId = null,
  measurementId = null,
} = {}) => {
  const resolvedName = String(clientName || "").trim();
  const resolvedMobile = String(clientMobile || "").trim();
  const resolvedAddress = String(clientAddress || "").trim();

  return {
    clientName: resolvedName,
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
    createdAt: serverTimestamp(),
  };
};

/**
 * 6. Order Model
/**
 * Create an Order Data Model for Firestore
 * @param {Object} data
 */
export const createOrderModel = ({
  clientId = "",
  username = "",
  userMobile = "",
  email = "",
  userAddress = "",
  client = null,
  items = [],
  subtotal = 0,
  pickupDeliveryCharges = 0,
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
} = {}) => {
  const cleanStatus = String(status || orderStatus || ORDER_STATUS.PENDING).toLowerCase();
  const clientObj = client || {
    clientId: String(clientId || "").trim(),
    username: String(username || "").trim(),
    userMobile: String(userMobile || "").trim(),
    email: String(email || "").trim(),
    userAddress: String(userAddress || "").trim(),
  };

  const cleanItems = (Array.isArray(items) ? items : []).map((it, idx) => ({
    itemId: it.itemId || `item_${idx + 1}_${Date.now()}`,
    serviceId: it.serviceId || "",
    serviceName: it.serviceName || "",
    servicePrice: Number(it.servicePrice) || 0,
    serviceDiscountedPrice: Number(it.serviceDiscountedPrice) || 0,
    serviceDescription: it.serviceDescription || it.description || "",
    finalPrice: Number(it.finalPrice !== undefined ? it.finalPrice : it.serviceDiscountedPrice || it.servicePrice) || 0,
    sareeType: it.sareeType || "Kanjeevaram Silk",
    measurementProfile: it.measurementProfile || null,
    itemNotes: it.itemNotes || "",
  }));

  const calculatedSubtotal = cleanItems.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0);
  const resolvedSubtotal = subtotal > 0 ? Number(subtotal) : calculatedSubtotal;
  const resolvedDeliveryCharges = Number(pickupDeliveryCharges) || 0;
  const resolvedDiscount = Number(discount) || 0;
  const calculatedTotal = Math.max(0, resolvedSubtotal + resolvedDeliveryCharges - resolvedDiscount);
  const finalTotal = totalAmount > 0 ? Number(totalAmount) : calculatedTotal;

  return {
    clientId: String(clientObj.clientId || clientId || "").trim(),
    username: String(clientObj.username || username || "").trim(),
    userMobile: String(clientObj.userMobile || userMobile || "").trim(),
    email: String(clientObj.email || email || "").trim(),
    userAddress: String(clientObj.userAddress || userAddress || "").trim(),
    client: clientObj,
    items: cleanItems,
    totalItems: cleanItems.length,
    subtotal: resolvedSubtotal,
    pickupDeliveryCharges: resolvedDeliveryCharges,
    discount: resolvedDiscount,
    totalAmount: finalTotal,
    paidAmount: Number(paidAmount) || 0,
    paymentStatus: String(paymentStatus || PAYMENT_STATUS.PENDING),
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

