<?php
/**
 * Courses API Endpoint
 * Handles CRUD operations for courses
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
 * Get all courses or single course by ID
 */
function handleGet($db) {
    if (isset($_GET['id'])) {
        $query = "SELECT * FROM courses WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            Response::notFound("Course not found");
        }
        
        $course = $stmt->fetch(PDO::FETCH_ASSOC);
        Response::success($course);
    } else {
        $query = "SELECT * FROM courses ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($courses);
    }
}

/**
 * Create new course
 */
function handlePost($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    // Validate required fields
    $errors = [];
    if (empty($data->code)) $errors['code'] = 'Course code is required';
    if (empty($data->name)) $errors['name'] = 'Course name is required';
    if (empty($data->credits)) $errors['credits'] = 'Credits are required';
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Check if course code already exists
    $checkQuery = "SELECT id FROM courses WHERE code = :code";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':code', $data->code);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        Response::validationError(['code' => 'Course code already exists']);
    }
    
    // Insert course
    $query = "INSERT INTO courses (code, name, description, credits, instructor, capacity) 
              VALUES (:code, :name, :description, :credits, :instructor, :capacity)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $data->code);
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':description', $data->description);
    $stmt->bindParam(':credits', $data->credits);
    $stmt->bindParam(':instructor', $data->instructor);
    $stmt->bindParam(':capacity', $data->capacity);
    
    if ($stmt->execute()) {
        $courseId = $db->lastInsertId();
        Response::success(['id' => $courseId], "Course created successfully", 201);
    } else {
        Response::error("Failed to create course", 500);
    }
}

/**
 * Update existing course
 */
function handlePut($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        Response::error("Course ID is required");
    }
    
    // Check if course exists
    $checkQuery = "SELECT id FROM courses WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        Response::notFound("Course not found");
    }
    
    // Update course
    $query = "UPDATE courses SET 
              code = :code,
              name = :name,
              description = :description,
              credits = :credits,
              instructor = :instructor,
              capacity = :capacity
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':code', $data->code);
    $stmt->bindParam(':name', $data->name);
    $stmt->bindParam(':description', $data->description);
    $stmt->bindParam(':credits', $data->credits);
    $stmt->bindParam(':instructor', $data->instructor);
    $stmt->bindParam(':capacity', $data->capacity);
    
    if ($stmt->execute()) {
        Response::success(null, "Course updated successfully");
    } else {
        Response::error("Failed to update course", 500);
    }
}

/**
 * Delete course
 */
function handleDelete($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        Response::error("Course ID is required");
    }
    
    // Check if course exists
    $checkQuery = "SELECT id FROM courses WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        Response::notFound("Course not found");
    }
    
    // Delete course
    $query = "DELETE FROM courses WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    
    if ($stmt->execute()) {
        Response::success(null, "Course deleted successfully");
    } else {
        Response::error("Failed to delete course", 500);
    }
}
