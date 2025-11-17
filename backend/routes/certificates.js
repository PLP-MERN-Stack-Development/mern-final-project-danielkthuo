import express from 'express';
import Certificate from '../models/Certificate.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode'; // ✅ ADDED: QR Code import

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Generate certificate when course is completed - UPDATED WITH QR CODE
router.post('/generate/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    console.log('🔍 GENERATING CERTIFICATE ==========');
    console.log('📌 Course ID:', courseId);
    console.log('👤 Student ID:', studentId);

    // Check if course exists and user is enrolled
    const course = await Course.findById(courseId)
      .populate('instructor', 'name');
    
    if (!course) {
      console.log('❌ Course not found');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('✅ Course found:', course.title);

    const student = await User.findById(studentId);
    const enrollment = student.enrolledCourses.find(
      ec => ec.course.toString() === courseId
    );

    console.log('📊 Enrollment check:', {
      enrolled: !!enrollment,
      progress: enrollment?.progress,
      completedLessons: enrollment?.completedLessons?.length,
      totalLessons: course.lessons?.length
    });

    if (!enrollment) {
      console.log('❌ Student not enrolled in this course');
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    if (enrollment.progress < 100) {
      console.log('❌ Course not completed yet');
      return res.status(400).json({
        success: false,
        message: `Course not completed yet. Progress: ${enrollment.progress}%`
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: studentId,
      course: courseId
    });

    if (existingCertificate) {
      console.log('✅ Certificate already exists:', existingCertificate.certificateId);
      return res.json({
        success: true,
        certificate: existingCertificate,
        message: 'Certificate already exists'
      });
    }

    // Generate unique certificate ID and verification code
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const verificationCode = `VC-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;

    // ✅ NEW: Generate QR Code Data URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${verificationCode}`;
    const qrCodeData = await QRCode.toDataURL(verificationUrl);

    console.log('📝 Creating new certificate with QR code...');
    console.log('🔗 Verification URL:', verificationUrl);

    // Create certificate with QR code data
    const certificate = await Certificate.create({
      student: studentId,
      course: courseId,
      certificateId,
      completionDate: new Date(),
      instructor: course.instructor._id,
      verificationCode,
      qrCodeData  // ✅ Store QR code data
    });

    // Populate response
    await certificate.populate('course', 'title category');
    await certificate.populate('student', 'name email');
    await certificate.populate('instructor', 'name');

    console.log('✅ Certificate created successfully with QR code');

    res.status(201).json({
      success: true,
      certificate,
      message: 'Certificate generated successfully'
    });

  } catch (error) {
    console.error('❌ Error generating certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating certificate',
      error: error.message
    });
  }
});

// Download certificate - WORKING VERSION
router.get('/download/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    console.log('📥 Downloading certificate:', certificateId);

    const certificate = await Certificate.findById(certificateId)
      .populate('student', 'name email')
      .populate('course', 'title category instructor')
      .populate('instructor', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Authorization check
    if (certificate.student._id.toString() !== req.user.id && 
        req.user.role !== 'admin' && 
        certificate.course.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    console.log('✅ Generating PDF for:', certificate.student.name);

    // Create PDF document
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4'
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Simple certificate design
    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height)
       .fill('#f8fafc');

    // Border
    doc.strokeColor('#3b82f6')
       .lineWidth(10)
       .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .stroke();

    // Title
    doc.fontSize(28)
       .fill('#1e293b')
       .text('CERTIFICATE OF COMPLETION', 0, 80, { align: 'center' });

    // Subtitle
    doc.fontSize(16)
       .fill('#64748b')
       .text('This is to certify that', 0, 140, { align: 'center' });

    // Student Name
    doc.fontSize(32)
       .fill('#3b82f6')
       .text(certificate.student.name, 0, 180, { align: 'center' });

    // Course completion text
    doc.fontSize(14)
       .fill('#475569')
       .text('has successfully completed the course', 0, 240, { align: 'center' });

    // Course Title
    doc.fontSize(20)
       .fill('#1e293b')
       .text(`"${certificate.course.title}"`, 0, 280, { align: 'center' });

    // Completion Date
    doc.fontSize(12)
       .fill('#64748b')
       .text(`Completed on: ${new Date(certificate.completionDate).toLocaleDateString()}`, 0, 340, { align: 'center' });

    // Certificate ID
    doc.fontSize(10)
       .fill('#94a3b8')
       .text(`Certificate ID: ${certificate.certificateId}`, 0, 370, { align: 'center' });

    // Instructor signature
    doc.fontSize(12)
       .fill('#475569')
       .text('Instructor:', 100, 450)
       .text(certificate.instructor.name, 100, 470);

    // Date issued
    doc.fontSize(12)
       .fill('#475569')
       .text('Date Issued:', doc.page.width - 200, 450)
       .text(new Date(certificate.issueDate).toLocaleDateString(), doc.page.width - 200, 470);

    // Finalize PDF
    doc.end();

    console.log('✅ PDF generated successfully');

  } catch (error) {
    console.error('❌ Error downloading certificate:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading certificate',
      error: error.message
    });
  }
});

// Get user's certificates
router.get('/my-certificates', async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user.id })
      .populate('course', 'title category thumbnail')
      .populate('instructor', 'name')
      .sort({ issueDate: -1 });

    console.log('📜 Found certificates:', certificates.length);

    res.json({
      success: true,
      certificates,
      count: certificates.length
    });
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Verify certificate
router.get('/verify/:verificationCode', async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificate = await Certificate.findOne({ verificationCode })
      .populate('student', 'name email')
      .populate('course', 'title category')
      .populate('instructor', 'name');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid verification code'
      });
    }

    res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        student: certificate.student,
        course: certificate.course,
        instructor: certificate.instructor,
        issueDate: certificate.issueDate,
        completionDate: certificate.completionDate,
        verificationCode: certificate.verificationCode
      },
      valid: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// DEBUG QR Code Route - Add this to test QR code generation
router.get('/debug/qrcode', async (req, res) => {
  try {
    console.log('🧪 Testing QR code generation...');
    
    const QRCode = require('qrcode');
    const testUrl = 'https://example.com/verify/VC-TEST123';
    
    console.log('🔗 Generating QR code for:', testUrl);
    
    const qrCodeData = await QRCode.toDataURL(testUrl);
    
    console.log('✅ QR code generated successfully!');
    console.log('📏 Data length:', qrCodeData.length);
    console.log('🔗 Data type:', typeof qrCodeData);
    console.log('📄 First 100 chars:', qrCodeData.substring(0, 100));
    
    res.json({
      success: true,
      message: 'QR code test successful',
      data: {
        length: qrCodeData.length,
        type: typeof qrCodeData,
        firstChars: qrCodeData.substring(0, 100) + '...',
        fullData: qrCodeData // Be careful - this can be large!
      }
    });
    
  } catch (error) {
    console.error('❌ QR code test FAILED:', error);
    res.status(500).json({
      success: false,
      message: 'QR code test failed',
      error: error.message
    });
  }
});
export default router;