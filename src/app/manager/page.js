'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import RouteGuard from '../../components/RouteGuard';
import Link from 'next/link';
import { db, auth } from '../../firebase';
import { collection, addDoc, Timestamp, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logAuditAction } from '../../utils/audit';
import { seedDatabaseIfNeeded } from '../../utils/seeding';
import { getUserProfile } from '../../utils/auth';

export default function ManagerDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharedGoal, setSharedGoal] = useState({ title: '', target: '', employees: [] });
  const [activities, setActivities] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let unsubscribeAudit;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await seedDatabaseIfNeeded(currentUser.uid);
        const userProf = await getUserProfile(currentUser.uid);
        setProfile(userProf);

        const qAudit = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10));
        unsubscribeAudit = onSnapshot(qAudit, (snapshot) => {
          const fetchedLogs = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let statusType = 'info';
            if (data.action.includes('Approved')) statusType = 'success';
            if (data.action.includes('Returned') || data.action.includes('Rework')) statusType = 'warning';
            if (data.action.includes('Created')) statusType = 'success';
            const displayName = data.actorName || data.userId || 'System';
            return {
              id: docSnap.id,
              initials: displayName.substring(0, 2).toUpperCase(),
              name: displayName,
              bg: 'bg-primary-container text-white',
              action: data.details || data.action,
              type: data.action,
              statusType,
              statusText: 'Logged',
              time: data.timestamp
                ? new Date(data.timestamp.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'
            };
          });
          setActivities(fetchedLogs);
        }, (error) => {
          console.error('[Manager] onSnapshot audit logs error:', error);
        });
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeAudit) unsubscribeAudit();
    };
  }, []);

  const handleCreateSharedGoal = async () => {
    if (!auth.currentUser) return;
    try {
      const baseGoal = {
        title: sharedGoal.title,
        description: `Shared Team KPI: ${sharedGoal.title}`,
        targetValue: sharedGoal.target,
        uom: 'Numeric',
        weightage: 10,
        thrustArea: 'Infrastructure', // Map to Customer Satisfaction
        thrustColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
        status: 'Approved',
        locked: true, 
        isShared: true,
        primaryOwner: 'Manager',
        createdAt: Timestamp.now(),
      };

      // Query all employee UIDs dynamically from goals database
      const goalsSnap = await getDocs(collection(db, 'goals'));
      const employeeUids = new Set();
      goalsSnap.forEach(doc => {
        const data = doc.data();
        if (data.createdBy && data.createdBy !== auth.currentUser.uid && data.createdBy !== 'system' && data.createdBy !== 'global') {
          employeeUids.add(data.createdBy);
        }
      });

      // Also add the active mock employees' targets
      const targetUids = Array.from(employeeUids);
      if (targetUids.length === 0) {
        // Fallback to current user uid so it shows up in the current demo session
        targetUids.push(auth.currentUser.uid);
      }

      for (const empUid of targetUids) {
        await addDoc(collection(db, 'goals'), {
          ...baseGoal,
          createdBy: empUid
        });
      }
      
      // If the current manager uid was not already written to, write a copy for them too
      if (!targetUids.includes(auth.currentUser.uid)) {
        await addDoc(collection(db, 'goals'), {
          ...baseGoal,
          createdBy: auth.currentUser.uid
        });
      }

      await logAuditAction('Shared KPI Assigned', `Assigned ${sharedGoal.title} to team members.`, auth.currentUser.uid, null, profile?.name || 'Manager');
      
      fetchAuditLogs();
      setIsModalOpen(false);
      setSharedGoal({ title: '', target: '', employees: [] });
    } catch (error) {
      console.error("Error creating shared goal:", error);
      alert("Failed to create shared goal.");
    }
  };

  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager" onNewGoal={() => setIsModalOpen(true)}>
        <div className="space-y-section-gap">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">Team Performance Dashboard</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-1">Oversight for <span className="font-bold text-primary">Q3 Global Strategy</span></p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined text-body-sm">calendar_today</span>
              This Month
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md shadow-md hover:opacity-90 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-body-sm">add</span>
              New Team Goal
            </button>
          </div>
        </section>

        {/* Escalation Alert Panel */}
        <div className="bg-error-container/30 border border-error/20 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-error text-on-error p-2 rounded-lg">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-md text-label-md text-on-error-container">Critical Escalation Alert</h4>
            <p className="font-body-sm text-body-sm text-on-error-container/80">3 goals are currently 48+ hours past their deadline. Priority action required for Department Alpha.</p>
          </div>
          <Link href="/manager/approvals" className="bg-error text-on-error px-4 py-1.5 rounded-lg font-label-sm text-label-sm hover:opacity-90 text-center flex items-center justify-center">Review Alerts</Link>
        </div>

        {/* Bento Grid Dashboard */}
        <div className="grid grid-cols-12 gap-gutter">
          {/* Team Performance Heatmap (Large Widget) */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Team Performance Heatmap</h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><span className="w-3 h-3 rounded-sm bg-surface-container-highest"></span> Low</span>
                <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant"><span className="w-3 h-3 rounded-sm bg-primary-container"></span> High</span>
              </div>
            </div>
            {/* Mock Heatmap Content */}
            <div className="grid grid-cols-7 gap-2">
              {/* Header Labels */}
              <div className="col-start-2 text-center font-label-sm text-label-sm text-outline">Mon</div>
              <div className="text-center font-label-sm text-label-sm text-outline">Tue</div>
              <div className="text-center font-label-sm text-label-sm text-outline">Wed</div>
              <div className="text-center font-label-sm text-label-sm text-outline">Thu</div>
              <div className="text-center font-label-sm text-label-sm text-outline">Fri</div>
              <div className="text-center font-label-sm text-label-sm text-outline">Sat</div>
              {/* Rows */}
              <div className="text-right font-label-sm text-label-sm text-outline pr-2 py-1">Morning</div>
              <div className="h-10 rounded-md bg-primary/20"></div>
              <div className="h-10 rounded-md bg-primary/40"></div>
              <div className="h-10 rounded-md bg-primary/80"></div>
              <div className="h-10 rounded-md bg-primary/60"></div>
              <div className="h-10 rounded-md bg-primary/30"></div>
              <div className="h-10 rounded-md bg-surface-container-low"></div>
              <div className="text-right font-label-sm text-label-sm text-outline pr-2 py-1">Midday</div>
              <div className="h-10 rounded-md bg-primary/90"></div>
              <div className="h-10 rounded-md bg-primary/70"></div>
              <div className="h-10 rounded-md bg-primary"></div>
              <div className="h-10 rounded-md bg-primary/80"></div>
              <div className="h-10 rounded-md bg-primary/50"></div>
              <div className="h-10 rounded-md bg-surface-container-low"></div>
              <div className="text-right font-label-sm text-label-sm text-outline pr-2 py-1">Evening</div>
              <div className="h-10 rounded-md bg-primary/30"></div>
              <div className="h-10 rounded-md bg-primary/10"></div>
              <div className="h-10 rounded-md bg-primary/40"></div>
              <div className="h-10 rounded-md bg-primary/20"></div>
              <div className="h-10 rounded-md bg-primary/10"></div>
              <div className="h-10 rounded-md bg-surface-container-low"></div>
            </div>
            <div className="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">Productivity peaks observed between 10:00 AM - 1:00 PM Wed/Thu.</p>
              <Link href="/manager" className="text-primary font-label-md text-label-md hover:underline">Full Analytics</Link>
            </div>
          </div>
          
          {/* Pending Approvals Widget */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant rounded-xl flex flex-col shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Pending Approvals</h3>
              <span className="bg-primary text-on-primary px-2 py-0.5 rounded-full text-label-sm font-bold">12</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[340px] custom-scrollbar">
              {/* List Item */}
              <div className="p-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                <div className="flex items-start gap-3">
                  <img alt="Sara Jenkins" className="w-10 h-10 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADCqvWqb-ZWGh3Hv_3HybWjCwX11u0a_qq-D3wRo-Fl6w_KbnZu07QeQApvSQ4sQIxrMlB7mHdc996qZLeScEmtBuGepBwUmwq4cXaWZO-EwRklW_i6-RB7WJw9PheFl2dHMOgnVqovmHJNwsrmQF6o2uHxAhfrWprkZKwGYFf4FbDVAprPfXSuO4pIhwATROCPmWiA4IXrgWYF-Cn86XQk14wPxG-kuo8h6hVZVOCq-9fKwBtP0V6-YHc055Sqa-d4wpHpnE-oDLS" />
                  <div className="flex-1">
                    <h5 className="font-label-md text-label-md text-on-surface">Sara Jenkins</h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Completed Goal: "Client Retention v2"</p>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/manager/approvals" className="flex-1 bg-primary text-on-primary py-1.5 rounded-md text-label-sm font-bold text-center block">Approve</Link>
                      <Link href="/manager/approvals" className="flex-1 bg-surface border border-outline-variant text-on-surface-variant py-1.5 rounded-md text-label-sm text-center block">Review</Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* List Item */}
              <div className="p-4 border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                <div className="flex items-start gap-3">
                  <img alt="Michael Chen" className="w-10 h-10 rounded-full border border-outline-variant object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuChNXjp5zrgu9tvfo-0cec8CBToNtbN0yDqQQ4wvfG6AqWl_-fwduqwseZthyPBPnAiZnzHbkepzspqGqqSOMDb4d7RVmp2F8Oi2ccpGyEvDDfPgIEk-SlLfiJpwq2qDRhZd8xDJNPJTMy6Cm7AUapI-DBc-9-rHcuUDlDdFyG5cT42hTAjiwzuMs5GmXqOGWYjAJiwR3a-e85ZYNcCLpmDr3F9YR1bzvF7eH-M9pJ8ROS71MJrmJ2eyO_Ff8fT_Efl6aNjpxNMIgEQ" />
                  <div className="flex-1">
                    <h5 className="font-label-md text-label-md text-on-surface">Michael Chen</h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Update: "Backend Migration Phase 1"</p>
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href="/manager/approvals" className="flex-1 bg-primary text-on-primary py-1.5 rounded-md text-label-sm font-bold text-center block">Approve</Link>
                      <Link href="/manager/approvals" className="flex-1 bg-surface border border-outline-variant text-on-surface-variant py-1.5 rounded-md text-label-sm text-center block">Review</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 text-center">
              <Link href="/manager/approvals" className="font-label-md text-label-md text-primary hover:underline">View All Approvals</Link>
            </div>
          </div>
          
          {/* Team Progress Bar Charts */}
          <div className="col-span-12 lg:col-span-12 bg-white border border-outline-variant rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-8">Team Goal Completion Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Employee Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container text-label-sm">SJ</div>
                    <span className="font-label-md text-label-md text-on-surface">Sara J.</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary">85%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">On Track • 12/14 Goals</p>
              </div>
              {/* Employee Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-on-surface text-label-sm">MC</div>
                    <span className="font-label-md text-label-md text-on-surface">Michael C.</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary">42%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '42%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Needs Sync • 5/12 Goals</p>
              </div>
              {/* Employee Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed text-label-sm">AW</div>
                    <span className="font-label-md text-label-md text-on-surface">Alex W.</span>
                  </div>
                  <span className="font-label-md text-label-md text-error">92%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-error">Critical Deadline (3h left)</p>
              </div>
              {/* Employee Progress */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed text-label-sm">LN</div>
                    <span className="font-label-md text-label-md text-on-surface">Lisa N.</span>
                  </div>
                  <span className="font-label-md text-label-md text-primary">100%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Completed • 10/10 Goals</p>
              </div>
            </div>
          </div>
          
          {/* Recent Submissions Notifications */}
          <div className="col-span-12 lg:col-span-12 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Team Activity</h3>
              <button className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-bright">
                  <tr>
                    <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Member</th>
                    <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Action</th>
                    <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Submission Type</th>
                    <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Status</th>
                    <th className="px-6 py-3 font-label-md text-label-md text-on-surface-variant">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {activities.map(activity => (
                    <tr key={activity.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${activity.bg} flex items-center justify-center font-bold text-xs`}>{activity.initials}</div>
                        <span className="font-body-md text-body-md text-on-surface">{activity.name}</span>
                      </td>
                      <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant">{activity.action}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">{activity.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        {activity.statusType === 'success' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-bold bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-700"></span> {activity.statusText}
                          </span>
                        )}
                        {activity.statusType === 'warning' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-bold bg-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span> {activity.statusText}
                          </span>
                        )}
                        {activity.statusType === 'info' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-label-sm font-bold bg-blue-100 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span> {activity.statusText}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-body-sm text-body-sm text-on-surface-variant">{activity.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Shared Goal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-outline-variant">
              <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">group_add</span>
                  Create Shared Team Goal
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-6 space-y-5 bg-white">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">KPI Title</label>
                  <input 
                    type="text" 
                    value={sharedGoal.title}
                    onChange={e => setSharedGoal({...sharedGoal, title: e.target.value})}
                    placeholder="e.g. Expand European Market Share"
                    className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Target</label>
                  <input 
                    type="text" 
                    value={sharedGoal.target}
                    onChange={e => setSharedGoal({...sharedGoal, target: e.target.value})}
                    placeholder="e.g. 15% Increase"
                    className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Assign to Employees</label>
                  <div className="border border-outline-variant rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 bg-surface-container-lowest custom-scrollbar">
                    {['Sara Jenkins', 'Michael Chen', 'Alex Wong', 'Lisa Norton', 'Robert King'].map(emp => (
                      <label key={emp} className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-md cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          checked={sharedGoal.employees.includes(emp)}
                          onChange={e => {
                            const newEmployees = e.target.checked 
                              ? [...sharedGoal.employees, emp]
                              : sharedGoal.employees.filter(em => em !== emp);
                            setSharedGoal({...sharedGoal, employees: newEmployees});
                          }}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-[10px] font-bold">
                            {emp.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-body-sm text-body-sm text-on-surface">{emp}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateSharedGoal}
                  disabled={!sharedGoal.title || !sharedGoal.target || sharedGoal.employees.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Create & Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </RouteGuard>
  );
}
