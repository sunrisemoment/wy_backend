var mongoose = require('mongoose');
var util = require('util');

// config should be imported before importing any other file
var config = require('./config/config');
var app = require('./config/express');

var debug = require('debug')('servicerequestapi:index');

// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

// plugin bluebird promise in mongoose
mongoose.Promise = Promise;

// connect to mongo db
var mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${mongoUri}`);
});

// print mongoose logs in dev env
if (config.mongooseDebug) {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    console.log(`${collectionName}.${method}`, JSON.stringify(query));
  });
}

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
  });
}

module.exports = app;

var express = require('express');
var roleRoutes = require('./server/role/role.route');
var userRoutes = require('./server/user/user.routes');
var authRoutes = require('./server/auth/auth.routes');
var wayagramRoutes = require('./server/wayagram/wayagram.routes');
var wayagramCommentsRoutes = require('./server/wayagramComments/wayagramComments.routes');
var uploadRoutes = require('./server/upload/upload.routes');

var router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /API Health Check - Check service health */
router.get('/is-alive', (req, res) =>
  res.send('OK')
);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount user routes at /upload
router.use('/upload', uploadRoutes);

// mount user routes at /roles
router.use('/roles', roleRoutes);

// mount user routes at /users
router.use('/users', userRoutes);

// mount user routes at /wayagram
router.use('/wayagram', wayagramRoutes);

// mount user routes at /wayagram/comments
router.use('/wayagram/comments', wayagramCommentsRoutes);


module.exports = router;

var Audit = require('../auditinfo/auditinfo.model');


var dbActions = {
  register: 'register',
  create: 'create',
  update: 'update',
  delete: 'delete',
  emailsent: 'emailsent',
  smssent: 'smssent',
  print: 'print'
};

/**
 *
 * @param {*} userId
 * @param {*} objectId
 * @param {*} action
 * @param {*} detail
 */
function info(userId, objectId, action, detail) {
  Audit.create({
    userId,
    objectId,
    action,
    detail,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  var { limit = 50, skip = 0 } = req.query;
  Audit.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}


module.exports = { info, list, dbActions };

var mongoose = require('mongoose');

var AuditInfoSchema = new mongoose.Schema({
  userId: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    user: {
      type: String,
      required: true
    },
  },
  objectId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  action: {
    type: String,
    enum: ['register', 'create', 'update', 'delete', 'emailsent', 'smssent', 'print'],
    required: true
  },
  detail: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
   __v: { type: Number, select: false}
});


AuditInfoSchema.statics = {

  /**
 * List users in descending order of 'createdAt' timestamp.
 * @param {number} skip - Number of users to be skipped.
 * @param {number} limit - Limit number of users to be returned.
 * @returns {Promise<User[]>}
 */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  }
};

/**
 * @typedef AuditInfo
 */
module.exports = mongoose.model('AuditInfo', AuditInfoSchema, 'auditInfo');

var express = require('express');
var auditCtrl = require('./auditinfo.controller');

var router = express.Router(); // eslint-disable-line new-cap

router.route('/')
    /**
      * GET /api/audit - Get list of Audit
      * @swagger
      * /audit:
      *   get:
      *     tags:
      *       - Audit
      *     description:  Get list of Audit
      *     responses:
      *        200:
      *           description: Get Audit Info
      *
      */
    .get(auditCtrl.list);


module.exports = router;

var _Response = require('../helpers/Response');
var jwt = require('jsonwebtoken');
var httpStatus = require('http-status');
var APIError = require('../helpers/APIError');
var Global = require('../helpers/global');
var config = require('../../config/config');
var bcrypt = require('bcryptjs');
var User = require('../user/user.model');

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
  // Ideally you'll fetch this from the db
  // Idea here was to show how jwt works with simplicity

  return User.authenticate(req.body.identifier, next)
    .then((user) => {
      if (!user) {
          var err = new APIError('Incorrect '+identifier+'/password !', httpStatus.UNAUTHORIZED);
          return next(err);
      }
      // if (!user.isActive) {
      //   var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
      //   return next(err);
      // }
      // if (!user.isVerify) {
      //   var err = new APIError('Please verify EmailId to continue', httpStatus.UNAUTHORIZED);
      //   return next(err);
      // }
      bcrypt.compare(req.body.password, user.password).then((match) => {
        if (match) {
          var token = jwt.sign({
            _id: user._id
          }, config.jwtSecret);

          Response.data = {
            token,
            _id: user._id
          }

          res.json(Response);
        } else {
          var err = new APIError('Incorrect '+identifier+'/password!', httpStatus.UNAUTHORIZED);
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
  // req.user is assigned by jwt middleware if valid token is provided
  return res.json({
    user: req.user,
    num: Math.random() * 100
  });
}

module.exports = { login, getRandomNumber };

var express = require('express');
var validate = require('express-validation');
var expressJwt = require('express-jwt');
var paramValidation = require('../../config/param-validation');
var auth = require('./auth.service');
var authCtrl = require('./auth.controller');
var userCtrl = require('../user/user.controller');
var config = require('../../config/config');

var router = express.Router(); // eslint-disable-line new-cap

/** POST /api/auth/login - Returns token if correct username and password is provided */
/**
  * @swagger
  * /auth/login:
  *   post:
  *     tags:
  *         - Login
  *     description:  Returns token if correct username and password is provided
  *     consumes:
  *       - application/json
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: Enter User name & Password
  *         description: Login of user
  *         in: body
  *         schema:
  *           type: object
  *           required:
  *               - identifier
  *               - password
  *           properties:
  *              identifier:
  *                 type:string
  *                 description:Enter User Name
  *              password:
  *                 type:string
  *                 description:Enter Password
  *           example:
  *             identifier: "admin@super.com"
  *             password: "123456"
  *     responses:
  *        200:
  *           description: Get Token & Profile Info
  *        400:
  *           description: Bad Input Field
  *        404:
  *           description: No User Found
  *        401:
  *           description: Incorrect Password
  *
  */
router.route('/login')
  .post(validate(paramValidation.login), authCtrl.login);

/**
  * @swagger
  * /auth/parse-jwt:
  *   get:
  *     tags:
  *       - Login
  *       - JWT
  *     security:
  *       - JWT: []
  *     description:  needs token returned by the above as header. Authorization Bearer {token}
  *     responses:
  *        200:
  *           description: Get Parsed Token
  *        401:
  *           description: Un-Authorized
  *
  */
router.route('/parse-jwt')
  .get(expressJwt({ secret: config.jwtSecret }), authCtrl.getRandomNumber);

/**
  * @swagger
  * /auth/me:
  *   get:
  *     tags:
  *       - User Profile
  *       - Users
  *     security:
  *       - JWT: []
  *     description:  needs token returned by the above as header. Authorization Bearer {token}
  *     responses:
  *        200:
  *           description: Get Auth User Profile
  *        401:
  *           description: Un-Authorized
  *
  */
 router.route('/me')
   .get(auth.isAuthenticated(), userCtrl.index);

module.exports = router;

var httpStatus = require('http-status');
var expressJwt = require('express-jwt');
var config = require('../../config/config');
var APIError = require('../helpers/APIError');
var User = require('../user/user.model');

var compose = require('composable-middleware');


var validateJwt = expressJwt({
  secret: config.jwtSecret
});

// var jwtUserInfo = expressJwt({
//   secret: config.jwtSecret,
//   credentialsRequired: false
// });

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
      validateJwt(req, res, next);
    })
    // Attach user to request
    .use((req, res, next) => User.findById(req.user._id).exec()
      .then((user) => {
        if (!user) {
          var err = new APIError('User is Not Authorised', httpStatus.UNAUTHORIZED);
          return next(err);
        }
        // if (!user.isActive) {
        //   var err = new APIError('User is disabled by Administrator!', httpStatus.UNAUTHORIZED);
        //   return next(err)
        // }
        // if (!user.isVerify) {
        //   var err = new APIError('Please verify EmailId to continue', httpStatus.UNAUTHORIZED);
        //   return next(err)
        // }
        req.user = user; // eslint-disable-line no-param-reassign
        next();
        return null;
      })
      .catch(err => next(err)));
}

module.exports = { isAuthenticated };

var request = require('supertest-as-promised');
var httpStatus = require('http-status');
var jwt = require('jsonwebtoken');
var chai = require('chai'); // eslint-disable-line import/newline-after-import
var expect = chai.expect;
var app = require('../../index');
var config = require('../../config/config');

chai.config.includeStack = true;

describe('## Auth APIs', () => {
  var validUserCredentials = {
    identifier: 'admin@super.com',
    password: '123456'
  };

  var invalidUserCredentials = {
    identifier: 'react',
    password: 'IDontKnow'
  };

  // let jwtToken;

  describe('# POST /api/auth/login', () => {
    it('should return No such user exists!', (done) => {
      request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/json')
        .send(invalidUserCredentials)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.message).to.equal('No such user exists!');
          done();
        })
        .catch(done);
    });

    it('should get valid JWT token', (done) => {
      request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/json')
        .send(validUserCredentials)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.have.property('token');
          jwt.verify(res.body.token, config.jwtSecret, (err, decoded) => {
            expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
            expect(decoded.username).to.equal(validUserCredentials.username);
            // jwtToken = `Bearer ${res.body.token}`;
            done();
          });
        })
        .catch(done);
    });
  });

  // describe('# GET /api/auth/random-number', () => {
  //   it('should fail to get random number because of missing Authorization', (done) => {
  //     request(app)
  //       .get('/api/auth/random-number')
  //       .expect(httpStatus.UNAUTHORIZED)
  //       .then((res) => {
  //         expect(res.body.message).to.equal('Unauthorized');
  //         done();
  //       })
  //       .catch(done);
  //   });

  //   it('should fail to get random number because of wrong token', (done) => {
  //     request(app)
  //       .get('/api/auth/random-number')
  //       .set('Authorization', 'Bearer inValidToken')
  //       .expect(httpStatus.UNAUTHORIZED)
  //       .then((res) => {
  //         expect(res.body.message).to.equal('Unauthorized');
  //         done();
  //       })
  //       .catch(done);
  //   });

  //   it('should get a random number', (done) => {
  //     request(app)
  //       .get('/api/auth/random-number')
  //       .set('Authorization', jwtToken)
  //       .expect(httpStatus.OK)
  //       .then((res) => {
  //         expect(res.body.num).to.be.a('number');
  //         done();
  //       })
  //       .catch(done);
  //   });
  // });
});

var httpStatus = require('http-status');

/**
 * @extends Error
 */
class ExtendableError extends Error {
  constructor(message, status, isPublic) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.status = status;
    this.isPublic = isPublic;
    this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
    //Error.captureStackTrace(this, this.constructor.name);
  }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class APIError extends ExtendableError {
  /**
   * Creates an API error.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code of error.
   * @param {boolean} isPublic - Whether the message should be visible to user or not.
   */
  constructor(message, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = true) {
    super(message, status, isPublic);
  }
}


module.exports = APIError;

var cron = require('node-cron');
var config = require('../../config/config');
var Email = require('../helpers/email');
var User = require('../user/user.model');
var Notifications = require('../notifications/notifications.model');

cron.schedule(config.cron.forgot, () => {
  var d = new Date();
  d.setMinutes(d.getMinutes() - config.expiry.forgotToken);
  User.findByQuery({ forgotToken: { $ne: null }, updatedAt: { $lte: d } })
    .then((user) => {
      user.forEach((el) => {
        el.forgotToken = null;// eslint-disable-line no-param-reassign
        el.updatedAt = Date.now();
        el.save().then(() => {

        });
      });
    });
});

cron.schedule(config.cron.notification, () => {
  Notifications.getQueued()
    .then((data) => {
      data.forEach((el) => {

        switch (el.templateId) {
          case 'NEW_USER':
            Email.verifyNewUser(el.sendTo, `Verify your email id via <a href="${config.appURL}verify/${el.notification._id}">Click Me</a>`);
            break;
          case 'FORGOT_PASS':
            Email.forgotPassword(el.sendTo, `<a href="${config.appURL}forgot/verify?forgotToken=${el.forgotToken}">Click Me</a>`);
            break;
          case 'TICKET_STATUS':
              Email.ticketStatusUpdate(el.sendTo, `
              
                <br/>Ticket Status has been updated
                <br/>Ticket Id : ${el.notification.ticket.ticketNo}
                <br/>Ticket Status : ${el.notification.ticket.status}
              
              `);
              break;
        }

        el.status = "sent";
        el.updatedAt = Date.now();
        ++el.retries;

        el.save()
        .then(() => {

        })
      })
    })
});

var logger = require('../../config/winston');
var nodemailer = require('nodemailer');
var config = require('../../config/config');

let transport = null;
let emailOptions = {};


/**
 *  Get Setting from DB
 */
function getSettings(callback) {
  emailOptions = {
    host: config.mailOptions.host,
    hostPort: config.mailOptions.hostPort,
    auth: {
      user: config.mailOptions.user,
      pass: config.mailOptions.pass
    }
  };
  transport = nodemailer.createTransport(emailOptions);
  callback();
}


/**
 *
 */
function emailCheck() {
  var message = {
    from: emailOptions.auth.user,
    to: emailOptions.auth.user,
    subject: `Server Started at ${Date.now()}`,
    text: 'Please confirm your email',
    html: `Server Started at ${Date.now()}`
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      return logger.log({
        level: 'error',
        message: error
      });
    }
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

/**
 *
 * @param {*} to
 * @param {*} html
 */
function verifyNewUser(to, html) {
  var message = {
    from: emailOptions.auth.user,
    to,
    subject: 'Verify your email id',
    text: 'Verify your email id',
    html
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      return logger.log({
        level: 'error',
        message: error
      });
    }
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

/**
 *
 * @param {*} to
 * @param {*} html
 */
function forgotPassword(to, html) {
  if(!emailOptions.auth.user){getSettings();}
  var message = {
    from: emailOptions.auth.user,
    to,
    subject: 'Forgot Password',
    text: 'Forgot Password',
    html
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      return logger.log({
        level: 'error',
        message: error
      });
    }
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

// init email service

getSettings(emailCheck);

module.exports = { verifyNewUser, forgotPassword,getSettings };

var crypto = require("crypto");
var User = require('../user/user.model');

/**
 *
 * @param {*} length
 */
function randomString(length=128) {
  return crypto.randomBytes(length).toString('hex');
}

function inviteCode(length=3){
  let code = crypto.randomBytes(length).toString('hex').toUpperCase();
  if(isCodeExist(code)){
    inviteCode();
  }else{
    return code;
  }
}

function isCodeExist(code){
  User.findOne({inviteCode:code}).exec().then(user=>{
    return user;
  })
}

function getIpAddress(req) {
  return req.headers['x-forwarded-for'] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function zeroPadding(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function mongoQuery(req){
  var query = {};
  var tmp = "";
  for(var key in req.query){
    if (req.query.hasOwnProperty(key)) {
      console.log(key + " -> " + req.query[key]);
      if(key.indexOf('_gte') !== -1){
        tmp = key.replace("_gte", "");
        if(tmp == 'createdAt' || tmp == 'updatedAt') {
          query[tmp] = {$gte: new Date(req.query[key])};
        }
        else {
          query[tmp] = {$gte: req.query[key]};
        }
      }

      if(key.indexOf('_lte') !== -1){
        tmp = key.replace("_lte", "");
        if(tmp == 'createdAt' || tmp == 'updatedAt') {
          query[tmp] = {$lte: new Date(req.query[key])};
        }
        else {
          query[tmp] = {$lte: req.query[key]};
        }
       }

      if(key.indexOf('_in') !== -1){
        tmp = key.replace("_in", "");
        let qry = req.query[key].slip(',');
        query[tmp] = {$in: qry};
      }

      if(key.indexOf('_eq') !== -1){
        tmp = key.replace("_eq", "");
        query[tmp] = {$eq: req.query[key]};
      }

      if(key.indexOf('_ne') !== -1){
        tmp = key.replace("_ne", "");
        query[tmp] = {$ne: req.query[key]};
      }


      if(key.indexOf('_contains') !== -1){
        tmp = key.replace("_contains", "");
        query[tmp] = { $regex: req.query[key] };
      }
    }
  }

  console.log(query);
  return query;
}

module.exports = { randomString, getIpAddress, validateEmail, mongoQuery,zeroPadding,inviteCode };

var httpStatus = require('http-status');

var Response = {
    status : 200,
    response : true,
    data : null,
    message : null,
    errorMessage : null
}


module.exports = Response;
var mongoose = require('mongoose');

var NotificationsSchema = new mongoose.Schema({
  notification: {
    type: Object,
    required: true
  },
  via: {
    type: String,
    enum:["email","sms"],
    required: true
  },
  templateId : {
    type: String,
    enum:["NEW_USER","FORGOT_PASS","TICKET_STATUS","NONE"],
    default:"NONE"
  },
  sendTo:{
    type: String,
    required: true
  },
  ccTo:{
    type: String,
  },
  status:{
    type: String,
    enum:["queued","sent","retry"],
    default : "queued",
    required: true
  },
  retries:{
    type: Number,
    required: true,
    default : 0,
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
});


/**
 * Statics
 */
NotificationsSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of Schema.
   * @returns {Promise<User, APIError>}
   */
  getQueued() {
    return this.find({status:'queued'})
      .exec()
      .then((data) => {
        if (data) {
          return data;
        }
        var err = new APIError('No such Notifcations exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },
};


/**
 * @typedef Notifications
 */
module.exports = mongoose.model('Notifications', NotificationsSchema);

var Roles = require('./role.model');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function getInternalRoles(req, res, next) {
   
    Roles.get({userType:'internal'})
        .then((model) => {
            res.json({ data: model, totalRecords: model.length });
        })
        .catch(e => next(e));
}

module.exports = {
    getInternalRoles
}
var mongoose = require('mongoose');

var RolesSchema = new mongoose.Schema({
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
  __v: { type: Number, select: false}
});


RolesSchema.statics = {

  get(query) {
    return this.find(query).select('-permissions')
      .exec()
      .then((data) => {
        if (data) {
          return data;
        }
        var err = new APIError('No such Role exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

};

/**
 * @typedef Roles
 */
module.exports = mongoose.model('Roles', RolesSchema);

var express = require('express');
var ctrl = require('./role.controller');

var auth = require('../auth/auth.service');

var router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    .get(ctrl.getInternalRoles);

module.exports = router;

var request = require('supertest-as-promised');
var httpStatus = require('http-status');
var chai = require('chai'); // eslint-disable-line import/newline-after-import
var expect = chai.expect;
var app = require('../../index');

chai.config.includeStack = true;

describe('## Misc', () => {
  describe('# GET /api/is-alive', () => {
    it('should return OK', (done) => {
      request(app)
        .get('/api/is-alive')
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.text).to.equal('OK');
          done();
        })
        .catch(done);
    });
  });
});

var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var postDIR = "/post/";
var profileDIR = "/profile/";


function imageUpload(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) {
        Response.status=httpStatus.BAD_REQUEST;
        Response.data = null;
        Response.message = "No files were uploaded."
        return res.send(Response);
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let file = req.files.file;
    let filename = Global.randomString(20)+file.name;
    // Use the mv() method to place the file somewhere on your server
    file.mv('./public'+postDIR+filename, function (err) {
        if (err){
            Response.status=httpStatus.INTERNAL_SERVER_ERROR;
            Response.data = null;
            Response.message = "No files were uploaded.";
            return res.send(Response);
        }
        
        Response.data = {
            imageName : postDIR+filename
        }
        Response.message = "Files uploaded.";
        res.send(Response);
    });
}


function profileUpload(req, res, next) {
    if (!req.files || Object.keys(req.files).length === 0) {
        Response.status=httpStatus.BAD_REQUEST;
        Response.data = null;
        Response.message = "No files were uploaded."
        return res.send(Response);
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let file = req.files.file;
    let filename = Global.randomString(20)+file.name;
    // Use the mv() method to place the file somewhere on your server
    file.mv('./public'+profileDIR+filename, function (err) {
        if (err){
            Response.status=httpStatus.INTERNAL_SERVER_ERROR;
            Response.data = null;
            Response.message = "No files were uploaded.";
            return res.send(Response);
        }
        
        Response.data = {
            imageName : profileDIR+filename
        }
        Response.message = "Files uploaded.";
        res.send(Response);
    });
}


module.exports = {
    imageUpload,
    profileUpload
};

var express = require('express');
var validate = require('express-validation');
var paramValidation = require('../../config/param-validation');
var uploadCtrl = require('./upload.controller');

var auth = require('../auth/auth.service');

var router = express.Router(); // eslint-disable-line new-cap

//TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/post').post(auth.isAuthenticated(), uploadCtrl.imageUpload);
router.route('/profile').post(auth.isAuthenticated(), uploadCtrl.imageUpload);



module.exports = router;
var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var Audit = require('../auditinfo/auditinfo.controller');

var Notifications = require('../notifications/notifications.model');
var User = require('./user.model');
var Role = require('../role/role.model');


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res) {
  User.get(req.user._id).then((user) => {
    Response.data = user;
    return res.send(Response);
  })
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function store(req, res, next) {

  let user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    country: req.body.country,
    role: req.body.role,
    inviteCode: req.body.firstName + '_' + Global.inviteCode(),
    password: req.body.password
  });


  user.save()
    .then((savedUser) => {
      // Notifications.create({
      //   notification: { _id: savedUser._id },
      //   via: "email",
      //   templateId: "NEW_USER",
      //   sendTo: savedUser.email,
      //   ccTo: null,
      //   createdAt: Date.now()
      // });

      Response.data = null;
      Response.message = 'User created. Please check email to verify email';
      res.send(Response);
      return null;
    })
    .catch((e) => {
      next(e);
    });
}



/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function update(req, res, next) {

  var user = {};
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.country = req.body.country;
  user.city = req.body.city;
  user.state = req.body.state;
  user.street = req.body.street;
  user.smsAlert = req.body.smsAlert;
  user.updatedAt = Date.now();

  User.findByIdAndUpdate(req.user._id, user).then((user) => {
    Response.data = user;
    res.send(Response);
  });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function destroy(req, res) {
  User.findByIdAndUpdate(req.user._id, { isActive: false, updatedAt: Date.now() }).then((user) => {
    Response.data = user;
    res.send(Response);
  });
}



module.exports = {
  index,
  store,
  update,
  destroy
};

var Promise = require('bluebird');
var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);
var httpStatus = require('http-status');
var APIError = require('../helpers/APIError');
var bcrypt = require('bcryptjs');

var SALT_WORK_FACTOR = 10;
var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;// eslint-disable-line max-len,no-useless-escape

/**
 * User Schema
 */
var UserSchema = new mongoose.Schema({
  profilePic: {
    type: String,
    default: '',
    trim: true
  },
  merchantName: {
    type: String,
    required: false,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: Boolean,
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
  inviteCode: {
    type: String,
    default: null,
    required: false,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ["USER", "MERCHANT", "ADMIN", "SUPER_ADMIN"],
    default: "USER",
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
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isVerify: {
    type: Boolean,
    default: false
  },
  forgotToken: {
    type: String,
    select: null,
    default: null
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
UserSchema.plugin(AutoIncrement, { inc_field: 'userId' });

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

// Validate email is not taken
// UserSchema
//   .path('email')
//   .validate(function validate(value, respond) {
//     return this.constructor.findOne({ email: value }).exec()
//       .then((user) => {
//         if (user) {
//           if (this.id === user.id) {
//             return respond(true);
//           }
//           return respond(false);
//         }
//         return respond(true);
//       })
//       .catch((err) => {
//         throw err;
//       });
//   }, 'The specified email address is already in use.');

UserSchema.path('phone').validate(function (value, done) {
  this.constructor.count({ phone: value }, function (err, count) {
    if (err) {
      return done(err);
    }
    // If `count` is greater than zero, "invalidate"
    done(!count);
  });
}, 'Phone already exists');

// UserSchema.path('userName').validate(function (value, done) {
//   this.constructor.count({ userName: value }, function (err, count) {
//     if (err) {
//       return done(err);
//     }
//     // If `count` is greater than zero, "invalidate"
//     done(!count);
//   });
// }, 'Username already exists');


UserSchema.pre('save', function save(next) {
  var user = this;
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

UserSchema.post('save', (error, doc, next) => {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error (Phone or Username)'));
  } else {
    next();
  }
});


/**
 * Statics
 */
UserSchema.statics = {
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
        } else {
          var err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        }
      });
  },

  findByQuery(query) {
    return this.find(query)
      .exec()
      .then(user => user);
  },

  findOneByQuery(query) {
    return this.findOne(query).select('+forgotToken')
      .exec()
      .then(user => user);
  },

  /**
   *
   * @param {*} email
   */
  authenticate(identifier, next) {
    return this.findOne({ $or: [{ phone: identifier }] })
      .select('+password')
      .exec()
      .then((user) => {
        return user;
        //var err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        // return Promise.reject(err);
        //next(err);
        //return null;
      });
  },

  findByEmail(identifier) {
    return this.findOne({ email: identifier })
      .exec()
      .then(user => user);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list(query, { limit, skip }, assoc) {

    var users = this.find(query);

    if (assoc == 1) {
      UserSchema.set('toObject', { virtuals: true });
      UserSchema.set('toJSON', { virtuals: true });
      users = users.populate({ path: 'role' })
    }

    if (limit > -1) {
      users = users.skip(+skip).limit(+limit)
    }

    return users.exec();
  }
};

UserSchema.methods.toJSON = function toJSON() {
  var obj = this.toObject();
  delete obj.password;
  return obj;
};

UserSchema.methods = {
  comparePassword(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return cb(err);
      cb(null, isMatch);
      return null;
    });
    return null;
  }
};

UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });


/**
 * @typedef User
 */
module.exports = mongoose.model('User', UserSchema);

var express = require('express');
var validate = require('express-validation');
var paramValidation = require('../../config/param-validation');
var userCtrl = require('./user.controller');

var auth = require('../auth/auth.service');

var router = express.Router(); // eslint-disable-line new-cap

//TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

  .get(auth.isAuthenticated(), userCtrl.index)


  .post(validate(paramValidation.createUser), userCtrl.store);


router.route('/:userId')


  .put(validate(paramValidation.updateUser), auth.isAuthenticated(), userCtrl.update)

  .delete(auth.isAuthenticated(), userCtrl.destroy)

module.exports = router;

var mongoose = require('mongoose');
var request = require('supertest-as-promised');
var jwt = require('jsonwebtoken');
var httpStatus = require('http-status');
var chai = require('chai'); // eslint-disable-line import/newline-after-import
var expect = chai.expect;
var app = require('../../index');
var config = require('../../config/config');

chai.config.includeStack = true;

var Role = require('../role/role.model');

let role = {};
let user = {};

let jwtToken;

let validUserCredentials = {};

before(() => {
  Role.findOne({ roleName: 'Dealer' }).exec().then((_role) => {
    role = _role;
  });


  /**
   * root level hooks
   */
  after((done) => {
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
    done();
  });

  describe('## User APIs', () => {
    describe('# POST /api/users', () => {
      it('should create a new user', (done) => {
        user = {
          userName: `superuser_${Date.now()}`,
          name: 'Super User',
          address: 'M93',
          country: 'India',
          phone: '9968302319',
          email: `test_${Date.now()}@super.com`,
          role: role._id,
          password: '123456',
          isActive: true,
          type: role.userType,
          company: 'STAD',
          gstin: '1234567'
        };
        request(app)
          .post('/api/users')
          .send(user)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body.message).to.equal('User created. Please check email to verify email');
            done();
          })
          .catch(done);
      });
    });

    describe('# POST /api/auth/login for Dealer', () => {
      it('should get valid JWT token', (done) => {
        validUserCredentials = {
          identifier: user.email,
          password: user.password
        };

        request(app)
          .post('/api/auth/login')
          .set('content-type', 'application/json')
          .send(validUserCredentials)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.have.property('token');
            jwt.verify(res.body.token, config.jwtSecret, (err) => {
              expect(err).to.not.be.ok; // eslint-disable-line no-unused-expressions
              jwtToken = `Bearer ${res.body.token}`;
              user._id = res.body._id;
              done();
            });
          })
          .catch(done);
      });
    });


    describe('# GET /api/auth/me', () => {
      it('should get user details or Please verify EmailId to continue', (done) => {
        request(app)
          .get('/api/auth/me')
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');

            done();
          })
          .catch(done);
      });

      it('should report error with message - Not found, when user does not exists', (done) => {
        request(app)
          .get('/api/users/56c787ccc67fc16ccc1a5e92')
          .then((res) => {
            expect(res.body.message).to.equal('No such user exists!');
            done();
          })
          .catch(done);
      });
    });

    describe('# PUT /api/users/:userId', () => {
      it('should update user details or Please verify EmailId to continue', (done) => {
        user.userName = 'KK';
        request(app)
          .put(`/api/users/${user._id}`)
          .send(user)
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');
            done();
          })
          .catch(done);
      });
    });

    describe('# GET /api/users/', () => {
      it('should get all users', (done) => {
        request(app)
          .get('/api/users')
          .set('Authorization', jwtToken)
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.be.an('array');
            done();
          })
          .catch(done);
      });

      it('should get all users (with limit and skip)', (done) => {
        request(app)
          .get('/api/users')
          .query({ limit: 10, skip: 1 })
          .expect(httpStatus.OK)
          .then((res) => {
            expect(res.body).to.be.an('array');
            done();
          })
          .catch(done);
      });
    });

    describe('# DELETE /api/users/', () => {
      it('should delete user or give Please verify EmailId to continue', (done) => {
        request(app)
          .delete(`/api/users/${user._id}`)
          .set('Authorization', jwtToken)
          .expect(httpStatus.NOT_ACCEPTABLE)
          .then((res) => {
            expect(res.body.message).to.equal('Please verify EmailId to continue');
            done();
          })
          .catch(done);
      });
    });
  });
});

var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var WayaGramPost = require('./wayagram.model');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    WayaGramPost.postData().then((data) => {
        Response.data = data;
        Response.message = 'WayaGram Posts';
        res.send(Response);
        return null;
    })
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function store(req, res, next) {
    let wayagramPost = new WayaGramPost({
        image: req.body.image,
        description: req.body.description,
        userId: req.user._id
    })

    wayagramPost.save()
        .then((post) => {
            WayaGramPost.findId(post._id).then((post) => {
                Response.data = post;
                Response.message = 'WayaGram Post Created';
                res.send(Response);
                return null;
            })
            return null;
        })
        .catch((e) => {
            next(e);
        });
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function repost(req, res, next) {

    let wayagramPost = new WayaGramPost({
        image: req.body.image,
        description: req.body.description,
        sharedPost: req.body.sharedPost,
        userId: req.user._id
    })

    wayagramPost.save()
        .then((post) => {
            WayaGramPost.findId(post._id).then((post) => {
                Response.data = post;
                Response.message = 'WayaGram Post Re-Created';
                res.send(Response);
                return null;
            })
            return null;
        })
        .catch((e) => {
            next(e);
        });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function postLike(req, res, next) {

    WayaGramPost.findId(req.params.postId).then((post) => {

        var likeIndex = post.like.indexOf(req.params.userId);
        if (likeIndex !== -1) {
            post.like.splice(likeIndex, 1);
            Response.message = 'WayaGram Post Un-Liked';
        } else {
            post.like = post.like.concat([req.params.userId]);
            Response.message = 'WayaGram Post Liked';
        }

        post.save().then((wayagramPost) => {
            WayaGramPost.findId(req.params.postId).then((_post) => {
                Response.data = _post;
                res.send(Response);
                return null;
            })
            return null;
        })
            .catch((e) => {
                next(e);
            });


    });
}


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function update(req, res, next) {

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function destroy(req, res, next) {
    WayaGramPost.findAndUpdate(req.params.postId, { isActive: false })
        .then((data) => {
            Response.data = null;
            if (!data) {
                Response.message = 'WayaGram Post Already Deleted';
                res.send(Response);
                return null;
            } else {
                Response.message = 'WayaGram Post Deleted';
                res.send(Response);
                return null;
            }
        })
        .catch((e) => {
            next(e);
        });
}

module.exports = {
    index,
    store,
    postLike,
    repost,
    update,
    destroy
};

var mongoose = require('mongoose');

var WayaGramSchema = new mongoose.Schema({
    image: {
        type: String,
        default: null,
        trim: true
    },
    description: {
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
    like: {
        type: Array,
        default: [],
    },
    commentCount: {
        type: Number,
        default: 0
    },
    sharedPost: {
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


WayaGramSchema.virtual('user', {
    ref: 'User', // The model to use
    localField: 'userId', // Find people where `localField`
    foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: true,
});

WayaGramSchema.virtual('sharedUser', {
    ref: 'User', // The model to use
    localField: 'sharedPost.userId', // Find people where `localField`
    foreignField: '_id', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: true,
});


WayaGramSchema.statics = {

    findId(id) {
        return this.findById(id)
            .exec()
            .then(data => data);
    },
    findByQuery(query) {
        return this.find(query)
            .exec()
            .then(data => data);
    },
    postData(query) {
        WayaGramSchema.set('toObject', { virtuals: true });
        WayaGramSchema.set('toJSON', { virtuals: true });
        return this.find(query)
        .populate({path:'sharedUser',select:{'_id':1,'userId':1,'firstName':1,'lastName':1,'profilePic':1}})
        .populate({path:'user',select:{'_id':1,'userId':1,'firstName':1,'lastName':1,'profilePic':1}}).exec().then(data => data);
    },
    findAndUpdate(_id, update) {
        return this.findOneAndUpdate({ _id: _id, isActive: true }, update)
            .exec()
            .then(data => data);
    },
};
module.exports = mongoose.model('WayaGram', WayaGramSchema);

var express = require('express');
var validate = require('express-validation');
var paramValidation = require('../../config/param-validation');
var wayagramCtrl = require('./wayagram.controller');

var auth = require('../auth/auth.service');

var router = express.Router(); // eslint-disable-line new-cap

//TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), wayagramCtrl.index)


    .post(validate(paramValidation.createPost), auth.isAuthenticated(), wayagramCtrl.store)

    .copy(validate(paramValidation.createRePost), auth.isAuthenticated(), wayagramCtrl.repost);


router.route('/:postId')

    .put(validate(paramValidation.createPost), auth.isAuthenticated(), wayagramCtrl.update)

    .delete(auth.isAuthenticated(), wayagramCtrl.destroy);

router.route('/:postId/user/:userId').patch(auth.isAuthenticated(), wayagramCtrl.postLike)

module.exports = router;

var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var WayaGramComments = require('./wayagramComments.model');
var WayaGramPost = require('../wayagram/wayagram.model');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    WayaGramComments.findByQuery({ postId: req.params.postId }).then((data) => {
        Response.data = data;
        Response.message = 'WayaGram Comments';
        res.send(Response);
        return null;
    })
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function store(req, res, next) {
    let wayaGramComments = new WayaGramComments({
        postId: req.body.postId,
        comment: req.body.comment,
        userId: req.user._id
    })

    wayaGramComments
        .save()
        .then((post) => {
            WayaGramComments.findId(post._id).then((post) => {
                WayaGramPost.findOneAndUpdate({ _id: req.body.postId }, { $inc: { commentCount: 1 } }, { new: true }).exec().then(() => {
                    Response.data = post;
                    Response.message = 'WayaGram Comment Created';
                    res.send(Response);
                    return null;
                });
                return null;
            })
            return null;
        })
        .catch((e) => {
            next(e);
        });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function update(req, res, next) {

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function destroy(req, res, next) {
    Response.data = null;
    WayaGramComments.findAndUpdate(req.params.commentId, { isActive: false })
        .then((data) => {
            if (!data) {
                Response.message = 'WayaGram Comment Already Deleted';
                res.send(Response);
                return null;
            } else {
                WayaGramPost.findOneAndUpdate({ _id: data.postId }, { $inc: { commentCount: -1 } }, { new: true }).exec().then(() => {
                    Response.message = 'WayaGram Comment Deleted';
                    res.send(Response);
                    return null;
                });
            }
            return null;
        })
        .catch((e) => {
            next(e);
        });
}

module.exports = {
    index,
    store,
    update,
    destroy
};

var mongoose = require('mongoose');

var WayaGramCommentsSchema = new mongoose.Schema({
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


WayaGramCommentsSchema.statics = {

    findId(id) {
        return this.findById(id)
            .exec()
            .then(data => data);
    },
    findByQuery(query) {
        return this.find(query)
            .exec()
            .then(data => data);
    },
    findAndUpdate(_id,update) {
        return this.findOneAndUpdate({_id:_id,isActive:true},update)
            .exec()
            .then(data => data);
    },
};
module.exports = mongoose.model('WayaGramComments', WayaGramCommentsSchema);

var express = require('express');
var validate = require('express-validation');
var paramValidation = require('../../config/param-validation');
var wayagramCtrl = require('./wayagramComments.controller');

var auth = require('../auth/auth.service');

var router = express.Router(); // eslint-disable-line new-cap

//TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .post(validate(paramValidation.createComment), auth.isAuthenticated(), wayagramCtrl.store);

router.route('/:postId')

    .get(auth.isAuthenticated(), wayagramCtrl.index)

router.route('/:commentId')

    .put(validate(paramValidation.createComment), auth.isAuthenticated(), wayagramCtrl.update)

    .delete(auth.isAuthenticated(), wayagramCtrl.destroy);

module.exports = router;
