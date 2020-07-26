const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const cardCtrl = require('./card.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), cardCtrl.index);


    // .post(validate(paramValidation.card), auth.isAuthenticated(), cardCtrl.store)


router.route('/chargeCard').post(validate(paramValidation.card), auth.isAuthenticated(), cardCtrl.chargeCard);
router.route('/chargeCard/verify').post(validate(paramValidation.pinPayStack), auth.isAuthenticated(), cardCtrl.chargeCardVerify);
router.route('/chargeCard/verify/otp').post(validate(paramValidation.otpPayStackCard), auth.isAuthenticated(), cardCtrl.chargeCardVerifyOTP);
router.route('/:accountId').delete(validate(paramValidation.deleteApi), auth.isAuthenticated(), cardCtrl.destroy);

module.exports = router;
