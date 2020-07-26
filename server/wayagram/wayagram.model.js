const mongoose = require('mongoose');

const WayaGramSchema = new mongoose.Schema({
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
  userId: {
    type: String,
    required: true,
    default: null,
    trim: true
  },
  like: {
    type: Array,
    default: [],
  },
  commentCount: {
    type: Number,
    default: 0
  },
  sharedPost: {
    type: Object,
    default: null,
    trim: true
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
  isMoment: {
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


WayaGramSchema.virtual('user', {
  ref: 'User', // The model to use
  localField: 'userId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

WayaGramSchema.virtual('sharedUser', {
  ref: 'User', // The model to use
  localField: 'sharedPost.userId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});


WayaGramSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec();
  },
  postDataId(id) {
    WayaGramSchema.set('toObject', { virtuals: true });
    WayaGramSchema.set('toJSON', { virtuals: true });
    return this.findById(id)
        .sort({ updatedAt: -1 })
        .populate({ path: 'sharedUser', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
        .populate({ path: 'user', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } }).exec();
  },
  findByQuery(query) {
    return this.find(query)
            .exec()
            ;
  },
  postData(query, pageQ = 1) {
    let perPage = 50,
      page = Math.max(0, pageQ || 1);

    WayaGramSchema.set('toObject', { virtuals: true });
    WayaGramSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ updatedAt: -1 })
            // .limit(perPage)
            // .skip(perPage * page)
            .populate({ path: 'sharedUser', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
            .populate({ path: 'user', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, phone: 1, username: 1 } })
            .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
};
module.exports = mongoose.model('WayaGram', WayaGramSchema);
