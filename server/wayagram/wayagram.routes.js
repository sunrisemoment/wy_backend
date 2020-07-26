const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const wayagramCtrl = require('./wayagram.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), wayagramCtrl.index)


    .post(validate(paramValidation.createPost), auth.isAuthenticated(), wayagramCtrl.store)

    .copy(validate(paramValidation.createRePost), auth.isAuthenticated(), wayagramCtrl.repost)

    .patch(validate(paramValidation.createRePost), auth.isAuthenticated(), wayagramCtrl.repost);

router.route('/comment').patch(validate(paramValidation.createRePostComment), auth.isAuthenticated(), wayagramCtrl.repostComment);

router.route('/getMoments').get(auth.isAuthenticated(), wayagramCtrl.getMoments);

router.route('/getmyposts').get(auth.isAuthenticated(), wayagramCtrl.getmyposts);

router.route('/getuserposts/:userId').get(auth.isAuthenticated(), wayagramCtrl.getuserposts);

router.route('/getuserMoments/:userId').get(auth.isAuthenticated(), wayagramCtrl.getuserMoments);

router.route('/search').get(auth.isAuthenticated(), wayagramCtrl.search);

router.route('/:postId')

    .put(validate(paramValidation.createPost), auth.isAuthenticated(), wayagramCtrl.update)

    .delete(auth.isAuthenticated(), wayagramCtrl.destroy);

router.route('/:postId/user/:userId').patch(auth.isAuthenticated(), wayagramCtrl.postLike);

module.exports = router;
