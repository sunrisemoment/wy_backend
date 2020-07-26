const mongoose = require('mongoose');

const NotificationsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['SIGNUP', 'LIKE', 'UN_LIKE', 'COMMENT', 'OTHER', 'CR', 'DB', 'TR', 'PR', 'SETTLE', 'REJECT', 'FOLLOW', 'JOIN'],
    default: 'OTHER'
  },
  tblId: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSent: {
    type: Boolean,
    default: false
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


/**
 * Statics
 */
NotificationsSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of Schema.
   * @returns {Promise<User, APIError>}
   */
  getQueued() {
    return this.find({ isSent: false })
      .exec();
  },
};


/**
 * @typedef Notifications
 */
module.exports = mongoose.model('Notifications', NotificationsSchema);
