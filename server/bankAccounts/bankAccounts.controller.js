var Global = require('../helpers/global');
var bcrypt = require('bcryptjs');
var config = require('../../config/config');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
const request = require('request');

var Notification = require('../notifications/notifications.controller');
var BankAccounts = require('./bankAccounts.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var BankAccounts = require('../bankAccounts/bankAccounts.model');
var Commission = require('../commission/commission.model');
var uniqid = require('uniqid');
var SendSMS = require('../otp/otp.controller');
var Notification = require('../notifications/notifications.controller');


var PayStack = require('paystack-node');
const paystack = new PayStack(config.paystack.skeyDev, process.env.NODE_ENV);

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };
    BankAccounts.find({ userId: req.user._id, isActive: true }).then((data) => {
        Response.data = data;
        Response.message = 'BankAccount';
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
function submitPin(req, res, next) {
    var Response = { ..._Response };

    let cardObj = {
        pin: req.body.pin,
        reference: req.body.reference,
    };

    var clientServerOptions = {
        uri: config.paystack.url + 'charge/submit_pin',
        body: JSON.stringify(cardObj),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.paystack.skeyDev}`
        }
    }

    request(clientServerOptions, function (error, response) {

        if (response.statusCode != httpStatus.OK) {
            var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
            return next(err);
        }

        Response.data = JSON.parse(response.body).data;
        res.send(Response);
        return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function acceptableBanks(req, res, next) {
    var Response = { ..._Response };

    var clientServerOptions = {
        uri: config.paystack.url + 'bank?gateway=emandate&pay_with_bank=true',
        method: 'GET',
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
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function banks(req, res, next) {
  var Response = { ..._Response };

  var clientServerOptions = {
      uri: config.paystack.url + 'bank?perPage=10000&page=1&currency=NGN',
      method: 'GET',
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
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function getAccountDetailsViaPaystack(req, res, next) {
    var Response = { ..._Response };

    let json = {
        accountnumber: req.body.accountnumber,
        bankcode: req.body.bankcode
    };

    var clientServerOptions = {
        uri: config.paystack.url + '/bank/resolve?account_number='+json.accountnumber+'&bank_code='+json.bankcode,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.paystack.skeyDev}`
        }
    }

    request(clientServerOptions, function (error, response) {

        var _body = JSON.parse(response.body);

        if (_body.status==false) {
            var err = new APIError(_body.message, httpStatus.BAD_REQUEST);
            return next(err);
        }

        Response.message = "Account Info";
        Response.data = _body.data;


        res.send(Response);
        return null;
    });
}


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function banksRubies(req, res, next) {
    var Response = { ..._Response };

    var clientServerOptions = {
        uri: config.rubie.url + 'banklist',
        method: 'POST',
        body: JSON.stringify({ "request": "banklist" }),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${config.rubie.key}`
        }
    }

    console.log(clientServerOptions);

    request(clientServerOptions, function (error, response) {

        var _body = JSON.parse(response.body);
        console.log(_body);
        if (_body.responsecode != "00") {
            Response.message = _body.message;
            Response.data = [];
        } else {
            Response.message = "Rubies Bank List";
            Response.data = _body.banklist;
        }

        res.send(Response);
        return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function getAccountDetailsViaRubie(req, res, next) {
    var Response = { ..._Response };

    let json = {
        accountnumber: req.body.accountnumber,
        bankcode: req.body.bankcode
    };

    var clientServerOptions = {
        uri: config.rubie.url + 'nameenquiry',
        method: 'POST',
        body: JSON.stringify(json),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${config.rubie.key}`
        }
    }

    request(clientServerOptions, function (error, response) {

        var _body = JSON.parse(response.body);
        console.log(_body);
        if (_body.responsecode != "00") {
            var err = new APIError(_body.responsemessage, httpStatus.BAD_REQUEST);
            return next(err);
        }
        Response.message = "Rubies Account Info";
        Response.data = _body;


        res.send(Response);
        return null;
    });
}

function fundTransferViaRubie(req, res, next) {
    var Response = { ..._Response };

    req.body.amount = parseFloat(req.body.amount);

    var deduct = req.body.amount + config.rubie.commission;

    if(req.body.amount<1000){
        var err = new APIError('amount must be more than or equal to 1000', httpStatus.UNPROCESSABLE_ENTITY);
        return next(err);
    }

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {
        if (!match) {
            var err = new APIError('Incorrect current password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        UserWallet.findOne({ userId: req.user._id }).then(wallet => {
            if (wallet.availableBalance < deduct) {
                var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            let fundtransfer = {
                reference: uniqid(),
                amount: req.body.amount,
                narration: 'WAYA Pay Withdrawal',
                craccountname: req.user.firstName + " " + req.user.lastName,
                bankname: req.body.bankName,
                draccountname: 'WayaPayChat',
                craccount: req.body.accountnumber,
                bankcode: req.body.bankcode
            };

            console.log(fundtransfer);

            var clientServerOptions = {
                uri: config.rubie.url + 'fundtransfer',
                body: JSON.stringify(fundtransfer),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${config.rubie.key}`
                }
            }

            request(clientServerOptions, function (error, response) {

                var _body = JSON.parse(response.body);

                if (_body.responsecode != "00") {
                    var err = new APIError(_body.responsemessage, httpStatus.BAD_REQUEST);
                    return next(err);
                }

                wallet.availableBalance = wallet.availableBalance - deduct;
                wallet.clearedBalance = wallet.clearedBalance + deduct;
                wallet.save().then(wallet => {

                    UserWalletHistory.create({
                        walletId: wallet._id,
                        userId: wallet.userId,
                        chatId: null,
                        senderDetail: {
                        },
                        type: 'debit',
                        channel: "Rubies",
                        balance: wallet.availableBalance,
                        amount: deduct,
                        actualAmount: req.body.amount,
                        commission: config.rubie.commission,
                        description: "Wallet Withdrawal",
                        referenceCode: _body.reference
                    }).then(history => {
                        var messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                        SendSMS.sendSMS(messageBody, req.user.phone, req.user);
                        Notification.storeNew("You have a debit transaction of NGN " + req.body.amount, messageBody, "DB", req.user._id, history._id);

                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId: null,
                            senderDetail: {
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: config.rubie.commission,
                            actualAmount: config.rubie.commission,
                            commission: 0,
                            description: "Wallet withdrawal",
                            referenceCode: history._id
                        });
                    });

                    Commission.create({
                        walletId: wallet._id,
                        type: 'debit',
                        userId: wallet.userId,
                        amount: config.rubie.commission,
                        description: "Commission charge for withdrawal"
                    }).then(history => {

                    })

                })

                Response.message = "Rubies Account Info";
                Response.data = _body;


                res.send(Response);
                return null;
            })

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
function chargeBank(req, res, next) {
    var Response = { ..._Response };

    if (!req.user.email) {
        var err = new APIError("Register email id via profile", httpStatus.BAD_REQUEST);
        return next(err);
    }

    bcrypt.compare(req.body.password, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        let cardObj = {
            email: req.user.email,
            amount: 100,//1 NGN
            bank: {
                account_number: req.body.account,
                code: req.body.code,
            },
            birthday: req.body.birthday

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


        let bankAccounts = new BankAccounts({
            userId: req.user._id,
            bankName: req.body.bankName,
            account: req.body.account,
            code: req.body.code
        });

        BankAccounts.findOne({ userId: req.user._id,account: req.body.account, isActive: true }).then(acc => {
            if (acc) {
                var err = new APIError("Bank account already exists.", httpStatus.BAD_REQUEST);
                return next(err);
            }

            bankAccounts.save()
                .then((data) => {


                    BankAccounts.findId(data._id).then((account) => {
                        Response.data = account;
                        Response.message = 'BankAccounts Created';
                        res.send(Response);
                        return null;
                    })
                    return null;
                })
            return null;
        })
            .catch((e) => {
                next(e);
            });
        return null;

        // request(clientServerOptions, function (error, response) {

        //     if (response.statusCode != httpStatus.OK) {
        //         console.log(JSON.parse(response.body).data);
        //         var err = new APIError("Something went wrong", httpStatus.BAD_REQUEST);
        //         return next(err);
        //     }


        // });
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function chargeBankVerify(req, res, next) {
    var Response = { ..._Response };

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
            var body = JSON.parse(response.body);
            if (body.data.message) {
                var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            } else {
                var err = new APIError(JSON.parse(response.body).data || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            }
        }

        request(clientServerOptions, function (error, response) {

            if (response.statusCode != httpStatus.OK) {
                var body = JSON.parse(response.body);
                if (body.data.message) {
                    var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                } else {
                    var err = new APIError(JSON.parse(response.body).data || "Something went wrong", httpStatus.BAD_REQUEST);
                    return next(err);
                }
            }

            let bankAccounts = new BankAccounts({
                userId: req.user._id,
                account: req.body.account,
                code: req.body.code,
                birthday: req.body.birthday,
                bank: JSON.parse(response.body).data,
            });

            bankAccounts.save()
                .then((data) => {
                    BankAccounts.findId(data._id).then((account) => {
                        Response.data = account;
                        Response.message = 'BankAccounts Created';
                        res.send(Response);
                        return null;
                    })
                    return null;
                })
                .catch((e) => {
                    next(e);
                });
        });

    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function update(req, res, next) {
    var Response = { ..._Response };
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function destroy(req, res, next) {
    var Response = { ..._Response };

    bcrypt.compare(req.headers.x_auth, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError('Incorrect password!', httpStatus.BAD_REQUEST);
            return next(err);
        }

        BankAccounts.findAndUpdate(req.params.accountId, { isActive: false })
            .then((data) => {
                Response.data = null;
                if (!data) {
                    Response.message = 'BankAccount Already Deleted';
                    res.send(Response);
                    return null;
                } else {
                    Response.message = 'BankAccount  Deleted';
                    res.send(Response);
                    return null;
                }
            })
            .catch((e) => {
                next(e);
            });
    });
}

/**
 *
 * @param {*} name
 * @param {*} amount
 * @param {*} updateduser
 */
function virtualAccount(name, amount = 0, updateduser) {

    var Response = { ..._Response };

    let cardObj = {
        virtualaccountname: name,
        amount: amount,
        amountcontrol: 'VARIABLEAMOUNT',
        daysactive: '100000',
        minutesactive: '30',
        callbackurl: config.appURL + "api/bankAccounts/rubies/service"
    };

    var clientServerOptions = {
        uri: config.rubie.url + 'createvirtualaccount',
        body: JSON.stringify(cardObj),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${config.rubie.key}`
        }
    }

    request(clientServerOptions, function (error, response) {
        if (response.statusCode == httpStatus.OK) {
            var virtualAccount = JSON.parse(response.body);

            updateduser.virtualAccount = virtualAccount;
            updateduser.save().then(va => {
                if (va) {
                    Notification.storeNew("Your virtual account has been created via Rubie", "Virtual Account: " + virtualAccount.virtualaccount + "\nBank Name: " + virtualAccount.bankname, "OTHER", updateduser._id, updateduser._id);
                }
            });
        }
    })
}

module.exports = {
    index,
    chargeBank,
    chargeBankVerify,
    update,
    destroy,
    banks,
    acceptableBanks,
    banksRubies,
    virtualAccount,
    getAccountDetailsViaRubie,
    fundTransferViaRubie,
    getAccountDetailsViaPaystack
};
