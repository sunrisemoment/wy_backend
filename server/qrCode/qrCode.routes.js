const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const QRCodeCtrl = require('./qrCode.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')
  .get(auth.isAuthenticated(), QRCodeCtrl.index)
  .post(validate(paramValidation.qrCodeLength), auth.isAuthenticated(), QRCodeCtrl.store)
  .put(validate(paramValidation.qrCodeKey), auth.isAuthenticatedAgent(), QRCodeCtrl.attachUserToQRCode);

router.route('/scan')
  .post(validate(paramValidation.scanQRCode), auth.isAuthenticatedAgent(), QRCodeCtrl.scanQRCode);

router.route('/:qrCodeId')
  .get(auth.isAuthenticatedAgent(), QRCodeCtrl.getQrCodeById)
  .delete(auth.isAuthenticated(), QRCodeCtrl.destroy);

  //TODO: auth.isAuthenticatedAgent() || auth.isAuthenticated()
router.route('/qrKey/:qrCodeKey')
  .get(QRCodeCtrl.getQrCodeByKey);

module.exports = router;
