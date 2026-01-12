-- Update Students Table Schema
-- Add new required fields for enhanced student registration

USE student_hub;

-- Add new columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20) UNIQUE AFTER id,
ADD COLUMN IF NOT EXISTS course_of_study VARCHAR(255) AFTER address,
ADD COLUMN IF NOT EXISTS enrollment_date DATE AFTER course_of_study;

-- Update existing records with sample data
UPDATE students SET 
    student_id = CONCAT('STU', LPAD(id, 6, '0')),
    course_of_study = CASE 
        WHEN id = 1 THEN 'Computer Science'
        WHEN id = 2 THEN 'Business Administration'
        WHEN id = 3 THEN 'Engineering'
        WHEN id = 4 THEN 'Mathematics'
        ELSE 'General Studies'
    END,
    enrollment_date = DATE_SUB(CURDATE(), INTERVAL id MONTH)
WHERE student_id IS NULL;

-- Add index for student_id
CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
