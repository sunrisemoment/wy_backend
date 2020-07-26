const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const userFollowCtrl = require('./userFollow.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')
    .post(validate(paramValidation.userFollow), auth.isAuthenticated(), userFollowCtrl.index)
    .delete(validate(paramValidation.userFollow), auth.isAuthenticated(), userFollowCtrl.index);

router.route('/:userId')
    .get(auth.isAuthenticated(), userFollowCtrl.profile);

router.route('/:userId/following')
    .get(auth.isAuthenticated(), userFollowCtrl.profileDetailFollowing);

router.route('/:userId/followers')
    .get(auth.isAuthenticated(), userFollowCtrl.profileDetailFollowers);


router.route('/:userId/following/not')
    .get(auth.isAuthenticated(), userFollowCtrl.profileDetailFollowingNot);

router.route('/:userId/followers/not')
    .get(auth.isAuthenticated(), userFollowCtrl.profileDetailFollowersNot);


router.route('/')
    .patch(validate(paramValidation.userFollow), auth.isAuthenticated(), userFollowCtrl.acceptReject);

module.exports = router;
