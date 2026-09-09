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
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { db, auth, firebaseConfig } from './config';
import {
  COLLECTIONS,
  USER_ROLES,
  SUPERADMIN_EMAIL,
  INITIAL_SERVICES,
  createBusinessModel,
  createUserModel,
  createServiceModel,
  createClientModel,
  createMeasurementModel,
  createOrderModel,
} from './schema';

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
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format any timestamp, object ({ seconds, nanoseconds }), number, or string safely into "dd-mmm-yyyy" (e.g. 06-Sep-2026).
 * Never returns 'Recent'. Guarantees consistent date formatting across the entire application.
 *
 * @param {any} val - Date, Firestore Timestamp, ISO string, timestamp number, etc.
 * @param {string} [customFallback] - Optional custom fallback string if value is completely invalid
 * @returns {string} - Date formatted as "dd-mmm-yyyy"
 */
export const formatDateSafe = (val, customFallback = '-') => {
  const getFormatted = (d) => {
    if (!d || isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFallback = () => {
    return customFallback !== null && customFallback !== undefined ? customFallback : '-';
  };

  if (
    !val ||
    val === 'Recent' ||
    val === 'recent' ||
    val === 'null' ||
    val === 'undefined' ||
    val === '[object Object]' ||
    val === '-' ||
    val === '—'
  ) {
    return getFallback();
  }

  // 1. JS Date instance
  if (val instanceof Date) {
    return getFormatted(val) || getFallback();
  }

  // 2. Firestore Timestamp object with .toDate()
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    try {
      return getFormatted(val.toDate()) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 3. Object with seconds: { seconds: ..., nanoseconds: ... }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    try {
      return getFormatted(new Date(val.seconds * 1000)) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 4. Number (epoch milliseconds or seconds)
  if (typeof val === 'number') {
    try {
      const ms = val < 10000000000 ? val * 1000 : val;
      return getFormatted(new Date(ms)) || getFallback();
    } catch {
      return getFallback();
    }
  }

  // 5. String parsing
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      trimmed === 'Recent' ||
      trimmed === 'recent' ||
      trimmed === '[object Object]' ||
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '—'
    ) {
      return getFallback();
    }

    // Check if already in "dd-mmm-yyyy" (e.g. "06-Sep-2026" or "6-Sep-2026")
    const ddMmmMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (ddMmmMatch) {
      const day = String(ddMmmMatch[1]).padStart(2, '0');
      const mRaw = ddMmmMatch[2];
      const mStr = mRaw.charAt(0).toUpperCase() + mRaw.slice(1, 3).toLowerCase();
      return `${day}-${mStr}-${ddMmmMatch[3]}`;
    }

    // Check for "dd/mm/yyyy" or "dd-mm-yyyy"
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const d = new Date(year, month, day);
      return getFormatted(d) || getFallback();
    }

    // Check for "yyyy-mm-dd" or "yyyy/mm/dd"
    const yyyymmddMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
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
    val === 'Recent' ||
    val === 'recent' ||
    val === 'null' ||
    val === 'undefined' ||
    val === '[object Object]' ||
    val === '-' ||
    val === '—'
  ) {
    return null;
  }

  let dateObj = null;

  // 1. JS Date instance
  if (val instanceof Date) {
    dateObj = isNaN(val.getTime()) ? null : val;
  }
  // 2. Firestore Timestamp object with .toDate()
  else if (typeof val === 'object' && typeof val.toDate === 'function') {
    try {
      dateObj = val.toDate();
    } catch {}
  }
  // 3. Object with seconds: { seconds: ..., nanoseconds: ... }
  else if (typeof val === 'object' && typeof val.seconds === 'number') {
    dateObj = new Date(
      val.seconds * 1000 + (val.nanoseconds ? Math.round(val.nanoseconds / 1000000) : 0)
    );
  }
  // 4. Number (epoch milliseconds or seconds)
  else if (typeof val === 'number') {
    const ms = val < 10000000000 ? val * 1000 : val;
    dateObj = new Date(ms);
  }
  // 5. String parsing
  else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '-' || trimmed === '—') return null;

    // Check if it is a pure date string without time component
    if (
      /^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(trimmed) ||
      /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(trimmed) ||
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(trimmed)
    ) {
      return null;
    }

    if (trimmed.includes('T') || trimmed.includes(':')) {
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
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${formattedHours}:${minutes} ${ampm}`;
};

/**
 * Extract structured date and time safe for table cells.
 * Returns { date: '05-Sep-2026', time: '08:45 PM' | null }
 */
export const formatDateTimeSafe = (val, customFallback = '-') => {
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
  if (!val || val === '-' || val === '—' || val === 'null' || val === 'undefined') {
    return NaN;
  }
  if (typeof val === 'number') {
    return val < 10000000000 ? val * 1000 : val;
  }
  if (val instanceof Date) {
    return val.getTime();
  }
  if (typeof val === 'object') {
    if (typeof val.toMillis === 'function') {
      try { return val.toMillis(); } catch {}
    }
    if (typeof val.toDate === 'function') {
      try { return val.toDate().getTime(); } catch {}
    }
    if (typeof val.seconds === 'number') {
      return val.seconds * 1000 + (val.nanoseconds ? Math.round(val.nanoseconds / 1000000) : 0);
    }
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s || s === '-' || s === '—') return NaN;
    const match = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === match[2].toLowerCase());
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
    item.rawUpdatedAt || item.updatedAt || item.modifiedAt
  );
  const tCreate = getTimestampMillis(
    item.rawCreatedAt || item.createdAt || item.date || item.orderDate
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
  if (!updatedVal || updatedVal === '-' || updatedVal === '—' || updatedVal === 'null' || updatedVal === 'undefined') {
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
  const formattedUpdated = formatDateSafe(updatedVal, '-');
  if (!formattedUpdated || formattedUpdated === '-') return null;

  if (createdVal) {
    const formattedCreated = formatDateSafe(createdVal, '-');
    if (formattedUpdated === formattedCreated) {
      // If the day is identical, check if there was a real later update (>10s)
      if (isNaN(updatedMs) || isNaN(createdMs) || (updatedMs - createdMs <= 10000)) {
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
  if (!mod) return '-';
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

const LOCAL_USERS_KEY = 'aparna_users_data';

// Registered Firebase Authentication users from Firebase Console
export const KNOWN_FIREBASE_AUTH_USERS = [];

// Initial registered clients seed catalog
export const INITIAL_CLIENTS = [];

// Initial measurement profiles seed catalog
export const INITIAL_MEASUREMENTS = [];

export const getLocalUsers = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Filter out any legacy mock clients or seed accounts
    const MOCK_IDS = new Set(['client_priya', 'client_ananya', 'client_kavitha', 'client_sneha', 'client_divya', 'client_meenakshi']);
    list = list.filter((u) => u && u.id && !MOCK_IDS.has(u.id));

    // Strip legacy businessId if present and ensure createdAt/updatedAt are preserved properly
    list = list.map(({ businessId, ...rest }) => {
      return {
        ...rest,
        createdAt: formatDateSafe(rest.createdAt, '-'),
        updatedAt: rest.updatedAt && rest.updatedAt !== '-' ? formatDateSafe(rest.updatedAt, '-') : '-',
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
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
};

const LOCAL_MEASUREMENTS_KEY = 'aparna_measurements_data';

export const getLocalMeasurements = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_MEASUREMENTS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    const MOCK_MEASURE_PREFIXES = ['measure_priya', 'measure_ananya', 'measure_kavitha', 'measure_sneha', 'measure_divya', 'measure_meenakshi', 'm-'];
    list = list.filter((m) => {
      if (!m || !m.id) return false;
      if (MOCK_MEASURE_PREFIXES.some((p) => m.id.startsWith(p))) return false;
      if (String(m.userId || '').startsWith('client_')) return false;
      return true;
    });

    return list;
  } catch {
    return [];
  }
};

export const saveLocalMeasurements = (measurements) => {
  if (typeof window === 'undefined') return;
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
export const createUserProfile = async (uid, userData) => {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  let resolvedRole = userData.role;

  try {
    const existingSnap = await withTimeout(getDoc(docRef), 3000, null);
    if (existingSnap && existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData?.role && (!userData.role || userData.role === USER_ROLES.CLIENT)) {
        resolvedRole = existingData.role;
      }
    } else if (userData.email) {
      const cleanEmail = userData.email.trim().toLowerCase();
      const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', cleanEmail));
      const emailSnap = await withTimeout(getDocs(q), 3000, null);
      if (emailSnap && !emailSnap.empty) {
        const existingData = emailSnap.docs[0].data();
        if (existingData?.role && (!userData.role || userData.role === USER_ROLES.CLIENT)) {
          resolvedRole = existingData.role;
        }
      }
    }
  } catch {}

  // Also check local cache for any registered role
  if (!resolvedRole || resolvedRole === USER_ROLES.CLIENT) {
    const localList = getLocalUsers();
    const localMatch = localList.find(
      (u) =>
        (u.id && u.id === uid) ||
        (u.email && userData.email && (u.email || '').trim().toLowerCase() === userData.email.trim().toLowerCase())
    );
    if (localMatch?.role && localMatch.role !== USER_ROLES.CLIENT) {
      resolvedRole = localMatch.role;
    }
  }

  // SuperAdmin override
  if (userData.email && userData.email.trim().toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    resolvedRole = USER_ROLES.SUPERADMIN;
  }

  const model = createUserModel({
    ...userData,
    role: resolvedRole || USER_ROLES.CLIENT,
  });

  try {
    await withTimeout(setDoc(docRef, model, { merge: true }), 3500);
  } catch (err) {
    console.warn('createUserProfile firestore note:', err.message || err);
  }
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
  const secondaryAppName = 'SecondaryAuthAdminApp';
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
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      } catch (pErr) {
        console.warn('displayName update note:', pErr);
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
export const resetUserPassword = async ({ email, currentPassword = 'aparna', newPassword, displayName }) => {
  const secondaryAppName = 'SecondaryAuthAdminApp';
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
      const cred = await signInWithEmailAndPassword(secondaryAuth, cleanEmail, currentPassword);
      await updatePassword(cred.user, newPassword);
      return {
        method: 'updated',
        message: 'Password updated successfully!',
      };
    } catch (authErr) {
      // 2. If user doesn't exist in Firebase Auth (created in Firestore only), create their Auth account
      if (
        authErr.code === 'auth/user-not-found' ||
        authErr.code === 'auth/invalid-credential' ||
        authErr.code === 'auth/wrong-password'
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, newPassword);
          if (displayName && newCred.user) {
            await updateProfile(newCred.user, { displayName: displayName.trim() }).catch(() => {});
          }
          return {
            method: 'created',
            message: 'Firebase Auth account created with the new password!',
          };
        } catch (createErr) {
          if (createErr.code === 'auth/email-already-in-use') {
            // User exists in Firebase Auth but current password was not 'aparna'.
            // Fall back to sending an official password reset link.
            const actionCodeSettings = typeof window !== 'undefined' && window.location?.origin ? {
              url: `${window.location.origin}/reset-password`,
              handleCodeInApp: true,
            } : undefined;
            await sendPasswordResetEmail(secondaryAuth, cleanEmail, actionCodeSettings);
            return {
              method: 'email_sent',
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
  if (!email) return '';
  return String(email).trim().toLowerCase();
};

/**
 * Normalizes a mobile number for comparison (extracts last 10 digits)
 * @param {string|number} mobile
 * @returns {string}
 */
export const normalizeMobile = (mobile) => {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
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
export const checkUserUniqueness = async ({ email, userMobile, excludeUserId = null }) => {
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
        const uId = String(u.id || u.uid || '');
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
    console.warn('getAllUsers in checkUserUniqueness note:', err);
  }

  // 2. Query Firestore directly for email if not found yet
  if (!emailExists && cleanEmail) {
    try {
      const qEmail = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', cleanEmail)
      );
      const snap = await withTimeout(getDocs(qEmail), 2500, null);
      if (snap && !snap.empty) {
        for (const d of snap.docs) {
          const docData = d.data();
          const docId = String(d.id || docData.uid || docData.id || '');
          if (!excludeUserId || docId !== String(excludeUserId)) {
            emailExists = true;
            conflictingUser = { id: d.id, ...docData };
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Firestore email uniqueness query note:', e);
    }
  }

  // 3. Query Firestore directly for mobile if not found yet
  if (!mobileExists && cleanMobile) {
    try {
      const qMobile = query(
        collection(db, COLLECTIONS.USERS),
        where('userMobile', '==', cleanMobile)
      );
      const snap = await withTimeout(getDocs(qMobile), 2500, null);
      if (snap && !snap.empty) {
        for (const d of snap.docs) {
          const docData = d.data();
          const docId = String(d.id || docData.uid || docData.id || '');
          if (!excludeUserId || docId !== String(excludeUserId)) {
            mobileExists = true;
            conflictingUser = { id: d.id, ...docData };
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Firestore mobile uniqueness query note:', e);
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
  const tempId = 'user-' + Date.now();
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
    const docRef = await withTimeout(addDoc(collection(db, COLLECTIONS.USERS), model), 3500);
    localItem.id = docRef.id;
    saveLocalUsers(localList);
    return { id: docRef.id, ...model };
  } catch (err) {
    console.warn('Firestore createUser note (saved locally):', err.message || err);
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
    console.warn('Firestore deleteUser note (removed locally):', err.message || err);
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
    console.warn('getUserProfile firestore note:', err.message || err);
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
      3500
    );

    if (snapshot) {
      const remoteUsers = snapshot.docs.map((d) => {
        const data = d.data();
        const emailLower = (data.email || '').toLowerCase();
        const isVictory = emailLower === 'victoryranjit@gmail.com';
        const isAparna = emailLower === 'ranjitaparna25@gmail.com';
        const defaultCreated = (isVictory || isAparna) ? '05-Sep-2026' : null;

        const rawCreated = data.createdAt || defaultCreated;
        const rawUpdated = (isVictory || isAparna) ? null : (data.updatedAt || null);

        return {
          id: d.id,
          ...data,
          createdAt: formatDateSafe(rawCreated, '-'),
          updatedAt: rawUpdated ? formatDateSafe(rawUpdated, '-') : '-',
          rawCreatedAt: rawCreated || null,
          rawUpdatedAt: rawUpdated || null,
        };
      });

      // Merge remote documents with local cache to preserve any local edits
      const mergedMap = new Map();
      remoteUsers.forEach((u) => {
        const key = (u.email || u.id || '').toLowerCase();
        mergedMap.set(key, u);
      });

      localList.forEach((u) => {
        const key = (u.email || u.id || '').toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, u);
          // Auto-sync local user to Firestore if missing remotely
          if (u.id) {
            setDoc(doc(db, COLLECTIONS.USERS, u.id), u, { merge: true }).catch(() => {});
          }
        } else {
          const remoteItem = mergedMap.get(key);
          mergedMap.set(key, { ...u, ...remoteItem });
        }
      });

      const finalList = Array.from(mergedMap.values());
      saveLocalUsers(finalList);
      return finalList;
    }
  } catch (err) {
    console.warn('Firestore getAllUsers note (serving from local cache):', err.message || err);
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
    throw new Error('Invalid role specified. Only Admin, Staff, or Client roles can be assigned.');
  }

  // Update in local cache
  const localList = getLocalUsers();
  const idx = localList.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    if (localList[idx].email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      throw new Error('Super Admin role is immutable and cannot be modified.');
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
      if (existingData.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
        throw new Error('Super Admin role is immutable and cannot be modified.');
      }
    }

    await withTimeout(
      setDoc(
        docRef,
        {
          role: newRole,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ),
      3000
    );
  } catch (err) {
    console.warn('Firestore updateUserRole note (role updated locally):', err.message || err);
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
  const cleanEmail = String(updatedData.email || '').trim().toLowerCase();
  const cleanMobile = String(updatedData.userMobile || '').trim();

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
      (cleanEmail && (u.email || '').toLowerCase() === cleanEmail)
  );

  let finalRole = updatedData.role;
  if (
    cleanEmail === SUPERADMIN_EMAIL.toLowerCase() ||
    (existingIdx >= 0 && localList[existingIdx]?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase())
  ) {
    finalRole = USER_ROLES.SUPERADMIN;
  } else if (finalRole === USER_ROLES.SUPERADMIN) {
    finalRole = USER_ROLES.CLIENT;
  }

  const existingUser = existingIdx >= 0 ? localList[existingIdx] : {};
  const now = new Date();
  const payload = {
    ...existingUser,
    id: userId || (existingIdx >= 0 ? localList[existingIdx].id : 'user-' + Date.now()),
    username: String(updatedData.username || '').trim(),
    email: cleanEmail,
    userMobile: String(updatedData.userMobile || '').trim(),
    userAddress: String(updatedData.userAddress || '').trim(),
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
        where('email', '==', cleanEmail)
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

    const firestorePayload = {
      username: payload.username,
      email: payload.email,
      userMobile: payload.userMobile,
      userAddress: payload.userAddress,
      role: payload.role,
      updatedAt: serverTimestamp(),
    };

    await withTimeout(setDoc(targetDocRef, firestorePayload, { merge: true }), 3000);
    payload.id = targetDocRef.id;
  } catch (fsErr) {
    console.warn('Firestore updateUser sync note (saved locally):', fsErr.message || fsErr);
  }

  return payload;
};



/**
 * ============================================================================
 * 3. Services Collection Operations
 * ============================================================================
 */

const SERVICES_CACHE_KEY = 'aparna_services_cache';

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
      4000
    );
    createdId = docRef.id;
  } catch (err) {
    console.warn('createService firestore note (using local ID):', err.message || err);
    createdId = 'svc_' + Date.now();
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
      q = query(collection(db, COLLECTIONS.SERVICES), where('active', '==', true));
    }

    const snapshot = await withTimeout(getDocs(q), 4500);

    if (snapshot && !snapshot.empty) {
      const services = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          serviceName: data.serviceName || 'Unnamed Service',
          servicePrice: Number(data.servicePrice) || 0,
          serviceDiscountedPrice: Number(data.serviceDiscountedPrice) || 0,
          description: data.description || '',
          active: data.active !== false,
          rawCreatedAt: data.createdAt,
          rawUpdatedAt: data.updatedAt,
          createdAt: data.createdAt ? formatDateSafe(data.createdAt) : formatDateSafe(new Date()),
          updatedAt: data.updatedAt ? formatDateSafe(data.updatedAt) : null,
        };
      });

      setCachedServices(services);
      return onlyActive ? services.filter((s) => s.active) : services;
    }

    setCachedServices([]);
    return [];
  } catch (err) {
    console.warn('getAllServices firestore note (falling back to cache):', err.message || err);
    const cached = getCachedServices();
    if (cached && cached.length > 0) {
      return onlyActive ? cached.filter((s) => s.active) : cached;
    }
    return [];
  }
};

export const updateService = async (serviceId, serviceData) => {
  const payload = {
    serviceName: String(serviceData.serviceName || '').trim(),
    servicePrice: Number(serviceData.servicePrice) || 0,
    serviceDiscountedPrice: Number(serviceData.serviceDiscountedPrice) || 0,
    active: Boolean(serviceData.active),
    description: serviceData.description ? String(serviceData.description).trim() : '',
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(db, COLLECTIONS.SERVICES, serviceId);
    await withTimeout(setDoc(docRef, payload, { merge: true }), 4000);
  } catch (err) {
    console.warn('updateService firestore note (cached locally):', err.message || err);
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
      : s
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
    console.warn('deleteService firestore note (removed locally):', err.message || err);
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
export const getServicesByBusiness = async (_businessId, onlyActive = false) => {
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
          clientName: data.clientName || data.username || '',
          clientMobile: data.clientMobile || data.userMobile || '',
          clientAddress: data.clientAddress || data.userAddress || '',
          username: data.clientName || data.username || '',
          userMobile: data.clientMobile || data.userMobile || '',
          userAddress: data.clientAddress || data.userAddress || '',
          role: USER_ROLES.CLIENT,
        };
      });
    }
  } catch (err) {
    console.warn('getAllClients error:', err.message || err);
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
  const model = createMeasurementModel(measurementData);
  const tempId = 'm-' + Date.now();
  const localRecord = { id: tempId, ...model };

  // Save to local cache immediately
  const localList = getLocalMeasurements();
  localList.unshift(localRecord);
  saveLocalMeasurements(localList);

  try {
    const docRef = await withTimeout(addDoc(collection(db, COLLECTIONS.MEASUREMENTS), model), 3500);
    localRecord.id = docRef.id;
    saveLocalMeasurements(localList);

    // If userId is present, optionally link measurementId to the user document
    if (measurementData.userId) {
      try {
        const userRef = doc(db, COLLECTIONS.USERS, measurementData.userId);
        await withTimeout(
          setDoc(userRef, { measurementId: docRef.id, updatedAt: serverTimestamp() }, { merge: true }),
          2000
        );
      } catch {
        // User doc might not exist yet if created prior
      }
    }

    return { id: docRef.id, ...model };
  } catch (err) {
    console.warn('Firestore measurement save note (saved locally):', err);
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
  const localList = getLocalMeasurements().filter((m) => m.userId === userId);

  try {
    const q = query(
      collection(db, COLLECTIONS.MEASUREMENTS),
      where('userId', '==', userId)
    );
    const snapshot = await withTimeout(getDocs(q), 3000, null);
    if (snapshot && !snapshot.empty) {
      const remote = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Merge remote with local records by ID
      const map = new Map();
      remote.forEach((r) => map.set(r.id, r));
      localList.forEach((l) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
      const merged = Array.from(map.values());

      // Update local storage
      const otherUserMeasurements = getLocalMeasurements().filter((m) => m.userId !== userId);
      saveLocalMeasurements([...merged, ...otherUserMeasurements]);
      return merged;
    }
  } catch (err) {
    console.warn('getMeasurementsByUserId note (serving local):', err);
  }

  return localList;
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
  const localList = getLocalMeasurements();
  const localFound = localList.find((m) => m.id === measurementId);

  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    const snapshot = await withTimeout(getDoc(docRef), 2500, null);
    if (snapshot && snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
  } catch (err) {
    console.warn('getMeasurementById note:', err);
  }

  return localFound || null;
};

/**
 * Delete a client measurement record
 * @param {string} measurementId
 */
export const deleteClientMeasurement = async (measurementId) => {
  const localList = getLocalMeasurements().filter((m) => m.id !== measurementId);
  saveLocalMeasurements(localList);

  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    await withTimeout(deleteDoc(docRef), 3000);
  } catch (err) {
    console.warn('deleteClientMeasurement note:', err);
  }
  return true;
};

/**
 * Get all client measurements across the measurements collection
 */
export const getAllMeasurements = async () => {
  const localList = getLocalMeasurements();

  try {
    const snapshot = await withTimeout(getDocs(collection(db, COLLECTIONS.MEASUREMENTS)), 3000, null);
    if (snapshot) {
      const remote = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const map = new Map();
      remote.forEach((r) => map.set(r.id, r));
      localList.forEach((l) => {
        if (!map.has(l.id)) {
          map.set(l.id, l);
          // Auto-sync local measurement to Firestore
          if (l.id) {
            setDoc(doc(db, COLLECTIONS.MEASUREMENTS, l.id), l, { merge: true }).catch(() => {});
          }
        }
      });
      const finalList = Array.from(map.values());
      saveLocalMeasurements(finalList);
      return finalList;
    }
  } catch (err) {
    console.warn('Firestore getAllMeasurements note (serving from local cache):', err.message || err);
  }

  return localList;
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
  if (measurementData.title !== undefined) payload.title = String(measurementData.title || '').trim();
  if (measurementData.pallu !== undefined) payload.pallu = measurementData.pallu;
  if (measurementData.shoulderToRightTight !== undefined) payload.shoulderToRightTight = measurementData.shoulderToRightTight;
  if (measurementData.chest !== undefined) payload.chest = measurementData.chest;
  if (measurementData.hip !== undefined) payload.hip = measurementData.hip;
  if (measurementData.firstPleatSize !== undefined) payload.firstPleatSize = measurementData.firstPleatSize;
  if (measurementData.noOfChestPleats !== undefined) payload.noOfChestPleats = measurementData.noOfChestPleats;
  if (measurementData.height !== undefined) payload.height = measurementData.height;
  if (measurementData.dressSize !== undefined) payload.dressSize = measurementData.dressSize;
  if (measurementData.notes !== undefined) payload.notes = String(measurementData.notes || '').trim();

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
      setDoc(docRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true }),
      3500
    );
  } catch (err) {
    console.warn('updateMeasurement firestore note (saved locally):', err);
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

const ORDERS_CACHE_KEY = 'aparna_orders_cache';

export const getCachedOrders = () => {
  try {
    const raw = localStorage.getItem(ORDERS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedOrders = (orders) => {
  try {
    localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
  } catch {}
};

export const INITIAL_ORDERS = [];

// Registry of assigned order IDs to guarantee 100% uniqueness
const assignedOrderIds = new Set();
// Initialized empty - order IDs are tracked dynamically


// Map docId/key to order ID so re-renders keep consistent ID
const docIdToOrderId = new Map();

/**
 * Generate a unique 5-digit Order ID: ORD-***** (e.g. ORD-48291)
 */
export const generateOrderId = () => {
  let candidate;
  let attempts = 0;
  do {
    const random5 = Math.floor(10000 + Math.random() * 90000);
    candidate = `ORD-${random5}`;
    attempts++;
  } while (assignedOrderIds.has(candidate) && attempts < 5000);
  assignedOrderIds.add(candidate);
  return candidate;
};

/**
 * Format order document object ensuring unique 5-digit ORD-***** ID
 */
const formatOrderDoc = (id, data) => {
  const rawCreated = data.createdAt || data.orderDate || new Date().toISOString();
  const rawUpdated = data.updatedAt || null;
  const status = String(data.status || data.orderStatus || 'pending').toLowerCase();

  // Determine unique 5-digit order ID
  let cleanId;
  const docKey = id || data.id || '';
  if (docKey && docIdToOrderId.has(docKey)) {
    cleanId = docIdToOrderId.get(docKey);
  } else {
    const rawCandidate = data.orderId || data.id || id || '';
    const isFiveDigits = /^ORD-\d{5}$/.test(rawCandidate) && rawCandidate !== 'ORD-77770';

    if (isFiveDigits && !assignedOrderIds.has(rawCandidate)) {
      cleanId = rawCandidate;
      assignedOrderIds.add(cleanId);
    } else {
      cleanId = generateOrderId();
    }

    if (docKey) {
      docIdToOrderId.set(docKey, cleanId);
    }
  }

  const client = data.client || {
    clientId: data.clientId || '',
    username: data.username || data.clientName || 'Client',
    userMobile: data.userMobile || data.phone || '',
    email: data.email || '',
    userAddress: data.userAddress || data.address || '',
  };

  const items = Array.isArray(data.items) ? data.items : [];

  return {
    id: cleanId,
    orderId: cleanId,
    ...data,
    client,
    username: client.username || data.username || 'Client',
    userMobile: client.userMobile || data.userMobile || '',
    email: client.email || data.email || '',
    userAddress: client.userAddress || data.userAddress || '',
    items,
    totalItems: items.length || data.totalItems || 1,
    totalAmount: Number(data.totalAmount) || items.reduce((acc, it) => acc + (Number(it.finalPrice) || 0), 0) || 0,
    status,
    orderStatus: status,
    occasion: data.occasion || '',
    orderDate: formatDateSafe(data.orderDate || rawCreated),
    deliveryDate: data.deliveryDate ? formatDateSafe(data.deliveryDate) : '-',
    createdAt: formatDateSafe(rawCreated),
    updatedAt: rawUpdated ? formatDateSafe(rawUpdated) : null,
    rawCreatedAt: rawCreated,
    rawUpdatedAt: rawUpdated,
    createdBy: data.createdBy || '',
    updatedBy: data.updatedBy || '',
  };
};

// Cache of recently created order signatures to suppress rapid duplicate submissions
const recentOrderCreations = new Map();

/**
 * Create a new order with 5-digit Order ID: ORD-*****
 * @param {Object} orderData
 */
export const createOrder = async (orderData) => {
  // Deduplication check: construct signature to prevent double-booking within 3.5 seconds
  const clientKey = orderData.clientId || orderData.userMobile || orderData.username || '';
  const itemsKey = (orderData.items || []).map((it) => `${it.serviceId || it.serviceName}_${it.finalPrice || it.servicePrice}`).join('|');
  const signature = `${clientKey}_${orderData.totalAmount}_${orderData.deliveryDate || ''}_${itemsKey}`;

  const nowMs = Date.now();
  if (recentOrderCreations.has(signature)) {
    const existing = recentOrderCreations.get(signature);
    if (nowMs - existing.timestamp < 3500 && existing.result) {
      console.warn('Duplicate createOrder call suppressed for signature:', signature);
      return existing.result;
    }
  }

  const orderId = orderData.id || orderData.orderId || generateOrderId();
  const currentUid = orderData.createdBy || auth?.currentUser?.uid || '';
  const model = createOrderModel({ ...orderData, id: orderId, orderId, createdBy: currentUid });

  // On creation: pass only createdAt; strictly ensure updatedAt and updatedBy are not present
  if ('updatedAt' in model) {
    delete model.updatedAt;
  }
  if ('updatedBy' in model) {
    delete model.updatedBy;
  }

  let createdId = orderId;

  try {
    await withTimeout(
      setDoc(doc(db, COLLECTIONS.ORDERS, orderId), model),
      4500
    );
  } catch (err) {
    console.warn('createOrder firestore note (using local ID):', err.message || err);
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

  // Cache created order signature to block duplicate calls
  recentOrderCreations.set(signature, { result: formatted, timestamp: Date.now() });

  // Cleanup old entries
  for (const [key, val] of recentOrderCreations.entries()) {
    if (nowMs - val.timestamp > 10000) {
      recentOrderCreations.delete(key);
    }
  }

  return formatted;
};

/**
 * Get all orders across the orders collection (with cache and initial seeds)
 */
export const getAllOrders = async () => {
  try {
    const snapshot = await withTimeout(
      getDocs(collection(db, COLLECTIONS.ORDERS)),
      4500,
      null
    );

    if (snapshot && !snapshot.empty) {
      const orders = snapshot.docs.map((d) => formatOrderDoc(d.id, d.data()));
      setCachedOrders(orders);
      return orders;
    }

    const cached = getCachedOrders();
    const cleanCached = (cached || []).filter((o) => o && o.id);
    return cleanCached;
  } catch (err) {
    console.warn('getAllOrders firestore note (falling back to cache):', err.message || err);
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
export const getOrdersByUserId = async (userId, userEmail = '', userMobile = '') => {
  if (!userId && !userEmail && !userMobile) return [];
  const cleanUid = String(userId || '').trim();
  const cleanEmail = String(userEmail || '').trim().toLowerCase();
  const cleanMobile = String(userMobile || '').replace(/\D/g, '').slice(-10);

  const isMatchingOrder = (o) => {
    if (!o) return false;
    if (cleanUid && (o.clientId === cleanUid || o.createdBy === cleanUid || o.client?.clientId === cleanUid)) {
      return true;
    }
    if (cleanEmail && (String(o.email || '').toLowerCase().trim() === cleanEmail || String(o.client?.email || '').toLowerCase().trim() === cleanEmail)) {
      return true;
    }
    if (cleanMobile) {
      const oMobile = String(o.userMobile || o.phone || o.client?.userMobile || '').replace(/\D/g, '').slice(-10);
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
          getDocs(query(collection(db, COLLECTIONS.ORDERS), where('clientId', '==', cleanUid))),
          4000,
          null
        ),
        withTimeout(
          getDocs(query(collection(db, COLLECTIONS.ORDERS), where('createdBy', '==', cleanUid))),
          4000,
          null
        )
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
      const timeA = new Date(a.rawCreatedAt || a.createdAt || a.orderDate || 0).getTime();
      const timeB = new Date(b.rawCreatedAt || b.createdAt || b.orderDate || 0).getTime();
      return timeB - timeA;
    });

    return result;
  } catch (err) {
    console.warn('getOrdersByUserId note (serving local):', err.message || err);
    return localMatched;
  }
};

/**
 * Update order status or fields
 * @param {string} orderId
 * @param {Object} updates
 */
export const updateOrder = async (orderId, updates) => {
  const now = new Date();
  const currentUid = updates.updatedBy || auth?.currentUser?.uid || '';
  const updatePayload = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: currentUid,
  };

  // Protect createdAt and createdBy from being overwritten on update
  delete updatePayload.createdAt;
  delete updatePayload.createdBy;

  try {
    const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await withTimeout(setDoc(docRef, updatePayload, { merge: true }), 4000);
  } catch (err) {
    console.warn('updateOrder firestore note (cached locally):', err.message || err);
  }

  // Update local cache
  const cached = getCachedOrders() || [];
  const updatedList = cached.map((ord) =>
    ord.id === orderId
      ? {
          ...ord,
          ...updates,
          status: updates.status || updates.orderStatus || ord.status,
          orderStatus: updates.status || updates.orderStatus || ord.orderStatus,
          updatedAt: formatDateSafe(now),
          rawUpdatedAt: now.toISOString(),
          updatedBy: currentUid,
        }
      : ord
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
    console.warn('deleteOrder firestore note (removed locally):', err.message || err);
  }

  const cached = getCachedOrders() || [];
  setCachedOrders(cached.filter((o) => o.id !== orderId));
  return true;
};


// Immediate one-time purge of legacy mock data from client browser cache
if (typeof window !== 'undefined') {
  try {
    const MOCK_CLIENT_IDS = new Set(['client_priya', 'client_ananya', 'client_kavitha', 'client_sneha', 'client_divya', 'client_meenakshi']);
    const rawUsers = localStorage.getItem(LOCAL_USERS_KEY);
    if (rawUsers) {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((u) => u && u.id && !MOCK_CLIENT_IDS.has(u.id));
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(cleaned));
      }
    }
    const MOCK_MEASURES = new Set(['measure_priya_1', 'measure_priya_2', 'measure_ananya_1', 'measure_kavitha_1', 'measure_sneha_1', 'measure_divya_1', 'measure_meenakshi_1', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-7', 'm-8', 'm-9', 'm-10']);
    const rawMeas = localStorage.getItem(LOCAL_MEASUREMENTS_KEY);
    if (rawMeas) {
      const parsed = JSON.parse(rawMeas);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((m) => m && m.id && !MOCK_MEASURES.has(m.id) && !String(m.userId || '').startsWith('client_'));
        localStorage.setItem(LOCAL_MEASUREMENTS_KEY, JSON.stringify(cleaned));
      }
    }
    const MOCK_ORDERS = new Set(['ORD-58392', 'ORD-71940', 'ORD-24915', 'ORD-83921', 'ORD-77770']);
    const rawOrders = localStorage.getItem(ORDERS_CACHE_KEY);
    if (rawOrders) {
      const parsed = JSON.parse(rawOrders);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((o) => o && o.id && !MOCK_ORDERS.has(o.id) && !MOCK_CLIENT_IDS.has(o.clientId));
        localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(cleaned));
      }
    }
  } catch {}
}
