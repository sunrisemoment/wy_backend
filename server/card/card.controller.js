var Global = require('../helpers/global');
var bcrypt = require('bcryptjs');
var config = require('../../config/config');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
const request = require('request');
var Card = require('./card.model');

var PayStack = require('paystack-node');
const paystack = new PayStack(config.paystack.skeyDev, process.env.NODE_ENV);


/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };
    Card.find({ userId: req.user._id, isActive: true }).then((data) => {
        Response.data = data;
        Response.message = 'Card';
        res.send(Response);
        return null;
    })
}

function chargeCardVerify(req, res, next) {
    var Response = { ..._Response };

    let cardObj = {
        pin: req.body.pin,
        reference: req.body.reference,
    };

    var clientServerOptionsPhone = {
        uri: config.paystack.url + 'charge/submit_pin',
        body: JSON.stringify({
            phone: req.user.phone,
            reference: req.body.reference,
        }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.paystack.skeyDev}`
        }
    }

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
            var body = JSON.parse(response.body);
            if (body.data && body.data.message) {
                var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            } else {
                var err = new APIError(JSON.parse(response.body).data || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            }
        }


        Response.data = JSON.parse(response.body).data;
            Response.message = 'Card Created';
            res.send(Response);
            return null;

        // request(clientServerOptionsPhone, function (error, response) {

        //     if (response.statusCode != httpStatus.OK) {
        //         var body = JSON.parse(response.body);
        //         if (body.data.message) {
        //             var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
        //             return next(err);
        //         } else {
        //             var err = new APIError(JSON.parse(response.body).data || "Something went wrong", httpStatus.BAD_REQUEST);
        //             return next(err);
        //         }
        //     }





        // });
    });
}




function chargeCardVerifyOTP(req, res, next) {
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


        var cardData = JSON.parse(response.body).data;
        cardData.brandLogo = "https://brand.mastercard.com/content/dam/mccom/brandcenter/thumbnails/mastercard_vrt_pos_92px_2x.png";
        if (cardData.authorization.brand == 'VISA') {
            cardData.brandLogo = "https://www.freepnglogos.com/uploads/visa-card-logo-9.png";
        } else if (cardData.authorization.brand == 'Verve') {
            cardData.brandLogo = "https://www.myverveworld.com/img/logo.png";
        }

        let card = new Card({
            userId: req.user._id,
            card: cardData,
        });

        card.save()
            .then((data) => {
                Card.findId(data._id).then((account) => {

                    // UserWallet.findOne({ userId: req.user._id }).then(wallet => {
                    //     wallet.availableBalance = wallet.availableBalance - deduct;
                    // })

                    Response.data = account;
                    Response.message = 'Card Created';
                    res.send(Response);
                    return null;
                })
                return null;
            })
            .catch((e) => {
                next(e);
            });
    });
}


function chargeCard(req, res, next) {
    var Response = { ..._Response };

    if (!req.user.email) {
        var err = new APIError("Register email id via profile", httpStatus.BAD_REQUEST);
        return next(err);
    }

    if(req.body.cardNumber.length > 6){
      const { cardNumber } = req.body;
      const getCardLast4Digit = String(cardNumber).substr(-4);

      Card.findOne({ 'card.authorization.last4': getCardLast4Digit }).then(c => {
        if(c){
          var err = new APIError("Card Already Exist", httpStatus.BAD_REQUEST);
          return next(err);
        }
      });
      return null;
    };

    let cardObj = {
        email: req.user.email,
        phone: req.user.phone,
        amount: '10' + '00',// 5 naira
        card: {
            number: req.body.cardNumber,
            expiry_month: req.body.expiryMonth,
            expiry_year: req.body.expiryYear,
            cvv: req.body.cvv,
        },
        metadata: {
            custom_fields: {
                payment_type: 'temporary card deduction',
                customer_name: req.body.name,
                customer_phone: req.user.phone
            }
        }
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

    resolveCardBin(req, res, next).then(({error, response}) => {

        if (response.statusCode != httpStatus.OK) {
            var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
            return next(err);
        }

        var binResolve = JSON.parse(response.body).data;

        // if(binResolve.brand==="Unknown"){
        //     var err = new APIError("Unable to resolve card, please check card number", httpStatus.BAD_REQUEST);
        //     return next(err);
        // }

        request(clientServerOptions, function (error, response) {
            //console.log(response);
            if (response.statusCode != httpStatus.OK) {
                var err = new APIError(JSON.parse(response.body).data.message || "Something went wrong", httpStatus.BAD_REQUEST);
                return next(err);
            }


            Response.data = JSON.parse(response.body).data;;
            res.send(Response);
            return null;
        });
    })
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

        Card.findAndUpdate(req.params.accountId, { isActive: false })
            .then((data) => {
                Response.data = null;
                if (!data) {
                    Response.message = 'Card Already Deleted';
                    res.send(Response);
                    return null;
                } else {
                    Response.message = 'Card  Deleted';
                    res.send(Response);
                    return null;
                }
            })
            .catch((e) => {
                next(e);
            });
    });
}


function resolveCardBin(req, res, next) {
    return new Promise(function (resolve, reject) {

        var bin = req.body.cardNumber.length > 6 ? req.body.cardNumber.substring(0, 6) : req.body.cardNumber;

        var clientServerOptions = {
            uri: config.paystack.url + 'decision/bin/' + bin,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.paystack.skeyDev}`
            }
        }

        request(clientServerOptions, function (error, response) {
            resolve({error, response});
        });
    });
}

module.exports = {
    index,
    chargeCard,
    chargeCardVerify,
    chargeCardVerifyOTP,
    update,
    destroy
};
