const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    default: null,
    trim: true
  },
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
  file: {
    type: Object,
    default: null,
  },
  type: {
    type: Number,
    default: 0,
  },
  userId1: {
    type: String,
    default: null,
    trim: true
  },
  userId2: {
    type: String,
    default: null,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
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


ChatSchema.virtual('userId_1', {
  ref: 'User', // The model to use
  localField: 'userId1', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

ChatSchema.virtual('userId_2', {
  ref: 'User', // The model to use
  localField: 'userId2', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});


ChatSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec()
            ;
  },
  findIdChat(id) {
    ChatSchema.set('toObject', { virtuals: true });
    ChatSchema.set('toJSON', { virtuals: true });
    return this.findById(id)
            .sort({ createdAt: 1 })
            .populate({ path: 'userId_1', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } })
            .populate({ path: 'userId_2', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } }).exec();
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
  findChat(query) {
    ChatSchema.set('toObject', { virtuals: true });
    ChatSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ createdAt: 1 })
            .populate({ path: 'userId_1', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } })
            .populate({ path: 'userId_2', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, isOnline: 1, lastSeen: 1, phone: 1 } }).exec();
  },
  deleteChatById(chatId) {
    return this.findByIdAndRemove({ _id: chatId });
  },
};
module.exports = mongoose.model('Chat', ChatSchema);
