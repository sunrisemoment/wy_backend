const mongoose = require('mongoose');

const QuickTellerSchema = new mongoose.Schema({
  otp: {
    type: String,
    default: '123456',
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


QuickTellerSchema.statics = {

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
  findOneByQuery(query) {
    return this.findOne(query)
            .exec()
            ;
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
};
module.exports = mongoose.model('QuickTeller', QuickTellerSchema);
