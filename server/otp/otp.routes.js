const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const otpCtrl = require('./otp.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/').post(validate(paramValidation.otp), otpCtrl.loginOTP);

router.route('/agent').post(validate(paramValidation.otp), otpCtrl.agentLoginOTP);

router.route('/').get(validate(paramValidation.otp), otpCtrl.test);

router
  .route('/email')
  .post(validate(paramValidation.otpEmail), otpCtrl.loginOTPEmail);

router
  .route('/verify')
  .post(validate(paramValidation.otpVerify), otpCtrl.index);

router
  .route('/agent/verify')
  .post(validate(paramValidation.otpVerify), otpCtrl.agentOTPVerify);

router
  .route('/email/verify')
  .post(validate(paramValidation.otpVerifyEmail), otpCtrl.emailVerify);

// router
//   .route('/user/email')
//   .post(validate(paramValidation.otpVerify), otpCtrl.OTPForUserEmail);

router
  .route('/user/email/verify')
  .post(validate(paramValidation.otpVerify), auth.isAuthenticated(), otpCtrl.OTPForUserEmailVerify);

module.exports = router;
