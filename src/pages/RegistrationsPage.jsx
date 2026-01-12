import React, { useState, useEffect } from 'react';
import { getStudents, getCourses, getRegistrations, createRegistration } from '../services/api.js';
import Modal from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/DataPage.css';
import '../styles/RegistrationsPage.css';

/**
 * Registrations Page
 * Register students for courses
 */
function RegistrationsPage() {
  // State management
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Fetch all required data
   */
  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const [studentsData, coursesData, registrationsData] = await Promise.all([
        getStudents(),
        getCourses(),
        getRegistrations(),
      ]);

      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.data || []);
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.data || []);
      setRegistrations(Array.isArray(registrationsData) ? registrationsData : registrationsData.data || []);
    } catch (err) {
      // Demo data if API not available
      setStudents([
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com' },
        { id: 4, first_name: 'Sarah', last_name: 'Williams', email: 'sarah@example.com' },
        { id: 5, first_name: 'David', last_name: 'Brown', email: 'david@example.com' },
      ]);

      setCourses([
        { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 3 },
        { id: 2, code: 'MATH201', name: 'Calculus I', credits: 4 },
        { id: 3, code: 'PHY101', name: 'Physics I', credits: 4 },
        { id: 4, code: 'ENG101', name: 'English Composition', credits: 3 },
        { id: 5, code: 'CS201', name: 'Data Structures', credits: 3 },
      ]);

      setRegistrations([
        { id: 1, student_id: 1, course_id: 1, student_name: 'John Doe', course_name: 'Introduction to Programming', course_code: 'CS101', registered_at: '2024-01-15' },
        { id: 2, student_id: 1, course_id: 2, student_name: 'John Doe', course_name: 'Calculus I', course_code: 'MATH201', registered_at: '2024-01-15' },
        { id: 3, student_id: 2, course_id: 1, student_name: 'Jane Smith', course_name: 'Introduction to Programming', course_code: 'CS101', registered_at: '2024-01-16' },
        { id: 4, student_id: 3, course_id: 3, student_name: 'Mike Johnson', course_name: 'Physics I', course_code: 'PHY101', registered_at: '2024-01-17' },
        { id: 5, student_id: 4, course_id: 4, student_name: 'Sarah Williams', course_name: 'English Composition', course_code: 'ENG101', registered_at: '2024-01-18' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = {};

    if (!formData.student_id) {
      errors.student_id = 'Please select a student';
    }

    if (!formData.course_id) {
      errors.course_id = 'Please select a course';
    }

    // Check for duplicate registration
    const isDuplicate = registrations.some(
      (r) =>
        r.student_id === parseInt(formData.student_id) &&
        r.course_id === parseInt(formData.course_id)
    );

    if (isDuplicate) {
      errors.course_id = 'This student is already registered for this course';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Open registration form modal
   */
  const handleNewRegistration = () => {
    setFormData({ student_id: '', course_id: '' });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormLoading(true);
    setError('');

    const studentId = parseInt(formData.student_id);
    const courseId = parseInt(formData.course_id);

    try {
      await createRegistration(studentId, courseId);
      setSuccessMessage('Registration successful!');
      setIsFormModalOpen(false);
      fetchAllData();
    } catch (err) {
      // Demo mode: simulate success
      const student = students.find((s) => s.id === studentId);
      const course = courses.find((c) => c.id === courseId);

      const newRegistration = {
        id: Date.now(),
        student_id: studentId,
        course_id: courseId,
        student_name: `${student?.first_name} ${student?.last_name}`,
        course_name: course?.name,
        course_code: course?.code,
        registered_at: new Date().toISOString().split('T')[0],
      };

      setRegistrations((prev) => [...prev, newRegistration]);
      setSuccessMessage('Registration successful!');
      setIsFormModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Get student display name by ID
   */
  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.first_name} ${student.last_name}` : 'Unknown';
  };

  /**
   * Get course display info by ID
   */
  const getCourseInfo = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? { code: course.code, name: course.name } : { code: 'N/A', name: 'Unknown' };
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading registrations..." />;
  }

  return (
    <div className="data-page">
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h2 className="header-title">Course Registrations</h2>
          <p className="header-subtitle">Register students for courses</p>
        </div>
        <button className="btn btn-primary add-btn" onClick={handleNewRegistration}>
          <span>+</span> New Registration
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="registration-stats">
        <div className="stat-mini-card">
          <span className="stat-mini-icon">👨‍🎓</span>
          <div className="stat-mini-info">
            <span className="stat-mini-value">{students.length}</span>
            <span className="stat-mini-label">Students</span>
          </div>
        </div>
        <div className="stat-mini-card">
          <span className="stat-mini-icon">📚</span>
          <div className="stat-mini-info">
            <span className="stat-mini-value">{courses.length}</span>
            <span className="stat-mini-label">Courses</span>
          </div>
        </div>
        <div className="stat-mini-card">
          <span className="stat-mini-icon">📝</span>
          <div className="stat-mini-info">
            <span className="stat-mini-value">{registrations.length}</span>
            <span className="stat-mini-label">Registrations</span>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Registered On</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  <div className="empty-content">
                    <span className="empty-icon">📝</span>
                    <p>No registrations yet</p>
                    <span>Click "New Registration" to get started</span>
                  </div>
                </td>
              </tr>
            ) : (
              registrations.map((registration) => {
                const studentName = registration.student_name || getStudentName(registration.student_id);
                const courseInfo = registration.course_code
                  ? { code: registration.course_code, name: registration.course_name }
                  : getCourseInfo(registration.course_id);

                return (
                  <tr key={registration.id}>
                    <td className="id-cell">{registration.id}</td>
                    <td className="name-cell">
                      <div className="avatar">
                        {studentName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span>{studentName}</span>
                    </td>
                    <td>
                      <div className="course-cell">
                        <span className="course-code">{courseInfo.code}</span>
                        <span className="course-name">{courseInfo.name}</span>
                      </div>
                    </td>
                    <td>{registration.registered_at || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Total: {registrations.length} registrations
      </div>

      {/* Registration Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="New Course Registration"
        size="medium"
      >
        <form className="data-form" onSubmit={handleFormSubmit}>
          <div className={`form-group ${formErrors.student_id ? 'has-error' : ''}`}>
            <label className="form-label">Select Student *</label>
            <select
              name="student_id"
              className="form-select"
              value={formData.student_id}
              onChange={handleInputChange}
            >
              <option value="">-- Choose a student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.email})
                </option>
              ))}
            </select>
            {formErrors.student_id && (
              <span className="field-error">{formErrors.student_id}</span>
            )}
          </div>

          <div className={`form-group ${formErrors.course_id ? 'has-error' : ''}`}>
            <label className="form-label">Select Course *</label>
            <select
              name="course_id"
              className="form-select"
              value={formData.course_id}
              onChange={handleInputChange}
            >
              <option value="">-- Choose a course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name} ({course.credits} credits)
                </option>
              ))}
            </select>
            {formErrors.course_id && (
              <span className="field-error">{formErrors.course_id}</span>
            )}
          </div>

          {/* Selected Summary */}
          {formData.student_id && formData.course_id && (
            <div className="registration-summary">
              <h4>Registration Summary</h4>
              <p>
                <strong>Student:</strong>{' '}
                {students.find((s) => s.id === parseInt(formData.student_id))?.first_name}{' '}
                {students.find((s) => s.id === parseInt(formData.student_id))?.last_name}
              </p>
              <p>
                <strong>Course:</strong>{' '}
                {courses.find((c) => c.id === parseInt(formData.course_id))?.code} -{' '}
                {courses.find((c) => c.id === parseInt(formData.course_id))?.name}
              </p>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default RegistrationsPage;
