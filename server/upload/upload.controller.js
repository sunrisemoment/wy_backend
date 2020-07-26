var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var postDIR = "/post/";
var profileDIR = "/profile/";
var chatDIR = "/chat/";


function imageUpload(req, res, next) {
    var Response = { ..._Response };
    if (!req.files || Object.keys(req.files).length === 0) {
        Response.status = httpStatus.BAD_REQUEST;
        Response.data = null;
        Response.message = "No files were uploaded."
        return res.send(Response);
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let file = req.files.file;
    let filename = Global.randomString(20) + file.name;
    // Use the mv() method to place the file somewhere on your server
    file.mv('./public' + postDIR + filename, function (err) {
        if (err) {
            Response.status = httpStatus.INTERNAL_SERVER_ERROR;
            Response.data = null;
            Response.message = "No files were uploaded.";
            return res.send(Response);
        }

        Response.data = {
            imageName: postDIR + filename
        }
        Response.message = "Files uploaded.";
        res.send(Response);
    });
}


function profileUpload(req, res, next) {
    var Response = { ..._Response };
    if (!req.files || Object.keys(req.files).length === 0) {
        Response.status = httpStatus.BAD_REQUEST;
        Response.data = null;
        Response.message = "No files were uploaded."
        return res.send(Response);
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let file = req.files.file;
    let filename = Global.randomString(20) + file.name;
    // Use the mv() method to place the file somewhere on your server
    file.mv('./public' + profileDIR + filename, function (err) {
        if (err) {
            Response.status = httpStatus.INTERNAL_SERVER_ERROR;
            Response.data = null;
            Response.message = "No files were uploaded.";
            return res.send(Response);
        }

        Response.data = {
            imageName: profileDIR + filename
        }
        Response.message = "Files uploaded.";
        res.send(Response);
    });
}


function chatFile(req, res, next) {
    var Response = { ..._Response };
    if (!req.files || Object.keys(req.files).length === 0) {
        Response.status = httpStatus.BAD_REQUEST;
        Response.data = null;
        Response.message = "No files were uploaded."
        return res.send(Response);
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let file = req.files.file;
    let filename = Global.randomString(20) + file.name;
    // Use the mv() method to place the file somewhere on your server
    file.mv('./public' + chatDIR + filename, function (err) {
        if (err) {
            Response.status = httpStatus.INTERNAL_SERVER_ERROR;
            Response.data = null;
            Response.message = "No files were uploaded.";
            return res.send(Response);
        }

        Response.data = {
            fileName: chatDIR + filename
        }
        Response.message = "Files uploaded.";
        res.send(Response);
    });
}


module.exports = {
    imageUpload,
    profileUpload,
    chatFile
};
