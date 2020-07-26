var Global = require('../helpers/global');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const request = require('request');
var config = require('../../config/config');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var Audit = require('../auditinfo/auditinfo.controller');
var SendSMS = require('../otp/otp.controller');
var Bank = require('../bankAccounts/bankAccounts.controller');
var Notification = require('../notifications/notifications.controller');

var UserService = require('./user.service');

var User = require('./user.model');
var UserFollow = require('../userFollow/userFollow.model');
var UserReport = require('./userReport.model');

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
  User.authme(req.user._id).then((user) => {
    Response.data = user;
    Response.message = "My Profile";
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


  User.findOne({ phone: phoneC,isActive:true }).then((userExists) => {

    if (userExists) {
      var err = new APIError('Phone already exists!', httpStatus.UNPROCESSABLE_ENTITY);
      return next(err);
    }

    if (req.body.role.toUpperCase() !== "USER" && req.body.role.toUpperCase() !== "MERCHANT") {
      var err = new APIError('Role Not Exists!', httpStatus.UNPROCESSABLE_ENTITY);
      return next(err);
    }


    let user = new User({
      merchantName: req.body.merchantName || "",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: phoneC,
      country: req.body.country || "",
      city: req.body.city || "",
      street: req.body.street || "",
      role: req.body.role,
      inviteCode: req.body.firstName + '_' + Global.inviteCode(),
      invitedBy: req.body.invitedBy || null,
      password: req.body.password
    });


    user.save()
      .then((user) => {

        UserService.generateQrCode(user);
        UserService.createUserWallet(user);
        UserService.createFollow(user);
        UserService.inviteByPoints(req, user);
        Bank.virtualAccount(req.body.firstName + " " + req.body.lastName, 0, user);
        Notification.storeNew("Welcome to Waya PayChat", "Hello there " + req.body.firstName + " " + req.body.lastName + ", welcome to Waya PayChat. Feel free to explore your wallet features or discover new users.", "SIGNUP", user._id, user._id);

        var token = jwt.sign({
          _id: user._id
        }, config.jwtSecret);

        Response.data = {
          token,
          _id: user._id
        }

        Audit.info(user._id, user._id, Audit.dbActions.create, user);

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

  // //TODO:comeback to this
  delete req.body.password;

  bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

    if (!match) {
      var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
      return next(err);
    }

    User.findByIdAndUpdate(req.user._id, req.body, { new: true }).then((user) => {
      User.authme({ _id: req.user._id }).then(user => {
        var Response = { ..._Response };

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
 * @param {*} next
 */
function updateEmail(req, res, next) {

    User.authme({ _id: req.user._id }).then(user => {
      var Response = { ..._Response };

      if(!user){
        var err = new APIError('User doesn\'t exists!', httpStatus.BAD_REQUEST);
        return next(err);
      }

      otpCtrl.OTPForUserEmail(req.body, req, res, next);

      Response.data = null;
      Response.message = "OTP is sent to your email";
      res.send(Response);
      return null;
    });
    return null;
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function updateUserName(req, res, next) {

  var Response = { ..._Response };

  User.findOneByQuery({ username: req.body.username }).then((user) => {
    console.log(user);
    if (user) {
      var err = new APIError('Username already exists!', httpStatus.BAD_REQUEST);
      return next(err);
    }

    User.findByIdAndUpdate(req.user._id, { username: req.body.username }, { new: true }).then((user) => {

      Audit.info(user._id, user._id, Audit.dbActions.update, user);
      Response.data = user;
      Response.message = "Username updated";
      res.send(Response);
    });
  });
}


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function checkUserName(req, res, next) {

  var Response = { ..._Response };

  User.findOneByQuery({ username: req.body.username }).then((user) => {
    if (user) {
      Response.data = {isExists:true};
      Response.message = "username already taken";
      res.send(Response);
    }else{
      Response.data = {isExists:false};
      Response.message = "username available";
      res.send(Response);
    }

  });
}


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function  updateTokens(req, res, next) {

  var Response = { ..._Response };

  var _body = {
    fcmToken: req.body.fcmToken || null,
    apnsToken: req.body.apnsToken || null,
    deviceToken: req.body.deviceToken || null
  }

  if (_body.fcmToken) {
    if(_body.fcmToken=="-1"){
      _body.fcmToken = null;
    }
    User.findOneAndUpdate({ _id: req.user._id }, { fcmToken: _body.fcmToken }, { new: true }).then((user) => {
      Audit.info(user._id, user._id, Audit.dbActions.update, user);
    });
  }

  if (_body.apnsToken) {
    if(_body.apnsToken=="-1"){
      _body.apnsToken = null;
    }
    User.findOneAndUpdate({ _id: req.user._id }, { apnsToken: _body.apnsToken }, { new: true }).then((user) => {
      Audit.info(user._id, user._id, Audit.dbActions.update, user);
    });
  }

  if (_body.deviceToken) {
    if(_body.deviceToken=="-1"){
      _body.deviceToken = null;
    }
    User.findOneAndUpdate({ _id: req.user._id }, { deviceToken: _body.deviceToken }, { new: true }).then((user) => {
      Audit.info(user._id, user._id, Audit.dbActions.update, user);
    });
  }

  Response.data = req.user;
  Response.message = "Tokens updated";
  res.send(Response);
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function destroy(req, res, next) {

  User.findOneHiddenKey({ isActive: true, _id: req.user._id }, 'password').then((user) => {
    if (!user) {
      var err = new APIError('User not exists!', httpStatus.UNAUTHORIZED);
      return next(err);
    }
    bcrypt.compare(req.headers.x_auth, user.password).then((match) => {
      if (match) {
        User.findByIdAndUpdate(req.user._id, { isActive: false, updatedAt: Date.now() }).then((user) => {
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
  User.findOneByQuery({ forgotToken: req.body.otp, phone: req.body.phone }).then((user) => {
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
 * @returns {User}
 */
function forgotPassword(req, res, next) {
  User.findOneByQuery({ phone: req.body.phone }).then((user) => {
    var Response = { ..._Response };
    if (!user) {
      Response.status = httpStatus.BAD_REQUEST;
      Response.response = false;
      Response.errorMessage = "User Doesn't Exists";
      res.send(Response);
      return;
    }

    otpCtrl.sendForgotOTP(req, res, next).then(otpsent => {
      User.findOneAndUpdate({ _id: user._id }, { forgotToken: otpsent, updatedAt: Date.now() }, { new: true }).then((updatedUser) => {
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
  User.authenticateViaId(req.user._id).then((user) => {
    var Response = { ..._Response };
    if (!user) {
      var err = new APIError("User Doesn't Exists", httpStatus.UNAUTBAD_REQUESTHORIZED);
      return next(err);
    }

    bcrypt.compare(req.body.oldPassword, user.password).then((match) => {
      if (match) {

        User.get(req.user._id).then((user) => {

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
  User.authenticateViaId(req.user._id).then((user) => {
    var Response = { ..._Response };
    if (!user) {
      var err = new APIError("User Doesn't Exists", httpStatus.UNAUTBAD_REQUESTHORIZED);
      return next(err);
    }

    User.get(req.user._id).then((user) => {

      user.password = req.body.password;
      user.isVerify = true;
      user.save({ validateBeforeSave: false }).then(updateduser => {
        Response.message = "Password Updated";
        res.json(Response);
        return null;
      })
      return null;
    });
    return null;

  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function checkUserContacts(req, res, next) {
  var Response = { ..._Response };
  var phones = req.body.phones;
  var result = [];
  var isFollowing = 0;
  var isRequested = 0;
  var acceptReject = 0;

  if (!phones.length) {
    Response.data = result;
    Response.message = "User Contacts";
    res.json(Response);
    return null;
  }

  phones = phones.filter(n => n);
  //console.log(JSON.stringify(phones));

  UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myProfile) => {
    phones.forEach((phone, index) => {

      var originalPhone = phone;

      // Validate Phone

      if (phone == "") { phone = "91" }

      phone = phone.replace(/ /g, '').replace(/-/g, '').replace(/[{()}]/g, '');

      if (phone.startsWith("+91") !== -1) {
        //phone = phone.replace("+91", '');
      } if (/^91/.test(phone) && phone.length > 10) {
        phone = phone.replace("91", '+91');
      } if (phone.startsWith("+234") !== -1) {
        //phone = phone.replace("+234", '');
      } if (/^234/.test(phone) && phone.length > 5) {
        phone = phone.replace("234", '+234');
      }

      phone = phone.replace(/^0+/, '');

      // End

      User.findOneByQuery({ phone: phone }).then((user) => {

        if (user) {

          var followingIds = myProfile.followingIds.indexOf(user._id.toString());
          var tempFollowingIds = myProfile.tempFollowingIds.indexOf(user._id.toString());

          var tempFollowerIds = myProfile.tempFollowerIds.indexOf(user._id.toString());

          if (tempFollowerIds != -1) {
            acceptReject = 1;
          } else {
            acceptReject = 0;
          }

          if (followingIds !== -1) {
            isFollowing = 1;
          } else {
            isFollowing = 0;
            if (tempFollowingIds !== -1) {
              isRequested = 1;
            }
          }

          result.push({ phone: originalPhone, isExists: true, _id: user._id, chatId: Global.getChatId(req.user._id, user._id), isFollowing: isFollowing, profilePic: user.profilePic, isRequested: isRequested, isPrivate: user.isPrivate, acceptReject: acceptReject });
        } else {
          result.push({ phone: originalPhone, isExists: false, _id: null, chatId: null, isFollowing: 0, profilePic: "", isRequested: 0, isPrivate: false, acceptReject: 0 });
        }

        //console.log(result);

        setTimeout(() => {
          if (phones.length - 1 == index) {
            Response.data = result;
            Response.message = "User Contacts";
            res.json(Response);
            return null;
          }
        }, 1500)

      })
      return null;
    }); return null;
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function search(req, res) {
  var Response = { ..._Response };

  var result = [];

  if (!req.query.q) {
    Response.data = [];
    Response.message = 'User Data';
    return res.send(Response);
  }

  User.findHiddenKey({ $or: [{ firstName: { $regex: '.*' + req.query.q + '.*', $options: 'i' } }, { lastName: { $regex: '.*' + req.query.q + '.*', $options: 'i' } }], isActive: true }, 'isPrivate').then((users) => {
    if (users.length == 0) {
      Response.data = result;
      Response.message = 'User Data';
      return res.send(Response);
    }
    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((profileDetail) => {

      if (!profileDetail) {
        Response.data = result;
        Response.message = 'User Data';
        return res.send(Response);
      }

      users.forEach((user, index) => {
        var followerId = profileDetail.followerIds.indexOf(user._id.toString());
        var followingId = profileDetail.followingIds.indexOf(user._id.toString());
        var tempFollowingIds = profileDetail.tempFollowingIds.indexOf(user._id.toString());

        var tempFollowerIds = profileDetail.tempFollowerIds.indexOf(user._id.toString());

        if (tempFollowerIds != -1) {
          user._doc.acceptReject = 1;
        } else {
          user._doc.acceptReject = 0;
        }

        user._doc.isRequested = 0;

        if (followerId !== -1) {
          user._doc.follower = true;
        } else {
          user._doc.follower = false;
        }


        if (followingId !== -1) {
          user._doc.following = true;
        } else {
          user._doc.following = false;
          if (tempFollowingIds !== -1) {
            user._doc.isRequested = 1;
          }
        }

        result.push(user);

        if (users.length - 1 == index) {
          Response.data = result;
          Response.message = 'User Data';
          return res.send(Response);
        }
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
function userReport(req, res) {
  var Response = { ..._Response };

  var userR = new UserReport({
    userId: req.body.userId,
    reportedBy: req.user._id
  });

  userR.save().then((data) => {
    Response.data = data;
    Response.message = 'User Reported';
    return res.send(Response);
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function setUpBVN(req, res, next) {
  var Response = { ..._Response };

  var clientServerOptions = {
    uri: config.paystack.url + 'bank/resolve_bvn/' + req.body.bvn,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.paystack.skeyDev}`
    }
  }

  request(clientServerOptions, function (error, response) {

    if (response.statusCode != httpStatus.OK) {
      var body = JSON.parse(response.body);
      if (body.message) {
        var err = new APIError(body.message || "Something went wrong", httpStatus.BAD_REQUEST);
        return next(err);
      } else {
        var err = new APIError("Something went wrong", httpStatus.BAD_REQUEST);
        return next(err);
      }
    }

    var resolvedBVN = JSON.parse(response.body).data;

    console.log(resolvedBVN);

    req.user.bvnVerificationCode = Global.generateOTP();
    req.user.save().then(data => {

      resolvedBVN.mobile = resolvedBVN.mobile.replace("0", '+234');

      // var messageBody = "Hi " + resolvedBVN.first_name + " " + resolvedBVN.last_name + ", Your Verification Code is: " + req.user.bvnVerificationCode;
      // var messageBody = "Hi Your Verification Code is: " + req.user.bvnVerificationCode;
      var messageBody = "Your Verification code is: " + req.user.bvnVerificationCode;
      SendSMS.sendSMS(messageBody, resolvedBVN.mobile, req.user);//resolvedBVN.mobile
    });


    Response.data = body;
    Response.message = 'BVN Code sent to your BVN mobile';
    return res.send(Response);

  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function verifyBVN(req, res, next) {
  var Response = { ..._Response };


  if (req.user.bvnVerificationCode != req.body.verificationCode) {
    var err = new APIError("Invalid BVN verification code", httpStatus.BAD_REQUEST);
    return next(err);
  }

  req.user.bvn = req.body.bvn;
  req.user.save().then(data => {

    Response.message = 'Successfully BVN Setup';
    return res.send(Response);
  });

}

module.exports = {
  index,
  search,
  userReport,
  store,
  update,
  destroy,
  forgotPassword,
  verifyForgotLink,
  changePassword,
  resetPassword,
  checkUserContacts,
  updateUserName,
  checkUserName,
  updateTokens,
  setUpBVN,
  verifyBVN,
  updateEmail,
};
