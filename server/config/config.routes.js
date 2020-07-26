const express = require('express');
const ctrl = require('./config.controller');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/').get(ctrl.index);

module.exports = router;
