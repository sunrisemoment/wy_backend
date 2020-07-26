var _Response = require('../helpers/Response');
var jwt = require('jsonwebtoken');
var httpStatus = require('http-status');
var APIError = require('../helpers/APIError');
var Global = require('../helpers/global');
var Email = require('../helpers/email');
var config = require('../../config/config');
var bcrypt = require('bcryptjs');
var User = require('../user/user.model');
var Agent = require('../agent/agent.model');

/**
 * Returns jwt token if valid username and password is provided
 * @route GET /api/parse-jwt
 * @group foo - Operations about user
 * @param {Request} req - username or email - eg: user@domain
 * @param {Response} res - user's password.
 * @param {CallableFunction} next
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
function login(req, res, next) {
  var Response = {..._Response};
  // Ideally you'll fetch this from the db
  // Idea here was to show how jwt works with simplicity

  return User.authenticate(req.body.identifier, next)
    .then((user) => {
      if (!user) {
          var err = new APIError('Incorrect phone/password !', httpStatus.UNAUTHORIZED);
          return next(err);
      }
      if (!user.isActive) {
        var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
        return next(err);
      }
      if (!user.isVerify) {
        var err = new APIError('Please verify OTP to continue', httpStatus.UNAUTHORIZED);
        return next(err);
      }
      bcrypt.compare(req.body.password, user.password).then((match) => {
        if (match) {
          var token = jwt.sign({
            _id: user._id
          }, config.jwtSecret);

          Response.data = {
            token,
            _id: user._id
          }

          Email.sendLoginEmail({user:user},req);

          res.json(Response);
        } else {
          var err = new APIError('Incorrect identifier/password!', httpStatus.UNAUTHORIZED);
          return next(err);
        }

        return null;
      });
      return null;
    })
    .catch(err => next(err));

  // var err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  // return next(err);
}

/**
 * Returns jwt token if valid username and password is provided
 * @route GET /api/parse-jwt
 * @group foo - Operations about user
 * @param {Request} req - username or email - eg: user@domain
 * @param {Response} res - user's password.
 * @param {CallableFunction} next
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
function agentLogin(req, res, next) {
  var Response = {..._Response};
  // Ideally you'll fetch this from the db
  // Idea here was to show how jwt works with simplicity

  return Agent.authenticate(req.body.identifier, next)
    .then((user) => {
      console.log(user, 'user user');
      if (!user) {
          var err = new APIError('Incorrect phone/password !', httpStatus.UNAUTHORIZED);
          return next(err);
      }
      if (!user.isActive) {
        var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
        return next(err);
      }
      if (!user.isVerify) {
        var err = new APIError('Please verify OTP to continue', httpStatus.UNAUTHORIZED);
        return next(err);
      }
      bcrypt.compare(req.body.password, user.password).then((match) => {
        if (match) {
          var token = jwt.sign({
            _id: user._id
          }, config.jwtSecret);

          Response.data = {
            token,
            user,
          }

          Email.sendLoginEmail({user:user},req);

          res.json(Response);
        } else {
          var err = new APIError('Incorrect identifier/password!', httpStatus.UNAUTHORIZED);
          return next(err);
        }

        return null;
      });
      return null;
    })
    .catch(err => next(err));

  // var err = new APIError('Authentication error', httpStatus.UNAUTHORIZED, true);
  // return next(err);
}

/**
 * needs token returned by the above as header. Authorization: Bearer {token}
 * @route GET /api/parse-jwt
 * @group foo - Operations about user
 * @param {Request} req - username or email - eg: user@domain
 * @param {Response} res - user's password.
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 */
function getRandomNumber(req, res) {
  var Response = {..._Response};
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

module.exports = { login, agentLogin, getRandomNumber };
