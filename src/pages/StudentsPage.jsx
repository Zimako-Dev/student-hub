import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../services/api.js';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/DataPage.css';

/**
 * Students Management Page
 * CRUD operations for student records
 */
function StudentsPage() {
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
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
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
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '555-0101', date_of_birth: '2000-01-15', address: '123 Main St' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '555-0102', date_of_birth: '1999-05-20', address: '456 Oak Ave' },
        { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com', phone: '555-0103', date_of_birth: '2001-03-10', address: '789 Pine Rd' },
        { id: 4, first_name: 'Sarah', last_name: 'Williams', email: 'sarah@example.com', phone: '555-0104', date_of_birth: '2000-07-22', address: '321 Elm St' },
        { id: 5, first_name: 'David', last_name: 'Brown', email: 'david@example.com', phone: '555-0105', date_of_birth: '1998-11-30', address: '654 Maple Dr' },
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

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
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
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      address: '',
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
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      phone: student.phone || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
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

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="medium"
      >
        <form className="data-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className={`form-group ${formErrors.first_name ? 'has-error' : ''}`}>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Enter first name"
              />
              {formErrors.first_name && (
                <span className="field-error">{formErrors.first_name}</span>
              )}
            </div>
            <div className={`form-group ${formErrors.last_name ? 'has-error' : ''}`}>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
              {formErrors.last_name && (
                <span className="field-error">{formErrors.last_name}</span>
              )}
            </div>
          </div>

          <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
            />
            {formErrors.email && (
              <span className="field-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className={`form-group ${formErrors.phone ? 'has-error' : ''}`}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
              {formErrors.phone && (
                <span className="field-error">{formErrors.phone}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                className="form-input"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-input form-textarea"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
              rows="3"
            />
          </div>

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
              {formLoading ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
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
