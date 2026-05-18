'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import RouteGuard from '../../components/RouteGuard';
import Link from 'next/link';
import { db, auth } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '../../utils/auth';

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        getUserProfile(currentUser.uid).then(setProfile);
        
        // Query goals for the current employee
        const q = query(
          collection(db, 'goals'),
          where('createdBy', '==', currentUser.uid)
        );
        
        const unsubscribeGoals = onSnapshot(q, (snapshot) => {
          const fetchedGoals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setGoals(fetchedGoals);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching goals:", error);
          setIsLoading(false);
        });

        return () => unsubscribeGoals();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Calculate metrics
  const activeGoalsCount = goals.length;
  
  // Calculate weighted overall progress
  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  const overallProgress = totalWeightage > 0 
    ? Math.round(goals.reduce((sum, g) => sum + (Number(g.progressScore || 0) * Number(g.weightage || 0)), 0) / totalWeightage)
    : 0;

  // Filter manager comments from existing goals
  const managerComments = goals
    .filter(g => g.managerFeedback)
    .map(g => ({
      goalTitle: g.title,
      text: g.managerFeedback,
      date: g.updatedAt ? new Date(g.updatedAt.toDate()).toLocaleDateString() : 'Recently'
    }));

  return (
    <RouteGuard requiredRole="employee">
      <DashboardLayout role="employee">
      {/* Welcome Header */}
      <section className="mb-section-gap">
        <h2 className="font-headline-xl text-headline-xl text-on-surface">Welcome back, {profile?.name || 'Sathya Naryana'}</h2>
        <p className="text-body-lg text-on-surface-variant mt-1">Here's your performance summary for Q1 2024.</p>
      </section>

      {/* KPI Cards Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-section-gap">
        {/* Overall Progress */}
        <div className="bg-surface card-shadow rounded-xl p-6 flex flex-col justify-between border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Overall Progress</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">{overallProgress}%</h3>
            </div>
            <div className="p-3 bg-primary/5 text-primary rounded-lg">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className="mt-6 w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${overallProgress}%` }}></div>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3">Calculated from {activeGoalsCount} goals</p>
        </div>

        {/* Goals for Q1 */}
        <div className="bg-surface card-shadow rounded-xl p-6 flex flex-col justify-between border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Goals for Q1</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">{activeGoalsCount} Active</h3>
            </div>
            <div className="p-3 bg-secondary-container text-secondary rounded-lg">
              <span className="material-symbols-outlined">flag</span>
            </div>
          </div>
          <div className="flex -space-x-2 mt-6">
            <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-variant flex items-center justify-center text-[10px] font-bold">KT</div>
            <div className="w-8 h-8 rounded-full border-2 border-surface bg-primary-fixed flex items-center justify-center text-[10px] font-bold">AS</div>
            <div className="w-8 h-8 rounded-full border-2 border-surface bg-secondary-fixed flex items-center justify-center text-[10px] font-bold">+2</div>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3">{totalWeightage}% weightage allocated</p>
        </div>

        {/* Upcoming Check-ins */}
        <div className="bg-surface card-shadow rounded-xl p-6 flex flex-col justify-between border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wider">Upcoming Check-ins</p>
              <h3 className="font-headline-lg text-headline-lg mt-2">1 Scheduled</h3>
            </div>
            <div className="p-3 bg-error-container text-error rounded-lg">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="px-3 py-1 bg-surface-container-low border border-outline-variant rounded-md text-body-sm font-medium">Tomorrow, 10:00 AM</div>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3">With Sarah Jenkins (Manager)</p>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Column: Active Goals & Trends */}
        <div className="lg:col-span-8 space-y-gutter">
          {/* Progress Trends Chart Placeholder */}
          <div className="bg-surface card-shadow rounded-xl p-6 border border-outline-variant shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-headline-md text-headline-md">Progress Trends</h4>
              <select className="bg-surface border-outline-variant text-body-sm rounded-lg py-1 px-3 focus:ring-primary focus:border-primary">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <div className="relative h-[240px] w-full bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 p-8 flex items-end justify-between">
                <div className="w-2 bg-primary-container/20 h-[30%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container/20 h-[45%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container/20 h-[40%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container/20 h-[60%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container/20 h-[55%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container/20 h-[80%] rounded-t-sm"></div>
                <div className="w-2 bg-primary-container h-[75%] rounded-t-sm"></div>
              </div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q15,70 30,65 T60,40 T90,25 L100,20" fill="none" stroke="#004277" strokeWidth="2"></path>
              </svg>
              <span className="relative z-10 text-on-surface-variant font-label-md bg-surface/80 px-4 py-2 rounded-full">Goal Completion Velocity</span>
            </div>
          </div>

          {/* Active Goals List */}
          <div className="bg-surface card-shadow rounded-xl border border-outline-variant shadow-sm">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h4 className="font-headline-md text-headline-md">Active Goals</h4>
              <Link href="/employee/goals" className="text-primary font-label-md hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-outline-variant">
              {isLoading ? (
                <div className="p-6 text-center text-on-surface-variant font-body-sm flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                  <span>Loading goals...</span>
                </div>
              ) : goals.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant font-body-sm">
                  No active goals found. <Link href="/employee/goals" className="text-primary hover:underline">Add goals</Link> to start tracking.
                </div>
              ) : (
                goals.map(goal => (
                  <div key={goal.id} className="p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-body-md font-bold">{goal.title}</h5>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                          goal.currentStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                          goal.currentStatus === 'At Risk' ? 'bg-error-container text-error' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {goal.currentStatus || 'Draft'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${goal.progressScore || 0}%` }}></div>
                        </div>
                        <span className="text-label-sm text-on-surface-variant min-w-[32px]">{goal.progressScore || 0}%</span>
                      </div>
                    </div>
                    <Link href="/employee/goals" className="ml-6 p-2 hover:bg-surface-container-high rounded-lg text-on-surface-variant">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Manager Comments & Activity */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Recent Manager Comments */}
          <div className="bg-surface card-shadow rounded-xl overflow-hidden border border-outline-variant shadow-sm">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant">
              <h4 className="font-headline-md text-headline-md">Manager Comments</h4>
            </div>
            <div className="p-6 space-y-6">
              {managerComments.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant text-body-sm italic">
                  No manager feedback recorded yet.
                </div>
              ) : (
                managerComments.map((comment, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-label-md shrink-0">
                      M
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-body-sm font-bold">Sarah Jenkins</span>
                        <span className="text-[11px] text-on-surface-variant">{comment.date}</span>
                      </div>
                      <p className="text-[11px] text-primary italic font-medium mb-1">On goal: {comment.goalTitle}</p>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-outline-variant">
              <Link href="/employee/goals" className="block text-center w-full py-2 text-label-md text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-lg">View All Feedback</Link>
            </div>
          </div>

          {/* Task Quick View */}
          <div className="bg-surface card-shadow rounded-xl p-6 border border-outline-variant shadow-sm">
            <h4 className="font-headline-md text-headline-md mb-4">Focus Areas</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="material-symbols-outlined text-primary">task_alt</span>
                <span className="text-body-sm font-medium">Finalize campaign creative</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span className="text-body-sm font-medium">Review Q4 metrics with team</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                <span className="material-symbols-outlined text-on-surface-variant">radio_button_unchecked</span>
                <span className="text-body-sm font-medium">Update performance self-eval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </RouteGuard>
  );
}
