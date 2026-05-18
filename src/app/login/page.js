'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, setupUserProfile, ROLE_ROUTES } from '../../utils/auth';
import { seedDemoAccounts } from '../../utils/seedAccounts';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dropdown role is now only a HINT for profile creation, not routing
  const [role, setRole] = useState('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Seed link state
  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Pre-fill role from URL param (e.g. ?role=manager)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'employee' || roleParam === 'manager' || roleParam === 'admin') {
      setRole(roleParam);
    }
  }, [searchParams]);

  // If a user is already authenticated with a valid profile, route them directly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && ROLE_ROUTES[profile.role]) {
          router.replace(ROLE_ROUTES[profile.role]);
          return;
        }
      }
      setIsCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = cred.user;

      // Fetch Firestore profile — this is the authoritative role source
      let profile = await getUserProfile(firebaseUser.uid);

      if (!profile) {
        // No profile found — create one using the dropdown hint
        // This handles edge cases like manually created accounts
        profile = await setupUserProfile(firebaseUser, role);
      }

      const destination = ROLE_ROUTES[profile.role] || '/login';
      router.replace(destination);
    } catch (err) {
      let message = 'An error occurred. Please try again.';
      if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found')     message = 'No account found with this email.';
      if (err.code === 'auth/wrong-password')      message = 'Incorrect password.';
      if (err.code === 'auth/invalid-email')       message = 'Invalid email address.';
      if (err.code === 'auth/too-many-requests')   message = 'Too many attempts. Please wait and try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedAccounts = async () => {
    setIsSeedLoading(true);
    setSeedMessage('');
    try {
      const result = await seedDemoAccounts();
      setSeedMessage(result.message);
    } catch (err) {
      console.error('[Login] Seed error:', err);
      setSeedMessage('Initialization failed. Check console for details.');
    } finally {
      setIsSeedLoading(false);
    }
  };

  const roleTitles = {
    employee: 'Employee Login',
    manager:  'Manager Login',
    admin:    'HR/Admin Login',
  };

  // Show a full-page spinner while checking existing session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img alt="Corporate office lobby" className="w-full h-full object-cover opacity-10 grayscale brightness-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeG1dQrQY-gSh45pBwpOUlLpTtfBo3_MEgKupS57GXYebeTBEoGmQo-Xa2XiEMvnPxCaZAmXjb7y25SEHQOwHV_O9kCL23uFcl19huwuOk9pHnDB3Zy1FsDPj4qlRjiTSamCMbfiYopdeNE8xPsxFqnoSxDFRU57c2Nb3Bgf5ovlJjYRjyc5GIh0aYyvUpUvoAPXt4gQcEm2Vl2Q75wYJTtx4JwLWUKjSULwKTWqI14H2iEs2sk2p9ePqYxie7NFsAaNnTebK9yIIe" />
        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-container-low to-primary-fixed/20 opacity-90"></div>
      </div>

      {/* Top AppBar */}
      <header className="relative z-10 w-full h-16 px-gutter flex items-center justify-center md:justify-start">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[32px]">track_changes</span>
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">GoalConnect</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center relative z-10 px-gutter">
        <div className="w-full max-w-[440px]">
          <div className="bg-white/95 backdrop-blur-md shadow-[0_12px_24px_rgba(0,0,0,0.08)] border border-outline-variant rounded-xl p-container-padding flex flex-col gap-6">

            {/* Branding & Title */}
            <div className="text-center">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">{roleTitles[role]}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">Sign in to manage your enterprise goals</p>
            </div>

            {/* SSO Section */}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-all active:opacity-80">
              <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" fill="#f25022"></path>
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" fill="#7fba00" transform="translate(10.5 0)"></path>
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" fill="#00a4ef" transform="translate(0 10.5)"></path>
                <path d="M0 0h10v10H0V0zm11 0h10v10H11V0zM0 11h10v10H0V11zm11 0h10v10H11V11z" fill="#ffb900" transform="translate(10.5 10.5)"></path>
              </svg>
              <span>Sign in with Microsoft</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-outline-variant"></div>
              <span className="font-label-sm text-label-sm text-outline">OR</span>
              <div className="h-[1px] flex-grow bg-outline-variant"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-container/20 border border-error/30 text-error p-3 rounded-lg font-body-sm text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant px-1" htmlFor="role">Role (hint for new accounts)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">person</span>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md outline-none cursor-pointer appearance-none"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface-variant px-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md placeholder:text-outline/60 outline-none" id="email" placeholder="name@company.com" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                  <Link className="font-label-sm text-label-sm text-primary hover:underline" href="#">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input className="w-full pl-10 pr-10 py-2.5 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-body-md text-body-md placeholder:text-outline/60 outline-none" id="password" placeholder="••••••••" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 py-1">
                <input className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" id="remember" type="checkbox" />
                <label className="font-body-sm text-body-sm text-on-surface-variant" htmlFor="remember">Remember me for 30 days</label>
              </div>

              <button
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:brightness-110 active:scale-[0.98] transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
                type="submit"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 w-full py-base px-gutter flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-6">
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</Link>
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Cookie Settings</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">help</span>
            <Link className="hover:text-primary transition-colors" href="#">Support Center</Link>
          </div>
          <div className="w-[1px] h-3 bg-outline-variant hidden md:block"></div>
          <span className="font-label-sm text-label-sm text-outline">© 2024 GoalConnect. All rights reserved.</span>
          <div className="w-[1px] h-3 bg-outline-variant hidden md:block"></div>
          {/* Initialize Demo Accounts — subtle dev link */}
          <button
            type="button"
            onClick={handleSeedAccounts}
            disabled={isSeedLoading}
            className="font-label-sm text-label-sm text-outline/60 hover:text-primary transition-colors disabled:cursor-not-allowed underline underline-offset-2 decoration-dotted"
            title="Create the three enterprise demo accounts in Firebase (idempotent)"
          >
            {isSeedLoading ? 'Initializing…' : 'Initialize Demo Accounts'}
          </button>
        </div>
      </footer>

      {/* Seed feedback message */}
      {seedMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-surface border border-outline-variant rounded-lg shadow-lg px-6 py-3 font-body-sm text-body-sm text-on-surface max-w-sm text-center">
          {seedMessage}
        </div>
      )}

      {/* Accessibility/Visual Hint: Background subtle pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#004277 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
