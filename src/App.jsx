import React, { useState, useEffect } from 'react';
import { isAuthenticated, getCurrentUser } from './services/api.js';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentProfilePage from './pages/StudentProfilePage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import RegistrationsPage from './pages/RegistrationsPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import './styles/App.css';

/**
 * Main Application Component
 * Handles routing and authentication state
 */
function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // User role for RBAC (Role-Based Access Control)
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Current active page
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Sidebar collapsed state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Quick action triggers
  const [quickAction, setQuickAction] = useState(null);

  // Student profile view state
  const [viewingStudentId, setViewingStudentId] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);
    
    if (authenticated) {
      const user = getCurrentUser();
      setCurrentUser(user);
      setUserRole(user?.role || 'student');
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setUserRole(user?.role || 'student');
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole(null);
    setCurrentPage('dashboard');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle quick actions from Dashboard
  const handleQuickAction = (action) => {
    setQuickAction(action);
    
    // Navigate to appropriate page
    switch (action) {
      case 'add-student':
        setCurrentPage('students');
        break;
      case 'create-course':
        setCurrentPage('courses');
        break;
      case 'new-registration':
        setCurrentPage('registrations');
        break;
      case 'view-reports':
        // For now, stay on dashboard (reports feature not implemented)
        break;
      default:
        break;
    }
  };

  // Clear quick action after it's been handled
  const clearQuickAction = () => {
    setQuickAction(null);
  };

  // Handle viewing a student profile (clicking on student name)
  const handleViewStudentProfile = (studentId) => {
    setViewingStudentId(studentId);
    setCurrentPage('student-profile');
  };

  // Handle going back from student profile
  const handleBackFromProfile = () => {
    setViewingStudentId(null);
    setCurrentPage('students');
  };

  // Render current page based on state and user role (RBAC)
  const renderPage = () => {
    // Student role - limited access
    if (userRole === 'student') {
      switch (currentPage) {
        case 'dashboard':
          return <StudentDashboard />;
        default:
          return <StudentDashboard />;
      }
    }
    
    // Admin role - full access
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onQuickAction={handleQuickAction} />;
      case 'students':
        return <StudentsPage quickAction={quickAction} onActionComplete={clearQuickAction} onViewProfile={handleViewStudentProfile} />;
      case 'student-profile':
        return <StudentProfilePage studentId={viewingStudentId} onBack={handleBackFromProfile} userRole={userRole} />;
      case 'courses':
        return <CoursesPage quickAction={quickAction} onActionComplete={clearQuickAction} />;
      case 'registrations':
        return <RegistrationsPage quickAction={quickAction} onActionComplete={clearQuickAction} />;
      default:
        return <Dashboard onQuickAction={handleQuickAction} />;
    }
  };

  // If not logged in, show login page
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in - show main application
  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        userRole={userRole}
        currentUser={currentUser}
      />
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <header className="top-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <span className="menu-icon"></span>
          </button>
          <h1 className="page-title">
            {currentPage === 'student-profile' ? 'Student Profile' : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
          </h1>
        </header>
        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
