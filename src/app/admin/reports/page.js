'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { exportCSV, exportExcel } from '../../../utils/exportReport';

export default function AdminReportsPage() {
  const auditLogs = [
    { actor: 'Jordan Admin', action: 'Goal Unlocked', detail: 'Unlocked EU Edge Upgrade goal for Alex Employee.', timestamp: '2024-05-18 10:14:02' },
    { actor: 'Jordan Admin', action: 'Global Seeding Triggered', detail: 'Idempotent setup generated all enterprise demo credentials.', timestamp: '2024-05-18 09:30:15' },
    { actor: 'Sarah Manager', action: 'Goal Approved', detail: 'Approved Sprint Delivery Times objective.', timestamp: '2024-05-17 14:22:09' },
    { actor: 'Alex Employee', action: 'Goal Submitted', detail: 'Submitted 4 performance goals for review queue.', timestamp: '2024-05-16 11:05:44' }
  ];

  const [currentUid, setCurrentUid] = useState(null);
  const [exportStatus, setExportStatus] = useState('idle'); // idle | loading | success | error

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const handleExport = useCallback(async (format) => {
    if (exportStatus === 'loading') return;
    setExportStatus('loading');
    try {
      if (format === 'csv') {
        await exportCSV('admin', currentUid, 'OrgWide_Achievement_Report');
      } else {
        await exportExcel('admin', currentUid, 'OrgWide_Achievement_Report');
      }
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error('[AdminReports] Export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  }, [currentUid, exportStatus]);

  const isLoading = exportStatus === 'loading';

  return (
    <RouteGuard requiredRole="admin">
      <DashboardLayout role="admin">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">HR Analytics &amp; System Audits</h1>
              <p className="text-body-md text-on-surface-variant">Access system audit logs, check compliance distributions, and review platform SLA scores.</p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3">
              {exportStatus === 'success' && (
                <span className="text-label-sm text-success flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Downloaded!
                </span>
              )}
              {exportStatus === 'error' && (
                <span className="text-label-sm text-error flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  Export failed
                </span>
              )}

              <button
                id="admin-export-csv"
                onClick={() => handleExport('csv')}
                disabled={isLoading}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-label-md font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export org-wide achievement report as CSV"
              >
                {isLoading
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-[18px]">table_view</span>
                }
                Export CSV
              </button>

              <button
                id="admin-export-excel"
                onClick={() => handleExport('excel')}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title="Export org-wide achievement report as Excel (.xlsx)"
              >
                {isLoading
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-[18px]">download</span>
                }
                Export Excel
              </button>
            </div>
          </div>

          {/* Export Info Banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
            <div>
              <p className="font-label-md text-label-md text-primary font-semibold">Organisation-Wide Achievement Report</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Exports <strong>all employee goals</strong> across the organisation — including planned target vs. actual achievement, quarterly check-ins, manager comments, approval status, and lock states. Data is pulled live from Firestore.
              </p>
            </div>
          </div>

          {/* System Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Corporate Goal Compliance</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">98.4%</p>
              <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Pending Lock Requests</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-error">0 Requests</p>
              <span className="text-label-sm text-success font-medium flex items-center gap-1">All unlock queues cleared</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Total Active Profiles</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">3 accounts</p>
              <span className="text-label-sm text-primary font-medium">Employee • Manager • Admin</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Audit Trail Volume</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">432 records</p>
              <span className="text-label-sm text-on-surface-variant font-medium">Firestore synchronized</span>
            </div>
          </div>

          {/* System Load / Activity Breakdown Graph */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">System Activity Index By Category</h2>
            <div className="h-48 flex items-end justify-between px-12 pt-8 border-b border-outline-variant relative">
              <div className="absolute inset-x-0 top-1/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-3/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>

              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[40%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">40%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">SSO Checkins</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[95%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">95%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">Goal Edits</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary/30 hover:bg-primary/40 transition-colors h-[25%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-primary">25%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">Approval Cycles</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[80%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">80%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">Unlock Escalations</span>
              </div>
            </div>
          </div>

          {/* System Audit Action Log */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">HR Portal Integrity logs</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface font-label-md text-label-md text-on-surface-variant">
                  <th className="p-4 pl-6">Actor Name</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Action Detail Details</th>
                  <th className="p-4 pr-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-md">
                {auditLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 pl-6 font-semibold text-on-surface">{row.actor}</td>
                    <td className="p-4 font-semibold text-primary">{row.action}</td>
                    <td className="p-4 text-on-surface-variant">{row.detail}</td>
                    <td className="p-4 pr-6 text-on-surface-variant font-mono text-[13px]">{row.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
