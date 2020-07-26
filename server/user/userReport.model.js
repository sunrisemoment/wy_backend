const Promise = require('bluebird');
const mongoose = require('mongoose');

/**
 * User Schema
 */
const UserReportSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: '',
    trim: true
  },
  reportedBy: {
    type: String,
    default: '',
    trim: true
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
  }
);

/**
 * @typedef User
 */
module.exports = mongoose.model('UserReport', UserReportSchema);
