var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var WayaGramPost = require('./wayagram.model');
var WayaGramComments = require('../wayagramComments/wayagramComments.model');
var Notifications = require('../notifications/notifications.model');
var UserFollow = require('../userFollow/userFollow.model');
var User = require('../user/user.model');
var uniqid = require('uniqid');

var colorCodes = ["#075E54", "#128C7E", "#25D366", "#DCF8C6", "#34B7F1", "#ECE5DD", "#8DC44F", "#1CA45C", "#FFC718", "#FF9E0F", "#DA483B", "#4486F4"];


/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };

    User.findOneHiddenKey({ _id: req.user._id }, 'isPrivate').then((user) => {

      if (!user) {
        var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
        return next(err);
    }

    UserFollow.findOneByQuery({ userId: req.user._id, isActive: true }).then((userFollow) => {

    WayaGramPost.postData({ $or: [{ userId: { $in: userFollow.followingIds } }, { userId: { $in: userFollow.followingIds } }], isActive: true, isMoment: false }, req.query.page || 1).then((data) => {

      Response.data = data;
        Response.message = 'WayaGram Posts';
        res.send(Response);
        return null;
    });
    });
  });
}


/**
 *
 * @param {*} req
 * @param {*} res
 */
function getmyposts(req, res, next) {
    var Response = { ..._Response };
    WayaGramPost.postData({ userId: req.user._id, isActive: true, isMoment: false }, req.query.page || 1).then((data) => {
        Response.data = data;
        Response.message = 'My WayaGram Posts';
        res.send(Response);
        return null;
    })
}


/**
 *
 * @param {*} req
 * @param {*} res
 */
function getMoments(req, res, next) {
    var Response = { ..._Response };
    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((profileDetail) => {
        profileDetail.followingIds.push(req.user._id.toString());
        WayaGramPost.postData({ userId: { $in: profileDetail.followingIds }, isActive: true, isMoment: true }, req.query.page || 1).then((data) => {
            Response.data = data;
            Response.message = 'Wayagram Moments';
            res.send(Response);
            return null;
        });
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function getuserMoments(req, res, next) {
    var Response = { ..._Response };
    User.authme({ _id: req.params.userId }).then((user) => {
        if (!user) {
            var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }
        UserFollow.findOne({ userId: req.user._id, isActive: true }).then((userFollow) => {
            var followerId = userFollow.followerIds.indexOf(req.params.userId);
            // if (followerId != -1) {

            //     if (user.isPrivate && req.params.userId != req.user._id.toString()) {
            //         Response.data = [];
            //         Response.message = 'My WayaGram Posts';
            //         res.send(Response);
            //         return null;
            //     }
            // }
            WayaGramPost.postData({ userId: req.params.userId, isActive: true, isMoment: true }, req.query.page || 1).then((data) => {
                Response.data = data;
                Response.message = 'Wayagram Moments';
                res.send(Response);
                return null;
            });
            return null;
        });
        return null;
    });

}


/**
 *
 * @param {*} req
 * @param {*} res
 */
function getuserposts(req, res, next) {
    var Response = { ..._Response };
    User.authme({ _id: req.params.userId }).then((user) => {
        if (!user) {
            var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }
        UserFollow.findOne({ userId: req.user._id, isActive: true }).then((userFollow) => {
            var followerId = userFollow.followingIds.indexOf(req.params.userId);
            // if (followerId != -1) {

            //     if (user.isPrivate && req.params.userId != req.user._id.toString()) {
            //         Response.data = [];
            //         Response.message = 'My WayaGram Posts';
            //         res.send(Response);
            //         return null;
            //     }
            // }
            WayaGramPost.postData({ userId: req.params.userId, isActive: true, isMoment: false }, req.query.page || 1).then((data) => {
                Response.data = data;
                Response.message = 'My WayaGram Posts';
                res.send(Response);
                return null;
            });
            return null;

        });
        return null;
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function store(req, res, next) {
    var Response = { ..._Response };

    let wayagramPost = new WayaGramPost({
        image: req.body.image,
        description: req.body.description,
        userId: req.user._id,
        url:"/posts/"+uniqid('wg'),
        color: colorCodes[Math.floor(Math.random() * colorCodes.length)],
        isMoment: req.body.isMoment || false
    })

    wayagramPost.save()
        .then((post) => {
            WayaGramPost.postDataId(post._id).then((post) => {
                Response.data = post;
                Response.message = (post.isMoment) ? 'WayaGram Moment Created' : 'WayaGram Post Created';
                res.send(Response);
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
function repost(req, res, next) {
    var Response = { ..._Response };
    let wayagramPost = new WayaGramPost({
        image: req.body.image,
        description: req.body.description,
        sharedPost: req.body.sharedPost,
        userId: req.user._id,
        isMoment: false
    })

    wayagramPost.save()
        .then((post) => {
            WayaGramPost.postDataId(post._id).then((post) => {
                Response.data = post;
                Response.message = 'WayaGram Post Re-Created';
                res.send(Response);
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
function repostComment(req, res, next) {
    var Response = { ..._Response };
    let wayagramPost = new WayaGramPost({
        image: req.body.image,
        description: req.body.description,
        sharedPost: req.body.sharedPost,
        userId: req.user._id,
        commentCount: 1,
        isMoment: false
    })

    wayagramPost.save()
        .then((post) => {
            WayaGramPost.postDataId(post._id).then((post) => {

                WayaGramComments.create({
                    postId: post._id,
                    comment: req.body.comment,
                    userId: req.user._id
                })

                Response.data = post;
                Response.message = 'WayaGram Post Re-Created with comment';
                res.send(Response);
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
function postLike(req, res, next) {
    var Response = { ..._Response };
    var notification;
    var content;
    WayaGramPost.findId(req.params.postId).then((post) => {

        var likeIndex = post.like.indexOf(req.params.userId);
        if (likeIndex !== -1) {
            post.like.splice(likeIndex, 1);
            Response.message = 'WayaGram Post Un-Liked';

            content = req.user.firstName + " " + req.user.lastName + " unliked your post";

        } else {
            post.like = post.like.concat([req.params.userId]);
            Response.message = 'WayaGram Post Liked';

            content = req.user.firstName + " " + req.user.lastName + " liked your post";
        }


        if (post.userId != req.user._id) {
            notification = new Notifications({
                userId: post.userId,
                title: "Post Unliked",
                content: content,
                type: "UN_LIKE",
                tblId: req.params.postId
            });

            notification.save().then((data) => { });
        }

        post.save().then((wayagramPost) => {
            WayaGramPost.postDataId(req.params.postId).then((_post) => {
                Response.data = _post;
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


/**
 *
 * @param {*} req
 * @param {*} res
 */
function update(req, res, next) {
    var Response = { ..._Response };
    WayaGramPost.findOneAndUpdate({ _id: req.params.postId, isActive: true, userId: req.user._id }, { image: req.body.image, description: req.body.description })
        .then((data) => {
            WayaGramPost.postDataId(req.params.postId).then((_post) => {
                Response.data = _post;
                Response.message = 'WayaGram Post Updated';
                res.send(Response);
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
function destroy(req, res, next) {
    var Response = { ..._Response };
    WayaGramPost.findOneAndUpdate({ _id: req.params.postId, isActive: true, userId: req.user._id }, { isActive: false })
        .then((data) => {
            Response.data = null;
            if (!data) {
                Response.message = 'WayaGram Post Already Deleted';
                res.send(Response);
                return null;
            } else {
                if (data.userId != req.user._id) {
                    var err = new APIError('You can\'t delete other user post !', httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }
                Response.message = 'WayaGram Post Deleted';
                res.send(Response);
                return null;
            }
        })
        .catch((e) => {
            next(e);
        });
}


function search(req, res, next) {
    var Response = { ..._Response };
    if (!req.query.q) {
        Response.data = [];
        Response.message = 'WayaGram Post';
        return res.send(Response);
    }
    WayaGramPost.postData({ description: { $regex: '.*' + req.query.q + '.*', '$options': 'i' }, isActive: true }, req.query.page || 1)
        .then((data) => {
            Response.data = data;
            Response.message = 'WayaGram Post';
            res.send(Response);
            return null;
        })
        .catch((e) => {
            next(e);
        });
}

module.exports = {
    index,
    search,
    getmyposts,
    getuserposts,
    repostComment,
    getMoments,
    getuserMoments,
    store,
    postLike,
    repost,
    update,
    destroy
};
