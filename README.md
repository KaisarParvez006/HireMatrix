# ⬡ HireMatrix — Smart Recruitment Platform

A full-stack MERN web application for end-to-end recruitment management, built with React.js, Node.js, Express.js, and MongoDB following the MVC architectural pattern.

---

## 📋 Features

### Authentication & Email
- **Email OTP Verification** — Every new account requires email verification via a 6-digit OTP
- **Forgot / Reset Password** — OTP-based secure password reset flow
- **JWT Authentication** — Stateless, token-based auth with 7-day expiry
- **Role-Based Access Control** — 5 distinct roles with tailored dashboards

### Roles
| Role | Access |
|------|--------|
| **Applicant** | Browse jobs, apply, track application status, view interviews |
| **Recruiter** | Post/manage jobs, review applications, schedule interviews |
| **HR** | All Recruiter features + select candidates + analytics |
| **HiringManager** | View applications, conduct interviews, add feedback |
| **Admin** | Full platform control, user governance, analytics, approvals |

### Core Modules
- **Job Management** — Post jobs with type, salary, deadline, requirements
- **Application Pipeline** — Full status tracking (Applied → Under Review → Shortlisted → Interview Scheduled → Selected)
- **Interview Scheduling** — Schedule with type, interviewer, meet link, date/time
- **Interview Feedback** — Pass/Fail result with notes
- **Admin Dashboard** — Approve/reject Recruiter/HR/HiringManager accounts
- **Analytics** — Bar chart pipeline breakdown, role distribution, KPIs
- **Email Notifications** — Welcome email, approval/rejection emails, OTP emails

---

## 🏗️ Project Architecture (MVC)

```
HireMatrix/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── Admin/
│   │   │   ├── Analytics.jsx      # HR/Admin analytics dashboard
│   │   │   └── UserGovernance.jsx # Admin user management
│   │   ├── User/
│   │   │   ├── Overview.jsx       # Dashboard home
│   │   │   ├── Jobs.jsx           # Job browsing & posting
│   │   │   ├── ApplicationsPage.jsx # Application management
│   │   │   └── Interviews.jsx     # Interview scheduling & feedback
│   │   ├── Components/
│   │   │   ├── Landing.jsx        # Landing / home page
│   │   │   ├── AuthPage.jsx       # Login, Register, OTP, Forgot Password
│   │   │   ├── DashboardLayout.jsx # Sidebar + topbar layout
│   │   │   ├── StatusBadge.jsx    # Reusable status pill
│   │   │   └── Toast.jsx          # Toast notification system
│   │   ├── api.js                 # Axios instance with JWT interceptor
│   │   ├── state.jsx              # Auth context (login/register/logout)
│   │   ├── App.jsx                # Router with role-based route guards
│   │   ├── index.css              # Global design system (CSS variables)
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                    # Node.js + Express Backend
    ├── src/
    │   ├── config/
    │   │   └── db.js              # MongoDB connection
    │   ├── controllers/           # Business Logic (MVC Controllers)
    │   │   ├── userController.js  # Auth: register, login, OTP, password reset
    │   │   └── adminController.js # Admin: users, approvals, reports
    │   ├── middleware/
    │   │   ├── authMiddleware.js  # JWT protect + role guard
    │   │   └── upload.js          # Multer file upload (resumes)
    │   ├── models/                # MongoDB Schemas (MVC Models)
    │   │   ├── Users.js           # User schema
    │   │   ├── Jobs.js            # Job schema
    │   │   ├── Applications.js    # Application schema (with status transitions)
    │   │   ├── Interviews.js      # Interview schema
    │   │   └── OTP.js             # OTP schema (auto-expires in 15 min)
    │   ├── routes/                # API Routes (MVC Views / Routing Layer)
    │   │   ├── authRoutes.js      # /api/auth/*
    │   │   ├── jobRoutes.js       # /api/jobs/*
    │   │   ├── applicationRoutes.js # /api/applications/*
    │   │   ├── interviewRoutes.js # /api/interviews/*
    │   │   └── adminRoutes.js     # /api/admin/*
    │   └── utils/
    │       ├── mailer.js          # Nodemailer + HTML email templates
    │       └── seedAdmin.js       # Auto-creates default admin on startup
    ├── uploads/                   # Uploaded resume files
    ├── index.js                   # Server entry point
    ├── .env                       # Environment variables
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v16 or above
- MongoDB (local or MongoDB Atlas)
- npm v8 or above

### Step 1 — Clone / Extract Project
```bash
# Extract the zip
unzip HireMatrix.zip
cd HireMatrix
```

### Step 2 — Setup Backend (Server)
```bash
cd server

# Install dependencies
npm install

# Configure environment
# Edit .env file — set your MongoDB URI and email settings
```

**Edit `server/.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hirematrix
JWT_SECRET=hirematrix_super_secret_key_2024
CLIENT_URL=http://localhost:5173

# Gmail SMTP (optional — leave EMAIL_ENABLED=false for dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=HireMatrix <your_gmail@gmail.com>
EMAIL_ENABLED=false
```

> **Gmail Setup (for real emails):** Go to Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail". Set `EMAIL_ENABLED=true` and paste the 16-char password as `SMTP_PASS`.

```bash
# Start the server
npm run dev
# Server starts on http://localhost:5000
# Default admin is auto-created: admin@hirematrix.com / admin123
```

### Step 3 — Setup Frontend (Client)
```bash
cd ../client

# Install dependencies
npm install

# Start the frontend
npm run dev
# App opens on http://localhost:5173
```

---

## 🔐 Email Authentication Flow

### Registration
1. User fills form → hits "Create Account"
2. Backend creates user with `emailVerified: false`
3. OTP (6 digits, 15 min TTL) is generated and emailed (or logged to console in dev mode)
4. User is redirected to OTP entry screen
5. On correct OTP → `emailVerified: true` → Welcome email sent → JWT issued

### Forgot Password
1. User enters email → OTP sent
2. User enters OTP → verified
3. User sets new password → saved

### Dev Mode (EMAIL_ENABLED=false)
All OTPs are printed to the **server console** — no real email needed for testing.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (multipart/form-data) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/verify-email` | Verify email OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/auth/me` | Get current user (protected) |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs (role-filtered) |
| POST | `/api/jobs` | Create job (Recruiter/HR/Admin) |
| PUT | `/api/jobs/:id` | Update job |
| DELETE | `/api/jobs/:id` | Delete job |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/applications` | Apply (Applicant) |
| GET | `/api/applications` | List applications (role-filtered) |
| PATCH | `/api/applications/:id/status` | Update status (Recruiter/HR/Admin) |

### Interviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interviews` | Schedule interview |
| GET | `/api/interviews` | List interviews |
| PATCH | `/api/interviews/:id` | Add feedback/result |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/pending-users` | Pending approvals |
| PATCH | `/api/admin/users/:id/approval` | Approve/reject |
| PATCH | `/api/admin/users/:id` | Deactivate user |
| GET | `/api/admin/report` | Analytics report |

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6, Vite |
| Styling | Pure CSS with CSS Variables (custom design system) |
| State | React Context API + useState |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| File Uploads | Multer |
| Architecture | MVC (Model-View-Controller) |

---

## 👤 Default Admin Credentials
```
Email:    admin@hirematrix.com
Password: admin123
```
Auto-created on first server start if no Admin exists.

---

## 📸 Pages Overview
- **Landing Page** — Marketing page with features, how it works, CTA
- **Auth Page** — Login, Register, Email OTP Verify, Forgot/Reset Password
- **Dashboard — Overview** — Stats, pipeline summary, recent activity
- **Dashboard — Jobs** — Browse (Applicants) or post/manage (Recruiters/HR)
- **Dashboard — Applications** — Apply (Applicants) or review/update (Recruiters/HR)
- **Dashboard — Interviews** — View upcoming/past, add feedback (HiringManagers)
- **Dashboard — Analytics** — Bar charts, KPI cards (HR/Admin)
- **Dashboard — User Governance** — Approve pending, manage all users (Admin)

---

© 2025 HireMatrix · Built with React, Node.js, Express & MongoDB
