const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const agentCtrl = require('./agent.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

  .get(auth.isAuthenticatedAgent(), agentCtrl.index)

  .post(validate(paramValidation.createAgent), agentCtrl.store);

router.route('/:agentId')
  .put(validate(paramValidation.updateAgent), auth.isAuthenticatedAgent(), agentCtrl.update)
  .delete(validate(paramValidation.deleteApi), auth.isAuthenticatedAgent(), agentCtrl.destroy);


// POST
router.route('/resetPassword').post(validate(paramValidation.resetPassword), auth.isAuthenticatedUnVerifiedAgent(), agentCtrl.resetPassword);

router.route('/changePassword').post(validate(paramValidation.changePassword), auth.isAuthenticatedAgent(), agentCtrl.changePassword);

router.route('/password/forgot').post(validate(paramValidation.forgotPassword), agentCtrl.forgotPassword);

// Patch
// router.route('/username').patch(validate(paramValidation.username), auth.isAuthenticated(), agentCtrl.updateUserName);
// router.route('/username/check').post(validate(paramValidation.username), auth.isAuthenticated(), agentCtrl.checkUserName);
// router.route('/tokens').patch(auth.isAuthenticated(), agentCtrl.updateTokens);

router.route('/password/forgot/verify').patch(validate(paramValidation.forgotPasswordVerify), agentCtrl.verifyForgotLink);

module.exports = router;
