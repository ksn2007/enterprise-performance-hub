'use client';
import { useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState([
    {
      thrustArea: 'Infrastructure Upgrade',
      thrustColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
      title: 'Maintain Platform SLA of 99.99%',
      description: 'Ensure regional edge node scalability and cloud infrastructure updates.',
      weight: 40,
      status: 'Approved',
      progress: 90,
      uom: 'Percentage',
      target: '99.99%'
    },
    {
      thrustArea: 'Operational Excellence',
      thrustColor: 'bg-primary-fixed text-on-primary-fixed',
      title: 'Resolve Lock Escalations within 24 Hours',
      description: 'Review and unlock subordinate goals based on regional director submissions.',
      weight: 30,
      status: 'Approved',
      progress: 100,
      uom: 'Numeric',
      target: '24 hours max'
    },
    {
      thrustArea: 'Innovation & Growth',
      thrustColor: 'bg-secondary-fixed text-on-secondary-fixed',
      title: 'Deploy Enterprise SSO Across Merged Entitles',
      description: 'Establish unified SAML and active directory federation portals.',
      weight: 30,
      status: 'Approved',
      progress: 50,
      uom: 'Percentage',
      target: '100% migrated'
    }
  ]);

  const handleProgressChange = (idx, val) => {
    const updated = [...goals];
    updated[idx].progress = parseInt(val);
    setGoals(updated);
  };

  return (
    <RouteGuard requiredRole="admin">
      <DashboardLayout role="admin">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">HR & System Administrative Goals</h1>
              <p className="text-body-md text-on-surface-variant">Review and track your system integrity objectives and HR operations targets for this cycle.</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-label-md font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified</span> Admin SLA Active
              </span>
            </div>
          </div>

          {/* Metric Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">shield</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">SLA Health Status</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-success">Healthy</p>
              <p className="text-body-sm text-on-surface-variant">Platform availability averages 99.992% in Q3.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">vpn_key</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Security Keys Active</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">6 Directory Links</p>
              <p className="text-body-sm text-on-surface-variant">SSO federation logs synchronized with internal HR.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">corporate_fare</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Alignment Index</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">100% Sum</p>
              <p className="text-body-sm text-on-surface-variant">Corporate weights correctly allocated and audited.</p>
            </div>
          </div>

          {/* Admin Goals Matrix */}
          <div className="space-y-6">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list</span> Individual Objectives Matrix
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {goals.map((goal, idx) => (
                <div key={idx} className="bg-white border border-outline-variant rounded-2xl p-8 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-6">
                  {/* Goal Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-label-sm font-bold rounded-full ${goal.thrustColor}`}>
                          {goal.thrustArea}
                        </span>
                        <span className="px-2.5 py-1 bg-success-container/20 text-success text-label-sm font-semibold rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">lock</span> {goal.status}
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm font-extrabold text-on-surface leading-tight">{goal.title}</h3>
                      <p className="text-body-md text-on-surface-variant max-w-3xl">{goal.description}</p>
                    </div>

                    <div className="bg-surface-container-low px-5 py-4 rounded-xl border border-outline-variant flex items-center gap-6 self-stretch md:self-auto justify-around">
                      <div className="text-center">
                        <span className="text-label-sm text-on-surface-variant">Weightage</span>
                        <p className="font-headline-sm text-headline-sm font-extrabold text-primary">{goal.weight}%</p>
                      </div>
                      <div className="w-[1px] h-10 bg-outline-variant"></div>
                      <div className="text-center">
                        <span className="text-label-sm text-on-surface-variant">UOM Target</span>
                        <p className="font-label-md text-label-md font-bold text-on-surface">{goal.target}</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Slider */}
                  <div className="bg-surface-container-low border border-outline-variant p-6 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-label-md text-label-md text-on-surface-variant">Self-Reported SLA Progress</span>
                      <span className="font-headline-sm text-headline-sm font-extrabold text-primary">{goal.progress}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={goal.progress}
                        onChange={e => handleProgressChange(idx, e.target.value)}
                        className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
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
