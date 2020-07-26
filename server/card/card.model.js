const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null,
    trim: true
  },
  card: {
    type: Object,
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


CardSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec();
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
module.exports = mongoose.model('Card', CardSchema);
