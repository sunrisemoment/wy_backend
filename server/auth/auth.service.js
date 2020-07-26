const httpStatus = require('http-status');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const APIError = require('../helpers/APIError');
const User = require('../user/user.model');
const Agent = require('../agent/agent.model');

const Audit = require('../auditinfo/auditinfo.controller');

const compose = require('composable-middleware');
const FCM = require('fcm-node');
const serverKey = config.fcmKey;

const validateJwt = expressJwt({
  secret: config.jwtSecret
});

// var jwtUserInfo = expressJwt({
//   secret: config.jwtSecret,
//   credentialsRequired: false
// });


function checkTimeStamp(req, res, next) {
  return true;
  if (!req.headers.timestamp) {
    return false;
  }

  const now = Date.now();

  const createdAt = req.headers.timestamp;

  const sec30 = 30 * 1000;

  const check = (now - createdAt) < sec30;
  if (check) {
    return true;
  }

  return false;
}

function isAuthenticated() {
  return compose()
    // Validate jwt
    .use((req, res, next) => {
      // allow access_token to be passed through query parameter as well
      // if (req.query && req.query.hasOwnProperty('access_token')) {
      //   req.headers.authorization = `Bearer ${req.query.access_token}`;
      // }
      // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
      if (req.query && typeof req.headers.authorization === 'undefined') {
        req.headers.authorization = `Bearer ${req.cookies.token}`; // eslint-disable-line no-param-reassign
      }

      if (!checkTimeStamp(req, res, next)) {
        const err = new APIError('Request is expired', httpStatus.UNAUTHORIZED);
        return next(err);
      }

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use((req, res, next) => User.authenticateMiddleWare(req.user._id).exec()
      .then((user) => {
        if (!user) {
          var err = new APIError('User is Not Authorised', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isActive) {
          var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isVerify) {
          var err = new APIError('Please verify Phone to continue', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        req.user = user; // eslint-disable-line no-param-reassign
        next();
        return null;
      })
      .catch(err => next(err)));
}

function isAuthenticatedAgent() {
  return compose()
    // Validate jwt
    .use((req, res, next) => {
      // allow access_token to be passed through query parameter as well
      // if (req.query && req.query.hasOwnProperty('access_token')) {
      //   req.headers.authorization = `Bearer ${req.query.access_token}`;
      // }
      // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
      if (req.query && typeof req.headers.authorization === 'undefined') {
        req.headers.authorization = `Bearer ${req.cookies.token}`; // eslint-disable-line no-param-reassign
      }

      if (!checkTimeStamp(req, res, next)) {
        const err = new APIError('Request is expired', httpStatus.UNAUTHORIZED);
        return next(err);
      }

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use((req, res, next) => Agent.authenticateMiddleWare(req.user._id).exec()
      .then((user) => {
        if (!user) {
          var err = new APIError('User is Not Authorised', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isActive) {
          var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isVerify) {
          var err = new APIError('Please verify Phone to continue', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        req.user = user; // eslint-disable-line no-param-reassign
        next();
        return null;
      })
      .catch(err => next(err)));
}

function isAuthenticatedUnVerified() {
  return compose()
    // Validate jwt
    .use((req, res, next) => {
      // allow access_token to be passed through query parameter as well
      // if (req.query && req.query.hasOwnProperty('access_token')) {
      //   req.headers.authorization = `Bearer ${req.query.access_token}`;
      // }
      // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
      if (req.query && typeof req.headers.authorization === 'undefined') {
        req.headers.authorization = `Bearer ${req.cookies.token}`; // eslint-disable-line no-param-reassign
      }

      if (!checkTimeStamp(req, res, next)) {
        const err = new APIError('Request is expired', httpStatus.UNAUTHORIZED);
        return next(err);
      }

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use((req, res, next) => User.authenticateMiddleWare(req.user._id).exec()
      .then((user) => {
        if (!user) {
          const err = new APIError('User is Not Authorised', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isActive) {
          const err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        // if (!user.isVerify) {
        //   var err = new APIError('Please verify Phone to continue', httpStatus.UNAUTHORIZED);
        //   return next(err)
        // }
        req.user = user; // eslint-disable-line no-param-reassign
        next();
        return null;
      })
      .catch(err => next(err)));
}

function isAuthenticatedUnVerifiedAgent() {
  return compose()
    // Validate jwt
    .use((req, res, next) => {
      // allow access_token to be passed through query parameter as well
      // if (req.query && req.query.hasOwnProperty('access_token')) {
      //   req.headers.authorization = `Bearer ${req.query.access_token}`;
      // }
      // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
      if (req.query && typeof req.headers.authorization === 'undefined') {
        req.headers.authorization = `Bearer ${req.cookies.token}`; // eslint-disable-line no-param-reassign
      }

      if (!checkTimeStamp(req, res, next)) {
        const err = new APIError('Request is expired', httpStatus.UNAUTHORIZED);
        return next(err);
      }

      validateJwt(req, res, next);
    })
    // Attach user to request
    .use((req, res, next) => Agent.authenticateMiddleWare(req.user._id).exec()
      .then((user) => {
        if (!user) {
          const err = new APIError('User is Not Authorised', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        if (!user.isActive) {
          const err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        // if (!user.isVerify) {
        //   var err = new APIError('Please verify Phone to continue', httpStatus.UNAUTHORIZED);
        //   return next(err)
        // }
        req.user = user; // eslint-disable-line no-param-reassign
        next();
        return null;
      })
      .catch(err => next(err)));
}

function isAuthenticatedWS(socket) {
  return new Promise((resolve, reject) => {
    if (socket.handshake.query && socket.handshake.query.access_token) {
      jwt.verify(socket.handshake.query.access_token, config.jwtSecret, (err, decoded) => {
        if (err) {
          resolve(false);
          return null;
        }
        socket.userId = decoded._id;
        resolve(socket.userId);
        return;
      });
    } else {
      resolve(false);
      return null;
    }
  });
}

function generateTempToken(_id) {
  const token = jwt.sign({
    _id
  }, config.jwtSecret);

  return token;
}

function sendFCM(data, title, message) {
  const fcm = new FCM(serverKey);

  var message = { // this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: data.fcmToken,
    priority: 10,
    notification: {
      title,
      body: message,
    },
  };

  fcm.send(message, (err, response) => {
    if (err) {
      console.log('Something has gone wrong!');
    } else {
      console.log('Successfully sent with response: ', response);
    }
  });
}

module.exports = { isAuthenticated, isAuthenticatedAgent, isAuthenticatedUnVerified, isAuthenticatedUnVerifiedAgent, generateTempToken, isAuthenticatedWS, sendFCM };
