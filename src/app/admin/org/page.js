'use client';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';

export default function AdminOrgPage() {
  const departments = [
    { name: 'Engineering & Development', head: 'Sarah Manager', headcount: '24', alignment: '95%', color: 'bg-primary-fixed text-on-primary-fixed' },
    { name: 'Product & Design', head: 'Alex Employee (rep)', headcount: '8', alignment: '88%', color: 'bg-secondary-fixed text-on-secondary-fixed' },
    { name: 'Sales & Customer Success', head: 'David Lawson', headcount: '45', alignment: '92%', color: 'bg-tertiary-fixed text-on-tertiary-fixed' },
    { name: 'Corporate Operations', head: 'Michael Chang', headcount: '12', alignment: '100%', color: 'bg-primary-container text-white' }
  ];

  return (
    <RouteGuard requiredRole="admin">
      <DashboardLayout role="admin">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Corporate Organization Structure</h1>
              <p className="text-body-md text-on-surface-variant">Review structural departments, manager mappings, headcount distributions, and sector alignment scores.</p>
            </div>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">add</span> Add Department
            </button>
          </div>

          {/* Org Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Total Business Sectors</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">4 Departments</p>
              <p className="text-body-sm text-on-surface-variant">Fully integrated with the unified performance hub.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">people</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Total Corporate Headcount</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">89 Employees</p>
              <p className="text-body-sm text-on-surface-variant">Avg alignment coverage: 93.7% cross-organization.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">verified</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Corporate Goal Coverage</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">100% Compliant</p>
              <p className="text-body-sm text-on-surface-variant">All 4 sectors meet strict UOM weight requirements.</p>
            </div>
          </div>

          {/* Department Cards Grid */}
          <div className="space-y-4">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">domain</span> Active Sectors
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments.map((dept, idx) => (
                <div key={idx} className="bg-white border border-outline-variant rounded-2xl p-6 hover:shadow-md transition-shadow relative overflow-hidden space-y-4">
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-primary rounded-l-2xl"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className={`px-2.5 py-0.5 text-label-sm font-bold rounded-full inline-block ${dept.color}`}>
                        Active Sector
                      </span>
                      <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface leading-tight">{dept.name}</h3>
                    </div>
                  </div>

                  <div className="h-[1px] bg-outline-variant"></div>

                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <span className="text-label-sm text-on-surface-variant">Sector Lead</span>
                      <p className="font-label-md text-label-md font-bold text-on-surface">{dept.head}</p>
                    </div>
                    <div>
                      <span className="text-label-sm text-on-surface-variant">Headcount</span>
                      <p className="font-label-md text-label-md font-bold text-on-surface">{dept.headcount} FTE</p>
                    </div>
                    <div>
                      <span className="text-label-sm text-on-surface-variant">Alignment Score</span>
                      <p className="font-label-md text-label-md font-bold text-primary">{dept.alignment}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button className="px-4 py-1.5 border border-outline-variant rounded-lg text-label-sm font-bold hover:bg-surface-container-low transition-colors">
                      View Directory
                    </button>
                    <button className="px-4 py-1.5 bg-primary/10 text-primary rounded-lg text-label-sm font-bold hover:bg-primary/20 transition-colors">
                      Edit Parameters
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
