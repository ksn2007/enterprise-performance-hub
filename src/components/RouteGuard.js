'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, ROLE_ROUTES } from '../utils/auth';

/**
 * RouteGuard — wraps dashboard pages to enforce Firebase auth + Firestore role checks.
 *
 * Behaviour:
 *  - If no Firebase user → redirect to /login
 *  - If Firebase user but no Firestore profile → redirect to /login
 *  - If Firestore role !== requiredRole → redirect to the user's correct dashboard
 *  - Otherwise → render children
 *
 * @param {{ requiredRole: 'employee'|'manager'|'admin', children: React.ReactNode }} props
 */
export default function RouteGuard({ requiredRole, children }) {
  const router = useRouter();
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'authorized' | 'redirecting'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in at all
        setAuthState('redirecting');
        router.replace('/login');
        return;
      }

      // Logged in — fetch Firestore profile to get role
      const profile = await getUserProfile(firebaseUser.uid);

      if (!profile) {
        // Authenticated but no Firestore profile — treat as unauthenticated
        console.warn('[RouteGuard] No Firestore profile found for UID:', firebaseUser.uid);
        setAuthState('redirecting');
        router.replace('/login');
        return;
      }

      if (profile.role !== requiredRole) {
        // Wrong role — send to the correct dashboard
        const correctRoute = ROLE_ROUTES[profile.role] || '/login';
        console.info(`[RouteGuard] Role mismatch: expected "${requiredRole}", got "${profile.role}". Redirecting to ${correctRoute}`);
        setAuthState('redirecting');
        router.replace(correctRoute);
        return;
      }

      // All checks passed
      setAuthState('authorized');
    });

    return () => unsubscribe();
  }, [requiredRole, router]);

  if (authState === 'checking' || authState === 'redirecting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md text-on-surface-variant">
            {authState === 'checking' ? 'Verifying access...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
