import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verificationCode: {
    type: String,
    unique: true
  },
  // ✅ ADDED: QR Code field for certificate authenticity
  qrCodeData: {
    type: String  // This will store the QR code as a data URL
  },
  downloadUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Add index for better performance
certificateSchema.index({ student: 1, course: 1 });
certificateSchema.index({ verificationCode: 1 });

export default mongoose.model('Certificate', certificateSchema);