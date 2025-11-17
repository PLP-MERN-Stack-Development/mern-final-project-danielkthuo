import express from 'express';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ===== MIDDLEWARE =====
// Apply protect middleware to all routes
router.use(protect);

// ===== ROUTES =====

// GET all students with their enrollments and progress
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    // Build search filter
    const searchFilter = {
      role: 'student',
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      })
    };

    const students = await User.find(searchFilter)
      .select('name email avatar createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get enrollment data for each student
    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({ student: student._id })
          .populate('course', 'title category level instructor')
          .populate('completedLessons.lesson', 'title duration')
          .sort({ lastAccessed: -1 });

        const totalEnrollments = enrollments.length;
        const completedCourses = enrollments.filter(e => e.status === 'completed').length;
        const averageProgress = enrollments.length > 0 
          ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
          : 0;

        return {
          ...student.toObject(),
          enrollments,
          stats: {
            totalEnrollments,
            completedCourses,
            averageProgress: Math.round(averageProgress),
            activeEnrollments: enrollments.filter(e => e.status === 'in-progress').length
          }
        };
      })
    );

    const totalStudents = await User.countDocuments(searchFilter);

    res.json({
      success: true,
      students: studentsWithEnrollments,
      totalPages: Math.ceil(totalStudents / limit),
      currentPage: parseInt(page),
      totalStudents
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// GET detailed student progress for a specific course
router.get('/:studentId/courses/:courseId/progress', async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    })
    .populate('course', 'title description totalLessons duration')
    .populate('completedLessons.lesson', 'title duration order module')
    .populate('student', 'name email avatar');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Calculate progress metrics
    const course = await Course.findById(courseId).populate('lessons');
    const totalLessons = course.lessons.length;
    const completedLessons = enrollment.completedLessons.length;
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate time spent (mock calculation - in real app, track time)
    const estimatedTimeSpent = enrollment.completedLessons.reduce((total, cl) => {
      return total + (cl.lesson?.duration || 0);
    }, 0);

    res.json({
      success: true,
      enrollment,
      progress: {
        completedLessons,
        totalLessons,
        progressPercentage: Math.round(progressPercentage),
        estimatedTimeSpent,
        status: enrollment.status,
        lastActivity: enrollment.lastAccessed
      }
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student progress',
      error: error.message
    });
  }
});

// UPDATE student progress
router.put('/:studentId/progress', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, lessonId, score } = req.body;

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Check if lesson already completed
    const alreadyCompleted = enrollment.completedLessons.some(
      cl => cl.lesson.toString() === lessonId
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push({
        lesson: lessonId,
        score: score || null
      });

      // Update overall progress
      const course = await Course.findById(courseId);
      const totalLessons = course.lessons.length;
      enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
      
      // Update status based on progress
      if (enrollment.progress === 100) {
        enrollment.status = 'completed';
      } else if (enrollment.progress > 0) {
        enrollment.status = 'in-progress';
      }

      enrollment.lastAccessed = new Date();
      await enrollment.save();
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

export default router;