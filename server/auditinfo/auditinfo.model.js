const mongoose = require('mongoose');

const AuditInfoSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  objectId: {
    type: String,
    default: null
  },
  action: {
    type: String,
    enum: ['register', 'create', 'update', 'delete', 'emailsent', 'smssent', 'print', 'ussd', 'loginemails', 'rubie'],
    required: true
  },
  detail: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  __v: { type: Number, select: false }
});


AuditInfoSchema.statics = {

  /**
 * List users in descending order of 'createdAt' timestamp.
 * @param {number} skip - Number of users to be skipped.
 * @param {number} limit - Limit number of users to be returned.
 * @returns {Promise<User[]>}
 */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef AuditInfo
 */
module.exports = mongoose.model('AuditInfo', AuditInfoSchema, 'auditInfo');
