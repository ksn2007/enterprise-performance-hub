'use client';
import { useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import RouteGuard from '../../../components/RouteGuard';

export default function ManagerGoalsPage() {
  const [goals, setGoals] = useState([
    {
      thrustArea: 'Operational Excellence',
      thrustColor: 'bg-primary-fixed text-on-primary-fixed',
      title: 'Optimize Sprint Delivery Times by 10%',
      description: 'Streamline pipeline handoffs across frontend and devops corridors.',
      weight: 30,
      status: 'Approved',
      progress: 60,
      uom: 'Percentage',
      target: '10%'
    },
    {
      thrustArea: 'Innovation & Growth',
      thrustColor: 'bg-secondary-fixed text-on-secondary-fixed',
      title: 'Implement 1:1 Structured Feedback Loops',
      description: 'Establish high-frequency alignment check-ins with all engineering reports.',
      weight: 30,
      status: 'Approved',
      progress: 80,
      uom: 'Percentage',
      target: '100% attendance'
    },
    {
      thrustArea: 'Strategic Alignment',
      thrustColor: 'bg-primary-container text-white',
      title: 'Deploy Regional Sales & Alignment Targets',
      description: 'Establish unified departmental performance plans across EU corridor.',
      weight: 40,
      status: 'Approved',
      progress: 25,
      uom: 'Numeric',
      target: '$5,000,000'
    }
  ]);

  const handleProgressChange = (idx, val) => {
    const updated = [...goals];
    updated[idx].progress = parseInt(val);
    setGoals(updated);
  };

  return (
    <RouteGuard requiredRole="manager">
      <DashboardLayout role="manager">
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-outline-variant pb-6">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold text-primary">My Strategic Leadership Goals</h1>
              <p className="text-body-md text-on-surface-variant">Manage, evaluate, and track your personal manager-level objectives for the Q3 corporate performance cycle.</p>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-label-md font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">verified</span> 100% Weights Allocated
              </span>
            </div>
          </div>

          {/* Core Strategic Metric Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">gavel</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Leadership Objectives</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">3 Active Goals</p>
              <p className="text-body-sm text-on-surface-variant">All targets approved by the Executive Admin board.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">groups</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Team Alignment</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">15 Subordinates</p>
              <p className="text-body-sm text-on-surface-variant">Shared goals fully synchronized across EU & APAC.</p>
            </div>
            <div className="bg-white border border-outline-variant p-6 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                <span className="text-label-sm font-semibold text-on-surface-variant uppercase">Cycle Deadlines</span>
              </div>
              <p className="font-headline-lg text-headline-lg font-extrabold text-on-surface">43 Days Left</p>
              <p className="text-body-sm text-on-surface-variant">Q3 targets lock on September 30, 2024.</p>
            </div>
          </div>

          {/* Personal Goals List */}
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
                      <span className="font-label-md text-label-md text-on-surface-variant">Self-Reported Completion Progress</span>
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
