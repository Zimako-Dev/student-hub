<?php
/**
 * Registrations API Endpoint
 * Handles course registrations
 */

require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Require authentication for all requests
Auth::requireAuth();

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
    default:
        Response::error("Method not allowed", 405);
}

/**
 * Get all registrations with student and course details
 */
function handleGet($db) {
    $query = "SELECT 
                r.id,
                r.student_id,
                r.course_id,
                r.registered_at,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.email as student_email,
                c.code as course_code,
                c.name as course_name,
                c.credits
              FROM registrations r
              INNER JOIN students s ON r.student_id = s.id
              INNER JOIN courses c ON r.course_id = c.id
              ORDER BY r.registered_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $registrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    Response::success($registrations);
}

/**
 * Create new registration
 */
function handlePost($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    // Validate required fields
    $errors = [];
    if (empty($data->student_id)) $errors['student_id'] = 'Student ID is required';
    if (empty($data->course_id)) $errors['course_id'] = 'Course ID is required';
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Check if student exists
    $studentCheck = "SELECT id FROM students WHERE id = :student_id";
    $studentStmt = $db->prepare($studentCheck);
    $studentStmt->bindParam(':student_id', $data->student_id);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        Response::error("Student not found", 404);
    }
    
    // Check if course exists
    $courseCheck = "SELECT id FROM courses WHERE id = :course_id";
    $courseStmt = $db->prepare($courseCheck);
    $courseStmt->bindParam(':course_id', $data->course_id);
    $courseStmt->execute();
    
    if ($courseStmt->rowCount() === 0) {
        Response::error("Course not found", 404);
    }
    
    // Check if registration already exists
    $duplicateCheck = "SELECT id FROM registrations 
                       WHERE student_id = :student_id AND course_id = :course_id";
    $duplicateStmt = $db->prepare($duplicateCheck);
    $duplicateStmt->bindParam(':student_id', $data->student_id);
    $duplicateStmt->bindParam(':course_id', $data->course_id);
    $duplicateStmt->execute();
    
    if ($duplicateStmt->rowCount() > 0) {
        Response::validationError(['course_id' => 'Student is already registered for this course']);
    }
    
    // Insert registration
    $query = "INSERT INTO registrations (student_id, course_id) VALUES (:student_id, :course_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $data->student_id);
    $stmt->bindParam(':course_id', $data->course_id);
    
    if ($stmt->execute()) {
        $registrationId = $db->lastInsertId();
        Response::success(['id' => $registrationId], "Registration successful", 201);
    } else {
        Response::error("Failed to create registration", 500);
    }
}
