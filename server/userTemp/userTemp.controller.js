
var Global = require('../helpers/global');
var Email = require('../helpers/email');
var _Response = require('../helpers/Response');
var uniqid = require('uniqid');
var APIError = require('../helpers/APIError');
var httpStatus = require('http-status');
var config = require('../../config/config');

const UserTemp = require('./userTemp.model');
const UserWallet = require('../userWallet/userWallet.model');


/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function store(req, res, next) {
  return new Promise((resolve, reject) => {
    UserTemp.findOne({ phone: req.body.phone }).then((userExists) => {
      if (userExists) {
        resolve(userExists);
        return null;
      }
      UserTemp.create({
        phone: req.body.phone,
        name: req.body.name || 'Non-Waya User'
      }).then((user) => {
        UserWallet.create({ userId: user._id, clearedBalance: 0, availableBalance: 0 });

        resolve(user);
        return null;
      });
      return null;
    });
    return null;
  });
}


function feedback(req, res, next){
    var Response = { ..._Response };
    var content = `Name : ${req.body.name}<br/>Email: ${req.body.email}<br/>Phone: ${req.body.phone}<br/>Feedback: ${req.body.feedback}`

    var body = {email:config.mailOptions.user}

    Email.sendEmails(body,"Waya | Feedback",content);

    Response.message = 'Your feedback has been submitted. Our representative will contact you soon';
    return res.send(Response);}


module.exports = {
    store,
    feedback
}
