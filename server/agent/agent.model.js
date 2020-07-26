const Promise = require('bluebird');
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const httpStatus = require('http-status');
const APIError = require('../helpers/APIError');
const bcrypt = require('bcryptjs');

const SALT_WORK_FACTOR = 10;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;// eslint-disable-line max-len,no-useless-escape

/**
 * User Schema
 */
const AgentSchema = new mongoose.Schema({
  username: {
    type: String,
    default: '',
    trim: true
  },
  profilePic: {
    type: String,
    default: '',
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    default: null,
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: null,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['AGENT'],
    default: 'AGENT',
    trim: true
  },
  street: {
    type: String,
    default: '',
    trim: true
  },
  city: {
    type: String,
    default: '',
    trim: true
  },
  state: {
    type: String,
    default: '',
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    select: false,
    required: true
  },
  smsAlert: {
    type: Boolean,
    select: false,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerify: {
    type: Boolean,
    select: false,
    default: false
  },
  deviceToken: {
    type: String,
    default: null
  },
  fcmToken: {
    type: String,
    default: null
  },
  apnsToken: {
    type: String,
    default: null
  },
  forgotToken: {
    type: String,
    select: false,
    default: null
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
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
  }
);

/**
 * Auto Increment id
 */
AgentSchema.plugin(AutoIncrement, { inc_field: 'agentId' });


AgentSchema.pre('save', function save(next) {
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

AgentSchema.method('saveWithoutValidation', function (next) {
  const defaultValidate = this.validate;
  this.validate = function (next) { next(); };

  const self = this;
  this.save((err, doc, numberAffected) => {
    self.validate = defaultValidate;
    next(err, doc, numberAffected);
  });
});

AgentSchema.post('save', (error, doc, next) => {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error (Phone or Username)'));
  } else {
    next();
  }
});


/**
 * Statics
 */
AgentSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id).select('-password')
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  onlyBasicInfo(query) {
    return this.find(query)
      .select('-apnsToken -fcmToken -deviceToken -isActive -state -city -street -role -invitedBy -inviteCode -qrCode -country -userWallet')
      .exec();
  },
  onlyBasicInfoPrivate(query) {
    return this.find(query)
      .select('-apnsToken -fcmToken -deviceToken -isActive -state -city -street -role -invitedBy -inviteCode -qrCode -country -userWallet +isPrivate')
      .exec();
  },

  findByQuery(query) {
    return this.find(query)
      .exec();
  },

  findOneByQuery(query) {
    return this.findOne(query).select('+forgotToken')
      .exec();
  },
  findOneHiddenKey(query, key) {
    return this.findOne(query).select(`+${key}`)
      .exec();
  },

  findHiddenKey(query, key) {
    return this.find(query).select(`+${key}`)
      .exec();
  },

  /**
   *
   * @param {*} email
   */
  authenticate(identifier, next) {
    AgentSchema.set('toObject', { virtuals: true });
    AgentSchema.set('toJSON', { virtuals: true });

    return this.findOne({ phone: identifier, isActive: true })
      .select('+forgotToken +password +smsAlert +isVerify')
      .exec();
  },

  authenticateMiddleWare(id) {
    AgentSchema.set('toObject', { virtuals: true });
    AgentSchema.set('toJSON', { virtuals: true });

    return this.findOne({ _id: id, isActive: true })
      .select('+forgotToken +password +smsAlert +isVerify');
  },

  authenticateViaId(identifier, next) {
    AgentSchema.set('toObject', { virtuals: true });
    AgentSchema.set('toJSON', { virtuals: true });

    return this.findOne({ _id: identifier })
      .select('+password')
      .exec();
  },

  authme(identifier, next) {
    AgentSchema.set('toObject', { virtuals: true });
    AgentSchema.set('toJSON', { virtuals: true });

    return this.findOne({ _id: identifier, isActive: true })
      .select('+forgotToken +smsAlert +isVerify')
      .exec();
  },
  findByEmail(identifier) {
    return this.findOne({ email: identifier })
      .exec();
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list(query, { limit, skip }, assoc) {
    let users = this.find(query);

    if (assoc == 1) {
      AgentSchema.set('toObject', { virtuals: true });
      AgentSchema.set('toJSON', { virtuals: true });
      users = users.populate({ path: 'role' });
    }

    if (limit > -1) {
      users = users.skip(+skip).limit(+limit);
    }

    return users.exec();
  }
};

AgentSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

AgentSchema.methods = {
  comparePassword(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return cb(err);
      cb(null, isMatch);
      return null;
    });
    return null;
  }
};

/**
 * @typedef User
 */
module.exports = mongoose.model('Agent', AgentSchema);
