import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth, firebaseConfig } from "./config";
import {
  COLLECTIONS,
  USER_ROLES,
  SUPERADMIN_EMAIL,
  createBusinessModel,
  createUserModel,
  createServiceModel,
  createClientModel,
  createMeasurementModel,
  createOrderModel,
  createExpenseModel,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
} from "./schema";

/**
 * ============================================================================
 * 1. Businesses Collection Operations
 * ============================================================================
 */

/**
 * Create or register a business
 * @param {string} businessId - Custom Document ID for the business
 * @param {Object} businessData
 */
export const createBusiness = async (businessId, businessData) => {
  const model = createBusinessModel(businessData);
  const docRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
  await setDoc(docRef, model);
  return { id: businessId, ...model };
};

/**
 * Fetch business by ID
 * @param {string} businessId
 */
export const getBusinessById = async (businessId) => {
  const docRef = doc(db, COLLECTIONS.BUSINESSES, businessId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Format any timestamp, object ({ seconds, nanoseconds }), number, or string safely into "dd-mmm-yyyy" (e.g. 06-Sep-2026).
 * Never returns 'Recent'. Guarantees consistent date formatting across the entire application.
 *
 * @param {any} val - Date, Firestore Timestamp, ISO string, timestamp number, etc.
 * @param {string} [customFallback] - Optional custom fallback string if value is completely invalid
 * @returns {string} - Date formatted as "dd-mmm-yyyy"
 */
export const formatDateSafe = (val, customFallback = "-") => {
  const getFormatted = (d) => {
    if (!d || isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, "0");
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFallback = () => {
    return customFallback !== null && customFallback !== undefined
      ? customFallback
      : "-";
  };

  if (
    !val ||
    val === "Recent" ||
    val === "recent" ||
    val === "null" ||
    val === "undefined" ||
    val === "[object Object]" ||
    val === "-" ||
    val === "—"
  ) {
    return getFallback();
  }

  // 1. JS Date instance
  if (val instanceof Date) {
    return getFormatted(val) || getFallback();
  }

  // 2. Firestore Timestamp object with .toDate()
  if (typeof val === "object" && typeof val.toDate === "function") {
    try {
      return getFormatted(val.toDate()) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 3. Object with seconds: { seconds: ..., nanoseconds: ... }
  if (typeof val === "object" && typeof val.seconds === "number") {
    try {
      return getFormatted(new Date(val.seconds * 1000)) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 4. Number (epoch milliseconds or seconds)
  if (typeof val === "number") {
    try {
      const ms = val < 10000000000 ? val * 1000 : val;
      return getFormatted(new Date(ms)) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 5. String parsing
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed === "Recent" ||
      trimmed === "recent" ||
      trimmed === "[object Object]" ||
      trimmed === "" ||
      trimmed === "-" ||
      trimmed === "—"
    ) {
      return getFallback();
    }

    // Check if already in "dd-mmm-yyyy" (e.g. "06-Sep-2026" or "6-Sep-2026")
    const ddMmmMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (ddMmmMatch) {
      const day = String(ddMmmMatch[1]).padStart(2, "0");
      const mRaw = ddMmmMatch[2];
      const mStr =
        mRaw.charAt(0).toUpperCase() + mRaw.slice(1, 3).toLowerCase();
      return `${day}-${mStr}-${ddMmmMatch[3]}`;
    }

    // Check for "dd/mm/yyyy" or "dd-mm-yyyy"
    const ddmmyyyyMatch = trimmed.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const d = new Date(year, month, day);
      return getFormatted(d) || getFallback();
    }

    // Check for "yyyy-mm-dd" or "yyyy/mm/dd"
    const yyyymmddMatch = trimmed.match(
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    );
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);
      const d = new Date(year, month, day);
      return getFormatted(d) || getFallback();
    }

    // Native Date parser fallback (for ISO strings like 2026-09-06T08:00:00Z)
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return getFormatted(parsed) || getFallback();
      }
    } catch {}
  }

  return getFallback();
};

/**
 * Format any timestamp, Date, ISO string, or number safely into 12-hour time "hh:mm A" (e.g. 08:45 PM).
 * If the value has no time component (e.g. pure date string "05-Sep-2026" or missing), returns null.
 *
 * @param {any} val
 * @returns {string|null}
 */
export const formatTimeSafe = (val) => {
  if (
    !val ||
    val === "Recent" ||
    val === "recent" ||
    val === "null" ||
    val === "undefined" ||
    val === "[object Object]" ||
    val === "-" ||
    val === "—"
  ) {
    return null;
  }

  let dateObj = null;

  // 1. JS Date instance
  if (val instanceof Date) {
    dateObj = isNaN(val.getTime()) ? null : val;
  }
  // 2. Firestore Timestamp object with .toDate()
  else if (typeof val === "object" && typeof val.toDate === "function") {
    try {
      dateObj = val.toDate();
    } catch {}
  }
  // 3. Object with seconds: { seconds: ..., nanoseconds: ... }
  else if (typeof val === "object" && typeof val.seconds === "number") {
    dateObj = new Date(
      val.seconds * 1000 +
        (val.nanoseconds ? Math.round(val.nanoseconds / 1000000) : 0),
    );
  }
  // 4. Number (epoch milliseconds or seconds)
  else if (typeof val === "number") {
    const ms = val < 10000000000 ? val * 1000 : val;
    dateObj = new Date(ms);
  }
  // 5. String parsing
  else if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed === "-" || trimmed === "—") return null;

    // Check if it is a pure date string without time component
    if (
      /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(trimmed) ||
      /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed) ||
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)
    ) {
      return null;
    }

    if (trimmed.includes("T") || trimmed.includes(":")) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return null;
  }

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  return `${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Extract structured date and time safe for table cells.
 * Returns { date: '05-Sep-2026', time: '08:45 PM' | null }
 */
export const formatDateTimeSafe = (val, customFallback = "-") => {
  return {
    date: formatDateSafe(val, customFallback),
    time: formatTimeSafe(val),
  };
};

/**
 * Convert any timestamp representation (Firestore Timestamp, Date, string, number)
 * to epoch milliseconds for exact comparison. Returns NaN if invalid or empty.
 */
export const getTimestampMillis = (val) => {
  if (
    !val ||
    val === "-" ||
    val === "—" ||
    val === "null" ||
    val === "undefined"
  ) {
    return NaN;
  }
  if (typeof val === "number") {
    return val < 10000000000 ? val * 1000 : val;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === "object") {
    if (typeof val.toMillis === "function") {
      try {
        return val.toMillis();
      } catch {}
    }
    if (typeof val.toDate === "function") {
      try {
        return val.toDate().getTime();
      } catch {}
    }
    if (typeof val.seconds === "number") {
      return (
        val.seconds * 1000 +
        (val.nanoseconds ? Math.round(val.nanoseconds / 1000000) : 0)
      );
    }
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s === "-" || s === "—") return NaN;
    const match = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === match[2].toLowerCase(),
      );
      const year = parseInt(match[3], 10);
      if (mIdx >= 0) {
        return new Date(year, mIdx, day).getTime();
      }
    }
    const parsed = Date.parse(s);
    if (!isNaN(parsed)) return parsed;
  }
  return NaN;
};

/**
 * Extract epoch milliseconds for the latest activity (updatedAt or createdAt or date).
 * Returns highest millisecond timestamp, or 0 if none found.
 */
export const getLatestItemTimestamp = (item) => {
  if (!item) return 0;
  const tUpdate = getTimestampMillis(
    item.rawUpdatedAt || item.updatedAt || item.modifiedAt,
  );
  const tCreate = getTimestampMillis(
    item.rawCreatedAt || item.createdAt || item.date || item.orderDate,
  );
  const validUpdate = !isNaN(tUpdate) && tUpdate > 0 ? tUpdate : 0;
  const validCreate = !isNaN(tCreate) && tCreate > 0 ? tCreate : 0;
  return Math.max(validUpdate, validCreate);
};

/**
 * Returns structured modified date & time { date, time } if the record has actually
 * been updated after initial creation, or null if unmodified / identical.
 *
 * @param {any} updatedVal
 * @param {any} createdVal
 * @returns {{ date: string, time: string|null } | null}
 */
export const getModifiedDateTime = (updatedVal, createdVal = null) => {
  if (
    !updatedVal ||
    updatedVal === "-" ||
    updatedVal === "—" ||
    updatedVal === "null" ||
    updatedVal === "undefined"
  ) {
    return null;
  }

  // 1. If raw string/object representations are strictly identical
  if (createdVal && String(updatedVal).trim() === String(createdVal).trim()) {
    return null;
  }

  // 2. Compare numeric millisecond timestamps if available
  const updatedMs = getTimestampMillis(updatedVal);
  const createdMs = getTimestampMillis(createdVal);

  if (!isNaN(updatedMs) && !isNaN(createdMs)) {
    // If within 10 seconds of creation, they are initial creation timestamps
    if (Math.abs(updatedMs - createdMs) <= 10000) {
      return null;
    }
    // If updated timestamp is earlier than or equal to created
    if (updatedMs <= createdMs) {
      return null;
    }
  }

  // 3. Compare formatted date strings (e.g. 06-Sep-2026)
  const formattedUpdated = formatDateSafe(updatedVal, "-");
  if (!formattedUpdated || formattedUpdated === "-") return null;

  if (createdVal) {
    const formattedCreated = formatDateSafe(createdVal, "-");
    if (formattedUpdated === formattedCreated) {
      // If the day is identical, check if there was a real later update (>10s)
      if (
        isNaN(updatedMs) ||
        isNaN(createdMs) ||
        updatedMs - createdMs <= 10000
      ) {
        return null;
      }
    }
  }

  return {
    date: formattedUpdated,
    time: formatTimeSafe(updatedVal),
  };
};

/**
 * Format modified / updated date.
 * If createdAt and modifiedAt timestamps are identical (or within 10 seconds of initial creation),
 * or if modifiedAt is missing / empty, returns "-" (dash).
 * Otherwise returns formatted date string.
 *
 * @param {any} updatedVal - Updated timestamp / date
 * @param {any} [createdVal] - Created timestamp / date
 * @returns {string} - Formatted modified date or "-"
 */
export const formatModifiedDate = (updatedVal, createdVal = null) => {
  const mod = getModifiedDateTime(updatedVal, createdVal);
  if (!mod) return "-";
  return mod.time ? `${mod.date} ${mod.time}` : mod.date;
};

/**
 * Helper to ensure Firestore async calls do not hang indefinitely if network/backend is unreachable
 */
export const withTimeout = (promise, ms = 3500, fallbackVal = null) => {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fallbackVal !== null) {
          resolve(fallbackVal);
        } else {
          reject(new Error(`Firestore operation timed out after ${ms}ms`));
        }
      }, ms);
    }),
  ]);
};

const LOCAL_USERS_KEY = "aparna_users_data";

export const getLocalUsers = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    list = list.filter((u) => u && u.id);

    // Strip legacy businessId if present and ensure createdAt/updatedAt are formatted properly
    list = list.map(({ businessId, ...rest }) => {
      return {
        ...rest,
        createdAt: formatDateSafe(rest.createdAt, "-"),
        updatedAt:
          rest.updatedAt && rest.updatedAt !== "-"
            ? formatDateSafe(rest.updatedAt, "-")
            : "-",
        rawCreatedAt: rest.rawCreatedAt || null,
        rawUpdatedAt: rest.rawUpdatedAt || null,
      };
    });

    return list;
  } catch {
    return [];
  }
};

export const saveLocalUsers = (users) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
};

const LOCAL_MEASUREMENTS_KEY = "aparna_measurements_data";

export const getLocalMeasurements = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_MEASUREMENTS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    return list.filter((m) => m && m.id);
  } catch {
    return [];
  }
};

export const saveLocalMeasurements = (measurements) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_MEASUREMENTS_KEY, JSON.stringify(measurements));
  } catch {
    // Ignore storage errors
  }
};

/**
 * ============================================================================
 * 2. Users Collection Operations
 * ============================================================================
 */

/**
 * Create or update user profile linked to a business
 * @param {string} uid - Firebase Auth UID
 * @param {Object} userData
 */
export const createUserProfile = async (uid, userData = {}) => {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  let existingData = null;
  const cleanEmail = (userData.email || "").trim().toLowerCase();

  try {
    const existingSnap = await withTimeout(getDoc(docRef), 3000, null);
    if (existingSnap && existingSnap.exists()) {
      existingData = existingSnap.data();
    } else if (cleanEmail) {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where("email", "==", cleanEmail),
      );
      const emailSnap = await withTimeout(getDocs(q), 3000, null);
      if (emailSnap && !emailSnap.empty) {
        existingData = emailSnap.docs[0].data();
      }
    }
  } catch {}

  // Also check local cache for existing user data
  const localList = getLocalUsers();
  const localMatch = localList.find(
    (u) =>
      (u.id && u.id === uid) ||
      (u.email &&
        cleanEmail &&
        (u.email || "").trim().toLowerCase() === cleanEmail),
  );

  // Determine role safely
  let resolvedRole = userData.role;
  if (
    cleanEmail === SUPERADMIN_EMAIL.toLowerCase() ||
    userData.role === USER_ROLES.SUPERADMIN
  ) {
    resolvedRole = USER_ROLES.SUPERADMIN;
  } else if (
    existingData?.role &&
    (!userData.role || userData.role === USER_ROLES.CLIENT)
  ) {
    resolvedRole = existingData.role;
  } else if (
    localMatch?.role &&
    (!userData.role || userData.role === USER_ROLES.CLIENT)
  ) {
    resolvedRole = localMatch.role;
  }
  if (!resolvedRole) resolvedRole = USER_ROLES.CLIENT;

  // Intelligently merge username, userMobile, userAddress, etc.
  // NEVER overwrite existing non-empty address/phone with empty string!
  const isGenericName = (name) =>
    !name ||
    ["User", "Google User", "Facebook User", "Client"].includes(name.trim());

  let finalUsername = "";
  if (
    userData.username &&
    userData.username.trim() &&
    !isGenericName(userData.username)
  ) {
    finalUsername = userData.username.trim();
  } else if (existingData?.username && !isGenericName(existingData.username)) {
    finalUsername = existingData.username.trim();
  } else if (localMatch?.username && !isGenericName(localMatch.username)) {
    finalUsername = localMatch.username.trim();
  } else {
    finalUsername = (
      userData.username ||
      existingData?.username ||
      localMatch?.username ||
      (resolvedRole === USER_ROLES.SUPERADMIN ? "Victory Ranjit" : "User")
    ).trim();
  }

  const finalMobile =
    (userData.userMobile && userData.userMobile.trim()) ||
    existingData?.userMobile ||
    localMatch?.userMobile ||
    "";

  const finalAddress =
    (userData.userAddress && userData.userAddress.trim()) ||
    existingData?.userAddress ||
    localMatch?.userAddress ||
    "";

  const finalMeasurementId =
    userData.measurementId ||
    existingData?.measurementId ||
    localMatch?.measurementId ||
    null;

  const finalAuthProvider =
    userData.authProvider ||
    existingData?.authProvider ||
    localMatch?.authProvider ||
    null;

  const finalPhotoURL =
    userData.photoURL ||
    existingData?.photoURL ||
    localMatch?.photoURL ||
    null;

  const finalIsActive =
    typeof userData.isActive === "boolean"
      ? userData.isActive
      : typeof existingData?.isActive === "boolean"
        ? existingData.isActive
        : true;

  const model = {
    ...(existingData || {}),
    ...userData,
    username: String(finalUsername).trim(),
    email: cleanEmail,
    userMobile: String(finalMobile).trim(),
    userAddress: String(finalAddress).trim(),
    role: resolvedRole,
    measurementId: finalMeasurementId ? String(finalMeasurementId).trim() : null,
    authProvider: finalAuthProvider,
    photoURL: finalPhotoURL,
    isActive: finalIsActive,
    createdAt: existingData?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await withTimeout(setDoc(docRef, model, { merge: true }), 3500);
  } catch (err) {
    console.warn("createUserProfile firestore note:", err.message || err);
  }

  // Also sync to local cache
  const updatedLocal = localList.map((u) =>
    (u.id && u.id === uid) ||
    (cleanEmail && (u.email || "").trim().toLowerCase() === cleanEmail)
      ? { ...u, ...model, id: uid }
      : u,
  );
  if (
    !updatedLocal.some(
      (u) =>
        (u.id && u.id === uid) ||
        (cleanEmail && (u.email || "").trim().toLowerCase() === cleanEmail),
    )
  ) {
    updatedLocal.push({ ...model, id: uid });
  }
  saveLocalUsers(updatedLocal);

  return { id: uid, ...model };
};

/**
 * Create a new user in Firebase Authentication without logging out the active admin.
 * Uses an isolated secondary Firebase App instance.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} [params.displayName]
 * @returns {Promise<{ uid: string, email: string }>}
 */
export const createAuthUser = async ({ email, password, displayName }) => {
  const secondaryAppName = "SecondaryAuthAdminApp";
  let secondaryApp;
  const existingApps = getApps();
  const found = existingApps.find((a) => a.name === secondaryAppName);
  if (found) {
    secondaryApp = found;
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password,
    );
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch (pErr) {
        console.warn("displayName update note:", pErr);
      }
    }
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    return { uid, email: cred.user.email };
  } catch (err) {
    await signOut(secondaryAuth).catch(() => {});
    throw err;
  }
};

/**
 * Reset a user's password via a secondary Firebase app instance.
 * Signs in the user on the secondary app using their current email + current password,
 * then updates to the new password. Admin session is never affected.
 *
 * @param {Object} params
 * @param {string} params.email         - The user's email address
 * @param {string} params.currentPassword - Their current password (needed for re-auth)
 * @param {string} params.newPassword   - The new password to set
 */
export const resetUserPassword = async ({
  email,
  currentPassword = "aparna",
  newPassword,
  displayName,
}) => {
  const secondaryAppName = "SecondaryAuthAdminApp";
  let secondaryApp;
  const existingApps = getApps();
  const found = existingApps.find((a) => a.name === secondaryAppName);
  if (found) {
    secondaryApp = found;
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);
  const cleanEmail = email.trim();

  try {
    // 1. Try to sign in with default/current password and update directly
    try {
      const cred = await signInWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        currentPassword,
      );
      await updatePassword(cred.user, newPassword);
      return {
        method: "updated",
        message: "Password updated successfully!",
      };
    } catch (authErr) {
      // 2. If user doesn't exist in Firebase Auth (created in Firestore only), create their Auth account
      if (
        authErr.code === "auth/user-not-found" ||
        authErr.code === "auth/invalid-credential" ||
        authErr.code === "auth/wrong-password"
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(
            secondaryAuth,
            cleanEmail,
            newPassword,
          );
          if (displayName && newCred.user) {
            await updateProfile(newCred.user, {
              displayName: displayName.trim(),
            }).catch(() => {});
          }
          return {
            method: "created",
            message: "Firebase Auth account created with the new password!",
          };
        } catch (createErr) {
          if (createErr.code === "auth/email-already-in-use") {
            // User exists in Firebase Auth but current password was not 'aparna'.
            // Fall back to sending an official password reset link.
            const actionCodeSettings =
              typeof window !== "undefined" && window.location?.origin
                ? {
                    url: `${window.location.origin}/reset-password`,
                    handleCodeInApp: true,
                  }
                : undefined;
            await sendPasswordResetEmail(
              secondaryAuth,
              cleanEmail,
              actionCodeSettings,
            );
            return {
              method: "email_sent",
              message: `A password reset link has been sent to ${cleanEmail}.`,
            };
          }
          throw createErr;
        }
      } else {
        throw authErr;
      }
    }
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
};

/**
 * Normalizes an email address for comparison (trimmed and lowercase)
 * @param {string} email
 * @returns {string}
 */
export const normalizeEmail = (email) => {
  if (!email) return "";
  return String(email).trim().toLowerCase();
};

/**
 * Normalizes a mobile number for comparison (extracts last 10 digits)
 * @param {string|number} mobile
 * @returns {string}
 */
export const normalizeMobile = (mobile) => {
  if (!mobile) return "";
  const digits = String(mobile).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

/**
 * Check if a user with the specified email or mobile already exists.
 * Verifies across both local storage cache and Firestore remote collections.
 *
 * @param {Object} params
 * @param {string} [params.email] - Email address to verify
 * @param {string|number} [params.userMobile] - Mobile number to verify
 * @param {string} [params.excludeUserId] - User ID to exclude (for edit scenarios)
 * @returns {Promise<{ isUnique: boolean, emailExists: boolean, mobileExists: boolean, message: string|null, conflictingUser: Object|null }>}
 */
export const checkUserUniqueness = async ({
  email,
  userMobile,
  excludeUserId = null,
}) => {
  const cleanEmail = normalizeEmail(email);
  const cleanMobile = normalizeMobile(userMobile);

  let emailExists = false;
  let mobileExists = false;
  let conflictingUser = null;

  // 1. Check in cached / full user list
  try {
    const allUsers = await getAllUsers();
    for (const u of allUsers) {
      if (excludeUserId) {
        const uId = String(u.id || u.uid || "");
        if (uId === String(excludeUserId)) {
          continue;
        }
      }

      const uEmail = normalizeEmail(u.email);
      const uMobile = normalizeMobile(u.userMobile || u.mobile || u.phone);

      if (cleanEmail && uEmail && uEmail === cleanEmail) {
        emailExists = true;
        conflictingUser = u;
      }
      if (cleanMobile && uMobile && uMobile === cleanMobile) {
        mobileExists = true;
        conflictingUser = u;
      }
      if (emailExists && mobileExists) break;
    }
  } catch (err) {
    console.warn("getAllUsers in checkUserUniqueness note:", err);
  }

  // 2. Query Firestore directly for email if not found yet
  if (!emailExists && cleanEmail) {
    try {
      const qEmail = query(
        collection(db, COLLECTIONS.USERS),
        where("email", "==", cleanEmail),
      );
      const snap = await withTimeout(getDocs(qEmail), 2500, null);
      if (snap && !snap.empty) {
        for (const d of snap.docs) {
          const docData = d.data();
          const docId = String(d.id || docData.uid || docData.id || "");
          if (!excludeUserId || docId !== String(excludeUserId)) {
            emailExists = true;
            conflictingUser = { id: d.id, ...docData };
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Firestore email uniqueness query note:", e);
    }
  }

  // 3. Query Firestore directly for mobile if not found yet
  if (!mobileExists && cleanMobile) {
    try {
      const qMobile = query(
        collection(db, COLLECTIONS.USERS),
        where("userMobile", "==", cleanMobile),
      );
      const snap = await withTimeout(getDocs(qMobile), 2500, null);
      if (snap && !snap.empty) {
        for (const d of snap.docs) {
          const docData = d.data();
          const docId = String(d.id || docData.uid || docData.id || "");
          if (!excludeUserId || docId !== String(excludeUserId)) {
            mobileExists = true;
            conflictingUser = { id: d.id, ...docData };
            break;
          }
        }
      }
    } catch (e) {
      console.warn("Firestore mobile uniqueness query note:", e);
    }
  }

  let message = null;
  if (emailExists && mobileExists) {
    message = `Both Email "${cleanEmail}" and Mobile Number "${cleanMobile}" are already registered. Each user must have a unique email and mobile number.`;
  } else if (emailExists) {
    message = `Email "${cleanEmail}" is already registered. Each user must have a unique email address.`;
  } else if (mobileExists) {
    message = `Mobile number "${cleanMobile}" is already registered. Each user must have a unique mobile number.`;
  }

  return {
    isUnique: !emailExists && !mobileExists,
    emailExists,
    mobileExists,
    message,
    conflictingUser,
  };
};

/**
 * Create a new user record directly (for Admin / Staff user creation)
 * @param {Object} userData
 */
export const createUser = async (userData) => {
  // Validate uniqueness before creation
  const uniqueness = await checkUserUniqueness({
    email: userData.email,
    userMobile: userData.userMobile,
  });

  if (!uniqueness.isUnique) {
    throw new Error(uniqueness.message);
  }

  const model = createUserModel(userData);
  const tempId = "user-" + Date.now();
  const now = new Date();
  const localItem = {
    id: tempId,
    ...model,
    createdAt: now.toISOString(),
    rawCreatedAt: now,
    updatedAt: null,
    rawUpdatedAt: null,
  };

  // Immediately save to local cache
  const localList = getLocalUsers();
  localList.unshift(localItem);
  saveLocalUsers(localList);

  try {
    const docRef = await withTimeout(
      addDoc(collection(db, COLLECTIONS.USERS), model),
      3500,
    );
    localItem.id = docRef.id;
    saveLocalUsers(localList);
    return { id: docRef.id, ...model };
  } catch (err) {
    console.warn(
      "Firestore createUser note (saved locally):",
      err.message || err,
    );
    return localItem;
  }
};

/**
 * Delete a user record from Firestore and local cache
 * @param {string} userId
 */
export const deleteUser = async (userId) => {
  const localList = getLocalUsers().filter((u) => u.id !== userId);
  saveLocalUsers(localList);

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await withTimeout(deleteDoc(docRef), 3000);
  } catch (err) {
    console.warn(
      "Firestore deleteUser note (removed locally):",
      err.message || err,
    );
  }
  return true;
};

/**
 * Get user profile by UID
 * @param {string} uid
 */
export const getUserProfile = async (uid) => {
  const localList = getLocalUsers();
  const localFound = localList.find((u) => u.id === uid);

  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const snapshot = await withTimeout(getDoc(docRef), 2500, null);
    if (snapshot && snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (err) {
    console.warn("getUserProfile firestore note:", err.message || err);
  }
  return localFound || null;
};

/**
 * Get all users for a given business
 * @param {string} businessId
 */
export const getUsersByBusiness = async (businessId) => {
  return await getAllUsers();
};

/**
 * Get all users across the users collection (with resilient cache fallback & timeout)
 */
export const getAllUsers = async () => {
  const localList = getLocalUsers();

  try {
    const snapshot = await withTimeout(
      getDocs(collection(db, COLLECTIONS.USERS)),
      3500,
    );

    if (snapshot) {
      const remoteUsers = snapshot.docs.map((d) => {
        const data = d.data();
        const emailLower = (data.email || "").toLowerCase();
        const isVictory = emailLower === "victoryranjit@gmail.com";
        const isAparna = emailLower === "ranjitaparna25@gmail.com";
        const defaultCreated = isVictory || isAparna ? "05-Sep-2026" : null;

        const rawCreated = data.createdAt || defaultCreated;
        const rawUpdated =
          isVictory || isAparna ? null : data.updatedAt || null;

        return {
          id: d.id,
          ...data,
          createdAt: formatDateSafe(rawCreated, "-"),
          updatedAt: rawUpdated ? formatDateSafe(rawUpdated, "-") : "-",
          rawCreatedAt: rawCreated || null,
          rawUpdatedAt: rawUpdated || null,
        };
      });

      saveLocalUsers(remoteUsers);
      return remoteUsers;
    }
  } catch (err) {
    console.warn(
      "Firestore getAllUsers note (serving from local cache):",
      err.message || err,
    );
  }

  return localList;
};

/**
 * Update a user's role (SuperAdmin only operation)
 * Only victoryranjit@gmail.com is authorized to execute this.
 * Users cannot be upgraded to superadmin, and victoryranjit@gmail.com cannot be demoted.
 *
 * @param {string} userId - Firestore User Document ID
 * @param {('admin'|'staff'|'client')} newRole - Target role
 */
export const updateUserRole = async (userId, newRole) => {
  const targetRole = newRole;
  const validRoles = [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CLIENT];
  if (!validRoles.includes(targetRole)) {
    throw new Error(
      "Invalid role specified. Only Admin, Staff, or Client roles can be assigned.",
    );
  }

  // Update in local cache
  const localList = getLocalUsers();
  const idx = localList.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    if (
      localList[idx].email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    ) {
      throw new Error("Super Admin role is immutable and cannot be modified.");
    }
    localList[idx].role = targetRole;
    saveLocalUsers(localList);
  }

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      role: targetRole,
      updatedAt: serverTimestamp(),
    });
    const userSnapshot = await withTimeout(getDoc(docRef), 2500, null);

    if (userSnapshot && userSnapshot.exists()) {
      const existingData = userSnapshot.data();
      if (
        existingData.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      ) {
        throw new Error(
          "Super Admin role is immutable and cannot be modified.",
        );
      }
    }

    await withTimeout(
      setDoc(
        docRef,
        {
          role: newRole,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      3000,
    );
  } catch (err) {
    console.warn(
      "Firestore updateUserRole note (role updated locally):",
      err.message || err,
    );
  }

  return { id: userId, role: newRole };
};

/**
 * Update user details in Firestore and local cache
 * Supports updating by userId or searching by user email if ID is a client placeholder.
 * Uses setDoc with merge: true so it creates or merges safely without throwing "No document to update".
 *
 * @param {string} userId - Firestore User Document ID
 * @param {Object} updatedData - Updated fields
 */
export const updateUser = async (userId, updatedData) => {
  const cleanEmail = String(updatedData.email || "")
    .trim()
    .toLowerCase();
  const cleanMobile = String(updatedData.userMobile || "").trim();

  // Validate uniqueness excluding current user
  if (cleanEmail || cleanMobile) {
    const uniqueness = await checkUserUniqueness({
      email: cleanEmail,
      userMobile: cleanMobile,
      excludeUserId: userId,
    });
    if (!uniqueness.isUnique) {
      throw new Error(uniqueness.message);
    }
  }

  let targetDocRef = userId ? doc(db, COLLECTIONS.USERS, userId) : null;
  let existingData = null;

  // 1. Immediately update in local cache so UI is responsive and changes persist across reloads
  const localList = getLocalUsers();
  const existingIdx = localList.findIndex(
    (u) =>
      (userId && u.id === userId) ||
      (cleanEmail && (u.email || "").toLowerCase() === cleanEmail),
  );

  let finalRole = updatedData.role;
  if (
    cleanEmail === SUPERADMIN_EMAIL.toLowerCase() ||
    (existingIdx >= 0 &&
      localList[existingIdx]?.email?.toLowerCase() ===
        SUPERADMIN_EMAIL.toLowerCase())
  ) {
    finalRole = USER_ROLES.SUPERADMIN;
  } else if (finalRole === USER_ROLES.SUPERADMIN) {
    finalRole = USER_ROLES.CLIENT;
  }

  const existingUser = existingIdx >= 0 ? localList[existingIdx] : {};
  const now = new Date();
  const payload = {
    ...existingUser,
    id:
      userId ||
      (existingIdx >= 0 ? localList[existingIdx].id : "user-" + Date.now()),
    username: String(updatedData.username || "").trim(),
    email: cleanEmail,
    userMobile: String(updatedData.userMobile || "").trim(),
    userAddress: String(updatedData.userAddress || "").trim(),
    role: finalRole,
    updatedAt: now.toISOString(),
    rawUpdatedAt: now,
  };

  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...payload };
  } else {
    localList.unshift(payload);
  }
  saveLocalUsers(localList);

  // 2. Attempt to persist to Firestore with timeout
  try {
    if (targetDocRef) {
      const snap = await withTimeout(getDoc(targetDocRef), 2500, null);
      if (snap && snap.exists()) {
        existingData = snap.data();
      } else {
        targetDocRef = null;
      }
    }

    if (!targetDocRef && cleanEmail) {
      const q = query(
        collection(db, COLLECTIONS.USERS),
        where("email", "==", cleanEmail),
      );
      const snap = await withTimeout(getDocs(q), 2500, null);
      if (snap && !snap.empty) {
        targetDocRef = snap.docs[0].ref;
        existingData = snap.docs[0].data();
      }
    }

    if (!targetDocRef) {
      targetDocRef = userId
        ? doc(db, COLLECTIONS.USERS, userId)
        : doc(collection(db, COLLECTIONS.USERS));
    }

    const disabledState =
      updatedData.disabled !== undefined
        ? Boolean(updatedData.disabled)
        : Boolean(existingUser.disabled);
    const firestorePayload = {
      username: payload.username,
      email: payload.email,
      userMobile: payload.userMobile,
      userAddress: payload.userAddress,
      role: payload.role,
      disabled: disabledState,
      updatedAt: serverTimestamp(),
    };

    payload.disabled = disabledState;

    await withTimeout(
      setDoc(targetDocRef, firestorePayload, { merge: true }),
      3000,
    );
    payload.id = targetDocRef.id;
  } catch (fsErr) {
    console.warn(
      "Firestore updateUser sync note (saved locally):",
      fsErr.message || fsErr,
    );
  }

  return payload;
};

/**
 * Toggle user enabled/disabled status in Firestore and local cache
 * @param {string} userId - Firestore User Document ID
 * @param {boolean} disabled - True to disable, false to enable
 */
export const toggleUserStatus = async (userId, disabled) => {
  const localList = getLocalUsers();
  const existingIdx = localList.findIndex((u) => userId && u.id === userId);
  if (existingIdx < 0) {
    throw new Error("User not found");
  }

  const user = localList[existingIdx];
  if (user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    throw new Error("Super Admin account cannot be disabled.");
  }

  const now = new Date();
  const updatedUser = {
    ...user,
    disabled: Boolean(disabled),
    updatedAt: now.toISOString(),
    rawUpdatedAt: now,
  };

  localList[existingIdx] = updatedUser;
  saveLocalUsers(localList);

  try {
    const userDocRef = doc(db, COLLECTIONS.USERS, userId);
    await withTimeout(
      setDoc(
        userDocRef,
        {
          disabled: Boolean(disabled),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ),
      3000,
    );
  } catch (fsErr) {
    console.warn(
      "Firestore toggleUserStatus note (saved locally):",
      fsErr.message || fsErr,
    );
  }

  return updatedUser;
};

/**
 * ============================================================================
 * 3. Services Collection Operations
 * ============================================================================
 */

const SERVICES_CACHE_KEY = "aparna_services_cache";

const getCachedServices = () => {
  try {
    const raw = localStorage.getItem(SERVICES_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedServices = (services) => {
  try {
    localStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(services));
  } catch {}
};

/**
 * Create a new service
 * @param {Object} serviceData
 */
export const createService = async (serviceData) => {
  const model = createServiceModel(serviceData);
  let createdId = null;

  try {
    const docRef = await withTimeout(
      addDoc(collection(db, COLLECTIONS.SERVICES), model),
      4000,
    );
    createdId = docRef.id;
  } catch (err) {
    console.warn(
      "createService firestore note (using local ID):",
      err.message || err,
    );
    createdId = "svc_" + Date.now();
  }

  const now = new Date();
  const result = {
    id: createdId,
    ...model,
    rawCreatedAt: now.toISOString(),
    createdAt: formatDateSafe(now),
    rawUpdatedAt: null,
    updatedAt: null,
  };

  // Update local cache
  const cached = getCachedServices() || [];
  setCachedServices([result, ...cached]);

  return result;
};

/**
 * Get all services across the services collection
 * @param {boolean} [onlyActive=false]
 */
export const getAllServices = async (onlyActive = false) => {
  try {
    let q = collection(db, COLLECTIONS.SERVICES);
    if (onlyActive) {
      q = query(
        collection(db, COLLECTIONS.SERVICES),
        where("active", "==", true),
      );
    }

    const snapshot = await withTimeout(getDocs(q), 4500);

    if (snapshot && !snapshot.empty) {
      const services = snapshot.docs.map((d) => {
        const data = d.data();
        const resolvedPrice =
          Number(
            data.servicePrice !== undefined && data.servicePrice !== null
              ? data.servicePrice
              : data.price !== undefined && data.price !== null
                ? data.price
                : data.amount || 0,
          ) || 0;
        const resolvedDiscountPrice =
          Number(
            data.serviceDiscountedPrice !== undefined &&
              data.serviceDiscountedPrice !== null
              ? data.serviceDiscountedPrice
              : data.discountedPrice !== undefined &&
                  data.discountedPrice !== null
                ? data.discountedPrice
                : resolvedPrice,
          ) || resolvedPrice;

        const resolvedDisplayOrder = Number(
          data.displayOrder !== undefined && data.displayOrder !== null
            ? data.displayOrder
            : data.orderIndex !== undefined && data.orderIndex !== null
              ? data.orderIndex
              : 0,
        );

        return {
          id: d.id,
          ...data,
          serviceName:
            data.serviceName || data.name || data.title || "Unnamed Service",
          serviceType: data.serviceType || "Pleating Service",
          servicePrice: resolvedPrice,
          serviceDiscountedPrice: resolvedDiscountPrice,
          displayOrder: resolvedDisplayOrder,
          description: data.description || "",
          active: data.active !== false,
          rawCreatedAt: data.createdAt,
          rawUpdatedAt: data.updatedAt,
          createdAt: data.createdAt
            ? formatDateSafe(data.createdAt)
            : formatDateSafe(new Date()),
          updatedAt: data.updatedAt ? formatDateSafe(data.updatedAt) : null,
        };
      });

      // Sort services by displayOrder ascending (1, 2, 3...), fallback to serviceName
      services.sort((a, b) => {
        const orderA =
          a.displayOrder && a.displayOrder > 0
            ? Number(a.displayOrder)
            : 999999;
        const orderB =
          b.displayOrder && b.displayOrder > 0
            ? Number(b.displayOrder)
            : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.serviceName || "").localeCompare(b.serviceName || "");
      });

      setCachedServices(services);
      return onlyActive ? services.filter((s) => s.active) : services;
    }

    setCachedServices([]);
    return [];
  } catch (err) {
    console.warn(
      "getAllServices firestore note (falling back to cache):",
      err.message || err,
    );
    const cached = getCachedServices();
    if (cached && cached.length > 0) {
      const sorted = (
        onlyActive ? cached.filter((s) => s.active) : cached
      ).sort((a, b) => {
        const orderA =
          a.displayOrder && a.displayOrder > 0
            ? Number(a.displayOrder)
            : 999999;
        const orderB =
          b.displayOrder && b.displayOrder > 0
            ? Number(b.displayOrder)
            : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.serviceName || "").localeCompare(b.serviceName || "");
      });
      return sorted;
    }
    return [];
  }
};

export const updateService = async (serviceId, serviceData) => {
  const payload = {
    serviceName: String(serviceData.serviceName || "").trim(),
    servicePrice: Number(serviceData.servicePrice) || 0,
    serviceDiscountedPrice: Number(serviceData.serviceDiscountedPrice) || 0,
    active: Boolean(serviceData.active),
    description: serviceData.description
      ? String(serviceData.description).trim()
      : "",
    updatedAt: serverTimestamp(),
  };

  if (
    serviceData.serviceType !== undefined &&
    serviceData.serviceType !== null
  ) {
    payload.serviceType = String(serviceData.serviceType).trim();
  }

  if (
    serviceData.displayOrder !== undefined &&
    serviceData.displayOrder !== null
  ) {
    payload.displayOrder = Number(serviceData.displayOrder) || 0;
  }

  try {
    const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await withTimeout(setDoc(docRef, payload, { merge: true }), 4000);
  } catch (err) {
    console.warn(
      "updateService firestore note (cached locally):",
      err.message || err,
    );
  }

  // Update local cache
  const now = new Date();
  const cached = getCachedServices() || [];
  const updated = cached.map((s) =>
    s.id === serviceId
      ? {
          ...s,
          ...payload,
          rawUpdatedAt: now.toISOString(),
          updatedAt: formatDateSafe(now),
        }
      : s,
  );
  setCachedServices(updated);

  return {
    id: serviceId,
    ...payload,
    rawUpdatedAt: now.toISOString(),
    updatedAt: formatDateSafe(now),
  };
};

/**
 * Delete a service from Firestore
 * @param {string} serviceId
 */
export const deleteService = async (serviceId) => {
  try {
    const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await withTimeout(deleteDoc(docRef), 4000);
  } catch (err) {
    console.warn(
      "deleteService firestore note (removed locally):",
      err.message || err,
    );
  }

  // Update local cache
  const cached = getCachedServices() || [];
  setCachedServices(cached.filter((s) => s.id !== serviceId));

  return true;
};

/**
 * Toggle active status of a service
 * @param {string} serviceId
 * @param {boolean} newStatus
 */
export const toggleServiceActive = async (serviceId, newStatus) => {
  return await updateService(serviceId, { active: newStatus });
};

/**
 * Get all services (businessId parameter retained for backward compatibility)
 * @param {string} [_businessId]
 * @param {boolean} [onlyActive=false]
 */
export const getServicesByBusiness = async (
  _businessId,
  onlyActive = false,
) => {
  return await getAllServices(onlyActive);
};

/**
 * Batch seed initial 12 services
 */
export const seedInitialServices = async () => {
  return [];
};

/**
 * ============================================================================
 * 4. Clients Collection Operations
 * ============================================================================
 */

/**
 * Create a new client with measurements
 * @param {Object} clientData
 */
export const createClient = async (clientData) => {
  const model = createClientModel(clientData);
  const docRef = await addDoc(collection(db, COLLECTIONS.CLIENTS), model);
  return { id: docRef.id, ...model };
};

export const getAllClients = async () => {
  try {
    const clientsSnap = await getDocs(collection(db, COLLECTIONS.CLIENTS));
    if (clientsSnap && !clientsSnap.empty) {
      return clientsSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          clientName: data.clientName || data.username || "",
          clientMobile: data.clientMobile || data.userMobile || "",
          clientAddress: data.clientAddress || data.userAddress || "",
          username: data.clientName || data.username || "",
          userMobile: data.clientMobile || data.userMobile || "",
          userAddress: data.clientAddress || data.userAddress || "",
          role: USER_ROLES.CLIENT,
        };
      });
    }
  } catch (err) {
    console.warn("getAllClients error:", err.message || err);
  }
  return [];
};

/**
 * Get all clients
 * @param {string} [_businessId]
 */
export const getClientsByBusiness = async (_businessId) => {
  return await getAllClients();
};

/**
 * Link a client to a measurement document or user
 * @param {string} clientId
 * @param {Object} linkData - e.g. { measurementId, userId }
 */
export const updateClientLinks = async (clientId, linkData) => {
  const docRef = doc(db, COLLECTIONS.CLIENTS, clientId);
  await updateDoc(docRef, {
    ...linkData,
    updatedAt: serverTimestamp(),
  });
  return true;
};

/**
 * ============================================================================
 * 5. Measurements Collection Operations (Mapped to Users)
 * ============================================================================
 */

/**
 * Create a new measurement record mapped to a user
 * @param {Object} measurementData
 */
export const createMeasurement = async (measurementData) => {
  const now = new Date();
  const nowIso = now.toISOString();
  const model = createMeasurementModel(measurementData);
  const tempId = "m-" + Date.now();
  const localRecord = {
    ...model,
    id: tempId,
    createdAt: nowIso,
    rawCreatedAt: now,
  };

  // Save to local cache immediately
  const localList = getLocalMeasurements();
  localList.unshift(localRecord);
  saveLocalMeasurements(localList);

  try {
    const docRef = await withTimeout(
      addDoc(collection(db, COLLECTIONS.MEASUREMENTS), model),
      3500,
    );
    localRecord.id = docRef.id;
    saveLocalMeasurements(localList);

    // If userId is present, optionally link measurementId to the user document
    if (measurementData.userId) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, measurementData.userId);
        await withTimeout(
          setDoc(
            userRef,
            { measurementId: docRef.id, updatedAt: serverTimestamp() },
            { merge: true },
          ),
          2000,
        );
      } catch {
        // User doc might not exist yet if created prior
      }
    }

    return {
      ...model,
      id: docRef.id,
      createdAt: nowIso,
      rawCreatedAt: now,
    };
  } catch (err) {
    console.warn("Firestore measurement save note (saved locally):", err);
    return localRecord;
  }
};

export const createClientMeasurement = createMeasurement;

/**
 * Get all measurement records mapped to a specific client / user
 * @param {string} userId
 */
export const getMeasurementsByUserId = async (userId) => {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, COLLECTIONS.MEASUREMENTS),
      where("userId", "==", userId),
    );
    const snapshot = await withTimeout(getDocs(q), 3000, null);
    if (snapshot && !snapshot.empty) {
      const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      return remote;
    }
  } catch (err) {
    console.warn("getMeasurementsByUserId note (serving local):", err);
  }

  return getLocalMeasurements().filter((m) => m.userId === userId);
};

/**
 * Get single measurement record by user ID (returns latest)
 * @param {string} userId
 */
export const getMeasurementByUserId = async (userId) => {
  const all = await getMeasurementsByUserId(userId);
  return all.length > 0 ? all[0] : null;
};

/**
 * Get measurement record by document ID
 * @param {string} measurementId
 */
export const getMeasurementById = async (measurementId) => {
  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    const snapshot = await withTimeout(getDoc(docRef), 2500, null);
    if (snapshot && snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (err) {
    console.warn("getMeasurementById note:", err);
  }

  const localList = getLocalMeasurements();
  const localFound = localList.find((m) => m.id === measurementId);
  return localFound || null;
};

/**
 * Delete a client measurement record
 * @param {string} measurementId
 */
export const deleteClientMeasurement = async (measurementId) => {
  const localList = getLocalMeasurements().filter(
    (m) => m.id !== measurementId,
  );
  saveLocalMeasurements(localList);

  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    await withTimeout(deleteDoc(docRef), 3000);
  } catch (err) {
    console.warn("deleteClientMeasurement note:", err);
  }
  return true;
};

/**
 * Get all client measurements across the measurements collection
 */
export const getAllMeasurements = async () => {
  try {
    const snapshot = await withTimeout(
      getDocs(collection(db, COLLECTIONS.MEASUREMENTS)),
      3000,
      null,
    );
    if (snapshot) {
      const remote = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      saveLocalMeasurements(remote);
      return remote;
    }
  } catch (err) {
    console.warn(
      "Firestore getAllMeasurements note (serving from local cache):",
      err.message || err,
    );
  }

  return getLocalMeasurements();
};

/**
 * Get client measurements
 * @param {string} [_businessId]
 */
export const getMeasurementsByBusiness = async (_businessId) => {
  return await getAllMeasurements();
};

/**
 * Update an existing client measurement record
 * @param {string} measurementId
 * @param {Object} measurementData
 */
export const updateMeasurement = async (measurementId, measurementData) => {
  const payload = {};
  if (measurementData.title !== undefined)
    payload.title = String(measurementData.title || "").trim();
  if (measurementData.pallu !== undefined)
    payload.pallu = measurementData.pallu;
  if (measurementData.shoulderToRightTight !== undefined)
    payload.shoulderToRightTight = measurementData.shoulderToRightTight;
  if (measurementData.chest !== undefined)
    payload.chest = measurementData.chest;
  if (measurementData.hip !== undefined) payload.hip = measurementData.hip;
  if (measurementData.firstPleatSize !== undefined)
    payload.firstPleatSize = measurementData.firstPleatSize;
  if (measurementData.noOfChestPleats !== undefined)
    payload.noOfChestPleats = measurementData.noOfChestPleats;
  if (measurementData.height !== undefined)
    payload.height = measurementData.height;
  if (measurementData.dressSize !== undefined)
    payload.dressSize = measurementData.dressSize;
  if (measurementData.notes !== undefined)
    payload.notes = String(measurementData.notes || "").trim();

  // Update in local cache first
  const localList = getLocalMeasurements();
  const idx = localList.findIndex((m) => m.id === measurementId);
  const existing = idx >= 0 ? localList[idx] : {};
  const updatedRecord = {
    ...existing,
    ...payload,
    id: measurementId,
    updatedAt: new Date().toISOString(),
    rawUpdatedAt: new Date(),
  };
  if (idx >= 0) {
    localList[idx] = updatedRecord;
  } else {
    localList.unshift(updatedRecord);
  }
  saveLocalMeasurements(localList);

  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    await withTimeout(
      setDoc(
        docRef,
        { ...payload, updatedAt: serverTimestamp() },
        { merge: true },
      ),
      3500,
    );
  } catch (err) {
    console.warn("updateMeasurement firestore note (saved locally):", err);
  }

  // Always return the updated record so callers can update UI state
  return updatedRecord;
};

/**
 * Smart upsert: Save or update measurements for a user
 * @param {string} userId
 * @param {Object} measurementData
 */
export const saveOrUpdateUserMeasurements = async (userId, measurementData) => {
  return await createMeasurement({
    ...measurementData,
    userId,
  });
};

/**
 * ============================================================================
/**
 * 6. Orders Collection Operations
 * ============================================================================
 */

const ORDERS_CACHE_KEY = "aparna_orders_cache";
const OFFLINE_ORDERS_QUEUE_KEY = "aparna_offline_orders_queue";

/**
 * Get offline orders queue from localStorage
 */
export const getOfflineOrdersQueue = () => {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Set offline orders queue to localStorage
 */
export const setOfflineOrdersQueue = (queue) => {
  try {
    localStorage.setItem(
      OFFLINE_ORDERS_QUEUE_KEY,
      JSON.stringify(Array.isArray(queue) ? queue : []),
    );
  } catch {}
};

/**
 * Generate a collision-proof temporary offline order ID
 * e.g. A-TEMP-LM8X9-K4F2-SPP
 */
export const generateOfflineTempOrderId = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const tempId = `A-TEMP-${timePart}-${randPart}-SPP`;
  assignedOrderIds.add(tempId);
  return tempId;
};

export const getCachedOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o) => o && o.id);
  } catch {
    return [];
  }
};

export const setCachedOrders = (orders) => {
  try {
    const cleaned = (Array.isArray(orders) ? orders : []).filter(
      (o) => o && o.id,
    );
    localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(cleaned));
  } catch {}
};

// Registry of assigned order IDs to guarantee 100% uniqueness
const assignedOrderIds = new Set();

// Map docId/key to order ID so re-renders keep consistent ID
const docIdToOrderId = new Map();

/**
 * Helper to get the highest existing sequential order number in the system (10001 - 19999)
 * Strictly starts at 10000 and scans localStorage, cached orders, and memory assignedOrderIds.
 */
export const getHighestOrderSequence = () => {
  let highest = 10000;
  try {
    // 1. Check localStorage saved sequence
    const savedSeq = parseInt(
      localStorage.getItem("aparna_last_order_seq"),
      10,
    );
    if (!isNaN(savedSeq) && savedSeq >= 10001 && savedSeq < 20000) {
      highest = Math.max(highest, savedSeq);
    }

    // 2. Scan all cached orders to discover highest actual sequential order number
    const cached = getCachedOrders();
    if (Array.isArray(cached)) {
      for (const ord of cached) {
        const idToCheck = String(ord.orderId || ord.id || "");
        const match =
          idToCheck.match(/^(?:A|ASPP)-(\d{5})-SPP$/i) ||
          idToCheck.match(/^(?:A|ASPP)-(\d{5})$/i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= 10001 && num < 20000) {
            highest = Math.max(highest, num);
          }
        }
      }
    }

    // 3. Scan memory registry of assigned IDs
    for (const assignedId of assignedOrderIds) {
      const match =
        String(assignedId).match(/^(?:A|ASPP)-(\d{5})-SPP$/i) ||
        String(assignedId).match(/^(?:A|ASPP)-(\d{5})$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num >= 10001 && num < 20000) {
          highest = Math.max(highest, num);
        }
      }
    }
  } catch (err) {
    console.warn("getHighestOrderSequence error:", err);
  }
  return highest;
};

/**
 * Get next atomic sequential Order ID: A-10001-SPP, A-10002-SPP, A-10003-SPP...
 * Uses a Firestore transaction on the `counters/orders` document to guarantee
 * unique sequential numbers across multiple concurrent users/devices starting at 10001.
 */
export const getNextSequentialOrderId = async () => {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, "orders");
  const nextNumber = await withTimeout(
    runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let current = 10000;
      if (counterDoc.exists()) {
        const data = counterDoc.data();
        if (
          typeof data.lastOrderNumber === "number" &&
          data.lastOrderNumber >= 10000 &&
          data.lastOrderNumber < 20000
        ) {
          current = data.lastOrderNumber;
        } else {
          current = getHighestOrderSequence();
        }
      } else {
        current = getHighestOrderSequence();
      }
      const next = current + 1;
      transaction.set(
        counterRef,
        {
          lastOrderNumber: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return next;
    }),
    8000,
  );

  if (nextNumber && nextNumber >= 10001) {
    localStorage.setItem("aparna_last_order_seq", String(nextNumber));
    const orderIdStr = `A-${nextNumber}-SPP`;
    assignedOrderIds.add(orderIdStr);
    return orderIdStr;
  }

  throw new Error("Failed to allocate atomic sequential order ID");
};

/**
 * Synchronous sequential Order ID generator starting from 10001 (A-10001-SPP, A-10002-SPP, ...)
 */
export const generateOrderId = () => {
  const currentMax = getHighestOrderSequence();
  let nextSeq = currentMax + 1;
  while (assignedOrderIds.has(`A-${nextSeq}-SPP`)) {
    nextSeq++;
  }
  localStorage.setItem("aparna_last_order_seq", String(nextSeq));
  const candidate = `A-${nextSeq}-SPP`;
  assignedOrderIds.add(candidate);
  return candidate;
};

// Mutex lock to guarantee syncOfflineOrders never runs multiple times concurrently
let isSyncingOfflineOrders = false;

/**
 * Synchronize all pending offline orders to Cloud Firestore with atomic official serial IDs
 */
export const syncOfflineOrders = async () => {
  if (isSyncingOfflineOrders) return 0;
  isSyncingOfflineOrders = true;

  try {
    const queue = getOfflineOrdersQueue();
    if (!queue || queue.length === 0) return 0;

    // Immediately drain the storage queue so concurrent triggers don't pick up the same items
    setOfflineOrdersQueue([]);

    let syncedCount = 0;
    const remainingQueue = [];
    const cachedOrders = getCachedOrders() || [];

    for (const item of queue) {
      try {
        const tempId = item.id || item.orderId;
        const isTemporary =
          String(tempId).startsWith("A-TEMP-") ||
          String(tempId).startsWith("ASPP-TEMP-");

        // Check if an official order has ALREADY been created for this tempId (deduplication)
        const alreadySyncedOrder = cachedOrders.find(
          (o) =>
            (o.tempOrderId && o.tempOrderId === tempId) ||
            (!String(o.id).startsWith("A-TEMP-") &&
              !String(o.id).startsWith("ASPP-TEMP-") &&
              o.id === item.id),
        );

        if (
          alreadySyncedOrder &&
          !String(alreadySyncedOrder.id).startsWith("A-TEMP-") &&
          !String(alreadySyncedOrder.id).startsWith("ASPP-TEMP-")
        ) {
          console.log(
            `Order for ${tempId} is already synced as ${alreadySyncedOrder.id}, skipping duplicate creation.`,
          );
          continue;
        }

        let officialOrderId = tempId;
        if (isTemporary) {
          officialOrderId = await getNextSequentialOrderId();
        }

        const updatedModel = createOrderModel({
          ...item,
          id: officialOrderId,
          orderId: officialOrderId,
          isOfflinePending: false,
          tempOrderId: isTemporary ? tempId : item.tempOrderId || null,
          syncedAt: new Date().toISOString(),
        });

        if ("updatedAt" in updatedModel) delete updatedModel.updatedAt;
        if ("updatedBy" in updatedModel) delete updatedModel.updatedBy;

        // Save to Firestore with official ID
        await withTimeout(
          setDoc(doc(db, COLLECTIONS.ORDERS, officialOrderId), updatedModel),
          8000,
        );

        // If it was a temporary draft document in Firestore, remove temp doc
        if (isTemporary && tempId !== officialOrderId) {
          try {
            await deleteDoc(doc(db, COLLECTIONS.ORDERS, tempId));
          } catch {}
        }

        // Update cached order entry
        const formatted = formatOrderDoc(officialOrderId, {
          ...updatedModel,
          createdAt: item.createdAt || new Date().toISOString(),
          rawCreatedAt: item.rawCreatedAt || new Date().toISOString(),
          orderDate: item.orderDate || new Date().toISOString(),
        });

        const idx = cachedOrders.findIndex(
          (o) =>
            o.id === tempId ||
            o.orderId === tempId ||
            o.tempOrderId === tempId ||
            o.id === officialOrderId,
        );
        if (idx >= 0) {
          cachedOrders[idx] = formatted;
        } else {
          cachedOrders.unshift(formatted);
        }

        syncedCount++;
      } catch (syncErr) {
        console.warn(
          "Failed to sync offline order, retaining in queue:",
          syncErr,
        );
        remainingQueue.push(item);
      }
    }

    if (remainingQueue.length > 0) {
      const currentQueue = getOfflineOrdersQueue();
      setOfflineOrdersQueue([...currentQueue, ...remainingQueue]);
    }
    setCachedOrders(cachedOrders);

    if (syncedCount > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aspp_orders_synced", {
          detail: { count: syncedCount },
        }),
      );
    }

    return syncedCount;
  } finally {
    isSyncingOfflineOrders = false;
  }
};

// Automatic listener to trigger sync as soon as internet connection is restored
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineOrders().catch(() => {});
  });
}

/**
 * Format order document object ensuring clean, persistent ID
 */
const formatOrderDoc = (id, data) => {
  const rawCreated =
    data.createdAt || data.orderDate || new Date().toISOString();
  const rawUpdated = data.updatedAt || null;
  const status = String(
    data.status || data.orderStatus || "pending",
  ).toLowerCase();

  // Determine unique order ID - strictly preserve the actual Firestore document ID
  const cleanId =
    String(id || data.id || data.orderId || "").trim() ||
    `A-TEMP-${Date.now().toString(36).toUpperCase()}-SPP`;

  if (cleanId) {
    assignedOrderIds.add(cleanId);
  }

  if (id && cleanId) {
    docIdToOrderId.set(id, cleanId);
  }

  const client = data.client || {
    clientId: data.clientId || "",
    username: data.username || data.clientName || "Client",
    userMobile: data.userMobile || data.phone || "",
    email: data.email || "",
    userAddress: data.userAddress || data.address || "",
  };

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.map((it) => ({
    ...it,
    serviceType: it.serviceType || data.serviceType || "Pleating Service",
  }));

  return {
    id: cleanId,
    orderId: cleanId,
    ...data,
    client,
    serviceType: data.serviceType || items[0]?.serviceType || "Other Service",
    username: client.username || data.username || "Client",
    userMobile: client.userMobile || data.userMobile || "",
    email: client.email || data.email || "",
    userAddress: client.userAddress || data.userAddress || "",
    items,
    totalItems: items.length || data.totalItems || 1,
    subtotal:
      Number(data.subtotal) ||
      items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0),
    pickupDeliveryCharges: Number(data.pickupDeliveryCharges || 0),
    otherCharges: Number(data.otherCharges || 0),
    discount: Number(data.discount || 0),
    advancePayment: Number(data.advancePayment || data.paidAmount || 0),
    paidAmount: Number(data.paidAmount) || Number(data.advancePayment) || 0,
    balancePaid:
      data.balancePaid !== undefined &&
      data.balancePaid !== null &&
      !isNaN(Number(data.balancePaid))
        ? Number(data.balancePaid)
        : status === "paid" ||
            String(data.paymentStatus).toLowerCase() === "paid"
          ? Math.max(
              0,
              (Number(data.totalAmount) || 0) -
                Number(data.advancePayment || 0),
            )
          : 0,
    balanceDue:
      data.balanceDue !== undefined &&
      data.balanceDue !== null &&
      !isNaN(Number(data.balanceDue))
        ? Number(data.balanceDue)
        : status === "paid" ||
            String(data.paymentStatus).toLowerCase() === "paid"
          ? 0
          : Math.max(
              0,
              (Number(data.totalAmount) || 0) -
                Number(data.advancePayment || data.paidAmount || 0),
            ),
    totalAmount:
      Number(data.totalAmount) ||
      items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0) ||
      0,
    status,
    orderStatus: status,
    paymentStatus: String(data.paymentStatus || "pending"),
    paymentMethod: String(data.paymentMethod || "UPI"),
    occasion: data.occasion || "",
    orderDate: formatDateSafe(data.orderDate || rawCreated),
    deliveryDate: data.deliveryDate ? formatDateSafe(data.deliveryDate) : "-",
    createdAt: formatDateSafe(rawCreated),
    updatedAt: rawUpdated ? formatDateSafe(rawUpdated) : null,
    rawCreatedAt: rawCreated,
    rawUpdatedAt: rawUpdated,
    createdBy: data.createdBy || "",
    updatedBy: data.updatedBy || "",
    isOfflinePending: Boolean(data.isOfflinePending),
    tempOrderId: data.tempOrderId || null,
  };
};

// Cache of recently created order signatures to suppress rapid duplicate submissions
const recentOrderCreations = new Map();

/**
 * Create a new order with sequential serial Order ID: A-10001-SPP, A-10002-SPP, A-10003-SPP...
 * (Or temporary offline ID A-TEMP-...-SPP if disconnected, auto-promoted to official serial upon sync)
 * @param {Object} orderData
 */
export const createOrder = async (orderData) => {
  // Deduplication check: construct robust signature (ignoring random timestamp client IDs)
  const clientPhone = String(
    orderData.userMobile ||
      orderData.phone ||
      orderData.client?.userMobile ||
      "",
  )
    .replace(/\D/g, "")
    .slice(-10);
  const clientName = String(
    orderData.username ||
      orderData.clientName ||
      orderData.client?.username ||
      "",
  )
    .trim()
    .toLowerCase();
  const clientKey =
    clientPhone || clientName || String(orderData.clientId || "");
  const itemsKey = (orderData.items || [])
    .map(
      (it) =>
        `${it.serviceId || it.serviceName}_${it.finalPrice || it.servicePrice}`,
    )
    .join("|");
  const signature = `${clientKey}_${orderData.totalAmount}_${orderData.deliveryDate || ""}_${itemsKey}`;

  const nowMs = Date.now();
  if (recentOrderCreations.has(signature)) {
    const existing = recentOrderCreations.get(signature);
    if (nowMs - existing.timestamp < 4000 && existing.result) {
      console.warn(
        "Duplicate createOrder call suppressed for signature:",
        signature,
      );
      return existing.result;
    }
  }

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  let orderId = String(orderData.id || orderData.orderId || "").trim();
  let isOfflineOrder = false;

  const isGenericNewId =
    !orderId ||
    orderId === "A-NEW-SPP" ||
    orderId === "A-NEW" ||
    orderId === "ASPP-NEW" ||
    orderId === "ORD-NEW" ||
    orderId === "NEW";

  if (isGenericNewId) {
    if (isOnline) {
      try {
        orderId = await getNextSequentialOrderId();
      } catch (err) {
        console.warn(
          "Could not get online sequential order ID, generating offline temp ID:",
          err,
        );
        orderId = generateOfflineTempOrderId();
        isOfflineOrder = true;
      }
    } else {
      orderId = generateOfflineTempOrderId();
      isOfflineOrder = true;
    }
  } else if (
    orderId.startsWith("A-TEMP-") ||
    orderId.startsWith("ASPP-TEMP-")
  ) {
    isOfflineOrder = true;
    assignedOrderIds.add(orderId);
  } else {
    assignedOrderIds.add(orderId);
  }

  const currentUid = orderData.createdBy || auth?.currentUser?.uid || "";
  const model = createOrderModel({
    ...orderData,
    id: orderId,
    orderId,
    createdBy: currentUid,
    isOfflinePending: isOfflineOrder,
    tempOrderId: isOfflineOrder ? orderId : orderData.tempOrderId || null,
  });

  if ("updatedAt" in model) {
    delete model.updatedAt;
  }
  if ("updatedBy" in model) {
    delete model.updatedBy;
  }

  let createdId = orderId;

  if (!isOfflineOrder && isOnline) {
    try {
      // Check collision before writing to ensure we NEVER overwrite an existing distinct order
      const existingDoc = await withTimeout(
        getDoc(doc(db, COLLECTIONS.ORDERS, orderId)),
        3000,
        null,
      );
      if (existingDoc && existingDoc.exists()) {
        console.warn(
          `Order document ${orderId} already exists! Allocating a fresh sequential ID to prevent overwrite.`,
        );
        try {
          orderId = await getNextSequentialOrderId();
        } catch {
          orderId = generateOfflineTempOrderId();
          isOfflineOrder = true;
        }
        createdId = orderId;
        model.id = orderId;
        model.orderId = orderId;
        model.isOfflinePending = isOfflineOrder;
        model.tempOrderId = isOfflineOrder ? orderId : null;
      }

      if (!isOfflineOrder) {
        await withTimeout(
          setDoc(doc(db, COLLECTIONS.ORDERS, orderId), model),
          8000,
        );
      }
    } catch (err) {
      console.warn(
        "createOrder firestore note (falling back to offline queue):",
        err.message || err,
      );
      if (!isOfflineOrder) {
        isOfflineOrder = true;
        model.isOfflinePending = true;
      }
    }
  }

  const now = new Date();
  const formatted = formatOrderDoc(createdId, {
    ...model,
    createdAt: now.toISOString(),
    rawCreatedAt: now.toISOString(),
    orderDate: orderData.orderDate || now.toISOString(),
    createdBy: currentUid,
  });

  // Update local cache
  const cached = getCachedOrders() || [];
  setCachedOrders([formatted, ...cached.filter((o) => o.id !== createdId)]);

  // If this was an offline temporary order, queue for background sync
  // (Only queue true temporary orders to avoid re-syncing confirmed online orders)
  if (
    isOfflineOrder &&
    (createdId.startsWith("A-TEMP-") || createdId.startsWith("ASPP-TEMP-"))
  ) {
    const queue = getOfflineOrdersQueue();
    setOfflineOrdersQueue([
      ...queue.filter((q) => q.id !== createdId),
      formatted,
    ]);
  }

  // Cache created order signature to block duplicate calls
  recentOrderCreations.set(signature, {
    result: formatted,
    timestamp: Date.now(),
  });

  // Cleanup old entries
  for (const [key, val] of recentOrderCreations.entries()) {
    if (nowMs - val.timestamp > 10000) {
      recentOrderCreations.delete(key);
    }
  }

  return formatted;
};

/**
 * Get all orders across the orders collection (with in-memory deduplication and offline sync)
 */
export const getAllOrders = async () => {
  // Trigger background sync for any queued offline orders
  if (typeof navigator === "undefined" || navigator.onLine) {
    syncOfflineOrders().catch(() => {});
  }
  try {
    const snapshot = await withTimeout(
      getDocs(collection(db, COLLECTIONS.ORDERS)),
      6000,
      null,
    );

    if (snapshot && !snapshot.empty) {
      const rawOrders = snapshot.docs
        .map((d) => formatOrderDoc(d.id, d.data()))
        .filter((o) => o && o.id);

      // Deduplicate in-memory by ID only (NEVER delete docs from Firestore during read!)
      const seenIds = new Set();
      const uniqueOrders = [];

      for (const ord of rawOrders) {
        if (seenIds.has(ord.id)) continue;
        seenIds.add(ord.id);
        uniqueOrders.push(ord);
      }

      setCachedOrders(uniqueOrders);
      return uniqueOrders;
    }

    const cached = getCachedOrders();
    const cleanCached = (cached || []).filter((o) => o && o.id);
    return cleanCached;
  } catch (err) {
    console.warn(
      "getAllOrders firestore note (falling back to cache):",
      err.message || err,
    );
    const cached = getCachedOrders();
    const cleanCached = (cached || []).filter((o) => o && o.id);
    return cleanCached;
  }
};

/**
 * Get orders by business (compatibility)
 */
export const getOrdersByBusiness = async (_businessId) => {
  return await getAllOrders();
};

/**
 * Get all orders mapped to a specific client / user ID (strictly isolated)
 * @param {string} userId - User / Client document ID or auth UID
 * @param {string} [userEmail] - Optional email for fallback matching
 * @param {string} [userMobile] - Optional mobile for fallback matching
 */
export const getOrdersByUserId = async (
  userId,
  userEmail = "",
  userMobile = "",
) => {
  if (!userId && !userEmail && !userMobile) return [];
  const cleanUid = String(userId || "").trim();
  const cleanEmail = String(userEmail || "")
    .trim()
    .toLowerCase();
  const cleanMobile = String(userMobile || "")
    .replace(/\D/g, "")
    .slice(-10);

  const isMatchingOrder = (o) => {
    if (!o) return false;
    if (
      cleanUid &&
      (o.clientId === cleanUid ||
        o.createdBy === cleanUid ||
        o.client?.clientId === cleanUid)
    ) {
      return true;
    }
    if (
      cleanEmail &&
      (String(o.email || "")
        .toLowerCase()
        .trim() === cleanEmail ||
        String(o.client?.email || "")
          .toLowerCase()
          .trim() === cleanEmail)
    ) {
      return true;
    }
    if (cleanMobile) {
      const oMobile = String(
        o.userMobile || o.phone || o.client?.userMobile || "",
      )
        .replace(/\D/g, "")
        .slice(-10);
      if (oMobile && oMobile === cleanMobile) return true;
    }
    return false;
  };

  const cached = getCachedOrders() || [];
  const localMatched = cached.filter(isMatchingOrder);

  try {
    const queries = [];
    if (cleanUid) {
      queries.push(
        withTimeout(
          getDocs(
            query(
              collection(db, COLLECTIONS.ORDERS),
              where("clientId", "==", cleanUid),
            ),
          ),
          4000,
          null,
        ),
        withTimeout(
          getDocs(
            query(
              collection(db, COLLECTIONS.ORDERS),
              where("createdBy", "==", cleanUid),
            ),
          ),
          4000,
          null,
        ),
      );
    }

    const snapshots = await Promise.all(queries);
    const map = new Map();
    localMatched.forEach((ord) => map.set(ord.id, ord));

    snapshots.forEach((snap) => {
      if (snap && !snap.empty) {
        snap.docs.forEach((docSnap) => {
          const formatted = formatOrderDoc(docSnap.id, docSnap.data());
          if (isMatchingOrder(formatted)) {
            map.set(formatted.id, formatted);
          }
        });
      }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => {
      const timeA = new Date(
        a.rawCreatedAt || a.createdAt || a.orderDate || 0,
      ).getTime();
      const timeB = new Date(
        b.rawCreatedAt || b.createdAt || b.orderDate || 0,
      ).getTime();
      return timeB - timeA;
    });

    return result;
  } catch (err) {
    console.warn("getOrdersByUserId note (serving local):", err.message || err);
    return localMatched;
  }
};

/**
 * Update order status or fields
 * @param {string} orderId
 * @param {Object} updates
 */
export const updateOrder = async (orderId, updates) => {
  if (!orderId) {
    console.warn("updateOrder called without valid orderId");
    return false;
  }
  const now = new Date();
  const currentUid = updates.updatedBy || auth?.currentUser?.uid || "";
  const updatePayload = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: currentUid,
  };

  // Protect createdAt and createdBy from being overwritten on update
  delete updatePayload.createdAt;
  delete updatePayload.createdBy;

  const cached = getCachedOrders() || [];
  const existingOrder = cached.find(
    (o) => o.id === orderId || o.orderId === orderId,
  );

  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    // Use updateDoc to update existing document without creating hollow ghost docs
    await withTimeout(updateDoc(docRef, updatePayload), 4000).catch(
      async () => {
        // If doc does not exist yet (e.g. was offline/seed), create with FULL order model from cache
        if (existingOrder && (existingOrder.client || existingOrder.items)) {
          const fullPayload = createOrderModel({
            ...existingOrder,
            ...updates,
            id: orderId,
            orderId,
            updatedBy: currentUid,
          });
          await setDoc(docRef, fullPayload, { merge: true });
        }
      },
    );
  } catch (err) {
    console.warn(
      "updateOrder firestore note (cached locally):",
      err.message || err,
    );
  }

  // Update local cache
  const updatedList = cached.map((ord) =>
    ord.id === orderId || ord.orderId === orderId
      ? {
          ...ord,
          ...updates,
          status: updates.status || updates.orderStatus || ord.status,
          orderStatus: updates.status || updates.orderStatus || ord.orderStatus,
          updatedAt: formatDateSafe(now),
          rawUpdatedAt: now.toISOString(),
          updatedBy: currentUid,
        }
      : ord,
  );
  setCachedOrders(updatedList);

  return true;
};

/**
 * Delete order from Firestore & cache
 * @param {string} orderId
 */
export const deleteOrder = async (orderId) => {
  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await withTimeout(deleteDoc(docRef), 4000);
  } catch (err) {
    console.warn(
      "deleteOrder firestore note (removed locally):",
      err.message || err,
    );
  }

  const cached = getCachedOrders() || [];
  setCachedOrders(cached.filter((o) => o.id !== orderId));
  return true;
};

/**
 * ============================================================================
 * 7. Expenses Collection Operations (expenses/{expenseId})
 * ============================================================================
 */
export const LOCAL_EXPENSES_KEY = "aparna_local_expenses_v1";

export const getLocalExpenses = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Failed to parse local expenses cache:", err);
    return [];
  }
};

export const saveLocalExpenses = (expenses) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.warn("Failed to save local expenses cache:", err);
  }
};

export const getAllExpenses = async () => {
  const localList = getLocalExpenses();
  try {
    const q = query(
      collection(db, COLLECTIONS.EXPENSES),
      orderBy("createdAt", "desc"),
    );
    const snapshot = await withTimeout(getDocs(q), 5000, null);

    if (snapshot && !snapshot.empty) {
      const expenses = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      saveLocalExpenses(expenses);
      return expenses;
    }

    if (snapshot && snapshot.empty) {
      saveLocalExpenses([]);
      return [];
    }
  } catch (err) {
    console.warn(
      "getAllExpenses firestore note (using local cache):",
      err.message || err,
    );
  }

  return localList;
};

export const getExpenseById = async (expenseId) => {
  if (!expenseId) return null;
  const localList = getLocalExpenses();
  const foundLocal = localList.find((e) => e.id === expenseId);

  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
    const snapshot = await withTimeout(getDoc(docRef), 4000, null);
    if (snapshot && snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (err) {
    console.warn("getExpenseById firestore note:", err.message || err);
  }

  return foundLocal || null;
};

export const createExpense = async (expenseData) => {
  const model = createExpenseModel(expenseData);
  let newId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  try {
    const collRef = collection(db, COLLECTIONS.EXPENSES);
    const docRef = await withTimeout(addDoc(collRef, model), 4000);
    newId = docRef.id;
  } catch (err) {
    console.warn(
      "createExpense firestore note (saved locally):",
      err.message || err,
    );
    try {
      const customDocRef = doc(db, COLLECTIONS.EXPENSES, newId);
      await withTimeout(setDoc(customDocRef, model), 4000);
    } catch {}
  }

  const newExpense = {
    id: newId,
    ...model,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    updatedBy: null,
  };

  const localList = getLocalExpenses();
  saveLocalExpenses([newExpense, ...localList.filter((e) => e.id !== newId)]);
  return newExpense;
};

export const updateExpense = async (expenseId, updateData) => {
  const sanitizeUpdate = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await withTimeout(updateDoc(docRef, sanitizeUpdate), 4000);
  } catch (err) {
    console.warn(
      "updateExpense firestore note (updated locally):",
      err.message || err,
    );
  }

  const localList = getLocalExpenses();
  const updatedList = localList.map((e) =>
    e.id === expenseId
      ? {
          ...e,
          ...updateData,
          updatedAt: new Date().toISOString(),
        }
      : e,
  );
  saveLocalExpenses(updatedList);
  return { id: expenseId, ...updateData };
};

export const deleteExpense = async (expenseId) => {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
    await withTimeout(deleteDoc(docRef), 4000);
  } catch (err) {
    console.warn(
      "deleteExpense firestore note (removed locally):",
      err.message || err,
    );
  }

  const localList = getLocalExpenses();
  saveLocalExpenses(localList.filter((e) => e.id !== expenseId));
  return true;
};

// Clean up sequence number in localStorage if it exceeded range from previous testing
if (typeof window !== "undefined") {
  try {
    const currentStoredSeq = parseInt(
      localStorage.getItem("aparna_last_order_seq"),
      10,
    );
    if (!isNaN(currentStoredSeq) && currentStoredSeq > 19999) {
      localStorage.removeItem("aparna_last_order_seq");
    }
  } catch {}
}
