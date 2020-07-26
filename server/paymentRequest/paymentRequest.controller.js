var Global = require('../helpers/global');
var bcrypt = require('bcryptjs');
var _Response = require('../helpers/Response');
var uniqid = require('uniqid');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var config = require('../../config/config');
var bcrypt = require('bcryptjs');

var PaymentRequest = require('./paymentRequest.model');
var User = require('../user/user.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var Commission = require('../commission/commission.model');

var SendSMS = require('../otp/otp.controller');
var Chat = require('../chat/chat.controller');
var UserTemp = require('../userTemp/userTemp.controller');

var UserTempModal = require('../userTemp/userTemp.model');
var OTP = require('../otp/otp.model');
var OTPService = require('../otp/otp.controller');
var Notification = require('../notifications/notifications.controller');


var UserService = require('../user/user.service');
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function index(req, res, next) {
    var Response = { ..._Response };
    PaymentRequest.walletInfo({ $or: [{ sentBy: req.user._id }, { recievedBy: req.user._id }] }).then(data => {
        Response.data = data;
        Response.message = 'Payment Request';
        res.send(Response);
        return null;
    })
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function getPaymentRequestId(req, res, next) {
    var Response = { ..._Response };
    PaymentRequest.findOne({ txnCode: req.params.paymentRequestId, paymentStatus: "unpaid", isWaya: false }).then(data => {
        if (!data) {
            var err = new APIError("Payment Request not valid", httpStatus.BAD_REQUEST);
            return next(err);
        }

        req.body = { phone: data.phone };
        OTPService.sendNonWayaOTP(req, res, next);

        Response.data = data;
        Response.message = 'Payment Request to non waya details';
        res.send(Response);
        return null;
    })
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function store(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        let paymentRequest = {
            amount: req.body.amount,
            sentBy: req.user._id,
            recievedBy: req.body.recievedBy,
            phone: req.body.phone,
            name: req.body.name || "",
            note: req.body.note || null,
            txnCode: uniqid(),
            checkSum: Global.getChatId(req.user._id, req.body.recievedBy)
        }

        if (paymentRequest.sentBy == paymentRequest.recievedBy) {
            var err = new APIError("You cannot send payment request to your self", httpStatus.BAD_REQUEST);
            return next(err);
        }

        User.findOne({ _id: paymentRequest.recievedBy }).then(user => {
            if (!user) {
                var err = new APIError("Reciever not exists", httpStatus.BAD_REQUEST);
                return next(err);
            }

            // if (paymentRequest.phone != user.phone) {
            //     var err = new APIError("Reciever phone mismtach", httpStatus.BAD_REQUEST);
            //     return next(err);
            // }

            paymentRequest.phone = user.phone;

            if (!user.isActive) {
                var err = new APIError("Reciever account is disabled", httpStatus.BAD_REQUEST);
                return next(err);
            }

            PaymentRequest.create(paymentRequest);
            var body = "Hello, " + req.user.firstName + " " + req.user.lastName + " is requesting you to pay a sum of " + paymentRequest.amount + " Naira on WayaPayChat. Login to your account to complete this transaction. \r\nDATE: " + new Date().toGMTString();
            SendSMS.sendSMS(body, paymentRequest.phone, user);
            Notification.storeNew("Payment Request from " + req.user.phone, body, "PR", user._id, paymentRequest.txnCode);

            req.body.message = "Payment Requested for " + paymentRequest.amount + " Naira";
            req.body.userId2 = paymentRequest.recievedBy;
            req.body.type = config.chat.payment;

            Chat.newChat(req, res, next).then(() => { });

            Response.message = "Payment request of NGN " + req.body.amount + " has been sent to " + user.firstName + " " + user.lastName + " (" + user.phone + ")";
            res.send(Response);
            return null;
        });
        return null;
    })


}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function storeNonWaya(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        let txnCode = Global.txnCodeGen();



        User.findOne({ phone: req.body.phone, isActive: true }).then(user => {
            if (user) {
                var err = new APIError("Waya user exists", httpStatus.BAD_REQUEST);
                return next(err);
            }
            UserTemp.store(req, res, next).then(userTemp => {
                let paymentRequest = {
                    amount: req.body.amount,
                    sentBy: req.user._id,
                    recievedBy: userTemp._id,
                    name: req.body.name,
                    phone: req.body.phone,
                    note: req.body.note || null,
                    txnCode: txnCode,
                    checkSum: Global.getChatId(req.user._id, req.body.phone),
                    isWaya: false,
                }

                if (req.user.phone == paymentRequest.phone) {
                    var err = new APIError("You cannot send payment request to your self", httpStatus.BAD_REQUEST);
                    return next(err);
                }

                PaymentRequest.create(paymentRequest);
                var body = "Hello, " + req.user.firstName + " " + req.user.lastName + " is requesting you to pay a sum of " + paymentRequest.amount + " naira on WayaPayChat. Download the wayapaychat app https://play.google.com/store/apps/details?id=com.wayapaychat OR use Payment Code:" + paymentRequest.txnCode + " to settle the request via any of our agents";
                SendSMS.sendSMS(body, paymentRequest.phone, userTemp);
                Notification.storeNew("Payment Request from " + req.user.phone, body, "PR", userTemp._id, paymentRequest.txnCode);

                Response.message = "Payment request of NGN " + paymentRequest.amount + " has been sent to (" + req.body.phone + ")";
                res.send(Response);
                return null;
            });
            return null;
        });
        return null;
    })
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function settlePaymentRequest(req, res, next) {
    var Response = { ..._Response };
    var messageBody;

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }


        PaymentRequest.findOne({ _id: req.params.paymentRequestId, paymentStatus: "unpaid", recievedBy: req.user._id, isWaya: true }).then(data => { // recievedBy:req.user._id
            if (!data) {
                var err = new APIError("Payment Request not valid", httpStatus.BAD_REQUEST);
                return next(err);
            }

            data.amount = parseFloat(data.amount);

            var deduct = data.amount + config.interswitch.commission;
            User.findOne({ _id: data.sentBy }).then(sender => {
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
                            chatId: Global.getChatId(wallet.userId, sender._id),
                            senderDetail: {
                                name: sender.firstName + " " + sender.lastName,
                                phone: sender.phone,
                                _id: sender._id,
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: deduct,
                            actualAmount: data.amount,
                            commission: config.interswitch.commission,
                            description: "Payment Settlement",
                            referenceCode: req.params.paymentRequestId
                        }).then(history => {

                            messageBody = "ALERT!! Amount Debited (Settlement of Payment Request:" + data.phone + ")" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + data.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                            SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                            Notification.storeNew("You have a debit transaction of NGN " + data.amount, messageBody, "DB", req.user._id, history._id);

                            // Commission Deduction
                            UserWalletHistory.create({
                                walletId: wallet._id,
                                userId: wallet.userId,
                                chatId: Global.getChatId(wallet.userId, sender._id),
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

                        UserWallet.findOne({ userId: data.sentBy }).then(walletUser => {
                            walletUser.availableBalance = walletUser.availableBalance + data.amount;
                            walletUser.save().then(updatedWalletUser => {
                                UserWalletHistory.create({
                                    walletId: walletUser._id,
                                    userId: walletUser.userId,
                                    chatId: Global.getChatId(walletUser.userId, req.user._id),
                                    senderDetail: {
                                        name: req.user.firstName + " " + req.user.lastName,
                                        phone: req.user.phone,
                                        _id: req.user._id,
                                    },
                                    type: 'credit',
                                    balance: walletUser.availableBalance,
                                    amount: data.amount,
                                    actualAmount: data.amount,
                                    commission: 0,
                                    description: "Payment Settled",
                                    referenceCode: req.params.paymentRequestId
                                }).then(history => {
                                    messageBody = "ALERT!! Amount Credited (Settlement of Payment Request:" + req.user.phone + ")" + "\r\nAC NAME: " + sender.firstName + " " + sender.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + data.amount + "\r\nBAL: NGN " + walletUser.availableBalance;
                                    SendSMS.sendSMS(messageBody, data.phone, req.user);
                                    Notification.storeNew("You have a credit transaction of NGN " + data.amount, messageBody, "CR", sender._id, history._id);
                                });
                            })
                        });

                        return null;

                    });
                    return null;
                });

                data.paymentStatus = "paid";
                data.save().then(() => {
                    Response.message = "Payment request of NGN " + data.amount + " has been settled against (" + data.phone + ")";
                    res.send(Response);
                    return null;
                })
                return null;
            });
            return null;
        });
        return null;
    });

}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function settlePaymentRequestNonWaya(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        PaymentRequest.findOne({ txnCode: req.params.paymentRequestId, paymentStatus: "unpaid", isWaya: false }).then(data => { // recievedBy:req.user._id
            if (!data) {
                var err = new APIError("Payment Request not valid", httpStatus.BAD_REQUEST);
                return next(err);
            }

            data.amount = parseFloat(data.amount);

            OTP.findOne({ phone: data.phone, isActive: true, otp: req.params.otp }).then(otp => {
                if (!otp) {
                    var err = new APIError("Invalid Otp", httpStatus.BAD_REQUEST);
                    return next(err);
                }

                var deduct = data.amount + config.interswitch.commission;
                User.findOne({ _id: data.sentBy }).then(sender => {
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
                                chatId: Global.getChatId(wallet.userId, sender._id),
                                senderDetail: {
                                    name: sender.firstName + " " + sender.lastName,
                                    phone: sender.phone,
                                    _id: sender._id,
                                },
                                type: 'debit',
                                balance: wallet.availableBalance,
                                amount: deduct,
                                actualAmount: data.amount,
                                commission: config.interswitch.commission,
                                description: "Payment Settlement",
                                referenceCode: req.params.paymentRequestId
                            }).then(history => {

                                messageBody = "ALERT!! Amount Debited (Settlement of Payment Request:" + data.phone + ")" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + data.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                                SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                                Notification.storeNew("You have a debit transaction of NGN " + data.amount, messageBody, "DB", req.user._id, history._id);

                                UserWalletHistory.create({
                                    walletId: wallet._id,
                                    userId: wallet.userId,
                                    chatId: Global.getChatId(wallet.userId, sender._id),
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

                            UserWallet.findOne({ userId: data.sentBy }).then(walletUser => {
                                walletUser.availableBalance = walletUser.availableBalance + data.amount;
                                walletUser.save().then(updatedWalletUser => {
                                    UserWalletHistory.create({
                                        walletId: walletUser._id,
                                        userId: walletUser.userId,
                                        chatId: Global.getChatId(walletUser.userId, req.user._id),
                                        senderDetail: {
                                            name: req.user.firstName + " " + req.user.lastName,
                                            phone: req.user.phone,
                                            _id: req.user._id,
                                        },
                                        type: 'credit',
                                        balance: walletUser.availableBalance,
                                        amount: data.amount,
                                        actualAmount: data.amount,
                                        commission: 0,
                                        description: "Payment Settled",
                                        referenceCode: req.params.paymentRequestId
                                    }).then(history => {
                                        messageBody = "ALERT!! Amount Credited (Settlement of Payment Request:" + req.user.phone + ")" + "\r\nAC NAME: " + sender.firstName + " " + sender.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + data.amount + "\r\nBAL: NGN " + walletUser.availableBalance;
                                        SendSMS.sendSMS(messageBody, sender.phone, sender);
                                        Notification.storeNew("You have a credit transaction of NGN " + data.amount, messageBody, "CR", sender._id, history._id);

                                        messageBody = "Payment Request has been Settled by " + sender.phone;
                                        SendSMS.sendSMS(messageBody, data.phone, sender);
                                    });
                                })
                            });
                            return null;

                        });
                        return null;
                    });

                    data.paymentStatus = "paid";
                    data.save().then(() => {
                        Response.message = "Payment request of NGN " + data.amount + " has been settled against " + sender.firstName + " " + sender.lastName + "(" + data.phone + ")";
                        res.send(Response);
                        return null;
                    })
                    return null;
                });
                return null;
            });
            return null;
        });
        return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function rejectPaymentRequest(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        PaymentRequest.findOne({ _id: req.params.paymentRequestId, paymentStatus: "unpaid" }).then(data => { // recievedBy:req.user._id
            if (!data) {
                var err = new APIError("Payment Request not valid", httpStatus.BAD_REQUEST);
                return next(err);
            }


            var body = "Hello, " + req.user.firstName + " " + req.user.lastName + " rejected your Payment Request of " + data.amount + " Naira on WayaPayChat. \r\nDATE: " + new Date().toGMTString();

            User.findOne({ _id: data.sentBy }).then(user => {
                SendSMS.sendSMS(body, user.phone, user);
            })

            data.paymentStatus = "rejected";
            data.save().then(() => {
                Response.message = "Payment request of NGN " + data.amount + " has been rejected";
                res.send(Response);
                return null;
            })

        });
        return null;
    });

}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function retrievePaymentOTP(req, res, next) {

    var Response = { ..._Response };

    UserTemp.store(req, res, next).then(data => {

        OTPService.sendNonWayaOTP(req, res, next).then(otpsent => {
            Response.message = 'OTP sent to Requested phone';
            res.send(Response);
            return null;
        });
        return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function retrievePayment(req, res, next) {
    var Response = { ..._Response };
    var messageBody;

    req.body.amount = parseFloat(req.body.amount);

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        OTP.findOne({ phone: req.body.phone, isActive: true, otp: req.body.otp }).then(otp => {

            if (!otp) {
                var err = new APIError("Invalid Otp", httpStatus.BAD_REQUEST);
                return next(err);
            }

            UserTempModal.findOne({ phone: req.body.phone, isActive: true }).then(data => { // recievedBy:req.user._id
                if (!data) {
                    var err = new APIError("No User Exists", httpStatus.BAD_REQUEST);
                    return next(err);
                }


                var deduct = req.body.amount;

                UserWallet.findOne({ userId: data._id }).then(wallet => {
                    if (wallet.availableBalance < deduct) {
                        var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                        return next(err);
                    }
                    wallet.availableBalance = wallet.availableBalance - deduct;
                    wallet.save().then(updatedWallet => {
                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId: null,
                            senderDetail: {
                                name: req.user.firstName + " " + req.user.lastName,
                                phone: req.user.phone,
                                _id: req.user._id,
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: deduct,
                            actualAmount: req.body.amount,
                            commission: 0,
                            description: "Payment Sent to user via Payment Retrieval",
                            referenceCode: req.body.phone
                        })

                        // Commission.create({
                        //     walletId: wallet._id,
                        //     type: 'debit',
                        //     userId: wallet.userId,
                        //     amount: config.interswitch.commission,
                        //     description: "Commission charge for payment request settlement",
                        //     referenceCode: req.body.phone
                        // });

                        UserWallet.findOne({ userId: req.user._id }).then(walletUser => {
                            walletUser.availableBalance = walletUser.availableBalance + req.body.amount;
                            walletUser.save().then(updatedWalletUser => {
                                UserWalletHistory.create({
                                    walletId: walletUser._id,
                                    userId: walletUser.userId,
                                    chatId: null,
                                    senderDetail: {
                                        name: data.firstName + " " + data.lastName,
                                        phone: data.phone,
                                        _id: data._id,
                                    },
                                    type: 'credit',
                                    balance: walletUser.availableBalance,
                                    amount: req.body.amount,
                                    actualAmount: req.body.amount,
                                    commission: 0,
                                    description: "Payment Retrieved",
                                    referenceCode: req.body.phone
                                }).then(history => {
                                    messageBody = "ALERT!! Amount Credited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + walletUser.availableBalance;
                                    SendSMS.sendSMS(messageBody, req.user.phone, req.user);

                                    Notification.storeNew("You have a credit transaction of NGN " + req.body.amount, messageBody, "CR", req.user._id, history._id);
                                });
                            })
                        });

                        SendSMS.sendSMS('Hello there, ' + data.phone + ' retrieved NGN ' + req.body.amount + ' sent to you on WayaPayChat. Download WayaPayChat to get your own Wallet. for Android: https://play.google.com/store/apps/details?id=com.wayapaychat OR IOS: https://apps.apple.com/us/app/id1480642853', data.phone, req.user);

                        Response.message = "Payment request of NGN " + req.body.amount + " has been retrieved (" + data.phone + ")";
                        res.send(Response);
                        return null;

                    });
                    return null;
                });
                return null;
            });
            return null;
        });

    })

}

module.exports = {
    index,
    getPaymentRequestId,
    store,
    settlePaymentRequest,
    rejectPaymentRequest,
    storeNonWaya,
    settlePaymentRequestNonWaya,
    retrievePayment,
    retrievePaymentOTP
};
