const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  sentBy: {
    type: String,
    required: true,
    trim: true
  },
  recievedBy: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  note: {
    type: String,
    trim: true
  },
  txnCode: {
    type: String,
    required: true,
    trim: true
  },
  checkSum: {
    type: String,
    select: false,
    required: true,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'rejected'],
    default: 'unpaid'
  },
  isWaya: {
    type: Boolean,
    default: true
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


PaymentRequestSchema.virtual('recievedByUser', {
  ref: 'User', // The model to use
  localField: 'recievedBy', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

PaymentRequestSchema.virtual('sentByUser', {
  ref: 'User', // The model to use
  localField: 'sentBy', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});


PaymentRequestSchema.statics = {

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
  walletInfo(query) {
    PaymentRequestSchema.set('toObject', { virtuals: true });
    PaymentRequestSchema.set('toJSON', { virtuals: true });
    return this.find(query)
            .sort({ updatedAt: -1 })
            .populate({ path: 'recievedByUser', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1 } })
            .populate({ path: 'sentByUser', select: { _id: 1, userId: 1, firstName: 1, lastName: 1, profilePic: 1 } })
            .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec()
            ;
  },
};
module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
