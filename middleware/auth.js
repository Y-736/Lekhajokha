const { verifyToken } = require('../config/jwt');

// middlewares/auth.js
// middlewares/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (roles) => {
  return async (req, res, next) => {
    try {
      // 1. Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Authorization token required'
        });
      }

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
      
      // 3. Check role authorization
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // 4. For retailers, verify shop access
      if (decoded.role === 'retailer') {
        req.shopid = decoded.id; // Using 'id' from token as shopid
      }

      req.user = decoded;
      next();

    } catch (error) {
      console.error('JWT Error:', error.message);
      
      let message = 'Invalid token';
      if (error.name === 'TokenExpiredError') {
        message = 'Token expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Malformed token';
      }

      res.status(401).json({
        success: false,
        message
      });
    }
  };
};
module.exports = authenticate;