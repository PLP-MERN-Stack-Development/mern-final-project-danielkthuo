import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me');
      setEnrolledCourses(response.data.user.enrolledCourses || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course) => {
    const totalLessons = course.course?.lessons?.length || 0;
    const completedLessons = course.completedLessons?.length || 0;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}!</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Enrolled Courses</h3>
          <p className="text-3xl font-bold text-blue-600">{enrolledCourses.length}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Lessons</h3>
          <p className="text-3xl font-bold text-green-600">
            {enrolledCourses.reduce((total, course) => total + (course.completedLessons?.length || 0), 0)}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Progress</h3>
          <p className="text-3xl font-bold text-purple-600">
            {enrolledCourses.length > 0 
              ? Math.round(enrolledCourses.reduce((total, course) => total + calculateProgress(course), 0) / enrolledCourses.length)
              : 0}%
          </p>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
        </div>
        <div className="p-6">
          {enrolledCourses.length > 0 ? (
            <div className="space-y-6">
              {enrolledCourses.map((enrollment) => (
                <div key={enrollment.course._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{enrollment.course.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{enrollment.course.description}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(enrollment)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(enrollment)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <Link
                      to={`/courses/${enrollment.course._id}`}
                      className="btn-primary"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg mb-4">You haven't enrolled in any courses yet.</p>
              <Link
                to="/courses"
                className="btn-primary"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;