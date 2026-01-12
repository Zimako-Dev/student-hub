import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import '../styles/StudentDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/backend/api';

/**
 * Student Dashboard Component
 * Displays student profile and allows report generation
 * Student Role Only
 */
function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [registrationSummary, setRegistrationSummary] = useState(null);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch student profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  /**
   * Fetch student profile from API
   */
  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/student-profile.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data.profile);
        setCourses(data.data.courses || []);
        setRegistrations(data.data.registrations || []);
        setRegistrationSummary(data.data.registration_summary || null);
        setTotalCredits(data.data.total_credits || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (err) {
      // Demo data for testing
      setProfile({
        id: 1,
        student_id: 'STU000001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0101',
        date_of_birth: '2000-01-15',
        address: '123 Main St, Springfield',
        course_of_study: 'Computer Science',
        enrollment_date: '2023-09-01',
      });
      setCourses([
        { id: 1, code: 'CS101', name: 'Introduction to Programming', credits: 3, instructor: 'Dr. Smith', registered_at: '2023-09-01' },
        { id: 2, code: 'MATH201', name: 'Calculus I', credits: 4, instructor: 'Prof. Johnson', registered_at: '2023-09-15' },
      ]);
      setRegistrations([
        { registration_id: 1, course_code: 'CS101', course_name: 'Introduction to Programming', credits: 3, registered_at: '2023-09-01', status: 'Active' },
        { registration_id: 2, course_code: 'MATH201', course_name: 'Calculus I', credits: 4, registered_at: '2023-09-15', status: 'Active' },
      ]);
      setRegistrationSummary({
        total_courses: 2,
        total_credits: 7,
        first_registration: '2023-09-01',
        last_registration: '2023-09-15',
        overall_status: 'Active'
      });
      setTotalCredits(7);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open printable profile report in new window
   */
  const handleViewReport = () => {
    const token = localStorage.getItem('authToken');
    const reportUrl = `${API_BASE_URL}/student-profile.php?action=report`;
    
    // Open in new window with auth token
    const newWindow = window.open('', '_blank');
    
    fetch(reportUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.text())
      .then(html => {
        newWindow.document.write(html);
        newWindow.document.close();
      })
      .catch(() => {
        // Demo mode - generate client-side report
        generateDemoReport(newWindow);
      });
  };

  /**
   * Download profile report
   */
  const handleDownloadReport = () => {
    const token = localStorage.getItem('authToken');
    const reportUrl = `${API_BASE_URL}/student-profile.php?action=download`;
    
    fetch(reportUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Profile_Report_${profile?.first_name}_${profile?.last_name}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch(() => {
        // Demo mode - generate client-side download
        generateDemoDownload();
      });
  };

  /**
   * View Registration Confirmation Slip
   */
  const handleViewRegistrationSlip = () => {
    const token = localStorage.getItem('authToken');
    const slipUrl = `${API_BASE_URL}/student-profile.php?action=registration-slip`;
    
    const newWindow = window.open('', '_blank');
    
    fetch(slipUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.text())
      .then(html => {
        newWindow.document.write(html);
        newWindow.document.close();
      })
      .catch(() => {
        // Demo mode - generate client-side registration slip
        generateDemoRegistrationSlip(newWindow);
      });
  };

  /**
   * Download Registration Slip as PDF using jsPDF
   */
  const handleDownloadRegistrationSlipPDF = async () => {
    // Dynamically import jsPDF
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const slipNumber = `REG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(profile?.id || 1).padStart(4, '0')}`;
    
    // Header
    doc.setFillColor(17, 153, 142);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Registration Confirmation Slip', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('AcademiX Student Management System', 105, 30, { align: 'center' });
    
    // Slip Number
    doc.setFontSize(10);
    doc.text(slipNumber, 190, 15, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Student Information Section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Student Information', 20, 55);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    
    const studentInfo = [
      ['Full Name:', `${profile?.first_name} ${profile?.last_name}`],
      ['Student ID:', profile?.student_id || 'N/A'],
      ['Email:', profile?.email || 'N/A'],
      ['Program:', profile?.course_of_study || 'N/A'],
    ];
    
    let yPos = 65;
    studentInfo.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, 20, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(value, 60, yPos);
      yPos += 8;
    });
    
    // Registration Summary
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Registration Summary', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Courses: ${registrationSummary?.total_courses || registrations.length}`, 20, yPos);
    doc.text(`Total Credits: ${registrationSummary?.total_credits || totalCredits}`, 80, yPos);
    doc.text(`Status: ${registrationSummary?.overall_status || 'Active'}`, 140, yPos);
    
    // Course Registrations Table
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Course Registrations', 20, yPos);
    yPos += 10;
    
    // Table Header
    doc.setFillColor(248, 249, 250);
    doc.rect(20, yPos - 5, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Code', 25, yPos);
    doc.text('Course Name', 50, yPos);
    doc.text('Credits', 130, yPos);
    doc.text('Status', 155, yPos);
    yPos += 10;
    
    // Table Rows
    doc.setFont(undefined, 'normal');
    registrations.forEach((reg) => {
      doc.text(reg.course_code, 25, yPos);
      doc.text(reg.course_name.substring(0, 40), 50, yPos);
      doc.text(String(reg.credits), 135, yPos);
      doc.text(reg.status, 155, yPos);
      yPos += 8;
    });
    
    // Footer
    yPos = 270;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    doc.text('This is an official registration confirmation from AcademiX', 20, yPos + 5);
    
    // Save PDF
    doc.save(`Registration_Slip_${profile?.student_id}_${slipNumber}.pdf`);
  };

  /**
   * Generate demo registration slip for testing
   */
  const generateDemoRegistrationSlip = (newWindow) => {
    if (!profile) return;
    
    const html = generateRegistrationSlipHTML();
    newWindow.document.write(html);
    newWindow.document.close();
  };

  /**
   * Generate Registration Slip HTML
   */
  const generateRegistrationSlipHTML = () => {
    const generatedAt = new Date().toLocaleString();
    const slipNumber = `REG-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(profile?.id || 1).padStart(4, '0')}`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Registration Confirmation Slip - ${profile.first_name} ${profile.last_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; padding: 20px; }
        .slip-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
        .slip-header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; }
        .slip-title { font-size: 1.6rem; font-weight: 700; }
        .slip-body { padding: 30px; }
        .section-title { font-size: 1.1rem; color: #11998e; margin-bottom: 15px; border-bottom: 2px solid #11998e; padding-bottom: 8px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .info-item .label { font-size: 0.8rem; color: #666; text-transform: uppercase; }
        .info-item .value { font-size: 1rem; font-weight: 600; }
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .summary-card { text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; }
        .summary-card.status { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .summary-value { font-size: 1.8rem; font-weight: 700; }
        .summary-label { font-size: 0.85rem; opacity: 0.9; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; background: #d4edda; color: #155724; }
        .slip-footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 0.85rem; color: #666; }
        .print-btn { position: fixed; bottom: 30px; right: 30px; padding: 12px 24px; background: #11998e; color: white; border: none; border-radius: 8px; cursor: pointer; }
        @media print { .print-btn { display: none; } }
    </style>
</head>
<body>
    <div class="slip-container">
        <div class="slip-header">
            <h1 class="slip-title">📋 Registration Confirmation Slip</h1>
            <p>AcademiX Student Management System</p>
            <p style="margin-top: 10px; font-size: 0.9rem;">${slipNumber}</p>
        </div>
        <div class="slip-body">
            <h2 class="section-title">👤 Student Information</h2>
            <div class="info-grid">
                <div class="info-item"><div class="label">Full Name</div><div class="value">${profile.first_name} ${profile.last_name}</div></div>
                <div class="info-item"><div class="label">Student ID</div><div class="value">${profile.student_id}</div></div>
                <div class="info-item"><div class="label">Email</div><div class="value">${profile.email}</div></div>
                <div class="info-item"><div class="label">Program</div><div class="value">${profile.course_of_study}</div></div>
            </div>
            <h2 class="section-title">📊 Registration Summary</h2>
            <div class="summary-cards">
                <div class="summary-card"><div class="summary-value">${registrations.length}</div><div class="summary-label">Courses Enrolled</div></div>
                <div class="summary-card"><div class="summary-value">${totalCredits}</div><div class="summary-label">Total Credits</div></div>
                <div class="summary-card status"><div class="summary-value">${registrationSummary?.overall_status || 'Active'}</div><div class="summary-label">Status</div></div>
            </div>
            <h2 class="section-title">📚 Course Registrations</h2>
            <table>
                <thead><tr><th>Code</th><th>Course Name</th><th>Credits</th><th>Registered</th><th>Status</th></tr></thead>
                <tbody>
                    ${registrations.map(r => `<tr><td><strong>${r.course_code}</strong></td><td>${r.course_name}</td><td>${r.credits}</td><td>${new Date(r.registered_at).toLocaleDateString()}</td><td><span class="status-badge">${r.status}</span></td></tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div class="slip-footer">
            <p><strong>Generated:</strong> ${generatedAt}</p>
            <p>This is an official registration confirmation from AcademiX</p>
        </div>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
</body>
</html>`;
  };

  /**
   * Generate demo report for testing without backend
   */
  const generateDemoReport = (newWindow) => {
    if (!profile) return;
    
    const html = generateReportHTML();
    newWindow.document.write(html);
    newWindow.document.close();
  };

  /**
   * Generate demo download for testing without backend
   */
  const generateDemoDownload = () => {
    if (!profile) return;
    
    const html = generateReportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Profile_Report_${profile.first_name}_${profile.last_name}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  /**
   * Generate report HTML content
   */
  const generateReportHTML = () => {
    const generatedAt = new Date().toLocaleString();
    
    let coursesHTML = '';
    if (courses.length > 0) {
      coursesHTML = `
        <div class="section">
          <h2 class="section-title">📚 Enrolled Courses</h2>
          <table class="courses-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Instructor</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              ${courses.map(c => `
                <tr>
                  <td>${c.code}</td>
                  <td>${c.name}</td>
                  <td>${c.instructor}</td>
                  <td>${c.credits}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Profile Report - ${profile.first_name} ${profile.last_name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
        .report-container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        .report-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .report-header h1 { font-size: 1.8rem; margin-bottom: 5px; }
        .report-header p { opacity: 0.9; font-size: 0.95rem; }
        .logo { font-size: 2.5rem; margin-bottom: 10px; }
        .report-body { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 1.2rem; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 8px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-item { padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
        .info-label { font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
        .info-value { font-size: 1.1rem; font-weight: 600; color: #333; }
        .courses-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .courses-table th, .courses-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        .courses-table th { background: #f8f9fa; font-weight: 600; color: #555; }
        .report-footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 0.85rem; color: #666; border-top: 1px solid #e0e0e0; }
        .badge { display: inline-block; padding: 4px 12px; background: #667eea; color: white; border-radius: 20px; font-size: 0.85rem; }
        .print-btn { position: fixed; bottom: 30px; right: 30px; padding: 15px 30px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
        .print-btn:hover { background: #5a6fd6; }
        @media print { body { background: white; padding: 0; } .report-container { box-shadow: none; } .print-btn { display: none; } }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-header">
            <div class="logo">🎓</div>
            <h1>Student Profile Summary Report</h1>
            <p>AcademiX Student Management System</p>
        </div>
        <div class="report-body">
            <div class="section">
                <h2 class="section-title">📋 Personal Information</h2>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${profile.first_name} ${profile.last_name}</div></div>
                    <div class="info-item"><div class="info-label">Student ID</div><div class="info-value">${profile.student_id}</div></div>
                    <div class="info-item"><div class="info-label">Email Address</div><div class="info-value">${profile.email}</div></div>
                    <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">${profile.date_of_birth}</div></div>
                    <div class="info-item"><div class="info-label">Phone Number</div><div class="info-value">${profile.phone || 'N/A'}</div></div>
                    <div class="info-item"><div class="info-label">Address</div><div class="info-value">${profile.address || 'N/A'}</div></div>
                </div>
            </div>
            <div class="section">
                <h2 class="section-title">🎓 Academic Information</h2>
                <div class="info-grid">
                    <div class="info-item"><div class="info-label">Course of Study</div><div class="info-value">${profile.course_of_study}</div></div>
                    <div class="info-item"><div class="info-label">Enrollment Date</div><div class="info-value">${profile.enrollment_date}</div></div>
                    <div class="info-item"><div class="info-label">Total Credits</div><div class="info-value">${totalCredits} Credits</div></div>
                    <div class="info-item"><div class="info-label">Status</div><div class="info-value"><span class="badge">Active</span></div></div>
                </div>
            </div>
            ${coursesHTML}
        </div>
        <div class="report-footer">
            <p><strong>Report Generated:</strong> ${generatedAt}</p>
            <p>This is an official document from AcademiX Student Management System</p>
            <p>© 2026 AcademiX. All rights reserved.</p>
        </div>
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
</body>
</html>`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <div className="student-dashboard">
      {/* Welcome Header */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Welcome back, {profile?.first_name}! 👋
          </h1>
          <p className="welcome-subtitle">
            Here's your student profile and academic information
          </p>
        </div>
        <div className="welcome-avatar">
          <div className="avatar-large">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Profile Summary Card */}
      <div className="profile-card">
        <div className="card-header">
          <h2>📋 Profile Summary</h2>
          <span className="status-badge active">Active Student</span>
        </div>
        
        <div className="profile-grid">
          <div className="profile-item">
            <span className="profile-label">Full Name</span>
            <span className="profile-value">{profile?.first_name} {profile?.last_name}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Student ID</span>
            <span className="profile-value">{profile?.student_id}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Email Address</span>
            <span className="profile-value">{profile?.email}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Date of Birth</span>
            <span className="profile-value">{profile?.date_of_birth}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Course of Study</span>
            <span className="profile-value highlight">{profile?.course_of_study}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Enrollment Date</span>
            <span className="profile-value">{profile?.enrollment_date}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Phone</span>
            <span className="profile-value">{profile?.phone || 'Not provided'}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Address</span>
            <span className="profile-value">{profile?.address || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="courses-card">
        <div className="card-header">
          <h2>📚 Enrolled Courses</h2>
          <span className="credits-badge">{totalCredits} Total Credits</span>
        </div>
        
        {courses.length > 0 ? (
          <div className="courses-list">
            {courses.map((course) => (
              <div key={course.id} className="course-item">
                <div className="course-code">{course.code}</div>
                <div className="course-info">
                  <span className="course-name">{course.name}</span>
                  <span className="course-instructor">Instructor: {course.instructor}</span>
                </div>
                <div className="course-credits">{course.credits} Credits</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-courses">
            <span>📭</span>
            <p>No courses enrolled yet</p>
          </div>
        )}
      </div>

      {/* Report Generation Section */}
      <div className="reports-card">
        <div className="card-header">
          <h2>📄 Profile Summary Report</h2>
        </div>
        <div className="reports-content">
          <p className="reports-description">
            Generate an official profile summary report containing your personal information,
            academic details, and enrolled courses. The report can be viewed online or downloaded
            for printing.
          </p>
          <div className="reports-actions">
            <button className="btn btn-primary" onClick={handleViewReport}>
              <span>👁️</span> View Report
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadReport}>
              <span>📥</span> Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Registration Confirmation Slip Section */}
      <div className="reports-card registration-slip-card">
        <div className="card-header">
          <h2>📋 Registration Confirmation Slip</h2>
          <span className={`status-badge ${registrationSummary?.overall_status === 'Active' ? 'active' : 'pending'}`}>
            {registrationSummary?.overall_status || 'Active'}
          </span>
        </div>
        <div className="reports-content">
          {/* Registration Metadata Summary */}
          <div className="registration-metadata">
            <div className="metadata-item">
              <span className="metadata-icon">📅</span>
              <div className="metadata-info">
                <span className="metadata-label">First Registration</span>
                <span className="metadata-value">
                  {registrationSummary?.first_registration 
                    ? new Date(registrationSummary.first_registration).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="metadata-item">
              <span className="metadata-icon">🕐</span>
              <div className="metadata-info">
                <span className="metadata-label">Last Registration</span>
                <span className="metadata-value">
                  {registrationSummary?.last_registration 
                    ? new Date(registrationSummary.last_registration).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div className="metadata-item">
              <span className="metadata-icon">📚</span>
              <div className="metadata-info">
                <span className="metadata-label">Course Summary</span>
                <span className="metadata-value">
                  {registrationSummary?.total_courses || registrations.length} Courses, {registrationSummary?.total_credits || totalCredits} Credits
                </span>
              </div>
            </div>
            <div className="metadata-item">
              <span className="metadata-icon">✅</span>
              <div className="metadata-info">
                <span className="metadata-label">Registration Status</span>
                <span className={`metadata-value status-text ${registrationSummary?.overall_status === 'Active' ? 'active' : 'pending'}`}>
                  {registrationSummary?.overall_status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <p className="reports-description" style={{ marginTop: '20px' }}>
            Download your official registration confirmation slip containing registration timestamps,
            course summary, and enrollment status. Available as a printable HTML or PDF document.
          </p>
          
          <div className="reports-actions">
            <button className="btn btn-primary" onClick={handleViewRegistrationSlip}>
              <span>👁️</span> View Slip
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadRegistrationSlipPDF}>
              <span>📥</span> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
