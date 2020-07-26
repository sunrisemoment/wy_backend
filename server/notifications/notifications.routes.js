const express = require('express');
const ctrl = require('./notifications.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')
    .get(auth.isAuthenticated(), ctrl.index);

router.route('/read')

    .patch(auth.isAuthenticated(), ctrl.read);

module.exports = router;
