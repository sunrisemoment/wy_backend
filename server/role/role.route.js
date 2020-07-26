const express = require('express');
const ctrl = require('./role.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')

    .get(ctrl.getInternalRoles);

module.exports = router;
