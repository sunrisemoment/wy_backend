const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const userCtrl = require('./user.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

  .get(auth.isAuthenticated(), userCtrl.index)


  .post(validate(paramValidation.createUser), userCtrl.store);

router.route('/merchant').post(validate(paramValidation.createUser), userCtrl.store);
router.route('/report').post(validate(paramValidation.userReport), auth.isAuthenticated(), userCtrl.userReport);


router.route('/search').get(auth.isAuthenticated(), userCtrl.search);


router.route('/bvn/setup').post(validate(paramValidation.bvn), auth.isAuthenticated(), userCtrl.setUpBVN);
router.route('/bvn/verify').post(validate(paramValidation.bvnVerify), auth.isAuthenticated(), userCtrl.verifyBVN);

router.route('/:userId')


  .put(validate(paramValidation.updateUser), auth.isAuthenticated(), userCtrl.update)

  .put(validate(paramValidation.updateEmail), auth.isAuthenticated(), userCtrl.updateEmail)

  .delete(validate(paramValidation.deleteApi), auth.isAuthenticated(), userCtrl.destroy);

router.route('/email/:userId')

  .post(validate(paramValidation.updateEmail), auth.isAuthenticated(), userCtrl.updateEmail);


// POST
router.route('/resetPassword').post(validate(paramValidation.resetPassword), auth.isAuthenticatedUnVerified(), userCtrl.resetPassword);

router.route('/changePassword').post(validate(paramValidation.changePassword), auth.isAuthenticated(), userCtrl.changePassword);

router.route('/contacts/find').post(validate(paramValidation.contactsFind), auth.isAuthenticated(), userCtrl.checkUserContacts);

router.route('/password/forgot').post(validate(paramValidation.forgotPassword), userCtrl.forgotPassword);

// Patch
router.route('/username').patch(validate(paramValidation.username), auth.isAuthenticated(), userCtrl.updateUserName);
router.route('/username/check').post(validate(paramValidation.username), auth.isAuthenticated(), userCtrl.checkUserName);
router.route('/tokens').patch(auth.isAuthenticated(), userCtrl.updateTokens);

router.route('/password/forgot/verify').patch(validate(paramValidation.forgotPasswordVerify), userCtrl.verifyForgotLink);

module.exports = router;
