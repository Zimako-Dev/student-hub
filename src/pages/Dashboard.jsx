import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/Dashboard.css';

/**
 * Dashboard Page Component
 * Displays summary statistics and overview
 */
function Dashboard() {
  // State for dashboard data
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetch dashboard statistics from API
   */
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      // Use demo data if API is not available
      console.log('Using demo data for dashboard');
      setStats({
        totalStudents: 156,
        totalCourses: 24,
        totalRegistrations: 312,
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2 className="welcome-title">Welcome to AcademiX! 👋</h2>
          <p className="welcome-subtitle">
            Manage your academic institution efficiently with our comprehensive tools.
          </p>
        </div>
        <div className="welcome-illustration">
          <span className="illustration-icon">📚</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="retry-btn" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-students">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalStudents}</h3>
            <p className="stat-label">Total Students</p>
          </div>
          <div className="stat-trend positive">
            <span>+12%</span>
          </div>
        </div>

        <div className="stat-card stat-courses">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalCourses}</h3>
            <p className="stat-label">Active Courses</p>
          </div>
          <div className="stat-trend positive">
            <span>+4</span>
          </div>
        </div>

        <div className="stat-card stat-registrations">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalRegistrations}</h3>
            <p className="stat-label">Registrations</p>
          </div>
          <div className="stat-trend positive">
            <span>+28%</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <div className="quick-action-card">
            <span className="action-icon">➕</span>
            <span className="action-label">Add New Student</span>
          </div>
          <div className="quick-action-card">
            <span className="action-icon">📖</span>
            <span className="action-label">Create Course</span>
          </div>
          <div className="quick-action-card">
            <span className="action-icon">✍️</span>
            <span className="action-label">New Registration</span>
          </div>
          <div className="quick-action-card">
            <span className="action-icon">📊</span>
            <span className="action-label">View Reports</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon student">👤</div>
            <div className="activity-content">
              <p className="activity-text">New student <strong>John Doe</strong> was registered</p>
              <span className="activity-time">2 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon course">📗</div>
            <div className="activity-content">
              <p className="activity-text">Course <strong>Advanced Mathematics</strong> was updated</p>
              <span className="activity-time">5 hours ago</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon registration">📋</div>
            <div className="activity-content">
              <p className="activity-text"><strong>Jane Smith</strong> enrolled in <strong>Physics 101</strong></p>
              <span className="activity-time">Yesterday</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon student">👤</div>
            <div className="activity-content">
              <p className="activity-text">Student <strong>Mike Johnson</strong> profile updated</p>
              <span className="activity-time">2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
