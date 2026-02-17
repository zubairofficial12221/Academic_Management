-- EduTrack - Supabase Database Schema with Row Level Security (RLS)
-- Run this in Supabase SQL Editor after creating your project

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin','student','mentor')) NOT NULL,
  department TEXT,
  roll_number TEXT UNIQUE,
  year INTEGER,
  section TEXT,
  mentor_id UUID REFERENCES users(id),
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  hour INTEGER CHECK (hour BETWEEN 1 AND 8),
  subject TEXT,
  status TEXT CHECK (status IN ('present','absent','late')) DEFAULT 'absent',
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('absence','weather','result','general')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  exam_name TEXT NOT NULL,
  exam_date DATE,
  room_number TEXT,
  seat_number TEXT,
  hall_ticket_no TEXT UNIQUE,
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  exam_type TEXT CHECK (exam_type IN ('internal','external')),
  subject TEXT NOT NULL,
  subject_code TEXT,
  marks_obtained NUMERIC,
  max_marks NUMERIC DEFAULT 100,
  grade TEXT,
  semester INTEGER,
  academic_year TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  condition TEXT,
  temperature NUMERIC,
  wind_speed NUMERIC,
  is_unsafe BOOLEAN DEFAULT FALSE,
  holiday_recommended BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - users
-- ============================================
-- Students: SELECT only their own row
CREATE POLICY "Students can view own profile" ON users
  FOR SELECT USING (
    auth.uid() = id AND role = 'student'
  );

-- Admins: full access (match by auth.uid() to users.id where role = 'admin')
CREATE POLICY "Admins full access users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Mentors: SELECT their section's students (students where mentor_id = mentor's id)
CREATE POLICY "Mentors can view their students" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users m
      WHERE m.id = auth.uid() AND m.role = 'mentor' AND (users.mentor_id = m.id OR users.id = m.id)
    )
  );

-- Allow authenticated read for profile lookup (for dropdowns etc.) - restrict in app
CREATE POLICY "Authenticated can read users for lookup" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- RLS POLICIES - attendance
-- ============================================
-- Students: SELECT only their own attendance
CREATE POLICY "Students view own attendance" ON attendance
  FOR SELECT USING (student_id = auth.uid());

-- Admins: full access
CREATE POLICY "Admins full access attendance" ON attendance
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Mentors: SELECT and INSERT/UPDATE for their section's students
CREATE POLICY "Mentors manage section attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users m, users s
      WHERE m.id = auth.uid() AND m.role = 'mentor'
        AND s.id = attendance.student_id AND s.mentor_id = m.id
    )
  );

-- ============================================
-- RLS POLICIES - notifications
-- ============================================
-- Students: SELECT only their own, UPDATE is_read
CREATE POLICY "Students view own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Students update own notification read" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- Admins: full access
CREATE POLICY "Admins full access notifications" ON notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- RLS POLICIES - exam_seats
-- ============================================
-- Students: SELECT only their own
CREATE POLICY "Students view own exam seats" ON exam_seats
  FOR SELECT USING (student_id = auth.uid());

-- Admins: full access
CREATE POLICY "Admins full access exam_seats" ON exam_seats
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- RLS POLICIES - results
-- ============================================
-- Students: SELECT only their own
CREATE POLICY "Students view own results" ON results
  FOR SELECT USING (student_id = auth.uid());

-- Admins: full access
CREATE POLICY "Admins full access results" ON results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- RLS POLICIES - weather_logs
-- ============================================
-- Everyone authenticated can read; only admins insert
CREATE POLICY "Authenticated read weather_logs" ON weather_logs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins insert weather_logs" ON weather_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_exam_seats_student ON exam_seats(student_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_roll_number ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_users_department_year_section ON users(department, year, section);
