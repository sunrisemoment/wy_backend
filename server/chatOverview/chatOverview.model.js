const mongoose = require('mongoose');

const ChatOverviewSchema = new mongoose.Schema({
  message: {
    type: String,
    default: null,
    trim: true
  },
  messageQuote: {
    type: String,
    default: null,
    trim: true
  },
  forwardMessage: {
    type: Boolean,
    default: false,
    trim: true
  },
  chatId: {
    type: String,
    required: true,
    default: null,
    trim: true
  },
  userId1: {
    type: String,
    required: true,
    default: null,
    trim: true
  },
  userId2: {
    type: String,
    required: true,
    default: null,
    trim: true
  },
  userId1Typing: {
    type: Boolean,
    default: false,
    trim: true
  },
  userId2Typing: {
    type: Boolean,
    default: false,
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


ChatOverviewSchema.virtual('userId_1', {
  ref: 'User', // The model to use
  localField: 'userId1', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

ChatOverviewSchema.virtual('userId_2', {
  ref: 'User', // The model to use
  localField: 'userId2', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});


ChatOverviewSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec()
            ;
  },
  findByQuery(query) {
    return this.find(query)
            .exec()
            ;
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
  findIdChat(query) {
    ChatOverviewSchema.set('toObject', { virtuals: true });
    ChatOverviewSchema.set('toJSON', { virtuals: true });
    return this.findById(query)
            .sort({ updatedAt: -1 })
            .populate({ path: 'userId_1', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } })
            .populate({ path: 'userId_2', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } }).exec();
  },
  findChat(query) {
    ChatOverviewSchema.set('toObject', { virtuals: true });
    ChatOverviewSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ updatedAt: -1 })
            .populate({ path: 'userId_1', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } })
            .populate({ path: 'userId_2', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } }).exec();
  },
};
module.exports = mongoose.model('ChatOverview', ChatOverviewSchema);
