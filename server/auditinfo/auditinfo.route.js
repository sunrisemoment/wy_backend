const express = require('express');
const auditCtrl = require('./auditinfo.controller');

const router = express.Router(); // eslint-disable-line new-cap

router.route('/')
    /**
      * GET /api/audit - Get list of Audit
      * @swagger
      * /audit:
      *   get:
      *     tags:
      *       - Audit
      *     description:  Get list of Audit
      *     responses:
      *        200:
      *           description: Get Audit Info
      *
      */
    .get(auditCtrl.list);


module.exports = router;
