const jwt = require('jsonwebtoken');
const { jwt_secret } = require('../../config/jwt');
const Admin = require('../../models/admin');

// Admin tokens last 90 days, so check the account on every request.
// Cached briefly; a deactivation takes effect within CACHE_MS.
const CACHE_MS = 30 * 1000;
const statusCache = new Map(); // adminId -> { ok, message, at }

async function adminStatus(adminId) {
  const hit = statusCache.get(adminId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit;
  const admin = await Admin.findById(adminId).select('isActive isVerified').lean();
  let status;
  if (!admin) status = { ok: false, message: 'Admin account not found' };
  else if (admin.isActive === false) status = { ok: false, message: 'Admin account is inactive' };
  else if (admin.isVerified === false) status = { ok: false, message: 'Admin account is not verified' };
  else status = { ok: true };
  statusCache.set(adminId, { ...status, at: Date.now() });
  return status;
}

const requireAdmin = (req, res, next) => {
    const authHeader = req.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      auth: false,
      message: 'Missing or malformed Authorization header',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      auth: false,
      message: 'No token provided',
    });
  }

  jwt.verify(token, jwt_secret, (err, payload) => {
    if (err) {
      return res.status(401).json({
        auth: false,
        message: 'Token expired or invalid',
        error: err.message,
      });
    }

    if (payload.role !== 'admin') {
      return res.status(403).json({
        auth: false,
        message: 'Forbidden: admin role required',
      });
    }

    req.user = payload;
    adminStatus(String(payload.id))
      .then(({ ok, message }) => {
        if (!ok) return res.status(403).json({ auth: false, message, error: 'Account inactive' });
        next();
      })
      .catch((e) => {
        console.error('admin auth status check failed:', e);
        return res.status(503).json({ auth: false, message: 'Service temporarily unavailable' });
      });
  });
};

module.exports = requireAdmin;