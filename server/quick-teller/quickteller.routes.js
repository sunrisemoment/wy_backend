const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const ctrl = require('./quickteller.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/billers').get(auth.isAuthenticated(), ctrl.billers);
router.route('/categorys').get(auth.isAuthenticated(), ctrl.categorys);
router.route('/categorys/:categoryId/billers').get(validate(paramValidation.categorysBillers), auth.isAuthenticated(), ctrl.billerByCategoryId);
router.route('/categorys/:billerId/paymentitems').get(validate(paramValidation.paymentItemsByBillerId), auth.isAuthenticated(), ctrl.paymentItemsByBillerId);
router.route('/customers/validations').post(validate(paramValidation.customerValidations), auth.isAuthenticated(), ctrl.customerValidations);
router.route('/sendBillPaymentAdvice').post(validate(paramValidation.customerValidations), auth.isAuthenticated(), ctrl.sendPaymentAdvices);

module.exports = router;
