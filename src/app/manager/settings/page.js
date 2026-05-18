'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase';
import { getUserProfile } from '../../../utils/auth';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';

export default function ManagerSettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    submissions: true,
    checkins: true,
    escalations: true
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveStatus('Saving changes...');
    setTimeout(() => {
      setSaveStatus('Manager portal settings updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager">
        <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl">
          {/* Header */}
          <div className="border-b border-outline-variant pb-6">
            <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Manager Portal Settings</h1>
            <p className="text-body-md text-on-surface-variant">Manage department parameters, adjust check-in notifications, and review security access keys.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Save Status Alert */}
            {saveStatus && (
              <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl font-label-md text-label-md animate-in slide-in-from-top duration-200">
                {saveStatus}
              </div>
            )}

            {/* Profile Information */}
            <div className="bg-white border border-outline-variant rounded-2xl p-8 space-y-6">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span> Professional Attributes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="name">Manager Name</label>
                  <input 
                    disabled 
                    type="text" 
                    id="name"
                    value={profile?.name || 'Loading...'} 
                    className="px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">Work Email</label>
                  <input 
                    disabled 
                    type="email" 
                    id="email"
                    value={profile?.email || 'Loading...'} 
                    className="px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="dept">Managed Department</label>
                  <input 
                    disabled 
                    type="text" 
                    id="dept"
                    value={profile?.department || 'Loading...'} 
                    className="px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="role">Authorization Level</label>
                  <input 
                    disabled 
                    type="text" 
                    id="role"
                    value="MANAGER (ROLE_LEVEL_2)" 
                    className="px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-body-md text-on-surface-variant cursor-not-allowed outline-none font-semibold text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Manager Specific Notifications Toggles */}
            <div className="bg-white border border-outline-variant rounded-2xl p-8 space-y-6">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">notifications_active</span> Team Notifications Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface font-semibold">Subordinate Goal Submissions</h3>
                    <p className="text-body-sm text-on-surface-variant">Email me instantly when an employee submits goals to my approvals queue.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotifications({...notifications, submissions: !notifications.submissions})}
                    className={`w-12 h-6 rounded-full p-1 transition-colors outline-none ${notifications.submissions ? 'bg-primary flex justify-end' : 'bg-outline-variant flex justify-start'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                  </button>
                </div>
                <div className="h-[1px] bg-outline-variant"></div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface font-semibold">Check-in Threshold Alerts</h3>
                    <p className="text-body-sm text-on-surface-variant">Notify me when subordinates fail to check-in on approved goals for more than 14 days.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotifications({...notifications, checkins: !notifications.checkins})}
                    className={`w-12 h-6 rounded-full p-1 transition-colors outline-none ${notifications.checkins ? 'bg-primary flex justify-end' : 'bg-outline-variant flex justify-start'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                  </button>
                </div>
                <div className="h-[1px] bg-outline-variant"></div>

                <div className="flex justify-between items-center py-2">
                  <div>
                    <h3 className="font-label-md text-label-md text-on-surface font-semibold">Unlock Escalation Reminders</h3>
                    <p className="text-body-sm text-on-surface-variant">Receive dashboard alerts for subordinate goal edit/unlock requests.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotifications({...notifications, escalations: !notifications.escalations})}
                    className={`w-12 h-6 rounded-full p-1 transition-colors outline-none ${notifications.escalations ? 'bg-primary flex justify-end' : 'bg-outline-variant flex justify-start'}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end gap-3 border-t border-outline-variant pt-6">
              <button 
                type="button" 
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md hover:bg-surface-container-low transition-colors"
              >
                Reset Default Preferences
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Save Portal Preferences
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
