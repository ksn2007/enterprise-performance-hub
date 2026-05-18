/**
 * exportReport.js
 * ---------------
 * Shared utility for exporting Achievement Reports (CSV / Excel).
 * Pulls live data from Firestore — goals + user profiles — and generates
 * a file for download without modifying any existing page logic.
 *
 * Role scopes:
 *   'admin'    → all goals in the system
 *   'manager'  → all goals NOT under the current user's own UID
 *   'employee' → goals belonging to the current user's UID only
 */

import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derive a human-readable progress status label from a goal document.
 */
function deriveProgressStatus(goal) {
  if (goal.currentStatus) return goal.currentStatus;
  const score = goal.progressScore ?? 0;
  if (score >= 100) return 'Completed';
  if (score > 0)   return 'On Track';
  return 'Not Started';
}

/**
 * Fetch the latest check-in entry from a goal's checkIns array.
 * Returns an object with { quarter, managerComment, lastUpdated }.
 */
function getLatestCheckIn(goal) {
  const checkIns = goal.checkIns || [];
  if (checkIns.length === 0) {
    return { quarter: '—', managerComment: '—', lastUpdated: '—' };
  }
  // Take the last entry in the array (most recent check-in)
  const latest = checkIns[checkIns.length - 1];
  return {
    quarter: latest.date || '—',
    managerComment: latest.comment || '—',
    lastUpdated: latest.date || '—',
  };
}

/**
 * Format a Firestore Timestamp (or JS Date) as a readable string.
 */
function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    if (ts.toDate) return ts.toDate().toISOString().replace('T', ' ').substring(0, 19);
    if (ts instanceof Date) return ts.toISOString().replace('T', ' ').substring(0, 19);
  } catch (_) {/* ignore */}
  return String(ts);
}

/**
 * Fetch all user profiles from the `users` collection as a uid→profile map.
 */
async function fetchUserProfiles() {
  const snap = await getDocs(collection(db, 'users'));
  const map = {};
  snap.forEach(d => { map[d.id] = d.data(); });
  return map;
}

/**
 * Fetch all goals, filter by scope, enrich with user info, and return rows.
 *
 * @param {'admin'|'manager'|'employee'} role
 * @param {string|null} currentUid - UID of the logged-in user
 * @returns {Promise<Array<Object>>} array of flat row objects
 */
export async function fetchReportRows(role, currentUid) {
  const [goalsSnap, userProfiles] = await Promise.all([
    getDocs(collection(db, 'goals')),
    fetchUserProfiles(),
  ]);

  const rows = [];

  goalsSnap.forEach(docSnap => {
    const goal = { id: docSnap.id, ...docSnap.data() };

    // ── Scope filtering ─────────────────────────────────────────────────────
    if (role === 'employee') {
      // Employee: only their own goals
      if (goal.createdBy !== currentUid) return;
    } else if (role === 'manager') {
      // Manager: team goals — exclude the manager's own uid & system seeds
      if (
        goal.createdBy === currentUid ||
        goal.createdBy === 'system' ||
        goal.createdBy === 'global'
      ) return;
    }
    // Admin: all goals (no filter)

    // ── Resolve employee info ────────────────────────────────────────────────
    const profile = userProfiles[goal.createdBy] || {};
    const employeeName = goal.employeeName || profile.name || goal.createdBy || 'Unknown';
    const employeeEmail = profile.email || '—';
    const department = profile.department || '—';

    // ── Check-in data ────────────────────────────────────────────────────────
    const { quarter, managerComment, lastUpdated } = getLatestCheckIn(goal);

    // ── Planned target vs actual achievement ─────────────────────────────────
    const latestCheckIn = (goal.checkIns || []).slice(-1)[0] || {};
    const actualAchievement = latestCheckIn.actual ?? '—';

    rows.push({
      // Employee Information
      'Employee Name': employeeName,
      'Employee Email': employeeEmail,
      'Department': department,

      // Goal Information
      'Goal Title': goal.title || '—',
      'Goal Description': goal.description || '—',
      'Thrust Area': goal.thrustArea || '—',
      'Unit of Measurement (UoM)': goal.uom || '—',
      'Target': goal.targetValue || '—',
      'Weightage (%)': goal.weightage ?? '—',

      // Achievement Tracking
      'Planned Target': goal.targetValue || '—',
      'Actual Achievement': actualAchievement,
      'Progress Score (%)': goal.progressScore ?? 0,
      'Progress Status': deriveProgressStatus(goal),

      // Quarterly Tracking
      'Check-in Period / Quarter': quarter,
      'Manager Check-in Comment': managerComment,
      'Last Updated': formatTimestamp(goal.updatedAt) || lastUpdated,

      // Workflow Metadata
      'Goal Status': goal.status || '—',
      'Is Locked': goal.locked ? 'Locked' : 'Unlocked',
      'Is Shared KPI': goal.isShared ? 'Yes' : 'No',
    });
  });

  return rows;
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

/**
 * Convert an array of flat objects to a CSV string.
 */
function rowsToCSV(rows) {
  if (rows.length === 0) return 'No data available.';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    const str = String(val ?? '');
    // Wrap in quotes if it contains comma, newline or double-quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ];
  return lines.join('\r\n');
}

/**
 * Trigger a CSV download in the browser.
 */
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Main CSV export entry point.
 *
 * @param {'admin'|'manager'|'employee'} role
 * @param {string|null} currentUid
 * @param {string} [filenamePrefix]
 */
export async function exportCSV(role, currentUid, filenamePrefix = 'Achievement_Report') {
  const rows = await fetchReportRows(role, currentUid);
  const csv = rowsToCSV(rows);
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `${filenamePrefix}_${date}.csv`);
}

// ---------------------------------------------------------------------------
// Excel Export (using SheetJS / xlsx)
// ---------------------------------------------------------------------------

/**
 * Trigger an Excel (.xlsx) download in the browser using the `xlsx` library.
 *
 * @param {'admin'|'manager'|'employee'} role
 * @param {string|null} currentUid
 * @param {string} [filenamePrefix]
 */
export async function exportExcel(role, currentUid, filenamePrefix = 'Achievement_Report') {
  // Dynamic import so xlsx is only loaded when the user clicks Export Excel
  const XLSX = await import('xlsx');

  const rows = await fetchReportRows(role, currentUid);

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns for readability
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length), 10),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Achievement Report');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${date}.xlsx`);
}
