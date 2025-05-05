const jwt = require('jsonwebtoken');

const authenticate = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // 1. Get token from header
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        return res.status(401).json({ 
          success: false,
          message: 'Authorization header missing'
        });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: 'Token not found in header'
        });
      }

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug log

      // 3. Check if user has required role
      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      // 4. Attach user to request
      req.user = decoded;
      next();

    } catch (error) {
      console.error('Authentication error:', error);
      
      let message = 'Authentication failed';
      if (error.name === 'TokenExpiredError') {
        message = 'Token expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }

      res.status(401).json({
        success: false,
        message
      });
    }
  };
};

module.exports = authenticate;