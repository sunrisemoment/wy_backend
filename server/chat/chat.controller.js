var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var Email = require('../helpers/email');
var httpStatus = require('http-status');
var uniqid = require('uniqid');
var config = require('../../config/config');

var Chat = require('./chat.model');
var User = require('../user/user.model');
var Call = require('./call.model');
var ChatOverview = require('./../chatOverview/chatOverview.model');

var FCM = require('fcm-node');

var apn = require('apn');
var https = require('https');
var fs = require('fs');
var serverKey = config.fcmKey;

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };
    Chat.findChat({ chatId: req.params.chatId, isActive: true }).then((data) => {
        Response.data = data;
        Response.message = 'Chat';
        res.send(Response);
        return null;
    })
}


function chatByUserId(req, res, next) {
    var Response = { ..._Response };
    Chat.findChat({ chatId: Global.getChatId(req.user._id, req.params.userId), isActive: true }).then((data) => {
        Response.data = data;
        Response.message = 'Chat';
        res.send(Response);
        return null;
    })
}


function newChat(req, res, next) {
    return new Promise(function (resolve, reject) {
        let chatId = Global.getChatId(req.user._id, req.body.userId2);

        let chat = new Chat({
            chatId: chatId,
            message: req.body.message || null,
            file: req.body.file || null,
            userId1: req.user._id,
            type: req.body.type || config.chat.message,
            userId2: req.body.userId2,
        })

        chat.save()
            .then((data) => {
                ChatOverview.findOneAndUpdate({ chatId: chatId }, { message: data.message, userId1: req.user._id, userId2: req.body.userId2, updatedAt: Date.now() }, { upsert: true, new: true }).then(() => { });
                Chat.findId(data._id).then((newdata) => {

                    User.findOne({ _id: req.body.userId2, isActive: true }).then((data) => {
                        if (data) {
                            if (data.fcmToken) {
                                var fcm = new FCM(serverKey);

                                var pushMessage = Global.capitalizeFirstLetter(req.user.firstName) + ' ' + Global.capitalizeFirstLetter(req.user.lastName) + ' has messaged you';
                                var pushBody = req.body.message || "";
                                if (req.body.file) {
                                    pushMessage = Global.capitalizeFirstLetter(req.user.firstName) + ' ' + Global.capitalizeFirstLetter(req.user.lastName) + ' has shared you media';
                                    pushBody = config.appURL + req.body.file.name || "";
                                }

                                var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                                    to: data.fcmToken,
                                    //collapse_key: 'your_collapse_key',

                                    notification: {
                                        title: pushMessage,
                                        body: pushBody,
                                    },

                                    //data: notificationData
                                };

                                fcm.send(message, function (err, response) {
                                    if (err) {
                                        console.log("Something has gone wrong!");
                                    } else {
                                        console.log("Successfully sent with response: ", response);

                                    }
                                })
                            }
                        } else {
                            console.log("Something has gone wrong with user!");
                        }
                    });
                    resolve(newdata);
                    return null;
                })
                return null;
            })
            .catch((e) => {
                next(e);
            });
    });
}


/**
 *
 * @param {*} req
 * @param {*} res
 */
function store(req, res, next) {
    var Response = { ..._Response };

    newChat(req, res, next).then(newdata => {
        Response.data = newdata;
        Response.message = 'Chat Created';
        res.send(Response);
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
function destroyChatById(req, res, next) {
  var Response = { ..._Response };
  Chat.deleteChatById(req.params.Id)
    .then((data) => {
      if (!data) {
        Response.message = "Chat Already Deleted";
        res.send(Response);
        return null;
      } else {
        Response.message = "Chat Deleted";
        res.send(Response);
        return null;
      }
    })
    .catch((e) => {
      next(e);
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function forwardChat(req, res, next) {
  var Response = { ..._Response };

  newChat(req, res, next).then((newdata) => {
    Response.data = newdata;
    Response.message = "Forward Chat Created";
    res.send(Response);
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function destroy(req, res, next) {
    var Response = { ..._Response };
    Chat.update({ chatId: req.params.chatId }, { isActive: false }, { multi: true })
        .then((data) => {
            Response.data = null;
            ChatOverview.findOneAndUpdate({ chatId: req.params.chatId }, { message: "" }, { upsert: true, new: true }).then(() => { });
            if (!data) {
                Response.message = 'Chat Already Deleted';
                res.send(Response);
                return null;
            } else {
                Response.message = 'Chat  Deleted';
                res.send(Response);
                return null;
            }
        })
        .catch((e) => {
            next(e);
        });
}

function initiatedRTC(req, res, next) {
    var Response = { ..._Response };
    var sendmessage;

    // console.log(req.user._id);
    // Response.data = null;
    // Response.message = "";
    // res.send(Response);
    // return null;

    if (isNaN(req.params.button)) {
        var err = new APIError("Call status can either Accept or Reject", httpStatus.BAD_REQUEST);
        return next(err);
    }

    Call.findOne({ roomId: req.params.roomId}).then((data) => {

        if (!data) {
            var err = new APIError("Audio/Video Call allowed only", httpStatus.BAD_REQUEST);
            return next(err);
        }

        data.callStatus = req.params.button;

        data.save().then(updatedData => {

            Email.systemError(JSON.stringify(updatedData));

            var notificationData = { ...updatedData };
            notificationData.firstName = Global.capitalizeFirstLetter(req.user.firstName);
            notificationData.lastName = Global.capitalizeFirstLetter(req.user.lastName);
            notificationData.profilePic = config.appURL + req.user.profilePic;
            notificationData.priority = 'high';
            notificationData.click_action = "OPEN_ACTIVITY_1";

            if (data.apnsToken) {

                let iOS_Service = new apn.Provider({
                    cert: process.cwd() + "/server/chat/VoIp.pem",
                    key: process.cwd() + "/server/chat/key.pem",
                    passphrase: "apparrant",
                    production: false //use this when you are using your application in production.For development it doesn't need
                });

                let note = new apn.Notification({
                    payload: notificationData,
                    alert: "Audio Call Initiated",
                    topic: "com.apparrant.Waya.voip",//this is the bundle name of your application.This key is needed for production
                    contentAvailable: 1//this key is also needed for production
                });

                iOS_Service.send(note, data.apnsToken).then(result => {//ios key is holding array of device ID's to which notification has to be sent

                    if (result.failed.length == "1") {
                        console.log("Successfully sent with response: ", JSON.stringify(result));
                        console.log("Something has gone wrong!");
                    }

                    console.log("Successfully sent with response: ", note);

                });
                iOS_Service.shutdown();
            }
            else {

                var fcm = new FCM(serverKey);

                var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                    to: data.fcmToken,
                    priority: 10,
                    data: notificationData
                };

                console.log(JSON.stringify(message));

                fcm.send(message, function (err, response) {
                    if (err) {
                        console.log(err);
                        console.log("Something has gone wrong!");
                        return null;
                    } else {
                        console.log("Successfully sent with response: ", response);

                    }
                })
            }

            sendmessage = (data.callStatus==1)?'Call Started':'Call Rejected';
            //ChatOverview.findOneAndUpdate({ chatId: updatedData.chatId }, { message: message}, { upsert: true, new: true }).then(() => { });

            Response.data = updatedData;
            Response.message = sendmessage;
            res.send(Response);
            return null;
        })
        return null;
    });

}


function initiateRTC(req, res, next) {
    var Response = { ..._Response };
    var type = 0;
    var message = "";
    let chatId = Global.getChatId(req.user._id, req.params.userId);


    if (req.body.chatId != chatId) {
        var err = new APIError("Incorrect Chat Id", httpStatus.BAD_REQUEST);
        return next(err);
    }

    switch (req.params.type) {
        case 'audio':
            type = config.chat.audio;
            message = "Audio Call initiated";
            break;

        case 'video':
            type = config.chat.video;
            message = "Video Call initiated";
            break;

        default:
            var err = new APIError("Audio/Video Call allowed only", httpStatus.BAD_REQUEST);
            return next(err);
    }


    let chat = new Chat({
        chatId: chatId,
        message: message,
        file: null,
        userId1: req.user._id,
        userId2: req.params.userId,
        type: type
    })

    chat.save().then((data) => { ChatOverview.findOneAndUpdate({ chatId: chatId }, { message: data.message, userId1: req.user._id, userId2: req.params.userId, }, { upsert: true, new: true }).then(() => { }); });


    User.authme(req.params.userId).then((data) => {
        if (!data) {
            var err = new APIError("User account is deleted", httpStatus.BAD_REQUEST);
            return next(err);
        }

        // if (!data.fcmToken) {
        //     var err = new APIError(data.firstName + " is not able to recieve Audio/Video Calls", httpStatus.BAD_REQUEST);
        //     return next(err);
        // }

        var initCall = {
            chatId: req.body.chatId,
            type: type,
            roomId: uniqid() + chatId,
            typeName: req.params.type,
            userId1: req.user._id,
            userId2: req.params.userId,
        }

        var notificationData = { ...initCall };
        notificationData.firstName = Global.capitalizeFirstLetter(req.user.firstName);
        notificationData.lastName = Global.capitalizeFirstLetter(req.user.lastName);
        notificationData.profilePic = config.appURL + req.user.profilePic;
        notificationData.priority = 'high';
        notificationData.click_action = "OPEN_ACTIVITY_1";

        console.log(data.apnsToken);
        console.log(data.fcmToken);

        if (data.apnsToken) {

          console.log(data.apnsToken, 'data.apnsToken');

            let iOS_Service = new apn.Provider({
                cert: process.cwd() + "/server/chat/VoIp.pem",
                key: process.cwd() + "/server/chat/key.pem",
                passphrase: "apparrant",
                production: false //use this when you are using your application in production.For development it doesn't need
            });

            let note = new apn.Notification({
                payload: notificationData,
                alert: "Audio Call Initiated",
                topic: "com.apparrant.Waya.voip",//this is the bundle name of your application.This key is needed for production
                contentAvailable: 1//this key is also needed for production
            });

            iOS_Service.send(note, data.apnsToken).then(result => {//ios key is holding array of device ID's to which notification has to be sent

                if (result.failed.length == "1") {
                    console.log("Successfully sent with response: ", JSON.stringify(result));
                    console.log("Something has gone wrong!");
                    Response.response = false;
                    Response.errorMessage = 'Something has gone wrong from APNS';
                    res.send(Response);
                    return null;
                }

                console.log("Successfully sent with response: ", note);

                let call = new Call(initCall);

                call.save().then(data => {
                    Response.data = data;
                    Response.message = 'Chat Initiated';
                    res.send(Response);
                    return null;
                });
            });
            iOS_Service.shutdown();
        }
        else {

          console.log(data.apnsToken, 'data.apnsToken');

            var fcm = new FCM(serverKey);

            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: data.fcmToken,
                priority: 10,
                //collapse_key: 'your_collapse_key',

                // notification: {
                //     title: initCall.typeName + ' has initiated',
                //     body: initCall.typeName + ' has initiated',
                // },

                data: notificationData
            };

            console.log(JSON.stringify(message), 'message message');

            fcm.send(message, function (err, response) {
                if (err) {
                    console.log(err, 'err err');
                    console.log("Something has gone wrong!");
                    Response.response = false;
                    Response.errorMessage = 'Something has gone wrong FCM';
                    res.send(Response);
                    return null;
                } else {
                    console.log("Successfully sent with response: ", response);

                    let call = new Call(initCall);

                    call.save().then(data => {
                        Response.data = data;
                        Response.message = 'Chat Initiated';
                        res.send(Response);
                        return null;
                    });
                }
            })
        }

    })

}

module.exports = {
    index,
    store,
    newChat,
    update,
    chatByUserId,
    initiateRTC,
    destroy,
    initiatedRTC,
    destroyChatById,
    forwardChat,
};
