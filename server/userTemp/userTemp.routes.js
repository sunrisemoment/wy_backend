const express = require('express');
const ctrl = require('./userTemp.controller');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/feedback').post(validate(paramValidation.feedback), ctrl.feedback);

module.exports = router;
