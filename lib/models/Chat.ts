import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // Statistics and metrics for assistant messages
  stats: {
    cosineSimilarity: {
      type: Number,
      default: null
    },
    responseTimeMs: {
      type: Number,
      default: null
    },
    tokensUsed: {
      type: Number,
      default: null
    },
    promptTokens: {
      type: Number,
      default: null
    },
    completionTokens: {
      type: Number,
      default: null
    },
    processingTimeMs: {
      type: Number,
      default: null
    }
  }
});

const ChatSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Chat-level statistics
  totalMessages: {
    type: Number,
    default: 0
  },
  avgCosineSimilarity: {
    type: Number,
    default: 0
  },
  avgResponseTimeMs: {
    type: Number,
    default: 0
  }
});

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema); 