const mongoose = require('mongoose');

const GroupAccountPostSchema = new mongoose.Schema({
  image: {
    type: String,
    default: null,
    trim: true
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupAccount' },
  // user: {
  //   type: String,
  //   required: true,
  //   default: null,
  //   trim: true
  // },
  // group: {
  //   type: String,
  //   required: true,
  //   default: null,
  //   trim: true
  // },
  like: {
    type: Array,
    default: [],
  },
  commentCount: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#000000',
    trim: true
  },
  url: {
    type: String,
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


// GroupAccountPostSchema.virtual('user', {
//   ref: 'User', // The model to use
//   localField: 'userId', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//     // If `justOne` is true, 'members' will be a single doc as opposed to
//     // an array. `justOne` is false by default.
//   justOne: true,
// });

// GroupAccountPostSchema.virtual('groupAccount', {
//   ref: 'User', // The model to use
//   localField: 'groupId', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//     // If `justOne` is true, 'members' will be a single doc as opposed to
//     // an array. `justOne` is false by default.
//   justOne: true,
// });


GroupAccountPostSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec();
  },
  postDataId(id) {
    GroupAccountPostSchema.set('toObject', { virtuals: true });
    GroupAccountPostSchema.set('toJSON', { virtuals: true });
    return this.findById(id)
        .sort({ updatedAt: -1 })
        .populate({ path: 'group', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
        .populate({ path: 'user', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
        .exec();
  },
  findByQuery(query) {
    return this.find(query)
            .exec()
            ;
  },
  postData(query, pageQ = 1) {
    let perPage = 50,
      page = Math.max(0, pageQ || 1);

    // GroupAccountPostSchema.set('toObject', { virtuals: true });
    // GroupAccountPostSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ updatedAt: -1 })
            // .limit(perPage)
            // .skip(perPage * page)
            // .populate({ path: 'group', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
            .populate({ path: 'group' })
            .populate({ path: 'user' })
            .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
};
module.exports = mongoose.model('GroupAccountPost', GroupAccountPostSchema);
