var Global = require("../helpers/global");
var Email = require("../helpers/email");
var _Response = require("../helpers/Response");
var APIError = require("../helpers/APIError");
var httpStatus = require("http-status");
var OTP = require("./otp.model");
var User = require("../user/user.model");
var Agent = require("../agent/agent.model");
var UserWallet = require("../userWallet/userWallet.model");
var Commission = require("../commission/commission.model");
var Audit = require("../auditinfo/auditinfo.controller");

var config = require("../../config/config");

const options = {
  apiKey: config.sms.apiKey, // use your sandbox app API key for development in the test environment
  username: config.sms.username, // use 'sandbox' for development in the test environment
};

const AfricasTalking = require("africastalking")(options);

// Initialize a service e.g. SMS
sms = AfricasTalking.SMS;

function test(req, res, next) {
  var Response = { ..._Response };
  const options = {
    to: ["+919968302318"],
    message: "Test @saurabh",
    from: config.sms.senderId,
  };

  sms
    .send(options)
    .then((response) => {
      Audit.info(config.admin.userId, null, Audit.dbActions.smssent, response);
      Response.data = response;
      Response.message = "OTP is valid";
      res.send(Response);
      return null;
    })
    .catch((error) => {
      Audit.info(config.admin.userId, null, Audit.dbActions.smssent, error);
      Response.data = error;
      res.send(Response);
      return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
  var Response = { ..._Response };
  OTP.findOneByQuery({
    phone: req.body.phone,
    otp: req.body.otp,
    isActive: true,
  }).then((otp) => {
    if (!otp) {
      Response.status = httpStatus.NOT_FOUND;
      Response.response = false;
      Response.errorMessage = "Invalid OTP";
      res.send(Response);
      return;
    }

    OTP.findByIdAndUpdate(otp._id, { isActive: false }).then((updatedOTP) => {
      User.authenticate(req.body.phone, next).then((user) => {
        user.isVerify = true;
        user.save().then((data) => {
          Response.message = "OTP is valid";
          res.send(Response);
          return null;
        });
        return null;
      });
      return null;
    });
    return null;
  });
}

function agentOTPVerify(req, res, next) {
  var Response = { ..._Response };
  OTP.findOneByQuery({
    phone: req.body.phone,
    otp: req.body.otp,
    isActive: true,
  }).then((otp) => {
    if (!otp) {
      Response.status = httpStatus.NOT_FOUND;
      Response.response = false;
      Response.errorMessage = "Invalid OTP";
      res.send(Response);
      return;
    }

    OTP.findByIdAndUpdate(otp._id, { isActive: false }).then((updatedOTP) => {
      Agent.authenticate(req.body.phone, next).then((agent) => {
        agent.isVerify = true;
        agent.save().then((data) => {
          Response.message = "OTP is valid";
          res.send(Response);
          return null;
        });
        return null;
      });
      return null;
    });
    return null;
  });
}

function emailVerify(req, res, next) {
  var Response = { ..._Response };
  OTP.findOneByQuery({
    phone: req.body.email,
    otp: req.body.otp,
    isActive: true,
  }).then((otp) => {
    if (!otp) {
      Response.status = httpStatus.NOT_FOUND;
      Response.response = false;
      Response.errorMessage = "Invalid OTP";
      res.send(Response);
      return;
    }

    OTP.findByIdAndUpdate(otp._id, { isActive: false }).then((updatedOTP) => {
      Response.message = "OTP is valid";
      res.send(Response);
      return null;
    });
    return null;
  });
}

function loginOTP(req, res, next) {
  var Response = { ..._Response };
  const generatedOTP = Global.generateOTP();
  //const generatedOTP = "123456";

  const otp = new OTP({
    otp: generatedOTP,
    phone: req.body.phone,
    from: config.sms.senderId,
  });

  const options = {
    to: [req.body.phone],
    message: "Welcome to Waya PayChat APP. " + generatedOTP + " is the OTP",
    from: config.sms.senderId,
  };

  // const message ="Welcome to Waya PayChat APP. " + generatedOTP + " is the OTP";

  otp.save().then((data) => {
    sms
      .send(options)
      .then((response) => {
        Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, response);
        Response.message = "OTP is sent to Phone Number";
        res.send(Response);

        // send email function
        // Email.sendEmails({ otp: generatedOTP, email: req.body.email}, "Waya PayChat OTP", message);
        return null;
      })
      .catch((error) => {
        Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, response);
        var err = new APIError(
          "OTP not sent. Incorrect Phone number",
          httpStatus.UNAUTBAD_REQUESTHORIZED
        );
        return next(err);
      });
  });
}

function agentLoginOTP(req, res, next) {
  var Response = { ..._Response };
  const generatedOTP = Global.generateOTP();
  var phoneC = req.body.countryCode + req.body.phone;

  const otp = new OTP({
    otp: generatedOTP,
    phone: phoneC,
    from: config.sms.senderId,
  });

  const options = {
    to: [phoneC],
    message: "Waya PayChat OTP: " + generatedOTP,
    from: config.sms.senderId,
  };

  otp.save().then((data) => {
    sms
      .send(options)
      .then((response) => {
        Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, response);
        Response.message = "OTP is sent to Phone Number";
        res.send(Response);

        return null;
      })
      .catch((error) => {
        Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, error);
        var err = new APIError(
          "OTP not sent. Incorrect Phone number",
          httpStatus.UNAUTBAD_REQUESTHORIZED
        );
        return next(err);
      });
  });
}

function loginOTPEmail(req, res, next) {
  var Response = { ..._Response };
  const generatedOTP = Global.generateOTP();

    const otp = new OTP({
      otp: generatedOTP,
      phone: req.body.email,
      type: "EMAIL",
    });

    var message ="Welcome to Waya PayChat APP. " + generatedOTP + " is the OTP";

    otp.save().then((data) => {
      Email.sendEmails(req.body, "Waya PayChat OTP", message);
      Response.message = "OTP is sent to your Email";
      res.send(Response);
      return null;
    });
}

function sendForgotOTP(req, res, next) {
  return new Promise(function (resolve, reject) {
    var Response = { ..._Response };
    const generatedOTP = Global.generateOTP();

    const otp = new OTP({
      otp: generatedOTP,
      phone: req.body.phone,
      from: config.sms.senderId,
    });

    const options = {
      to: [req.body.phone],
      message: generatedOTP + " is the OTP to recover your WayaPayChat account",
      from: config.sms.senderId,
    };

    otp.save().then((data) => {
      sms
        .send(options)
        .then((response) => {
          Audit.info(
            req.body.phone,
            data._id,
            Audit.dbActions.smssent,
            response
          );

          resolve(generatedOTP);
          return null;
        })
        .catch((error) => {
          Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, error);
          next(e);
        });
    });
  });
}

function sendNonWayaOTP(req, res, next) {
  return new Promise(function (resolve, reject) {
    var Response = { ..._Response };

    var deduct = req.body.amount;
    const generatedOTP = Global.generateOTP();

    const otp = new OTP({
      otp: generatedOTP,
      phone: req.body.phone,
      from: config.sms.senderId,
    });

    const options = {
      to: [req.body.phone],
      message:
        generatedOTP +
        " is the payment verification code to retrieve NGN " +
        deduct,
      from: config.sms.senderId,
    };

    otp.save().then((data) => {
      sms
        .send(options)
        .then((response) => {
          Audit.info(req.user._id, data._id, Audit.dbActions.smssent, response);
          resolve(generatedOTP);
          return null;
        })
        .catch((error) => {
          Audit.info(req.body.phone, data._id, Audit.dbActions.smssent, error);
          next(e);
        });
    });
  });
}

function sendTxnAlert(description, phone, user) {
  if (!user.smsAlert) {
    return;
  }

  UserWallet.findOne({ userId: user._id }).then((wallet) => {
    if (wallet.availableBalance < config.smsCharges) {
      wallet.availableBalance = wallet.availableBalance - config.smsCharges;
      wallet.save().then((data) => {
        sendSMS(description, phone, user);
      });

      Commission.create({
        walletId: wallet._id,
        type: "debit",
        userId: wallet.userId,
        amount: config.smsCharges,
        description: "SMS charge for transaction",
      });
    }
  });
}

function sendSMS(description, phone, user) {
  const options = {
    to: [phone],
    message: description,
    from: config.sms.senderId,
  };

  sms
    .send(options)
    .then((response) => {
      Audit.info(phone, user._id, Audit.dbActions.smssent, response);
    })
    .catch((error) => {
      Audit.info(phone, user._id, Audit.dbActions.smssent, error);
      next(e);
    });
}

function qrCodeOTP(req, res, next) {
  var Response = { ..._Response };
  const generatedOTP = Global.generateOTP();

  const otp = new OTP({
    otp: generatedOTP,
    phone: req.phone,
    from: config.sms.senderId,
  });

  const options = {
    to: [req.phone],
    message:
      "Welcome to WayaPayChat APP Please verify your account with this OTP . " +
      generatedOTP,
    from: config.sms.senderId,
  };

  otp.save().then((data) => {
    sms
      .send(options)
      .then((response) => {
        Audit.info(req.phone, data._id, Audit.dbActions.smssent, response);
        Response.message = "OTP is sent to Phone Number";
        res.send(Response);
        return null;
      })
      .catch((error) => {
        console.log(error);
        Audit.info(req.phone, data._id, Audit.dbActions.smssent, response);
        var err = new APIError(
          "OTP not sent. Incorrect Phone number",
          httpStatus.UNAUTBAD_REQUESTHORIZED
        );
        return next(err);
      });
  });
}

function OTPForUserEmail(user, req, res, next) {
  var Response = { ..._Response };
  const generatedOTP = Global.generateOTP();

    const otp = new OTP({
      otp: generatedOTP,
      email: user.email,
      type: "EMAIL",
    });

    var message ="Welcome to Waya PayChat APP. " + generatedOTP + " is the OTP";

    otp.save().then((data) => {
      Email.userEmailOTPCheck(data, "Waya PayChat OTP", message);
      return null;
    });
};

function OTPForUserEmailVerify(req, res, next) {
  var Response = { ..._Response };
  OTP.findOneByQuery({
    email: req.body.email,
    otp: req.body.otp,
    isActive: true,
  }).then((otp) => {
    if (!otp) {
      Response.status = httpStatus.NOT_FOUND;
      Response.response = false;
      Response.errorMessage = "Invalid OTP";
      res.send(Response);
      return;
    }

    OTP.findByIdAndUpdate(otp._id, { isActive: false }).then((updatedOTP) => {
      User.authenticate(req.body.phone, next).then((user) => {
        user.isVerifyByEmail = true;
        user.email = req.body.email;
        user.save().then((data) => {
          Response.message = "OTP is valid";
          res.send(Response);
          return null;
        });
        return null;
      });
      return null;
    });
    return null;
  });
};

module.exports = {
  index,
  emailVerify,
  loginOTP,
  loginOTPEmail,
  sendForgotOTP,
  sendTxnAlert,
  sendNonWayaOTP,
  sendSMS,
  test,
  qrCodeOTP,
  agentLoginOTP,
  agentOTPVerify,
  OTPForUserEmail,
  OTPForUserEmailVerify,
};
