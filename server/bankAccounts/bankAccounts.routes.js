const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const bankAccountCtrl = require('./bankAccounts.controller');

const bankAccountService = require('./bankAccounts.service');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), bankAccountCtrl.index);


    // .post(validate(paramValidation.bankAccount), auth.isAuthenticated(), bankAccountCtrl.store)]

router.route('/banks').get(auth.isAuthenticated(), bankAccountCtrl.banks);
router.route('/banks/accepted').get(auth.isAuthenticated(), bankAccountCtrl.acceptableBanks);
router.route('/banks/rubie').get(auth.isAuthenticated(), bankAccountCtrl.banksRubies);
router.route('/banks/paystack/account').post(validate(paramValidation.rubieAccount), auth.isAuthenticated(), bankAccountCtrl.getAccountDetailsViaPaystack);
router.route('/banks/rubie/account').post(validate(paramValidation.rubieAccount), auth.isAuthenticated(), bankAccountCtrl.getAccountDetailsViaRubie);
router.route('/banks/rubie/withdraw').post(validate(paramValidation.rubieAccountWithdraw), auth.isAuthenticated(), bankAccountCtrl.fundTransferViaRubie);
router.route('/chargeBank').post(validate(paramValidation.bankAccount), auth.isAuthenticated(), bankAccountCtrl.chargeBank);
// router.route('/chargeBank/verify').post(validate(paramValidation.otpPayStack), auth.isAuthenticated(), bankAccountCtrl.chargeBankVerify)
router.route('/:accountId').delete(validate(paramValidation.deleteApi), auth.isAuthenticated(), bankAccountCtrl.destroy);


router.route('/rubies/service').post(bankAccountService.__callback);

module.exports = router;
