const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const groupAccountPostCtrl = require('./groupAccountPost.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/')

    .get(auth.isAuthenticated(), groupAccountPostCtrl.index)


    .post(validate(paramValidation.createPost), auth.isAuthenticated(), groupAccountPostCtrl.store);

router.route('/getmyposts').get(auth.isAuthenticated(), groupAccountPostCtrl.getmyposts);

router.route('/getuserposts/:userId').get(auth.isAuthenticated(), groupAccountPostCtrl.getuserposts);

router.route('/search').get(auth.isAuthenticated(), groupAccountPostCtrl.search);

router.route('/:postId')

    .put(validate(paramValidation.createPost), auth.isAuthenticated(), groupAccountPostCtrl.update)

    .delete(auth.isAuthenticated(), groupAccountPostCtrl.destroy);

router.route('/:postId/user/:userId').patch(auth.isAuthenticated(), groupAccountPostCtrl.postLike);

module.exports = router;
