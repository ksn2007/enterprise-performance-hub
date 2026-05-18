'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { exportCSV, exportExcel } from '../../../utils/exportReport';

export default function ManagerReportsPage() {
  const teamLogs = [
    { name: 'Sarah Jenkins', role: 'Frontend Engineer', goal: 'Automate Q4 Invoice Billing System', status: 'Pending Approval', date: '2024-05-18' },
    { name: 'Sarah Jenkins', role: 'Frontend Engineer', goal: 'Design API Gateway for External Vendors', status: 'Pending Approval', date: '2024-05-17' },
    { name: 'Alex Employee', role: 'Full Stack Engineer', goal: 'Expand Regional Infrastructure', status: 'Approved', date: '2024-05-15' },
    { name: 'Alex Employee', role: 'Full Stack Engineer', goal: 'Launch Internal AI Pilot', status: 'Approved', date: '2024-05-14' },
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
        await exportCSV('manager', currentUid, 'Team_Achievement_Report');
      } else {
        await exportExcel('manager', currentUid, 'Team_Achievement_Report');
      }
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error('[ManagerReports] Export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  }, [currentUid, exportStatus]);

  const isLoading = exportStatus === 'loading';

  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Team Analytics &amp; Performance Reports</h1>
              <p className="text-body-md text-on-surface-variant">Review consolidated check-in counts, approval cycle counts, and team target statuses.</p>
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
                id="manager-export-csv"
                onClick={() => handleExport('csv')}
                disabled={isLoading}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-label-md font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export team achievement report as CSV"
              >
                {isLoading
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-[18px]">table_view</span>
                }
                Export CSV
              </button>

              <button
                id="manager-export-excel"
                onClick={() => handleExport('excel')}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title="Export team achievement report as Excel (.xlsx)"
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
              <p className="font-label-md text-label-md text-primary font-semibold">Team Achievement Report</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Exports your <strong>team&apos;s goals</strong> — planned target vs. actual achievement, quarterly check-ins, manager comments, approval status, and lock states. Data is pulled live from Firestore.
              </p>
            </div>
          </div>

          {/* Manager Consolidated Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Consolidated Team Progress</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">62.8%</p>
              <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Approvals Queue Size</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-error">2 Pending</p>
              <span className="text-label-sm text-error font-medium flex items-center gap-1">Review alerts active</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Department Alignment Score</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">9.2 / 10</p>
              <span className="text-label-sm text-primary font-medium">Top 10% inside company</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <span className="text-label-sm text-on-surface-variant font-medium">Goal Check-Ins (This Cycle)</span>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">18 Completed</p>
              <span className="text-label-sm text-on-surface-variant font-medium">Avg check-in: 4.2 per user</span>
            </div>
          </div>

          {/* Department Breakdown Graph */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Goal Alignment Coverage By Corridor</h2>
            <div className="h-48 flex items-end justify-between px-12 pt-8 border-b border-outline-variant relative">
              <div className="absolute inset-x-0 top-1/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-3/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>

              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[75%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">75%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">APAC Logistics</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[90%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">90%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">EU Edge Upgrades</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary/30 hover:bg-primary/40 transition-colors h-[45%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-primary">45%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">US AI pilot</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/4">
                <div className="w-20 bg-primary hover:bg-primary-dark transition-colors h-[80%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">80%</div>
                <span className="text-label-sm text-on-surface-variant font-semibold">Global Sales Target</span>
              </div>
            </div>
          </div>

          {/* Subordinate Goals Activity Feed Table */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Subordinate Goal Submissions Log</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface font-label-md text-label-md text-on-surface-variant">
                  <th className="p-4 pl-6">Employee Name</th>
                  <th className="p-4">Business Department</th>
                  <th className="p-4">Assigned Goal Target</th>
                  <th className="p-4">Status Queue</th>
                  <th className="p-4 pr-6">Submission Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-md">
                {teamLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 pl-6 font-semibold text-on-surface">{row.name}</td>
                    <td className="p-4 text-on-surface-variant">{row.role}</td>
                    <td className="p-4 font-medium">{row.goal}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-label-sm font-semibold inline-block ${
                        row.status === 'Approved' ? 'bg-success-container/20 text-success' : 'bg-error-container/20 text-error animate-pulse'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-on-surface-variant">{row.date}</td>
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
