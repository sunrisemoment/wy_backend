var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var Notifications = require('../notifications/notifications.model');
var WayaGramComments = require('./wayagramComments.model');
var WayaGramPost = require('../wayagram/wayagram.model');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function index(req, res, next) {
    var Response = { ..._Response };
    
    WayaGramComments.postData({ postId: req.params.postId, isActive: true }, req.query.page).then((data) => {
        Response.data = data;
        Response.message = 'WayaGram Comments';
        res.send(Response);
        return null;
    })
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function store(req, res, next) {
    var Response = { ..._Response };
    var notification;
    let wayaGramComments = new WayaGramComments({
        postId: req.body.postId,
        comment: req.body.comment,
        userId: req.user._id
    })

    wayaGramComments
        .save()
        .then((post) => {
            WayaGramComments.postDataId(post._id).then((post) => {
                WayaGramPost.findOneAndUpdate({ _id: req.body.postId, isActive: true }, { $inc: { commentCount: 1 } }, { new: true }).then((doc) => {

                    if (doc.userId != req.user._id) {
                        notification = new Notifications({
                            userId: doc.userId,
                            title: "Post Comment",
                            content: req.user.firstName + " " + req.user.lastName + " commented on your post",
                            type: "COMMENT",
                            tblId: post._id.toString()
                        });
            
                        notification.save().then((data) => { });
                    }

                    Response.data = post;
                    Response.message = 'WayaGram Comments';
                    res.send(Response);
                    return null;
                });
                return null;
            })
            return null;
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
function update(req, res, next) {

}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 */
function destroy(req, res, next) {
    var Response = { ..._Response };
    Response.data = null;
    WayaGramComments.findAndUpdate(req.params.commentId, { isActive: false })
        .then((data) => {

            if (!data) {
                Response.message = 'WayaGram Comment Already Deleted';
                res.send(Response);
                return null;
            } else {

                if(data.userId!=req.user._id){
                    var err = new APIError('You can\'t delete other user comment !', httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }

                WayaGramPost.findOneAndUpdate({ _id: data.postId }, { $inc: { commentCount: -1 } }, { new: true }).exec().then(() => {
                    Response.message = 'WayaGram Comment Deleted';
                    res.send(Response);
                    return null;
                });
            }
            return null;
        })
        .catch((e) => {
            next(e);
        });
}

module.exports = {
    index,
    store,
    update,
    destroy
};
