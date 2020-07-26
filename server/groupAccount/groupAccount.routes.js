const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const groupActionCtrl = require('./groupAccount.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/new')
    .post(validate(paramValidation.createGroup), auth.isAuthenticated(), groupActionCtrl.store);

router.route('/')
    .get(auth.isAuthenticated(), groupActionCtrl.index);

router.route('/join')
    .post(validate(paramValidation.joinGroup), auth.isAuthenticated(), groupActionCtrl.joinGroup);

router.route('/:groupId')
    .get(auth.isAuthenticated(), groupActionCtrl.profile);

router.route('/:groupId/followers')
    .get(auth.isAuthenticated(), groupActionCtrl.groupFollowers);

router.route('/')
    .patch(validate(paramValidation.userFollow), auth.isAuthenticated(), groupActionCtrl.acceptReject);

module.exports = router;
