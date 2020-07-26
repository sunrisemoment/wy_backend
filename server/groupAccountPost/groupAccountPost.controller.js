var Global = require('../helpers/global');
var _Response = require('../helpers/Response');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');

var GroupAccountPost = require('./groupAccountPost.model');
var WayaGramComments = require('../wayagramComments/wayagramComments.model');
var Notifications = require('../notifications/notifications.model');
var UserFollow = require('../userFollow/userFollow.model');
var User = require('../user/user.model');
var uniqid = require('uniqid');
const GroupAccount = require('../groupAccount/groupAccount.model');

var colorCodes = ["#075E54", "#128C7E", "#25D366", "#DCF8C6", "#34B7F1", "#ECE5DD", "#8DC44F", "#1CA45C", "#FFC718", "#FF9E0F", "#DA483B", "#4486F4"];


/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res, next) {
    var Response = { ..._Response };

    GroupAccount.findId(req.body.groupId).then(groupInfo => {

      if(!groupInfo){
        var err = new APIError("Group doesn't exists!", httpStatus.BAD_REQUEST);
        return next(err);
      }

      if(groupInfo.isPublic !== true){ // private post

        GroupAccount.findOneByQuery({ _id: groupInfo._id, followerIds: { $in: groupInfo.followerIds } }).then(followerId => {
          const follower = followerId.followerIds.find(id => id == req.user._id);
          if(follower){
            GroupAccountPost.postData({ group: followerId._id}).then(data => {

              Response.data = data;
              Response.message = 'All Private Posts';
              res.send(Response);
              return null;
            });
          } else {

              Response.message = 'You\'re not allow to view this post';
              res.send(Response);
              return null;
          }
        });
      } else { // public post

        GroupAccount.findOneByQuery({ _id: groupInfo._id }).then(followerId => {
            GroupAccountPost.postData({ group: followerId._id}).then(data => {

              Response.data = data;
              Response.message = 'All Public Posts';
              res.send(Response);
              return null;
            });
        });
      };
    });
}


/**
 *
 * @param {*} req
 * @param {*} res
 */
function getmyposts(req, res, next) {
    var Response = { ..._Response };
    GroupAccountPost.postData({ group: req.body.groupId, user: req.user._id, isActive: true }, req.query.page || 1).then((data) => {
        Response.data = data;
        Response.message = 'My Posts';
        res.send(Response);
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
            GroupAccountPost.postData({ userId: req.params.userId, isActive: true, isMoment: false }, req.query.page || 1).then((data) => {
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

    GroupAccount.findId(req.body.groupId).then(groupInfo => {

      if(!groupInfo){
        var err = new APIError("Group doesn't exists!", httpStatus.BAD_REQUEST);
        return next(err);
      }

      if(groupInfo.isPublic !== true){ // private post
        GroupAccount.findOneByQuery({ _id: groupInfo._id, followerIds: { $in: groupInfo.followerIds } }).then(followerId => {
          const follower = followerId.followerIds.find(id => id == req.user._id);

          if(follower){

            let groupPost = new GroupAccountPost({
              image: req.body.image,
              description: req.body.description,
              group: groupInfo._id,
              user: req.user._id,
              url:"/posts/"+uniqid('wg'),
              color: colorCodes[Math.floor(Math.random() * colorCodes.length)],
          });

          groupPost.save()
              .then((post) => {
                  GroupAccountPost.postDataId(post._id).then((post) => {
                      Response.data = post;
                      Response.message = 'Post Created';
                      res.send(Response);
                      return null;
                  })
                  return null;
              })
              .catch((e) => {
                  next(e);
              });
          } else {
            Response.message = 'You\'re not Authorize to Post in this group';
            res.send(Response);
            return null;
          }
          return null;
        });
      } else { // public group
        let groupPost = new GroupAccountPost({
          image: req.body.image,
          description: req.body.description,
          group: groupInfo._id,
          user: req.user._id,
          url:"/posts/"+uniqid('wg'),
          color: colorCodes[Math.floor(Math.random() * colorCodes.length)],
      })

      groupPost.save()
          .then((post) => {
              GroupAccountPost.postDataId(post._id).then((post) => {
                  Response.data = post;
                  Response.message = 'Post Created';
                  res.send(Response);
                  return null;
              })
              return null;
          })
          .catch((e) => {
              next(e);
          });
      }
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
    GroupAccountPost.findId(req.params.postId).then((post) => {

        var likeIndex = post.like.indexOf(req.params.userId);
        if (likeIndex !== -1) {
            post.like.splice(likeIndex, 1);
            Response.message = 'Post Un-Liked';

            content = req.user.firstName + " " + req.user.lastName + " unliked your post";

        } else {
            post.like = post.like.concat([req.params.userId]);
            Response.message = 'Post Liked';

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
            GroupAccountPost.postDataId(req.params.postId).then((_post) => {
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
    GroupAccountPost.findOneAndUpdate({ _id: req.params.postId, isActive: true, user: req.user._id }, { image: req.body.image, description: req.body.description })
        .then((data) => {
            GroupAccountPost.postDataId(req.params.postId).then((_post) => {
                Response.data = _post;
                Response.message = 'Post Updated';
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
    GroupAccountPost.findOneAndUpdate({ _id: req.params.postId, isActive: true, user: req.user._id }, { isActive: false })
        .then((data) => {
            Response.data = null;
            if (!data) {
                Response.message = 'Post Already Deleted';
                res.send(Response);
                return null;
            } else {
                if (data.userId != req.user._id) {
                    var err = new APIError('You can\'t delete other user post !', httpStatus.UNPROCESSABLE_ENTITY);
                    return next(err);
                }
                Response.message = 'Post Deleted';
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
        Response.message = 'Posts';
        return res.send(Response);
    }
    GroupAccountPost.postData({ description: { $regex: '.*' + req.query.q + '.*', '$options': 'i' }, isActive: true }, req.query.page || 1)
        .then((data) => {
            Response.data = data;
            Response.message = 'Posts';
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
    store,
    postLike,
    update,
    destroy
};
