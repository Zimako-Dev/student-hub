<?php
/**
 * Response Utility Class
 * Standardizes API responses
 */

class Response {
    /**
     * Send success response
     */
    public static function success($data = null, $message = "Success", $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode([
            "success" => true,
            "message" => $message,
            "data" => $data
        ]);
        exit();
    }

    /**
     * Send error response
     */
    public static function error($message = "An error occurred", $statusCode = 400, $errors = null) {
        http_response_code($statusCode);
        echo json_encode([
            "success" => false,
            "message" => $message,
            "errors" => $errors
        ]);
        exit();
    }

    /**
     * Send unauthorized response
     */
    public static function unauthorized($message = "Unauthorized access") {
        self::error($message, 401);
    }

    /**
     * Send not found response
     */
    public static function notFound($message = "Resource not found") {
        self::error($message, 404);
    }

    /**
     * Send validation error response
     */
    public static function validationError($errors, $message = "Validation failed") {
        self::error($message, 422, $errors);
    }
}
