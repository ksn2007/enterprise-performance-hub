import { db } from '../firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * Role → Route mapping (authoritative)
 */
export const ROLE_ROUTES = {
  employee: '/employee',
  manager: '/manager',
  admin: '/admin',
};

/**
 * Fetches the Firestore user profile for a given UID.
 * Returns null if no profile document exists.
 *
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export const getUserProfile = async (uid) => {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { uid, ...snap.data() } : null;
  } catch (error) {
    console.error('[Auth] getUserProfile error:', error);
    return null;
  }
};

/**
 * Creates or updates a Firestore user profile document.
 * Idempotent — only writes if the document does not already exist.
 *
 * @param {import('firebase/auth').User} firebaseUser
 * @param {string} role - 'employee' | 'manager' | 'admin'
 * @param {Object} [extra] - Optional extra fields (name, department)
 * @returns {Promise<Object>} The profile object
 */
export const setupUserProfile = async (firebaseUser, role, extra = {}) => {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existingData = snap.data();
    // If the role matches, return it as-is
    if (existingData.role === role) {
      return { uid: firebaseUser.uid, ...existingData, _wasCreated: false, _wasUpdated: false };
    }
    
    // Role mismatch or update needed
    const updatedProfile = {
      ...existingData,
      role,
      name: extra.name || existingData.name || firebaseUser.email,
      department: extra.department || existingData.department || 'General',
      updatedAt: Timestamp.now(),
    };
    await setDoc(ref, updatedProfile);
    return { uid: firebaseUser.uid, ...updatedProfile, _wasCreated: false, _wasUpdated: true };
  }

  const defaults = {
    employee: { name: 'Employee User', department: 'Engineering' },
    manager:  { name: 'Manager User',  department: 'Management'  },
    admin:    { name: 'Admin User',    department: 'HR'          },
  };

  const profile = {
    email: firebaseUser.email,
    role,
    name: extra.name || defaults[role]?.name || firebaseUser.email,
    department: extra.department || defaults[role]?.department || 'General',
    createdAt: Timestamp.now(),
  };

  await setDoc(ref, profile);
  return { uid: firebaseUser.uid, ...profile, _wasCreated: true, _wasUpdated: false };
};
