# EduTrack — All-in-One Student Attendance & Academic Management System

A production-ready, fully responsive web application for colleges to manage student attendance, exam seat allocation, results, weather-based alerts, and notifications.

## Features

- **Role-based access**: Admin, Student, Mentor with Supabase Auth + RLS
- **Attendance**: Mark by department/year/section, hour (1–8), bulk actions, records & summary with CSV export
- **Weather monitor**: OpenWeather API integration, safety badges, holiday recommendation, auto-refresh & notifications
- **Exam seat allocation**: Generate hall tickets with QR codes, room/seat assignment (alphabetical/roll/random)
- **Results**: Add/edit results, bulk CSV import, grade calculation, publish & notify students, PDF export
- **Notifications**: Absence, weather, result, general; filter, mark read, manual send (all/department/individual)
- **Student portal**: Dashboard, attendance calendar, hall ticket with QR, results by semester with GPA & PDF

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5
- **Database & Auth**: Supabase (Row Level Security)
- **API**: OpenWeather API
- **Icons**: Bootstrap Icons | **Charts**: Chart.js | **PDF**: jsPDF | **CSV**: PapaParse | **QR**: QRCode.js

---

## Supabase Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose organization, name (e.g. `edutrack`), database password, region.
3. Wait for the project to be ready.

### 2. Run the schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Copy the entire contents of `supabase/schema.sql`.
3. Paste and click **Run**. All tables, RLS policies, and indexes will be created.

### 3. Enable Auth and link to `users`

1. Go to **Authentication** → **Providers** and ensure **Email** is enabled.
2. We use Supabase Auth for login; the app expects a row in `users` for each auth user:
   - After a user signs up/signs in, their `auth.uid()` must match `users.id`.
   - **Recommended**: Use a trigger or Edge Function to create/update `users` on `auth.users` insert, or create the first admin manually (see below).

### 4. Get your keys

1. Go to **Project Settings** → **API**.
2. Copy **Project URL** and **anon public** key.
3. In the project, open `assets/js/supabase-config.js` and set:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON_KEY` = your anon key  

**Never use the service_role key on the frontend.**

### 5. Create the first admin user manually

1. In Supabase **Authentication** → **Users**, click **Add user** → **Create new user**.
2. Enter email and password, then create. Copy the new user’s **UUID** (e.g. from the table or URL).
3. In **Table Editor** → **users**, click **Insert row** and add:
   - **id**: paste the same UUID from step 2 (must match `auth.users.id`).
   - **name**: e.g. `Admin User`
   - **email**: same email as in Auth
   - **role**: `admin`
   - **department**: (optional) e.g. `CSE`
   - Leave **roll_number**, **year**, **section**, **mentor_id**, **phone** empty.
4. Save. You can now log in on the app as Admin.

---

## OpenWeather API key

1. Go to [openweathermap.org](https://openweathermap.org), sign up, then **API keys**.
2. Create a key (free tier is enough).
3. In `assets/js/weather.js`, set `OPENWEATHER_API_KEY` to your key (or use an env/config pattern and never commit the key).

---

## Running locally (VS Code Live Server)

1. Install **Live Server** in VS Code (e.g. “Live Server” by Ritwick Dey).
2. Right-click `edutrack/index.html` → **Open with Live Server** (or open the `edutrack` folder and right-click `index.html`).
3. The app will open at `http://127.0.0.1:5500/edutrack/` (port may vary). Use this base path so that `/assets/` and routes resolve correctly.
4. If your base URL differs, adjust any hardcoded paths (e.g. redirects) in `supabase-config.js` and auth flow (e.g. `window.location.href = '/edutrack/index.html'` if you serve from project root).

---

## Folder structure

```
edutrack/
├── index.html                 # Login (role selector: Admin / Student / Mentor)
├── admin/
│   ├── dashboard.html        # Stats, charts, recent activity, quick actions
│   ├── attendance.html       # Mark / Records / Summary
│   ├── seat-arrangement.html # Exam seats + hall ticket generation
│   ├── results.html          # Add/bulk results, publish & notify
│   ├── weather.html          # Weather monitor + history
│   └── notifications.html   # Notification center + manual send
├── student/
│   ├── login.html            # Student login (can redirect to index or duplicate)
│   ├── dashboard.html        # Profile, attendance summary, exams, results, links
│   ├── attendance-view.html  # Calendar + subject-wise %
│   ├── hall-ticket.html      # Hall ticket with QR + print
│   └── results-view.html     # Results by semester + GPA + PDF
├── assets/
│   ├── css/
│   │   └── main.css          # Design system, layout, components
│   └── js/
│       ├── supabase-config.js # Supabase client + requireAuth()
│       ├── auth.js           # Login/signout helpers
│       ├── utils.js          # Count-up, toast, formatDate, CSV export, debounce, grade
│       ├── attendance.js     # Admin attendance logic
│       ├── weather.js        # OpenWeather + weather_logs + alerts
│       ├── seat-arrange.js   # Seat generation + exam_seats
│       ├── results.js        # Results CRUD + bulk + publish/notify
│       └── notifications.js # List, mark read, send manual
├── supabase/
│   └── schema.sql            # Tables, RLS, indexes
└── README.md                 # This file
```

---

## Security notes

- **RLS**: Students see only their own data; admins have full access; mentors can manage their section’s attendance and view their students.
- **Keys**: Use only the Supabase **anon** key in the frontend. Do not expose the **service_role** key.
- **Auth**: Every admin page calls `requireAuth(['admin'])`; every student page calls `requireAuth(['student'])`. Redirect to login if unauthenticated or wrong role.

---

## Quick test checklist

1. Create admin user (Supabase Auth + `users` row with same `id` and `role = 'admin'`).
2. Log in on `index.html` as Admin → should land on `admin/dashboard.html`.
3. Create a student user (Auth + `users` with `role = 'student'`, department, year, section, roll_number).
4. Log in as Student → should land on `student/dashboard.html`.
5. Mark attendance as admin, then view as student on `attendance-view.html`.
6. Generate exam seats, then open `hall-ticket.html` as student.
7. Add results and “Publish & Notify”, then check `results-view.html` and notifications.
