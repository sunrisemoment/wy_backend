var Global = require("../helpers/global");
var _Response = require("../helpers/Response");
var APIError = require("../helpers/APIError");
var httpStatus = require("http-status");
var GroupAccount = require("./groupAccount.model");
var User = require("../user/user.model");
var Notification = require("../notifications/notifications.controller");
var config = require("../../config/config");

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
  const Response = { ..._Response };

  GroupAccount.findByQuery({ userId: req.user._id }).then((data) => {
    Response.data = data;
    Response.message = "All Groups";
    res.send(Response);
    return null;
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function store(req, res, next) {
  const Response = { ..._Response };

  const convertImage = Global.encodeBase64Image(req.body.image);

  let newGroupAccount = new GroupAccount({
    name: req.body.name,
    description: req.body.description,
    isPublic: req.body.isPublic,
    user: req.user._id,
    type: req.body.type,
    image: convertImage,
  });

  newGroupAccount.save().then((group) => {
    Response.data = group;
    Response.message = `${group.name} Created Successfully`;
    res.send(Response);
    return null;
  });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function joinGroup(req, res, next) {
  var Response = { ..._Response };

  GroupAccount.findId(req.body.groupId).then((joinAccount) => {
    if (joinAccount.isPublic === true) {
      // public group
      const user = joinAccount.followerIds.indexOf(req.user._id);

      if (user !== -1) {
        joinAccount.followerIds.splice(req.user._id, 1);

        Notification.storeNew(
          "You have Leave " + joinAccount.name,
          "Leave Group",
          "JOIN",
          req.user._id,
          req.body.groupId
        );

        Response.message = "You Have Leave Group";
        GroupAccount.findOneAndUpdate(
          { _id: joinAccount._id },
          {
            $pull: { followerIds: req.user._id.toString() },
            $inc: { followersCount: (followersCount = -1) },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
          .exec()
          .then(() => {});
      } else {
        Response.message = "You Have Join Group";
        GroupAccount.findId(joinAccount._id).then((data) => {
          data.followerIds = data.followerIds.concat([req.user._id.toString()]);
          data.followersCount = joinAccount.followersCount + 1;
          data.save().then((d) => {});
        });
      }
    } else {
      // private group

      const tempJoinId = joinAccount.followerIds.indexOf(req.user._id);

      if (tempJoinId !== -1) {
        Response.message = " You Leave Group";
        joinAccount.followersCount.splice(tempJoinId, 1);

        Notification.storeNew(
          "Leave Group",
          "Join Group Rejected",
          "JOIN",
          req.user._id,
          req.body.groupId
        );

        GroupAccount.findOneAndUpdate(
          { _id: joinAccount._id },
          { $pull: { tempFollowerIds: req.user._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
          .exec()
          .then(() => {});
      } else {
        joinAccount.tempFollowerIds = joinAccount.tempFollowerIds.concat([
          req.user._id.toString(),
        ]);
        Response.message = "Join Request Sent";

        Notification.storeNew(
          "Join Request has been sent",
          "Join Request",
          "JOIN",
          req.user._id,
          req.body.groupId
        );

        GroupAccount.findOneAndUpdate(
          { _id: joinAccount._id },
          { $push: { tempFollowerIds: req.user._id } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
          .exec()
          .then(() => {});
      }
    }
    joinAccount.save().then((data) => {
      res.send(Response);
      return null;
    });
    return null;
  });
}

function profile(req, res, next) {
  var Response = { ..._Response };

  GroupAccount.findId(req.params.groupId).then((groupProfile) => {
    if (!groupProfile) {
      var err = new APIError(
        "Group doesn't Exists !",
        httpStatus.UNPROCESSABLE_ENTITY
      );
      return next(err);
    }

    if (groupProfile.isPublic !== true) {
      Response.data = {
        name: groupProfile.name,
        description: groupProfile.description,
        image: groupProfile.image,
        followers: groupProfile.followersCount,
        isPublic: groupProfile.isPublic,
      };
      Response.message = `${groupProfile.name} Details`;
      res.send(Response);
      return null;
    } else {
      Response.data = groupProfile;
      Response.message = `${groupProfile.name} Details`;
      res.send(Response);
      return null;
    }
  });
}

function groupFollowers(req, res, next) {
  var Response = { ..._Response };

  GroupAccount.findOneByQuery({ _id: req.params.groupId}).then(groupFollowers => {
    User.onlyBasicInfoPrivate({ $or: [{ _id: { $in: groupFollowers.followerIds } }, { _id: { $in: groupFollowers.tempFollowerIds } }], isActive: true }).then((data) => {
      Response.data = data;
      Response.message = "Profile detail data";
      return res.send(Response);
    });
    return null;
  });
}

 function acceptReject(req, res, next) {
      var Response = { ..._Response };
      var followersCount = 1;

      User.findOne({ _id: req.user._id }).then((user) => {

        if (!user) {
            var err = new APIError('User doesn\'t exists!', httpStatus.UNPROCESSABLE_ENTITY);
            return next(err);
        }

        GroupAccount.findOneByQuery({ _id: req.body.groupId, userId: req.user._id, isActive: true }).then((userFollow) => {

            if (!userFollow) {
                var err = new APIError('Something went wrong!', httpStatus.UNPROCESSABLE_ENTITY);
                return next(err);
            }

            var followerIdTemp = userFollow.tempFollowerIds.indexOf(req.body.userId);
            var followerId = userFollow.followerIds.indexOf(req.body.userId);

            if (req.body.status == 0) {
                userFollow.tempFollowerIds.splice(followerIdTemp, 1);
                Response.message = "Follow Request Rejected";

                Notification.storeNew("Your request has been rejected", "Join Rejected",'JOIN',req.body.userId,req.user._id);

                GroupAccount.findOneAndUpdate({ userId: req.user._id }, { $pull: { tempFollowerIds: req.body.userId.toString() } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then((data) => {

                    userFollow.save().then((data) => {

                        res.send(Response);
                        return null;
                    })
                    return null;
                });
            } else {
                userFollow.tempFollowerIds.splice(followerIdTemp, 1);
                Response.message = "Join Request Accepted";

                Notification.storeNew("Your request has been Accepted", "Join Accepted",'JOIN',req.body.userId,req.user._id);

                GroupAccount.findOneAndUpdate({ userId: req.user._id }, { $pull: { tempFollowerIds: req.body.userId.toString() } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {
                    if (followerId == -1) {
                        userFollow.followerIds = userFollow.followerIds.concat([req.body.userId.toString()]);
                        userFollow.followersCount = userFollow.followersCount + 1;
                        followersCount = 1;

                        GroupAccount.findOneAndUpdate({ userId: req.user._id }, { $push: { followerIds: req.user._id.toString() }, $inc: { followersCount: followersCount } }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec().then(() => {
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
  store,
  joinGroup,
  profile,
  groupFollowers,
  acceptReject
};
