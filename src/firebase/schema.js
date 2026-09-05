import { serverTimestamp } from "firebase/firestore";

/**
 * Cloud Firestore Collection Names
 */
export const COLLECTIONS = {
  BUSINESSES: "businesses",
  USERS: "users",
  SERVICES: "services",
  CUSTOMERS: "customers",
  ORDERS: "orders",
  MEASUREMENTS: "measurements",
};

/**
 * User Roles
 */
export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer",
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
 * Initial Services Catalog (12 Offerings)
 */
export const INITIAL_SERVICES = [
  {
    serviceName: "Flat Pleats",
    servicePrice: 600,
    serviceDiscountedPrice: 399,
    active: true,
  },
  {
    serviceName: "Semi-Fluffy Pleats",
    servicePrice: 750,
    serviceDiscountedPrice: 499,
    active: true,
  },
  {
    serviceName: "Fluffy Pleats",
    servicePrice: 750,
    serviceDiscountedPrice: 499,
    active: true,
  },
  {
    serviceName: "Box Folding",
    servicePrice: 0,
    serviceDiscountedPrice: 0,
    active: true,
  },
  {
    serviceName: "Hanger Folding",
    servicePrice: 300,
    serviceDiscountedPrice: 99,
    active: true,
  },
  {
    serviceName: "Single Pallu Pleating",
    servicePrice: 600,
    serviceDiscountedPrice: 399,
    active: true,
  },
  {
    serviceName: "Half Saree Pleating",
    servicePrice: 500,
    serviceDiscountedPrice: 249,
    active: true,
  },
  {
    serviceName: "Maharani Style Dupatta",
    servicePrice: 700,
    serviceDiscountedPrice: 399,
    active: true,
  },
  {
    serviceName: "Lehenga Pleating",
    servicePrice: 600,
    serviceDiscountedPrice: 399,
    active: true,
  },
  {
    serviceName: "Kids Saree Pre-Pleating",
    servicePrice: 900,
    serviceDiscountedPrice: 499,
    active: true,
  },
  {
    serviceName: "Saree Draping",
    servicePrice: 1000,
    serviceDiscountedPrice: 749,
    active: true,
  },
  {
    serviceName: "Hair Styling",
    servicePrice: 1200,
    serviceDiscountedPrice: 749,
    active: true,
  },
];

/**
 * Measurement Fields (Customer-provided, no hardcoded defaults)
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
  updatedAt: serverTimestamp(),
});

/**
 * 2. User Model
 * @param {Object} data
 * @param {string} data.username
 * @param {string} data.userMobile
 * @param {string} data.userAddress
 * @param {('superadmin'|'admin'|'staff'|'customer')} [data.role='customer']
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
  const normalizedEmail = String(email || "").trim().toLowerCase();
  let assignedRole = USER_ROLES.CUSTOMER;

  if (normalizedEmail === SUPERADMIN_EMAIL.toLowerCase()) {
    assignedRole = USER_ROLES.SUPERADMIN;
  } else if (
    role &&
    [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CUSTOMER].includes(role)
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
    updatedAt: serverTimestamp(),
  };
};


/**
 * 3. Service Model
 * @param {Object} data
 * @param {string} data.serviceName
 * @param {number} data.servicePrice
 * @param {number} data.serviceDiscountedPrice
 * @param {boolean} [data.active=true]
 */
export const createServiceModel = ({
  serviceName = "",
  servicePrice = 0,
  serviceDiscountedPrice = 0,
  active = true,
} = {}) => ({
  serviceName: String(serviceName).trim(),
  servicePrice: Number(servicePrice) || 0,
  serviceDiscountedPrice: Number(serviceDiscountedPrice) || 0,
  active: Boolean(active),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

/**
 * 4. Customer Model
 * @param {Object} data
 * @param {string} data.customerName
 * @param {string} data.customerMobile (stored strictly as string)
 * @param {string} data.customerAddress
 * @param {string|null} [data.userId] - Optional mapped user document ID
 * @param {string|null} [data.measurementId] - Reference to measurements collection document
 */
export const createCustomerModel = ({
  customerName = "",
  customerMobile = "",
  customerAddress = "",
  userId = null,
  measurementId = null,
} = {}) => ({
  customerName: String(customerName).trim(),
  customerMobile: String(customerMobile).trim(), // Mobile must be stored as string
  customerAddress: String(customerAddress).trim(),
  userId: userId ? String(userId).trim() : null,
  measurementId: measurementId ? String(measurementId).trim() : null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

/**
 * 5. Measurement Model (Mapped to Users collection)
 * Customer must provide their exact details; no default values.
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
    createdAtDate: new Date().toLocaleDateString('en-IN'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
};

/**
 * 6. Order Model
 * @param {Object} data
 * @param {string} data.customerId
 * @param {Array} data.items
 * @param {number} data.shippingCharges
 * @param {number} data.totalAmount
 * @param {number} data.paidAmount
 * @param {string} data.paymentStatus
 * @param {string} data.paymentMethod
 * @param {string} data.orderStatus
 * @param {any} [data.orderDate]
 * @param {any} [data.deliveryDate]
 * @param {string} [data.notes]
 * @param {string} data.createdBy
 */
export const createOrderModel = ({
  customerId = "",
  items = [],
  shippingCharges = 0,
  totalAmount = 0,
  paidAmount = 0,
  paymentStatus = PAYMENT_STATUS.PENDING,
  paymentMethod = "UPI",
  orderStatus = ORDER_STATUS.PENDING,
  orderDate = null,
  deliveryDate = null,
  notes = "",
  createdBy = "",
} = {}) => ({
  customerId: String(customerId).trim(),
  items: Array.isArray(items) ? items : [],
  shippingCharges: Number(shippingCharges) || 0,
  totalAmount: Number(totalAmount) || 0,
  paidAmount: Number(paidAmount) || 0,
  paymentStatus: String(paymentStatus),
  paymentMethod: String(paymentMethod),
  orderStatus: String(orderStatus),
  orderDate: orderDate || serverTimestamp(),
  deliveryDate: deliveryDate || null,
  notes: String(notes).trim(),
  createdBy: String(createdBy).trim(),
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});
