<?php
/**
 * Input Validation Utility Class
 * Uses PHP string functions for comprehensive validation
 */

class Validator {
    // Constants for validation rules
    const MIN_NAME_LENGTH = 2;
    const MAX_NAME_LENGTH = 100;
    const MIN_STUDENT_ID_LENGTH = 5;
    const MAX_STUDENT_ID_LENGTH = 20;
    const MIN_AGE = 16;
    const MAX_AGE = 100;
    const EMAIL_PATTERN = '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
    const PHONE_PATTERN = '/^[\d\-\+\s()]{7,20}$/';
    const STUDENT_ID_PATTERN = '/^[A-Z0-9]{5,20}$/';

    private $errors = [];

    /**
     * Validate full name (first and last name combined)
     */
    public function validateFullName($firstName, $lastName) {
        // Trim whitespace
        $firstName = trim($firstName);
        $lastName = trim($lastName);

        // Check if empty
        if (empty($firstName)) {
            $this->errors['first_name'] = 'First name is required';
        } elseif (strlen($firstName) < self::MIN_NAME_LENGTH) {
            $this->errors['first_name'] = 'First name must be at least ' . self::MIN_NAME_LENGTH . ' characters';
        } elseif (strlen($firstName) > self::MAX_NAME_LENGTH) {
            $this->errors['first_name'] = 'First name must not exceed ' . self::MAX_NAME_LENGTH . ' characters';
        } elseif (!ctype_alpha(str_replace([' ', '-', "'"], '', $firstName))) {
            $this->errors['first_name'] = 'First name can only contain letters, spaces, hyphens, and apostrophes';
        }

        if (empty($lastName)) {
            $this->errors['last_name'] = 'Last name is required';
        } elseif (strlen($lastName) < self::MIN_NAME_LENGTH) {
            $this->errors['last_name'] = 'Last name must be at least ' . self::MIN_NAME_LENGTH . ' characters';
        } elseif (strlen($lastName) > self::MAX_NAME_LENGTH) {
            $this->errors['last_name'] = 'Last name must not exceed ' . self::MAX_NAME_LENGTH . ' characters';
        } elseif (!ctype_alpha(str_replace([' ', '-', "'"], '', $lastName))) {
            $this->errors['last_name'] = 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        }

        return empty($this->errors);
    }

    /**
     * Validate student ID
     */
    public function validateStudentId($studentId) {
        $studentId = trim(strtoupper($studentId));

        if (empty($studentId)) {
            $this->errors['student_id'] = 'Student ID is required';
        } elseif (strlen($studentId) < self::MIN_STUDENT_ID_LENGTH) {
            $this->errors['student_id'] = 'Student ID must be at least ' . self::MIN_STUDENT_ID_LENGTH . ' characters';
        } elseif (strlen($studentId) > self::MAX_STUDENT_ID_LENGTH) {
            $this->errors['student_id'] = 'Student ID must not exceed ' . self::MAX_STUDENT_ID_LENGTH . ' characters';
        } elseif (!preg_match(self::STUDENT_ID_PATTERN, $studentId)) {
            $this->errors['student_id'] = 'Student ID must contain only uppercase letters and numbers';
        }

        return $studentId;
    }

    /**
     * Validate email address
     */
    public function validateEmail($email) {
        $email = trim(strtolower($email));

        if (empty($email)) {
            $this->errors['email'] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->errors['email'] = 'Invalid email format';
        } elseif (!preg_match(self::EMAIL_PATTERN, $email)) {
            $this->errors['email'] = 'Email format is not acceptable';
        } elseif (strlen($email) > 255) {
            $this->errors['email'] = 'Email must not exceed 255 characters';
        }

        return $email;
    }

    /**
     * Validate date of birth
     */
    public function validateDateOfBirth($dateOfBirth) {
        if (empty($dateOfBirth)) {
            $this->errors['date_of_birth'] = 'Date of birth is required';
            return false;
        }

        // Check date format
        $date = DateTime::createFromFormat('Y-m-d', $dateOfBirth);
        if (!$date || $date->format('Y-m-d') !== $dateOfBirth) {
            $this->errors['date_of_birth'] = 'Invalid date format. Use YYYY-MM-DD';
            return false;
        }

        // Calculate age
        $today = new DateTime();
        $age = $today->diff($date)->y;

        if ($age < self::MIN_AGE) {
            $this->errors['date_of_birth'] = 'Student must be at least ' . self::MIN_AGE . ' years old';
        } elseif ($age > self::MAX_AGE) {
            $this->errors['date_of_birth'] = 'Invalid date of birth';
        } elseif ($date > $today) {
            $this->errors['date_of_birth'] = 'Date of birth cannot be in the future';
        }

        return empty($this->errors['date_of_birth']);
    }

    /**
     * Validate course of study
     */
    public function validateCourseOfStudy($courseOfStudy) {
        $courseOfStudy = trim($courseOfStudy);

        if (empty($courseOfStudy)) {
            $this->errors['course_of_study'] = 'Course of study is required';
        } elseif (strlen($courseOfStudy) < 3) {
            $this->errors['course_of_study'] = 'Course of study must be at least 3 characters';
        } elseif (strlen($courseOfStudy) > 255) {
            $this->errors['course_of_study'] = 'Course of study must not exceed 255 characters';
        }

        return $courseOfStudy;
    }

    /**
     * Validate enrollment date
     */
    public function validateEnrollmentDate($enrollmentDate) {
        if (empty($enrollmentDate)) {
            $this->errors['enrollment_date'] = 'Enrollment date is required';
            return false;
        }

        // Check date format
        $date = DateTime::createFromFormat('Y-m-d', $enrollmentDate);
        if (!$date || $date->format('Y-m-d') !== $enrollmentDate) {
            $this->errors['enrollment_date'] = 'Invalid date format. Use YYYY-MM-DD';
            return false;
        }

        // Check if date is not too far in the future
        $today = new DateTime();
        $maxFutureDate = (new DateTime())->modify('+1 year');

        if ($date > $maxFutureDate) {
            $this->errors['enrollment_date'] = 'Enrollment date cannot be more than 1 year in the future';
        }

        // Check if date is not too far in the past (e.g., 10 years)
        $minPastDate = (new DateTime())->modify('-10 years');
        if ($date < $minPastDate) {
            $this->errors['enrollment_date'] = 'Enrollment date cannot be more than 10 years in the past';
        }

        return empty($this->errors['enrollment_date']);
    }

    /**
     * Validate phone number (optional field)
     */
    public function validatePhone($phone) {
        if (empty($phone)) {
            return null; // Phone is optional
        }

        $phone = trim($phone);

        if (!preg_match(self::PHONE_PATTERN, $phone)) {
            $this->errors['phone'] = 'Invalid phone number format';
        }

        return $phone;
    }

    /**
     * Validate address (optional field)
     */
    public function validateAddress($address) {
        if (empty($address)) {
            return null; // Address is optional
        }

        $address = trim($address);

        if (strlen($address) > 500) {
            $this->errors['address'] = 'Address must not exceed 500 characters';
        }

        return $address;
    }

    /**
     * Sanitize string input
     */
    public function sanitizeString($input) {
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        return $input;
    }

    /**
     * Get all validation errors
     */
    public function getErrors() {
        return $this->errors;
    }

    /**
     * Check if validation passed
     */
    public function isValid() {
        return empty($this->errors);
    }

    /**
     * Clear all errors
     */
    public function clearErrors() {
        $this->errors = [];
    }
}
