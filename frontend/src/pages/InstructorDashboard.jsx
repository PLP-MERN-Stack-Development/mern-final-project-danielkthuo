import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import { 
  Users, 
  BookOpen, 
  Award, 
  TrendingUp, 
  BarChart3,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Plus,
  Settings
} from 'lucide-react';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [apiErrors, setApiErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedSummaryCourse, setSelectedSummaryCourse] = useState('');
  const [courseStudents, setCourseStudents] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [enrollmentDetails, setEnrollmentDetails] = useState({});

  // Fetch course students function
  const fetchCourseStudents = async (courseId) => {
    try {
      setSummaryLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/instructor/courses/${courseId}/students-progress`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const studentProgress = response.data.studentProgress || [];
        
        const transformedStudents = studentProgress.map(item => ({
          _id: item.student?.id,
          name: item.student?.name || 'Unknown Student',
          email: item.student?.email,
          avatar: item.student?.avatar,
          progress: item.progress?.percentage || 0,
          enrollmentStatus: item.progress?.percentage === 100 ? 'completed' : 'in-progress',
          enrolledAt: item.enrolledAt || new Date().toISOString(),
          completedLessons: item.progress?.completedLessons || 0,
          totalLessons: item.progress?.totalLessons || 0
        }));
        
        setCourseStudents(transformedStudents);
      } else {
        setCourseStudents([]);
      }
    } catch (error) {
      console.error('Error fetching course students:', error);
      const course = courses.find(c => c._id === courseId);
      if (course && course.enrolledStudents) {
        const fallbackStudents = course.enrolledStudents.map(student => ({
          _id: student._id || student.id,
          name: student.name || 'Unknown Student',
          email: student.email,
          progress: student.progress || 0,
          enrollmentStatus: student.progress === 100 ? 'completed' : 'in-progress',
          enrolledAt: student.enrolledAt || new Date().toISOString()
        }));
        setCourseStudents(fallbackStudents);
      } else {
        setCourseStudents([]);
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  // Compact Course Student Row Component
  const CompactCourseStudentRow = ({ student, courseId }) => {
    const studentName = student.name || 'Unknown Student';
    const progress = student.progress || 0;
    const status = student.enrollmentStatus || 'in-progress';
    const enrolledDate = student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

    return (
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {student.avatar ? (
                <img
                  className="w-8 h-8 rounded-full"
                  src={student.avatar}
                  alt={studentName}
                />
              ) : (
                <span className="text-blue-600 font-semibold text-sm">
                  {studentName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                {studentName}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[120px]">
                {student.email || 'No email'}
              </div>
            </div>
          </div>
        </td>
        
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">{progress}%</span>
          </div>
        </td>
        
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {status === 'completed' ? 'Done' : 'Active'}
          </span>
        </td>
        
        <td className="px-4 py-3">
          <div className="text-xs text-gray-900">{enrolledDate}</div>
        </td>
        
        <td className="px-4 py-3">
          <button
            onClick={() => navigate(`/instructor/courses/${courseId}/students/${student._id}`)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium"
            title="View Progress"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        </td>
      </tr>
    );
  };

  // Progress Bar Component
  const ProgressBar = ({ progress }) => (
    <div className="flex items-center gap-3">
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-sm font-medium text-gray-700 min-w-8">{progress}%</span>
    </div>
  );

  const handleStudentViewDetails = (student) => {
    console.log('👀 Viewing student details:', student._id, student.name);
    
    if (student.enrollments && student.enrollments.length > 0) {
      const firstEnrollment = student.enrollments[0];
      const courseId = firstEnrollment.courseId || firstEnrollment.course?._id;
      
      if (courseId) {
        console.log('🎯 Navigating to student progress:', courseId, student._id);
        navigate(`/instructor/courses/${courseId}/students/${student._id}`);
      } else {
        console.log('⚠️ No course ID found, showing modal');
        setSelectedStudent(student);
      }
    } else {
      console.log('📝 No enrollments, showing student profile');
      setSelectedStudent(student);
      alert(`Student: ${student.name}\nEmail: ${student.email}\nNo course enrollments found.`);
    }
  };

  // Debug API endpoints
  const debugApiEndpoints = async () => {
    const token = localStorage.getItem('token');
    console.log('🔍 Starting API Debug...');
    
    try {
      console.log('📋 Testing /api/students endpoint...');
      const studentsResponse = await axios.get('http://localhost:5000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('👥 Students API Response:', studentsResponse.data);
      
      console.log('📚 Testing /api/instructor/my-courses endpoint...');
      const coursesResponse = await axios.get('http://localhost:5000/api/instructor/my-courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('🎯 Courses API Response:', coursesResponse.data);
      
      console.log('👤 Current User:', user);
      
    } catch (error) {
      console.error('❌ API Debug Error:', error.response?.data || error.message);
    }
  };

  const fetchEnrollmentDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/enrollments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const enrollments = response.data.enrollments || [];
        const enrollmentMap = {};
        
        enrollments.forEach(enrollment => {
          const studentId = enrollment.student?._id || enrollment.student;
          const courseId = enrollment.course?._id || enrollment.course;
          
          if (studentId && courseId) {
            if (!enrollmentMap[studentId]) {
              enrollmentMap[studentId] = {};
            }
            enrollmentMap[studentId][courseId] = {
              enrolledAt: enrollment.enrolledAt,
              progress: enrollment.progress || 0,
              status: enrollment.status || 'enrolled',
              completedLessons: enrollment.completedLessons || []
            };
          }
        });
        
        setEnrollmentDetails(enrollmentMap);
      }
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
    }
  };

  useEffect(() => {
    debugApiEndpoints();
    fetchInstructorCourses();
    fetchAllStudents();
    fetchEnrollmentDetails();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      setApiErrors(prev => ({ ...prev, courses: null }));
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/instructor/my-courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setCourses(response.data.courses || []);
      } else {
        throw new Error(response.data.message || 'Failed to load courses');
      }
    } catch (error) {
      console.error('❌ Error fetching instructor courses:', error);
      setApiErrors(prev => ({ 
        ...prev, 
        courses: error.response?.data?.message || error.message || 'Failed to load courses' 
      }));
    }
  };

  const fetchAllStudents = async () => {
    try {
      setApiErrors(prev => ({ ...prev, students: null }));
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const studentsData = response.data.students || [];
        const normalizedStudents = studentsData.map(normalizeStudentData);
        setStudents(normalizedStudents);
      } else {
        throw new Error(response.data.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setApiErrors(prev => ({ 
        ...prev, 
        students: error.response?.data?.message || error.message || 'Failed to load students' 
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const normalizeStudentData = (student) => {
    console.log('🛠️ Normalizing student:', student._id, student.name);

    if (student.stats && typeof student.stats === 'object') {
      console.log('✅ Student already has stats structure');
      return student;
    }

    const enrollments = student.enrollments || student.courses || student.enrolledCourses || [];
    console.log('📋 Student enrollments:', enrollments);

    const completedEnrollments = enrollments.filter(e => 
      e.status === 'completed' || e.progress === 100 || e.completed === true
    );
    
    const inProgressEnrollments = enrollments.filter(e => 
      e.status === 'in-progress' || (e.progress > 0 && e.progress < 100) || e.status === 'active'
    );
    
    const averageProgress = enrollments.length > 0 
      ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
      : 0;

    const courseEnrollments = enrollments.map(enrollment => ({
      courseId: enrollment.courseId || enrollment.course?._id,
      courseTitle: enrollment.course?.title,
      enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
      progress: enrollment.progress || 0,
      status: enrollment.status || 'enrolled',
      completedLessons: enrollment.completedLessons || []
    }));

    const normalizedStudent = {
      ...student,
      stats: {
        totalEnrollments: enrollments.length,
        completedCourses: completedEnrollments.length,
        activeEnrollments: inProgressEnrollments.length,
        averageProgress: averageProgress
      },
      enrollments: enrollments,
      courseEnrollments: courseEnrollments
    };

    console.log('🔄 Normalized student stats:', normalizedStudent.stats);
    return normalizedStudent;
  };

  const fetchStudentProgress = async (courseId) => {
    try {
      setApiErrors(prev => ({ ...prev, progress: null }));
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/instructor/courses/${courseId}/students-progress`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setStudentProgress(response.data);
      setSelectedCourse(courseId);
      setActiveTab('courses');
    } catch (error) {
      console.error('Error fetching student progress:', error);
      setApiErrors(prev => ({ 
        ...prev, 
        progress: error.response?.data?.message || 'Failed to load student progress' 
      }));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInstructorCourses();
    fetchAllStudents();
    fetchEnrollmentDetails();
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ? true :
                         filterStatus === 'active' ? (student.stats?.activeEnrollments > 0) :
                         (student.stats?.activeEnrollments === 0);
    
    const matchesCourse = selectedCourseFilter === 'all' ? true :
                         student.courseEnrollments?.some(enrollment => 
                           enrollment.courseId === selectedCourseFilter
                         ) || false;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc' 
        ? (a.name || '').localeCompare(b.name || '')
        : (b.name || '').localeCompare(a.name || '');
    }
    if (sortConfig.key === 'progress') {
      return sortConfig.direction === 'asc'
        ? (a.stats?.averageProgress || 0) - (b.stats?.averageProgress || 0)
        : (b.stats?.averageProgress || 0) - (a.stats?.averageProgress || 0);
    }
    if (sortConfig.key === 'enrollments') {
      return sortConfig.direction === 'asc'
        ? (a.stats?.totalEnrollments || 0) - (b.stats?.totalEnrollments || 0)
        : (b.stats?.totalEnrollments || 0) - (a.stats?.totalEnrollments || 0);
    }
    return 0;
  });

  const calculateStats = (studentsData, coursesData) => {
    if (!studentsData || studentsData.length === 0) {
      return {
        totalStudents: 0,
        totalEnrollments: 0,
        completedCourses: 0,
        averageProgress: 0,
        activeStudents: 0
      };
    }

    let totalEnrollments = 0;
    let completedCourses = 0;
    let totalProgress = 0;
    let activeStudents = 0;

    studentsData.forEach((student) => {
      if (student.stats?.totalEnrollments) {
        totalEnrollments += student.stats.totalEnrollments;
      } else if (student.enrollments) {
        totalEnrollments += student.enrollments.length;
      } else if (student.courses) {
        totalEnrollments += student.courses.length;
      }

      if (student.stats?.completedCourses) {
        completedCourses += student.stats.completedCourses;
      } else if (student.enrollments) {
        completedCourses += student.enrollments.filter(e => 
          e.status === 'completed' || e.progress === 100 || e.completed === true
        ).length;
      }

      if (student.stats?.averageProgress) {
        totalProgress += student.stats.averageProgress;
      } else if (student.enrollments && student.enrollments.length > 0) {
        const avg = student.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / student.enrollments.length;
        totalProgress += avg;
      } else {
        totalProgress += 0;
      }

      if (student.stats?.activeEnrollments > 0) {
        activeStudents++;
      } else if (student.enrollments?.some(e => 
        e.status === 'in-progress' || (e.progress > 0 && e.progress < 100) || e.status === 'active'
      )) {
        activeStudents++;
      } else if (student.stats?.averageProgress > 0 && student.stats.averageProgress < 100) {
        activeStudents++;
      }
    });

    const totalEnrollmentsFromCourses = coursesData.reduce((sum, course) => 
      sum + (course.enrolledStudents?.length || 0), 0
    );

    const finalEnrollments = Math.max(totalEnrollments, totalEnrollmentsFromCourses);

    return {
      totalStudents: studentsData.length,
      totalEnrollments: finalEnrollments,
      completedCourses: completedCourses,
      averageProgress: studentsData.length > 0 ? Math.round(totalProgress / studentsData.length) : 0,
      activeStudents: activeStudents
    };
  };

  const overallStats = calculateStats(students, courses);

  const ApiDebugInfo = () => (
    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Data Debug Information</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="mt-2 text-xs text-yellow-700 space-y-1">
        <div><strong>Students Loaded:</strong> {students.length}</div>
        <div><strong>Courses Loaded:</strong> {courses.length}</div>
        <div><strong>Total Enrollments:</strong> {overallStats.totalEnrollments}</div>
        <div><strong>Completed Courses:</strong> {overallStats.completedCourses}</div>
        <div><strong>Active Students:</strong> {overallStats.activeStudents}</div>
        <div><strong>Average Progress:</strong> {overallStats.averageProgress}%</div>
      </div>
      {Object.keys(apiErrors).map(key => 
        apiErrors[key] && (
          <div key={key} className="mt-1 text-xs text-red-600">
            <strong>{key}:</strong> {apiErrors[key]}
          </div>
        )
      )}
    </div>
  );

  const EmptyStudentsState = () => (
    <div className="text-center py-12">
      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
      <p className="text-gray-500 mb-4">
        {apiErrors.students 
          ? `Error: ${apiErrors.students}` 
          : "There are no students enrolled in your courses yet."}
      </p>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh Data
      </button>
    </div>
  );

  const EmptyCoursesState = () => (
    <div className="text-center py-12">
      <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
      <p className="text-gray-500 mb-4">
        {apiErrors.courses 
          ? `Error: ${apiErrors.courses}` 
          : "You haven't created any courses yet."}
      </p>
      <Link
        to="/create-course"
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <BookOpen className="w-4 h-4" />
        Create Your First Course
      </Link>
    </div>
  );

  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Instructor access required.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-gray-600 mt-2">Track your students' progress and course performance</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* API Debug Info */}
        {(Object.keys(apiErrors).some(key => apiErrors[key]) || students.length === 0 || courses.length === 0) && (
          <ApiDebugInfo />
        )}

        {/* Navigation Tabs - Student tab removed */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Overview
                {overallStats.totalStudents > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                    {overallStats.totalStudents}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                My Courses
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {courses.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('course-summary')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'course-summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Award className="w-4 h-4 inline mr-2" />
                Course Summary
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {courses.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Compact Statistics Header - Single Line */}
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Students</p>
                    <p className="text-lg font-bold text-gray-900">{overallStats.totalStudents}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Enrollments</p>
                    <p className="text-lg font-bold text-gray-900">{overallStats.totalEnrollments}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="text-lg font-bold text-gray-900">{overallStats.completedCourses}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Progress</p>
                    <p className="text-lg font-bold text-gray-900">{overallStats.averageProgress}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-lg font-bold text-gray-900">{overallStats.activeStudents}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {courses.length} courses • {students.length} students
                </span>
              </div>
            </div>

            {/* Enhanced Compact Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Recent Student Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {students.length} total
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {students.length > 0 ? (
                    students.slice(0, 6).map((student) => (
                      <div key={student._id} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 transition-colors first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="text-blue-600 font-semibold text-sm">
                                {student.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{student.name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500 truncate">{student.email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">{student.stats?.averageProgress || 0}%</p>
                              <p className="text-xs text-gray-500">
                                {student.stats?.totalEnrollments || 0} enrollments
                              </p>
                            </div>
                            <button
                              onClick={() => handleStudentViewDetails(student)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No student activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Course Overview</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {courses.length} total
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {courses.length > 0 ? (
                    courses.slice(0, 8).map((course) => {
                      const enrollmentCount = course.enrolledStudents?.length || 0;
                      const maxEnrollments = Math.max(...courses.map(c => c.enrolledStudents?.length || 0), 1);
                      const enrollmentPercentage = (enrollmentCount / maxEnrollments) * 100;
                      
                      return (
                        <div 
                          key={course._id} 
                          className="py-3 px-2 hover:bg-gray-50 transition-colors cursor-pointer group first:pt-0 last:pb-0"
                          onClick={() => {
                            setSelectedCourse(course._id);
                            setActiveTab('courses');
                            fetchStudentProgress(course._id);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors mb-1">
                                {course.title}
                              </p>
                              
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${enrollmentPercentage}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                                  {enrollmentCount}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {course.lessons?.length || 0}
                                </span>
                                {course.category && (
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                    {course.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                enrollmentCount > 0 ? 'bg-green-400' : 'bg-gray-300'
                              }`} />
                              <Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No courses created</p>
                      <Link
                        to="/create-course"
                        className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Create first course
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats & Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Overview
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Progress Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { range: '0-25%', color: 'bg-red-500', count: students.filter(s => (s.stats?.averageProgress || 0) <= 25).length },
                        { range: '26-50%', color: 'bg-yellow-500', count: students.filter(s => (s.stats?.averageProgress || 0) > 25 && (s.stats?.averageProgress || 0) <= 50).length },
                        { range: '51-75%', color: 'bg-blue-500', count: students.filter(s => (s.stats?.averageProgress || 0) > 50 && (s.stats?.averageProgress || 0) <= 75).length },
                        { range: '76-100%', color: 'bg-green-500', count: students.filter(s => (s.stats?.averageProgress || 0) > 75).length }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{item.range}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{item.count}</span>
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${item.color}`}
                                style={{ 
                                  width: `${students.length > 0 ? (item.count / students.length) * 100 : 0}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <Link
                        to="/create-course"
                        className="flex items-center gap-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Course
                      </Link>
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full text-left disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Summary Tab */}
        {activeTab === 'course-summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Course Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">Select a course to view student progress</p>
                </div>
                
                <div className="flex gap-3 items-center">
                  <select
                    value={selectedSummaryCourse}
                    onChange={(e) => {
                      setSelectedSummaryCourse(e.target.value);
                      if (e.target.value) {
                        fetchCourseStudents(e.target.value);
                      } else {
                        setCourseStudents([]);
                      }
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[250px] text-sm"
                  >
                    <option value="">Choose a course...</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.enrolledStudents?.length || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedSummaryCourse && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{courseStudents.length}</div>
                  <div className="text-xs text-gray-600 mt-1">Total</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {courseStudents.filter(s => s.enrollmentStatus === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Completed</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {courseStudents.filter(s => s.enrollmentStatus === 'in-progress').length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">In Progress</div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {courseStudents.length > 0 
                      ? Math.round(courseStudents.reduce((sum, student) => sum + (student.progress || 0), 0) / courseStudents.length)
                      : 0
                    }%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Avg Progress</div>
                </div>
              </div>
            )}

            {selectedSummaryCourse ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {summaryLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading students...</p>
                  </div>
                ) : courseStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {courseStudents.map((student) => (
                          <CompactCourseStudentRow 
                            key={student._id} 
                            student={student} 
                            courseId={selectedSummaryCourse}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No students enrolled in this course</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Course</h3>
                <p className="text-sm text-gray-600">
                  Choose a course from the dropdown to view student progress and enrollment details.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Courses</p>
                    <p className="text-lg font-bold text-gray-900">{courses.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Students</p>
                    <p className="text-lg font-bold text-gray-900">
                      {courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Lessons</p>
                    <p className="text-lg font-bold text-gray-900">
                      {courses.reduce((sum, course) => sum + (course.lessons?.length || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Active</p>
                    <p className="text-lg font-bold text-gray-900">
                      {courses.filter(course => course.enrolledStudents?.length > 0).length}
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/create-course"
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Course
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  {courses.length} total
                </span>
              </div>

              {courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {courses.map(course => (
                    <div
                      key={course._id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                      onClick={() => fetchStudentProgress(course._id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                            {course.title}
                          </h4>
                          {course.category && (
                            <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {course.category}
                            </span>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 mt-1 ${
                          course.enrolledStudents?.length > 0 ? 'bg-green-400' : 'bg-gray-300'
                        }`} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{course.enrolledStudents?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{course.lessons?.length || 0}</span>
                        </div>
                      </div>

                      {course.enrolledStudents?.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-semibold text-gray-900">
                              {Math.round(
                                course.enrolledStudents.reduce((sum, student) => 
                                  sum + (student.progress || 0), 0
                                ) / course.enrolledStudents.length
                              )}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.round(
                                  course.enrolledStudents.reduce((sum, student) => 
                                    sum + (student.progress || 0), 0
                                  ) / course.enrolledStudents.length
                                )}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-1 pt-1">
                        <Link
                          to={`/courses/${course._id}/manage-content`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-center px-1.5 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          title="Manage Course"
                        >
                          Manage
                        </Link>
                        <Link
                          to={`/courses/${course._id}/analytics`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-center px-1.5 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                          title="View Analytics"
                        >
                          Stats
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyCoursesState />
              )}
            </div>

            {selectedCourse && studentProgress && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold mb-1">
                        {studentProgress.course?.title || 'Course Title'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {studentProgress.course?.totalStudents || 0} students • {studentProgress.analytics?.averageProgress || 0}% avg progress
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {studentProgress.analytics?.completedStudents || 0}
                      </div>
                      <div className="text-blue-100 text-sm">Completed</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Student Progress</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {studentProgress.studentProgress?.map((studentData, index) => (
                      <div key={studentData.student?.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-xs">
                              {studentData.student?.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {studentData.student?.name || 'Unknown Student'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {studentData.progress?.percentage || 0}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {studentData.progress?.completedLessons || 0}/{studentData.progress?.totalLessons || 0}
                            </div>
                          </div>
                          
                          <Link
                            to={`/instructor/courses/${selectedCourse}/students/${studentData.student.id}`}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {(!studentProgress.studentProgress || studentProgress.studentProgress.length === 0) && (
                    <div className="text-center py-6">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No students enrolled in this course</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;