const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  chatId: {
    type: String,
    default: null,
    trim: true
  },
  type: {
    type: Number,
    default: 0,
  },
  typeName: {
    type: String,
    default: null,
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
  roomId: {
    type: String,
    default: null,
    trim: true
  },
  callStatus: {
    type: Number,
    default: 0,
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


CallSchema.statics = {

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
};

module.exports = mongoose.model('Call', CallSchema);
