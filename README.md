 Enterprise Performance Hub
### AtomQuest Hackathon 1.0 Submission

> A full-stack enterprise goal management and performance tracking system with role-based access, real-time Firestore sync, approval workflows, quarterly check-ins, and exportable achievement reports.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

---

##  Live Demo

> **[https://enterprise-performance-hub.vercel.app](https://enterprise-performance-hub-lime.vercel.app)**

---

##  Demo Credentials

| Role | Email | Password |
|------|-------|----------|
|  Employee | `employee@test.com` | `employee123` |
|  Manager | `manager@test.com` | `manager123` |
|  Admin | `admin@test.com` | `admin123` |



---

##  Project Overview

The **Enterprise Performance Hub** is a production-grade HR performance management portal built for enterprise teams. It enables:

- Employees to set, manage, and track personal performance goals
- Managers to review, approve, and monitor team goal progress
- Admins to oversee organization-wide compliance, unlock goals, and export reports
- All roles to participate in structured quarterly check-in cycles

The system is aligned to a formal **Business Requirements Document (BRD)** and implements every stated functional requirement.

---

##  BRD Requirements Coverage

| # | BRD Requirement | Status |
|---|----------------|--------|
| 1 | Role-based access control (Employee / Manager / Admin) | ✅ Implemented |
| 2 | Employee goal creation (max 8 goals, min 10% weightage each) | ✅ Implemented |
| 3 | Total weightage must equal 100% before submission | ✅ Implemented |
| 4 | Goal approval workflow (Draft → Pending → Approved / Returned) | ✅ Implemented |
| 5 | Goal locking after approval | ✅ Implemented |
| 6 | Admin unlock workflow for goal revision | ✅ Implemented |
| 7 | Shared KPI assignment by Manager to all team members | ✅ Implemented |
| 8 | Quarterly check-in with Actual vs Target tracking | ✅ Implemented |
| 9 | Progress status tracking (Not Started / On Track / Completed) | ✅ Implemented |
| 10 | Audit trail logging for all state transitions | ✅ Implemented |
| 11 | **Achievement Report: Exportable CSV / Excel** | ✅ Implemented |
| 12 | Real-time Firestore synchronization | ✅ Implemented |

---

##  Core Features

###  Employee
- Create and manage up to 8 performance goals per cycle
- Assign Thrust Area, UoM, Target Value, and Weightage per goal
- Submit goals for manager approval (requires 100% total weightage)
- Perform quarterly check-ins with actual achievement vs planned target
- View personal performance reports
- **Export self-report as CSV or Excel**

###  Manager
- Review and approve / return employee goal submissions
- Add feedback comments on returned goals
- Create and assign Shared KPIs to entire team
- Monitor team progress dashboard with real-time data
- View team analytics and alignment scores
- **Export team achievement report as CSV or Excel**

###  Admin
- Full organization-wide goal visibility
- Unlock locked goals for employee revision
- Monitor HR compliance metrics and audit trail
- Manage system-wide goal state
- **Export org-wide achievement report as CSV or Excel**

###  Achievement Report Export (Final BRD Feature)
Each export includes 19 data fields per goal:
- Employee Name, Email, Department
- Goal Title, Description, Thrust Area, UoM, Target, Weightage
- Planned Target, Actual Achievement, Progress Score, Progress Status
- Check-in Period, Manager Comment, Last Updated timestamp
- Goal Status, Lock State, Shared KPI flag

---

##  Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 3.4 (Material Design 3 tokens) |
| Authentication | Firebase Auth (Email/Password) |
| Database | Cloud Firestore (real-time) |
| Export Engine | SheetJS / xlsx + native CSV |
| Deployment | Vercel Edge Network |
| Language | JavaScript (React 19) |

---

##  Project Structure

```
src/
├── app/
│   ├── page.js                    # Landing page
│   ├── login/page.js              # Authentication
│   ├── employee/
│   │   ├── page.js                # Employee dashboard
│   │   ├── goals/page.js          # Goal management
│   │   └── reports/page.js        # Reports + CSV/Excel export
│   ├── manager/
│   │   ├── page.js                # Manager dashboard
│   │   ├── approvals/page.js      # Goal approvals queue
│   │   └── reports/page.js        # Team reports + export
│   └── admin/
│       ├── page.js                # Admin dashboard
│       ├── goals/page.js          # Goal unlock management
│       └── reports/page.js        # Org-wide reports + export
├── components/
│   ├── DashboardLayout.js         # Shared sidebar/nav layout
│   └── RouteGuard.js              # Role-based route protection
├── utils/
│   ├── auth.js                    # Firebase auth helpers
│   ├── audit.js                   # Audit trail logger
│   ├── seeding.js                 # One-time demo data seeder
│   ├── seedAccounts.js            # Demo account initializer
│   └── exportReport.js            # CSV/Excel export engine
└── firebase.js                    # Firebase configuration
```

---

##  Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- A Firebase project (Firestore + Authentication enabled)

### 1. Clone the repository
```bash
git clone https://github.com/ksn2007/enterprise-performance-hub
cd enterprise-performance-hub
```

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing: `goal-connect-20afe`)
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** in production mode
5. Copy your Firebase config from Project Settings

### 4. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Create Demo Accounts

On the landing page, click **"Initialize Demo Accounts"** to create all three role accounts automatically.

### 6. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

##  Deployment on Vercel

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your GitHub repository
4. Add all environment variables from `.env.local`
5. Deploy

---

##  Firebase Firestore Collections

| Collection | Purpose |
|-----------|---------|
| `users/{uid}` | User profiles (name, email, role, department) |
| `goals/{id}` | All goal documents across all users |
| `audit_logs/{id}` | System-wide audit trail |
| `seeding_metadata/global_seeding` | Idempotency guard for demo seeding |

---

##  Architecture

See `docs/architecture_diagram.png` for the full system architecture diagram.

---

##  Developer

**Kotla Sathyanarayana**
AtomQuest Hackathon 1.0 — Enterprise Category

---

##  License

This project was built for the AtomQuest Hackathon 1.0 competition.
