const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const uploadCtrl = require('./upload.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/post').post(auth.isAuthenticated(), uploadCtrl.imageUpload);
router.route('/profile').post(auth.isAuthenticated(), uploadCtrl.profileUpload);
router.route('/chat').post(auth.isAuthenticated(), uploadCtrl.chatFile);


module.exports = router;
