'use client';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';

export default function ManagerCheckinsPage() {
  const checkins = [
    { name: 'Sarah Jenkins', goal: 'Automate Q4 Invoice Billing System', actual: '30%', target: '40%', status: 'On Track', date: '2024-05-18', comment: 'Automated 12 core invoice templates successfully.' },
    { name: 'Alex Employee', goal: 'Expand Regional Infrastructure', actual: '2 nodes', target: '5 nodes', status: 'On Track', date: '2024-05-15', comment: 'Completed EU-West region edge node installation.' },
    { name: 'Sarah Jenkins', goal: 'Design API Gateway for External Vendors', actual: '0', target: '1', status: 'Under Review', date: '2024-05-14', comment: 'Initial API Gateway schema drafted.' }
  ];

  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="border-b border-outline-variant pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Subordinate Check-in Activities</h1>
              <p className="text-body-md text-on-surface-variant">Audit, review, and comment on actual progress updates checked-in by your direct reports.</p>
            </div>
          </div>

          {/* Activity Timeline List */}
          <div className="space-y-6">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span> Check-in Timeline Feed
            </h2>

            <div className="space-y-6">
              {checkins.map((check, idx) => (
                <div key={idx} className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 hover:shadow-md transition-shadow relative">
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-primary rounded-l-xl"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-label-md text-label-md font-extrabold text-on-surface">{check.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                        <span className="text-body-sm text-on-surface-variant">{check.date}</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm font-bold text-primary">{check.goal}</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant text-center">
                        <span className="text-label-sm text-on-surface-variant">Reported actual</span>
                        <p className="font-headline-sm text-headline-sm font-extrabold text-primary">{check.actual}</p>
                      </div>
                      <div className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant text-center">
                        <span className="text-label-sm text-on-surface-variant">UOM Target</span>
                        <p className="font-headline-sm text-headline-sm font-extrabold text-on-surface">{check.target}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-low/50 rounded-lg border border-outline-variant/60">
                    <p className="text-body-md text-on-surface-variant italic">"{check.comment}"</p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button className="px-4 py-1.5 border border-outline-variant rounded-lg text-label-sm font-bold hover:bg-surface-container-low transition-colors">
                      Ack Progress
                    </button>
                    <button className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:brightness-110 transition-all shadow-sm">
                      Leave Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
