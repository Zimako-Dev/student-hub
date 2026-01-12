<?php
/**
 * Student Profile API Endpoint
 * Dynamically generated profile page using PHP functions and GET variables
 * Accessible by both students and admins
 * 
 * Uses:
 * - PHP functions with return values
 * - GET variables for student ID
 * - Constants for status indicators
 */

// Include required files
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Define academic status constants
define('STATUS_ACTIVE', 'Active');
define('STATUS_INACTIVE', 'Inactive');
define('STATUS_GRADUATED', 'Graduated');
define('STATUS_SUSPENDED', 'Suspended');
define('STATUS_ON_LEAVE', 'On Leave');
define('STATUS_PROBATION', 'Academic Probation');

// Status indicator colors (for frontend use)
define('STATUS_INDICATORS', [
    STATUS_ACTIVE => ['color' => '#16a34a', 'bg' => '#dcfce7', 'icon' => '✓'],
    STATUS_INACTIVE => ['color' => '#6b7280', 'bg' => '#f3f4f6', 'icon' => '○'],
    STATUS_GRADUATED => ['color' => '#7c3aed', 'bg' => '#ede9fe', 'icon' => '🎓'],
    STATUS_SUSPENDED => ['color' => '#dc2626', 'bg' => '#fee2e2', 'icon' => '⚠'],
    STATUS_ON_LEAVE => ['color' => '#d97706', 'bg' => '#fef3c7', 'icon' => '⏸'],
    STATUS_PROBATION => ['color' => '#ea580c', 'bg' => '#ffedd5', 'icon' => '!']
]);

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Authenticate user (both admin and student can access)
$currentUser = Auth::validateToken();
if (!$currentUser) {
    Response::error("Unauthorized access", 401);
}

// Handle request based on method
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($db, $currentUser);
        break;
    default:
        Response::error("Method not allowed", 405);
}

/**
 * Get student profile by ID (GET variable)
 * Uses PHP functions with return values
 */
function handleGet($db, $currentUser) {
    // Get student ID from GET variable
    $studentId = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    // If no ID provided, check if current user is a student
    if (!$studentId && $currentUser['role'] === 'student') {
        // Get student ID by email for student users
        $studentId = getStudentIdByEmail($db, $currentUser['email']);
    }
    
    if (!$studentId) {
        Response::error("Student ID is required", 400);
    }
    
    // Authorization check: students can only view their own profile
    if ($currentUser['role'] === 'student') {
        $ownStudentId = getStudentIdByEmail($db, $currentUser['email']);
        if ($ownStudentId !== $studentId) {
            Response::error("Access denied: You can only view your own profile", 403);
        }
    }
    
    // Get profile data using PHP functions with return values
    $personalDetails = getPersonalDetails($db, $studentId);
    
    if (!$personalDetails) {
        Response::error("Student not found", 404);
    }
    
    $enrolledCourses = getEnrolledCourses($db, $studentId);
    $academicStatus = getAcademicStatus($db, $studentId, $enrolledCourses);
    $registrationHistory = getRegistrationHistory($db, $studentId);
    
    // Build complete profile response
    $profile = buildProfileResponse($personalDetails, $enrolledCourses, $academicStatus, $registrationHistory);
    
    Response::success($profile);
}

/**
 * Get student ID by email
 * @param PDO $db Database connection
 * @param string $email User email
 * @return int|null Student ID or null
 */
function getStudentIdByEmail($db, $email) {
    $query = "SELECT id FROM students WHERE email = :email LIMIT 1";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return intval($result['id']);
        }
        
        return null;
    } catch (PDOException $e) {
        error_log("Error getting student ID: " . $e->getMessage());
        return null;
    }
}

/**
 * Get personal details for a student
 * Returns associative array with student information
 * 
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @return array|null Personal details or null if not found
 */
function getPersonalDetails($db, $studentId) {
    $query = "SELECT 
                id,
                student_id,
                first_name,
                last_name,
                email,
                phone,
                date_of_birth,
                address,
                course_of_study,
                enrollment_date,
                created_at,
                updated_at
              FROM students 
              WHERE id = :id";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $studentId, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            return null;
        }
        
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate age from date of birth
        $student['age'] = calculateAge($student['date_of_birth']);
        
        // Format full name
        $student['full_name'] = formatFullName($student['first_name'], $student['last_name']);
        
        // Calculate enrollment duration
        $student['enrollment_duration'] = calculateEnrollmentDuration($student['enrollment_date']);
        
        return $student;
        
    } catch (PDOException $e) {
        error_log("Error fetching personal details: " . $e->getMessage());
        return null;
    }
}

/**
 * Get enrolled courses for a student
 * Returns array of course objects with registration details
 * 
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @return array Enrolled courses
 */
function getEnrolledCourses($db, $studentId) {
    $query = "SELECT 
                c.id,
                c.code,
                c.name,
                c.description,
                c.credits,
                c.instructor,
                r.id as registration_id,
                r.registered_at,
                r.created_at as enrollment_date
              FROM courses c
              INNER JOIN registrations r ON c.id = r.course_id
              WHERE r.student_id = :student_id
              ORDER BY r.registered_at DESC";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->execute();
        
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add formatted dates and status to each course
        foreach ($courses as &$course) {
            $course['formatted_date'] = formatDate($course['registered_at']);
            $course['status'] = STATUS_ACTIVE; // Default course status
        }
        
        return $courses;
        
    } catch (PDOException $e) {
        error_log("Error fetching enrolled courses: " . $e->getMessage());
        return [];
    }
}

/**
 * Determine academic status based on enrollment and courses
 * Uses constants for status indicators
 * 
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @param array $courses Enrolled courses
 * @return array Academic status information
 */
function getAcademicStatus($db, $studentId, $courses) {
    $totalCredits = 0;
    $courseCount = count($courses);
    
    // Calculate total credits
    foreach ($courses as $course) {
        $totalCredits += intval($course['credits']);
    }
    
    // Determine status based on enrollment (using constants)
    $status = STATUS_ACTIVE;
    $statusReason = "Currently enrolled and in good standing";
    
    // Business logic for status determination
    if ($courseCount === 0) {
        $status = STATUS_INACTIVE;
        $statusReason = "No courses currently enrolled";
    } elseif ($totalCredits < 3) {
        $status = STATUS_PROBATION;
        $statusReason = "Below minimum credit requirement";
    } elseif ($totalCredits >= 120) {
        $status = STATUS_GRADUATED;
        $statusReason = "Completed degree requirements";
    }
    
    // Get status indicator from constants
    $indicator = STATUS_INDICATORS[$status];
    
    return [
        'status' => $status,
        'status_reason' => $statusReason,
        'indicator' => $indicator,
        'total_credits' => $totalCredits,
        'course_count' => $courseCount,
        'credit_requirement' => 120,
        'credits_remaining' => max(0, 120 - $totalCredits),
        'progress_percentage' => min(100, round(($totalCredits / 120) * 100, 1)),
        'standing' => $totalCredits >= 12 ? 'Good Standing' : 'Needs Improvement',
        'semester' => determineSemester($totalCredits)
    ];
}

/**
 * Get registration history for a student
 * 
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @return array Registration history
 */
function getRegistrationHistory($db, $studentId) {
    $query = "SELECT 
                r.id,
                r.registered_at,
                c.code as course_code,
                c.name as course_name,
                c.credits
              FROM registrations r
              INNER JOIN courses c ON r.course_id = c.id
              WHERE r.student_id = :student_id
              ORDER BY r.registered_at ASC";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } catch (PDOException $e) {
        error_log("Error fetching registration history: " . $e->getMessage());
        return [];
    }
}

/**
 * Build complete profile response
 * Combines all profile data into structured response
 * 
 * @param array $personalDetails Personal information
 * @param array $courses Enrolled courses
 * @param array $academicStatus Academic status
 * @param array $history Registration history
 * @return array Complete profile data
 */
function buildProfileResponse($personalDetails, $courses, $academicStatus, $history) {
    return [
        'personal_details' => $personalDetails,
        'enrolled_courses' => $courses,
        'academic_status' => $academicStatus,
        'registration_history' => $history,
        'status_constants' => [
            'ACTIVE' => STATUS_ACTIVE,
            'INACTIVE' => STATUS_INACTIVE,
            'GRADUATED' => STATUS_GRADUATED,
            'SUSPENDED' => STATUS_SUSPENDED,
            'ON_LEAVE' => STATUS_ON_LEAVE,
            'PROBATION' => STATUS_PROBATION
        ],
        'status_indicators' => STATUS_INDICATORS,
        'generated_at' => date('Y-m-d H:i:s')
    ];
}

// ==================== Helper Functions ====================

/**
 * Calculate age from date of birth
 * @param string $dob Date of birth (Y-m-d format)
 * @return int|null Age in years
 */
function calculateAge($dob) {
    if (!$dob) return null;
    
    try {
        $birthDate = new DateTime($dob);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;
        return $age;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Format full name
 * @param string $firstName First name
 * @param string $lastName Last name
 * @return string Formatted full name
 */
function formatFullName($firstName, $lastName) {
    return trim($firstName . ' ' . $lastName);
}

/**
 * Calculate enrollment duration
 * @param string $enrollmentDate Enrollment date
 * @return string Duration string
 */
function calculateEnrollmentDuration($enrollmentDate) {
    if (!$enrollmentDate) return 'N/A';
    
    try {
        $startDate = new DateTime($enrollmentDate);
        $today = new DateTime();
        $diff = $today->diff($startDate);
        
        $parts = [];
        if ($diff->y > 0) $parts[] = $diff->y . ' year' . ($diff->y > 1 ? 's' : '');
        if ($diff->m > 0) $parts[] = $diff->m . ' month' . ($diff->m > 1 ? 's' : '');
        if (empty($parts)) $parts[] = $diff->d . ' days';
        
        return implode(', ', $parts);
    } catch (Exception $e) {
        return 'N/A';
    }
}

/**
 * Format date for display
 * @param string $date Date string
 * @return string Formatted date
 */
function formatDate($date) {
    if (!$date) return 'N/A';
    
    try {
        $dateObj = new DateTime($date);
        return $dateObj->format('F j, Y');
    } catch (Exception $e) {
        return $date;
    }
}

/**
 * Determine semester based on credits
 * @param int $credits Total credits
 * @return string Semester/Year standing
 */
function determineSemester($credits) {
    if ($credits < 30) return 'Freshman';
    if ($credits < 60) return 'Sophomore';
    if ($credits < 90) return 'Junior';
    return 'Senior';
}
