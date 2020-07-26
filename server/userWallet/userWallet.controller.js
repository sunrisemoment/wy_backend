
var Global = require('../helpers/global');
const request = require('request');
var bcrypt = require('bcryptjs');
var config = require('../../config/config');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var _Response = require('../helpers/Response');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var BankAccounts = require('../bankAccounts/bankAccounts.model');
var Commission = require('../commission/commission.model');
var Cards = require('../card/card.model');
var uniqid = require('uniqid');
var SendSMS = require('../otp/otp.controller');
var Notification = require('../notifications/notifications.controller');

var UserService = require('../user/user.service');

function index(req, res, next) {
    var Response = { ..._Response };
    UserWalletHistory.walletInfo({ userId: req.user._id }).then(data => {
        Response.data = data;
        Response.message = 'Wallet Transactions';
        res.send(Response);
        return null;
    })
}


function topUpWalletViaCard(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {
        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }
        Cards.findOne({ _id: req.body.cardId, userId: req.user._id, isActive: true }).then(card => {
          console.log(req.body, 'req.body');
          console.log(card, 'card');

            if (!card) {
                var err = new APIError("Invalid Card", httpStatus.BAD_REQUEST);
                return next(err);
            }

            let cardObj = {
                email: card.card.customer.email,
                amount: parseFloat(req.body.amount) * 100,
                authorization_code: card.card.authorization.authorization_code,
                pin: req.body.pin
            };

            var clientServerOptions = {
                uri: config.paystack.url + 'transaction/charge_authorization',
                body: JSON.stringify(cardObj),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.paystack.skeyDev}`
                }
            }

            request(clientServerOptions, function (error, response) {

                if (response.statusCode != httpStatus.OK) {
                    var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                }

                var _body = JSON.parse(response.body).data;

                if (_body.status == "success") {
                    UserWallet.findOne({ userId: req.user._id }).then(wallet => {
                        wallet.availableBalance = wallet.availableBalance + req.body.amount;
                        wallet.save().then(walletUpdate => {
                            UserWalletHistory.create({
                                walletId: wallet._id,
                                userId: wallet.userId,
                                chatId:null,
                                senderDetail: {
                                },
                                type: 'credit',
                                channel: "Paystack",
                                balance: wallet.availableBalance,
                                amount: req.body.amount,
                                actualAmount: req.body.amount,
                                commission: config.interswitch.commission,
                                description: "Wallet Topup via Bank Card",
                                referenceCode: _body.reference
                            }).then(history=>{
                                var messageBody = "ALERT!! Amount Credited (Wallet Topup via Bank Card)" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDESC: " + history.description + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                                SendSMS.sendTxnAlert("Wallet Topup via Bank Card", req.user.phone, req.user);
                                Notification.storeNew("You have a debit transaction of NGN "+req.body.amount,messageBody,"CR", req.user._id, history._id);
                            });


                            Response.message = "Successfully TopUp Wallet";
                            res.send(Response);
                            return null;
                        })
                        return null;
                    })
                } else {
                    var err = new APIError("Topup Wallet Failed ", httpStatus.BAD_REQUEST);
                    return next(err);
                }

            });
            return null;
        })
        return null;
    })
}

function topUpWalletViaBank(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {
        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }
        BankAccounts.findOne({ _id: req.body.bankId, userId: req.user._id, isActive: true }).then(bank => {

            if (!bank) {
                var err = new APIError("Invalid Bank", httpStatus.BAD_REQUEST);
                return next(err);
            }

            let cardObj = {
                email: req.user.email,
                amount: parseFloat(req.body.amount) * 100,
                bank: {
                    code: bank.code,
                    account_number: bank.account
                },
                birthday: bank.birthday
            };

            var clientServerOptions = {
                uri: config.paystack.url + 'charge',
                body: JSON.stringify(cardObj),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.paystack.skeyDev}`
                }
            }

            request(clientServerOptions, function (error, response) {

                if (response.statusCode != httpStatus.OK) {
                    var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                }

                Response.data = JSON.parse(response.body).data;
                res.send(Response);
                return null;

            });
            return null;
        })
        return null;
    })
}

function topUpWalletViaBankVerify(req, res, next) {
    var Response = { ..._Response };

    _body.amount = parseFloat(_body.amount);

    let cardObj = {
        otp: req.body.otp,
        reference: req.body.reference,
    };

    var clientServerOptions = {
        uri: config.paystack.url + 'charge/submit_otp',
        body: JSON.stringify(cardObj),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.paystack.skeyDev}`
        }
    }

    request(clientServerOptions, function (error, response) {

        if (response.statusCode != httpStatus.OK) {
            var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
            return next(err);
        }

        request(clientServerOptions, function (error, response) {

            if (response.statusCode != httpStatus.OK) {
                var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            }

            var _body = JSON.parse(response.body).data;

            if (_body.status == "success") {

                var amount = (_body.amount)/100;

                UserWallet.findOne({ userId: req.user._id }).then(wallet => {
                    wallet.availableBalance = wallet.availableBalance + amount;
                    wallet.save().then(walletUpdate => {
                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId:null,
                            senderDetail: {
                            },
                            type: 'credit',
                            channel: "Paystack",
                            balance: wallet.availableBalance,
                            amount: amount,
                            actualAmount: amount,
                            commission: config.interswitch.commission,
                            description: "Wallet Topup via Bank Account",
                            referenceCode: _body.reference
                        }).then(history=>{
                            var messageBody = "ALERT!! Amount Credited (Wallet Topup via Bank Account)" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDESC: " + history.description + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + amount + "\r\nBAL: NGN " + wallet.availableBalance;
                            SendSMS.sendTxnAlert("Wallet Topup via Bank Account", req.user.phone, req.user);
                            Notification.storeNew("You have a debit transaction of NGN "+amount,messageBody,"CR", req.user._id, history._id);
                        });


                        Response.message = "Successfully TopUp Wallet";
                        res.send(Response);
                        return null;
                    })
                    return null;
                })
            } else {
                var err = new APIError("Topup Wallet Failed ", httpStatus.BAD_REQUEST);
                return next(err);
            }
            return null;

        });

        return null;

    });

}

function withdraw(req, res, next) {
    var Response = { ..._Response };
    var deduct = req.body.amount + config.interswitch.commission;

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {
        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        BankAccounts.findOne({ _id: req.body.bankId, userId: req.user._id, isActive: true }).then(bank => {
            if (!bank) {
                var err = new APIError("Invalid Bank", httpStatus.BAD_REQUEST);
                return next(err);
            }

            let cardObj = {
                type: req.body.otp,
                name: req.body.reference,
                account_number: bank.account,
                bank_code: bank.code,
                currency: "NGN",
                description: req.user.firstName + " " + req.user.lastName + " withdrawal setup",
                metadata: {
                    system_id: req.user._id,
                    email: req.user.email,
                    phone: req.user.phone
                }
            };

            var clientServerOptions = {
                uri: config.paystack.url + 'transferrecipient',
                body: JSON.stringify(cardObj),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.paystack.skeyDev}`
                }
            }

            request(clientServerOptions, function (error, response) {

                if (error) {
                    var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                }

                if(JSON.parse(response.body).status==false){
                    var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                }


                var transferrecipient = JSON.parse(response.body).data;
                var reference = uniqid();

                let initiate = {
                    source: "balance",
                    amount: parseFloat(req.body.amount) * 100,
                    currency: transferrecipient.currency,
                    reason: "WayaPayChat withdrawal",
                    recipient: transferrecipient.recipient_code,
                    reference: reference,
                };

                var clientServerOptions2 = {
                    uri: config.paystack.url + 'transfer',
                    body: JSON.stringify(initiate),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.paystack.skeyDev}`
                    }
                }

                request(clientServerOptions2, function (error, response) {

                    if (error) {
                        var err = new APIError(JSON.parse(response.body).message || "Something went wrong", httpStatus.BAD_REQUEST);
                        return next(err);
                    }

                    UserWallet.findOne({userId:req.user._id}).then(wallet=>{
                        if (wallet.availableBalance < deduct) {
                            var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                            return next(err);
                        }
                        wallet.availableBalance = wallet.availableBalance - deduct;
                        wallet.clearedBalance = wallet.clearedBalance + deduct;
                        wallet.save().then(wallet=>{
                            UserWalletHistory.create({
                                walletId: wallet._id,
                                userId: wallet.userId,
                                chatId:null,
                                senderDetail: {
                                },
                                type: 'debit',
                                channel: "Wayapay",
                                balance: wallet.availableBalance,
                                amount: deduct,
                                actualAmount: req.body.amount,
                                commission: config.interswitch.commission,
                                description: "Wallet Withdrawal",
                                referenceCode: reference
                            }).then(history=>{
                                var messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                                SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                                Notification.storeNew("You have a debit transaction of NGN "+req.body.amount,messageBody,"DB", req.user._id, history._id);

                                UserWalletHistory.create({
                                    walletId: wallet._id,
                                    userId: wallet.userId,
                                    chatId: null,
                                    senderDetail: {
                                    },
                                    type: 'debit',
                                    balance: wallet.availableBalance,
                                    amount: config.interswitch.commission,
                                    actualAmount: config.interswitch.commission,
                                    commission: 0,
                                    description: "Wallet withdrawal",
                                    referenceCode: history._id
                                });

                                UserService.merchantCommission(wallet.userId);
                            });

                            Commission.create({
                                walletId: wallet._id,
                                type : 'debit',
                                userId: wallet.userId,
                                amount: config.interswitch.commission,
                                description: "Commission charge for withdrawal"
                            })



                        })
                    })

                    Response.message = "Wallet Withdrawal";
                    res.send(Response);
                    return null;
                });
                return null;
            });

        });
        return null;
    });
}

module.exports = {
    index,
    topUpWalletViaCard,
    topUpWalletViaBank,
    topUpWalletViaBankVerify,
    withdraw
};
