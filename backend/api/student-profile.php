<?php
/**
 * Student Profile API Endpoint
 * Handles student profile retrieval and report generation
 * Student role only access
 */

require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../utils/Response.php';
require_once '../utils/Auth.php';

// Require authentication
$currentUser = Auth::requireAuth();

// Check if user is a student
if ($currentUser['role'] !== 'student') {
    Response::error("Student access required", 403);
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
        handleGet($db, $currentUser);
        break;
    default:
        Response::error("Method not allowed", 405);
}

/**
 * Get student profile by logged-in user's email
 */
function handleGet($db, $currentUser) {
    $action = isset($_GET['action']) ? $_GET['action'] : 'profile';
    
    // Get student record by email
    $query = "SELECT id, student_id, first_name, last_name, email, phone, 
              date_of_birth, address, course_of_study, enrollment_date, 
              created_at, updated_at 
              FROM students WHERE email = :email";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $currentUser['email'], PDO::PARAM_STR);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            Response::error("Student profile not found", 404);
        }
        
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get enrolled courses with registration metadata
        $coursesQuery = "SELECT c.id, c.code, c.name, c.credits, c.instructor, c.description,
                         r.id as registration_id, r.registered_at
                         FROM courses c
                         INNER JOIN registrations r ON c.id = r.course_id
                         INNER JOIN students s ON r.student_id = s.id
                         WHERE s.email = :email
                         ORDER BY r.registered_at DESC";
        
        $coursesStmt = $db->prepare($coursesQuery);
        $coursesStmt->bindParam(':email', $currentUser['email'], PDO::PARAM_STR);
        $coursesStmt->execute();
        $courses = $coursesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Build registration metadata for confirmation slip
        $registrations = [];
        foreach ($courses as $course) {
            $registrations[] = [
                'registration_id' => $course['registration_id'],
                'course_code' => $course['code'],
                'course_name' => $course['name'],
                'credits' => $course['credits'],
                'instructor' => $course['instructor'],
                'registered_at' => $course['registered_at'],
                'status' => 'Active' // Can be: Active, Pending, Completed, Withdrawn
            ];
        }
        
        // Calculate registration summary
        $registrationSummary = [
            'total_courses' => count($courses),
            'total_credits' => array_sum(array_column($courses, 'credits')),
            'first_registration' => count($courses) > 0 ? end($courses)['registered_at'] : null,
            'last_registration' => count($courses) > 0 ? $courses[0]['registered_at'] : null,
            'overall_status' => count($courses) > 0 ? 'Active' : 'No Registrations'
        ];
        
        switch ($action) {
            case 'report':
                // Generate printable HTML report
                generateProfileReport($student, $courses);
                break;
            case 'download':
                // Generate downloadable report
                generateDownloadableReport($student, $courses);
                break;
            case 'registration-slip':
                // Generate registration confirmation slip
                generateRegistrationSlip($student, $registrations, $registrationSummary);
                break;
            default:
                // Return JSON profile data
                Response::success([
                    'profile' => $student,
                    'courses' => $courses,
                    'registrations' => $registrations,
                    'registration_summary' => $registrationSummary,
                    'total_credits' => array_sum(array_column($courses, 'credits'))
                ]);
        }
        
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        Response::error("Database error occurred", 500);
    }
}

/**
 * Generate printable HTML profile report
 */
function generateProfileReport($student, $courses) {
    // Set content type to HTML
    header('Content-Type: text/html; charset=utf-8');
    
    $fullName = htmlspecialchars($student['first_name'] . ' ' . $student['last_name']);
    $studentId = htmlspecialchars($student['student_id']);
    $email = htmlspecialchars($student['email']);
    $dob = htmlspecialchars($student['date_of_birth']);
    $course = htmlspecialchars($student['course_of_study']);
    $enrollmentDate = htmlspecialchars($student['enrollment_date']);
    $phone = htmlspecialchars($student['phone'] ?? 'N/A');
    $address = htmlspecialchars($student['address'] ?? 'N/A');
    $generatedAt = date('F j, Y \a\t g:i A');
    $totalCredits = array_sum(array_column($courses, 'credits'));
    
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Profile Report - {$fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .report-header h1 {
            font-size: 1.8rem;
            margin-bottom: 5px;
        }
        .report-header p {
            opacity: 0.9;
            font-size: 0.95rem;
        }
        .logo {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .report-body {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1.2rem;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
            margin-bottom: 20px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        .info-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .info-label {
            font-size: 0.85rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
        }
        .courses-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .courses-table th,
        .courses-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .courses-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }
        .courses-table tr:hover {
            background: #f8f9fa;
        }
        .report-footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 0.85rem;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: #667eea;
            color: white;
            border-radius: 20px;
            font-size: 0.85rem;
        }
        .print-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 15px 30px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        }
        .print-btn:hover {
            background: #5a6fd6;
            transform: translateY(-2px);
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .report-container {
                box-shadow: none;
            }
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <div class="logo">🎓</div>
            <h1>Student Profile Summary Report</h1>
            <p>AcademiX Student Management System</p>
        </div>
        
        <div class="report-body">
            <div class="section">
                <h2 class="section-title">📋 Personal Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">{$fullName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Student ID</div>
                        <div class="info-value">{$studentId}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Email Address</div>
                        <div class="info-value">{$email}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Date of Birth</div>
                        <div class="info-value">{$dob}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Phone Number</div>
                        <div class="info-value">{$phone}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Address</div>
                        <div class="info-value">{$address}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2 class="section-title">🎓 Academic Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Course of Study</div>
                        <div class="info-value">{$course}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Enrollment Date</div>
                        <div class="info-value">{$enrollmentDate}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Credits</div>
                        <div class="info-value">{$totalCredits} Credits</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value"><span class="badge">Active</span></div>
                    </div>
                </div>
            </div>
HTML;

    if (count($courses) > 0) {
        echo <<<HTML
            <div class="section">
                <h2 class="section-title">📚 Enrolled Courses</h2>
                <table class="courses-table">
                    <thead>
                        <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Instructor</th>
                            <th>Credits</th>
                        </tr>
                    </thead>
                    <tbody>
HTML;
        foreach ($courses as $c) {
            $code = htmlspecialchars($c['code']);
            $name = htmlspecialchars($c['name']);
            $instructor = htmlspecialchars($c['instructor']);
            $credits = htmlspecialchars($c['credits']);
            echo "<tr><td>{$code}</td><td>{$name}</td><td>{$instructor}</td><td>{$credits}</td></tr>";
        }
        echo <<<HTML
                    </tbody>
                </table>
            </div>
HTML;
    }

    echo <<<HTML
        </div>
        
        <div class="report-footer">
            <p><strong>Report Generated:</strong> {$generatedAt}</p>
            <p>This is an official document from AcademiX Student Management System</p>
            <p>© 2026 AcademiX. All rights reserved.</p>
        </div>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
</body>
</html>
HTML;
    exit;
}

/**
 * Generate downloadable HTML report
 */
function generateDownloadableReport($student, $courses) {
    $fullName = $student['first_name'] . '_' . $student['last_name'];
    $filename = "Profile_Report_{$fullName}_" . date('Y-m-d') . ".html";
    
    // Set headers for download
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    // Generate the same report but as download
    generateProfileReport($student, $courses);
}

/**
 * Generate Registration Confirmation Slip
 */
function generateRegistrationSlip($student, $registrations, $summary) {
    header('Content-Type: text/html; charset=utf-8');
    
    $fullName = htmlspecialchars($student['first_name'] . ' ' . $student['last_name']);
    $studentId = htmlspecialchars($student['student_id']);
    $email = htmlspecialchars($student['email']);
    $course = htmlspecialchars($student['course_of_study']);
    $generatedAt = date('F j, Y \a\t g:i A');
    $slipNumber = 'REG-' . date('Ymd') . '-' . str_pad($student['id'], 4, '0', STR_PAD_LEFT);
    
    $totalCourses = $summary['total_courses'];
    $totalCredits = $summary['total_credits'];
    $overallStatus = $summary['overall_status'];
    $statusClass = $overallStatus === 'Active' ? 'active' : 'pending';
    
    echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmation Slip - {$fullName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f0f2f5; 
            padding: 20px;
            line-height: 1.6;
        }
        .slip-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .slip-header {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        .slip-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px);
        }
        .slip-logo { font-size: 2.5rem; margin-bottom: 10px; }
        .slip-title { font-size: 1.6rem; font-weight: 700; margin-bottom: 5px; }
        .slip-subtitle { opacity: 0.9; font-size: 1rem; }
        .slip-number {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .slip-body { padding: 30px; }
        .student-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 25px;
        }
        .info-item { }
        .info-label { font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .info-value { font-size: 1.05rem; font-weight: 600; color: #333; }
        .section-title {
            font-size: 1.1rem;
            color: #11998e;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #11998e;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 25px;
        }
        .summary-card {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            color: white;
        }
        .summary-card.status {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .summary-card.status.pending {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .summary-value { font-size: 1.8rem; font-weight: 700; }
        .summary-label { font-size: 0.85rem; opacity: 0.9; margin-top: 5px; }
        .registrations-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .registrations-table th,
        .registrations-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        .registrations-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
            font-size: 0.85rem;
            text-transform: uppercase;
        }
        .registrations-table tr:hover { background: #f8f9fa; }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .status-badge.active { background: #d4edda; color: #155724; }
        .status-badge.pending { background: #fff3cd; color: #856404; }
        .status-badge.completed { background: #cce5ff; color: #004085; }
        .slip-footer {
            background: #f8f9fa;
            padding: 20px 30px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .footer-info { font-size: 0.85rem; color: #666; }
        .footer-info strong { color: #333; }
        .verification-code {
            font-family: monospace;
            background: #e9ecef;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .action-buttons {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            gap: 10px;
        }
        .action-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        .action-btn:hover { transform: translateY(-2px); }
        .print-btn { background: #11998e; color: white; }
        .download-btn { background: #667eea; color: white; }
        @media print {
            body { background: white; padding: 0; }
            .slip-container { box-shadow: none; }
            .action-buttons { display: none; }
        }
        @media (max-width: 768px) {
            .student-info, .summary-cards { grid-template-columns: 1fr; }
            .slip-number { position: static; margin-top: 15px; display: inline-block; }
        }
    </style>
</head>
<body>
    <div class="slip-container">
        <div class="slip-header">
            <div class="slip-logo">📋</div>
            <h1 class="slip-title">Registration Confirmation Slip</h1>
            <p class="slip-subtitle">AcademiX Student Management System</p>
            <div class="slip-number">{$slipNumber}</div>
        </div>
        
        <div class="slip-body">
            <h2 class="section-title">👤 Student Information</h2>
            <div class="student-info">
                <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">{$fullName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Student ID</div>
                    <div class="info-value">{$studentId}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">{$email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Program</div>
                    <div class="info-value">{$course}</div>
                </div>
            </div>
            
            <h2 class="section-title">📊 Registration Summary</h2>
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-value">{$totalCourses}</div>
                    <div class="summary-label">Courses Enrolled</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">{$totalCredits}</div>
                    <div class="summary-label">Total Credits</div>
                </div>
                <div class="summary-card status {$statusClass}">
                    <div class="summary-value">{$overallStatus}</div>
                    <div class="summary-label">Registration Status</div>
                </div>
            </div>
            
            <h2 class="section-title">📚 Course Registrations</h2>
            <table class="registrations-table">
                <thead>
                    <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Registered On</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
HTML;

    foreach ($registrations as $reg) {
        $code = htmlspecialchars($reg['course_code']);
        $name = htmlspecialchars($reg['course_name']);
        $credits = htmlspecialchars($reg['credits']);
        $registeredAt = date('M j, Y', strtotime($reg['registered_at']));
        $status = htmlspecialchars($reg['status']);
        $statusLower = strtolower($status);
        
        echo "<tr>";
        echo "<td><strong>{$code}</strong></td>";
        echo "<td>{$name}</td>";
        echo "<td>{$credits}</td>";
        echo "<td>{$registeredAt}</td>";
        echo "<td><span class='status-badge {$statusLower}'>{$status}</span></td>";
        echo "</tr>";
    }

    $verificationCode = strtoupper(substr(md5($student['student_id'] . date('Ymd')), 0, 12));

    echo <<<HTML
                </tbody>
            </table>
        </div>
        
        <div class="slip-footer">
            <div class="footer-info">
                <p><strong>Generated:</strong> {$generatedAt}</p>
                <p>This is an official registration confirmation from AcademiX</p>
            </div>
            <div class="verification-code">
                Verification: {$verificationCode}
            </div>
        </div>
    </div>
    
    <div class="action-buttons">
        <button class="action-btn print-btn" onclick="window.print()">🖨️ Print</button>
        <button class="action-btn download-btn" onclick="downloadAsPDF()">📥 Download PDF</button>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
        function downloadAsPDF() {
            const element = document.querySelector('.slip-container');
            const opt = {
                margin: 10,
                filename: 'Registration_Slip_{$studentId}_{$slipNumber}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }
    </script>
</body>
</html>
HTML;
    exit;
}
