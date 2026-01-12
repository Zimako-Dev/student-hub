<?php
/**
 * Students API Endpoint
 * Handles CRUD operations for students
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
 * Get all students or single student by ID
 */
function handleGet($db) {
    if (isset($_GET['id'])) {
        $query = "SELECT * FROM students WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $_GET['id']);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            Response::notFound("Student not found");
        }
        
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        Response::success($student);
    } else {
        $query = "SELECT * FROM students ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($students);
    }
}

/**
 * Create new student
 */
function handlePost($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    // Validate required fields
    $errors = [];
    if (empty($data->first_name)) $errors['first_name'] = 'First name is required';
    if (empty($data->last_name)) $errors['last_name'] = 'Last name is required';
    if (empty($data->email)) $errors['email'] = 'Email is required';
    
    if (!empty($errors)) {
        Response::validationError($errors);
    }
    
    // Check if email already exists
    $checkQuery = "SELECT id FROM students WHERE email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':email', $data->email);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        Response::validationError(['email' => 'Email already exists']);
    }
    
    // Insert student
    $query = "INSERT INTO students (first_name, last_name, email, phone, date_of_birth, address) 
              VALUES (:first_name, :last_name, :email, :phone, :date_of_birth, :address)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':first_name', $data->first_name);
    $stmt->bindParam(':last_name', $data->last_name);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':phone', $data->phone);
    $stmt->bindParam(':date_of_birth', $data->date_of_birth);
    $stmt->bindParam(':address', $data->address);
    
    if ($stmt->execute()) {
        $studentId = $db->lastInsertId();
        Response::success(['id' => $studentId], "Student created successfully", 201);
    } else {
        Response::error("Failed to create student", 500);
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
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        Response::notFound("Student not found");
    }
    
    // Update student
    $query = "UPDATE students SET 
              first_name = :first_name,
              last_name = :last_name,
              email = :email,
              phone = :phone,
              date_of_birth = :date_of_birth,
              address = :address
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':first_name', $data->first_name);
    $stmt->bindParam(':last_name', $data->last_name);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':phone', $data->phone);
    $stmt->bindParam(':date_of_birth', $data->date_of_birth);
    $stmt->bindParam(':address', $data->address);
    
    if ($stmt->execute()) {
        Response::success(null, "Student updated successfully");
    } else {
        Response::error("Failed to update student", 500);
    }
}

/**
 * Delete student
 */
function handleDelete($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (empty($data->id)) {
        Response::error("Student ID is required");
    }
    
    // Check if student exists
    $checkQuery = "SELECT id FROM students WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $data->id);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        Response::notFound("Student not found");
    }
    
    // Delete student
    $query = "DELETE FROM students WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $data->id);
    
    if ($stmt->execute()) {
        Response::success(null, "Student deleted successfully");
    } else {
        Response::error("Failed to delete student", 500);
    }
}
