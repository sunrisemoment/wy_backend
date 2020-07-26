const Audit = require('../auditinfo/auditinfo.model');


const dbActions = {
  ussd: 'ussd',
  register: 'register',
  create: 'create',
  update: 'update',
  delete: 'delete',
  loginemails: 'loginemails',
  emailsent: 'emailsent',
  smssent: 'smssent',
  rubie: 'rubie',
  print: 'print'
};

/**
 *
 * @param {*} userId
 * @param {*} objectId
 * @param {*} action
 * @param {*} detail
 */
function info(userId, objectId, action, detail) {
  Audit.create({
    userId,
    objectId,
    action,
    detail,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {User[]}
 */
function list(req, res, next) {
  const { limit = 50, skip = 0 } = req.query;
  Audit.list({ limit, skip })
    .then(users => res.json(users))
    .catch(e => next(e));
}


module.exports = { info, list, dbActions };
