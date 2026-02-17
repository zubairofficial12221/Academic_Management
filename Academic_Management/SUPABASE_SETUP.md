# Supabase Setup Guide for EduManage Pro

## 1. Get Your Supabase Project URL

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Project Settings** → **API**
4. Copy the **Project URL** (e.g. `https://xxxxxxxx.supabase.co`)

## 2. Update supabase-config.js

Open `supabase-config.js` and replace `YOUR_PROJECT_REF` with your actual project reference from the URL:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';  // e.g. https://abcdefgh.supabase.co
```

Your publishable key is already configured.

## 3. Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** to create the tables and sample data

## 4. Security Warning

**Never put your secret key in client-side JavaScript.** If you exposed it, go to Supabase Dashboard → Project Settings → API → **Regenerate** the secret key immediately.

## 5. What Gets Stored in Supabase

| Data Type | Table(s) | When Updated |
|-----------|----------|--------------|
| **Students** | `students` | Add student, login (load) |
| **Attendance** | `attendance_records` | Save attendance (hour-wise) |
| **Notifications** | `notifications` | Add notification, clear all |
| **Results** | `results`, `result_subjects` | Load on login |
| **Mentors** | `mentors` | Schema includes table; add UI to manage |
| **Admins** | `admins` | Schema includes table; add UI to manage |

## 6. Test the Connection

1. Open `student-management-system.html` in a browser
2. Click **Login as Admin**
3. Data should load from Supabase (or fallback to sample data if tables are empty)
4. Add a student, save attendance, or add a notification to verify writes
