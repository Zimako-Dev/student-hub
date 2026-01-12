import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/StudentProfilePage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend/api';

/**
 * Student Profile Page Component
 * Dynamically generated profile page accessible by both students and admins
 * Shows personal details, enrolled courses, and academic status
 */
function StudentProfilePage({ studentId, onBack, userRole }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch profile on mount or when studentId changes
  useEffect(() => {
    if (studentId) {
      fetchProfile(studentId);
    }
  }, [studentId]);

  /**
   * Fetch student profile from API using GET variable
   */
  const fetchProfile = async (id) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/profile.php?id=${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      console.log('API not available, using demo data');
      // Demo data for testing
      setProfile(getDemoProfile(id));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate demo profile data for testing
   */
  const getDemoProfile = (id) => ({
    personal_details: {
      id: id,
      student_id: `STU00000${id}`,
      first_name: 'John',
      last_name: 'Doe',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-0101',
      date_of_birth: '2000-01-15',
      age: 24,
      address: '123 Main St, Springfield',
      course_of_study: 'Computer Science',
      enrollment_date: '2023-09-01',
      enrollment_duration: '1 year, 4 months',
      created_at: '2023-09-01 10:00:00',
      updated_at: '2024-01-10 15:30:00'
    },
    enrolled_courses: [
      { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 3, instructor: 'Dr. Smith', registered_at: '2023-09-01', status: 'Active' },
      { id: 2, code: 'MATH201', name: 'Calculus I', credits: 4, instructor: 'Prof. Johnson', registered_at: '2023-09-15', status: 'Active' },
      { id: 3, code: 'ENG101', name: 'English Composition', credits: 3, instructor: 'Dr. Williams', registered_at: '2023-10-01', status: 'Active' },
    ],
    academic_status: {
      status: 'Active',
      status_reason: 'Currently enrolled and in good standing',
      indicator: { color: '#16a34a', bg: '#dcfce7', icon: '✓' },
      total_credits: 10,
      course_count: 3,
      credit_requirement: 120,
      credits_remaining: 110,
      progress_percentage: 8.3,
      standing: 'Needs Improvement',
      semester: 'Freshman'
    },
    registration_history: [
      { id: 1, registered_at: '2023-09-01', course_code: 'CS101', course_name: 'Introduction to Programming', credits: 3 },
      { id: 2, registered_at: '2023-09-15', course_code: 'MATH201', course_name: 'Calculus I', credits: 4 },
      { id: 3, registered_at: '2023-10-01', course_code: 'ENG101', course_name: 'English Composition', credits: 3 },
    ],
    status_indicators: {
      'Active': { color: '#16a34a', bg: '#dcfce7', icon: '✓' },
      'Inactive': { color: '#6b7280', bg: '#f3f4f6', icon: '○' },
      'Graduated': { color: '#7c3aed', bg: '#ede9fe', icon: '🎓' },
      'Suspended': { color: '#dc2626', bg: '#fee2e2', icon: '⚠' },
      'On Leave': { color: '#d97706', bg: '#fef3c7', icon: '⏸' },
      'Academic Probation': { color: '#ea580c', bg: '#ffedd5', icon: '!' }
    },
    generated_at: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="profile-page">
        <LoadingSpinner message="Loading student profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <span className="error-icon">👤</span>
          <p>Student profile not found</p>
          <button className="btn btn-primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  const { personal_details, enrolled_courses, academic_status, registration_history } = profile;
  const statusIndicator = academic_status?.indicator || { color: '#16a34a', bg: '#dcfce7', icon: '✓' };

  return (
    <div className="profile-page">
      {/* Header with Back Button */}
      <div className="profile-header">
        <button className="back-btn" onClick={onBack}>
          <span>←</span> Back to Students
        </button>
        <div className="header-actions">
          <span className="role-badge">{userRole === 'admin' ? '👑 Admin View' : '🎓 Student View'}</span>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="profile-banner">
        <div className="profile-avatar">
          {personal_details?.first_name?.[0]}{personal_details?.last_name?.[0]}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{personal_details?.full_name}</h1>
          <p className="profile-id">{personal_details?.student_id}</p>
          <p className="profile-program">{personal_details?.course_of_study}</p>
        </div>
        <div 
          className="status-indicator"
          style={{ 
            backgroundColor: statusIndicator.bg, 
            color: statusIndicator.color 
          }}
        >
          <span className="status-icon">{statusIndicator.icon}</span>
          <span className="status-text">{academic_status?.status}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="profile-content">
        {/* Personal Details Card */}
        <div className="profile-card personal-details-card">
          <div className="card-header">
            <h2>👤 Personal Details</h2>
          </div>
          <div className="card-body">
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{personal_details?.full_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Student ID</span>
                <span className="detail-value">{personal_details?.student_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{personal_details?.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{personal_details?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">
                  {personal_details?.date_of_birth 
                    ? new Date(personal_details.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A'}
                  {personal_details?.age && ` (${personal_details.age} years old)`}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address</span>
                <span className="detail-value">{personal_details?.address || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Enrollment Date</span>
                <span className="detail-value">
                  {personal_details?.enrollment_date 
                    ? new Date(personal_details.enrollment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Enrollment Duration</span>
                <span className="detail-value">{personal_details?.enrollment_duration || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Status Card */}
        <div className="profile-card academic-status-card">
          <div className="card-header">
            <h2>📊 Academic Status</h2>
            <div 
              className="status-badge-large"
              style={{ 
                backgroundColor: statusIndicator.bg, 
                color: statusIndicator.color 
              }}
            >
              {statusIndicator.icon} {academic_status?.status}
            </div>
          </div>
          <div className="card-body">
            <p className="status-reason">{academic_status?.status_reason}</p>
            
            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-header">
                <span>Degree Progress</span>
                <span>{academic_status?.progress_percentage}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${academic_status?.progress_percentage}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span>{academic_status?.total_credits} / {academic_status?.credit_requirement} credits</span>
                <span>{academic_status?.credits_remaining} remaining</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{academic_status?.course_count}</span>
                <span className="stat-label">Enrolled Courses</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{academic_status?.total_credits}</span>
                <span className="stat-label">Total Credits</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{academic_status?.semester}</span>
                <span className="stat-label">Year Standing</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{academic_status?.standing}</span>
                <span className="stat-label">Academic Standing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enrolled Courses Card */}
        <div className="profile-card courses-card">
          <div className="card-header">
            <h2>📚 Enrolled Courses</h2>
            <span className="course-count">{enrolled_courses?.length || 0} courses</span>
          </div>
          <div className="card-body">
            {enrolled_courses && enrolled_courses.length > 0 ? (
              <div className="courses-list">
                {enrolled_courses.map((course, index) => (
                  <div key={course.id || index} className="course-item">
                    <div className="course-main">
                      <span className="course-code">{course.code}</span>
                      <div className="course-details">
                        <span className="course-name">{course.name}</span>
                        <span className="course-instructor">Instructor: {course.instructor}</span>
                      </div>
                    </div>
                    <div className="course-meta">
                      <span className="course-credits">{course.credits} credits</span>
                      <span 
                        className="course-status"
                        style={{ 
                          backgroundColor: profile.status_indicators?.[course.status]?.bg || '#dcfce7',
                          color: profile.status_indicators?.[course.status]?.color || '#16a34a'
                        }}
                      >
                        {course.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <p>No courses enrolled</p>
              </div>
            )}
          </div>
        </div>

        {/* Registration History Card */}
        <div className="profile-card history-card">
          <div className="card-header">
            <h2>📅 Registration History</h2>
          </div>
          <div className="card-body">
            {registration_history && registration_history.length > 0 ? (
              <div className="timeline">
                {registration_history.map((item, index) => (
                  <div key={item.id || index} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-date">
                          {new Date(item.registered_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="timeline-credits">{item.credits} credits</span>
                      </div>
                      <p className="timeline-title">{item.course_code} - {item.course_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <p>No registration history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="profile-footer">
        <p>Profile generated at: {new Date(profile.generated_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default StudentProfilePage;
