import express from 'express';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ===== MIDDLEWARE =====
// Apply protect middleware to all routes
router.use(protect);

// ===== ROUTES =====

// GET all lessons for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled, is instructor, or is admin
    const userId = req.user.id || req.user._id;
    const isEnrolled = course.enrolledStudents.includes(userId);
    const isInstructor = course.instructor.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isEnrolled && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these lessons'
      });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

    res.json({
      success: true,
      lessons,
      count: lessons.length
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET single lesson by ID
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title instructor enrolledStudents');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is enrolled, is instructor, or is admin
    const userId = req.user.id || req.user._id;
    const isEnrolled = lesson.course.enrolledStudents.includes(userId);
    const isInstructor = lesson.course.instructor.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isEnrolled && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lesson'
      });
    }

    res.json({
      success: true,
      lesson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// CREATE new lesson (instructor/admin only)
router.post('/course/:courseId', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the course instructor or admin
    const userId = req.user.id || req.user._id;
    if (userId.toString() !== course.instructor.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the instructor of this course'
      });
    }

    // Calculate next order if not provided
    if (!req.body.order) {
      const lastLesson = await Lesson.findOne({ course: courseId })
        .sort({ order: -1 });
      req.body.order = lastLesson ? lastLesson.order + 1 : 1;
    }

    // Create lesson
    const lesson = await Lesson.create({
      ...req.body,
      course: courseId
    });

    // Add lesson to course's lessons array
    course.lessons.push(lesson._id);
    await course.save();

    // Populate the response
    await lesson.populate('course', 'title instructor');

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lesson',
      error: error.message
    });
  }
});

// UPDATE lesson (instructor/admin only)
router.put('/:id', authorize('instructor', 'admin'), async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id).populate('course', 'instructor');
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the course instructor or admin
    const userId = req.user.id || req.user._id;
    if (userId.toString() !== lesson.course.instructor.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the instructor of this course'
      });
    }

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('course', 'title instructor');

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lesson',
      error: error.message
    });
  }
});

// DELETE lesson (instructor/admin only)
router.delete('/:id', authorize('instructor', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course', 'instructor');
    
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the course instructor or admin
    const userId = req.user.id || req.user._id;
    if (userId.toString() !== lesson.course.instructor.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the instructor of this course'
      });
    }

    // Remove lesson from course's lessons array
    await Course.findByIdAndUpdate(
      lesson.course._id,
      { $pull: { lessons: lesson._id } }
    );

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lesson',
      error: error.message
    });
  }
});

// MARK lesson as completed - WITH CERTIFICATE GENERATION
router.post('/:id/complete', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const course = await Course.findById(lesson.course);
    const user = await User.findById(req.user.id);

    // Find enrollment
    const enrolledCourse = user.enrolledCourses.find(
      enrolled => enrolled.course.toString() === course._id.toString()
    );

    if (!enrolledCourse) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    let courseCompleted = false;

    // Add to completed lessons if not already there
    if (!enrolledCourse.completedLessons.includes(lesson._id)) {
      enrolledCourse.completedLessons.push(lesson._id);
      
      // Calculate progress
      const totalLessons = course.lessons.length;
      const completedLessons = enrolledCourse.completedLessons.length;
      enrolledCourse.progress = Math.round((completedLessons / totalLessons) * 100);
      
      await user.save();

      // Check if course is completed (100% progress)
      if (enrolledCourse.progress === 100) {
        courseCompleted = true;
        console.log('🎉 COURSE COMPLETED! Progress: 100%');
        
        // Auto-generate certificate
        try {
          const Certificate = require('../models/Certificate.js');
          
          // Check if certificate already exists
          const existingCertificate = await Certificate.findOne({
            student: user._id,
            course: course._id
          });

          if (!existingCertificate) {
            console.log('📝 Creating certificate automatically...');
            
            // Generate unique certificate ID
            const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const verificationCode = `VC-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

            // Create certificate
            const certificate = await Certificate.create({
              student: user._id,
              course: course._id,
              certificateId,
              completionDate: new Date(),
              instructor: course.instructor,
              verificationCode
            });

            console.log('✅ Certificate generated:', certificate.certificateId);
          } else {
            console.log('ℹ️ Certificate already exists');
          }
        } catch (certError) {
          console.error('❌ Certificate generation failed:', certError.message);
        }
      }

      // Socket.io progress update (if configured)
      if (req.app.get('io')) {
        req.app.get('io').to(course._id.toString()).emit('progress-update', {
          userId: user._id,
          courseId: course._id,
          progress: enrolledCourse.progress,
          completedLessons: completedLessons,
          totalLessons: totalLessons
        });
      }
    }

    res.json({
      success: true,
      progress: enrolledCourse.progress,
      completedLessons: enrolledCourse.completedLessons.length,
      totalLessons: course.lessons.length,
      courseCompleted: courseCompleted
    });

  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;