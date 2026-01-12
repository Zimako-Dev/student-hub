<?php
/**
 * Login API Endpoint
 * Handles user authentication
 */

require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error("Method not allowed", 405);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (empty($data->email) || empty($data->password)) {
    Response::validationError([
        'email' => empty($data->email) ? 'Email is required' : null,
        'password' => empty($data->password) ? 'Password is required' : null
    ]);
}

// Connect to database
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    Response::error("Database connection failed", 500);
}

// Query user
$query = "SELECT id, email, password, role FROM users WHERE email = :email LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $data->email);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    Response::error("Invalid email or password", 401);
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Verify password
if (!password_verify($data->password, $user['password'])) {
    Response::error("Invalid email or password", 401);
}

// Generate token
$token = Auth::generateToken($user['id'], $user['email'], $user['role']);

// Return success response
Response::success([
    'token' => $token,
    'user' => [
        'id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
], "Login successful");
