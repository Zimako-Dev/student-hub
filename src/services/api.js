/**
 * API Service Module
 * Handles all HTTP requests to the backend API
 * Uses Fetch API for HTTP requests
 */

// Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend/api';

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise} - Response data
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Get auth token from localStorage if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Parse JSON response
    const data = await response.json();
    
    // Check for HTTP errors
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ==================== Authentication API ====================

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Login response with token
 */
export async function login(email, password) {
  return fetchAPI('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Logout user - clears local storage
 */
export function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

/**
 * Get current logged-in user data
 * @returns {object|null} - User data or null
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ==================== Students API ====================

/**
 * Get all students
 * @returns {Promise} - List of students
 */
export async function getStudents() {
  return fetchAPI('/students.php', {
    method: 'GET',
  });
}

/**
 * Get single student by ID
 * @param {number} id - Student ID
 * @returns {Promise} - Student data
 */
export async function getStudent(id) {
  return fetchAPI(`/students.php?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create new student
 * @param {object} studentData - Student information
 * @returns {Promise} - Created student
 */
export async function createStudent(studentData) {
  return fetchAPI('/students.php', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
}

/**
 * Update existing student
 * @param {number} id - Student ID
 * @param {object} studentData - Updated student information
 * @returns {Promise} - Updated student
 */
export async function updateStudent(id, studentData) {
  return fetchAPI('/students.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...studentData }),
  });
}

/**
 * Delete student
 * @param {number} id - Student ID
 * @returns {Promise} - Deletion confirmation
 */
export async function deleteStudent(id) {
  return fetchAPI('/students.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ==================== Courses API ====================

/**
 * Get all courses
 * @returns {Promise} - List of courses
 */
export async function getCourses() {
  return fetchAPI('/courses.php', {
    method: 'GET',
  });
}

/**
 * Get single course by ID
 * @param {number} id - Course ID
 * @returns {Promise} - Course data
 */
export async function getCourse(id) {
  return fetchAPI(`/courses.php?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create new course
 * @param {object} courseData - Course information
 * @returns {Promise} - Created course
 */
export async function createCourse(courseData) {
  return fetchAPI('/courses.php', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
}

/**
 * Update existing course
 * @param {number} id - Course ID
 * @param {object} courseData - Updated course information
 * @returns {Promise} - Updated course
 */
export async function updateCourse(id, courseData) {
  return fetchAPI('/courses.php', {
    method: 'PUT',
    body: JSON.stringify({ id, ...courseData }),
  });
}

/**
 * Delete course
 * @param {number} id - Course ID
 * @returns {Promise} - Deletion confirmation
 */
export async function deleteCourse(id) {
  return fetchAPI('/courses.php', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

// ==================== Registrations API ====================

/**
 * Get all registrations
 * @returns {Promise} - List of registrations
 */
export async function getRegistrations() {
  return fetchAPI('/registrations.php', {
    method: 'GET',
  });
}

/**
 * Create new registration (register student for course)
 * @param {number} studentId - Student ID
 * @param {number} courseId - Course ID
 * @returns {Promise} - Registration confirmation
 */
export async function createRegistration(studentId, courseId) {
  return fetchAPI('/registrations.php', {
    method: 'POST',
    body: JSON.stringify({ student_id: studentId, course_id: courseId }),
  });
}

// ==================== Dashboard API ====================

/**
 * Get dashboard statistics
 * @returns {Promise} - Dashboard stats
 */
export async function getDashboardStats() {
  // This would typically be a dedicated endpoint
  // For now, we'll aggregate from other endpoints
  try {
    const [studentsRes, coursesRes, registrationsRes] = await Promise.all([
      getStudents(),
      getCourses(),
      getRegistrations(),
    ]);

    return {
      totalStudents: Array.isArray(studentsRes) ? studentsRes.length : studentsRes.data?.length || 0,
      totalCourses: Array.isArray(coursesRes) ? coursesRes.length : coursesRes.data?.length || 0,
      totalRegistrations: Array.isArray(registrationsRes) ? registrationsRes.length : registrationsRes.data?.length || 0,
    };
  } catch (error) {
    // Return default values if API is not available
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalRegistrations: 0,
    };
  }
}

export default {
  login,
  logout,
  isAuthenticated,
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getRegistrations,
  createRegistration,
  getDashboardStats,
};
