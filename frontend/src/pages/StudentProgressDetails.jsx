import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Award, 
  BarChart3, 
  Calendar,
  CheckCircle,
  PlayCircle,
  Users,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Mail
} from 'lucide-react';

const StudentProgressDetail = () => {
  const { courseId, studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchStudentProgressDetails();
  }, [courseId, studentId, retryCount]);

  const fetchStudentProgressDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      console.log('🔄 Fetching student progress...', { courseId, studentId });

      // Strategy 1: Try the primary endpoint first
      try {
        const response = await axios.get(
          `http://localhost:5000/api/instructor/courses/${courseId}/students/${studentId}/progress`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        console.log('📈 Student Progress API Response:', response.data);

        if (response.data.success) {
          setProgressData(response.data);
          return;
        } else {
          throw new Error(response.data.message || 'Failed to load progress details');
        }
      } catch (primaryError) {
        console.log('❌ Primary endpoint failed:', primaryError.response?.data);
        throw primaryError;
      }

    } catch (error) {
      console.error('❌ Error in primary fetch:', error);
      
      // Try alternative endpoints as fallback
      await tryAlternativeEndpoints();
    } finally {
      setLoading(false);
    }
  };

  const tryAlternativeEndpoints = async () => {
    const token = localStorage.getItem('token');
    const endpoints = [
      {
        url: `http://localhost:5000/api/instructor/courses/${courseId}/students-progress`,
        handler: (data) => findStudentInProgressList(data)
      },
      {
        url: `http://localhost:5000/api/enrollments/course/${courseId}/student/${studentId}`,
        handler: (data) => transformEnrollmentData(data)
      },
      {
        url: `http://localhost:5000/api/courses/${courseId}/enrollments`,
        handler: (data) => findStudentInEnrollments(data)
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying alternative endpoint: ${endpoint.url}`);
        const response = await axios.get(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        });

        if (response.data.success) {
          const processedData = endpoint.handler(response.data);
          if (processedData) {
            console.log('✅ Success with alternative endpoint:', endpoint.url);
            setProgressData(processedData);
            setError(''); // Clear any previous errors
            return;
          }
        }
      } catch (endpointError) {
        console.log(`❌ Endpoint ${endpoint.url} failed:`, endpointError.response?.data?.message);
        continue;
      }
    }

    // If all endpoints fail
    setError('Student progress not found. The student may not be enrolled in this course or the enrollment data is incomplete.');
  };

  const findStudentInProgressList = (data) => {
    const studentsProgress = data.studentProgress || data.data || [];
    const studentProgress = studentsProgress.find(
      progress => progress.student?.id === studentId || 
                 progress.student?._id === studentId ||
                 progress.studentId === studentId
    );
    
    if (studentProgress) {
      return {
        student: studentProgress.student,
        course: data.course || { _id: courseId },
        progress: studentProgress.progress || {
          percentage: studentProgress.percentage || 0,
          completedLessons: studentProgress.completedLessons || 0,
          totalLessons: studentProgress.totalLessons || 0,
          timeSpent: studentProgress.timeSpent || 0
        },
        enrollment: {
          status: studentProgress.status || 'enrolled',
          enrolledAt: studentProgress.enrolledAt || new Date().toISOString()
        }
      };
    }
    return null;
  };

  const transformEnrollmentData = (data) => {
    const enrollment = data.enrollment || data.data;
    if (enrollment) {
      return {
        student: enrollment.student,
        course: enrollment.course,
        progress: {
          percentage: enrollment.progress || 0,
          completedLessons: enrollment.completedLessons?.length || 0,
          totalLessons: enrollment.course?.lessons?.length || 0,
          timeSpent: enrollment.timeSpent || 0,
          lastActivity: enrollment.updatedAt
        },
        enrollment: {
          status: enrollment.status || 'enrolled',
          enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
          completedLessons: enrollment.completedLessons || []
        }
      };
    }
    return null;
  };

  const findStudentInEnrollments = (data) => {
    const enrollments = data.enrollments || data.data || [];
    const enrollment = enrollments.find(
      enroll => enroll.student?.id === studentId || 
               enroll.student?._id === studentId ||
               enroll.studentId === studentId
    );
    
    if (enrollment) {
      return transformEnrollmentData({ enrollment });
    }
    return null;
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const sendMessageToStudent = () => {
    if (progressData?.student?.email) {
      window.location.href = `mailto:${progressData.student.email}?subject=Regarding your progress in ${progressData.course?.title || 'the course'}`;
    }
  };

  const ProgressBar = ({ progress, size = 'lg' }) => {
    const height = size === 'sm' ? 'h-2' : 'h-3';
    const textSize = size === 'sm' ? 'text-sm' : 'text-base';
    
    return (
      <div className="flex items-center gap-3">
        <div className={`w-32 bg-gray-200 rounded-full ${height}`}>
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, height: '100%' }}
          ></div>
        </div>
        <span className={`font-semibold text-gray-900 ${textSize}`}>
          {progress}%
        </span>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      enrolled: { label: 'Enrolled', class: 'bg-blue-100 text-blue-800' },
      'in-progress': { label: 'In Progress', class: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', class: 'bg-purple-100 text-purple-800' },
      dropped: { label: 'Dropped', class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.enrolled;
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student progress details...</p>
          {retryCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>
          )}
        </div>
      </div>
    );
  }

  if (error && !progressData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Data Unavailable</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting Tips:</h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Verify the student is enrolled in this course</li>
                <li>Check if the course and student IDs are correct</li>
                <li>Ensure enrollment records exist in the database</li>
                <li>Contact system administrator if issue persists</li>
              </ul>
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg mb-6">
              <p><strong>Course ID:</strong> {courseId}</p>
              <p><strong>Student ID:</strong> {studentId}</p>
              <p><strong>Retry Attempts:</strong> {retryCount}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              <button
                onClick={() => navigate('/instructor/dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progressData) {
    return null;
  }

  const { student, course, progress, enrollment } = progressData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Progress Details</h1>
                <p className="text-gray-600">Detailed view of student performance and progress</p>
              </div>
            </div>
            
            {/* Debug Info */}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Limited data available</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student & Course Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    {student?.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-16 h-16 rounded-xl"
                      />
                    ) : (
                      <span className="text-blue-600 font-bold text-xl">
                        {student?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{student?.name || 'Unknown Student'}</h2>
                    <p className="text-gray-600">{student?.email || 'No email available'}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Enrolled on {new Date(enrollment?.enrolledAt || new Date()).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={enrollment?.status || 'enrolled'} />
                  <button
                    onClick={sendMessageToStudent}
                    disabled={!student?.email}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Contact
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{course?.title || 'Course Title'}</h3>
                <p className="text-gray-600">{course?.description || 'No description available'}</p>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {progress?.completedLessons || 0} / {progress?.totalLessons || 0}
                  </div>
                  <div className="text-sm text-gray-600">Lessons Completed</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {progress?.percentage || progress?.progressPercentage || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Progress</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {progress?.timeSpent || progress?.estimatedTimeSpent || 0}
                  </div>
                  <div className="text-sm text-gray-600">Minutes Spent</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Course Progress</span>
                  <ProgressBar progress={progress?.percentage || progress?.progressPercentage || 0} size="sm" />
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last Activity</span>
                  <span>{new Date(progress?.lastActivity || new Date()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Lesson Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Lesson Progress</h3>
              
              <div className="space-y-4">
                {enrollment?.completedLessons && enrollment.completedLessons.length > 0 ? (
                  enrollment.completedLessons.map((lesson, index) => (
                    <div key={lesson._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {lesson.lesson?.title || `Lesson ${index + 1}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            Completed on {new Date(lesson.completedAt || new Date()).toLocaleDateString()}
                            {lesson.score && ` • Score: ${lesson.score}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {lesson.lesson?.duration ? `${lesson.lesson.duration} min` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <PlayCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No lessons completed yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - All original functionality preserved */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Completion Rate</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {progress?.totalLessons ? Math.round(((progress.completedLessons || 0) / progress.totalLessons) * 100) : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Average Time/Lesson</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {(progress?.completedLessons && progress.completedLessons > 0) 
                      ? Math.round((progress.timeSpent || progress.estimatedTimeSpent || 0) / progress.completedLessons) 
                      : 0
                    } min
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Days Since Enrollment</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {Math.floor((new Date() - new Date(enrollment?.enrolledAt || new Date())) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </div>

            {/* Course Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <Link
                  to="/instructor/dashboard"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                    Back to Dashboard
                  </span>
                </Link>
                
                {courseId && (
                  <Link
                    to={`/courses/${courseId}/manage-content`}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <Award className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">
                      Manage Course Content
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Course Enrollment</div>
                    <div className="text-gray-500">
                      {new Date(enrollment?.enrolledAt || new Date()).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {enrollment?.completedLessons && enrollment.completedLessons.slice(-3).map((lesson, index) => (
                  <div key={lesson._id || index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        Completed: {lesson.lesson?.title || `Lesson`}
                      </div>
                      <div className="text-gray-500">
                        {new Date(lesson.completedAt || new Date()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressDetail;