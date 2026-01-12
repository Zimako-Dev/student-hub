<?php
/**
 * Authentication Utility Class
 * Handles JWT token generation and validation
 */

class Auth {
    private static $secret_key = "your-secret-key-change-this-in-production";
    private static $algorithm = 'HS256';

    /**
     * Generate JWT token
     */
    public static function generateToken($userId, $email, $role) {
        $issuedAt = time();
        $expire = $issuedAt + (60 * 60 * 24); // 24 hours

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expire,
            'user_id' => $userId,
            'email' => $email,
            'role' => $role
        ];

        return self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => self::$algorithm])) . '.' .
               self::base64UrlEncode(json_encode($payload)) . '.' .
               self::base64UrlEncode(hash_hmac('sha256', 
                   self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => self::$algorithm])) . '.' .
                   self::base64UrlEncode(json_encode($payload)), 
                   self::$secret_key, true));
    }

    /**
     * Validate JWT token
     */
    public static function validateToken() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            return false;
        }

        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        $validSignature = self::base64UrlEncode(hash_hmac('sha256', 
            $header . '.' . $payload, 
            self::$secret_key, true));

        if ($signature !== $validSignature) {
            return false;
        }

        $payloadData = json_decode(self::base64UrlDecode($payload), true);

        if ($payloadData['exp'] < time()) {
            return false;
        }

        return $payloadData;
    }

    /**
     * Get current user from token
     */
    public static function getCurrentUser() {
        return self::validateToken();
    }

    /**
     * Require authentication
     */
    public static function requireAuth() {
        $user = self::validateToken();
        if (!$user) {
            Response::unauthorized("Authentication required");
        }
        return $user;
    }

    /**
     * Base64 URL encode
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     */
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
