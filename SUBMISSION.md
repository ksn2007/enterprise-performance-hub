# Hackathon Submission Document
## AtomQuest Hackathon 1.0

---

## Project Title
**Enterprise Performance Hub**
*A full-stack, BRD-aligned enterprise HR goal management and performance tracking portal*

---

## Team / Developer
**Kotla Sathyanarayana**

---

## Project Overview

The **Enterprise Performance Hub** is an enterprise-grade performance management system built on Next.js 16 and Firebase. It provides a complete goal lifecycle management workflow — from goal creation and manager approval, through quarterly progress check-ins, shared KPI distribution, and final exportable achievement reports.

The system was designed against a formal Business Requirements Document (BRD) and implements **100% of stated functional requirements** including the final reporting deliverable: exportable CSV/Excel achievement reports showing Planned Target vs. Actual Achievement for all employees.

---

## Hosted Demo URL

🔗 **[https://enterprise-performance-hub.vercel.app](https://enterprise-performance-hub.vercel.app)**

*(Replace with actual Vercel URL after deployment)*

---

## Source Code Repository

 **[https://github.com/kotlasathyanarayana7/enterprise-performance-hub](https://github.com/kotlasathyanarayana7/enterprise-performance-hub)**

---

## Demo Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
|  Employee | `employee@test.com` | `employee123` | Personal goals, check-ins, self-report export |
|  Manager | `manager@test.com` | `manager123` | Team approvals, shared KPIs, team export |
|  Admin | `admin@test.com` | `admin123` | Org-wide oversight, unlock goals, full export |


> **Note:** Click **"Initialize Demo Accounts"** on the login page to auto-create all three accounts on first visit.

---

## Core Features Implemented

### 1. Role-Based Authentication & Routing
- Firebase Email/Password authentication
- Three distinct roles: Employee, Manager, Admin
- RouteGuard component enforces role-based access on every page
- Automatic role-based redirection after login

### 2. Employee Goal Management
- Create up to 8 performance goals per cycle
- Fields: Thrust Area, Title, Description, UoM, Target Value, Weightage
- Minimum 10% weightage per goal; total must equal exactly 100% before submission
- Goals submitted as batch to manager approval queue

### 3. Goal Approval Workflow
- States: `Draft → Pending → Approved | Returned for Rework`
- Goals auto-locked on submission; unlocked on return
- Manager can approve or return with written feedback
- Admin can unlock any locked goal for revision

### 4. Shared KPI Assignment
- Manager creates a Shared KPI target
- System auto-distributes the goal to all team member accounts
- Shared goals are read-only for employees (weightage editable only)
- Progress syncs centrally from the goal owner

### 5. Quarterly Check-in Engine
- Employee records actual achievement against each approved goal
- System calculates progress score (Actual / Target × 100)
- Status tracked: Not Started / On Track / Completed
- Each check-in stored with date, actual value, and comment

### 6. Audit Trail Logging
- Every state change logged: creation, submission, approval, return, unlock, check-in
- Real-time Firestore listener on Manager/Admin dashboards
- Immutable audit records (append-only)

### 7. Real-Time Firestore Synchronization
- All dashboards use `onSnapshot` for live updates
- No page refresh required to see new goals or approvals
- Idempotent one-time seeding prevents data duplication

### 8. Exportable Achievement Reports *(Final BRD Requirement)*
- **Employee**: Export personal self-report (CSV or Excel)
- **Manager**: Export full team achievement report (CSV or Excel)
- **Admin**: Export organisation-wide achievement report (CSV or Excel)

**Each export includes 19 fields per goal:**
Employee Name · Email · Department · Goal Title · Description · Thrust Area · UoM · Target · Weightage · Planned Target · Actual Achievement · Progress Score · Progress Status · Check-in Period · Manager Comment · Last Updated · Goal Status · Lock State · Shared KPI Flag

---

## BRD Requirement Coverage Summary

| Requirement | Implemented |
|-------------|:-----------:|
| Role-based access control (3 roles) | ✅ |
| Goal creation with validation (max 8, min 10% each) | ✅ |
| 100% total weightage enforcement | ✅ |
| Goal submission workflow | ✅ |
| Manager approval / return with feedback | ✅ |
| Goal auto-locking on submission | ✅ |
| Admin unlock capability | ✅ |
| Shared KPI by Manager to team | ✅ |
| Quarterly check-in (Actual vs Target) | ✅ |
| Progress status tracking | ✅ |
| Audit trail for all actions | ✅ |
| Real-time data synchronization | ✅ |
| **Achievement Report: CSV / Excel export** | ✅ |

**All 13 BRD functional requirements: 100% implemented.**

---

## Architecture Overview

See attached architecture diagram.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS 3.4 (Material Design 3 tokens) |
| Authentication | Firebase Auth — Email/Password |
| Database | Cloud Firestore (real-time listeners) |
| Export Engine | SheetJS (xlsx) + native CSV |
| Hosting | Vercel Edge Network |

### Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users/{uid}` | User profiles: name, email, role, department |
| `goals/{id}` | Goal documents: all fields + check-ins array |
| `audit_logs/{id}` | Immutable audit trail |
| `seeding_metadata/` | One-time seeding idempotency guard |

---

## Architecture Diagram

*(See attached: `architecture_diagram.png`)*

---

## Key Technical Decisions

1. **App Router (Next.js 16)** — Server-compatible routing with client components only where Firebase listeners are needed
2. **Firestore `onSnapshot`** — Real-time push updates replace polling; zero-latency dashboard sync
3. **Idempotent seeding** — `seeding_metadata/global_seeding` Firestore document prevents cross-session data duplication
4. **Role routing via RouteGuard** — Every protected page wrapped; unauthorized access redirects to login
5. **SheetJS (xlsx)** — Industry-standard Excel generation; dynamic import to avoid bundle bloat

---

*AtomQuest Hackathon 1.0 — Enterprise Category Submission*
