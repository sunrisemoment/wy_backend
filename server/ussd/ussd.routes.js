const express = require('express');
const ctrl = require('./ussd.controller');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/').post(ctrl.index);

router.route('/make').post(validate(paramValidation.ussdCode), auth.isAuthenticated(), ctrl.makeUSSD);

module.exports = router;
