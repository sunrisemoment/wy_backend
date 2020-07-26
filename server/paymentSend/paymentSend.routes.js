var express = require('express');
var validate = require('express-validation');
var paramValidation = require('../../config/param-validation');
var ctrl = require('./paymentSend.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/').post(validate(paramValidation.paymentSend), auth.isAuthenticated(), ctrl.transferFundToWaya);
router.route('/nonwaya').post(validate(paramValidation.paymentSendNonwaya), auth.isAuthenticated(), ctrl.transferFundToNonWaya);


module.exports = router;
