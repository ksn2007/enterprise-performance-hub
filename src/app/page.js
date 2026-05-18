import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* TopNavBar */}
      <header className="bg-surface flex justify-between items-center h-16 px-container-padding sticky top-0 z-50 border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-base">
          <span className="font-headline-md text-headline-md font-extrabold text-primary">GoalConnect</span>
        </div>
        <nav className="hidden md:flex items-center gap-section-gap">
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-all cursor-pointer" href="#features">Features</a>
        </nav>
        <div className="flex items-center gap-element-gap">
          <Link href="/login" className="px-6 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md active:opacity-80 cursor-pointer transition-all">
            Login
          </Link>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto">
        {/* Hero Section */}
        <section className="py-20 px-container-padding text-center bg-gradient-to-b from-white to-surface">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="font-headline-xl text-headline-xl text-on-surface">Enterprise Goals</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Streamline employee goal setting, approvals, quarterly reviews, and performance tracking in a unified digital ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-element-gap pt-4">
              <Link href="/login" className="px-8 py-3 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md shadow-sm active:scale-[0.98] transition-transform text-center inline-block">
                Login to Portal
              </Link>
              <a href="#features" className="px-8 py-3 bg-white border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-low active:scale-[0.98] transition-transform text-center inline-block">
                View Features
              </a>
            </div>
          </div>
          {/* Hero Mockup Abstract */}
          <div className="mt-16 mx-auto max-w-5xl rounded-xl border border-outline-variant bg-white shadow-2xl overflow-hidden aspect-[16/9]">
            <img alt="Portal Dashboard Preview" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAA7zImrk1K9Ux0eafpzq0pNNbdOYSO-MSdpHLzAUIbkN_5uqXaHM1Qdv9zG-Rr_kpIxBhESSs_wItcJN1nIMOLGFM8iyvxfgaBReDyqwEgvvvkruciJ0RsHX5d_W4aDjjqZheNAZVjIFjqA4FjEF8p_794UOSl-KA0kZrkBnEtHcbciHvvCVe689FxWkOUyvfcCGRSwsf7v-VHDFAgvdGMB_CjZwfCbfry_8h1IfAvHihXOIKrJyQ-sVyqBI6rPYQjTwaz7EfFqiAp" />
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-20 px-container-padding bg-surface" id="features">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Feature 1 */}
            <div className="bg-white p-container-padding rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">track_changes</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">Goal Creation & Tracking</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Define SMART goals and monitor real-time progress through intuitive visual indicators.</p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white p-container-padding rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">fact_check</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">Manager Approval Workflow</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Automated request routing ensures leadership alignment and transparent goal validation.</p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white p-container-padding rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">Quarterly Check-ins</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Structured feedback cycles to keep performance discussions consistent and meaningful.</p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white p-container-padding rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary">monitoring</span>
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">HR Analytics & Audit Logs</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Comprehensive data exports and historical logs for compliance and talent management.</p>
            </div>
          </div>
        </section>

        {/* Role Overview Section (Asymmetric / Bento Style) */}
        <section className="py-20 px-container-padding">
          <h2 className="font-headline-lg text-headline-lg mb-12 text-center">Tailored for Every Stakeholder</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            {/* Employee Card */}
            <div className="lg:col-span-4 bg-white p-8 rounded-2xl border border-outline-variant flex flex-col justify-between">
              <div>
                <div className="mb-6 flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary">person</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary">Employee</span>
                </div>
                <h4 className="font-headline-md text-headline-md mb-4">Track your personal growth</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Access a personalized dashboard to manage your development objectives and career milestones.</p>
              </div>
              <Link className="mt-8 border-t border-outline-variant pt-6 flex items-center gap-2 text-primary font-label-md hover:underline" href="/login?role=employee">
                Explore Portal <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            {/* Manager Card */}
            <div className="lg:col-span-4 bg-primary-container p-8 rounded-2xl text-on-primary flex flex-col justify-between shadow-lg">
              <div>
                <div className="mb-6 flex items-center gap-base">
                  <span className="material-symbols-outlined text-white">supervisor_account</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-white opacity-80">Manager</span>
                </div>
                <h4 className="font-headline-md text-headline-md mb-4">Review and approve team targets</h4>
                <p className="font-body-md text-body-md text-on-primary-container opacity-90">Oversee team performance, provide feedback, and align individual goals with corporate strategy.</p>
              </div>
              <Link className="mt-8 border-t border-on-primary-container/30 pt-6 flex items-center gap-2 text-on-primary font-label-md hover:underline" href="/login?role=manager">
                Review Dashboard <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            {/* HR Card */}
            <div className="lg:col-span-4 bg-white p-8 rounded-2xl border border-outline-variant flex flex-col justify-between">
              <div>
                <div className="mb-6 flex items-center gap-base">
                  <span className="material-symbols-outlined text-primary">corporate_fare</span>
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary">HR/Admin</span>
                </div>
                <h4 className="font-headline-md text-headline-md mb-4">Monitor organization performance</h4>
                <p className="font-body-md text-body-md text-on-surface-variant">Leverage global reporting tools to identify talent gaps and ensure company-wide goal compliance.</p>
              </div>
              <Link className="mt-8 border-t border-outline-variant pt-6 flex items-center gap-2 text-primary font-label-md hover:underline" href="/login?role=admin">
                Admin Controls <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* System at a Glance (Mini Mockups) */}
        <section className="py-20 px-container-padding bg-surface-container-low">
          <div className="mb-12">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">System at a Glance</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Preview the unified interface designed for professional efficiency.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Mockup 1 */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-outline-variant p-4 aspect-video shadow-sm">
                <div className="h-full w-full bg-surface-container-highest rounded-lg flex flex-col p-3 space-y-2">
                  <div className="h-2 w-1/2 bg-primary rounded"></div>
                  <div className="h-1.5 w-full bg-outline-variant rounded"></div>
                  <div className="mt-auto h-4 w-full bg-white rounded-full overflow-hidden border border-outline-variant">
                    <div className="bg-primary h-full w-[70%]"></div>
                  </div>
                </div>
              </div>
              <span className="font-label-md text-label-md block text-center">Goal tracking</span>
            </div>
            {/* Mockup 2 */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-outline-variant p-4 aspect-video shadow-sm">
                <div className="h-full w-full bg-surface-container-highest rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-fixed"></div>
                    <div className="h-2 w-1/3 bg-primary rounded"></div>
                    <div className="ml-auto w-8 h-3 bg-primary-container rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-secondary-fixed"></div>
                    <div className="h-2 w-1/3 bg-primary rounded"></div>
                    <div className="ml-auto w-8 h-3 bg-outline-variant rounded"></div>
                  </div>
                </div>
              </div>
              <span className="font-label-md text-label-md block text-center">Team approvals</span>
            </div>
            {/* Mockup 3 */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-outline-variant p-4 aspect-video shadow-sm">
                <div className="h-full w-full bg-surface-container-highest rounded-lg flex items-end justify-around p-3 gap-1">
                  <div className="bg-primary h-[40%] w-3 rounded-t"></div>
                  <div className="bg-primary h-[60%] w-3 rounded-t"></div>
                  <div className="bg-primary h-[90%] w-3 rounded-t"></div>
                  <div className="bg-primary h-[50%] w-3 rounded-t"></div>
                </div>
              </div>
              <span className="font-label-md text-label-md block text-center">Analytics</span>
            </div>
            {/* Mockup 4 */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-outline-variant p-4 aspect-video shadow-sm">
                <div className="h-full w-full bg-surface-container-highest rounded-lg p-3 space-y-2">
                  <div className="h-1.5 w-full bg-outline-variant rounded"></div>
                  <div className="h-1.5 w-full bg-outline-variant rounded"></div>
                  <div className="h-1.5 w-3/4 bg-outline-variant rounded"></div>
                </div>
              </div>
              <span className="font-label-md text-label-md block text-center">Reports</span>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-outline-variant py-12 px-container-padding mt-20">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-gutter">
          <div className="flex items-center gap-base">
            <span className="font-headline-md text-headline-md font-bold text-primary">GoalConnect Portal</span>
          </div>
          <nav className="flex gap-section-gap font-label-md text-label-md text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="#">Help Center</a>
            <a className="hover:text-primary transition-colors" href="#">Support</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          </nav>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            © 2024 GoalConnect. Internal Enterprise Use Only.
          </div>
        </div>
      </footer>
    </>
  );
}
