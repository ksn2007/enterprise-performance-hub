'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import RouteGuard from '../../components/RouteGuard';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy, limit, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logAuditAction } from '../../utils/audit';
import { seedDatabaseIfNeeded } from '../../utils/seeding';
import { getUserProfile } from '../../utils/auth';

export default function AdminDashboard() {
  const [isUnlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [lockedGoals, setLockedGoals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubscribeGoals;
    let unsubscribeAudit;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await seedDatabaseIfNeeded(currentUser.uid);
        const userProf = await getUserProfile(currentUser.uid);
        setProfile(userProf);

        // Subscribe to all locked goals
        const qGoals = query(collection(db, 'goals'), where('locked', '==', true));
        unsubscribeGoals = onSnapshot(qGoals, (snapshot) => {
          const goals = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          setLockedGoals(goals);
        }, (error) => {
          console.error('[Admin] onSnapshot locked goals error:', error);
        });

        // Subscribe to audit logs (latest 5)
        const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
        unsubscribeAudit = onSnapshot(qAudit, (snapshot) => {
          const fetchedLogs = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let icon = 'history';
            let bg = 'bg-surface-container-high';
            let iconColor = 'text-on-surface';

            if (data.action.includes('Unlock') || data.action.includes('Returned')) {
              icon = 'lock_open'; bg = 'bg-primary-fixed'; iconColor = 'text-primary';
            } else if (data.action.includes('Approved')) {
              icon = 'rule'; bg = 'bg-green-100'; iconColor = 'text-green-700';
            } else if (data.action.includes('Created') || data.action.includes('Assigned')) {
              icon = 'add_circle'; bg = 'bg-secondary-container'; iconColor = 'text-on-secondary-container';
            }

            return {
              id: docSnap.id,
              user: data.actorName || data.userId || 'System',
              action: data.action,
              details: data.details || '',
              icon, bg, iconColor,
              time: data.timestamp
                ? new Date(data.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'
            };
          });
          setActivities(fetchedLogs);
        }, (error) => {
          console.error('[Admin] onSnapshot audit logs error:', error);
        });
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeGoals) unsubscribeGoals();
      if (unsubscribeAudit) unsubscribeAudit();
    };
  }, []);

  const handleUnlockGoal = async () => {
    if (!selectedGoal || !auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'goals', selectedGoal.id), {
        locked: false,
        status: 'Returned',
        updatedAt: Timestamp.now()
      });
      await logAuditAction(
        'Goal Unlocked',
        `Admin unlocked goal: "${selectedGoal.title}"`,
        auth.currentUser.uid,
        selectedGoal.id,
        profile?.name || 'Admin'
      );
      setUnlockModalOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('[Admin] Error unlocking goal:', error);
    }
  };

  return (
    <RouteGuard requiredRole="admin">
      <DashboardLayout role="admin">
      <div className="space-y-section-gap">
        {/* Page Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-gutter">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface mb-2">Organization Analytics</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Real-time performance tracking and goal completion metrics across all departments.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
              Goal Cycle Config
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:shadow-md transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">download</span>
              Report Export
            </button>
          </div>
        </div>

        {/* Global Metrics - Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-secondary-container rounded-lg text-primary">
                <span className="material-symbols-outlined">lock</span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Locked Goals</p>
              <h3 className="font-headline-xl text-headline-xl text-on-surface">8,420</h3>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-fixed rounded-lg text-primary">
                <span className="material-symbols-outlined">refresh</span>
              </div>
              <span className="text-label-sm font-label-sm text-primary bg-primary-fixed px-2 py-1 rounded-full">3 Active</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Active Review Cycles</p>
              <h3 className="font-headline-xl text-headline-xl text-on-surface">3</h3>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-error-container rounded-lg text-error">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <span className="text-label-sm font-label-sm text-error bg-error-container px-2 py-1 rounded-full">High Priority</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Escalations</p>
              <h3 className="font-headline-xl text-headline-xl text-on-surface">14</h3>
            </div>
          </div>
          <div className="bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-tertiary-fixed rounded-lg text-tertiary">
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Awaiting Approval</p>
              <h3 className="font-headline-xl text-headline-xl text-on-surface">156</h3>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-gutter">
          {/* Department Performance (Bar) */}
          <div className="lg:col-span-4 bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-headline-md text-headline-md text-on-surface">Department Performance Comparison</h4>
              <button className="material-symbols-outlined text-on-surface-variant">more_vert</button>
            </div>
            <div className="space-y-6">
              {/* Bar Item */}
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm font-label-md">
                  <span>Engineering</span>
                  <span>92%</span>
                </div>
                <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              {/* Bar Item */}
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm font-label-md">
                  <span>Product & Design</span>
                  <span>88%</span>
                </div>
                <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>
              {/* Bar Item */}
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm font-label-md">
                  <span>Sales & Marketing</span>
                  <span>74%</span>
                </div>
                <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
              {/* Bar Item */}
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm font-label-md">
                  <span>Human Resources</span>
                  <span>95%</span>
                </div>
                <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              {/* Bar Item */}
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm font-label-md">
                  <span>Finance</span>
                  <span>62%</span>
                </div>
                <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quarterly Completion (Asymmetric Visual) */}
          <div className="lg:col-span-3 bg-surface border border-outline-variant rounded-xl p-container-padding shadow-sm flex flex-col">
            <h4 className="font-headline-md text-headline-md text-on-surface mb-6">Quarterly Tracking Status</h4>
            <div className="space-y-5 mb-8">
              <div className="space-y-1">
                <div className="flex justify-between text-body-sm"><span className="font-medium">Completed</span><span className="text-green-600 font-bold">85%</span></div>
                <div className="h-2 bg-surface-container-low rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-body-sm"><span className="font-medium">Pending Submissions</span><span className="text-yellow-600 font-bold">10%</span></div>
                <div className="h-2 bg-surface-container-low rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{ width: '10%' }}></div></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-body-sm"><span className="font-medium">Delayed Check-ins</span><span className="text-error font-bold">5%</span></div>
                <div className="h-2 bg-surface-container-low rounded-full"><div className="h-full bg-error rounded-full" style={{ width: '5%' }}></div></div>
              </div>
              <div className="pt-4 border-t border-outline-variant flex justify-between items-center">
                <span className="text-body-sm text-on-surface-variant">Approval Pending</span>
                <span className="px-3 py-1 bg-primary-fixed text-primary rounded-full text-label-sm font-bold">42 Items</span>
              </div>
            </div>
            
            <div className="bg-primary border border-primary-container rounded-xl p-container-padding shadow-lg text-on-primary overflow-hidden relative flex-1 mt-auto">
              <div className="relative z-10">
                <h4 className="font-headline-md text-headline-md mb-2">Quarterly Completion</h4>
                <p className="text-on-primary-container font-body-sm mb-8">Performance trends over the last 4 quarters.</p>
                <div className="flex items-end justify-between h-48 gap-2">
                  <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div className="w-full bg-primary-fixed-dim/20 rounded-t-lg transition-all hover:bg-primary-fixed-dim/40" style={{ height: '40%' }}></div>
                    <span className="text-label-sm font-label-sm">Q1</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div className="w-full bg-primary-fixed-dim/30 rounded-t-lg transition-all hover:bg-primary-fixed-dim/50" style={{ height: '65%' }}></div>
                    <span className="text-label-sm font-label-sm">Q2</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div className="w-full bg-primary-fixed-dim/50 rounded-t-lg transition-all hover:bg-primary-fixed-dim/70" style={{ height: '85%' }}></div>
                    <span className="text-label-sm font-label-sm">Q3</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                    <div className="w-full bg-primary-fixed-dim rounded-t-lg transition-all hover:shadow-glow" style={{ height: '95%' }}></div>
                    <span className="text-label-sm font-label-sm">Q4</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-primary-container">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-label-sm text-on-primary-container">Growth vs. Prev Quarter</p>
                      <h5 className="text-headline-md font-bold">+12.4%</h5>
                    </div>
                    <span className="material-symbols-outlined text-4xl opacity-50">trending_up</span>
                  </div>
                </div>
              </div>
              {/* Decorative Circle */}
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Audit Feed & Detailed Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Recent Audit Activity Feed */}
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col h-full">
            <div className="p-container-padding border-b border-outline-variant flex justify-between items-center">
              <h4 className="font-headline-md text-headline-md text-on-surface">Recent Audit Activity</h4>
              <span className="text-label-sm font-label-sm text-primary cursor-pointer hover:underline">View All</span>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {activities.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant text-center py-4">No recent activity.</p>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full ${activity.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${activity.iconColor}`}>{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-body-sm text-on-surface"><strong>{activity.user}</strong> {activity.action.toLowerCase()}</p>
                        <span className="text-label-sm text-on-surface-variant whitespace-nowrap ml-2">{activity.time}</span>
                      </div>
                      <div className="mt-1 flex gap-2">
                        <span className="text-body-sm text-on-surface-variant">{activity.details}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h4 className="font-headline-md text-headline-md text-on-surface">System Locked Goals</h4>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 bg-primary-container text-on-primary-container px-3 py-1 rounded-md text-label-sm font-label-sm">
                  {lockedGoals.length} Locked
                </div>
              </div>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Goal Title</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Area</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {lockedGoals.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-on-surface-variant font-body-md">
                        No locked goals found in the system.
                      </td>
                    </tr>
                  ) : (
                    lockedGoals.map(goal => (
                      <tr key={goal.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 font-body-md text-on-surface">{goal.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-label-sm font-label-sm ${goal.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-primary-container text-on-primary-container'}`}>
                            {goal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-body-sm text-on-surface-variant">{goal.thrustArea}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" 
                              title="Unlock for editing" 
                              onClick={() => {
                                setSelectedGoal(goal);
                                setUnlockModalOpen(true);
                              }}>
                              lock_open
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface-container-low text-center mt-auto">
              <button className="text-label-md font-label-md text-primary hover:underline">View All Corporate Cycles</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirm Unlock Modal */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-4 mx-auto">
                <span className="material-symbols-outlined text-3xl">lock_open</span>
              </div>
              <h3 className="text-headline-md font-bold text-center mb-2">Confirm Unlock</h3>
              <p className="text-body-md text-on-surface-variant text-center">Are you sure you want to unlock this goal for editing? This action will be logged in the audit trail.</p>
            </div>
            <div className="p-4 bg-surface-container-low flex gap-3">
              <button onClick={() => { setUnlockModalOpen(false); setSelectedGoal(null); }} className="flex-1 py-2.5 bg-surface border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container-high">Cancel</button>
              <button onClick={handleUnlockGoal} className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-label-md shadow-md hover:opacity-90 active:scale-[0.98]">Confirm Unlock</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </RouteGuard>
  );
}
