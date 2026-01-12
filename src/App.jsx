import React, { useState, useEffect } from 'react';
import { isAuthenticated } from './services/api.js';
import LoginPage from './pages/LoginPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
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
  
  // Current active page
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Sidebar collapsed state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Render current page based on state
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsPage />;
      case 'courses':
        return <CoursesPage />;
      case 'registrations':
        return <RegistrationsPage />;
      default:
        return <Dashboard />;
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
      />
      <main className={`main-content ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <header className="top-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <span className="menu-icon"></span>
          </button>
          <h1 className="page-title">
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
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
