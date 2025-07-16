const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  problemStatement: {
    type: String,
    required: true
  },
  inputFormat: {
    type: String,
    required: true
  },
  outputFormat: {
    type: String,
    required: true
  },
  constraints: {
    type: String,
    required: true
  },
  sampleInput: {
    type: String,
    required: true
  },
  sampleOutput: {
    type: String,
    required: true
  },
  explanation: {
    type: String
  },
  type: {
    type: String,
    enum: ['algorithmic', 'buildathon'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 0
  },
  timeLimit: {
    type: Number, // in seconds
    default: 2
  },
  memoryLimit: {
    type: Number, // in MB
    default: 256
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  flag: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  unlockConditions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  // For buildathon challenges
  githubSubmissionRequired: {
    type: Boolean,
    default: function() {
      return this.type === 'buildathon';
    }
  },
  submissionDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);
