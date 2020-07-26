const mongoose = require('mongoose');

const WayaGramCommentsSchema = new mongoose.Schema({
  postId: {
    type: String,
    default: null,
    trim: true
  },
  comment: {
    type: String,
    required: true,
    default: null,
    trim: true
  },
  userId: {
    type: String,
    required: true,
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


WayaGramCommentsSchema.virtual('user', {
  ref: 'User', // The model to use
  localField: 'userId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

WayaGramCommentsSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec()
            ;
  },
  postDataId(id) {
    WayaGramCommentsSchema.set('toObject', { virtuals: true });
    WayaGramCommentsSchema.set('toJSON', { virtuals: true });
    return this.findById(id)
            .sort({ updatedAt: -1 })
            .populate({ path: 'user', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, username: 1 } }).exec();
  },
  findByQuery(query) {
    return this.find(query)
            .exec()
            ;
  },
  postData(query, pageQ = 1) {
    console.log(pageQ);
    let perPage = 50,
      page = Math.max(0, pageQ || 1);

    WayaGramCommentsSchema.set('toObject', { virtuals: true });
    WayaGramCommentsSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ updatedAt: -1 })
            // .limit(perPage)
            // .skip(perPage * page)
            .populate({ path: 'user', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1, username: 1 } }).exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
};
module.exports = mongoose.model('WayaGramComments', WayaGramCommentsSchema);
