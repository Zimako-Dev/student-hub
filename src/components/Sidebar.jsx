import React from 'react';
import '../styles/Sidebar.css';

/**
 * Sidebar Navigation Component
 * Displays navigation links and user actions
 * Supports RBAC - different menus for admin and student roles
 */
function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onToggle, userRole, currentUser }) {
  // Navigation items based on user role (RBAC)
  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'students', label: 'Students', icon: '👨‍🎓' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'registrations', label: 'Registrations', icon: '📝' },
  ];

  const studentNavItems = [
    { id: 'dashboard', label: 'My Dashboard', icon: '🏠' },
  ];

  // Select nav items based on role
  const navItems = userRole === 'student' ? studentNavItems : adminNavItems;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onToggle}></div>
      )}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo/Brand Section */}
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            <span className="logo-text">AcademiX</span>
          </div>
          <button className="close-sidebar" onClick={onToggle}>×</button>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onNavigate(item.id);
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth <= 768) {
                      onToggle();
                    }
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">
                {currentUser?.email?.split('@')[0] || 'User'}
              </span>
              <span className={`user-role ${userRole}`}>
                {userRole === 'admin' ? '👑 Administrator' : '🎓 Student'}
              </span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <span className="logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
