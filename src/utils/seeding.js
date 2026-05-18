import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

/**
 * MODULE-LEVEL lock — survives React Strict Mode double-mounts and page navigations.
 * The Firestore guard prevents cross-session re-seeding.
 * The in-process flag prevents concurrent calls within the same browser session.
 */
let _seedingInProgress = false;
let _seedingComplete = false;

/**
 * Seed demo data EXACTLY ONCE per Firestore project.
 *
 * Strategy:
 *  1. Check module-level flags first (instant, no network call).
 *  2. Check Firestore seeding_metadata/global_seeding (persistent guard).
 *  3. If neither guard is set, write all demo data then mark the Firestore guard.
 *
 * Employee goals (4 × 25% = 100%) are stored under the real userId.
 * Mock approval goals (40% + 60% = 100%) are stored under 'mock-employee-uid'
 *   so they NEVER appear in the real employee's Goals page.
 * Audit logs use 'mock-manager-uid' / 'mock-employee-uid'.
 *
 * Status terminology (BRD-aligned):
 *   Draft → Under Review (submitted) → Pending (manager queue) → Approved | Returned
 * For the seeded mock approvals we use 'Pending' so the manager Approvals page
 * queries where(status == 'Pending').
 */
export const seedDatabaseIfNeeded = async (userId) => {
  if (!userId) return;

  // Fast-path: already seeded this session
  if (_seedingComplete || _seedingInProgress) return;

  _seedingInProgress = true;

  try {
    const metaRef = doc(db, 'seeding_metadata', 'global_seeding');
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists()) {
      // Already seeded in a previous session — mark complete and bail
      _seedingComplete = true;
      _seedingInProgress = false;
      return;
    }

    console.log('[Seeding] First-time seed starting…');

    // ---------------------------------------------------------------
    // 1. Employee goals for the authenticated user (4 × 25% = 100%)
    //    Mixed statuses to showcase the full workflow.
    // ---------------------------------------------------------------
    const employeeGoals = [
      {
        thrustArea: 'Operational Excellence',
        thrustColor: 'bg-primary-fixed text-on-primary-fixed',
        title: 'Reduce Processing Time by 15%',
        description: 'Focus on the APAC logistics corridor to streamline pipeline delays.',
        weightage: 25,
        status: 'Draft',
        locked: false,
        uom: 'Percentage',
        targetValue: '15',
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 3)),
        isShared: false,
        progressScore: 0
      },
      {
        thrustArea: 'Innovation & Growth',
        thrustColor: 'bg-secondary-fixed text-on-secondary-fixed',
        title: 'Launch Internal AI Pilot',
        description: 'Deploy the semantic search pilot across HR and Legal teams.',
        weightage: 25,
        status: 'Approved',
        locked: true,
        uom: 'Numeric',
        targetValue: '1',
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 6)),
        isShared: false,
        progressScore: 0
      },
      {
        thrustArea: 'Infrastructure Upgrade',
        thrustColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
        title: 'Expand Regional Infrastructure',
        description: 'Upgrade high-throughput edge nodes in the EU-West region.',
        weightage: 25,
        status: 'Approved',
        locked: true,
        uom: 'Numeric',
        targetValue: '5',
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 10)),
        isShared: false,
        progressScore: 40,
        checkIns: [
          { date: '2024-03-31', actual: '2', status: 'On Track', comment: 'Good initial progress.' }
        ]
      },
      {
        thrustArea: 'Strategic Alignment',
        thrustColor: 'bg-primary-container text-white',
        title: 'Q3 Department Revenue Target',
        description: 'Achieve $5M in regional sales across key accounts.',
        weightage: 25,
        status: 'Approved',
        locked: true,
        uom: 'Numeric',
        targetValue: '5000000',
        createdBy: userId,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 14)),
        isShared: true,
        primaryOwner: 'Manager',
        progressScore: 0
      }
    ];

    for (const goal of employeeGoals) {
      await addDoc(collection(db, 'goals'), goal);
    }

    // ---------------------------------------------------------------
    // 2. Mock pending approvals under 'mock-employee-uid' (40% + 60% = 100%)
    //    Status = 'Pending' (BRD terminology for manager review queue)
    //    These NEVER appear in the real user's Goals page.
    // ---------------------------------------------------------------
    const mockApprovals = [
      {
        thrustArea: 'Operational Excellence',
        thrustColor: 'bg-primary-fixed text-on-primary-fixed',
        title: 'Automate Q4 Invoice Billing System',
        description: 'Reduce manual verification workload by 40% using automated workflows.',
        weightage: 40,
        status: 'Pending',
        locked: true,
        uom: 'Percentage',
        targetValue: '40',
        createdBy: 'mock-employee-uid',
        employeeName: 'Sarah Jenkins',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 1)),
        isShared: false,
        progressScore: 0
      },
      {
        thrustArea: 'Innovation & Growth',
        thrustColor: 'bg-secondary-fixed text-on-secondary-fixed',
        title: 'Design API Gateway for External Vendors',
        description: 'Ensure 99.99% gateway availability under peak load tests.',
        weightage: 60,
        status: 'Pending',
        locked: true,
        uom: 'Numeric',
        targetValue: '1',
        createdBy: 'mock-employee-uid',
        employeeName: 'Sarah Jenkins',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2)),
        isShared: false,
        progressScore: 0
      }
    ];

    for (const goal of mockApprovals) {
      await addDoc(collection(db, 'goals'), goal);
    }

    // ---------------------------------------------------------------
    // 3. Seed audit logs with mock UIDs to avoid polluting the real user
    // ---------------------------------------------------------------
    const auditLogs = [
      {
        action: 'Goals Approved',
        details: 'Approved 3 goals for Q3 cycle.',
        userId: 'mock-manager-uid',
        actorName: 'Manager (Demo)',
        targetId: null,
        timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 2))
      },
      {
        action: 'Goals Returned',
        details: 'Returned 1 goal for rework with weightage feedback.',
        userId: 'mock-manager-uid',
        actorName: 'Manager (Demo)',
        targetId: null,
        timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 5))
      },
      {
        action: 'Goal Created',
        details: 'Created manual goal: Improve Q4 OKR Targets',
        userId: 'mock-employee-uid',
        actorName: 'Employee (Demo)',
        targetId: null,
        timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 7))
      },
      {
        action: 'Goal Unlocked',
        details: 'Admin unlocked goal for employee revision.',
        userId: 'mock-admin-uid',
        actorName: 'Admin (Demo)',
        targetId: null,
        timestamp: Timestamp.fromDate(new Date(Date.now() - 86400000 * 10))
      }
    ];

    for (const log of auditLogs) {
      await addDoc(collection(db, 'audit_logs'), log);
    }

    // ---------------------------------------------------------------
    // 4. Write the Firestore guard LAST — only after all writes succeed
    // ---------------------------------------------------------------
    await setDoc(metaRef, {
      seeded: true,
      timestamp: Timestamp.now(),
      seededForUser: userId
    });

    _seedingComplete = true;
    console.log('[Seeding] Complete — database seeded exactly once.');

  } catch (error) {
    // Reset in-progress flag so a future call can retry if seeding failed midway
    _seedingInProgress = false;
    console.error('[Seeding] Error:', error);
  } finally {
    _seedingInProgress = false;
  }
};
