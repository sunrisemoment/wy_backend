const mongoose = require('mongoose');

const UserTempSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null,
    trim: true
  },
  phone: {
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


module.exports = mongoose.model('UserTemp', UserTempSchema);
