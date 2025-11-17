import React, { useState, useEffect } from 'react';
import { Search, Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import './StudentList.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, searchTerm]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/students?page=${currentPage}&limit=10&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setStudents(data.students);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const ProgressBar = ({ progress }) => (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="progress-text">{progress}%</span>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      enrolled: { label: 'Enrolled', class: 'status-enrolled' },
      'in-progress': { label: 'In Progress', class: 'status-in-progress' },
      completed: { label: 'Completed', class: 'status-completed' },
      dropped: { label: 'Dropped', class: 'status-dropped' }
    };

    const config = statusConfig[status] || statusConfig.enrolled;
    
    return (
      <span className={`status-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="student-management">
      {/* Header */}
      <div className="student-header">
        <h1>
          <Users className="header-icon" />
          Student Management
        </h1>
        <p>View and manage student enrollments and progress</p>
      </div>

      {/* Search and Filters */}
      <div className="search-section">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total-students">
            <Users />
          </div>
          <div className="stat-info">
            <h3>Total Students</h3>
            <p>{students.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total-enrollments">
            <BookOpen />
          </div>
          <div className="stat-info">
            <h3>Total Enrollments</h3>
            <p>
              {students.reduce((sum, student) => sum + student.stats.totalEnrollments, 0)}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed-courses">
            <Award />
          </div>
          <div className="stat-info">
            <h3>Courses Completed</h3>
            <p>
              {students.reduce((sum, student) => sum + student.stats.completedCourses, 0)}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon avg-progress">
            <TrendingUp />
          </div>
          <div className="stat-info">
            <h3>Avg Progress</h3>
            <p>
              {students.length > 0 
                ? Math.round(students.reduce((sum, student) => sum + student.stats.averageProgress, 0) / students.length)
                : 0
              }%
            </p>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Enrollments</th>
              <th>Completed</th>
              <th>Average Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td className="student-info">
                  <div className="student-avatar">
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="student-details">
                    <div className="student-name">{student.name}</div>
                    <div className="student-email">{student.email}</div>
                  </div>
                </td>
                <td>
                  <span className="enrollment-count">
                    {student.stats.totalEnrollments}
                  </span>
                </td>
                <td>
                  <span className="completed-count">
                    {student.stats.completedCourses}
                  </span>
                </td>
                <td>
                  <ProgressBar progress={student.stats.averageProgress} />
                </td>
                <td>
                  <span className="activity-status">
                    {student.stats.activeEnrollments > 0 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-view-details"
                    onClick={() => setSelectedStudent(student)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

// Student Details Modal Component
const StudentDetailsModal = ({ student, onClose }) => {
  const [detailedEnrollments, setDetailedEnrollments] = useState([]);

  useEffect(() => {
    // In a real app, you might fetch more detailed enrollment data here
    setDetailedEnrollments(student.enrollments);
  }, [student]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Student Details: {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="student-profile">
          <div className="profile-header">
            <div className="profile-avatar">
              {student.avatar ? (
                <img src={student.avatar} alt={student.name} />
              ) : (
                <div className="avatar-placeholder large">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h3>{student.name}</h3>
              <p>{student.email}</p>
              <p>Member since: {new Date(student.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="enrollments-section">
            <h4>Course Enrollments ({student.enrollments.length})</h4>
            <div className="enrollments-grid">
              {detailedEnrollments.map((enrollment) => (
                <div key={enrollment._id} className="enrollment-card">
                  <div className="course-header">
                    <h5>{enrollment.course.title}</h5>
                    <StatusBadge status={enrollment.status} />
                  </div>
                  
                  <div className="progress-section">
                    <ProgressBar progress={enrollment.progress} />
                    <div className="progress-stats">
                      <span>
                        {enrollment.completedLessons.length} lessons completed
                      </span>
                    </div>
                  </div>

                  <div className="enrollment-meta">
                    <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    <span>Last accessed: {new Date(enrollment.lastAccessed).toLocaleDateString()}</span>
                  </div>

                  {enrollment.completedLessons.length > 0 && (
                    <div className="completed-lessons">
                      <h6>Recently Completed:</h6>
                      <ul>
                        {enrollment.completedLessons.slice(0, 3).map((cl, index) => (
                          <li key={index}>
                            {cl.lesson?.title || 'Lesson'} 
                            {cl.score && ` - Score: ${cl.score}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;