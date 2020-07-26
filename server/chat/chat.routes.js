const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../config/param-validation');
const ChatCtrl = require('./chat.controller');

const auth = require('../auth/auth.service');

const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router
  .route('/')

  .post(validate(paramValidation.chat), auth.isAuthenticated(), ChatCtrl.store);

router
  .route('/:chatId')

  .get(auth.isAuthenticated(), ChatCtrl.index)

  .put(validate(paramValidation.chat), auth.isAuthenticated(), ChatCtrl.update)

  .delete(auth.isAuthenticated(), ChatCtrl.destroy);

router
  .route('/forward')
  .post(validate(paramValidation.chat), auth.isAuthenticated(), ChatCtrl.forwardChat);

router
  .route('/delete/chatById/:Id')
  .delete(auth.isAuthenticated(), ChatCtrl.destroyChatById);

router
  .route('/user/:userId')

  .get(auth.isAuthenticated(), ChatCtrl.chatByUserId);

router
  .route('/initiate/:type/:userId')

  .post(
    validate(paramValidation.call),
    auth.isAuthenticated(),
    ChatCtrl.initiateRTC
  );

router
  .route('/initiate/:type/:roomId/:button')
  .patch(auth.isAuthenticated(), ChatCtrl.initiatedRTC);

module.exports = router;
