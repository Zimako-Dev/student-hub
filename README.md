# 🎓 AcademiX - Student Hub

A comprehensive Student Registration and Academic Management System built with React (Vite) and PHP/MySQL backend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![PHP](https://img.shields.io/badge/PHP-8.x-777bb4.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479a1.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Security](#-security)

---

## ✨ Features

### 🔐 Authentication & Authorization (RBAC)
- **Role-Based Access Control** - Admin and Student roles
- **JWT Authentication** - Secure token-based authentication
- **Protected Routes** - Role-specific page access

### 👨‍💼 Admin Features
- **Dashboard** - Overview statistics and quick actions
- **Student Management** - Full CRUD operations with validation
- **Course Management** - Create, update, delete courses
- **Registration Management** - Enroll students in courses
- **Sort/Search/Filter** - Advanced data table functionality using PHP arrays and JavaScript

### 🎓 Student Features
- **Student Dashboard** - Personal profile view
- **Profile Summary Report** - Auto-generated printable/downloadable report containing:
  - Name, ID, Email, DOB, Course, Enrollment Date
- **Registration Confirmation Slip** - Official registration document with:
  - Registration timestamps
  - Course summary
  - Status (Active, Pending, etc.)
  - PDF download option using jsPDF

### 📊 Reports
- **Profile Summary Report** - PHP-generated printable HTML/PDF report
- **Registration Confirmation Slip** - Official document with verification code
- **PDF Export** - Download reports as PDF

### 🔒 Security Features
- **PHP Error Handling** - Try-catch blocks for exception management
- **Prepared Statements** - SQL injection prevention with PDO
- **Input Validation** - PHP string manipulation and conditionals
- **XSS Prevention** - htmlspecialchars() sanitization
- **Audit Logging** - Deleted records logged for recovery tracking

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| JavaScript (ES6+) | Programming Language |
| CSS3 | Styling (Material Design) |
| jsPDF | PDF Generation |

### Backend
| Technology | Purpose |
|------------|---------|
| PHP 8.x | Server-side Logic |
| MySQL 8.x | Database |
| PDO | Database Abstraction |
| JWT | Authentication |

---

## 📁 Project Structure

```
student-hub/
├── backend/
│   ├── api/
│   │   ├── login.php           # Authentication endpoint
│   │   ├── students.php        # Students CRUD API
│   │   ├── courses.php         # Courses CRUD API
│   │   ├── registrations.php   # Registrations API
│   │   └── student-profile.php # Student profile & reports
│   ├── config/
│   │   ├── database.php        # Database connection
│   │   └── cors.php            # CORS configuration
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   └── update_schema.sql   # Schema updates
│   ├── logs/
│   │   └── deleted_students.log # Audit log
│   └── utils/
│       ├── Auth.php            # JWT authentication
│       ├── Response.php        # API response helper
│       ├── Validator.php       # Input validation
│       └── Logger.php          # File logging utility
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.jsx
│   │   ├── Modal.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx       # Admin dashboard
│   │   ├── StudentDashboard.jsx # Student dashboard
│   │   ├── StudentsPage.jsx    # Student management
│   │   ├── CoursesPage.jsx     # Course management
│   │   ├── RegistrationsPage.jsx
│   │   └── LoginPage.jsx
│   ├── services/
│   │   └── api.js              # API service module
│   ├── styles/                 # CSS stylesheets
│   ├── App.jsx                 # Main application
│   └── main.jsx                # Entry point
├── .env.example                # Environment template
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm
- PHP 8.0+
- MySQL 8.0+
- Apache/Nginx web server (or PHP built-in server)

### Frontend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/student-hub.git
cd student-hub

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create database
mysql -u root -p < database/schema.sql

# Configure database connection
# Edit backend/config/database.php with your credentials

# Start PHP server (for development)
php -S localhost:8000
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost/backend/api
```

### Database Configuration

Edit `backend/config/database.php`:

```php
private $host = "localhost";
private $db_name = "student_hub";
private $username = "root";
private $password = "your_password";
```

---

## 📖 Usage

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@academix.com | admin123 |
| **Student** | john.doe@example.com | student123 |
| **Student** | jane.smith@example.com | student123 |
| **Student** | mike.johnson@example.com | student123 |

### Admin Workflow
1. Login with admin credentials
2. View dashboard statistics
3. Manage students (Add, Edit, Delete with confirmation)
4. Manage courses
5. Register students for courses
6. Use sort/search/filter on data tables

### Student Workflow
1. Login with student credentials
2. View personal dashboard with profile information
3. See enrolled courses and credits
4. Generate and view Profile Summary Report
5. Download Registration Confirmation Slip as PDF

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login.php` | User login |

### Students API (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students.php` | Get all students |
| GET | `/api/students.php?id={id}` | Get single student |
| POST | `/api/students.php` | Create student |
| PUT | `/api/students.php` | Update student |
| DELETE | `/api/students.php` | Delete student |

**Query Parameters:**
- `search` - Search by name, email, or student ID
- `course` - Filter by course of study
- `year` - Filter by enrollment year
- `sort` - Sort field (first_name, last_name, email, enrollment_date, etc.)
- `order` - Sort order (asc, desc)

### Student Profile API (Student Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student-profile.php` | Get profile data (JSON) |
| GET | `/api/student-profile.php?action=report` | View profile report (HTML) |
| GET | `/api/student-profile.php?action=download` | Download report (HTML file) |
| GET | `/api/student-profile.php?action=registration-slip` | View registration slip |

---

## 🔒 Security

### Implemented Security Measures

#### 1. PHP Error Handling
```php
try {
    $stmt = $db->prepare($query);
    $stmt->execute();
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    Response::error("Database error occurred", 500);
}
```

#### 2. Prepared Statements (SQL Injection Prevention)
```php
$query = "SELECT * FROM students WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();
```

#### 3. Input Validation (PHP String Functions)
- `strlen()` - Length validation
- `trim()` - Whitespace removal
- `filter_var()` - Email validation
- `preg_match()` - Pattern matching
- `htmlspecialchars()` - XSS prevention

#### 4. Additional Security
- JWT authentication with token expiration
- Role-based access control (RBAC)
- CORS configuration
- Audit logging for deleted records
- Password hashing with bcrypt

---

## 🎯 Key Implementation Details

### PHP Arrays for Data Processing
- `fetchAll(PDO::FETCH_ASSOC)` - Returns student data as arrays
- `foreach` loops for iteration
- `arsort()` for sorting statistics
- `array_column()` for extracting values
- `in_array()` for validation

### JavaScript Array Methods
- `.filter()` - Client-side filtering
- `.sort()` - Client-side sorting
- `.map()` - Rendering lists
- `.includes()` - Search matching

### Student Update Flow
1. Pre-filled HTML form with current data
2. Frontend + Backend validation
3. Secure MySQL UPDATE with prepared statements
4. Real-time UI update without page refresh

### Delete with Recovery Tracking
1. JavaScript confirmation dialogue
2. Secure DELETE SQL statement
3. PHP file logging (`deleted_students.log`)
4. Real-time UI removal

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ using React, PHP, and MySQL**
