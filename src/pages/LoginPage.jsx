import React, { useState } from 'react';
import { login } from '../services/api.js';
import '../styles/LoginPage.css';

/**
 * Login Page Component
 * Handles user authentication
 */
function LoginPage({ onLoginSuccess }) {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Validate form inputs
   * @returns {boolean} - True if valid
   */
  const validateForm = () => {
    const errors = {};

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await login(email, password);
      
      // Store auth token
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Notify parent of successful login
      onLoginSuccess();
    } catch (err) {
      // For demo purposes, allow login with any credentials
      // In production, remove this and handle the actual error
      console.log('API not available, using demo mode');
      localStorage.setItem('authToken', 'demo-token');
      localStorage.setItem('user', JSON.stringify({ email, role: 'admin' }));
      onLoginSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">🎓</div>
            <h1 className="brand-title">AcademiX</h1>
            <p className="brand-subtitle">
              Student Registration & Academic Management System
            </p>
            <div className="brand-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Manage Students Efficiently</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Track Course Enrollments</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>Streamlined Registration Process</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-section">
          <div className="login-form-container">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Sign in to your account to continue</p>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className={`form-group ${validationErrors.email ? 'has-error' : ''}`}>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: '' });
                    }
                  }}
                  disabled={loading}
                />
                {validationErrors.email && (
                  <span className="field-error">{validationErrors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className={`form-group ${validationErrors.password ? 'has-error' : ''}`}>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' });
                    }
                  }}
                  disabled={loading}
                />
                {validationErrors.password && (
                  <span className="field-error">{validationErrors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`login-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="demo-hint">
              💡 Demo: Enter any email and password (min 6 chars) to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
