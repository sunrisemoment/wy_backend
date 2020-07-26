const mongoose = require('mongoose');

const UserFollowSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: '123456',
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
  followingIds: {
    type: Array,
    default: [],
    trim: true
  },
  tempFollowingIds: {
    type: Array,
    default: [],
    trim: true
  },
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
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


UserFollowSchema.statics = {

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
module.exports = mongoose.model('UserFollow', UserFollowSchema);
