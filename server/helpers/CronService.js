const cron = require('node-cron');
const config = require('../../config/config');
const Email = require('../helpers/email');

const service = require('../../server/auth/auth.service');

const User = require('../user/user.model');
const UserService = require('../user/user.service');
const BankService = require('../bankAccounts/bankAccounts.service');
const OTP = require('../otp/otp.model');
const Notifications = require('../notifications/notifications.model');
const WayaGramPost = require('../wayagram/wayagram.model');


// 1 DAY CRON SERVICE
// TO DO : 23 59 * * *
cron.schedule('* * * * *', () => {
  BankService.__allowedBanks(true);
});

// 1 min CRON SERVICE
cron.schedule(config.cron.forgot, () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - config.expiry.forgotToken);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1); // 24 hours

  // FORGOT TOKEN
  User.update({ forgotToken: { $ne: null }, updatedAt: { $lte: d } }, { forgotToken: null, updatedAt: Date.now() }).then((user) => { });

  // UPDATE QR CODE
  // User.find({ updatedAt: { $lte: d } }).then((users) => {
  //   users.forEach((user) => {
  //     UserService.generateQrCode(user);
  //   });
  // });

  // User.find({ isActive: true }).then((users) => {
  //   users.forEach(user => {
  //     UserService.generateQrCode(user);
  //   })
  // });

  // OTP EXPIRATION
  OTP.update({ isActive: true, updatedAt: { $lte: d } }, { isActive: false, updatedAt: Date.now() }).then((user) => { });

  // MOMENTS 24 HOUR
  WayaGramPost.update({ isActive: true, isMoment: true, updatedAt: { $lte: cutoff } }, { isActive: false, updatedAt: Date.now() }).then((posts) => { });

  // STANDARD NOTIFICATION
  Notifications.find({ isSent: false, isActive: true }).then((n) => {
    n.forEach((el) => {
      switch (el.type) {
        case 'LIKE':
          like(el);
          break;
        case 'UN_LIKE':
          unLike(el);
          break;
        case 'COMMENT':
          comments(el);
          break;
        case 'SIGNUP':
          signUp(el);
          break;
        case 'CR':
          credit(el);
          break;
        case 'DB':
          debit(el);
          break;
      }

      el.isSent = true;
      el.save().then(up => null);
      return null;
    });
    return null;
  });
  return null;
});

/**
 *
 * @param {*} el
 */
function like(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user) {
      if (user.fcmToken) {
        service.sendFCM(user, 'Wayagram', el.content);
      }
      Email.sendEmails(user, 'WayaPay', el.content);
    }
  });
}

/**
 *
 * @param {*} el
 */
function unLike(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user) {
      if (user.fcmToken) {
        service.sendFCM(user, 'Wayagram', el.content);
      }
      Email.sendEmails(user, 'WayaPay', el.content);
    }
  });
}

/**
 *
 * @param {*} el
 */
function comments(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user) {
      if (user.fcmToken) {
        service.sendFCM(user, 'Wayagram', el.content);
      }
      Email.sendEmails(user, 'WayaPay', el.content);
    }
  });
}

/**
 *
 * @param {*} el
 */
function signUp(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user.fcmToken) {
      service.sendFCM(user, 'Wayagram', el.content);
    }
    Email.sendEmails(user, 'WayaPay', el.content);
  });
}

/**
 *
 * @param {*} el
 */
function credit(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user) {
      if (user.fcmToken) {
        service.sendFCM(user, 'WayaPay', el.content);
      }
      Email.sendEmails(user, 'WayaPay', el.content);
    }
  });
}

/**
 *
 * @param {*} el
 */
function debit(el) {
  User.findOne({ _id: el.userId, isActive: true }).then((user) => {
    if (user) {
      if (user.fcmToken) {
        service.sendFCM(user, 'WayaPay', el.content);
      }
      Email.sendEmails(user, 'WayaPay', el.content);
    }
  });
}
