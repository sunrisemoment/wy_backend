
var Global = require('../helpers/global');
const request = require('request');
var bcrypt = require('bcryptjs');
var config = require('../../config/config');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var _Response = require('../helpers/Response');
var User = require('../user/user.model');
var OTP = require('../otp/otp.model');
var UserWallet = require('../userWallet/userWallet.model');
var UserWalletHistory = require('../walletHistory/walletHistory.model');
var BankAccounts = require('../bankAccounts/bankAccounts.model');
var Commission = require('../commission/commission.model');
var Cards = require('../card/card.model');
var uniqid = require('uniqid');
var SendSMS = require('../otp/otp.controller');
var Notification = require('../notifications/notifications.controller');
var Audit = require('../auditinfo/auditinfo.controller');

var UserService = require('../user/user.service');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function ussd(req, res, next) {

    if (req.user) {
        Audit.info(req.user._id.toString(), null, Audit.dbActions.ussd, req.response);
    }

    res.type('text/plain');
    res.send(req.response);
    return null;
}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function index(req, res, next) {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////SAURABH CHHABRA///////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // **************************************************** DONT CHNAGE ANYTHING UNLESS YOU KNOW WHAT YOU ARE DOING ***************************/////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////SAURABH CHHABRA//////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var Response = { ..._Response };

    var sessionId = req.body.sessionId;
    var serviceCode = req.body.serviceCode;
    var phoneNumber = req.body.phoneNumber;
    var $text = req.body.text;

    var $cards = [];
    var $banks = [];

    if ($text == undefined) {
        req.response = "Server is not reachable";
        ussd(req, res, next);
    }

    var $input, $secondInput, $thirdInput, $fourthInput, $fifthInput, $sixthInput, $acctId, $userName, $walletBal, $res, $response = "", $is_a_user = false;

    User.authenticate(phoneNumber).then(user => {

        if (user) {
            $is_a_user = true;
            req.user = user;
        }

        if (!user) {
          req.response = "END You don't have an Account on Waya.";
          ussd(req, res, next);
          return null;
      }

        UserWallet.findOne({ userId: user._id }).then(wallet => {

            Cards.find({ userId: user._id, isActive: true }).then(cards => {
                // if (!cards) {
                //     var err = new APIError("No cards found", httpStatus.UNAUTBAD_REQUESTHORIZED);
                //     return next(err);
                // }

                cards.forEach((element, index) => {
                    var temp = {
                        number: (index + 1),
                        card_id: element._id,
                        card: element.card.authorization.bin + '*******'
                    };

                    $cards.push(temp);
                });

                BankAccounts.find({ userId: user._id, isActive: true }).then(banks => {
                    // if (!banks) {
                    //     var err = new APIError("No banks found", httpStatus.UNAUTBAD_REQUESTHORIZED);
                    //     return next(err);
                    // }

                    banks.forEach((element, index) => {
                        var temp = {
                            number: (index + 1),
                            account_id: element._id,
                            acct: element.code + ' - *****' + element.account.substring(5)
                        };

                        $banks.push(temp);
                    });


                    $input = $text.split("*");

                    console.log($input.length, '$input')
                    $secondInput = $input.length >= 2 ? $input[1] : "";
                    $thirdInput = $input.length >= 3 ? $input[2] : "";
                    $fourthInput = $input.length >= 4 ? $input[3] : "";
                    $fifthInput = $input.length >= 5 ? $input[4] : "";
                    $sixthInput = $input.length >= 6 ? $input[5] : "";

                    /*
                     - empty for first time
                     - 2*amount :Enter Amount
                     - 2*amount*bankId: Select Card
                     - 2*amount*bankId*password: Enter Password
                    */

                    switch ($text) {
                        case "":
                            $response += "CON Welcome to WayaPay! \n";
                            $response += "1. Fund your Wallet \n";
                            $response += "2. Withdraw \n";
                            $response += "3. Transfer to another wallet \n";
                            $response += "4. Check Wallet Balance \n";

                            req.response = $response;
                            ussd(req, res, next);
                            break;
                        case "1":
                            if (!$is_a_user) {
                                $response = "END You don't have an Account on Waya.";
                            } else {
                                $response += "CON Enter Amount to fund your wallet from Bank Card \n";
                            }

                            req.response = $response;
                            ussd(req, res, next);
                            break;
                        case "1*" + $secondInput:
                            $response += "CON Funding Wallet with ₦" + $secondInput + ". Enter Password \n";
                            req.response = $response;
                            ussd(req, res, next);
                            break;

                        case `1*${$secondInput}*${$thirdInput}`:

                            bcrypt.compare($thirdInput, user.password).then((match) => {

                                if (!match) {
                                    $response = "END Incorrect Password entered.";
                                } else {
                                    $response = "END Incorrect Password entered.";
                                    if ($cards.length > 0) {
                                        $response = "CON Choose Card to fund Acct with: \n";
                                        $cards.forEach(element => {
                                            $response += element['number'] + " " + element['card'] + " \n";
                                        });
                                    } else {
                                        $response = "END You don't have any Cards Saved";
                                    }
                                }
                                req.response = $response;
                                ussd(req, res, next);
                            })
                            break;
                        case `1*${$secondInput}*${$thirdInput}*${$fourthInput}`:
                            bcrypt.compare($thirdInput, user.password).then((match) => {

                                if (!match) {
                                    $response = "END Incorrect Password entered.";
                                } else {
                                    getCardId($fourthInput, $cards).then($cardId => {
                                        if (!$cardId) {
                                            $response = "END  " + $fourthInput + ". This Card can not be used!";
                                            req.response = $response;
                                            ussd(req, res, next);
                                        } else {
                                            topUpWalletViaCard(user, $cardId, $secondInput).then($res => {
                                                console.log($res);
                                                if ($res) {
                                                    $response = "END Your wallet has been successfully funded with N" + $secondInput + ".\n";
                                                    req.response = $response;
                                                    ussd(req, res, next);
                                                } else {
                                                    $response = "END  " + $cardId + ". This Card can not be used!";
                                                    req.response = $response;
                                                    ussd(req, res, next);
                                                }
                                            });
                                        }
                                    });
                                }
                            })

                            //TODO: Process Funding via card id

                            break;

                        case "2":
                            if (!$is_a_user) {
                                $response = "END You don't have an Account on Waya.";
                            } else {
                                $response += "CON Enter Amount to withdraw from wallet \n";
                            }
                            req.response = $response;
                            ussd(req, res, next);
                            break;

                        case `2*${$secondInput}`:
                            if ($banks.length > 0) {
                                $response = "CON To withdraw " + $secondInput + ", Choose Bank Acct to Withdraw from: \n";
                                $banks.forEach(element => {
                                    $response += element['number'] + " " + element['acct'] + " \n";
                                });
                            } else {
                                $response = "END You don't have any bank accounts to withdraw with";
                            }
                            req.response = $response;
                            ussd(req, res, next);
                            break;

                        case `2*${$secondInput}*${$thirdInput}`:
                            $response = "CON Enter Password: \n";
                            req.response = $response;
                            ussd(req, res, next);
                            break;

                        case `2*${$secondInput}*${$thirdInput}*${$fourthInput}`:

                            bcrypt.compare($fourthInput, user.password).then((match) => {

                                if (!match) {
                                    $response = "END Incorrect Password entered.";
                                    req.response = $response;
                                    ussd(req, res, next);
                                } else {
                                    getAccountId($thirdInput, $banks).then($acctId => {
                                        if (!$acctId) {
                                            $response = "END No Bank found.";
                                            req.response = $response;
                                            ussd(req, res, next);
                                        }
                                        withdraw(phoneNumber, $secondInput, $acctId).then($response => {
                                            req.response = $response;
                                            ussd(req, res, next);
                                        });
                                    });
                                }

                            })
                            break;

                        case "3":
                            if (!$is_a_user) {
                                $response = "END You dont have an Account on Waya.";
                            } else {
                                $response = "CON Enter Waya Password";
                            }

                            req.response = $response;
                            ussd(req, res, next);
                            break;
                        case `3*${$secondInput}`:

                            bcrypt.compare($secondInput, user.password).then((match) => {

                                if (!match) {
                                    $response = "END Incorrect Password entered.";
                                } else {
                                    $response = "CON Enter Waya User Phone Number to Transfer to: \n";
                                }

                                req.response = $response;
                                ussd(req, res, next);
                            })
                            break;

                        case `3*${$secondInput}*${$thirdInput}`:
                            if ($thirdInput.indexOf('+') == -1) {
                                $response = "END Phone number must be enter with country code +234xxxxxxx";
                                req.response = $response;
                                ussd(req, res, next);
                            } else {

                                bcrypt.compare($secondInput, user.password).then((match) => {

                                    if (!match) {
                                        $response = "END Incorrect Password entered.";
                                    } else {
                                        User.authenticate($thirdInput).then($newUser => {
                                            if (!$newUser) {
                                                $response = "END " + $thirdInput + " Does not exists on WAYA";
                                            } else {
                                                $response = "CON Enter Amount to Transfer to " + $newUser.firstName + " " + $newUser.lastName+" from you walet";
                                            }

                                            req.response = $response;
                                            ussd(req, res, next);
                                        })
                                    }
                                })
                            }

                            break;

                        case `3*${$secondInput}*${$thirdInput}*${$fourthInput}`:
                            if ($thirdInput.indexOf('+') == -1) {
                                $response = "END Phone number must be enter with country code +234xxxxxxx";
                                req.response = $response;
                                ussd(req, res, next);
                            } else {
                                bcrypt.compare($secondInput, user.password).then((match) => {

                                    if (!match) {
                                        $response = "END Incorrect Password entered.";
                                    } else {
                                        User.authenticate($thirdInput).then($newUser => {
                                            if ($newUser) {
                                                $response = "CON Confirm Transfer of N" + $fourthInput + " to " + $newUser.firstName + " " + $newUser.lastName + " \n";
                                                $response += "1. YES \n";
                                                $response += "2. NO \n";

                                                req.response = $response;
                                                ussd(req, res, next);
                                            } else {
                                                $response = "END " + $thirdInput + " Does not exists on WAYA";
                                                req.response = $response;
                                                ussd(req, res, next);
                                            }
                                        })
                                    }
                                })
                            }
                            break;
                        case `3*${$secondInput}*${$thirdInput}*${$fourthInput}*${$fifthInput}`:
                            if ($fifthInput == "2") {
                                $response = "END Transfer Cancelled";
                                req.response = $response;
                                ussd(req, res, next);
                            }
                            else if ($fifthInput == "1") {
                                if ($thirdInput.indexOf('+') == -1) {
                                    $response = "END Phone number must be enter with country code +234xxxxxxx";
                                } else {

                                    bcrypt.compare($secondInput, user.password).then((match) => {

                                        if (!match) {
                                            $response = "END Incorrect Password entered.";
                                        } else {
                                            User.authenticate($thirdInput).then($newUser => {
                                                if ($newUser) {
                                                    transferFundToWaya(user, $newUser, $fourthInput).then($response => {
                                                        req.response = "END " + $response;
                                                        ussd(req, res, next);
                                                    });
                                                } else {
                                                    $response = "END " + $thirdInput + " Does not exists on WAYA";
                                                    req.response = $response;
                                                    ussd(req, res, next);
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                            else {
                                $response = "END Not a valid inpput";
                                req.response = $response;
                                ussd(req, res, next);
                            }
                            break;

                        case "4":
                            if (!$is_a_user) {
                                $response = "END You don't have an Account on Waya.";
                            } else {
                                $walletBal = wallet.availableBalance;
                                $userName = user.firstName + " " + user.lastName
                                $response = "END Hi " + $userName + ", You Wallet balance is N " + parseFloat($walletBal).toFixed(2);
                            }

                            req.response = $response;
                            ussd(req, res, next);
                            break;

                        case "5":
                            if (!$is_a_user) {
                                $response = "END You don't have an Account on Waya.";
                            } else {

                                OTP.findOneByQuery({ phone: phoneNumber, isActive: true }).then((data) => {
                                    if (data) {
                                        $response = "END WayaPayChat: Your OTP is " + data.otp;
                                        req.response = $response;
                                        ussd(req, res, next);
                                    } else {
                                        $response = "END WayaPayChat: No OTP Found";
                                        req.response = $response;
                                        ussd(req, res, next);
                                    }
                                })
                            }
                            break;
                        default:
                            $response = "END Invalid input code.";
                            req.response = $response;
                            ussd(req, res, next);
                    }
                });
                // res.send($response);
                return null;
            })
        })
    })


}

/**
 *
 * @param {*} $val
 * @param {*} $arr
 */
function getCardId($val, $arr) {
    return new Promise(function (resolve, reject) {
        $arr.forEach(element => {
            if ($val == element['number']) {
                console.log(element['card_id'])
                resolve(element['card_id']);
                return;
            }
        });
    });
}

/**
 *
 * @param {*} $val
 * @param {*} $arr
 */
function getAccountId($val, $arr) {
    return new Promise(function (resolve, reject) {
        $arr.forEach(element => {
            if ($val == element['number']) {
                resolve(element['account_id']);
                return;
            }
        });
    });
}

/**
 *
 * @param {*} phone
 * @param {*} amount
 * @param {*} accountId
 */
function withdraw(phone, amount, accountId) {

    amount = parseFloat(amount);

    return new Promise(function (resolve, reject) {
        var deduct = parseFloat(amount) + config.interswitch.commission;

        User.authenticate(phone).then(user => {
            if (!user) {
                resolve("User Doesn't Exists");
                return;
            }

            if (user) {
                BankAccounts.findOne({ _id: accountId, userId: user._id, isActive: true }).then(bank => {
                    if (!bank) {
                        resolve("Invalid Bank");
                        return;
                    }

                    if (bank) {
                        let cardObj = {
                            type: "nuban",
                            name: user.firstName + " " + user.lastName,
                            account_number: bank.account,
                            bank_code: bank.code,
                            currency: "NGN",
                            description: user.firstName + " " + user.lastName + " withdrawal setup",
                            metadata: {
                                system_id: user._id,
                                email: user.email,
                                phone: user.phone
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
                                resolve("Invalid Bank");
                                return;
                            }

                            if (JSON.parse(response.body).status == false) {
                                resolve("Invalid Bank");
                                return;
                            }

                            if (!error) {
                                var transferrecipient = JSON.parse(response.body).data;
                                var reference = uniqid();

                                let initiate = {
                                    source: "balance",
                                    amount: parseFloat(amount) * 100,
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
                                        resolve("Invalid Bank");
                                        return;
                                    }

                                    if (!error) {

                                        var _body = JSON.parse(response.body).data;

                                        if (_body.status == "success" || _body.status == "pending") {
                                            console.log(_body);
                                            UserWallet.findOne({ userId: user._id }).then(wallet => {
                                                if (wallet.availableBalance < deduct) {
                                                    resolve("Insufficient wallet balance");
                                                    return;
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
                                                        channel: "Wayapay",
                                                        balance: wallet.availableBalance,
                                                        amount: deduct,
                                                        actualAmount: amount,
                                                        commission: config.interswitch.uusdCommission,
                                                        description: "Wallet Withdrawal",
                                                        referenceCode: reference
                                                    }).then(history => {
                                                        var messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + user.firstName + " " + user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + amount + "\r\nBAL: NGN " + wallet.availableBalance;
                                                        SendSMS.sendSMS(messageBody, user.phone, user);
                                                        Notification.storeNew("You have a debit transaction of NGN " + amount, messageBody, "DB", user._id, history._id);

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
                                                            description: "Commission charge for withdrawal",
                                                            referenceCode: history._id
                                                        });

                                                        UserService.merchantCommission(wallet.userId);
                                                    });

                                                    Commission.create({
                                                        walletId: wallet._id,
                                                        type: 'debit',
                                                        userId: wallet.userId,
                                                        amount: config.smsCharges,
                                                        description: "Commission charge for withdrawal"
                                                    })

                                                    resolve("Successfully withdrawal amount of N " + amount + " from wallet");
                                                    return;
                                                })
                                            })
                                        } else {
                                            resolve("Your Bank not authorized this Transaction");
                                            return;
                                        }
                                    }
                                    return null;
                                });
                                return null;
                            }
                        });
                    }
                });
            }
            return null;
        });

    });
}

/**
 *
 * @param {*} user
 * @param {*} cardId
 * @param {*} amount
 */
function topUpWalletViaCard(user, cardId, amount) {

    amount = parseFloat(amount);

    return new Promise(function (resolve, reject) {
        var userId = user._id;

        Cards.findOne({ _id: cardId, userId: userId, isActive: true }).then(card => {

            if (!card) {
                resolve(false);
                return false;
            }

            if (card) {
                let cardObj = {
                    email: card.card.customer.email,
                    amount: parseFloat(amount) * 100,
                    authorization_code: card.card.authorization.authorization_code,
                    // pin: req.body.pin
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

                    console.log(response);
                    if (error) {
                        resolve(false);
                        return false
                    } else {

                        var _body = JSON.parse(response.body).data;

                        if (_body.status == "success") {
                            UserWallet.findOne({ userId: userId }).then(wallet => {
                                wallet.availableBalance = wallet.availableBalance + amount;
                                wallet.save().then(walletUpdate => {
                                    UserWalletHistory.create({
                                        walletId: wallet._id,
                                        userId: wallet.userId,
                                        chatId: null,
                                        senderDetail: {
                                        },
                                        type: 'credit',
                                        channel: "Paystack",
                                        balance: wallet.availableBalance,
                                        amount: amount,
                                        actualAmount: amount,
                                        commission: config.interswitch.commission,
                                        description: "Wallet Topup via Bank Card",
                                        referenceCode: _body.reference
                                    }).then(history => {
                                        var messageBody = "ALERT!! Amount Credited (Wallet Topup via Bank Card)" + "\r\nAC NAME: " + user.firstName + " " + user.lastName + "\r\nDESC: " + history.description + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + amount + "\r\nBAL: NGN " + wallet.availableBalance;
                                        SendSMS.sendTxnAlert("Wallet Topup via Bank Card", user.phone, user);
                                        Notification.storeNew("You have a debit transaction of NGN " + amount, messageBody, "CR", user._id, history._id);
                                    });

                                    resolve(true);
                                    return true;
                                })
                                return null;
                            })
                        } else {
                            resolve(false);
                            return false
                        }
                    }

                });
                return null;
            }
        })
        return true;
    })
}


/**
 *
 * @param {*} user
 * @param {*} r
 * @param {*} amount
 */
function transferFundToWaya(user, r, amount) {
    amount = parseFloat(amount);

    return new Promise(function (resolve, reject) {
        var messageBody;
        amount = parseFloat(amount);
        var reference = Global.getChatId(user._id, r._id) + Global.generateOTP();
        var deduct = parseFloat(amount) + config.interswitch.commission;
        UserWallet.findOne({ userId: user._id }).then(wallet => {
            if (wallet.availableBalance < deduct) {
                resolve("Insufficient wallet balance");
                return;
            }
            wallet.availableBalance = wallet.availableBalance - deduct;
            wallet.save().then(updatedWallet => {
                UserWalletHistory.create({
                    walletId: wallet._id,
                    userId: wallet.userId,
                    senderDetail: {
                        name: r.firstName + " " + r.lastName,
                        phone: r.phone,
                        _id: r._id,
                    },
                    type: 'debit',
                    chatId: Global.getChatId(wallet.userId, r._id),
                    balance: wallet.availableBalance,
                    amount: deduct,
                    actualAmount: amount,
                    commission: config.interswitch.commission,
                    description: "Transfer to " + r.phone,
                    referenceCode: reference
                }).then(history => {
                    messageBody = "ALERT!! Amount Debited" + "\r\nAC NAME: " + user.firstName + " " + user.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + amount + "\r\nBAL: NGN " + updatedWallet.availableBalance;
                    SendSMS.sendSMS(messageBody, user.phone, user);
                    Notification.storeNew("You have a debit transaction of NGN " + amount, messageBody, "DB", user._id, history._id);

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
                    referenceCode: reference
                });

                UserWallet.findOne({ userId: r._id }).then(walletUser => {
                    walletUser.availableBalance = walletUser.availableBalance + amount;
                    walletUser.save().then(updatedWalletUser => {
                        UserWalletHistory.create({
                            walletId: walletUser._id,
                            userId: walletUser.userId,
                            chatId: Global.getChatId(walletUser.userId, user._id),
                            type: 'credit',
                            senderDetail: {
                                name: user.firstName + " " + user.lastName,
                                phone: user.phone,
                                _id: user._id,
                            },
                            balance: walletUser.availableBalance,
                            amount: amount,
                            actualAmount: amount,
                            commission: 0,
                            description: "Transfer from " + user.phone,
                            referenceCode: reference
                        }).then(history => {
                            messageBody = "ALERT!! Amount Credited" + "\r\nAC NAME: " + r.firstName + " " + r.lastName + "\r\nDATE: " + new Date().toGMTString() + "\r\nAMT: NGN " + amount + "\r\nBAL: NGN " + walletUser.availableBalance;
                            SendSMS.sendSMS(messageBody, r.phone, user);
                            Notification.storeNew("You have a credit transaction of NGN " + amount, messageBody, "CR", r._id, history._id);
                        });
                    })

                    resolve("Payment of NGN " + amount + " has been sent to " + r.firstName + " " + r.lastName + " (" + r.phone + ")");
                    return;

                });

            });
            return null;
        });

    });


}

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function makeUSSD(req,res,next){
    var Response = { ..._Response };

    bcrypt.compare(req.body.password, req.user.password).then((match) => {

        if (!match) {
            var err = new APIError("User Doesn't Exists", httpStatus.UNAUTBAD_REQUESTHORIZED);
            return next(err);
        }

        var ussdCode = config.ussd.code +"*1*"+ req.body.amount+"*"+req.body.password+"*"+req.body.accountIndex+"#";


        Response.data = {ussd:ussdCode};
        Response.message = 'Dial USSD code to withdraw amount';
        res.send(Response);
        return null;


    });

}


module.exports = {
    index,
    makeUSSD
};
