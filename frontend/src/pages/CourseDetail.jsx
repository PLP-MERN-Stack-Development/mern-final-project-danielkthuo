import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/${id}`);
      setCourse(response.data.course);
      
      // Check if user is enrolled
      if (user) {
        const userResponse = await axios.get('http://localhost:5000/api/auth/me');
        const userData = userResponse.data.user;
        const isEnrolled = userData.enrolledCourses?.some(
          ec => ec.course._id === id
        );
        setEnrolled(isEnrolled);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/courses/${id}/enroll`);
      
      if (response.data.success) {
        setEnrolled(true);
        alert('Successfully enrolled in the course!');
        // Refresh the course data to get updated enrollment info
        fetchCourse();
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      // Show detailed error message
      const errorMessage = error.response?.data?.message || 'Error enrolling in course. Please try again.';
      alert(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Course Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex-1">
              <span className="inline-block px-3 py-1 bg-blue-600 rounded-full text-sm font-semibold mb-4">
                {course.level}
              </span>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl text-gray-300 mb-6">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-300">
                <span>By {course.instructor?.name}</span>
                <span>•</span>
                <span>{course.lessons?.length || 0} lessons</span>
                <span>•</span>
                <span>{course.enrolledStudents?.length || 0} students</span>
              </div>
            </div>
            <div className="mt-6 md:mt-0 md:ml-8">
              <div className="bg-white text-gray-900 rounded-lg p-6 shadow-lg w-80">
                <div className="text-3xl font-bold text-center mb-4">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </div>
                {enrolled ? (
                  <Link
                    to={`/courses/${course._id}/lessons/${course.lessons?.[0]?._id || ''}`}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors block text-center"
                  >
                    Continue Learning
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
                <div className="mt-4 text-sm text-gray-600 text-center">
                  {enrolled ? 'You are enrolled in this course' : 'Lifetime access'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* What you'll learn */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {course.learningOutcomes?.map((outcome, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Curriculum */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Content</h2>
              <div className="space-y-2">
                {course.lessons?.map((lesson, index) => (
                  <div key={lesson._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-sm text-gray-500">
                          {lesson.duration} min • {lesson.isFree ? 'Free' : 'Premium'}
                        </p>
                      </div>
                    </div>
                    {enrolled && (
                      <Link
                        to={`/courses/${course._id}/lessons/${lesson._id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Start
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {course.requirements?.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructor</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {course.instructor?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{course.instructor?.name}</h4>
                  <p className="text-sm text-gray-600">{course.instructor?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Management Section - Added in the correct location */}
        {course && user && (user.role === 'instructor' || user.role === 'admin') && course.instructor._id === user.id && (
          <div className="mt-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Course Management</h3>
                  <p className="text-blue-700">As the instructor, you can manage the course content and track student progress.</p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    to={`/courses/${course._id}/manage-content`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Manage Lessons
                  </Link>
                  <Link
                    to={`/courses/${course._id}/add-lesson`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Add New Lesson
                  </Link>
                  <Link
                    to="/instructor"
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors font-medium"
                  >
                    View Analytics
                  </Link>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-gray-900">{course.lessons?.length || 0}</div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-gray-900">{course.enrolledStudents?.length || 0}</div>
                  <div className="text-sm text-gray-600">Enrolled Students</div>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {course.lessons?.filter(lesson => lesson.isFree).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Free Lessons</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;