const { INTERNAL_SECRET } = require("../../config");

module.exports = function requireInternalKey(req, res, next) {
  const key = req.get('x-internal-key');
  if (key !== INTERNAL_SECRET) {
    return res.status(403).json({ auth:false, message:'Forbidden' });
  }
  next();
};

