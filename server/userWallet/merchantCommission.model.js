const mongoose = require('mongoose');

const MerchantCommissionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
  },
  totalCommission: {
    type: Number,
    default: 0.00,
    required: true,
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

MerchantCommissionSchema.statics = {

  findId(id) {
    return this.findById(id)
            .exec();
  },
  findByQuery(query) {
    return this.find(query)
            .exec();
  },
  findAndUpdate(_id, update) {
    return this.findOneAndUpdate({ _id, isActive: true }, update)
            .exec();
  },
};
module.exports = mongoose.model('MerchantCommission', MerchantCommissionSchema);
