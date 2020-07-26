const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const SALT_WORK_FACTOR = 10;

const BankAccountsSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null,
    trim: true
  },
  bankName: {
    type: String,
    default: null,
    trim: true
  },
  code: {
    type: String,
    default: null,
    trim: true
  },
  birthday: {
    type: String,
    default: null,
    trim: true
  },
  account: {
    type: String,
    default: null,
    trim: true
  },
  birthday: {
    type: String,
    default: null,
    trim: true
  },
  isChargeable: {
    type: Boolean,
    default: false,
  },
  bank: {
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


BankAccountsSchema.pre('save', function save(next) {
  const user = this;
    // only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
    // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, (errSalt, salt) => {
    if (errSalt) { return next(errSalt); }
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) { return next(err); }
            // override the cleartext password with the hashed one
      user.password = hash;
      return next();
    });
    return null;
  });
  return null;
});

BankAccountsSchema.statics = {

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
module.exports = mongoose.model('BankAccounts', BankAccountsSchema);
