const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap

// TS: These routes should be used for working with internal user only. Hence relevant parameters must be passed accordingly

router.route('/faq').get((req, res) => {
  res.sendfile('public/static/legal/faq.html');
});

router.route('/terms-and-conditons').get((req, res) => {
  res.sendfile('public/static/legal/tc.html');
});

router.route('/about').get((req, res) => {
  res.sendfile('public/static/legal/about.html');
});

router.route('/feedback').get((req, res) => {
  res.sendfile('public/static/legal/feedback.html');
});
router.route('/payment_security').get((req, res) => {
  res.sendfile('public/static/legal/payment_security.html');
});

module.exports = router;
