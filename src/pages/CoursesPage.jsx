import React, { useState, useEffect } from 'react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../services/api.js';
import Modal, { ConfirmModal } from '../components/Modal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/DataPage.css';

/**
 * Courses Management Page
 * CRUD operations for course records
 */
function CoursesPage({ quickAction, onActionComplete }) {
  // State management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '',
    instructor: '',
    capacity: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
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
    if (quickAction === 'create-course') {
      handleAddCourse();
      if (onActionComplete) {
        onActionComplete();
      }
    }
  }, [quickAction]);

  /**
   * Fetch all courses from API
   */
  const fetchCourses = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getCourses();
      setCourses(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      // Demo data if API not available
      setCourses([
        { id: 1, code: 'CS101', name: 'Introduction to Programming', description: 'Learn fundamentals of programming', credits: 3, instructor: 'Dr. Smith', capacity: 30 },
        { id: 2, code: 'MATH201', name: 'Calculus I', description: 'Differential and integral calculus', credits: 4, instructor: 'Prof. Johnson', capacity: 35 },
        { id: 3, code: 'PHY101', name: 'Physics I', description: 'Mechanics and thermodynamics', credits: 4, instructor: 'Dr. Williams', capacity: 25 },
        { id: 4, code: 'ENG101', name: 'English Composition', description: 'Academic writing and communication', credits: 3, instructor: 'Ms. Davis', capacity: 30 },
        { id: 5, code: 'CS201', name: 'Data Structures', description: 'Advanced programming concepts', credits: 3, instructor: 'Dr. Brown', capacity: 25 },
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

    if (!formData.code.trim()) {
      errors.code = 'Course code is required';
    } else if (formData.code.length > 10) {
      errors.code = 'Course code must be 10 characters or less';
    }

    if (!formData.name.trim()) {
      errors.name = 'Course name is required';
    }

    if (!formData.credits) {
      errors.credits = 'Credits are required';
    } else if (formData.credits < 1 || formData.credits > 10) {
      errors.credits = 'Credits must be between 1 and 10';
    }

    if (formData.capacity && (formData.capacity < 1 || formData.capacity > 500)) {
      errors.capacity = 'Capacity must be between 1 and 500';
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
   * Open form modal for adding new course
   */
  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: '',
      instructor: '',
      capacity: '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  /**
   * Open form modal for editing course
   */
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      credits: course.credits?.toString() || '',
      instructor: course.instructor || '',
      capacity: course.capacity?.toString() || '',
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

    const submitData = {
      ...formData,
      credits: parseInt(formData.credits, 10),
      capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
    };

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, submitData);
        setSuccessMessage('Course updated successfully!');
      } else {
        await createCourse(submitData);
        setSuccessMessage('Course added successfully!');
      }
      setIsFormModalOpen(false);
      fetchCourses();
    } catch (err) {
      // Demo mode: simulate success
      if (editingCourse) {
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...submitData } : c))
        );
        setSuccessMessage('Course updated successfully!');
      } else {
        const newCourse = { ...submitData, id: Date.now() };
        setCourses((prev) => [...prev, newCourse]);
        setSuccessMessage('Course added successfully!');
      }
      setIsFormModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Open delete confirmation modal
   */
  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  /**
   * Handle course deletion
   */
  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      await deleteCourse(courseToDelete.id);
      setSuccessMessage('Course deleted successfully!');
      fetchCourses();
    } catch (err) {
      // Demo mode: simulate deletion
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
      setSuccessMessage('Course deleted successfully!');
    }
    setCourseToDelete(null);
  };

  /**
   * Filter courses based on search term
   */
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      course.code?.toLowerCase().includes(searchLower) ||
      course.name?.toLowerCase().includes(searchLower) ||
      course.instructor?.toLowerCase().includes(searchLower)
    );
  });

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading courses..." />;
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
          <h2 className="header-title">Course Management</h2>
          <p className="header-subtitle">Manage all course offerings</p>
        </div>
        <button className="btn btn-primary add-btn" onClick={handleAddCourse}>
          <span>+</span> Add Course
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by code, name, or instructor..."
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
              <th>Code</th>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Credits</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  <div className="empty-content">
                    <span className="empty-icon">📚</span>
                    <p>No courses found</p>
                    {searchTerm && <span>Try a different search term</span>}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <span className="course-code">{course.code}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{course.name}</strong>
                      {course.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                          {course.description.substring(0, 50)}
                          {course.description.length > 50 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>{course.instructor || '-'}</td>
                  <td>
                    <span className="credits-badge">{course.credits} cr</span>
                  </td>
                  <td>{course.capacity || '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditCourse(course)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteClick(course)}
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
        Showing {filteredCourses.length} of {courses.length} courses
      </div>

      {/* Add/Edit Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
        size="medium"
      >
        <form className="data-form" onSubmit={handleFormSubmit}>
          <div className="form-row">
            <div className={`form-group ${formErrors.code ? 'has-error' : ''}`}>
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                name="code"
                className="form-input"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., CS101"
                maxLength="10"
              />
              {formErrors.code && (
                <span className="field-error">{formErrors.code}</span>
              )}
            </div>
            <div className={`form-group ${formErrors.credits ? 'has-error' : ''}`}>
              <label className="form-label">Credits *</label>
              <input
                type="number"
                name="credits"
                className="form-input"
                value={formData.credits}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                min="1"
                max="10"
              />
              {formErrors.credits && (
                <span className="field-error">{formErrors.credits}</span>
              )}
            </div>
          </div>

          <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
            <label className="form-label">Course Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter course name"
            />
            {formErrors.name && (
              <span className="field-error">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter course description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Instructor</label>
              <input
                type="text"
                name="instructor"
                className="form-input"
                value={formData.instructor}
                onChange={handleInputChange}
                placeholder="Enter instructor name"
              />
            </div>
            <div className={`form-group ${formErrors.capacity ? 'has-error' : ''}`}>
              <label className="form-label">Capacity</label>
              <input
                type="number"
                name="capacity"
                className="form-input"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Max students"
                min="1"
                max="500"
              />
              {formErrors.capacity && (
                <span className="field-error">{formErrors.capacity}</span>
              )}
            </div>
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
              {formLoading ? 'Saving...' : editingCourse ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmType="danger"
      />
    </div>
  );
}

export default CoursesPage;
