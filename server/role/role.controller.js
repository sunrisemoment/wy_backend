const Roles = require('./role.model');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function getInternalRoles(req, res, next) {
  Roles.get({ userType: 'internal' })
        .then((model) => {
          res.json({ data: model, totalRecords: model.length });
        })
        .catch(e => next(e));
}

module.exports = {
  getInternalRoles
};
