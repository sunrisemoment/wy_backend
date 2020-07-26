const express = require('express');
const ctrl = require('./userWallet.controller');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/').get(auth.isAuthenticated(), ctrl.index);

router.route('/topUpWallet/card').post(validate(paramValidation.topUpWalletViaCard), auth.isAuthenticated(), ctrl.topUpWalletViaCard);

router.route('/topUpWallet/bank').post(validate(paramValidation.topUpWalletViaCBank), auth.isAuthenticated(), ctrl.topUpWalletViaBank);
router.route('/topUpWallet/bank/otp').post(validate(paramValidation.topUpWalletViaCBankOtp), auth.isAuthenticated(), ctrl.topUpWalletViaBankVerify);

router.route('/withdraw').post(validate(paramValidation.withdraw), auth.isAuthenticated(), ctrl.withdraw);

module.exports = router;
