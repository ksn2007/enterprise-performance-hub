'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';
import { db, auth } from '../../../firebase';
import { collection, query, where, doc, updateDoc, Timestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logAuditAction } from '../../../utils/audit';
import { seedDatabaseIfNeeded } from '../../../utils/seeding';
import { getUserProfile } from '../../../utils/auth';

export default function ManagerApprovals() {
  const [pendingGoals, setPendingGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [managerComment, setManagerComment] = useState('');
  const [notification, setNotification] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubscribePending;
    let unsubscribeAudit;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Module-level guard in seeding.js ensures this never re-seeds
        await seedDatabaseIfNeeded(currentUser.uid);
        const userProf = await getUserProfile(currentUser.uid);
        setProfile(userProf);

        // Query goals with status 'Pending' (BRD: submitted by employee, awaiting manager review)
        const qPending = query(collection(db, 'goals'), where('status', '==', 'Pending'));
        unsubscribePending = onSnapshot(qPending, (snapshot) => {
          const fetchedGoals = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setPendingGoals(fetchedGoals);
          setIsLoading(false);
        }, (error) => {
          console.error('[Approvals] onSnapshot pending goals error:', error);
          setIsLoading(false);
        });

        // Subscribe to audit logs (latest 5)
        const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
        unsubscribeAudit = onSnapshot(qAudit, (snapshot) => {
          const logs = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let icon = 'history';
            let bg = 'bg-surface-container-highest';
            let iconColor = 'text-on-surface-variant';

            if (data.action.includes('Approved')) {
              icon = 'check_circle'; bg = 'bg-primary'; iconColor = 'text-white';
            } else if (data.action.includes('Returned') || data.action.includes('Rework')) {
              icon = 'assignment_return'; bg = 'bg-error-container'; iconColor = 'text-error';
            } else if (data.action.includes('Created')) {
              icon = 'edit'; bg = 'bg-primary'; iconColor = 'text-white';
            } else if (data.action.includes('Submitted')) {
              icon = 'send'; bg = 'bg-surface-container-highest'; iconColor = 'text-on-surface-variant';
            }

            return {
              id: docSnap.id,
              actor: data.actorName || data.userId || 'System',
              action: data.action,
              details: data.details || '',
              icon, bg, iconColor,
              time: data.timestamp
                ? new Date(data.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'
            };
          });
          setAuditLogs(logs);
        }, (error) => {
          console.error('[Approvals] onSnapshot audit logs error:', error);
        });

      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribePending) unsubscribePending();
      if (unsubscribeAudit) unsubscribeAudit();
    };
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Approve ALL pending goals at once
  const handleApproveAll = async () => {
    if (!user || pendingGoals.length === 0) return;
    setIsLoading(true);
    try {
      const updatePromises = pendingGoals.map((g) =>
        updateDoc(doc(db, 'goals', g.id), {
          status: 'Approved',
          locked: true,
          managerComment: managerComment || '',
          updatedAt: Timestamp.now()
        })
      );
      await Promise.all(updatePromises);
      await logAuditAction(
        'Goals Approved',
        `Approved ${pendingGoals.length} goal(s).`,
        user.uid,
        null,
        profile?.name || 'Manager'
      );
      setManagerComment('');
      showNotification('success', 'All goals approved successfully!');
    } catch (error) {
      console.error('[Approvals] Error approving goals:', error);
      showNotification('error', 'Failed to approve goals.');
    } finally {
      setIsLoading(false);
    }
  };

  // Return ALL pending goals for rework
  const handleReturnForRework = async () => {
    if (!user || pendingGoals.length === 0) return;
    if (!managerComment.trim()) {
      showNotification('error', 'Please provide feedback before returning for rework.');
      return;
    }
    setIsLoading(true);
    try {
      const updatePromises = pendingGoals.map((g) =>
        updateDoc(doc(db, 'goals', g.id), {
          status: 'Returned',
          locked: false,
          managerComment,
          updatedAt: Timestamp.now()
        })
      );
      await Promise.all(updatePromises);
      await logAuditAction(
        'Goals Returned',
        `Returned ${pendingGoals.length} goal(s) for rework.`,
        user.uid,
        null,
        profile?.name || 'Manager'
      );
      setManagerComment('');
      showNotification('success', 'Goals returned for rework.');
    } catch (error) {
      console.error('[Approvals] Error returning goals:', error);
      showNotification('error', 'Failed to return goals.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-section-gap gap-4">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant mb-2">
            <span className="text-label-sm font-label-sm">Team Overview</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-label-sm font-label-sm text-primary">Goal Approval Workflow</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Pending Goal Approvals</h2>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined">filter_list</span>
            Filter List
          </button>
          <button 
            onClick={handleApproveAll}
            disabled={pendingGoals.length === 0 || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-label-md shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50">
            <span className="material-symbols-outlined">check_circle</span>
            Approve All ({pendingGoals.length})
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-label-md text-label-md transition-all shadow-sm ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-error-container/20 text-error border border-error/30'
        }`}>
          <span className="material-symbols-outlined text-[20px]">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar: Employee List */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low">
              <h3 className="font-label-md text-label-md text-on-surface">Team Members (5)</h3>
            </div>
            <div className="divide-y divide-outline-variant max-h-[600px] overflow-y-auto custom-scrollbar">
              {/* Active Employee */}
              <div className="p-4 bg-secondary-container/30 border-l-4 border-primary flex items-center gap-3 cursor-pointer">
                <img alt="Employee" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWUh0BlAGupQNtUu4T-uYS-kTXflq0QMyshCikp09uyQ8KxB5psMRHPdfgTmu3LbbMfqO4oK92A9qJ2boKtbtvGoZewwhDxNTRzkck-CDGlFymiQVNKb1J9M4Vx6Op1KelzC7XzGUfbs0ARrnjVRp0aY2-4Mq8_bl2OFbft9hCAXH_USMQccdbhgIhOTid_orXk1HNGONbmahBRX4p1a-IzMBQH0Nuk0jWy_cmb-Qwncs-qF8Txu5xTo3G28uarBhrtC7-fcHaj9t3" />
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">Sarah Jenkins</p>
                  <p className="text-[11px] text-primary font-bold">Needs Review</p>
                </div>
                <span className="material-symbols-outlined text-primary text-[18px]">pending_actions</span>
              </div>
              {/* Other Employees */}
              <div className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-3 cursor-pointer">
                <img alt="Employee" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChfRWYSa_XJ-QNRU0nDnGXNq1z_pBczNh7cKdaZGUEMoL8EW9bmGNBxz9bM1DqZfeS766nua1R5bbgTHHX-KJ-WEkvIM-icRUoNkNxz_oQ7mZS9YwjL_cLT6OdvUsqwOlW2nxsRT2mc1Q__qVij-L9t0XoGVgyvaaKDEin-9yA0g5RXEogP40uo_YP7GG6oG9O37d7oAb6uUkaUmWVLo1MkezNTppWLAXHDLw-fvIBXwd5kdo6fxLGIcdJ5K27NlaJ_gi9G1fjrP-F" />
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">Vijay</p>
                  <p className="text-[11px] text-on-surface-variant">Review Started</p>
                </div>
              </div>
              <div className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-3 cursor-pointer opacity-70">
                <img alt="Employee" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-86H0ieBvuqpwnxIzH4qVbD17JfxYBHCodSd9eV5Lq_moSFWjTPnSGxmaAAYhvaTgB_uw5ZguJ_KLpm2WHd_-SVwpPuvmfjnnvOaTfww9HcecymIQIGQg5FbWGHnnbd8PPx6bxbz9U7XIVXZQ8Et0Jh9sPdjgKhm_aQIr-TX7VmbHfeg54l8u5e5ugU4T00zOpE4HkO0dRNub3T3SBw2GiO5vNo_Ywe3QuGnqVfRKmQTFatcI-oMYcD4chxRZ7fHwYp0cqs5t26bx" />
                <div className="flex-1 min-w-0">
                  <p className="font-label-md text-label-md text-on-surface truncate">Elena Rodriguez</p>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-success" style={{ color: '#10b981' }}>check_circle</span>
                    <p className="text-[11px] text-on-surface-variant">Approved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-label-md text-label-md mb-2">Quarterly Progress</h4>
              <p className="text-3xl font-extrabold mb-4">68%</p>
              <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                <div className="bg-white h-full rounded-full" style={{ width: '68%' }}></div>
              </div>
              <p className="text-[11px] opacity-80">2/5 sheets approved this quarter</p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10 rotate-12">rocket_launch</span>
          </div>
        </div>
        
        {/* Main Section: Goal Review View */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* Review Detail Card */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-sm">
            <div className="p-6 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4">
              <div className="w-full flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary/20" style={{ width: '20%' }}></div>
                  <div className="h-full bg-primary/40" style={{ width: '20%' }}></div>
                  <div className="h-full bg-primary" style={{ width: '20%' }}></div>
                </div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Step 3 of 5: Under Review</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[32px]">person</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Sarah Jenkins</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Senior Frontend Engineer • Q4 Performance Goals</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-label-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Draft v3
                </span>
                <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-bold uppercase tracking-wider">Under Review</span>
              </div>
            </div>
            
            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 text-left font-label-md text-label-md text-on-surface-variant w-1/3">Strategic Goal / KPI</th>
                    <th className="px-6 py-4 text-center font-label-md text-label-md text-on-surface-variant">Employee Target</th>
                    <th className="px-6 py-4 text-center font-label-md text-label-md text-on-surface-variant">Weightage</th>
                    <th className="px-6 py-4 text-center font-label-md text-label-md text-on-surface-variant">Timeline</th>
                    <th className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant">Manager Adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                          <span className="font-body-md text-on-surface-variant">Loading approvals...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pendingGoals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant font-body-md">
                        No pending approvals at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingGoals.map(goal => (
                      <tr key={goal.id} className="hover:bg-surface-bright transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="font-body-md text-body-md text-on-surface font-semibold">{goal.title}</span>
                            <span className="text-body-sm text-on-surface-variant">{goal.description}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-3 py-1 bg-surface-container-low rounded-lg font-body-sm text-on-surface-variant">{goal.targetValue} {goal.uom}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="font-body-md text-body-md text-on-surface">{goal.weightage}%</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="font-body-sm text-on-surface-variant">Dec 31, 2026</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-label-sm text-primary bg-primary/10 px-2 py-1 rounded">No Adjustment Needed</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-surface-container-lowest">
                  <tr>
                    <td className="px-6 py-4 text-right font-label-md text-label-md text-on-surface-variant" colSpan="2">Total Weightage:</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-headline-md text-headline-md text-primary">100%</span>
                    </td>
                    <td></td>
                    <td className="px-6 py-5 text-center">
                      <div className="relative">
                        <input className="w-32 border border-outline rounded-lg px-3 py-1 text-center text-body-sm focus:ring-primary focus:border-primary" type="date" defaultValue="2024-12-31" />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {/* Comments Section */}
            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest">
              <label className="block font-label-md text-label-md text-on-surface mb-3">Manager Comments & Feedback</label>
              <textarea 
                value={managerComment}
                onChange={e => setManagerComment(e.target.value)}
                className="w-full border border-outline-variant rounded-xl p-4 text-body-md focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline-variant" 
                placeholder="Provide feedback on the proposed targets or explain adjustments made..." 
                rows="3"
              ></textarea>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <p className="text-label-sm font-label-sm">Employee will be notified upon submission.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleReturnForRework} disabled={pendingGoals.length === 0 || isLoading} className="px-6 py-2.5 border border-error text-error rounded-lg font-label-md hover:bg-error-container transition-all flex items-center gap-2 disabled:opacity-50">
                    <span className="material-symbols-outlined">assignment_return</span>
                    Return for Rework
                  </button>
                  <button onClick={handleApproveAll} disabled={pendingGoals.length === 0 || isLoading} className="px-8 py-2.5 bg-primary text-white rounded-lg font-label-md shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50">
                    <span className="material-symbols-outlined">check</span>
                    Approve Goals
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bento Grid Bottom: Audit & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Audit Timeline */}
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-headline-md text-headline-md text-on-surface">Audit Timeline</h4>
                <span className="material-symbols-outlined text-outline">history</span>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
                {auditLogs.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant text-center py-4">No recent activity.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-8">
                      <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] ${log.bg} rounded-full flex items-center justify-center border-4 border-white shadow-sm`}>
                        <span className={`material-symbols-outlined text-[12px] ${log.iconColor}`}>{log.icon}</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface">{log.action} by {log.actor}</p>
                      <p className="text-body-sm text-on-surface-variant">{log.details}</p>
                      <p className="text-[10px] text-outline mt-1 font-mono">{log.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Data Insights Widget */}
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-6 overflow-hidden relative">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-6">Target Benchmarking</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-label-sm font-label-sm">vs Team Average</span>
                      <span className="text-label-sm font-label-sm text-primary">+12% Higher</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-label-sm font-label-sm">vs Role Baseline</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Aligned</span>
                    </div>
                    <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-outline-variant">
                  <div className="flex items-start gap-3 bg-surface-container-low p-3 rounded-lg">
                    <span className="material-symbols-outlined text-primary">lightbulb</span>
                    <p className="text-body-sm text-on-surface-variant">Sarah's targets are currently more ambitious than 80% of the Frontend team. High potential for "Exceeds Expectations" rating.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Action Button (FAB) - For Quick Actions on Mobile */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-transform z-50">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </DashboardLayout>
    </RouteGuard>
  );
}
