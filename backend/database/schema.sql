-- Student Hub Database Schema
-- Create database and tables

CREATE DATABASE IF NOT EXISTS student_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE student_hub;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    course_of_study VARCHAR(255),
    enrollment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_name (first_name, last_name),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INT NOT NULL,
    instructor VARCHAR(255),
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registrations table (junction table for students and courses)
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (student_id, course_id),
    INDEX idx_student (student_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
-- Password is hashed using password_hash() with PASSWORD_DEFAULT
INSERT INTO users (email, password, role) VALUES 
('admin@academix.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- Insert student user accounts (password: student123 for all)
-- These link to the students table via email
INSERT INTO users (email, password, role) VALUES 
('john.doe@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('jane.smith@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('mike.johnson@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('sarah.williams@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('david.brown@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample students
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth, address, course_of_study, enrollment_date) VALUES
('STU000001', 'John', 'Doe', 'john.doe@example.com', '555-0101', '2000-01-15', '123 Main St, Springfield', 'Computer Science', '2023-09-01'),
('STU000002', 'Jane', 'Smith', 'jane.smith@example.com', '555-0102', '1999-05-20', '456 Oak Ave, Riverside', 'Business Administration', '2023-09-01'),
('STU000003', 'Mike', 'Johnson', 'mike.johnson@example.com', '555-0103', '2001-03-10', '789 Pine Rd, Lakeside', 'Engineering', '2024-01-15'),
('STU000004', 'Sarah', 'Williams', 'sarah.williams@example.com', '555-0104', '2000-07-22', '321 Elm St, Hilltown', 'Mathematics', '2024-01-15'),
('STU000005', 'David', 'Brown', 'david.brown@example.com', '555-0105', '1998-11-30', '654 Maple Dr, Greenfield', 'Physics', '2023-09-01')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample courses
INSERT INTO courses (code, name, description, credits, instructor, capacity) VALUES
('CS101', 'Introduction to Programming', 'Learn fundamentals of programming using Python', 3, 'Dr. Smith', 30),
('MATH201', 'Calculus I', 'Differential and integral calculus', 4, 'Prof. Johnson', 35),
('PHY101', 'Physics I', 'Mechanics and thermodynamics', 4, 'Dr. Williams', 25),
('ENG101', 'English Composition', 'Academic writing and communication skills', 3, 'Ms. Davis', 30),
('CS201', 'Data Structures', 'Advanced programming concepts and algorithms', 3, 'Dr. Brown', 25)
ON DUPLICATE KEY UPDATE code=code;

-- Insert sample registrations
INSERT INTO registrations (student_id, course_id) VALUES
(1, 1), (1, 2), (2, 1), (3, 3), (4, 4), (5, 5)
ON DUPLICATE KEY UPDATE student_id=student_id;
