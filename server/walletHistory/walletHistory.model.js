const mongoose = require('mongoose');

const WalletHistorySchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    trim: true
  },
  senderDetail: {
    type: Object,
    default: {},
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  chatId: {
    type: String,
    default: null,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  balance: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  commission: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  actualAmount: {
    type: Number,
    default: 0.00,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  referenceCode: {
    type: String,
    trim: true
  },
  channel: {
    type: String,
    default: 'Wayapay',
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


WalletHistorySchema.virtual('user', {
  ref: 'User', // The model to use
  localField: 'userId', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
  justOne: true,
});

WalletHistorySchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec();
  },
  findByQuery(query) {
    return this.find(query)
            .exec();
  },
  walletInfo(query) {
    WalletHistorySchema.set('toObject', { virtuals: true });
    WalletHistorySchema.set('toJSON', { virtuals: true });
    return this.find(query)
        .sort({ updatedAt: -1 })
        // .populate({path:'user',select:{'_id':1,'userId':1,'firstName':1,'lastName':1,'profilePic':1,'phone':1}})
        .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec();
  },
};
module.exports = mongoose.model('WalletHistory', WalletHistorySchema);
