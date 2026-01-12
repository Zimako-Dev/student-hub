# Student Hub - PHP Backend API

This is the backend API for the Student Hub application, built with PHP and MySQL.

## Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- PHP PDO extension enabled

## Installation & Setup

### 1. Install XAMPP/WAMP/MAMP (if not already installed)

Download and install one of these local server environments:
- **XAMPP**: https://www.apachefriends.org/
- **WAMP**: https://www.wampserver.com/
- **MAMP**: https://www.mamp.info/

### 2. Database Setup

1. Start your MySQL server (via XAMPP/WAMP/MAMP control panel)
2. Open phpMyAdmin (usually at `http://localhost/phpmyadmin`)
3. Import the database schema:
   - Click "Import" tab
   - Choose file: `backend/database/schema.sql`
   - Click "Go" to execute

This will create:
- Database: `student_hub`
- Tables: `users`, `students`, `courses`, `registrations`
- Sample data for testing

### 3. Configure Database Connection

Edit `backend/config/database.php` with your MySQL credentials:

```php
private $host = "localhost";
private $db_name = "student_hub";
private $username = "root";        // Your MySQL username
private $password = "";            // Your MySQL password
```

### 4. Deploy Backend Files

#### Option A: Using XAMPP
Copy the `backend` folder to: `C:\xampp\htdocs\backend`

#### Option B: Using WAMP
Copy the `backend` folder to: `C:\wamp64\www\backend`

#### Option C: Using MAMP
Copy the `backend` folder to: `/Applications/MAMP/htdocs/backend`

### 5. Test the API

Start your web server and test the API:

**Test endpoint**: `http://localhost/backend/api/login.php`

You can use Postman, Insomnia, or curl:

```bash
curl -X POST http://localhost/backend/api/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@academix.com","password":"admin123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@academix.com",
      "role": "admin"
    }
  }
}
```

## API Endpoints

### Authentication

**POST** `/api/login.php`
- Body: `{ "email": "string", "password": "string" }`
- Returns: JWT token and user info

### Students

**GET** `/api/students.php` - Get all students
**GET** `/api/students.php?id=1` - Get single student
**POST** `/api/students.php` - Create student
**PUT** `/api/students.php` - Update student
**DELETE** `/api/students.php` - Delete student

### Courses

**GET** `/api/courses.php` - Get all courses
**GET** `/api/courses.php?id=1` - Get single course
**POST** `/api/courses.php` - Create course
**PUT** `/api/courses.php` - Update course
**DELETE** `/api/courses.php` - Delete course

### Registrations

**GET** `/api/registrations.php` - Get all registrations
**POST** `/api/registrations.php` - Create registration

## Authentication

All endpoints except `/api/login.php` require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-token-here>
```

## Default Login Credentials

- **Email**: admin@academix.com
- **Password**: admin123

## Frontend Configuration

Update your frontend `.env` file or `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost/backend/api';
```

## Security Notes

⚠️ **Important for Production:**

1. Change the JWT secret key in `backend/utils/Auth.php`
2. Use environment variables for database credentials
3. Enable HTTPS
4. Implement rate limiting
5. Add input sanitization
6. Update CORS settings to allow only your frontend domain

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure:
- `backend/config/cors.php` is included in all API files
- Apache mod_headers is enabled

### Database Connection Failed
- Check MySQL is running
- Verify credentials in `config/database.php`
- Ensure database `student_hub` exists

### 404 Errors
- Verify backend folder is in the correct location (htdocs/www)
- Check file permissions
- Ensure Apache is running

## Project Structure

```
backend/
├── api/
│   ├── login.php           # Authentication endpoint
│   ├── students.php        # Students CRUD
│   ├── courses.php         # Courses CRUD
│   └── registrations.php   # Registrations endpoint
├── config/
│   ├── database.php        # Database connection
│   └── cors.php            # CORS configuration
├── database/
│   └── schema.sql          # Database schema & sample data
├── utils/
│   ├── Auth.php            # JWT authentication
│   └── Response.php        # Standardized responses
├── .htaccess               # Apache configuration
└── README.md               # This file
```

## Support

For issues or questions, please check:
1. PHP error logs (in XAMPP/WAMP control panel)
2. MySQL error logs
3. Browser console for frontend errors
