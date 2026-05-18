'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function DashboardLayout({ children, role, onNewGoal }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('[DashboardLayout] Sign out error:', error);
      router.replace('/login');
    }
  };

  // Navigation structure mapping based on role
  // We align with the icons from the Stitch HTML
  const navItems = [
    { name: 'Dashboard', path: `/${role}`, icon: 'dashboard' },
    { name: 'My Goals', path: `/${role}/goals`, icon: 'track_changes' },
    { name: 'Approvals', path: role === 'manager' ? `/${role}/approvals` : null, icon: 'fact_check' },
    { name: 'Reports', path: `/${role}/reports`, icon: 'analytics' },
    { name: 'Organization', path: role === 'admin' ? `/${role}/org` : null, icon: 'corporate_fare' },
    { name: 'Settings', path: `/${role}/settings`, icon: 'settings' },
  ].filter(item => item.path !== null);

  return (
    <div className="bg-background text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-sidebar-width bg-surface border-r border-outline-variant flex flex-col overflow-y-auto z-50 custom-scrollbar">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">Enterprise Goals</h1>
              <p className="text-label-sm text-on-surface-variant">Corporate Portal</p>
            </div>
          </div>
          
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors active:scale-[0.98] ${
                    isActive 
                      ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary' 
                      : 'text-on-surface-variant hover:bg-surface-container-high border-l-4 border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-body-md text-body-md">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-8">
            {onNewGoal ? (
              <button onClick={onNewGoal} className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Goal
              </button>
            ) : (
              <Link href={`/${role}/goals`} className="w-full py-3 bg-primary text-on-primary rounded-lg font-label-md flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Goal
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-auto p-6 border-t border-outline-variant">
          <Link href="/help" className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg">
            <span className="material-symbols-outlined">help</span>
            <span className="font-body-md text-body-md">Help Center</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-body-md text-body-md">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-sidebar-width min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <header className="h-16 flex justify-between items-center px-gutter bg-surface border-b border-outline-variant sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary" placeholder="Search goals, team members..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
                <span className="material-symbols-outlined">apps</span>
              </button>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant"></div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-label-md text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-all">Support</button>
              <Link href={`/${role}/goals`} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md shadow-sm hover:opacity-90 active:scale-95 transition-all">Check-in</Link>
              <img alt="User Profile" className="w-10 h-10 rounded-full border-2 border-primary-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA013tAOADzhq5TSyjzois69_RdyeyibtEjo7zjQnFOI4aCEIzraLPPAMhsqnZyaSfEYuHrIOLE2E9zweNNt-D91NA4cZ5VAzSmMQbeOkUeLtKfyofJe6U2NuRtdCkfbOnLn7drF6B3DLRgHZVKqT7ie6Z0H8dJ0ZLdCuJlaD--H6-3GoUbjczNy9O9-gm6uuFA5GKlIvqVVkxxRraygeEuq7eFwIHryJLl47DiR7XZHYAjN3gW2izFl-il1MAsPFI1Ou-LnIFDiAR2" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-container-padding max-w-[1440px] mx-auto w-full flex-1">
          {children}
        </div>
        
        {/* Sticky Footer Branding */}
        <footer className="mt-auto py-8 px-container-padding border-t border-outline-variant text-center">
          <p className="text-label-sm text-on-surface-variant">© 2024 GoalConnect Performance Management System. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
