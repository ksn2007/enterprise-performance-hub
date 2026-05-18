/**
 * seedAccounts.js
 *
 * One-time idempotent seeder for the three enterprise demo accounts.
 * Creates Firebase Auth users and matching Firestore user profiles.
 *
 * Designed to be called from the login page "Initialize Demo Accounts" link.
 * Safe to call multiple times — skips accounts that already exist.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { setupUserProfile } from './auth';

const DEMO_ACCOUNTS = [
  {
    email: 'employee@test.com',
    password: 'employee123',
    role: 'employee',
    name: 'Alex Employee',
    department: 'Engineering',
  },
  {
    email: 'manager@test.com',
    password: 'manager123',
    role: 'manager',
    name: 'Sarah Manager',
    department: 'Management',
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    name: 'Jordan Admin',
    department: 'HR',
  },
];

/**
 * Ensures one account exists. Tries to sign in first (cheaper); if that fails
 * with "invalid-credential" or "user-not-found", creates the account.
 *
 * @param {{ email, password, role, name, department }} account
 * @returns {Promise<{ uid: string, status: 'created' | 'updated' | 'skipped' }>}
 */
const ensureAccount = async ({ email, password, role, name, department }) => {
  let firebaseUser = null;
  let createdNewAuth = false;

  // Step 1: Try signing in (fastest check if account already exists)
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    firebaseUser = cred.user;
    createdNewAuth = false;
  } catch (signInErr) {
    // Account does not exist — create it
    if (
      signInErr.code === 'auth/invalid-credential' ||
      signInErr.code === 'auth/user-not-found' ||
      signInErr.code === 'auth/wrong-password'
    ) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = cred.user;
        createdNewAuth = true;
      } catch (createErr) {
        if (createErr.code === 'auth/email-already-in-use') {
          // Edge case: account exists but password changed externally
          console.warn(`[Seed] ${email} exists with different password. Skipping.`);
          return { uid: null, status: 'skipped' };
        }
        throw createErr;
      }
    } else {
      throw signInErr;
    }
  }

  // Step 2: Ensure Firestore profile exists and has correct role
  const profile = await setupUserProfile(firebaseUser, role, { name, department });

  // Step 3: Sign out so next account can be created
  await signOut(auth);

  let status = 'skipped';
  if (createdNewAuth) {
    status = 'created';
  } else if (profile._wasUpdated) {
    status = 'updated';
  }

  return { uid: firebaseUser.uid, status };
};

/**
 * Seeds all three demo accounts.
 * Returns a summary object for UI feedback.
 *
 * @returns {Promise<{ success: boolean, results: Array, message: string }>}
 */
export const seedDemoAccounts = async () => {
  const results = [];
  let anyModified = false;

  for (const account of DEMO_ACCOUNTS) {
    try {
      const { uid, status } = await ensureAccount(account);
      results.push({ email: account.email, status, uid });
      if (status === 'created' || status === 'updated') {
        anyModified = true;
      }
    } catch (err) {
      console.error(`[Seed] Failed for ${account.email}:`, err);
      results.push({ email: account.email, status: 'error', error: err.message });
    }
  }

  const message = anyModified
    ? 'Demo accounts initialized or corrected successfully. You can now sign in.'
    : 'Demo accounts already set up with correct roles. Ready for sign-in!';

  return { success: true, results, message };
};

/**
 * Checks whether demo accounts are already set up by verifying all three Firestore
 * profiles and their roles without triggering persistent auth changes.
 *
 * @returns {Promise<boolean>} true if already fully seeded with correct roles
 */
export const areDemoAccountsSeeded = async () => {
  try {
    // Check Employee
    const credEmp = await signInWithEmailAndPassword(auth, 'employee@test.com', 'employee123');
    const profEmp = await getDoc(doc(db, 'users', credEmp.user.uid));
    await signOut(auth);
    if (!profEmp.exists() || profEmp.data().role !== 'employee') return false;

    // Check Manager
    const credMgr = await signInWithEmailAndPassword(auth, 'manager@test.com', 'manager123');
    const profMgr = await getDoc(doc(db, 'users', credMgr.user.uid));
    await signOut(auth);
    if (!profMgr.exists() || profMgr.data().role !== 'manager') return false;

    // Check Admin
    const credAdm = await signInWithEmailAndPassword(auth, 'admin@test.com', 'admin123');
    const profAdm = await getDoc(doc(db, 'users', credAdm.user.uid));
    await signOut(auth);
    if (!profAdm.exists() || profAdm.data().role !== 'admin') return false;

    return true;
  } catch {
    return false;
  }
};
