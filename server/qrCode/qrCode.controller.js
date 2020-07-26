var fs = require("fs");

var Global = require("./../helpers/global");
var _Response = require("./../helpers/Response");
var APIError = require("./../helpers/APIError");
var httpStatus = require("http-status");
var config = require("../../config/config");
var qrcode = require("qr-image");
const qrCode = require("qrcode");

var Audit = require("../auditinfo/auditinfo.controller");
const OTP = require("../otp/otp.controller");
var OTPModel = require("../otp/otp.model");
var QRCode = require("./qrCode.model");
var User = require("../user/user.model");

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
  const Response = { ..._Response };
  QRCode.findQRCode().then((data) => {
    Response.data = data;
    res.send(Response);
    return null;
  });
}

function generateQrCode(data) {
  qrCode.toDataURL(data.qrKey, { errorCorrectionLevel: "H" }, (err, url) => {
    if (err) {
      return err;
    }

    data.fileName = url;
    data.save().then((f) => {
      return null;
    });
  });
}

function newQrCode(req, res, next) {
  return new Promise(function (resolve, reject) {
    const { length } = req.body;

    if (length > 1) {
      for (i = 1; i < length; i++) {
        let qrCode = new QRCode({
          qrKey: Global.qrCodeGen(),
          createdBy: req.user._id,
        });

        qrCode
          .save()
          .then((data) => {
            generateQrCode(data);
            resolve(data);
            return null;
          })
          .catch((e) => {
            next(e);
          });
      }
    }
    let qrCode = new QRCode({
      qrKey: Global.qrCodeGen(),
      createdBy: req.user._id,
    });

    qrCode
      .save()
      .then((data) => {
        generateQrCode(data);
        resolve(data);
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
function store(req, res, next) {
  var Response = { ..._Response };

  newQrCode(req, res, next).then((newdata) => {
    const { length } = req.body;
    Response.data = newdata;
    if (length < 0) {
      Response.message = "QR Code generated";
    }
    Response.message = `${length} QR Code generated`;
    res.send(Response);
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function scanQRCode(req, res, next) {
  const Response = { ..._Response };
  const { qrKey, phone } = req.body;

  User.findOneByQuery({ phone: phone, isActive: true }).then((user) => {
    if (!user) {
      var err = new APIError("User doesn't exists!", httpStatus.BAD_REQUEST);
      return next(err);
    }
    QRCode.findOne({ qrKey: qrKey, user: user._id, isActive: false })
      .then((data) => {
        if (data) {
          Response.data = data;
          Response.message = "QR Code Already Linked";
          res.send(Response);
          return null;
        }
        QRCode.findOne({ user: user._id, isActive: false }).then((data) => {
          if (data) {
            Response.message = "You Already Have QR Code Attached To You";
            res.send(Response);
            return null;
          }
          QRCode.findOne({ qrKey: qrKey, isActive: true }).then((data) => {
            if (!data) {
              Response.message = "Invalid QR Code";
              res.send(Response);
              return null;
            }
            // send OTP to verify if QR Code is valid
            OTP.qrCodeOTP(user, res, next);
          });
        });
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
function attachUserToQRCode(req, res, next) {
  const Response = { ..._Response };
  const { phone, otp, qrKey } = req.body;

  User.findOneByQuery({ phone: phone, isActive: true }).then((user) => {
    if (!user) {
      var err = new APIError("User doesn't exists!", httpStatus.BAD_REQUEST);
      return next(err);
    }

    OTPModel.findOneByQuery({ phone: phone, otp: otp, isActive: true }).then(
      (otp) => {
        console.log(otp, "otpotpotpotpotp");
        if (!otp) {
          Response.status = httpStatus.NOT_FOUND;
          Response.response = false;
          Response.errorMessage = "Invalid OTP";
          res.send(Response);
          return;
        }

        OTPModel.findByIdAndUpdate(otp._id, { isActive: false }).then(
          (updatedOTP) => {
            // console.log(updatedOTP, 'updatedOTP');

            QRCode.findOne({ qrKey: qrKey, isActive: true }).then((data) => {
              if (!data) {
                Response.message = "Invalid QR Code";
                res.send(Response);
                return null;
              }
              QRCode.update(
                { qrKey, isActive: true },
                { agent: req.user._id, user: user._id, isActive: false },
                { new: true }
              ).then((data) => {});

              qrCode.toDataURL(data.qrKey, { errorCorrectionLevel: "H" }, (err, url) => {
                if (err) {
                  return err;
                }

                const path = { qrcode: url };

                User.findByIdAndUpdate(user._id, path, { new: true }).then(
                  (user) => {
                    var Response = { ..._Response };

                    User.get(user._id).then((data) => {
                      Audit.info(
                        data._id,
                        data._id,
                        Audit.dbActions.update,
                        data
                      );
                      Response.data = data;
                      Response.message = "QR Code Attached To You Successfully";
                      res.send(Response);
                      return null;
                    });
                  }
                );
              });
            });
          }
        );
        return null;
      }
    );

    return null;
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function getQrCodeByKey(req, res, next) {
  const Response = { ..._Response };
  QRCode.qrCodeInfo({ qrKey: req.params.qrCodeKey })
    .then((data) => {
      if (data) {
        Response.data = data;
        Response.message = "QR Code Details";
        res.send(Response);
        return null;
      } else {
        Response.message = "QR Code Not Found";
        res.send(Response);
        return null;
      }
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
function getQrCodeById(req, res, next) {
  const Response = { ..._Response };
  QRCode.qrCodeInfo({ _id: req.params.qrCodeId })
    .then((data) => {
      if (data) {
        Response.data = data;
        Response.message = "QR Code Details";
        res.send(Response);
        return null;
      } else {
        Response.message = "QR Code Not Found";
        res.send(Response);
        return null;
      }
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
function destroy(req, res, next) {
  const Response = { ..._Response };
  QRCode.findAndDeleteById(req.params.qrCodeId)
    .then((data) => {
      Response.data = null;
      if (data) {
        Response.message = "QR Code Deleted";
        res.send(Response);
        return null;
      } else {
        Response.message = "QR Code Not Found";
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
  attachUserToQRCode,
  destroy,
  getQrCodeById,
  getQrCodeByKey,
  scanQRCode,
};
