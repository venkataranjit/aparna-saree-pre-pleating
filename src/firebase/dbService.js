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
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { db, firebaseConfig } from './config';
import {
  COLLECTIONS,
  USER_ROLES,
  SUPERADMIN_EMAIL,
  INITIAL_SERVICES,
  createBusinessModel,
  createUserModel,
  createServiceModel,
  createCustomerModel,
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
export const formatDateSafe = (val, customFallback = null) => {
  const getFormatted = (d) => {
    if (!d || isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getTodayFormatted = () => {
    if (customFallback && customFallback !== 'Recent' && customFallback !== 'recent') {
      return customFallback;
    }
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = MONTH_NAMES[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (!val || val === 'Recent' || val === 'recent' || val === 'null' || val === 'undefined' || val === '[object Object]') {
    return getTodayFormatted();
  }

  // 1. JS Date instance
  if (val instanceof Date) {
    return getFormatted(val) || getTodayFormatted();
  }

  // 2. Firestore Timestamp object with .toDate()
  if (typeof val === 'object' && typeof val.toDate === 'function') {
    try {
      return getFormatted(val.toDate()) || getTodayFormatted();
    } catch {
      return getTodayFormatted();
    }
  }

  // 3. Object with seconds: { seconds: ..., nanoseconds: ... }
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    try {
      return getFormatted(new Date(val.seconds * 1000)) || getTodayFormatted();
    } catch {
      return getTodayFormatted();
    }
  }

  // 4. Number (epoch milliseconds or seconds)
  if (typeof val === 'number') {
    try {
      const ms = val < 10000000000 ? val * 1000 : val;
      return getFormatted(new Date(ms)) || getTodayFormatted();
    } catch {
      return getTodayFormatted();
    }
  }

  // 5. String parsing
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === 'Recent' || trimmed === 'recent' || trimmed === '[object Object]' || trimmed === '') {
      return getTodayFormatted();
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
      return getFormatted(d) || getTodayFormatted();
    }

    // Check for "yyyy-mm-dd" or "yyyy/mm/dd"
    const yyyymmddMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);
      const d = new Date(year, month, day);
      return getFormatted(d) || getTodayFormatted();
    }

    // Native Date parser fallback (for ISO strings like 2026-09-06T08:00:00Z)
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return getFormatted(parsed) || getTodayFormatted();
      }
    } catch {}
  }

  return getTodayFormatted();
};

/**
 * Format modified / updated date.
 * If the record has not been modified (or if created and modified have the same date/timestamp value in DB),
 * returns "-" (dash) as per requirements.
 *
 * @param {any} updatedVal - Updated timestamp / date
 * @param {any} [createdVal] - Created timestamp / date
 * @returns {string} - Formatted modified date or "-"
 */
export const formatModifiedDate = (updatedVal, createdVal = null) => {
  if (!updatedVal || updatedVal === '-' || updatedVal === '—') return '-';

  // If raw values in DB are identical
  if (createdVal && String(updatedVal).trim() === String(createdVal).trim()) {
    return '-';
  }

  // Compare formatted date strings
  const formattedUpdated = formatDateSafe(updatedVal);
  if (createdVal) {
    const formattedCreated = formatDateSafe(createdVal);
    if (formattedUpdated === formattedCreated) {
      return '-';
    }
  }

  return formattedUpdated || '-';
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
export const KNOWN_FIREBASE_AUTH_USERS = [
  {
    id: 'Nt1jI6VO7mPASuMuXDasW6w1o1p2',
    username: 'Victory Ranjit',
    email: 'victoryranjit@gmail.com',
    userMobile: '',
    userAddress: '',
    role: USER_ROLES.SUPERADMIN,
    createdAt: '05-Sep-2026',
  },
  {
    id: 'k5KRcQLGuUVtf2xqnrkpuFFFF63',
    username: 'Ranjit Aparna',
    email: 'ranjitaparna25@gmail.com',
    userMobile: '',
    userAddress: '',
    role: USER_ROLES.ADMIN,
    createdAt: '05-Sep-2026',
  },
];

export const getLocalUsers = () => {
  if (typeof window === 'undefined') return KNOWN_FIREBASE_AUTH_USERS;
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];

    // Strip legacy businessId if present and ensure createdAt/updatedAt are always valid strings
    list = list.map(({ businessId, ...rest }) => ({
      ...rest,
      createdAt: formatDateSafe(rest.createdAt),
      updatedAt: formatDateSafe(rest.updatedAt),
    }));

    // Ensure all registered Firebase Auth users are present and roles stay in sync
    let changed = false;
    KNOWN_FIREBASE_AUTH_USERS.forEach((known) => {
      const existing = list.find(
        (u) => (u.email || '').trim().toLowerCase() === known.email.toLowerCase()
      );
      if (!existing) {
        list.push({ ...known });
        changed = true;
      } else if (known.role && existing.role !== known.role && (known.role === USER_ROLES.ADMIN || known.role === USER_ROLES.SUPERADMIN)) {
        existing.role = known.role;
        changed = true;
      }
    });

    if (changed) {
      saveLocalUsers(list);
    }
    return list;
  } catch {
    return KNOWN_FIREBASE_AUTH_USERS;
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
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.map((m) => ({
      ...m,
      createdAtDate: formatDateSafe(m.createdAtDate || m.createdAt),
    }));
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
      if (existingData?.role && (!userData.role || userData.role === USER_ROLES.CUSTOMER)) {
        resolvedRole = existingData.role;
      }
    } else if (userData.email) {
      const cleanEmail = userData.email.trim().toLowerCase();
      const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', cleanEmail));
      const emailSnap = await withTimeout(getDocs(q), 3000, null);
      if (emailSnap && !emailSnap.empty) {
        const existingData = emailSnap.docs[0].data();
        if (existingData?.role && (!userData.role || userData.role === USER_ROLES.CUSTOMER)) {
          resolvedRole = existingData.role;
        }
      }
    }
  } catch {}

  // Also check local cache for any registered role
  if (!resolvedRole || resolvedRole === USER_ROLES.CUSTOMER) {
    const localList = getLocalUsers();
    const localMatch = localList.find(
      (u) =>
        (u.id && u.id === uid) ||
        (u.email && userData.email && (u.email || '').trim().toLowerCase() === userData.email.trim().toLowerCase())
    );
    if (localMatch?.role && localMatch.role !== USER_ROLES.CUSTOMER) {
      resolvedRole = localMatch.role;
    }
  }

  // SuperAdmin override
  if (userData.email && userData.email.trim().toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    resolvedRole = USER_ROLES.SUPERADMIN;
  }

  const model = createUserModel({
    ...userData,
    role: resolvedRole || USER_ROLES.CUSTOMER,
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
  const localItem = { id: tempId, ...model, createdAt: formatDateSafe(new Date()) };

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
        return {
          id: d.id,
          ...data,
          createdAt: formatDateSafe(data.createdAt),
          updatedAt: formatDateSafe(data.updatedAt),
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
 * @param {('admin'|'staff'|'customer')} newRole - Target role
 */
export const updateUserRole = async (userId, newRole) => {
  const validRoles = [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CUSTOMER];
  if (!validRoles.includes(newRole)) {
    throw new Error('Invalid role specified. Only Admin, Staff, or Customer roles can be assigned.');
  }

  // Update in local cache
  const localList = getLocalUsers();
  const idx = localList.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    if (localList[idx].email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
      throw new Error('Super Admin role is immutable and cannot be modified.');
    }
    localList[idx].role = newRole;
    saveLocalUsers(localList);
  }

  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
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
    finalRole = USER_ROLES.CUSTOMER;
  }

  const payload = {
    id: userId || (existingIdx >= 0 ? localList[existingIdx].id : 'user-' + Date.now()),
    username: String(updatedData.username || '').trim(),
    email: cleanEmail,
    userMobile: String(updatedData.userMobile || '').trim(),
    userAddress: String(updatedData.userAddress || '').trim(),
    role: finalRole,
    updatedAt: formatDateSafe(new Date()),
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

/**
 * Create a new service
 * @param {Object} serviceData
 */
export const createService = async (serviceData) => {
  const model = createServiceModel(serviceData);
  const docRef = await addDoc(collection(db, COLLECTIONS.SERVICES), model);
  return { id: docRef.id, ...model };
};

/**
 * Get all services across the services collection
 * @param {boolean} [onlyActive=false]
 */
export const getAllServices = async (onlyActive = false) => {
  let q = collection(db, COLLECTIONS.SERVICES);
  if (onlyActive) {
    q = query(collection(db, COLLECTIONS.SERVICES), where('active', '==', true));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  const batch = writeBatch(db);
  const createdServices = [];

  for (const item of INITIAL_SERVICES) {
    const docRef = doc(collection(db, COLLECTIONS.SERVICES));
    const model = createServiceModel(item);
    batch.set(docRef, model);
    createdServices.push({ id: docRef.id, ...model });
  }

  await batch.commit();
  return createdServices;
};

/**
 * ============================================================================
 * 4. Customers Collection Operations
 * ============================================================================
 */

/**
 * Create a new customer with measurements
 * @param {Object} customerData
 */
export const createCustomer = async (customerData) => {
  const model = createCustomerModel(customerData);
  const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), model);
  return { id: docRef.id, ...model };
};

/**
 * Get all customers across the customers collection
 */
export const getAllCustomers = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.CUSTOMERS));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get all customers (businessId parameter retained for backward compatibility)
 * @param {string} [_businessId]
 */
export const getCustomersByBusiness = async (_businessId) => {
  return await getAllCustomers();
};

/**
 * Link a customer to a measurement document or user
 * @param {string} customerId
 * @param {Object} linkData - e.g. { measurementId, userId }
 */
export const updateCustomerLinks = async (customerId, linkData) => {
  const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId);
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

export const createCustomerMeasurement = createMeasurement;

/**
 * Get all measurement records mapped to a specific customer / user
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
 * Delete a customer measurement record
 * @param {string} measurementId
 */
export const deleteCustomerMeasurement = async (measurementId) => {
  const localList = getLocalMeasurements().filter((m) => m.id !== measurementId);
  saveLocalMeasurements(localList);

  try {
    const docRef = doc(db, COLLECTIONS.MEASUREMENTS, measurementId);
    await withTimeout(deleteDoc(docRef), 3000);
  } catch (err) {
    console.warn('deleteCustomerMeasurement note:', err);
  }
  return true;
};

/**
 * Get all customer measurements across the measurements collection
 */
export const getAllMeasurements = async () => {
  const localList = getLocalMeasurements();

  try {
    const snapshot = await withTimeout(getDocs(collection(db, COLLECTIONS.MEASUREMENTS)), 3000, null);
    if (snapshot) {
      const remote = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAtDate: formatDateSafe(data.createdAtDate || data.createdAt),
        };
      });
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
 * Get customer measurements (businessId parameter retained for backward compatibility)
 * @param {string} [_businessId]
 */
export const getMeasurementsByBusiness = async (_businessId) => {
  return await getAllMeasurements();
};

/**
 * Update an existing customer measurement record
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
    updatedAt: formatDateSafe(new Date()),
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
 * 6. Orders Collection Operations
 * ============================================================================
 */

/**
 * Create a new order
 * @param {Object} orderData
 */
export const createOrder = async (orderData) => {
  const model = createOrderModel(orderData);
  const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), model);
  return { id: docRef.id, ...model };
};

/**
 * Get all orders across the orders collection
 */
export const getAllOrders = async () => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get orders (businessId parameter retained for backward compatibility)
 * @param {string} [_businessId]
 */
export const getOrdersByBusiness = async (_businessId) => {
  return await getAllOrders();
};

/**
 * Update order status or payment status
 * @param {string} orderId
 * @param {Object} updates
 */
export const updateOrder = async (orderId, updates) => {
  const docRef = doc(db, COLLECTIONS.ORDERS, orderId);
  const updatePayload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, updatePayload);
  return true;
};
