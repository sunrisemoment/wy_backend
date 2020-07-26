const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const chatOverviewCtrl = require('./chatOverview.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), chatOverviewCtrl.index);

module.exports = router;
