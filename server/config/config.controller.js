var _Response = require('../helpers/Response');
var config = require('../../config/config');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    var Response = { ..._Response };
    var configs = {
        webrtc: config.webrtc,
        ussdCode: config.ussd.code+"#",
        ussdOTP: config.ussd.otp
    }

    Response.data = configs;
    Response.message = "App Configurations"
    res.send(Response);
}

module.exports = {
    index
};
