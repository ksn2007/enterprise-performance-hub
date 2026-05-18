'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';
import { auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { exportCSV, exportExcel } from '../../../utils/exportReport';

export default function EmployeeReportsPage() {
  const reportsData = [
    { cycle: '2024 Q3', title: 'Reduce Processing Time by 15%', weight: '25%', progress: '0%', status: 'Draft', date: '2024-05-15' },
    { cycle: '2024 Q3', title: 'Launch Internal AI Pilot', weight: '25%', progress: '0%', status: 'Approved', date: '2024-05-12' },
    { cycle: '2024 Q3', title: 'Expand Regional Infrastructure', weight: '25%', progress: '40%', status: 'Approved', date: '2024-05-08' },
    { cycle: '2024 Q3', title: 'Q3 Department Revenue Target', weight: '25%', progress: '0%', status: 'Approved', date: '2024-05-04' },
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
        await exportCSV('employee', currentUid, 'My_Achievement_Report');
      } else {
        await exportExcel('employee', currentUid, 'My_Achievement_Report');
      }
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error('[EmployeeReports] Export error:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 4000);
    }
  }, [currentUid, exportStatus]);

  const isLoading = exportStatus === 'loading';

  return (
    <RouteGuard requiredRole="employee">
      <DashboardLayout role="employee">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Performance Reports &amp; Analytics</h1>
              <p className="text-body-md text-on-surface-variant">Real-time analytical insights, completion rates, and historical check-in audit trails.</p>
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
                id="employee-export-csv"
                onClick={() => handleExport('csv')}
                disabled={isLoading}
                className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-label-md font-bold hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export my achievement report as CSV"
              >
                {isLoading
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-[18px]">table_view</span>
                }
                Export CSV
              </button>

              <button
                id="employee-export-excel"
                onClick={() => handleExport('excel')}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title="Export my achievement report as Excel (.xlsx)"
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
              <p className="font-label-md text-label-md text-primary font-semibold">My Achievement Report</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Exports <strong>your personal goals</strong> — planned target vs. actual achievement, quarterly check-ins, approval status, and lock states. Data is pulled live from Firestore.
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-label-sm text-on-surface-variant font-medium">Overall Progress</span>
                <span className="material-symbols-outlined text-primary text-[24px]">trending_up</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">25.0%</p>
              <div className="w-full bg-outline-variant h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-label-sm text-on-surface-variant font-medium">Total Goal Count</span>
                <span className="material-symbols-outlined text-primary text-[24px]">playlist_add_check</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">4 Goals</p>
              <span className="text-label-sm text-primary font-medium flex items-center gap-1">100% Weightage Allocated</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-label-sm text-on-surface-variant font-medium">Approved Weight</span>
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">75%</p>
              <span className="text-label-sm text-outline font-medium flex items-center gap-1">3 Approved • 1 Draft</span>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-label-sm text-on-surface-variant font-medium">KPI Check-Ins</span>
                <span className="material-symbols-outlined text-primary text-[24px]">history</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">1 Completed</p>
              <span className="text-label-sm text-on-surface-variant font-medium">Last check-in 3 days ago</span>
            </div>
          </div>

          {/* Visual Progress Graph Mock */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Goal Weights &amp; Progress Allocation</h2>
            <div className="h-48 flex items-end justify-between px-12 pt-8 border-b border-outline-variant relative">
              {/* Background grid lines */}
              <div className="absolute inset-x-0 top-1/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-2/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>
              <div className="absolute inset-x-0 top-3/4 border-t border-outline-variant/30 w-full pointer-events-none"></div>

              {/* Bars */}
              <div className="flex flex-col items-center gap-2 w-1/5">
                <div className="w-16 bg-primary/20 hover:bg-primary/30 transition-colors h-[25%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-primary">25%</div>
                <span className="text-label-sm text-on-surface-variant text-center truncate w-full">Operations</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/5">
                <div className="w-16 bg-primary/20 hover:bg-primary/30 transition-colors h-[25%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-primary">25%</div>
                <span className="text-label-sm text-on-surface-variant text-center truncate w-full">Innovation</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/5">
                <div className="w-16 bg-primary hover:bg-primary-dark transition-colors h-[40%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-white">40%</div>
                <span className="text-label-sm text-on-surface-variant text-center truncate w-full">Infrastructure</span>
              </div>
              <div className="flex flex-col items-center gap-2 w-1/5">
                <div className="w-16 bg-primary/20 hover:bg-primary/30 transition-colors h-[25%] rounded-t-md flex items-end justify-center pb-2 text-label-sm font-bold text-primary">25%</div>
                <span className="text-label-sm text-on-surface-variant text-center truncate w-full">Revenue Target</span>
              </div>
            </div>
          </div>

          {/* Goal List Table */}
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Goal Matrix Overview</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface font-label-md text-label-md text-on-surface-variant">
                  <th className="p-4 pl-6">Cycle</th>
                  <th className="p-4">Goal Title</th>
                  <th className="p-4">Weightage</th>
                  <th className="p-4">Current Progress</th>
                  <th className="p-4">Approval Status</th>
                  <th className="p-4 pr-6">Last Checked-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-body-md">
                {reportsData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4 pl-6 font-medium text-on-surface">{row.cycle}</td>
                    <td className="p-4">{row.title}</td>
                    <td className="p-4 font-semibold">{row.weight}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{row.progress}</span>
                        <div className="w-24 bg-outline-variant h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: row.progress }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-label-sm font-semibold inline-block ${
                        row.status === 'Approved' ? 'bg-success-container/20 text-success' : 'bg-outline-variant/40 text-outline'
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
