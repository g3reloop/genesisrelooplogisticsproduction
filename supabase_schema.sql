-- QMUL BA Politics International Relations Timetable Database Schema
-- Supabase PostgreSQL Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create timetable_events table
CREATE TABLE timetable_events (
    id BIGSERIAL PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    module_code VARCHAR(20),
    event_type VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    lecturer VARCHAR(255),
    color_code VARCHAR(7) DEFAULT '#3366cc',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_profile table
CREATE TABLE student_profile (
    id BIGSERIAL PRIMARY KEY,
    student_code VARCHAR(20) UNIQUE NOT NULL,
    programme VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    school VARCHAR(100) NOT NULL,
    academic_year VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_timetable_events_day ON timetable_events(day);
CREATE INDEX idx_timetable_events_start_time ON timetable_events(start_time);
CREATE INDEX idx_timetable_events_module_code ON timetable_events(module_code);
CREATE INDEX idx_timetable_events_event_type ON timetable_events(event_type);

-- Enable Row Level Security
ALTER TABLE timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to timetable_events" 
ON timetable_events FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to student_profile" 
ON student_profile FOR SELECT 
USING (true);

-- Insert initial student profile data
INSERT INTO student_profile (student_code, programme, course, school, academic_year) 
VALUES ('210693391/1', 'BA FT POLITICS', 'International Relations', 'School of Politics and International Relations', '2024/25');

-- Insert sample timetable data
INSERT INTO timetable_events (day, start_time, end_time, module_name, module_code, event_type, location, lecturer, color_code) VALUES
-- Wednesday Events
('Wednesday', '13:00', '14:00', 'International Relations Theory', 'POL123', 'lecture', 'Francis Bancroft Building, Room 2.14', 'Dr. Smith', '#8B1A3D'),
('Wednesday', '15:00', '16:00', 'International Relations Theory', 'POL123', 'seminar', 'Graduate Centre, Room 4.25', 'Dr. Smith', '#00539B'),

-- Thursday Events
('Thursday', '10:00', '11:00', 'Global Political Economy', 'POL456', 'lecture', 'People''s Palace, Lecture Theatre A', 'Prof. Johnson', '#8B1A3D'),
('Thursday', '11:00', '12:00', 'Foreign Policy Analysis', 'POL789', 'lecture', 'Arts Two, Room 3.16', 'Dr. Brown', '#8B1A3D'),
('Thursday', '13:00', '14:00', 'Global Political Economy', 'POL456', 'seminar', 'Mile End Campus, Room 1.12', 'Prof. Johnson', '#00539B'),
('Thursday', '14:00', '15:00', 'Foreign Policy Analysis', 'POL789', 'seminar', 'Queens'' Building, Room 2.08', 'Dr. Brown', '#00539B'),
('Thursday', '15:00', '16:00', 'Dissertation Supervision', 'POL999', 'dissertation', 'School of Politics Office', 'Student Advisor', '#2E8B57'),

-- Friday Events
('Friday', '11:00', '12:00', 'International Security', 'POL321', 'lecture', 'Bancroft Building, Lecture Theatre 1', 'Dr. Wilson', '#8B1A3D'),
('Friday', '13:00', '14:00', 'International Security', 'POL321', 'seminar', 'Graduate Centre, Room 3.14', 'Dr. Wilson', '#00539B'),
('Friday', '15:00', '16:00', 'Research Methods in Politics', 'POL654', 'seminar', 'Arts Two, Computer Lab 2', 'Dr. Davis', '#00539B');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_timetable_events_updated_at 
    BEFORE UPDATE ON timetable_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();