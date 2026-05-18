'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { db, auth } from '../../../firebase';
import { collection, addDoc, query, where, Timestamp, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { logAuditAction } from '../../../utils/audit';
import { seedDatabaseIfNeeded } from '../../../utils/seeding';

export default function MyGoals() {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null);

  const [newGoal, setNewGoal] = useState({
    thrustArea: 'Operational Excellence',
    title: '',
    description: '',
    uom: 'Numeric',
    targetValue: '',
    weightage: ''
  });

  const [formError, setFormError] = useState('');
  const [checkInModal, setCheckInModal] = useState({ isOpen: false, goal: null, actual: '', status: 'On Track', comment: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editFormError, setEditFormError] = useState('');

  const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
  const maxGoalsReached = goals.length >= 8;
  // Can only submit if weightage = 100% AND there is at least one Draft or Returned goal
  const submittableGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Returned');
  const canSubmitForApproval = totalWeightage === 100 && submittableGoals.length > 0;


  useEffect(() => {
    let unsubscribeGoals;
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // seedDatabaseIfNeeded has its own module-level guard — safe to call here
        await seedDatabaseIfNeeded(currentUser.uid);

        // Real-time subscription: only fetch goals belonging to this user
        const q = query(collection(db, 'goals'), where('createdBy', '==', currentUser.uid));
        unsubscribeGoals = onSnapshot(q, (snapshot) => {
          const fetchedGoals = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setGoals(fetchedGoals.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)));
          setIsLoading(false);
        }, (error) => {
          console.error('[Goals] onSnapshot error:', error);
          setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeGoals) unsubscribeGoals();
    };
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmitForApproval = async () => {
    if (!user) return;
    const draftGoals = goals.filter(g => g.status === 'Draft' || g.status === 'Returned');
    if (draftGoals.length === 0) {
      showNotification('error', 'No Draft or Returned goals to submit.');
      return;
    }
    setIsLoading(true);
    try {
      const updatePromises = draftGoals.map(g =>
        updateDoc(doc(db, 'goals', g.id), {
          status: 'Pending',
          locked: true,
          updatedAt: Timestamp.now()
        })
      );
      await Promise.all(updatePromises);
      await logAuditAction(
        'Goals Submitted',
        `Submitted ${draftGoals.length} goal(s) for manager approval.`,
        user.uid,
        null,
        'Employee (Demo)'
      );
      showNotification('success', `${draftGoals.length} goal(s) submitted for approval!`);
    } catch (error) {
      console.error('[Goals] Submit error:', error);
      showNotification('error', 'Failed to submit goals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!checkInModal.goal || !user) return;
    try {
      const newCheckIn = {
        date: new Date().toISOString().split('T')[0],
        actual: checkInModal.actual,
        status: checkInModal.status,
        comment: checkInModal.comment
      };
      const existingCheckIns = checkInModal.goal.checkIns || [];
      const updatedCheckIns = [...existingCheckIns, newCheckIn];
      
      // Calculate progress score
      let score = 0;
      const targetVal = parseFloat(checkInModal.goal.targetValue);
      const actualVal = parseFloat(checkInModal.actual);
      
      if (checkInModal.goal.uom === 'Timeline') {
        score = checkInModal.status === 'Completed' ? 100 : (checkInModal.status === 'On Track' ? 50 : 0);
      } else if (!isNaN(targetVal) && !isNaN(actualVal) && targetVal > 0) {
        score = Math.min(100, Math.round((actualVal / targetVal) * 100));
      }
      
      await updateDoc(doc(db, 'goals', checkInModal.goal.id), { 
        checkIns: updatedCheckIns, 
        progressScore: score,
        currentStatus: checkInModal.status,
        updatedAt: Timestamp.now() 
      });
      
      await logAuditAction('Quarterly Check-in', `Updated progress on ${checkInModal.goal.title} to ${score}%`, user.uid, checkInModal.goal.id, 'Employee (Demo)');
      
      setCheckInModal({ isOpen: false, goal: null, actual: '', status: 'On Track', comment: '' });
      showNotification('success', 'Check-in saved successfully.');
    } catch (error) {
      console.error("Error saving check-in:", error);
      showNotification('error', 'Failed to save check-in.');
    }
  };

  const handleEditGoalSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');
    if (!user || !editingGoal) return;

    const weight = Number(editingGoal.weightage);
    if (!editingGoal.title || !editingGoal.description || !editingGoal.targetValue || !editingGoal.weightage) {
      setEditFormError('Please fill in all required fields.');
      return;
    }

    if (weight < 10) {
      setEditFormError('Minimum weightage per goal is 10%.');
      return;
    }

    // Calculate sum of other goals' weightage
    const otherGoalsWeight = goals
      .filter(g => g.id !== editingGoal.id)
      .reduce((sum, g) => sum + Number(g.weightage), 0);

    if (otherGoalsWeight + weight > 100) {
      setEditFormError(`Cannot save. Total weightage would exceed 100% (currently ${otherGoalsWeight + weight}%).`);
      return;
    }

    let thrustColor = 'bg-primary-fixed text-on-primary-fixed';
    if (editingGoal.thrustArea === 'Innovation & Technology') thrustColor = 'bg-secondary-fixed text-on-secondary-fixed';
    if (editingGoal.thrustArea === 'Customer Satisfaction') thrustColor = 'bg-tertiary-fixed text-on-tertiary-fixed';
    if (editingGoal.thrustArea === 'People & Culture') thrustColor = 'bg-primary-container text-white';

    const updatedData = {
      thrustArea: editingGoal.thrustArea.split(' ')[0], // Simplify for badge
      thrustColor,
      title: editingGoal.title,
      description: editingGoal.description,
      targetValue: editingGoal.targetValue,
      uom: editingGoal.uom,
      weightage: weight,
      updatedAt: Timestamp.now()
    };

    // If it is a shared KPI, we only update the weightage!
    const dataToSave = editingGoal.isShared 
      ? { weightage: weight, updatedAt: Timestamp.now() }
      : updatedData;

    try {
      await updateDoc(doc(db, 'goals', editingGoal.id), dataToSave);
      await logAuditAction('Goal Edited', `Updated goal: ${editingGoal.title}`, user.uid, editingGoal.id, 'Employee (Demo)');
      setIsEditModalOpen(false);
      setEditingGoal(null);
      showNotification('success', 'Goal updated successfully.');
    } catch (error) {
      console.error("Error editing goal:", error);
      setEditFormError('Failed to save changes to database.');
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be logged in to add a goal.');
      return;
    }

    if (maxGoalsReached) {
      setFormError('Maximum limit of 8 goals reached.');
      return;
    }

    const weight = Number(newGoal.weightage);
    if (!newGoal.title || !newGoal.description || !newGoal.targetValue || !newGoal.weightage) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (weight < 10) {
      setFormError('Minimum weightage per goal is 10%.');
      return;
    }

    if (totalWeightage + weight > 100) {
      setFormError(`Cannot add goal. Total weightage would exceed 100% (currently ${totalWeightage}%).`);
      return;
    }

    let thrustColor = 'bg-primary-fixed text-on-primary-fixed';
    if (newGoal.thrustArea === 'Innovation & Technology') thrustColor = 'bg-secondary-fixed text-on-secondary-fixed';
    if (newGoal.thrustArea === 'Customer Satisfaction') thrustColor = 'bg-tertiary-fixed text-on-tertiary-fixed';
    if (newGoal.thrustArea === 'People & Culture') thrustColor = 'bg-primary-container text-white';

    const goalToAdd = {
      thrustArea: newGoal.thrustArea.split(' ')[0], // Simplify for badge
      thrustColor,
      title: newGoal.title,
      description: newGoal.description,
      targetValue: newGoal.targetValue,
      uom: newGoal.uom,
      weightage: weight,
      status: 'Draft',
      locked: false,
      createdBy: user.uid,
      createdAt: Timestamp.now(),
      isShared: false
    };

    try {
      const docRef = await addDoc(collection(db, 'goals'), goalToAdd);
      await logAuditAction('Goal Created', `Created manual goal: ${goalToAdd.title}`, user.uid, docRef.id, 'Employee (Demo)');
      
      setNewGoal({
        thrustArea: 'Operational Excellence',
        title: '',
        description: '',
        uom: 'Numeric',
        targetValue: '',
        weightage: ''
      });
      showNotification('success', 'Goal created successfully.');
    } catch (error) {
      console.error("Error adding goal:", error);
      setFormError('Failed to save goal to database.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
      showNotification('success', 'Goal deleted successfully.');
    } catch (error) {
      console.error("Error deleting goal:", error);
      showNotification('error', 'Failed to delete goal.');
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col lg:flex-row gap-section-gap">
        {/* Left Side: Goal Form & List */}
        <div className="flex-1 space-y-element-gap">
          {/* Header Actions */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Goal Planning 2026</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Set and manage your professional performance objectives.</p>
            </div>
            <button 
              onClick={handleSubmitForApproval}
              disabled={!canSubmitForApproval}
              className={`px-6 py-2.5 rounded-lg font-label-md text-label-md transition-all shadow-md ${
                canSubmitForApproval 
                  ? 'bg-primary-container text-white hover:opacity-90 active:scale-95' 
                  : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'
              }`}
            >
              Submit for Approval
            </button>
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

          {/* Weightage Progress Bar */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm mb-gutter">
            <div className="flex justify-between items-center mb-3">
              <span className="font-label-md text-label-md text-on-surface">Total Allocated Weightage</span>
              <span className={`font-headline-md text-headline-md ${totalWeightage === 100 ? 'text-success' : 'text-primary'}`}>
                {totalWeightage}%
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${totalWeightage === 100 ? 'bg-success' : totalWeightage > 100 ? 'bg-error' : 'bg-primary'}`} 
                style={{ width: `${Math.min(totalWeightage, 100)}%`, backgroundColor: totalWeightage === 100 ? '#10b981' : undefined }}
              ></div>
            </div>
            {totalWeightage !== 100 && (
              <p className="mt-2 font-label-sm text-label-sm text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Total weightage must equal 100% before submission.
              </p>
            )}
            {totalWeightage === 100 && (
              <p className="mt-2 font-label-sm text-label-sm text-success flex items-center gap-1" style={{ color: '#10b981' }}>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Weightage requirements met.
              </p>
            )}
          </div>
          
          {/* Dynamic Add Goal Form */}
          <section className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden ring-1 ring-primary/20">
            <div className="p-6 border-b border-surface-container-high bg-surface-container-lowest flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Create New Goal</h3>
              <span className="text-label-sm text-on-surface-variant">{goals.length}/8 Goals Added</span>
            </div>
            <form className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6" onSubmit={handleAddGoal}>
              <div className="lg:col-span-4">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Thrust Area</label>
                <select 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10"
                  value={newGoal.thrustArea}
                  onChange={(e) => setNewGoal({...newGoal, thrustArea: e.target.value})}
                  disabled={maxGoalsReached}
                >
                  <option>Operational Excellence</option>
                  <option>Innovation & Technology</option>
                  <option>Customer Satisfaction</option>
                  <option>People & Culture</option>
                </select>
              </div>
              <div className="lg:col-span-8">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Goal Title</label>
                <input 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10" 
                  placeholder="e.g., Optimize regional supply chain latency" 
                  type="text" 
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  disabled={maxGoalsReached}
                />
              </div>
              <div className="lg:col-span-12">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Description</label>
                <textarea 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10" 
                  placeholder="Define clear success criteria..." 
                  rows="3"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  disabled={maxGoalsReached}
                ></textarea>
              </div>
              <div className="lg:col-span-4">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">UoM (Unit of Measure)</label>
                <div className="flex gap-2">
                  {['Numeric', 'Percentage', 'Timeline'].map(uom => (
                    <button 
                      key={uom}
                      className={`flex-1 py-2 border rounded-lg font-label-sm text-label-sm transition-colors ${
                        newGoal.uom === uom 
                          ? 'border-primary bg-primary-container/10 text-primary' 
                          : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                      }`} 
                      type="button"
                      onClick={() => setNewGoal({...newGoal, uom})}
                      disabled={maxGoalsReached}
                    >
                      {uom}
                    </button>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Target Value</label>
                <input 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10" 
                  placeholder="100" 
                  type="number" 
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: e.target.value})}
                  disabled={maxGoalsReached}
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Weightage (%)</label>
                <input 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10" 
                  placeholder="Min 10%" 
                  type="number" 
                  min="10"
                  max="100"
                  value={newGoal.weightage}
                  onChange={(e) => setNewGoal({...newGoal, weightage: e.target.value})}
                  disabled={maxGoalsReached}
                />
              </div>
              
              {formError && (
                <div className="lg:col-span-12 p-3 bg-error-container/20 border border-error/30 rounded-lg flex items-center gap-2 text-error text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {formError}
                </div>
              )}
              
              <div className="lg:col-span-12 flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button 
                  className="px-6 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low" 
                  type="button"
                  onClick={() => {
                    setNewGoal({
                      thrustArea: 'Operational Excellence',
                      title: '',
                      description: '',
                      uom: 'Numeric',
                      targetValue: '',
                      weightage: ''
                    });
                    setFormError('');
                  }}
                  disabled={maxGoalsReached}
                >
                  Clear
                </button>
                <button 
                  className={`px-6 py-2 rounded-lg font-label-md text-label-md transition-all ${
                    maxGoalsReached 
                      ? 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'
                      : 'bg-primary text-white hover:opacity-90'
                  }`} 
                  type="submit"
                  disabled={maxGoalsReached}
                >
                  Add to List
                </button>
              </div>
            </form>
          </section>
          
          {/* Goal List Table */}
          <section className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mt-gutter">
            <div className="p-6 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md text-on-surface">Existing Goals</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm rounded-full">
                  {goals.length} Active
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Thrust Area</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Goal Title</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Weight</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                          <span className="font-body-md text-on-surface-variant">Loading your goals...</span>
                        </div>
                      </td>
                    </tr>
                  ) : goals.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant font-body-md">
                        No goals added yet. Add a goal above to get started.
                      </td>
                    </tr>
                  ) : (
                    goals.map(goal => (
                      <tr 
                        key={goal.id} 
                        className={`${goal.locked && !goal.isShared ? 'bg-surface-container-low/30 cursor-not-allowed' : 'hover:bg-surface-container-lowest'} transition-colors group ${goal.isShared ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                      >
                        <td className={`px-6 py-5 ${goal.locked && !goal.isShared ? 'opacity-60' : ''}`}>
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`px-2 py-1 font-label-sm text-label-sm rounded ${goal.thrustColor}`}>
                              {goal.thrustArea}
                            </span>
                            {goal.isShared && (
                              <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-[10px] uppercase rounded-full flex items-center gap-1 border border-primary/20">
                                <span className="material-symbols-outlined text-[12px]">share</span> Shared KPI
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-5 ${goal.locked && !goal.isShared ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-2">
                            <p className="font-body-md text-body-md text-on-surface">{goal.title}</p>
                            {goal.isShared && (
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50" title="Read-only (Shared KPI)">lock</span>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">{goal.description}</p>
                          {goal.isShared && (
                            <p className="text-[11px] text-primary mt-1 flex items-center gap-1 font-medium bg-primary/5 py-1 px-2 rounded w-fit">
                              <span className="material-symbols-outlined text-[14px]">sync</span>
                              Progress syncs automatically from {goal.primaryOwner}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="w-32 bg-surface-container-highest h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${goal.progressScore || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-[12px] font-bold text-primary">{goal.progressScore || 0}% Achieved</span>
                            <span className="text-[12px] text-on-surface-variant">({goal.targetValue} {goal.uom})</span>
                          </div>
                        </td>
                        <td className={`px-6 py-5 text-center font-body-md text-body-md font-bold ${goal.locked && !goal.isShared ? 'opacity-60' : ''}`}>
                          {goal.weightage}%
                        </td>
                        <td className="px-6 py-5">
                          {goal.locked ? (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-label-sm text-label-sm rounded-full ${goal.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-on-surface-variant'}`}>
                              <span className="material-symbols-outlined text-[14px]">{goal.status === 'Approved' ? 'check_circle' : 'lock'}</span> {goal.status}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-label-sm text-label-sm rounded-full ${goal.status === 'Returned' ? 'bg-error-container text-error' : 'bg-surface-container-high text-on-surface-variant'}`}>
                              <span className="w-2 h-2 rounded-full bg-outline"></span> {goal.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          {goal.locked && !goal.isShared ? (
                            <div className="flex justify-end gap-2">
                              {goal.status === 'Approved' && (
                                <button onClick={() => setCheckInModal({ isOpen: true, goal, actual: '', status: 'On Track', comment: '' })} className="p-2 hover:bg-surface-container-low rounded-lg text-primary" title="Quarterly Check-in">
                                  <span className="material-symbols-outlined text-[20px]">fact_check</span>
                                </button>
                              )}
                              <span className="p-2 text-outline-variant cursor-not-allowed"><span className="material-symbols-outlined text-[20px]">edit_off</span></span>
                              <span className="p-2 text-outline-variant cursor-not-allowed"><span className="material-symbols-outlined text-[20px]">lock</span></span>
                            </div>
                          ) : goal.isShared ? (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingGoal(goal); setIsEditModalOpen(true); }} className="p-2 hover:bg-surface-container-low rounded-lg text-primary" title="Edit Weightage Only"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                              <span className="p-2 text-outline-variant cursor-not-allowed" title="Cannot delete shared goal"><span className="material-symbols-outlined text-[20px]">lock</span></span>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingGoal(goal); setIsEditModalOpen(true); }} className="p-2 hover:bg-surface-container-low rounded-lg text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                              <button 
                                onClick={() => handleDelete(goal.id)}
                                className="p-2 hover:bg-error-container/20 rounded-lg text-error"
                              >
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-surface-container border-t border-outline-variant/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">lock</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Goals are locked after manager approval. Contact HR/Admin for changes.</p>
            </div>
          </section>
        </div>
        
        {/* Right Side: Info Panel */}
        <aside className="w-full lg:w-80 space-y-element-gap shrink-0">
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <img alt="Meeting Room" className="w-full h-32 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP9z19nd33kIfO0VRxoFr36BheWIpHzihLqwctTmVaP9MOYLlo38w-1xyc-qp39kssRiJPo41uR28S7_mNbU4mhspxV6KabRzMwGXfK53rj8KgKlGjlBfzldcpSsbmlATpyljiALODBb8XczPJCjNJ267TqQA0UF0_l6iONdbAEdlbiFJ64k7cu7CYw3JHgQHe0dihU-SVgdHopjDi15kmPGfRGZeHLZ80yy9QkPnxnqjD0TQ4s_4AdolUGMDtjq5mg61QCP-zlmdi" />
            <div className="p-6">
              <h4 className="font-headline-md text-headline-md text-on-surface mb-4">Goal Setting Guide</h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Be SMART</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Specific, Measurable, Achievable, Relevant, Time-bound.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">balance</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Balanced Weightage</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Don't put more than 40% on a single goal to maintain focus.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Clear Evidence</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">Describe exactly what data will prove the goal is met.</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <p className="font-body-sm text-body-sm text-on-surface italic">"Setting goals is the first step in turning the invisible into the visible."</p>
                <p className="mt-2 font-label-sm text-label-sm text-primary text-right">— Organizational Strategy</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container text-on-surface p-6 rounded-xl border border-primary/20">
            <h5 className="font-label-md text-label-md font-bold mb-2">Deadlines</h5>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-error">event</span>
              <p className="font-body-sm text-body-sm">Submission deadline: <span className="font-bold">Dec 15th, 2026</span></p>
            </div>
            <div className="w-full bg-surface-variant/30 h-1.5 rounded-full overflow-hidden">
              <div className="bg-error h-full" style={{ width: '85%' }}></div>
            </div>
            <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">8 days remaining</p>
          </div>
        </aside>
      </div>

      {/* Check-in Modal */}
      {checkInModal.isOpen && checkInModal.goal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">fact_check</span>
                Quarterly Check-in
              </h3>
              <button onClick={() => setCheckInModal({ isOpen: false, goal: null, actual: '', status: 'On Track', comment: '' })} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-low">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5 bg-white">
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant">Goal Title</p>
                <p className="font-body-md text-body-md font-medium text-on-surface">{checkInModal.goal.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Target Value</label>
                  <p className="font-body-md font-bold">{checkInModal.goal.targetValue} {checkInModal.goal.uom}</p>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Actual Achievement</label>
                  <input 
                    type="text" 
                    value={checkInModal.actual}
                    onChange={e => setCheckInModal({...checkInModal, actual: e.target.value})}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Current Status</label>
                <select 
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10"
                  value={checkInModal.status}
                  onChange={(e) => setCheckInModal({...checkInModal, status: e.target.value})}
                >
                  <option>Not Started</option>
                  <option>On Track</option>
                  <option>Completed</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Employee Comments</label>
                <textarea 
                  value={checkInModal.comment}
                  onChange={e => setCheckInModal({...checkInModal, comment: e.target.value})}
                  rows="2"
                  className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10"
                  placeholder="Notes on progress or roadblocks..."
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button 
                onClick={() => setCheckInModal({ isOpen: false, goal: null, actual: '', status: 'On Track', comment: '' })}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCheckInSubmit}
                disabled={!checkInModal.actual}
                className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md shadow-md disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all"
              >
                Save Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditModalOpen && editingGoal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                {editingGoal.isShared ? 'Edit Shared KPI Weightage' : 'Edit Goal Details'}
              </h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingGoal(null); setEditFormError(''); }} 
                className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditGoalSubmit}>
              <div className="p-6 space-y-6 bg-white max-h-[60vh] overflow-y-auto">
                {editingGoal.isShared && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 text-primary text-body-sm">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    <div>
                      <p className="font-bold">Shared KPI Constraints</p>
                      <p className="opacity-90">KPI Title, description, target value, and Unit of Measure are managed centrally. You can only edit the weightage allocated to this goal.</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Thrust Area</label>
                    <select 
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-container-low"
                      value={editingGoal.thrustArea === 'Operational' ? 'Operational Excellence' : editingGoal.thrustArea === 'Innovation' ? 'Innovation & Technology' : editingGoal.thrustArea === 'Infrastructure' ? 'Customer Satisfaction' : 'People & Culture'}
                      onChange={(e) => setEditingGoal({...editingGoal, thrustArea: e.target.value})}
                      disabled={editingGoal.isShared}
                    >
                      <option>Operational Excellence</option>
                      <option>Innovation & Technology</option>
                      <option>Customer Satisfaction</option>
                      <option>People & Culture</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Goal Title</label>
                    <input 
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-container-low" 
                      placeholder="Goal Title" 
                      type="text" 
                      value={editingGoal.title}
                      onChange={(e) => setEditingGoal({...editingGoal, title: e.target.value})}
                      disabled={editingGoal.isShared}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Description</label>
                    <textarea 
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-container-low" 
                      placeholder="Describe success criteria..." 
                      rows="3"
                      value={editingGoal.description}
                      onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
                      disabled={editingGoal.isShared}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">UoM (Unit of Measure)</label>
                    <select
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-container-low"
                      value={editingGoal.uom}
                      onChange={(e) => setEditingGoal({...editingGoal, uom: e.target.value})}
                      disabled={editingGoal.isShared}
                    >
                      <option>Numeric</option>
                      <option>Percentage</option>
                      <option>Timeline</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Target Value</label>
                    <input 
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10 disabled:opacity-50 disabled:bg-surface-container-low" 
                      placeholder="100" 
                      type="text" 
                      value={editingGoal.targetValue}
                      onChange={(e) => setEditingGoal({...editingGoal, targetValue: e.target.value})}
                      disabled={editingGoal.isShared}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Weightage (%)</label>
                    <input 
                      className="w-full rounded-lg border-outline-variant font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary/10" 
                      placeholder="Min 10%" 
                      type="number" 
                      min="10"
                      max="100"
                      value={editingGoal.weightage}
                      onChange={(e) => setEditingGoal({...editingGoal, weightage: e.target.value})}
                    />
                  </div>
                </div>
                
                {editFormError && (
                  <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg flex items-center gap-2 text-error text-body-sm animate-pulse">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {editFormError}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingGoal(null); setEditFormError(''); }}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-primary text-white font-label-md text-label-md shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
