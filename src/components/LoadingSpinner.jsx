import React from 'react';
import '../styles/LoadingSpinner.css';

/**
 * Loading Spinner Component
 * Displays a loading indicator with optional message
 */
function LoadingSpinner({ message = 'Loading...', size = 'medium' }) {
  return (
    <div className={`loading-container ${size}`}>
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
