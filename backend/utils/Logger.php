<?php
/**
 * Logger Utility Class
 * Handles file-based logging for audit trails and recovery tracking
 */

class Logger {
    private $logDirectory;
    private $deletedStudentsLog;
    
    /**
     * Constructor - Initialize log directory and file paths
     */
    public function __construct() {
        $this->logDirectory = dirname(__DIR__) . '/logs';
        $this->deletedStudentsLog = $this->logDirectory . '/deleted_students.log';
        
        // Create logs directory if it doesn't exist
        if (!file_exists($this->logDirectory)) {
            mkdir($this->logDirectory, 0755, true);
        }
        
        // Create log file if it doesn't exist
        if (!file_exists($this->deletedStudentsLog)) {
            touch($this->deletedStudentsLog);
            chmod($this->deletedStudentsLog, 0644);
        }
    }
    
    /**
     * Log deleted student record for recovery tracking
     * @param array $studentData - Student information to log
     * @param string $deletedBy - Admin user who performed deletion
     * @return bool - Success status
     */
    public function logDeletedStudent($studentData, $deletedBy = 'Unknown') {
        try {
            // Prepare log entry with timestamp
            $timestamp = date('Y-m-d H:i:s');
            $logEntry = [
                'timestamp' => $timestamp,
                'deleted_by' => $deletedBy,
                'student_data' => $studentData
            ];
            
            // Format log entry as JSON for easy parsing
            $logLine = json_encode($logEntry, JSON_PRETTY_PRINT) . "\n" . str_repeat('-', 80) . "\n";
            
            // Append to log file using file_put_contents with FILE_APPEND flag
            $result = file_put_contents(
                $this->deletedStudentsLog,
                $logLine,
                FILE_APPEND | LOCK_EX  // LOCK_EX for exclusive lock during write
            );
            
            if ($result === false) {
                error_log("Failed to write to deleted students log");
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Logger error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Read deleted students log
     * @param int $limit - Number of recent entries to retrieve
     * @return array - Array of deleted student records
     */
    public function getDeletedStudents($limit = 50) {
        if (!file_exists($this->deletedStudentsLog)) {
            return [];
        }
        
        try {
            // Read entire log file
            $content = file_get_contents($this->deletedStudentsLog);
            
            if ($content === false) {
                return [];
            }
            
            // Split by separator
            $entries = explode(str_repeat('-', 80), $content);
            $deletedStudents = [];
            
            // Parse JSON entries
            foreach ($entries as $entry) {
                $entry = trim($entry);
                if (!empty($entry)) {
                    $decoded = json_decode($entry, true);
                    if ($decoded !== null) {
                        $deletedStudents[] = $decoded;
                    }
                }
            }
            
            // Return most recent entries (reverse order)
            return array_slice(array_reverse($deletedStudents), 0, $limit);
        } catch (Exception $e) {
            error_log("Error reading deleted students log: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get log file path
     * @return string - Path to deleted students log file
     */
    public function getLogFilePath() {
        return $this->deletedStudentsLog;
    }
    
    /**
     * Get log file size
     * @return int - File size in bytes
     */
    public function getLogFileSize() {
        if (file_exists($this->deletedStudentsLog)) {
            return filesize($this->deletedStudentsLog);
        }
        return 0;
    }
    
    /**
     * Clear old log entries (keep last N days)
     * @param int $daysToKeep - Number of days to retain
     * @return bool - Success status
     */
    public function cleanOldLogs($daysToKeep = 90) {
        if (!file_exists($this->deletedStudentsLog)) {
            return true;
        }
        
        try {
            $cutoffDate = strtotime("-{$daysToKeep} days");
            $entries = $this->getDeletedStudents(PHP_INT_MAX);
            $keptEntries = [];
            
            foreach ($entries as $entry) {
                $entryTimestamp = strtotime($entry['timestamp']);
                if ($entryTimestamp >= $cutoffDate) {
                    $keptEntries[] = $entry;
                }
            }
            
            // Rewrite log file with kept entries
            $newContent = '';
            foreach ($keptEntries as $entry) {
                $newContent .= json_encode($entry, JSON_PRETTY_PRINT) . "\n" . str_repeat('-', 80) . "\n";
            }
            
            return file_put_contents($this->deletedStudentsLog, $newContent, LOCK_EX) !== false;
        } catch (Exception $e) {
            error_log("Error cleaning old logs: " . $e->getMessage());
            return false;
        }
    }
}
