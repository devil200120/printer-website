const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify user authentication
exports.isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies || {};
    
    // Check if token exists in headers if not in cookies
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    const finalToken = token || headerToken;

    if (!finalToken) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource',
      });
    }

    const decodedData = jwt.verify(finalToken, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decodedData.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

// Admin authorization
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user.role}) is not allowed to access this resource`,
      });
    }
    next();
  };
};