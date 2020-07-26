const logger = require('../../config/winston');
const Global = require('./global');
const nodemailer = require('nodemailer');
const config = require('../../config/config');
const Audit = require('../../server/auditinfo/auditinfo.controller');

let transport = null;
let emailOptions = {};


/**
 *  Get Setting from DB
 */
function getSettings(callback) {
  emailOptions = {
    host: config.mailOptions.host,
    hostPort: config.mailOptions.hostPort,
    auth: {
      user: config.mailOptions.user,
      pass: config.mailOptions.pass
    }
  };
  // console.log(emailOptions);
  transport = nodemailer.createTransport(emailOptions);
  callback();
}

function sendLoginEmail(req, request) {
  const user = req.user;
  if (!user.email) { return; }
  const message = {
    from: config.mailOptions.from,
    to: user.email,
    subject: `New Login from Account at ${new Date()}`,
    text: `New Login from Account at ${new Date()}`,
    html: `
      IP: ${Global.getIpAddress(request)}<br/>
      Device: ${Global.getBrowser(request)}<br/>
      Account Name : ${user.firstName} ${user.lastName}<br/>
      Date: ${new Date()}
    `
  };

  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.loginemails, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.loginemails, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}


/**
 *
 */
function emailCheck() {
  const message = {
    from: config.mailOptions.from,
    to: 'teslim.abdulafeez@wayapaychat.com',
    subject: `Server Started at ${new Date()}`,
    text: 'Server Started',
    html: `Server Started at ${new Date()}`
  };

  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}


function systemError(stacktrace) {
  const message = {
    from: config.mailOptions.from,
    to: 'teslim.abdulafeez@wayapaychat.com',
    subject: `Server Started at ${new Date()}`,
    text: 'System has some exceptions in code please review',
    html: `Server Exception at ${new Date()}<br/> ${stacktrace}`
  };

  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

/**
 *
 * @param {*} to
 * @param {*} html
 */
function verifyNewUser(to, html) {
  const message = {
    from: emailOptions.auth.user,
    to,
    subject: 'Verify your email id',
    text: 'Verify your email id',
    html
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

/**
 *
 * @param {*} to
 * @param {*} html
 */
function forgotPassword(to, html) {
  if (!emailOptions.auth.user) { getSettings(); }
  const message = {
    from: emailOptions.auth.user,
    to,
    subject: 'Forgot Password',
    text: 'Forgot Password',
    html
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

function sendEmails(user, subject, html) {
  if (!emailOptions.auth.user) { getSettings(); }
  if (!user.email) {
    return logger.log({
      level: 'error',
      message: 'Email Not found'
    });
  }
  const message = {
    from: emailOptions.auth.user,
    to: user.email,
    subject,
    text: subject,
    html
  };

  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}

/**
 *
 */
function userEmailOTPCheck(user, subject, html) {
  const message = {
    from: config.mailOptions.from,
    to: user.email,
    subject,
    text: subject,
    html
  };

  transport.sendMail(message, (error, info) => {
    if (error) {
      Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, error });
      return logger.log({
        level: 'error',
        message: error
      });
    }

    Audit.info(config.admin.userId, null, Audit.dbActions.emailsent, { html: message.html, info });
    logger.log({
      level: 'info',
      message: `Message sent: ${info.messageId}`
    });
    return null;
  });
}


// init email service

getSettings(emailCheck);

module.exports = { verifyNewUser, forgotPassword, getSettings, sendEmails, systemError, sendLoginEmail, userEmailOTPCheck };
