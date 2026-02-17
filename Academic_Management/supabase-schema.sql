-- =====================================================
-- EduManage Pro - Supabase Database Schema
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Mentors table
CREATE TABLE IF NOT EXISTS mentors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT NOT NULL,
  email TEXT
);

-- 2. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT
);

-- 3. Students table
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dept TEXT NOT NULL,
  mentor TEXT NOT NULL,
  attendance INTEGER DEFAULT 100,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Attendance records (hour-wise per student per day)
CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  hour_1 TEXT CHECK (hour_1 IN ('P', 'A')),
  hour_2 TEXT CHECK (hour_2 IN ('P', 'A')),
  hour_3 TEXT CHECK (hour_3 IN ('P', 'A')),
  hour_4 TEXT CHECK (hour_4 IN ('P', 'A')),
  hour_5 TEXT CHECK (hour_5 IN ('P', 'A')),
  hour_6 TEXT CHECK (hour_6 IN ('P', 'A')),
  UNIQUE(student_id, record_date)
);

-- 5. Results (student + semester)
CREATE TABLE IF NOT EXISTS results (
  id BIGSERIAL PRIMARY KEY,
  roll_no TEXT NOT NULL,
  student_name TEXT NOT NULL,
  semester INTEGER NOT NULL,
  UNIQUE(roll_no, semester)
);

-- 6. Result subjects (marks per subject)
CREATE TABLE IF NOT EXISTS result_subjects (
  id BIGSERIAL PRIMARY KEY,
  result_id BIGINT REFERENCES results(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  internal INTEGER DEFAULT 0,
  external INTEGER DEFAULT 0,
  max_marks INTEGER DEFAULT 100,
  grade TEXT
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  icon TEXT,
  color TEXT,
  title TEXT NOT NULL,
  msg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for now (no auth). Tighten later with proper auth.
CREATE POLICY "Allow all on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on mentors" ON mentors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on admins" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on results" ON results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on result_subjects" ON result_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Insert sample mentors
INSERT INTO mentors (name, dept, email) VALUES
  ('Dr. Sharma', 'Computer Science', 'sharma@college.edu'),
  ('Dr. Reddy', 'Electronics', 'reddy@college.edu'),
  ('Dr. Kumar', 'Mechanical', 'kumar@college.edu')
ON CONFLICT DO NOTHING;

-- Insert sample admins
INSERT INTO admins (name, email) VALUES
  ('Admin User', 'admin@college.edu')
ON CONFLICT DO NOTHING;

-- Insert sample students
INSERT INTO students (roll_no, name, dept, mentor, attendance, email) VALUES
  ('CS001', 'Rahul Kumar', 'Computer Science', 'Dr. Sharma', 85, 'rahul@college.edu'),
  ('CS002', 'Priya Singh', 'Computer Science', 'Dr. Sharma', 92, 'priya@college.edu'),
  ('EC001', 'Amit Patel', 'Electronics', 'Dr. Reddy', 78, 'amit@college.edu'),
  ('EC002', 'Sneha Iyer', 'Electronics', 'Dr. Reddy', 95, 'sneha@college.edu'),
  ('ME001', 'Vikram Shah', 'Mechanical', 'Dr. Kumar', 88, 'vikram@college.edu'),
  ('ME002', 'Anjali Desai', 'Mechanical', 'Dr. Kumar', 72, 'anjali@college.edu')
ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, dept = EXCLUDED.dept, mentor = EXCLUDED.mentor, attendance = EXCLUDED.attendance, email = EXCLUDED.email;

-- Insert sample results (run after tables exist)
-- You can add sample result data via the app or run manual INSERTs for CS001, CS002, EC001 etc.
