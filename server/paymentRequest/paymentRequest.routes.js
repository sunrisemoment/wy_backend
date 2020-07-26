const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const ctrl = require('./paymentRequest.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/request').get(auth.isAuthenticated(), ctrl.index);
router.route('/request').post(validate(paramValidation.payment), auth.isAuthenticated(), ctrl.store);
router.route('/request/nonwaya').post(validate(paramValidation.paymentNonwaya), auth.isAuthenticated(), ctrl.storeNonWaya);
router.route('/request/:paymentRequestId').patch(auth.isAuthenticated(), ctrl.settlePaymentRequest);

router.route('/request/nonwaya/:paymentRequestId/:otp').patch(validate(paramValidation.x_auth), auth.isAuthenticated(), ctrl.settlePaymentRequestNonWaya);
router.route('/request/nonwaya/:paymentRequestId').get(auth.isAuthenticated(), ctrl.getPaymentRequestId);

router.route('/request/:paymentRequestId').delete(auth.isAuthenticated(), ctrl.rejectPaymentRequest);

router.route('/retrieve').post(validate(paramValidation.retrievePayment), auth.isAuthenticated(), ctrl.retrievePayment);
router.route('/retrieve/otp').post(validate(paramValidation.retrievePaymentOTP), auth.isAuthenticated(), ctrl.retrievePaymentOTP);


module.exports = router;
