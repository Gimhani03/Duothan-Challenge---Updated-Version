const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: function() {
      return this.submissionType === 'code';
    }
  },
  language: {
    type: String,
    required: function() {
      return this.submissionType === 'code';
    }
  },
  languageId: {
    type: Number,
    required: function() {
      return this.submissionType === 'code';
    }
  },
  githubUrl: {
    type: String,
    required: function() {
      return this.submissionType === 'github';
    }
  },
  submissionType: {
    type: String,
    enum: ['code', 'github'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
    default: 'pending'
  },
  judge0Token: {
    type: String
  },
  executionTime: {
    type: Number // in ms
  },
  memoryUsed: {
    type: Number // in KB
  },
  output: {
    type: String
  },
  error: {
    type: String
  },
  testCaseResults: [{
    testCaseIndex: Number,
    status: String,
    output: String,
    expectedOutput: String,
    executionTime: Number,
    memoryUsed: Number
  }],
  points: {
    type: Number,
    default: 0
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
submissionSchema.index({ team: 1, challenge: 1 });
submissionSchema.index({ submittedBy: 1 });
submissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
