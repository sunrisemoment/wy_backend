const fs = require('fs');
const crypto = require('crypto');
const uniqid = require('uniqid');
const User = require('../user/user.model');
const QRCode = require('../qrCode/qrCode.model');
const UserTempModal = require('../userTemp/userTemp.model');

/**
 *
 * @param {*} length
 */
function randomString(length = 128) {
  return crypto.randomBytes(length).toString('hex');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateOTP(maxOtp = 6) {
  // Declare a digits variable
  // which stores all digits
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < maxOtp; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function inviteCode(length = 3) {
  const code = crypto.randomBytes(length).toString('hex').toUpperCase();
  if (isCodeExist(code)) {
    inviteCode();
  } else {
    return code;
  }
}


function isCodeExist(code) {
  User.findOne({ inviteCode: code }).exec().then(user => user);
}

function getIpAddress(req) {
  return req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function getBrowser(req) {
  let browser;
  const ua = req.headers['user-agent'];
  if (/firefox/i.test(ua)) { browser = 'firefox'; } else if (/chrome/i.test(ua)) { browser = 'chrome'; } else if (/safari/i.test(ua)) { browser = 'safari'; } else if (/msie/i.test(ua)) { browser = 'msie'; } else if (/windows phone/i.test(ua)) { browser = 'Windows Phone'; } else if (/android/i.test(ua)) { browser = 'Android'; } else if (/iPad|iPhone|iPod/i.test(ua)) { browser = 'iOS'; } else { browser = 'unknown'; }

  return browser;
}

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function zeroPadding(n, width, z) {
  z = z || '0';
  n += '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function mongoQuery(req) {
  const query = {};
  let tmp = '';
  for (const key in req.query) {
    if (req.query.hasOwnProperty(key)) {
      console.log(`${key} -> ${req.query[key]}`);
      if (key.indexOf('_gte') !== -1) {
        tmp = key.replace('_gte', '');
        if (tmp == 'createdAt' || tmp == 'updatedAt') {
          query[tmp] = { $gte: new Date(req.query[key]) };
        } else {
          query[tmp] = { $gte: req.query[key] };
        }
      }

      if (key.indexOf('_lte') !== -1) {
        tmp = key.replace('_lte', '');
        if (tmp == 'createdAt' || tmp == 'updatedAt') {
          query[tmp] = { $lte: new Date(req.query[key]) };
        } else {
          query[tmp] = { $lte: req.query[key] };
        }
      }

      if (key.indexOf('_in') !== -1) {
        tmp = key.replace('_in', '');
        const qry = req.query[key].slip(',');
        query[tmp] = { $in: qry };
      }

      if (key.indexOf('_eq') !== -1) {
        tmp = key.replace('_eq', '');
        query[tmp] = { $eq: req.query[key] };
      }

      if (key.indexOf('_ne') !== -1) {
        tmp = key.replace('_ne', '');
        query[tmp] = { $ne: req.query[key] };
      }


      if (key.indexOf('_contains') !== -1) {
        tmp = key.replace('_contains', '');
        query[tmp] = { $regex: req.query[key] };
      }
    }
  }

  console.log(query);
  return query;
}


function getChatId(user1, user2) {
  if (user1 > user2) {
    return user2 + user1;
  }

  return user1 + user2;
}

function isQRCodeExist(code) {
  QRCode.findOne({ qrKey: code })
    .exec()
    .then(data => data);
}

function qrCodeGen() {
  const code = uniqid();
  if (isQRCodeExist(code)) {
    qrCodeGen();
  } else {
    return code;
  }
}

function isTxnCodeExist(code) {
  UserTempModal.findOne({ txnCode: code })
    .exec()
    .then(data => data);
}

function txnCodeGen() {
  const code = Math.floor(Date.now() / 1000);
  if (isTxnCodeExist(code)) {
    txnCodeGen();
  } else {
    return code;
  }
}

function encodeBase64Image(file) {
  // read binary data
  const bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}

function decodeBase64Image(base64Str, file) {
  // read binary data
  const bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}

module.exports = { randomString, getIpAddress, getBrowser, validateEmail, mongoQuery, zeroPadding, inviteCode, generateOTP, getChatId, capitalizeFirstLetter, qrCodeGen, txnCodeGen, encodeBase64Image, decodeBase64Image };
