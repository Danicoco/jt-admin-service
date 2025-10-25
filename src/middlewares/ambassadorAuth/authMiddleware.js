const jwt = require('jsonwebtoken');
const { jwt_secret } = require('../../config/jwt'); 

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
    next();
  });
};

module.exports = requireAdmin;