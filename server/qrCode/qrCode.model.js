const mongoose = require('mongoose');

const QrSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // userId: {
    //   type: String,
    //   default: null,
    //   trim: true,
    // },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    // agentId: {
    //   type: String,
    //   default: null,
    //   trim: true,
    // },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // createdBy: {
    //   type: String,
    //   default: null,
    //   trim: true,
    // },
    qrKey: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      default: null,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

// QrSchema.virtual('agent', {
//   ref: 'Agent', // The model to use
//   localField: 'agentId', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//   // If `justOne` is true, 'members' will be a single doc as opposed to
//   // an array. `justOne` is false by default.
//   justOne: true,
// });

// QrSchema.virtual('user', {
//   ref: 'User', // The model to use
//   localField: 'userId', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//   // If `justOne` is true, 'members' will be a single doc as opposed to
//   // an array. `justOne` is false by default.
//   justOne: true,
// });

// QrSchema.virtual('user', {
//   ref: 'User', // The model to use
//   localField: 'createdBy', // Find people where `localField`
//   foreignField: '_id', // is equal to `foreignField`
//   // If `justOne` is true, 'members' will be a single doc as opposed to
//   // an array. `justOne` is false by default.
//   justOne: true,
// });

QrSchema.statics = {
  findId(id) {
    return this.findById(id).exec();
  },
  findQRCode() {
    return this.find()
    .populate({ path: 'user' })
    .populate({ path: 'createdBy' })
    .populate({ path: 'agent' })
    .exec();
  },
  findByQuery(query) {
    return this.find(query)
    .populate({ path: 'user' })
    .populate({ path: 'createdBy' })
    .populate({ path: 'agent' })
    .exec();
  },
  findQRCodeByOne(query) {
    return this.findOne(query).exec();
  },
  qrCodeInfo(query) {
    QrSchema.set('toObject', { virtuals: true });
    QrSchema.set('toJSON', { virtuals: true });
    return this.findOne(query)
      .populate({ path: 'user' })
      .populate({ path: 'createdBy' })
      .populate({ path: 'agent' })
      .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update).exec();
  },
  findAndDeleteById(qrCodeId) {
    return this.findByIdAndRemove({ _id: qrCodeId });
  },
};
module.exports = mongoose.model('QrCode', QrSchema);
