const mongoose = require('mongoose');

const RolesSchema = new mongoose.Schema({
  roleName: {
    type: String,
  },
  userType: {
    type: String,
  },
  level: {
    type: Number
  },
  permissions: {
    type: Object,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  __v: { type: Number, select: false }
});


RolesSchema.statics = {

  get(query) {
    return this.find(query).select('-permissions')
      .exec()
      .then((data) => {
        if (data) {
          return data;
        }
        const err = new APIError('No such Role exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

};

/**
 * @typedef Roles
 */
module.exports = mongoose.model('Roles', RolesSchema);
