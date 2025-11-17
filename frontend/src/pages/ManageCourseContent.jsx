import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ManageCourseContent = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug authentication
  console.log('🔐 ManageCourseContent - Full User Object:', user);
  console.log('🔐 ManageCourseContent - User ID:', user?.id);
  console.log('🔐 ManageCourseContent - User _id:', user?._id);
  console.log('🔐 ManageCourseContent - User Role:', user?.role);
  console.log('🔐 ManageCourseContent - All User Keys:', user ? Object.keys(user) : 'No user');
  console.log('🔐 ManageCourseContent - Token exists:', !!localStorage.getItem('token'));
  console.log('🔐 ManageCourseContent - Course ID:', courseId);

  useEffect(() => {
    if (!courseId) {
      alert('Invalid course ID');
      navigate('/courses');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      navigate('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      console.log('❌ User is not instructor/admin');
      return;
    }

    fetchCourseAndLessons();
  }, [courseId, user, navigate]);

  const fetchCourseAndLessons = async () => {
    try {
      console.log('🔐 Starting API calls...');
      
      // Get the token for debugging
      const token = localStorage.getItem('token');
      console.log('🔐 Token being sent:', token);

      // Make requests with explicit headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('🔐 Fetching course data...');
      const courseResponse = await axios.get(`http://localhost:5000/api/courses/${courseId}`, config);
      console.log('🔐 Course response:', courseResponse.data);

      // Enhanced debug logging with null checks
      const courseData = courseResponse.data.course;
      const instructorId = courseData?.instructor?._id;
      
      // Try different possible user ID fields
      const userId = user?.id || user?._id || user?.userId;
      
      console.log('🔐 Course Instructor ID:', instructorId, 'Type:', typeof instructorId);
      console.log('🔐 Current User ID (all attempts):', {
        'user.id': user?.id,
        'user._id': user?._id,
        'user.userId': user?.userId,
        'selectedUserId': userId
      });
      
      // Check if we have valid IDs before comparison
      if (!instructorId) {
        console.error('❌ Instructor ID is undefined or null');
        alert('Course instructor information is missing');
        navigate('/courses');
        return;
      }

      if (!userId) {
        console.error('❌ User ID is undefined or null - available keys:', user ? Object.keys(user) : 'No user');
        alert('User information is incomplete. Please log in again.');
        navigate('/login');
        return;
      }

      // Safe ID comparison with string conversion
      const instructorIdStr = instructorId.toString();
      const userIdStr = userId.toString();
      
      console.log('🔐 IDs match?', instructorIdStr === userIdStr);
      console.log('🔐 User is admin?', user.role === 'admin');

      // Check if user is the course instructor (with string conversion for reliable comparison)
      if (instructorIdStr !== userIdStr && user.role !== 'admin') {
        console.log('❌ User is not the course instructor and not admin');
        alert('You are not the instructor of this course');
        navigate('/courses');
        return;
      }

      setCourse(courseData);

      console.log('🔐 Fetching lessons data...');
      const lessonsResponse = await axios.get(`http://localhost:5000/api/lessons/course/${courseId}`, config);
      console.log('🔐 Lessons response:', lessonsResponse.data);

      setLessons(lessonsResponse.data.lessons || []);

    } catch (error) {
      console.error('❌ Error fetching course data:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        alert('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to access this course.');
        navigate('/courses');
      } else {
        alert(`Error loading course information: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.delete(`http://localhost:5000/api/lessons/${lessonId}`, config);
      alert('Lesson deleted successfully!');
      fetchCourseAndLessons(); // Refresh the list
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Error deleting lesson');
    }
  };

  const reorderLesson = async (lessonId, newOrder) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.put(`http://localhost:5000/api/lessons/${lessonId}`, { order: newOrder }, config);
      fetchCourseAndLessons(); // Refresh the list
    } catch (error) {
      console.error('Error reordering lesson:', error);
      alert('Error updating lesson order');
    }
  };

  // Enhanced access control with reliable ID comparison and null checks
  const getUserId = () => user?.id || user?._id || user?.userId;
  const userId = getUserId();
  
  const isAuthorized = user && 
    (user.role === 'instructor' || user.role === 'admin') && 
    userId && 
    (course ? (
      course.instructor && 
      course.instructor._id && 
      (course.instructor._id.toString() === userId.toString() || user.role === 'admin')
    ) : true);

  if (!isAuthorized) {
    console.log('🔐 Access denied - Debug info:', {
      userExists: !!user,
      userRole: user?.role,
      userId: userId,
      courseExists: !!course,
      instructorId: course?.instructor?._id,
      isAdmin: user?.role === 'admin'
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You are not authorized to manage this course.</p>
          <button 
            onClick={() => navigate('/courses')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link to="/courses" className="hover:text-blue-600">Courses</Link>
            <span>/</span>
            <Link to={`/courses/${courseId}`} className="hover:text-blue-600">{course.title}</Link>
            <span>/</span>
            <span className="text-gray-900">Manage Content</span>
          </nav>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Course Content</h1>
              <p className="text-gray-600 mt-2">Manage lessons for "{course.title}"</p>
            </div>
            <Link
              to={`/courses/${courseId}/add-lesson`}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Add New Lesson
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">{lessons.length}</div>
            <div className="text-sm text-gray-500">Total Lessons</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">
              {lessons.filter(l => l.isFree).length}
            </div>
            <div className="text-sm text-gray-500">Free Lessons</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">
              {lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Minutes</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-gray-900">
              {course.enrolledStudents?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Enrolled Students</div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Course Lessons</h3>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop to reorder lessons (feature coming soon)
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {lessons.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Lessons Yet</h4>
                <p className="text-gray-600 mb-4">Start by adding your first lesson to the course.</p>
                <Link
                  to={`/courses/${courseId}/add-lesson`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create First Lesson
                </Link>
              </div>
            ) : (
              lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                <div key={lesson._id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => reorderLesson(lesson._id, lesson.order - 1)}
                        disabled={lesson.order === 1}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {lesson.order}
                      </div>
                      <button
                        onClick={() => reorderLesson(lesson._id, lesson.order + 1)}
                        disabled={lesson.order === lessons.length}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{lesson.duration || 0} minutes</span>
                        <span>•</span>
                        <span>{lesson.resources?.length || 0} resources</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          lesson.isFree 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lesson.isFree ? 'Free' : 'Premium'}
                        </span>
                      </div>
                      {lesson.videoUrl && (
                        <div className="flex items-center text-sm text-blue-600 mt-1">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Contains video
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/courses/${courseId}/lessons/${lesson._id}`}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      View
                    </Link>
                    <Link
                      to={`/courses/${courseId}/edit-lesson/${lesson._id}`}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteLesson(lesson._id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to={`/courses/${courseId}`}
            className="bg-white p-6 rounded-lg shadow text-center hover:shadow-lg transition-shadow"
          >
            <h4 className="font-semibold text-gray-900 mb-2">View Course Page</h4>
            <p className="text-gray-600 text-sm">See how students will view your course</p>
          </Link>
          <Link
            to="/instructor"
            className="bg-white p-6 rounded-lg shadow text-center hover:shadow-lg transition-shadow"
          >
            <h4 className="font-semibold text-gray-900 mb-2">Instructor Dashboard</h4>
            <p className="text-gray-600 text-sm">View student progress and analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ManageCourseContent;