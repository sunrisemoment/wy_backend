const express = require('express');
const roleRoutes = require('./server/role/role.route');
const otpRoutes = require('./server/otp/otp.routes');
const userRoutes = require('./server/user/user.routes');
const userWalletRoutes = require('./server/userWallet/userWallet.routes');
const paymentRequestRoutes = require('./server/paymentRequest/paymentRequest.routes');
const paymentSendRoutes = require('./server/paymentSend/paymentSend.routes');
const authRoutes = require('./server/auth/auth.routes');
const wayagramRoutes = require('./server/wayagram/wayagram.routes');
const wayagramCommentsRoutes = require('./server/wayagramComments/wayagramComments.routes');
const uploadRoutes = require('./server/upload/upload.routes');
const bankAccountsRoutes = require('./server/bankAccounts/bankAccounts.routes');
const cardRoutes = require('./server/card/card.routes');
const userFollowRoutes = require('./server/userFollow/userFollow.routes');
const notificationsRoutes = require('./server/notifications/notifications.routes');
const quickTellerRoutes = require('./server/quick-teller/quickteller.routes');
const chatRoutes = require('./server/chat/chat.routes');
const chatOverviewRoutes = require('./server/chatOverview/chatOverview.routes');
const legalRoutes = require('./server/legal/legal.routes');
const userTempRoutes = require('./server/userTemp/userTemp.routes');
const ussdRoutes = require('./server/ussd/ussd.routes');
const configRoutes = require('./server/config/config.routes');
const qrCodeRoutes = require('./server/qrCode/qrCode.routes');
const agent = require('./server/agent/agent.routes');
const groupAccount = require('./server/groupAccount/groupAccount.routes');
const groupAccountPost = require('./server/groupAccountPost/groupAccountPost.routes');

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /API Health Check - Check service health */
router.get('/is-alive', (req, res) =>
  res.send('OK')
);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount auth routes at /auth
router.use('/otp', otpRoutes);

// mount user routes at /upload
router.use('/upload', uploadRoutes);

// mount user routes at /roles
router.use('/roles', roleRoutes);

// mount user routes at /users
router.use('/users', userRoutes);

// mount user routes at /user/wallet
router.use('/user/wallet', userWalletRoutes);

// mount user routes at /payment
router.use('/payment', paymentRequestRoutes);

// mount user routes at /payment/send
router.use('/payment/send', paymentSendRoutes);

// mount user routes at /wayagram
router.use('/wayagram', wayagramRoutes);

// mount user routes at /wayagram/comments
router.use('/wayagram/comments', wayagramCommentsRoutes);

// mount user routes at /bankAccounts
router.use('/bankAccounts', bankAccountsRoutes);

// mount user routes at /bankAccounts
router.use('/cards', cardRoutes);

// mount user routes at /user/follow
router.use('/user/follow', userFollowRoutes);

// mount user routes at /user/follow
router.use('/notifications', notificationsRoutes);

// mount user routes at /user/follow
router.use('/quick-teller', quickTellerRoutes);

// mount user routes at /chat
router.use('/chat', chatRoutes);

// mount user routes at /chats
router.use('/chats', chatOverviewRoutes);

// mount user routes at /guest
router.use('/legal', legalRoutes);

// mount user routes at /guest
router.use('/guest', userTempRoutes);

// mount user routes at /uusd
router.use('/ussd', ussdRoutes);

// mount user routes at /config
router.use('/config', configRoutes);

// mount user routes at /qr
router.use('/qr', qrCodeRoutes);

// mount user routes at /agent
router.use('/agent', agent);

// mount user routes at /agent
router.use('/group', groupAccount);

// mount user routes at /agent
router.use('/group_post/', groupAccountPost);

module.exports = router;
