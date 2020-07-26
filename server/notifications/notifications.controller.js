var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var Notification = require('./notifications.model');


/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    var Response = { ..._Response };
    Notification.find({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 }).then((data) => {

        Response.data = data;
        Response.message = "Notifications";
        res.send(Response);
        return null;
    });
}


function read(req, res, next) {
    var Response = { ..._Response };
    Notification.update({ userId: req.user._id, isActive: true }, { isRead: true }, { multi: true }).then((data) => {

        Response.message = "Notifications";
        res.send(Response);
        return null;
    });
}

function storeNew(title, content, type, userId, tblId) {
    Notification.create({
        userId: userId,
        title: title,
        content: content,
        type: type,
        tblId: tblId
    });
}


module.exports = {
    index,
    read,
    storeNew
};
