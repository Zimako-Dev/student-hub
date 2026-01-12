<?php
/**
 * Students API Endpoint
 * Handles CRUD operations for students
 * Admin only access with comprehensive validation
 */

require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';
require_once '../utils/Validator.php';
require_once '../utils/Logger.php';

// Require authentication for all requests
$currentUser = Auth::requireAuth();

// Check if user is admin
if ($currentUser['role'] !== 'admin') {
    Response::error("Admin access required", 403);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::error("Database connection failed", 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($db);
        break;
    case 'POST':
        handlePost($db);
        break;
    case 'PUT':
        handlePut($db);
        break;
    case 'DELETE':
        handleDelete($db);
        break;
    default:
        Response::error("Method not allowed", 405);
}

/**
 * Get all students or single student by ID
 * Supports search, filter, and sort using PHP arrays
 */
function handleGet($db) {
    if (isset($_GET['id'])) {
        // Get single student by ID
        $query = "SELECT id, student_id, first_name, last_name, email, phone, 
                  date_of_birth, address, course_of_study, enrollment_date, 
                  created_at, updated_at 
                  FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $_GET['id'], PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            Response::notFound("Student not found");
        }
        
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        Response::success($student);
    } else {
        // Get all students with optional filtering
        $query = "SELECT id, student_id, first_name, last_name, email, phone, 
                  date_of_birth, address, course_of_study, enrollment_date, 
                  created_at, updated_at 
                  FROM students";
        
        // Build WHERE clause for filtering
        $whereConditions = [];
        $params = [];
        
        // Filter by course of study
        if (isset($_GET['course']) && !empty($_GET['course'])) {
            $whereConditions[] = "course_of_study LIKE :course";
            $params[':course'] = '%' . $_GET['course'] . '%';
        }
        
        // Filter by enrollment year
        if (isset($_GET['year']) && !empty($_GET['year'])) {
            $whereConditions[] = "YEAR(enrollment_date) = :year";
            $params[':year'] = $_GET['year'];
        }
        
        // Search functionality (name or email)
        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $searchTerm = '%' . $_GET['search'] . '%';
            $whereConditions[] = "(first_name LIKE :search1 OR last_name LIKE :search2 OR email LIKE :search3 OR student_id LIKE :search4)";
            $params[':search1'] = $searchTerm;
            $params[':search2'] = $searchTerm;
            $params[':search3'] = $searchTerm;
            $params[':search4'] = $searchTerm;
        }
        
        // Add WHERE clause if conditions exist
        if (count($whereConditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $whereConditions);
        }
        
        // Sorting logic using PHP arrays
        $sortField = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
        $sortOrder = isset($_GET['order']) && strtoupper($_GET['order']) === 'ASC' ? 'ASC' : 'DESC';
        
        // Validate sort field to prevent SQL injection
        $allowedSortFields = ['id', 'student_id', 'first_name', 'last_name', 'email', 
                              'course_of_study', 'enrollment_date', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        $query .= " ORDER BY " . $sortField . " " . $sortOrder;
        
        // Execute query
        $stmt = $db->prepare($query);
        
        // Bind parameters
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value, PDO::PARAM_STR);
        }
        
        $stmt->execute();
        
        // Fetch all students as array
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Additional PHP array processing for statistics
        $totalStudents = count($students);
        $courseStats = [];
        
        // Process array to get course statistics
        foreach ($students as $student) {
            $course = $student['course_of_study'];
            if (!isset($courseStats[$course])) {
                $courseStats[$course] = 0;
            }
            $courseStats[$course]++;
        }
        
        // Sort course stats by count (descending)
        arsort($courseStats);
        
        // Return data with metadata
        Response::success([
            'students' => $students,
            'total' => $totalStudents,
            'course_stats' => $courseStats,
            'filters_applied' => [
                'search' => $_GET['search'] ?? null,
                'course' => $_GET['course'] ?? null,
                'year' => $_GET['year'] ?? null,
                'sort' => $sortField,
                'order' => $sortOrder
            ]
        ]);
    }
}

/**
 * Create new student (Admin only)
 * Validates all inputs using string functions and prepared statements
 */
function handlePost($db) {
    // Get and decode input data
    $data = json_decode(file_get_contents("php://input"));
    
    // Initialize validator
    $validator = new Validator();
    
    // Extract and sanitize inputs
    $firstName = isset($data->first_name) ? $validator->sanitizeString($data->first_name) : '';
    $lastName = isset($data->last_name) ? $validator->sanitizeString($data->last_name) : '';
    $studentId = isset($data->student_id) ? $data->student_id : '';
    $email = isset($data->email) ? $data->email : '';
    $dateOfBirth = isset($data->date_of_birth) ? $data->date_of_birth : '';
    $courseOfStudy = isset($data->course_of_study) ? $validator->sanitizeString($data->course_of_study) : '';
    $enrollmentDate = isset($data->enrollment_date) ? $data->enrollment_date : '';
    $phone = isset($data->phone) ? $data->phone : null;
    $address = isset($data->address) ? $validator->sanitizeString($data->address) : null;
    
    // Validate all required fields using string functions
    $validator->validateFullName($firstName, $lastName);
    $studentId = $validator->validateStudentId($studentId);
    $email = $validator->validateEmail($email);
    $validator->validateDateOfBirth($dateOfBirth);
    $courseOfStudy = $validator->validateCourseOfStudy($courseOfStudy);
    $validator->validateEnrollmentDate($enrollmentDate);
    
    // Validate optional fields
    $phone = $validator->validatePhone($phone);
    $address = $validator->validateAddress($address);
    
    // Check for validation errors
    if (!$validator->isValid()) {
        Response::validationError($validator->getErrors(), "Validation failed. Please check your inputs.");
    }
    
    // Check if student ID already exists using prepared statement
    $checkIdQuery = "SELECT id FROM students WHERE student_id = :student_id LIMIT 1";
    $checkIdStmt = $db->prepare($checkIdQuery);
    $checkIdStmt->bindParam(':student_id', $studentId, PDO::PARAM_STR);
    $checkIdStmt->execute();
    
    if ($checkIdStmt->rowCount() > 0) {
        Response::validationError(['student_id' => 'Student ID already exists'], "Duplicate student ID");
    }
    
    // Check if email already exists using prepared statement
    $checkEmailQuery = "SELECT id FROM students WHERE email = :email LIMIT 1";
    $checkEmailStmt = $db->prepare($checkEmailQuery);
    $checkEmailStmt->bindParam(':email', $email, PDO::PARAM_STR);
    $checkEmailStmt->execute();
    
    if ($checkEmailStmt->rowCount() > 0) {
        Response::validationError(['email' => 'Email already exists'], "Duplicate email address");
    }
    
    // Insert student using prepared statement to prevent SQL injection
    $query = "INSERT INTO students 
              (student_id, first_name, last_name, email, phone, date_of_birth, 
               address, course_of_study, enrollment_date) 
              VALUES 
              (:student_id, :first_name, :last_name, :email, :phone, :date_of_birth, 
               :address, :course_of_study, :enrollment_date)";
    
    try {
        $stmt = $db->prepare($query);
        
        // Bind parameters with explicit types for security
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_STR);
        $stmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
        $stmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $stmt->bindParam(':date_of_birth', $dateOfBirth, PDO::PARAM_STR);
        $stmt->bindParam(':address', $address, PDO::PARAM_STR);
        $stmt->bindParam(':course_of_study', $courseOfStudy, PDO::PARAM_STR);
        $stmt->bindParam(':enrollment_date', $enrollmentDate, PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            $newStudentId = $db->lastInsertId();
            Response::success([
                'id' => $newStudentId,
                'student_id' => $studentId,
                'message' => 'Student registered successfully'
            ], "Student registration completed", 201);
        } else {
            Response::error("Failed to register student. Please try again.", 500);
        }
    } catch (PDOException $e) {
        // Log error for debugging (in production, log to file)
        error_log("Database error: " . $e->getMessage());
        Response::error("Database error occurred. Please contact administrator.", 500);
    }
}

/**
 * Update existing student
 */
function handlePut($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        Response::error("Student ID is required");
    }
    
    // Check if student exists
    $checkQuery = "SELECT id FROM students WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        Response::notFound("Student not found");
    }
    
    // Initialize validator
    $validator = new Validator();
    
    // Extract and sanitize inputs
    $firstName = isset($data->first_name) ? $validator->sanitizeString($data->first_name) : '';
    $lastName = isset($data->last_name) ? $validator->sanitizeString($data->last_name) : '';
    $studentId = isset($data->student_id) ? $data->student_id : '';
    $email = isset($data->email) ? $data->email : '';
    $dateOfBirth = isset($data->date_of_birth) ? $data->date_of_birth : '';
    $courseOfStudy = isset($data->course_of_study) ? $validator->sanitizeString($data->course_of_study) : '';
    $enrollmentDate = isset($data->enrollment_date) ? $data->enrollment_date : '';
    $phone = isset($data->phone) ? $data->phone : null;
    $address = isset($data->address) ? $validator->sanitizeString($data->address) : null;
    
    // Validate all fields
    $validator->validateFullName($firstName, $lastName);
    $studentId = $validator->validateStudentId($studentId);
    $email = $validator->validateEmail($email);
    $validator->validateDateOfBirth($dateOfBirth);
    $courseOfStudy = $validator->validateCourseOfStudy($courseOfStudy);
    $validator->validateEnrollmentDate($enrollmentDate);
    $phone = $validator->validatePhone($phone);
    $address = $validator->validateAddress($address);
    
    if (!$validator->isValid()) {
        Response::validationError($validator->getErrors(), "Validation failed. Please check your inputs.");
    }
    
    // Check if student_id already exists (excluding current student)
    $checkIdQuery = "SELECT id FROM students WHERE student_id = :student_id AND id != :current_id LIMIT 1";
    $checkIdStmt = $db->prepare($checkIdQuery);
    $checkIdStmt->bindParam(':student_id', $studentId, PDO::PARAM_STR);
    $checkIdStmt->bindParam(':current_id', $data->id, PDO::PARAM_INT);
    $checkIdStmt->execute();
    
    if ($checkIdStmt->rowCount() > 0) {
        Response::validationError(['student_id' => 'Student ID already exists'], "Duplicate student ID");
    }
    
    // Check if email already exists (excluding current student)
    $checkEmailQuery = "SELECT id FROM students WHERE email = :email AND id != :current_id LIMIT 1";
    $checkEmailStmt = $db->prepare($checkEmailQuery);
    $checkEmailStmt->bindParam(':email', $email, PDO::PARAM_STR);
    $checkEmailStmt->bindParam(':current_id', $data->id, PDO::PARAM_INT);
    $checkEmailStmt->execute();
    
    if ($checkEmailStmt->rowCount() > 0) {
        Response::validationError(['email' => 'Email already exists'], "Duplicate email address");
    }
    
    // Update student using prepared statement
    $query = "UPDATE students SET 
              student_id = :student_id,
              first_name = :first_name,
              last_name = :last_name,
              email = :email,
              phone = :phone,
              date_of_birth = :date_of_birth,
              address = :address,
              course_of_study = :course_of_study,
              enrollment_date = :enrollment_date
              WHERE id = :id";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_STR);
        $stmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
        $stmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $stmt->bindParam(':date_of_birth', $dateOfBirth, PDO::PARAM_STR);
        $stmt->bindParam(':address', $address, PDO::PARAM_STR);
        $stmt->bindParam(':course_of_study', $courseOfStudy, PDO::PARAM_STR);
        $stmt->bindParam(':enrollment_date', $enrollmentDate, PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            // Fetch and return updated student data for real-time UI update
            $fetchQuery = "SELECT id, student_id, first_name, last_name, email, phone, 
                          date_of_birth, address, course_of_study, enrollment_date, 
                          created_at, updated_at 
                          FROM students WHERE id = :id";
            $fetchStmt = $db->prepare($fetchQuery);
            $fetchStmt->bindParam(':id', $data->id, PDO::PARAM_INT);
            $fetchStmt->execute();
            $updatedStudent = $fetchStmt->fetch(PDO::FETCH_ASSOC);
            
            Response::success([
                'student' => $updatedStudent,
                'message' => 'Student updated successfully'
            ], "Student information updated", 200);
        } else {
            Response::error("Failed to update student", 500);
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        Response::error("Database error occurred. Please contact administrator.", 500);
    }
}

/**
 * Delete student (Admin only)
 * Logs deleted record information for recovery tracking
 */
function handleDelete($db) {
    global $currentUser;
    
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        Response::error("Student ID is required");
    }
    
    // Fetch complete student record before deletion for logging
    $fetchQuery = "SELECT id, student_id, first_name, last_name, email, phone, 
                   date_of_birth, address, course_of_study, enrollment_date, 
                   created_at, updated_at 
                   FROM students WHERE id = :id";
    $fetchStmt = $db->prepare($fetchQuery);
    $fetchStmt->bindParam(':id', $data->id, PDO::PARAM_INT);
    $fetchStmt->execute();
    
    if ($fetchStmt->rowCount() === 0) {
        Response::notFound("Student not found");
    }
    
    // Get student data as associative array
    $studentData = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    
    // Initialize logger for recovery tracking
    $logger = new Logger();
    
    // Log deleted student information before deletion
    $deletedBy = $currentUser['email'] ?? 'Unknown Admin';
    $logSuccess = $logger->logDeletedStudent($studentData, $deletedBy);
    
    if (!$logSuccess) {
        error_log("Warning: Failed to log deleted student record for ID: " . $data->id);
        // Continue with deletion even if logging fails
    }
    
    // Delete student using secure prepared statement
    $deleteQuery = "DELETE FROM students WHERE id = :id";
    
    try {
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':id', $data->id, PDO::PARAM_INT);
        
        if ($deleteStmt->execute()) {
            // Verify deletion
            if ($deleteStmt->rowCount() > 0) {
                Response::success([
                    'deleted_student' => [
                        'id' => $studentData['id'],
                        'student_id' => $studentData['student_id'],
                        'name' => $studentData['first_name'] . ' ' . $studentData['last_name']
                    ],
                    'logged' => $logSuccess,
                    'message' => 'Student record deleted and logged for recovery tracking'
                ], "Student deleted successfully", 200);
            } else {
                Response::error("Failed to delete student. Record may have been already deleted.", 500);
            }
        } else {
            Response::error("Failed to delete student", 500);
        }
    } catch (PDOException $e) {
        error_log("Database error during deletion: " . $e->getMessage());
        Response::error("Database error occurred. Please contact administrator.", 500);
    }
}
