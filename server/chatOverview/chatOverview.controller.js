var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var ChatOverview = require('./chatOverview.model');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    var Response = { ..._Response };
    ChatOverview.findChat({ $or: [{ userId1: req.user._id },{ userId2: req.user._id }] }).then((data) => {
        Response.data = data;
        Response.message = 'ChatOverview';
        res.send(Response);
        return null;
    })
}

module.exports = {
    index
};
