var Global = require('../helpers/global');
var bcrypt = require('bcryptjs');
var _Response = require('../helpers/Response');
var uniqid = require('uniqid');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var config = require('../../config/config');

var PaymentRequest = require('../paymentRequest/paymentRequest.model');
var User = require('../user/user.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var Commission = require('../commission/commission.model');

var SendSMS = require('../otp/otp.controller');
var Chat = require('../chat/chat.controller');
var UserTemp = require('../userTemp/userTemp.controller');
var UserTemp = require('../userTemp/userTemp.controller');
var Notification = require('../notifications/notifications.controller');

var UserService = require('../user/user.service');

function transferFundToWaya(req, res, next) {
    var Response = { ..._Response };
    var messageBody;

    req.body.amount = parseFloat(req.body.amount);

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        User.findOne({ _id: req.body.recieverId, isActive: true }).then(r => {

            if (!r) {
                var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            var deduct = req.body.amount + config.interswitch.commission;
            UserWallet.findOne({ userId: req.user._id }).then(wallet => {
                if (wallet.availableBalance < deduct) {
                    var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }
                wallet.availableBalance = wallet.availableBalance - deduct;
                wallet.save().then(updatedWallet => {
                    UserWalletHistory.create({
                        walletId: wallet._id,
                        userId: wallet.userId,
                        senderDetail: {
                            name: r.firstName +" "+r.lastName,
                            phone: r.phone,
                            _id: r._id,
                        },
                        type: 'debit',
                        chatId:Global.getChatId(wallet.userId,r._id),
                        balance: wallet.availableBalance,
                        amount: deduct,
                        actualAmount: req.body.amount,
                        commission: config.interswitch.commission,
                        description: "Transfer to " + r.phone,
                        referenceCode: req.params.paymentRequestId
                    }).then(history=>{
                        messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + updatedWallet.availableBalance;
                        SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                        Notification.storeNew("You have a debit transaction of NGN "+req.body.amount,messageBody,"DB", req.user._id, history._id);

                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId: Global.getChatId(wallet.userId, r._id),
                            senderDetail: {
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: config.interswitch.commission,
                            actualAmount: config.interswitch.commission,
                            commission: 0,
                            description: "Commission charge for payment send",
                            referenceCode: history._id
                        });

                        UserService.merchantCommission(wallet.userId);
                    });

                    Commission.create({
                        walletId: wallet._id,
                        type: 'debit',
                        userId: wallet.userId,
                        amount: config.interswitch.commission,
                        description: "Commission charge for payment send",
                        referenceCode: req.params.paymentRequestId
                    });

                    UserWallet.findOne({ userId: req.body.recieverId }).then(walletUser => {
                        walletUser.availableBalance = walletUser.availableBalance + req.body.amount;
                        walletUser.save().then(updatedWalletUser => {
                            UserWalletHistory.create({
                                walletId: walletUser._id,
                                userId: walletUser.userId,
                                chatId:Global.getChatId(walletUser.userId,req.user._id),
                                type: 'credit',
                                senderDetail: {
                                    name: req.user.firstName +" "+req.user.lastName,
                                    phone: req.user.phone,
                                    _id: req.user._id,
                                },
                                balance: walletUser.availableBalance,
                                amount: req.body.amount,
                                actualAmount: req.body.amount,
                                commission: 0,
                                description: "Transfer from " + req.user.phone,
                                referenceCode: req.params.paymentRequestId
                            }).then(history=>{
                                messageBody = "ALERT!! Amount Credited" + "\r\nAC NAME: " + r.firstName + " " + r.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + walletUser.availableBalance;
                                SendSMS.sendSMS(messageBody, r.phone, req.user);
                                Notification.storeNew("You have a credit transaction of NGN "+req.body.amount,messageBody,"CR", r._id, history._id);
                            });
                        })


                    });

                    Response.message = "Payment of NGN "+req.body.amount+" has been sent to "+r.firstName +" "+r.lastName+" ("+r.phone+")";
                    res.send(Response);
                    return null;

                });
                return null;
            });

            return null;
        })
        return null;
    })

}

function transferFundToNonWaya(req, res, next) {
    var Response = { ..._Response };

    req.body.amount = parseFloat(req.body.amount);

    req.body.phone = req.body.phone.replace(/ /g, '').replace(/-/g, '').replace(/[{()}]/g, '').replace(/^0+/, '');

    // bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

    //     if (!match) {
    //         var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
    //         return next(err);
    //     }

        User.findOne({ phone: req.body.phone, isActive: true }).then(reciever => {

            if (reciever) {
                var err = new APIError('User already exists!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            UserTemp.store(req, res, next).then(r => {

                var deduct = req.body.amount + config.interswitch.commission;
                UserWallet.findOne({ userId: req.user._id }).then(wallet => {
                    if (wallet.availableBalance < deduct) {
                        var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                        return next(err);
                    }
                    wallet.availableBalance = wallet.availableBalance - deduct;
                    wallet.save().then(updatedWallet => {
                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId:null,
                            senderDetail: {
                                name: r.name,
                                phone: r.phone,
                                _id: r._id,
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: deduct,
                            actualAmount: req.body.amount,
                            commission: config.interswitch.commission,
                            description: "Payment Settlement",
                            referenceCode: req.params.paymentRequestId
                        }).then(history=>{
                            messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + updatedWallet.availableBalance;
                            SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                            Notification.storeNew("You have a debit transaction of NGN "+req.body.amount,messageBody,"DB", req.user._id, history._id);

                            UserWalletHistory.create({
                                walletId: wallet._id,
                                userId: wallet.userId,
                                chatId: Global.getChatId(wallet.userId, r._id),
                                senderDetail: {
                                },
                                type: 'debit',
                                balance: wallet.availableBalance,
                                amount: config.interswitch.commission,
                                actualAmount: config.interswitch.commission,
                                commission: 0,
                                description: "Commission charge for payment request settlement",
                                referenceCode: history._id
                            });

                            UserService.merchantCommission(wallet.userId);
                        });

                        Commission.create({
                            walletId: wallet._id,
                            type: 'debit',
                            userId: wallet.userId,
                            amount: config.interswitch.commission,
                            description: "Commission charge for payment request settlement",
                            referenceCode: req.params.paymentRequestId
                        });

                        UserWallet.findOne({ userId: r._id }).then(walletUser => {
                            walletUser.availableBalance = walletUser.availableBalance + req.body.amount;
                            walletUser.save().then(updatedWalletUser => {
                                UserWalletHistory.create({
                                    walletId: walletUser._id,
                                    userId: walletUser.userId,
                                    chatId:null,
                                    type: 'credit',
                                    senderDetail: {
                                        name: req.user.firstName +" "+req.user.lastName,
                                        phone: req.user.phone,
                                        _id: req.user._id,
                                    },
                                    balance: walletUser.availableBalance,
                                    amount: req.body.amount,
                                    actualAmount: req.body.amount,
                                    commission: 0,
                                    description: "Payment Settled",
                                    referenceCode: req.params.paymentRequestId
                                }).then(history=>{
                                    messageBody = "ALERT!! Amount Credited" + "\r\nAC NAME: " + r.name + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + walletUser.availableBalance + "\r\nDownload waya paychat app for Android: https://play.google.com/store/apps/details?id=com.wayapaychat OR \r\n IOS: https://apps.apple.com/us/app/id1480642853 to complete your transaction";
                                    SendSMS.sendSMS(messageBody, r.phone, req.user);
                                    Notification.storeNew("You have a credit transaction of NGN "+req.body.amount,messageBody,"CR", r._id, history._id);
                                });
                            })
                        });

                        Response.message = "Payment of NGN "+req.body.amount+" has been sent to "+r.name +" ("+r.phone+")";
                        res.send(Response);
                        return null;

                    });
                    return null;
                });
                return null;
            });
            return null;
        });
    //     return null;
    // });

}



module.exports = {
    transferFundToWaya,
    transferFundToNonWaya
};
