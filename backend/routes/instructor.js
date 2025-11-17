import express from 'express';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get instructor dashboard analytics
router.get('/dashboard', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('enrolledStudents', 'name email')
      .populate('lessons');

    const analytics = {
      totalCourses: courses.length,
      publishedCourses: courses.filter(course => course.isPublished).length,
      totalStudents: courses.reduce((acc, course) => acc + course.enrolledStudents.length, 0),
      totalRevenue: courses.reduce((acc, course) => acc + (course.price * course.enrolledStudents.length), 0),
      totalLessons: courses.reduce((acc, course) => acc + course.lessons.length, 0),
      courses: courses.map(course => ({
        _id: course._id,
        title: course.title,
        students: course.enrolledStudents.length,
        revenue: course.price * course.enrolledStudents.length,
        lessons: course.lessons.length,
        isPublished: course.isPublished,
        createdAt: course.createdAt
      }))
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get student progress for a specific course
router.get('/courses/:courseId/students-progress', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .populate('instructor', 'name email')
      .populate('lessons')
      .populate('enrolledStudents', 'name email enrolledCourses');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the course instructor
    if (course.instructor._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not the instructor of this course'
      });
    }

    // Get student progress data
    const studentProgress = await Promise.all(
      course.enrolledStudents.map(async (student) => {
        const enrolledCourse = student.enrolledCourses.find(
          ec => ec.course.toString() === courseId
        );

        return {
          student: {
            id: student._id,
            name: student.name,
            email: student.email
          },
          progress: {
            percentage: enrolledCourse?.progress || 0,
            completedLessons: enrolledCourse?.completedLessons?.length || 0,
            totalLessons: course.lessons.length,
            timeSpent: Math.floor(Math.random() * 120) + 30, // Mock data
            lastActivity: enrolledCourse?.updatedAt || student.createdAt
          }
        };
      })
    );

    const analytics = {
      totalEnrolled: course.enrolledStudents.length,
      completedStudents: studentProgress.filter(sp => sp.progress.percentage === 100).length,
      averageProgress: studentProgress.length > 0 
        ? Math.round(studentProgress.reduce((acc, sp) => acc + sp.progress.percentage, 0) / studentProgress.length)
        : 0
    };

    res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        totalLessons: course.lessons.length,
        totalStudents: course.enrolledStudents.length
      },
      studentProgress,
      analytics
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// Get detailed progress for a specific student in a course - ENHANCED DEBUGGING
router.get('/courses/:courseId/students/:studentId', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    console.log('🔍 ========== FETCHING STUDENT PROGRESS ==========');
    console.log('📌 Course ID:', courseId);
    console.log('📌 Student ID:', studentId);
    console.log('👤 Request User ID:', req.user.id);

    // Verify the course exists
    const course = await Course.findById(courseId)
      .populate('lessons', 'title order duration');
    
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('✅ Course found:', course.title);
    console.log('👨‍🏫 Course Instructor:', course.instructor.toString());
    console.log('📚 Total lessons in course:', course.lessons.length);

    // Check if user is the course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('❌ User is not instructor of this course');
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the instructor of this course'
      });
    }

    console.log('✅ User authorized');

    // Find the student
    const student = await User.findById(studentId)
      .select('name email enrolledCourses');

    if (!student) {
      console.log('❌ Student not found');
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('✅ Student found:', student.name);
    console.log('📊 Student enrolled in', student.enrolledCourses.length, 'courses');

    // Debug: Log all enrolled courses
    student.enrolledCourses.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. Course: ${enrollment.course.toString()}, Progress: ${enrollment.progress}%`);
    });

    // Find the specific course enrollment
    const enrollment = student.enrolledCourses.find(
      enrolled => enrolled.course.toString() === courseId
    );

    if (!enrollment) {
      console.log('❌ Student is not enrolled in this course');
      console.log('🔍 Looking for courseId:', courseId);
      console.log('🔍 Available enrollments:', student.enrolledCourses.map(e => e.course.toString()));
      
      return res.status(404).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    console.log('✅ Enrollment found');
    console.log('📈 Progress:', enrollment.progress + '%');
    console.log('✅ Completed lessons:', enrollment.completedLessons.length);
    console.log('📅 Enrolled at:', enrollment.enrolledAt);

    // Calculate progress
    const totalLessons = course.lessons.length;
    const completedLessons = enrollment.completedLessons.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    console.log('📊 Final progress calculation:', `${completedLessons}/${totalLessons} = ${progress}%`);

    // Get completed lesson details
    const completedLessonDetails = await Lesson.find({
      _id: { $in: enrollment.completedLessons }
    }).select('title order duration').sort('order');

    // Get all lessons with completion status
    const allLessonsWithStatus = course.lessons.map(lesson => ({
      _id: lesson._id,
      title: lesson.title,
      order: lesson.order,
      duration: lesson.duration,
      isCompleted: enrollment.completedLessons.some(
        completedId => completedId.toString() === lesson._id.toString()
      )
    })).sort((a, b) => a.order - b.order);

    const response = {
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email
        },
        course: {
          _id: course._id,
          title: course.title,
          totalLessons: totalLessons
        },
        progress: {
          percentage: progress,
          completedLessons: completedLessons,
          totalLessons: totalLessons,
          completedLessonDetails: completedLessonDetails,
          allLessons: allLessonsWithStatus,
          enrolledAt: enrollment.enrolledAt,
          lastActivity: enrollment.updatedAt || enrollment.enrolledAt
        }
      }
    };

    console.log('✅ Progress data prepared successfully');
    console.log('✅ Response sent with progress data');

    res.json(response);

  } catch (error) {
    console.error('❌ ERROR FETCHING STUDENT PROGRESS:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching student progress',
      error: error.message
    });
  }
});
// Get all instructor courses with detailed info
router.get('/my-courses', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('instructor', 'name email')
      .populate('lessons')
      .populate('enrolledStudents', 'name email')
      .sort({ createdAt: -1 });

    const coursesWithStats = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      isPublished: course.isPublished,
      instructor: course.instructor,
      lessons: course.lessons,
      enrolledStudents: course.enrolledStudents,
      totalStudents: course.enrolledStudents.length,
      totalLessons: course.lessons.length,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));

    res.json({
      success: true,
      courses: coursesWithStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get instructor profile
router.get('/profile', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    const courses = await Course.find({ instructor: req.user.id });
    const totalStudents = courses.reduce((acc, course) => acc + course.enrolledStudents.length, 0);
    const totalRevenue = courses.reduce((acc, course) => acc + (course.price * course.enrolledStudents.length), 0);

    const profile = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        avatar: user.avatar
      },
      stats: {
        totalCourses: courses.length,
        publishedCourses: courses.filter(course => course.isPublished).length,
        totalStudents,
        totalRevenue,
        averageRating: 4.5 // Mock data - you can implement ratings later
      }
    };

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;