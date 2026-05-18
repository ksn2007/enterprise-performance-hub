import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Logs a single action to the audit_logs collection in Firestore.
 * Each call writes exactly one document — no deduplication needed.
 *
 * @param {string} action     - Short action label, e.g. "Goal Approved"
 * @param {string} details    - Longer context string
 * @param {string} userId     - UID of the user performing the action
 * @param {string|null} targetId - Optional ID of the affected goal/entity
 * @param {string|null} actorName - Role label for display, e.g. "Manager (Demo)"
 */
export const logAuditAction = async (action, details, userId, targetId = null, actorName = null) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      details,
      userId,
      actorName: actorName || userId,
      targetId,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('[Audit] Error logging audit action:', error);
  }
};
