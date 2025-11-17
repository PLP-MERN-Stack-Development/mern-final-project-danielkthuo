import React from 'react';
import { Routes, Route } from 'react-router-dom'; // ✅ REMOVE BrowserRouter from here
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Lesson from './pages/Lesson';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCourse from './pages/CreateCourse';
import InstructorDashboard from './pages/InstructorDashboard';
import AddLesson from './pages/AddLesson';
import ManageCourseContent from './pages/ManageCourseContent';
import EditLesson from './pages/EditLesson';
import { useAuth } from './contexts/AuthContext';
import MyCertificates from './pages/MyCertificates';
import StudentProgressDetails from './pages/StudentProgressDetails'; // Fixed import
import CourseAnalytics from './pages/CourseAnalytics';

function App() {
  const { user } = useAuth();

  return (
    // ✅ REMOVE BrowserRouter wrapper - it's already in main.jsx
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<Lesson />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
                path="/instructor/courses/:courseId/students/:studentId" 
                element={<StudentProgressDetails />} // Fixed component name
              />
          {/* Course Creation */}
          <Route path="/create-course" element={<CreateCourse />} />
          
          {/* Course Content Management */}
          <Route path="/courses/:courseId/add-lesson" element={<AddLesson />} />
          <Route path="/courses/:courseId/manage-content" element={<ManageCourseContent />} />
          <Route path="/courses/:courseId/edit-lesson/:lessonId" element={<EditLesson />} />
          <Route path="/courses/:courseId/analytics" element={<CourseAnalytics />} />
          {/* Instructor Routes */}
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <>
              <Route path="/instructor" element={<InstructorDashboard />} />
              <Route path="/instructor/courses/:courseId/students/:studentId" element={<StudentProgressDetails />} />
            </>
          )}
          
          {/* Student Dashboard */}
          {user && <Route path="/dashboard" element={<Dashboard />} />}
          
          {/* My Certificates */}
          <Route path="/my-certificates" element={<MyCertificates />} />
          
          {/* Temporarily commented out until we create the file */}
          {/* <Route path="/verify-certificate/:verificationCode" element={<VerifyCertificate />} /> */}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;