import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';

// Complete Course with Certificate Component - ADD THIS COMPONENT
const CompleteCourseWithCertificate = ({ courseId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCompleteCourse = async () => {
    if (!confirm('Complete this course and generate your certificate?')) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔄 Starting course completion with certificate generation...');

      // 1. Get all lessons for this course
      const lessonsResponse = await fetch(`/api/lessons/course/${courseId}`, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });
      
      const lessonsData = await lessonsResponse.json();
      
      if (!lessonsData.success) {
        throw new Error('Failed to fetch course lessons');
      }

      const lessons = lessonsData.lessons || [];
      console.log(`📚 Found ${lessons.length} lessons to complete`);

      // 2. Mark ALL lessons as completed
      console.log('✅ Marking all lessons as completed...');
      const completionPromises = lessons.map(lesson => 
        fetch(`/api/lessons/${lesson._id}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
          }
        }).then(response => response.json())
      );

      const completionResults = await Promise.all(completionPromises);
      console.log('📊 Lesson completion results:', completionResults);

      // 3. Generate certificate
      console.log('🎓 Generating certificate...');
      const certResponse = await fetch(`/api/certificates/generate/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });

      const certData = await certResponse.json();
      console.log('📜 Certificate generation result:', certData);

      if (certData.success) {
        alert('🎉 Course completed successfully! Your certificate has been generated.');
        
        // Call the original onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
        
        // Redirect to certificates page
        navigate('/my-certificates');
      } else {
        alert('❌ ' + certData.message);
        // Fallback to original navigation if certificate fails
        navigate(`/courses/${courseId}`);
      }

    } catch (error) {
      console.error('❌ Error completing course:', error);
      alert('Error completing course: ' + error.message);
      // Fallback to original navigation on error
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCompleteCourse}
      disabled={loading}
      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Completing...</span>
        </>
      ) : (
        <>
          <span>Complete Course</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </>
      )}
    </button>
  );
};

// Main Lesson Component - ORIGINAL CODE WITH MINIMAL CHANGES
const Lesson = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-course', courseId);

    return () => newSocket.close();
  }, [courseId]);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      console.log('📚 Fetching lesson data...');
      const [lessonResponse, courseResponse] = await Promise.all([
        axios.get(`/api/lessons/${lessonId}`),
        axios.get(`/api/courses/${courseId}`)
      ]);

      console.log('📦 Lesson data:', lessonResponse.data.lesson);
      console.log('📦 Course data:', courseResponse.data.course);

      setLesson(lessonResponse.data.lesson);
      setCourse(courseResponse.data.course);

      // Check if lesson is completed
      if (user) {
        try {
          const userResponse = await axios.get('/api/auth/me');
          const enrolledCourse = userResponse.data.user.enrolledCourses.find(
            ec => ec.course._id === courseId
          );
          if (enrolledCourse) {
            setCompleted(enrolledCourse.completedLessons.includes(lessonId));
          }
        } catch (userError) {
          console.log('⚠️ Could not fetch user completion status');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    try {
      await axios.post(`/api/lessons/${lessonId}/complete`);
      setCompleted(true);
      
      // Emit progress update via socket
      if (socket) {
        socket.emit('progress-update', {
          courseId,
          userId: user.id,
          progress: calculateProgress()
        });
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const calculateProgress = () => {
    if (!course || !user) return 0;
    // This would be calculated from the backend, but for demo:
    return Math.round((course.lessons.findIndex(l => l._id === lessonId) + 1) / course.lessons.length * 100);
  };

  const getNextLesson = () => {
    if (!course || !lesson) return null;
    const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
    return currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;
  };

  const getPrevLesson = () => {
    if (!course || !lesson) return null;
    const currentIndex = course.lessons.findIndex(l => l._id === lessonId);
    return currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  };

  // Function to get resource icon based on type
  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
      case 'video':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        );
      case 'code':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Lesson not found</h2>
          <Link to="/courses" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lesson Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link to="/courses" className="hover:text-blue-600">Courses</Link>
              <span>/</span>
              <Link to={`/courses/${courseId}`} className="hover:text-blue-600">{course.title}</Link>
              <span>/</span>
              <span className="text-gray-900">{lesson.title}</span>
            </nav>
            
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              {!completed && (
                <button
                  onClick={markAsCompleted}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Mark Complete
                </button>
              )}
              {completed && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Lesson Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Course Content</h3>
              <div className="space-y-2">
                {course.lessons?.map((courseLesson, index) => (
                  <Link
                    key={courseLesson._id}
                    to={`/courses/${courseId}/lessons/${courseLesson._id}`}
                    className={`block p-3 rounded-lg text-sm ${
                      courseLesson._id === lessonId
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        courseLesson._id === lessonId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="flex-1 truncate">{courseLesson.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {/* Video Placeholder */}
              {lesson.videoUrl && (
                <div className="mb-8">
                  <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg mb-4">
                    <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
                      <div className="text-center text-white">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <p>Video content would be displayed here</p>
                        <p className="text-sm opacity-75 mt-2">{lesson.videoUrl}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Content */}
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Lesson Content</h2>
                <div className="text-gray-700 leading-relaxed">
                  {lesson.content && lesson.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Resources Section - IMPROVED */}
              {lesson.resources && lesson.resources.length > 0 ? (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📚 Additional Resources</h3>
                  <p className="text-gray-600 mb-6">Downloadable materials and links to enhance your learning:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-shrink-0">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                            {resource.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1 truncate">
                            {resource.url}
                          </p>
                          {resource.type && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {resource.type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📚 Additional Resources</h3>
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p className="text-gray-500">No additional resources available for this lesson.</p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 pt-6 border-t flex justify-between">
                {prevLesson ? (
                  <Link
                    to={`/courses/${courseId}/lessons/${prevLesson._id}`}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    <span>Previous</span>
                  </Link>
                ) : (
                  <div></div>
                )}

                {nextLesson ? (
                  <Link
                    to={`/courses/${courseId}/lessons/${nextLesson._id}`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Next Lesson</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                ) : (
                  // ✅ CHANGED: This is the fixed "Complete Course" button with certificate generation
                  <CompleteCourseWithCertificate 
                    courseId={courseId}
                    onComplete={() => {
                      // Optional callback for any additional completion logic
                      console.log('Course completion with certificate finished');
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson;