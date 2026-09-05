import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { SUPERADMIN_EMAIL, USER_ROLES, createUserModel } from '../../firebase/schema';
import { withTimeout, getLocalUsers, saveLocalUsers } from '../../firebase/dbService';

const AuthContext = createContext({
  currentUser: null,
  userProfile: null,
  isSuperAdmin: false,
  isAdmin: false,
  isStaff: false,
  canEdit: false,
  canDelete: false,
  canAdd: false,
  role: USER_ROLES.CUSTOMER,
  loading: true,
  logout: async () => {},
  refreshProfile: async () => {},
});

const AUTH_SESSION_KEY = 'aparna_active_session_v1';

const getCachedSession = () => {
  if (typeof window === 'undefined') return { user: null, profile: null };
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return { user: null, profile: null };
    const data = JSON.parse(raw);
    if (data && data.user && data.user.uid) {
      return {
        user: data.user,
        profile: data.profile || null,
      };
    }
  } catch (err) {
    console.warn('Failed to parse cached auth session:', err);
  }
  return { user: null, profile: null };
};

const saveCachedSession = (user, profile) => {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return;
    }
    const safeUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || profile?.username || '',
      phoneNumber: user.phoneNumber || profile?.userMobile || '',
      photoURL: user.photoURL || profile?.photoURL || '',
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user: safeUser, profile }));
  } catch (err) {
    console.warn('Failed to save cached auth session:', err);
  }
};

const clearCachedSession = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {}
};

export const AuthProvider = ({ children }) => {
  const cached = getCachedSession();
  const [currentUser, setCurrentUser] = useState(cached.user);
  const [userProfile, setUserProfile] = useState(cached.profile);
  const [loading, setLoading] = useState(!cached.user);

  // Sync or fetch profile from Firestore / Local Cache
  const fetchOrInitProfile = async (user) => {
    if (!user) {
      setUserProfile(null);
      clearCachedSession();
      return null;
    }

    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const isSuper = normalizedEmail === SUPERADMIN_EMAIL.toLowerCase();

    // Check local storage first for fast response and persistence
    const localList = getLocalUsers();
    const existingLocal = localList.find(
      (u) =>
        (u.id && u.id === user.uid) ||
        (u.email && (u.email || '').toLowerCase() === normalizedEmail)
    );

    let currentMobile = existingLocal?.userMobile || user.phoneNumber || '';
    let currentUsername = existingLocal?.username || user.displayName || (isSuper ? 'Victory Ranjit' : 'Customer');
    let currentAddress = existingLocal?.userAddress || '';

    let baseProfile = {
      id: user.uid,
      email: normalizedEmail,
      username: currentUsername,
      userMobile: currentMobile,
      userAddress: currentAddress,
      role: isSuper ? USER_ROLES.SUPERADMIN : (existingLocal?.role || USER_ROLES.CUSTOMER),
    };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      let snapshot = await withTimeout(getDoc(userDocRef), 2500, null);
      let data = snapshot && snapshot.exists() ? snapshot.data() : null;

      // If document is not keyed by user.uid in Firestore, search by email
      if (!data && normalizedEmail) {
        try {
          const q = query(
            collection(db, 'users'),
            where('email', '==', normalizedEmail)
          );
          const emailSnap = await withTimeout(getDocs(q), 2500, null);
          if (emailSnap && !emailSnap.empty) {
            const matchedDoc = emailSnap.docs[0];
            data = matchedDoc.data();
            // Also link to user.uid so future lookups by UID succeed instantly
            if (matchedDoc.id !== user.uid) {
              setDoc(userDocRef, { ...data, id: user.uid }, { merge: true }).catch(() => {});
            }
          }
        } catch (emailErr) {
          console.warn('Firestore query by email note:', emailErr);
        }
      }

      if (data) {
        const finalRole = isSuper
          ? USER_ROLES.SUPERADMIN
          : (data.role || existingLocal?.role || baseProfile.role || USER_ROLES.CUSTOMER);

        const resolvedProfile = {
          id: user.uid,
          ...data,
          username: data.username || existingLocal?.username || currentUsername,
          userMobile: data.userMobile || existingLocal?.userMobile || currentMobile,
          userAddress: data.userAddress || existingLocal?.userAddress || currentAddress,
          role: finalRole,
        };

        if (isSuper && data.role !== USER_ROLES.SUPERADMIN) {
          await withTimeout(
            setDoc(userDocRef, { role: USER_ROLES.SUPERADMIN, updatedAt: serverTimestamp() }, { merge: true }),
            2000
          );
        }

        // Keep local cache synchronized with authoritative Firestore profile
        const updatedLocal = getLocalUsers().map((u) =>
          (u.id && u.id === user.uid) || ((u.email || '').toLowerCase() === normalizedEmail)
            ? { ...u, ...resolvedProfile }
            : u
        );
        saveLocalUsers(updatedLocal);

        setUserProfile(resolvedProfile);
        saveCachedSession(user, resolvedProfile);
        return resolvedProfile;
      } else {
        // Create initial profile if missing
        const newModel = createUserModel({
          username: currentUsername,
          email: normalizedEmail,
          userMobile: currentMobile,
          userAddress: currentAddress,
          role: baseProfile.role,
        });

        await withTimeout(setDoc(userDocRef, newModel, { merge: true }), 2500);
        const created = { id: user.uid, ...newModel };
        setUserProfile(created);
        saveCachedSession(user, created);
        return created;
      }
    } catch (err) {
      console.warn('Profile fetch note (using local representation):', err.message || err);
      setUserProfile(baseProfile);
      saveCachedSession(user, baseProfile);
      return baseProfile;
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const safeUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          phoneNumber: user.phoneNumber || '',
          photoURL: user.photoURL || '',
        };
        setCurrentUser(safeUser);
        const resolved = await fetchOrInitProfile(user);
        saveCachedSession(user, resolved);
      } else {
        clearCachedSession();
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
      const refreshed = await fetchOrInitProfile(currentUser);
      saveCachedSession(currentUser, refreshed);
      return refreshed;
    }
    return null;
  };

  const logout = async () => {
    try {
      clearCachedSession();
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      clearCachedSession();
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };


  const emailLower = (currentUser?.email || userProfile?.email || '').trim().toLowerCase();
  const isSuperAdmin = emailLower === SUPERADMIN_EMAIL.toLowerCase() || userProfile?.role === USER_ROLES.SUPERADMIN;
  const role = isSuperAdmin ? USER_ROLES.SUPERADMIN : (userProfile?.role || USER_ROLES.CUSTOMER);

  // Permissions:
  // SuperAdmin and Admin have full permissions (view, add, edit, delete) and see all options.
  // Staff has only view and add permissions (no edit, no delete).
  const isAdmin = isSuperAdmin || role === USER_ROLES.ADMIN;
  const isStaff = role === USER_ROLES.STAFF;
  const canEdit = isSuperAdmin || role === USER_ROLES.ADMIN;
  const canDelete = isSuperAdmin || role === USER_ROLES.ADMIN;
  const canAdd = isSuperAdmin || role === USER_ROLES.ADMIN || role === USER_ROLES.STAFF;

  const value = {
    currentUser,
    userProfile,
    isSuperAdmin,
    isAdmin,
    isStaff,
    canEdit,
    canDelete,
    canAdd,
    role,
    loading,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
