const express = require('express');
const validate = require('express-validation');
const expressJwt = require('express-jwt');
const paramValidation = require('../../config/param-validation');
const auth = require('./auth.service');
const authCtrl = require('./auth.controller');
const userCtrl = require('../user/user.controller');
const config = require('../../config/config');

const router = express.Router(); // eslint-disable-line new-cap

/** POST /api/auth/login - Returns token if correct username and password is provided */
/**
  * @swagger
  * /auth/login:
  *   post:
  *     tags:
  *         - Login
  *     description:  Returns token if correct username and password is provided
  *     consumes:
  *       - application/json
  *     produces:
  *       - application/json
  *     parameters:
  *       - name: Enter User name & Password
  *         description: Login of user
  *         in: body
  *         schema:
  *           type: object
  *           required:
  *               - identifier
  *               - password
  *           properties:
  *              identifier:
  *                 type:string
  *                 description:Enter User Name
  *              password:
  *                 type:string
  *                 description:Enter Password
  *           example:
  *             identifier: "admin@super.com"
  *             password: "123456"
  *     responses:
  *        200:
  *           description: Get Token & Profile Info
  *        400:
  *           description: Bad Input Field
  *        404:
  *           description: No User Found
  *        401:
  *           description: Incorrect Password
  *
  */
router.route('/login')
  .post(validate(paramValidation.login), authCtrl.login);

  // agent login route
router.route('/agent/login')
  .post(validate(paramValidation.login), authCtrl.agentLogin);

/**
  * @swagger
  * /auth/parse-jwt:
  *   get:
  *     tags:
  *       - Login
  *       - JWT
  *     security:
  *       - JWT: []
  *     description:  needs token returned by the above as header. Authorization Bearer {token}
  *     responses:
  *        200:
  *           description: Get Parsed Token
  *        401:
  *           description: Un-Authorized
  *
  */
router.route('/parse-jwt')
  .get(expressJwt({ secret: config.jwtSecret }), authCtrl.getRandomNumber);

/**
  * @swagger
  * /auth/me:
  *   get:
  *     tags:
  *       - User Profile
  *       - Users
  *     security:
  *       - JWT: []
  *     description:  needs token returned by the above as header. Authorization Bearer {token}
  *     responses:
  *        200:
  *           description: Get Auth User Profile
  *        401:
  *           description: Un-Authorized
  *
  */
router.route('/me')
   .get(auth.isAuthenticated(), userCtrl.index);

module.exports = router;
