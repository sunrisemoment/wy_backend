var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var QUICKTELLER = require('./quickteller.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var Commission = require('../commission/commission.model');
var SendSMS = require('../otp/otp.controller');
var uniqid = require('uniqid');
var config = require('../../config/config');
var Notification = require('../notifications/notifications.controller');

var Interswitch = require('interswitch');
var clientId = config.interswitch.clientId; // Get your Client ID from https://developer.interswitchng.com
var secret = config.interswitch.clientSecret; // Get your Client Secret from https://developer.interswitchng.com
var ENV = config.interswitch.env; // SANDBOX or PRODUCTION
var interswitch = new Interswitch(clientId, secret, ENV);


var id = uniqid();// you can use any uuid library of your choice

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };

}


function billers(req, res, next) {
    var Response = { ..._Response };
    const logoBaseURl = 'https://quickteller.sandbox.interswitchng.com/Content/Images/Downloaded/';
    var obj = {
        url: "api/v2/quickteller/billers",
        method: "GET",
        httpHeaders: { "Content-Type": "application/json" }
    };

    //send the actual request
    interswitch.send(obj, function (err, response, body) {
        if (err) {
            //error
            var err = new APIError('Something went wrong fetching billers!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        } else {
            //success
            data = JSON.parse(body);
            for(let i = 0; i < data.billers.length; i++){
              data.billers[i]['logoUrl'] = logoBaseURl + data.billers[i]['logoUrl'];
            };
            Response.data = data;
            res.send(Response);
            return null;
        }
    });
}

function categorys(req, res, next) {
    var Response = { ..._Response };
    var obj = {
        url: "api/v2/quickteller/categorys",
        method: "GET",
        httpHeaders: { "Content-Type": "application/json" }
    };

    //send the actual request
    interswitch.send(obj, function (err, response, body) {
        if (err) {
            //error
            var err = new APIError('Something went wrong fetching categories!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        } else {
            //success
            Response.data = JSON.parse(body);
            res.send(Response);
            return null;
        }
    });
}


function billerByCategoryId(req, res, next) {
    var Response = { ..._Response };
    var obj = {
        url: "api/v2/quickteller/categorys/" + req.params.categoryId + "/billers",
        method: "GET",
        httpHeaders: { "Content-Type": "application/json" }
    };

    //send the actual request
    interswitch.send(obj, function (err, response, body) {
        if (err) {
            //error
            var err = new APIError('Something went wrong fetching categorys!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        } else {

            //success
            Response.data = JSON.parse(body);
            res.send(Response);
            return null;
        }
    });
}

function paymentItemsByBillerId(req, res, next) {
    var Response = { ..._Response };
    var obj = {
        url: "api/v2/quickteller/billers/" + req.params.billerId + "/paymentitems",
        method: "GET",
        httpHeaders: { "Content-Type": "application/json" }
    };

    //send the actual request
    interswitch.send(obj, function (err, response, body) {
        if (err) {
            //error
            var err = new APIError('Something went wrong fetching categorys!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        } else {
            var _body = JSON.parse(body);
            if (_body.hasOwnProperty("errors") || _body.hasOwnProperty("error")) {
                var err = new APIError(_body.error.message, httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }
            //success
            Response.data = _body;
            res.send(Response);
            return null;
        }
    });
}


function customerValidations(req, res, next) {
    var Response = { ..._Response };

    var requestData = {
        customers: [
            {
                customerId: req.body.customerId,
                paymentCode: req.body.paymentCode
            }
        ]
    };



    var obj = {
        url: "api/v2/quickteller/customers/validations",
        method: "POST",
        requestData: requestData,
        httpHeaders: { "Content-Type": "application/json" }
    };

    //send the actual request
    interswitch.send(obj, function (err, response, body) {
        if (err) {
            //error
            var err = new APIError('Something went wrong while validating!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        } else {
            var _body = JSON.parse(body);
            if (_body.hasOwnProperty("errors") || _body.hasOwnProperty("error")) {
                var err = new APIError(_body.error.message, httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }
            if (_body.Customers.length > 0) {
                if (_body.Customers[0].responseCode != "90000") {
                    var err = new APIError(_body.Customers[0].responseDescription, httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }
            }
            //success
            Response.data = _body;
            res.send(Response);
            return null;
        }
    });
}


function sendPaymentAdvices(req, res, next) {
    var Response = { ..._Response };

    // req.body.amount = parseFloat(req.body.amount);

    var totalAmount = req.body.amount;
    var amountArr = totalAmount.split(".");
    var amount = amountArr.join("");
    amount = amount.replace(/,/g, '');
    var checkAmount = amount / 100;

    var requestData = {
        terminalId: config.interswitch.terminalId,
        customerId: req.body.customerId,
        paymentCode: req.body.paymentCode,
        customerMobile: req.user.phone,
        customerEmail: req.user.email,
        amount: amount,
        requestReference: config.interswitch.prefix + new Date().getTime(),
    };

    console.log(requestData, 'requestData requestData requestData requestData');

    UserWallet.findOne({ userId: req.user._id }).then(wallet => {
        if (wallet.availableBalance < checkAmount) {
            var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }

        var obj = {
            url: "api/v2/quickteller/payments/advices",
            method: "POST",
            requestData: requestData,
            httpHeaders: { "Content-Type": "application/json" }
        };

        //send the actual request
        interswitch.send(obj, function (err, response, body) {
            if (err) {
              console.log(err, 'error');
                //error
                var err = new APIError('Something went wrong!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            } else {


                var _body = JSON.parse(body);
                console.log(_body, '_body');
                if (_body.hasOwnProperty("errors") || _body.hasOwnProperty("error")) {
                    var err = new APIError(_body.error.message, httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }


                console.log(wallet.availableBalance, 'wallet.availableBalance1111');
                console.log(wallet.clearedBalance, 'wallet.clearedBalance1111');
                console.log(checkAmount, 'checkAmount');
                console.log(checkAmount + config.interswitch.commission, 'checkAmount + config.interswitch.commission');

                if (wallet.availableBalance >= checkAmount) {
                    wallet.clearedBalance += checkAmount;
                    wallet.availableBalance -= (checkAmount + config.interswitch.commission);

                    console.log(wallet.availableBalance, 'wallet.availableBalance22222');
                    console.log(wallet.clearedBalance, 'wallet.clearedBalance2222222');

                    wallet.save().then(updatedWallet => {
                        var description = "Recharge with quickteller (" + req.body.customerId + ") with " + checkAmount;

                        UserWalletHistory.create({
                            walletId: wallet._id,
                            userId: wallet.userId,
                            chatId:null,
                            senderDetail: {
                            },
                            type: 'debit',
                            balance: wallet.availableBalance,
                            amount: checkAmount,
                            actualAmount: amount,
                            commission: config.interswitch.commission,
                            description: description,
                            referenceCode: requestData.requestReference
                        }).then(history=>{
                            var messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + req.user.firstName + " " + req.user.lastName + "\r\nDESC: " + description + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + checkAmount + "\r\nBAL: NGN " + wallet.availableBalance;
                            SendSMS.sendTxnAlert(messageBody, req.user.phone, req);
                            Notification.storeNew("You have a debit transaction of NGN "+checkAmount, messageBody, "DB", req.user._id, history._id);

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
                                description: "Commission charge for payment Quickteller account",
                                referenceCode: history._id
                            });
                        });

                        Commission.create({
                            walletId: wallet._id,
                            type: 'debit',
                            userId: wallet.userId,
                            amount: config.interswitch.commission,
                            description: "Commission charged for recharging with Quickteller account ",
                            referenceCode: requestData.requestReference
                        })



                        //success
                        Response.data = JSON.parse(body);
                        Response.message = "Bill payment advice";
                        res.send(Response);
                        return null;

                    });
                    return null;
                } else {
                    var err = new APIError('insufficient wallet balance!', httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }
            }
        });
        return null;
    })
    return null;


}


module.exports = {
    index,
    billers,
    categorys,
    billerByCategoryId,
    paymentItemsByBillerId,
    customerValidations,
    sendPaymentAdvices
};
