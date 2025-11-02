const mongoose = require('mongoose');

const tokenSystemSchema = new mongoose.Schema({
  totalTokens: {
    type: Number,
    required: true,
    default: 0,
  },
  usedTokens: {
    type: Number,
    required: true,
    default: 0,
  },
  remainingTokens: {
    type: Number,
    required: true,
    default: 0,
  },
  currentTokenNumber: {
    type: Number,
    default: 0,
  },
  lastResetDate: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Pre-save middleware to calculate remaining tokens
tokenSystemSchema.pre('save', function(next) {
  this.remainingTokens = this.totalTokens - this.usedTokens;
  next();
});

module.exports = mongoose.model('TokenSystem', tokenSystemSchema);