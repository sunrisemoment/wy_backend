const mongoose = require('mongoose');

const GroupAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: {
    type: String,
    default: null,
    trim: true
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['PAGE', 'GROUP'],
    trim: true
  },
  image: {
    type: String,
    default: null,
    trim: true
  },
  backgroundImage: {
    type: String,
    default: null,
    trim: true
  },
  followerIds: {
    type: Array,
    default: [],
    trim: true
  },
  tempFollowerIds: {
    type: Array,
    default: [],
    trim: true
  },
  followersCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
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


GroupAccountSchema.statics = {

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
module.exports = mongoose.model('GroupAccount', GroupAccountSchema);
