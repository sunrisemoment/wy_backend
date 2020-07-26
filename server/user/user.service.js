const qrCode = require('qrcode');
const Global = require('../helpers/global');
const httpStatus = require('http-status');
const config = require('../../config/config');
const qrcode = require('qr-image');
const fs = require('fs');

const User = require('./user.model');
const UserTemp = require('../userTemp/userTemp.model');
const UserFollow = require('../userFollow/userFollow.model');
const UserWallet = require('../userWallet/userWallet.model');
const UserWalletHistory = require('../walletHistory/walletHistory.model');
const Commission = require('../commission/commission.model');
const MerchantCommission = require('../userWallet/merchantCommission.model');
const Notification = require('../notifications/notifications.controller');
const SendSMS = require('../otp/otp.controller');

function generateQrCode(savedUser) {
  const qrTxt = JSON.stringify({ _id: savedUser._id, phone: savedUser.phone, username: savedUser.username, firstName: savedUser.firstName, lastName: savedUser.lastName });

  qrCode.toDataURL(qrTxt, { errorCorrectionLevel: 'H' }, (err, url) => {
    if (err) {
      return err;
    }

    savedUser.qrcode = url;
    savedUser.save().then(() => null);
  });
}

function createFollow(user) {
  UserFollow.create({
    userId: user._id,
    followersCount: 1,
    followingCount: 1,
    followingIds: [config.admin.userId],
    followerIds: [config.admin.userId]
  });

  UserFollow.findOneAndUpdate({ userId: config.admin.userId }, { $push: { followingIds: user._id.toString() }, $inc: { followingCount: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {
    UserFollow.findOneAndUpdate({ userId: config.admin.userId }, { $push: { followerIds: user._id.toString() }, $inc: { followersCount: 1 } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {

    });
  });
}


function createUserWallet(user) {
  return new Promise((resolve, reject) => {
    UserTemp.findOne({ phone: user.phone, isActive: true }).then((userExists) => {
      if (!userExists) {
        UserWallet.create({ userId: user._id, clearedBalance: 0, availableBalance: 0 }).then(() => {
          resolve();
          return null;
        });

        if (user.role == 'MERCHANT') {
          MerchantCommission.create({ userId: user._id, totalCommission: 0 });
        }
      } else {
        UserWallet.findOneAndUpdate({ userId: userExists._id }, { userId: user._id }).then(() => {
          userExists.isActive = false;
          userExists.save();
          resolve();
          return null;
        });
      }
    });
    return null;
  });
}

function inviteByPoints(req, user) {
  if (!req.body.invitedBy) { return; }
  User.findOne({ inviteCode: req.body.invitedBy || '-' }).then((invitedUsers) => {
    if (!invitedUsers) { return; }
    UserWallet.findOne({ userId: invitedUsers._id }).then((wallet) => {
      if (!wallet) { return; }

      wallet.availableBalance += config.inviteAmount;
      wallet.save().then((updatedWallet) => {
        const description = `NGN ${config.inviteAmount} was credited to your wallet for inviting ${req.body.firstName} ${req.body.lastName}`;
        UserWalletHistory.create({
          walletId: wallet._id,
          userId: wallet.userId,
          chatId: Global.getChatId(wallet.userId, user._id),
          senderDetail: {
            name: `${req.body.firstName} ${req.body.lastName}`,
            phone: req.body.phone,
            _id: user._id,
          },
          type: 'credit',
          balance: wallet.availableBalance,
          amount: config.inviteAmount,
          actualAmount: config.inviteAmount,
          commission: config.inviteAmount,
          description
        }).then((history) => {
          const messageBody = `${'ALERT!! Amount Credited (Invitation Code)' + '\r\nAC NAME: '}${invitedUsers.firstName} ${invitedUsers.lastName}\r\nDATE: ${new Date().toGMTString()}\r\nAMT: NGN ${config.inviteAmount}\r\nBAL: NGN ${wallet.availableBalance}`;
          Notification.storeNew(`You have a credit transaction of NGN ${config.inviteAmount}`, messageBody, 'CR', invitedUsers._id, history._id);
          SendSMS.sendTxnAlert(description, invitedUsers.phone, invitedUsers);
        });

        Commission.create({
          walletId: wallet._id,
          type: 'credit',
          userId: wallet.userId,
          amount: config.inviteAmount,
          description: 'Invite code amount credited',
        });
      });
    });
  });
}

function merchantCommission(userId) {
  User.findOne({ _id: userId, isActive: true }).then((user) => {
    if (!user || user.role == 'USER') {
      return null;
    }
    MerchantCommission.findOne({ userId, isActive: true }).then((wallet) => {
      if (!wallet) {
        return null;
      }
      wallet.totalBalance += 1;
      wallet.save().then(() => false);
    });
  });
}

module.exports = { generateQrCode, createFollow, createUserWallet, inviteByPoints, merchantCommission };
