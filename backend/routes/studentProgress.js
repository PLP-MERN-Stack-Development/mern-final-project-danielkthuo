import express from 'express';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET detailed student progress for a specific course
router.get('/courses/:courseId/students/:studentId/progress', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Verify the course belongs to the instructor
    const course = await Course.findOne({
      _id: courseId,
      instructor: req.user.id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or access denied'
      });
    }

    // Get the enrollment with detailed information
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    })
    .populate('student', 'name email avatar')
    .populate('course', 'title description instructor category level')
    .populate('completedLessons.lesson', 'title duration order');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Student enrollment not found'
      });
    }

    // Calculate progress metrics
    const totalLessons = course.lessons.length;
    const completedLessons = enrollment.completedLessons.length;
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate estimated time spent
    const estimatedTimeSpent = enrollment.completedLessons.reduce((total, cl) => {
      return total + (cl.lesson?.duration || 0);
    }, 0);

    res.json({
      success: true,
      student: enrollment.student,
      course: {
        ...course.toObject(),
        totalLessons: totalLessons
      },
      progress: {
        completedLessons: completedLessons,
        totalLessons: totalLessons,
        progressPercentage: Math.round(progressPercentage),
        estimatedTimeSpent: Math.round(estimatedTimeSpent),
        lastActivity: enrollment.lastAccessed
      },
      enrollment: {
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedLessons: enrollment.completedLessons,
        lastAccessed: enrollment.lastAccessed
      }
    });

  } catch (error) {
    console.error('Error fetching student progress details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student progress details',
      error: error.message
    });
  }
});

export default router;