var _Response = require('../helpers/Response');
var config = require('../../config/config');
var User = require('../user/user.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var Notification = require('../notifications/notifications.controller');
var SendSMS = require('../otp/otp.controller');
const request = require('request');
var BankAccounts = require('./bankAccounts.model');

var Audit = require('../auditinfo/auditinfo.controller');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function __callback(req, res, next) {

    var Response = { ..._Response };

    // {
    //     "originatoraccountnumber": "0012226121",
    //     "amount": "100.00",
    //     "originatorname": "OLAKUNLE TEMITOPE",
    //     "service": "000069900",
    //     "narration": "Test",
    //     "craccountname": "RUBYPAY-IFEANYI TECH",
    //     "paymentreference": "000013200418105131000007931390",
    //     "sessionid": "000013200418105131000007931390",
    //     "bankname": "GTBank",
    //     "craccount": "4460888748",
    //     "bankcode": "000013"
    // }

    req.body.amount = parseFloat(req.body.amount);

    Audit.info(config.admin.userId, null, Audit.dbActions.rubie, req.body);

    User.findOne({ "virtualAccount.virtualaccount": req.body.craccount }).then(user => {
        if (!user) {
            var err = new APIError("Invalid User", httpStatus.BAD_REQUEST);
            return next(err);
        }

        Audit.info(user._id, null, Audit.dbActions.rubie, req.body);

        UserWallet.findOne({ userId: user._id }).then(wallet => {
            wallet.availableBalance = wallet.availableBalance + parseFloat(req.body.amount);
            wallet.save().then(wallet => {
                UserWalletHistory.create({
                    walletId: wallet._id,
                    userId: wallet.userId,
                    chatId: null,
                    senderDetail: {
                    },
                    type: 'credit',
                    channel: "Rubies Bank",
                    balance: wallet.availableBalance,
                    amount: req.body.amount,
                    actualAmount: req.body.amount,
                    commission: 0,
                    description: "Wallet Topup via Bank Transfer",
                    referenceCode: req.body.phone
                }).then(history => {
                    var messageBody = "ALERT!! Amount Credited" + "\r\nAC NAME: " + user.firstName + " " + user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + req.body.amount + "\r\nBAL: NGN " + wallet.availableBalance;
                    SendSMS.sendSMS(messageBody, user.phone, user);
                    Notification.storeNew("You have a credit transaction of NGN " + req.body.amount, messageBody, "CR", user._id, history._id);
                });


                Response.message = "Wallet Topup via Bank Transfer";
                res.send(Response);
                return null;
            })
            return null;
        })
        return null;
    })

}

/**
 *
 */
function __allowedBanks(__isCallback) {

    if(!__isCallback){return;}

    var clientServerOptions = {
        uri: config.paystack.url + 'bank?gateway=emandate&pay_with_bank=true',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    }

    request(clientServerOptions, function (error, response) {

      // console.log(response, 'response');
      if(response && response.body){

        var _body = JSON.parse(response.body);

        if (_body.status == true) {
            _body.data.forEach(element => {
                BankAccounts.update({ code: element.code }, { $set: { isChargeable: true } }, { multi: true }, (err, data) => { return null });
            });

        }

        return null;
      }
    });
}

module.exports = {
    __callback,
    __allowedBanks
};
