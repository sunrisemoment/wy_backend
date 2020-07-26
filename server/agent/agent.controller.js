var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var config = require('../../config/config');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var Audit = require('../auditinfo/auditinfo.controller');
var Notification = require('../notifications/notifications.controller');

var Agent = require('./agent.model');
var QRCode = require('../qrCode/qrCode.model');

var auth = require('../auth/auth.service');
var otpCtrl = require('../otp/otp.controller');
var OTP = require('../otp/otp.model');


/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res) {
  var Response = { ..._Response };
  QRCode.findByQuery({ agent: req.user._id }).then(data => {
    Response.data = data;
    Response.message = "All QR Code On-boarded";
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
  var Response = { ..._Response };
  var phoneC = req.body.countryCode + req.body.phone;

  var passwordSymbol = req.body.password;
  if(passwordSymbol.indexOf('*')!=-1){
    var err = new APIError('Password contains (*) symbol which is not allowed !', httpStatus.UNPROCESSABLE_ENTITY);
    return next(err);
  }


  Agent.findOne({ phone: phoneC,isActive:true }).then((userExists) => {

    if (userExists) {
      var err = new APIError('Phone already exists!', httpStatus.UNPROCESSABLE_ENTITY);
      return next(err);
    }

    if (req.body.role.toUpperCase() !== "AGENT") {
      var err = new APIError('Role Not Exists!', httpStatus.UNPROCESSABLE_ENTITY);
      return next(err);
    }


    let agent = new Agent({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: phoneC,
      country: req.body.country || "",
      city: req.body.city || "",
      street: req.body.street || "",
      role: req.body.role,
      password: req.body.password
    });


    agent.save()
      .then((agent) => {
        Notification.storeNew("Welcome to Waya PayChat Agent", "Hello there " + req.body.firstName + " " + req.body.lastName + ", welcome to Waya PayChat Agent.", "SIGNUP", agent._id, agent._id);

        console.log(agent, 'agent');
        var token = jwt.sign({
          _id: agent._id
        }, config.jwtSecret);

        Response.data = {
          token,
          _id: agent._id
        }

        otpCtrl.agentLoginOTP(req, res, next);
        Audit.info(agent._id, agent._id, Audit.dbActions.create, agent);

        Response.message = 'Account created successfully. Please login to continue.';
        res.send(Response);
        return null;
      })
    return null;
  })
  return null;

}



/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function update(req, res, next) {

  //exclude validation field
  delete req.body.username;

  bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

    if (!match) {
      var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
      return next(err);
    }

    Agent.findByIdAndUpdate(req.user._id, req.body, { new: true }).then((user) => {
      Agent.authme({ _id: req.user._id }).then(user => {
        var Response = { ..._Response };

        // console.log(user, 'useruseruser');
        Audit.info(user._id, user._id, Audit.dbActions.update, user);
        Response.data = user;
        res.send(Response);
        return null;
      });
      return null;
    });
    return null;
  })
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function destroy(req, res, next) {

  Agent.findOneHiddenKey({ isActive: true, _id: req.user._id }, 'password').then((user) => {
    if (!user) {
      var err = new APIError('Agent not exists!', httpStatus.UNAUTHORIZED);
      return next(err);
    }
    bcrypt.compare(req.headers.x_auth, user.password).then((match) => {
      if (match) {
        Agent.findByIdAndUpdate(req.user._id, { isActive: false, updatedAt: Date.now() }).then((user) => {
          var Response = { ..._Response };

          Audit.info(user._id, user._id, Audit.dbActions.delete, user);

          Response.data = user;
          res.send(Response);
        });
      } else {
        var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
        return next(err);
      }
    });
  })
}


/**
 * Verify Forgot Link
 * @param {*} req
 * @param {*} res
 */
function verifyForgotLink(req, res) {
  Agent.findOneByQuery({ forgotToken: req.body.otp, phone: req.body.phone }).then((user) => {
    var Response = { ..._Response };
    if (!user) {

      Response.status = httpStatus.NOT_FOUND;
      Response.response = false;
      Response.errorMessage = "Invalid OTP";

      res.send(Response);
      return;
    }

    OTP.findOneByQuery({ phone: req.body.phone, otp: req.body.otp, isActive: true }).then((otp) => {

      if (!otp) {
        Response.status = httpStatus.NOT_FOUND;
        Response.response = false;
        Response.errorMessage = "Invalid OTP";
        res.send(Response);
        return;
      }

      OTP.findByIdAndUpdate(otp._id, { isActive: false }).then(updatedOTP => {
        Response.data = {
          token: auth.generateTempToken(user._id),
          _id: user._id
        }

        Response.message = "OTP is valid";
        res.send(Response);
      })
      return null;
    });

    return null;
  })
}

/**
 * Forogt password.
 * @returns {Agent}
 */
function forgotPassword(req, res, next) {
  Agent.findOneByQuery({ phone: req.body.phone }).then((user) => {
    var Response = { ..._Response };
    if (!user) {
      Response.status = httpStatus.BAD_REQUEST;
      Response.response = false;
      Response.errorMessage = "Agent Doesn't Exists";
      res.send(Response);
      return;
    }

    otpCtrl.sendForgotOTP(req, res, next).then(otpsent => {
      Agent.findOneAndUpdate({ _id: user._id }, { forgotToken: otpsent, updatedAt: Date.now() }, { new: true }).then((updatedUser) => {
        Response.message = 'OTP has been sent to registered phone number';
        res.send(Response);
      });
    })
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function changePassword(req, res, next) {
  Agent.authenticateViaId(req.user._id).then((user) => {
    var Response = { ..._Response };
    if (!user) {
      var err = new APIError("Agent Doesn't Exists", httpStatus.UNAUTBAD_REQUESTHORIZED);
      return next(err);
    }

    bcrypt.compare(req.body.oldPassword, user.password).then((match) => {
      if (match) {

        Agent.get(req.user._id).then((user) => {

          user.password = req.body.password;
          user.save({ validateBeforeSave: false }).then(updateduser => {
            Response.message = "Password Updated";
            res.json(Response);
            return null;
          })
          return null;
        });
        return null;

      } else {
        var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
        return next(err);
      }

      return null;
    });

  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function resetPassword(req, res, next) {
  Agent.authenticateViaId(req.user._id).then((agent) => {
    var Response = { ..._Response };
    if (!agent) {
      var err = new APIError("Agent Doesn't Exists", httpStatus.UNAUTBAD_REQUESTHORIZED);
      return next(err);
    }

    Agent.get(req.user._id).then((agent) => {

      agent.password = req.body.password;
      agent.isVerify = true;
      agent.save({ validateBeforeSave: false }).then(updateduser => {
        Response.message = "Password Updated";
        res.json(Response);
        return null;
      })
      return null;
    });
    return null;

  });
}

module.exports = {
  index,
  store,
  update,
  destroy,
  forgotPassword,
  verifyForgotLink,
  changePassword,
  resetPassword,
};
