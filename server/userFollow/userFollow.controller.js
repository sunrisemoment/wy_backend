var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var UserFollow = require('./userFollow.model');
var User = require('../user/user.model');
var Notification = require('../notifications/notifications.controller');
var config = require('../../config/config');


/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };
    var followersCount = 1;

    if (req.body.userId == req.user._id) {
        var err = new APIError('You can\'t follow/un-follow yourself !', httpStatus.UNPROCESSABLE_ENTITY);
        return next(err);
    }

    User.findOneHiddenKey({ _id: req.body.userId }, 'isPrivate').then((user) => {

        if (!user) {
            var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }


        UserFollow.findOneByQuery({ userId: req.body.userId, isActive: true }).then((userFollow) => {

            if (!userFollow) {
                var _userFollow = new UserFollow({
                    followerIds: [req.user._id.toString()],
                    userId: req.body.userId,
                    followersCount: 1,
                    followingCount: 1
                });

                _userFollow.save().then((userFollow) => {
                    Response.message = "Successfully Followed";
                    res.send(Response);
                    return null;
                })
            }


            var followerId = userFollow.followerIds.indexOf(req.user._id);

            if (user.isPrivate == false) { // public profile

                if (followerId !== -1) {
                    Response.message = "Successfully Un-Followed";

                    userFollow.followerIds.splice(followerId, 1);
                    userFollow.followersCount = userFollow.followersCount - 1;
                    userFollow.tempFollowerIds.splice(req.user._id.toString(), 1);
                    userFollow.tempFollowingIds.splice(req.user._id.toString(), 1);
                    followersCount = -1;

                    Notification.storeNew("You have un-followed "+user.firstName+" "+user.lastName, "Un-Follow",'FOLLOW',req.user._id,req.body.userId);

                    UserFollow.findOneAndUpdate({ userId: req.user._id }, { $pull: { followingIds: req.body.userId }, $inc: { followingCount: followersCount } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {

                    });
                } else {
                    Response.message = "Successfully Followed";

                    Notification.storeNew("You have followed "+user.firstName+" "+user.lastName, "Following",'FOLLOW',req.user._id,req.body.userId);

                    userFollow.followerIds = userFollow.followerIds.concat([req.user._id.toString()]);
                    userFollow.followersCount = userFollow.followersCount + 1;
                    userFollow.tempFollowerIds.splice(req.user._id.toString(), 1);
                    userFollow.tempFollowingIds.splice(req.user._id.toString(), 1);

                    UserFollow.findOne({ userId: req.user._id.toString() }).then((follow) => {
                        follow.followingIds = follow.followingIds.concat([req.body.userId.toString()]);
                        follow.followingCount = follow.followingCount + 1;
                        follow.tempFollowingIds.splice(req.body.userId.toString(), 1);
                        follow.tempFollowerIds.splice(req.body.userId.toString(), 1);

                        follow.save().then(follows => {

                        })

                    });
                }
            } else { // private profile

                var followerIdTemp = userFollow.tempFollowerIds.indexOf(req.user._id);

                if (followerIdTemp !== -1) {
                    userFollow.tempFollowerIds.splice(followerIdTemp, 1);
                    Response.message = "Follow Request Removed";

                    Notification.storeNew("Follow request has been removed", "Follow Rejected",'FOLLOW',req.user._id,req.body.userId);

                    UserFollow.findOneAndUpdate({ userId: req.user._id }, { $pull: { tempFollowingIds: req.body.userId } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {

                    });
                } else {
                    userFollow.tempFollowerIds = userFollow.tempFollowerIds.concat([req.user._id.toString()]);
                    Response.message = "Follow Request Sent";

                    Notification.storeNew("Follow request has been sent", "Follow Sent",'FOLLOW',req.user._id,req.body.userId);

                    UserFollow.findOneAndUpdate({ userId: req.user._id }, { $push: { tempFollowingIds: req.body.userId } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {

                    });
                }
            }

            userFollow.save().then((data) => {

                res.send(Response);
                return null;
            })
            return null;
        });

    });
}


function profile(req, res, next) {
    var Response = { ..._Response };
    var profileData = {
        profile: null,
        isFollowing: 0,
        isRequested: 0,
        chatId: Global.getChatId(req.params.userId, req.user._id),
        profileCounts: {
            followersCount: 0,
            followingCount: 0
        }
    };

    User.findOneHiddenKey({ _id: req.params.userId, isActive: true }, 'isPrivate').then((profile) => {

        if (!profile) {
            var err = new APIError('User doesn\'t Exists !', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }

        UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myProfile) => {

            var followingIds = myProfile.followingIds.indexOf(req.params.userId);
            var tempFollowingIds = myProfile.tempFollowingIds.indexOf(req.params.userId);
            if (followingIds !== -1) {
                profileData.isFollowing = 1;
            } else {
                if (tempFollowingIds !== -1) {
                    profileData.isRequested = 1;
                }
            }


            UserFollow.findOne({ userId: req.params.userId, isActive: true }).then((miniProfile) => {


                profileData.profile = profile;
                profileData.profileCounts = {
                    followersCount: miniProfile.followersCount,
                    followingCount: miniProfile.followingCount,
                }

                Response.data = profileData;
                Response.message = "Profile Data";
                return res.send(Response);
            });
            return null;
        });
        return null;
    })

}


function profileDetailFollowing(req, res, next) {
    var Response = { ..._Response };

    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myprofileDetail) => {
        UserFollow.findOne({ userId: req.params.userId, isActive: true }).then((profileDetail) => {

            if (!profileDetail) {
                var err = new APIError('User doesn\'t Exists !', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            User.onlyBasicInfoPrivate({ $or: [{ _id: { $in: profileDetail.followingIds } }, { _id: { $in: profileDetail.tempFollowingIds } }], isActive: true }).then((data) => {

                data.forEach(element => {

                    element._doc.isRequested = 0;

                    var followingIds = myprofileDetail.followingIds.indexOf(element._id);
                    var tempFollowingIds = myprofileDetail.tempFollowingIds.indexOf(element._id.toString());

                    var tempFollowerIds = myprofileDetail.tempFollowerIds.indexOf(element._id.toString());

                    if (tempFollowerIds != -1) {
                        element._doc.acceptReject = 1;
                    } else {
                        element._doc.acceptReject = 0;
                    }

                    if (followingIds !== -1) {
                        element._doc.isFollowing = 1;
                    } else {
                        element._doc.isFollowing = 0;
                        if (tempFollowingIds !== -1) {
                            element._doc.isRequested = 1;
                        } else {
                            element._doc.isRequested = 0;
                        }
                    }

                });

                Response.data = data;
                Response.message = "Profile detail data";
                return res.send(Response);
            });
            return null;
        })
        return null;
    })

}


function profileDetailFollowingNot(req, res, next) {
    var Response = { ..._Response };

    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myprofileDetail) => {
        UserFollow.findOne({ userId: req.params.userId, isActive: true }).then((profileDetail) => {

            if (!profileDetail) {
                var err = new APIError('User doesn\'t Exists !', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            profileDetail.followingIds.push(req.params.userId);

            User.onlyBasicInfoPrivate({ _id: { $nin: profileDetail.followingIds }, isActive: true }).then((data) => {

                data.forEach(element => {

                    element._doc.isRequested = 0;

                    var followingIds = myprofileDetail.followingIds.indexOf(element._id);
                    var tempFollowingIds = myprofileDetail.tempFollowingIds.indexOf(element._id.toString());
                    var tempFollowerIds = myprofileDetail.tempFollowerIds.indexOf(element._id.toString());

                    if (tempFollowerIds != -1) {
                        element._doc.acceptReject = 1;
                    } else {
                        element._doc.acceptReject = 0;
                    }

                    if (followingIds !== -1) {
                        element._doc.isFollowing = 1;
                    } else {
                        element._doc.isFollowing = 0;
                        if (tempFollowingIds !== -1) {
                            element._doc.isRequested = 1;
                        } else {
                            element._doc.isRequested = 0;
                        }
                    }

                });

                Response.data = data;
                Response.message = "Profile detail data";
                return res.send(Response);
            });
            return null;
        })
        return null;
    })

}



function profileDetailFollowers(req, res, next) {
    var Response = { ..._Response };

    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myprofileDetail) => {
        UserFollow.findOne({ userId: req.params.userId, isActive: true }).then((profileDetail) => {

            if (!profileDetail) {
                var err = new APIError('User doesn\'t Exists !', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            User.onlyBasicInfoPrivate({ $or: [{ _id: { $in: profileDetail.followerIds } }, { _id: { $in: profileDetail.tempFollowerIds } }], isActive: true }).then((data) => {


                data.forEach(element => {

                    element._doc.isRequested = 0;

                    var followingIds = myprofileDetail.followingIds.indexOf(element._id.toString());
                    var tempFollowingIds = myprofileDetail.tempFollowingIds.indexOf(element._id.toString());

                    var tempFollowerIds = myprofileDetail.tempFollowerIds.indexOf(element._id.toString());

                    if (tempFollowerIds != -1) {
                        element._doc.acceptReject = 1;
                    } else {
                        element._doc.acceptReject = 0;
                    }

                    if (followingIds !== -1) {
                        element._doc.isFollowing = 1;
                        element._doc.isRequested = 0;
                    } else {
                        element._doc.isFollowing = 0;
                        if (tempFollowingIds !== -1) {
                            element._doc.isRequested = 1;
                        } else {
                            element._doc.isRequested = 0;
                        }
                    }

                });

                Response.data = data;
                Response.message = "Profile detail data";
                return res.send(Response);
            });
            return null;
        })
        return null;
    })

}


function profileDetailFollowersNot(req, res, next) {
    var Response = { ..._Response };

    UserFollow.findOne({ userId: req.user._id, isActive: true }).then((myprofileDetail) => {
        UserFollow.findOne({ userId: req.params.userId, isActive: true }).then((profileDetail) => {

            if (!profileDetail) {
                var err = new APIError('User doesn\'t Exists !', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            profileDetail.followerIds.push(req.params.userId);

            User.onlyBasicInfoPrivate({ _id: { $nin: profileDetail.followerIds }, isActive: true }).then((data) => {


                data.forEach(element => {

                    element._doc.isRequested = 0;

                    var followingIds = myprofileDetail.followingIds.indexOf(element._id);
                    var tempFollowerIds = myprofileDetail.tempFollowerIds.indexOf(element._id.toString());

                    var tempFollowerIds = myprofileDetail.tempFollowerIds.indexOf(element._id.toString());

                    if (tempFollowerIds != -1) {
                        element._doc.acceptReject = 1;
                    } else {
                        element._doc.acceptReject = 0;
                    }

                    if (tempFollowerIds != -1) {
                        element._doc.acceptReject = 1;
                    } else {
                        element._doc.acceptReject = 0;
                    }


                    if (followingIds !== -1) {
                        element._doc.isFollowing = 1;
                    } else {
                        element._doc.isFollowing = 0;
                        if (tempFollowingIds !== -1) {
                            element._doc.isRequested = 1;
                        } else {
                            element._doc.isRequested = 0;
                        }
                    }

                });

                Response.data = data;
                Response.message = "Profile detail data";
                return res.send(Response);
            });
            return null;
        })
        return null;
    })

}



function acceptReject(req, res, next) {
    var Response = { ..._Response };
    var followersCount = 1;

    req.body.status = req.body.status || false;

    if (req.body.userId == req.user._id) {
        var err = new APIError('You can\'t follow/un-follow yourself !', httpStatus.UNPROCESSABLE_ENTITY);
        return next(err);
    }

    User.findOne({ _id: req.body.userId }).then((user) => {

        if (!user) {
            var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }


        UserFollow.findOneByQuery({ userId: req.user._id, isActive: true }).then((userFollow) => {

            if (!userFollow) {
                var err = new APIError('Something went wrong!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            var followerIdTemp = userFollow.tempFollowerIds.indexOf(req.body.userId);
            var followerId = userFollow.followerIds.indexOf(req.body.userId);


            if (req.body.status == 0) {
                userFollow.tempFollowerIds.splice(followerIdTemp, 1);
                Response.message = "Follow Request Rejected";

                Notification.storeNew("Your request has been rejected", "Follow Rejected",'FOLLOW',req.body.userId,req.user._id);

                UserFollow.findOneAndUpdate({ userId: req.body.userId }, { $pull: { tempFollowingIds: req.user._id.toString() } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then((data) => {

                    userFollow.save().then((data) => {

                        res.send(Response);
                        return null;
                    })
                    return null;
                });
            } else {
                userFollow.tempFollowerIds.splice(followerIdTemp, 1);
                Response.message = "Follow Request Accepted";

                Notification.storeNew("Your request has been Accepeted", "Follow Accepetd",'FOLLOW',req.body.userId,req.user._id);

                UserFollow.findOneAndUpdate({ userId: req.body.userId }, { $pull: { tempFollowingIds: req.user._id.toString() } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {
                    if (followerId == -1) {
                        userFollow.followerIds = userFollow.followerIds.concat([req.body.userId.toString()]);
                        userFollow.followersCount = userFollow.followersCount + 1;
                        followersCount = 1;

                        UserFollow.findOneAndUpdate({ userId: req.body.userId }, { $push: { followingIds: req.user._id.toString() }, $inc: { followingCount: followersCount } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {
                            userFollow.save().then((data) => {

                                res.send(Response);
                                return null;
                            })
                            return null;
                        });
                        return null;
                    }
                });
                return null;
            }


            return null;
        });

    });
}


module.exports = {
    index,
    profile,
    profileDetailFollowing,
    profileDetailFollowingNot,
    profileDetailFollowers,
    profileDetailFollowersNot,
    acceptReject
};
