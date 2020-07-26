const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const wayagramCtrl = require('./wayagramComments.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .post(validate(paramValidation.createComment), auth.isAuthenticated(), wayagramCtrl.store);

router.route('/:postId')

    .get(auth.isAuthenticated(), wayagramCtrl.index);

router.route('/:commentId')

    .put(validate(paramValidation.createComment), auth.isAuthenticated(), wayagramCtrl.update)

    .delete(auth.isAuthenticated(), wayagramCtrl.destroy);

module.exports = router;
