import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  content: {
    type: String,
    required: true,  // Store text content or file path
  },
  extractedText: {
    type: String,
    required: false, // For extracted text from PDFs, etc.
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: false, // Associate with a specific chat if needed
  },
  userId: {
    type: String,
    required: false, // For future user authentication
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.File || mongoose.model('File', FileSchema); 