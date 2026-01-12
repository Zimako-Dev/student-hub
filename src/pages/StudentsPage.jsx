import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../services/api.js';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/DataPage.css';
import '../styles/MaterialForm.css';

/**
 * Students Management Page
 * CRUD operations for student records
 */
function StudentsPage({ quickAction, onActionComplete }) {
  // State management
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    course_of_study: '',
    enrollment_date: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle quick action from Dashboard
  useEffect(() => {
    if (quickAction === 'add-student') {
      handleAddStudent();
      if (onActionComplete) {
        onActionComplete();
      }
    }
  }, [quickAction]);

  /**
   * Fetch all students from API
   */
  const fetchStudents = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getStudents();
      setStudents(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      // Demo data if API not available
      setStudents([
        { id: 1, student_id: 'STU000001', first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '555-0101', date_of_birth: '2000-01-15', address: '123 Main St', course_of_study: 'Computer Science', enrollment_date: '2023-09-01' },
        { id: 2, student_id: 'STU000002', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '555-0102', date_of_birth: '1999-05-20', address: '456 Oak Ave', course_of_study: 'Business Administration', enrollment_date: '2023-09-01' },
        { id: 3, student_id: 'STU000003', first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com', phone: '555-0103', date_of_birth: '2001-03-10', address: '789 Pine Rd', course_of_study: 'Engineering', enrollment_date: '2024-01-15' },
        { id: 4, student_id: 'STU000004', first_name: 'Sarah', last_name: 'Williams', email: 'sarah@example.com', phone: '555-0104', date_of_birth: '2000-07-22', address: '321 Elm St', course_of_study: 'Mathematics', enrollment_date: '2024-01-15' },
        { id: 5, student_id: 'STU000005', first_name: 'David', last_name: 'Brown', email: 'david@example.com', phone: '555-0105', date_of_birth: '1998-11-30', address: '654 Maple Dr', course_of_study: 'Physics', enrollment_date: '2023-09-01' },
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

    if (!formData.student_id.trim()) {
      errors.student_id = 'Student ID is required';
    } else if (formData.student_id.length < 5) {
      errors.student_id = 'Student ID must be at least 5 characters';
    }

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16) {
        errors.date_of_birth = 'Student must be at least 16 years old';
      }
    }

    if (!formData.course_of_study.trim()) {
      errors.course_of_study = 'Course of study is required';
    } else if (formData.course_of_study.length < 3) {
      errors.course_of_study = 'Course of study must be at least 3 characters';
    }

    if (!formData.enrollment_date) {
      errors.enrollment_date = 'Enrollment date is required';
    }

    if (formData.phone && !/^[\d\-\+\s()]+$/.test(formData.phone)) {
      errors.phone = 'Invalid phone format';
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
   * Open form modal for adding new student
   */
  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
      course_of_study: '',
      enrollment_date: new Date().toISOString().split('T')[0], // Default to today
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  /**
   * Open form modal for editing student
   */
  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      phone: student.phone || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      course_of_study: student.course_of_study || '',
      enrollment_date: student.enrollment_date || '',
    });
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

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        setSuccessMessage('Student updated successfully!');
      } else {
        await createStudent(formData);
        setSuccessMessage('Student added successfully!');
      }
      setIsFormModalOpen(false);
      fetchStudents();
    } catch (err) {
      // Demo mode: simulate success
      if (editingStudent) {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? { ...s, ...formData } : s))
        );
        setSuccessMessage('Student updated successfully!');
      } else {
        const newStudent = { ...formData, id: Date.now() };
        setStudents((prev) => [...prev, newStudent]);
        setSuccessMessage('Student added successfully!');
      }
      setIsFormModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handle student deletion
   */
  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      await deleteStudent(studentToDelete.id);
      setSuccessMessage('Student deleted successfully!');
      fetchStudents();
    } catch (err) {
      // Demo mode: simulate deletion
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      setSuccessMessage('Student deleted successfully!');
    }
    setStudentToDelete(null);
  };

  /**
   * Filter students based on search term
   */
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading students..." />;
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
          <h2 className="header-title">Student Management</h2>
          <p className="header-subtitle">Manage all student records</p>
        </div>
        <button className="btn btn-primary add-btn" onClick={handleAddStudent}>
          <span>+</span> Add Student
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            ×
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date of Birth</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-content">
                    <span className="empty-icon">👨‍🎓</span>
                    <p>No students found</p>
                    {searchTerm && <span>Try a different search term</span>}
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="id-cell">{student.id}</td>
                  <td className="name-cell">
                    <div className="avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                    <span>{student.first_name} {student.last_name}</span>
                  </td>
                  <td>{student.email}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.date_of_birth || '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditStudent(student)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(student)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Add/Edit Form Modal - Material Design */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingStudent ? 'Edit Student Registration' : 'Student Registration Form'}
        size="large"
      >
        <form className="material-form" onSubmit={handleFormSubmit}>
          {/* Form Header */}
          <div className="material-form-header">
            <h3 className="material-form-title">
              {editingStudent ? 'Update Student Information' : 'Register New Student'}
            </h3>
            <p className="material-form-subtitle">
              Complete all required fields marked with <span style={{color: '#ef4444'}}>*</span>
            </p>
          </div>

          {/* Personal Information Section */}
          <div className="material-form-section">
            <h4 className="material-form-section-title">Personal Information</h4>
            <div className="material-form-grid">
              {/* Student ID */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Student ID <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    className={`material-input ${formErrors.student_id ? 'error' : ''}`}
                    value={formData.student_id}
                    onChange={handleInputChange}
                    placeholder="e.g., STU000001"
                    disabled={formLoading}
                  />
                  {formErrors.student_id && (
                    <div className="material-field-error">{formErrors.student_id}</div>
                  )}
                  <div className="material-field-hint">Unique identifier for the student</div>
                </div>
              </div>

              {/* Email */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Email Address <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={`material-input ${formErrors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="student@example.com"
                    disabled={formLoading}
                  />
                  {formErrors.email && (
                    <div className="material-field-error">{formErrors.email}</div>
                  )}
                </div>
              </div>

              {/* First Name */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    First Name <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    className={`material-input ${formErrors.first_name ? 'error' : ''}`}
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    disabled={formLoading}
                  />
                  {formErrors.first_name && (
                    <div className="material-field-error">{formErrors.first_name}</div>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Last Name <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    className={`material-input ${formErrors.last_name ? 'error' : ''}`}
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    disabled={formLoading}
                  />
                  {formErrors.last_name && (
                    <div className="material-field-error">{formErrors.last_name}</div>
                  )}
                </div>
              </div>

              {/* Date of Birth */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Date of Birth <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className={`material-input ${formErrors.date_of_birth ? 'error' : ''}`}
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {formErrors.date_of_birth && (
                    <div className="material-field-error">{formErrors.date_of_birth}</div>
                  )}
                  <div className="material-field-hint">Must be at least 16 years old</div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    className={`material-input ${formErrors.phone ? 'error' : ''}`}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="555-0123"
                    disabled={formLoading}
                  />
                  {formErrors.phone && (
                    <div className="material-field-error">{formErrors.phone}</div>
                  )}
                  <div className="material-field-hint">Optional contact number</div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="material-form-section">
            <h4 className="material-form-section-title">Academic Information</h4>
            <div className="material-form-grid">
              {/* Course of Study */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Course of Study <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="course_of_study"
                    className={`material-input ${formErrors.course_of_study ? 'error' : ''}`}
                    value={formData.course_of_study}
                    onChange={handleInputChange}
                    placeholder="e.g., Computer Science"
                    disabled={formLoading}
                  />
                  {formErrors.course_of_study && (
                    <div className="material-field-error">{formErrors.course_of_study}</div>
                  )}
                  <div className="material-field-hint">Student's major or program</div>
                </div>
              </div>

              {/* Enrollment Date */}
              <div className="material-form-field">
                <div className="material-input-wrapper">
                  <label className="material-label">
                    Enrollment Date <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="date"
                    name="enrollment_date"
                    className={`material-input ${formErrors.enrollment_date ? 'error' : ''}`}
                    value={formData.enrollment_date}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                  {formErrors.enrollment_date && (
                    <div className="material-field-error">{formErrors.enrollment_date}</div>
                  )}
                  <div className="material-field-hint">Date student enrolled in program</div>
                </div>
              </div>

              {/* Address */}
              <div className="material-form-field full-width">
                <div className="material-input-wrapper">
                  <label className="material-label">Address</label>
                  <textarea
                    name="address"
                    className={`material-input material-textarea ${formErrors.address ? 'error' : ''}`}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    rows="3"
                    disabled={formLoading}
                  />
                  {formErrors.address && (
                    <div className="material-field-error">{formErrors.address}</div>
                  )}
                  <div className="material-field-hint">Optional residential address</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="material-form-actions">
            <button
              type="button"
              className="material-btn material-btn-secondary"
              onClick={() => setIsFormModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`material-btn material-btn-primary ${formLoading ? 'loading' : ''}`}
              disabled={formLoading}
            >
              {!formLoading && (editingStudent ? '✓ Update Student' : '✓ Register Student')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentToDelete?.first_name} ${studentToDelete?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmType="danger"
      />
    </div>
  );
}

export default StudentsPage;
