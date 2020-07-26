const mongoose = require('mongoose');

const CommissionSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  referenceCode: {
    type: String,
    default: null,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  __v: { type: Number, select: false },
},
  {
    timestamps: true
  });

module.exports = mongoose.model('Commission', CommissionSchema);
