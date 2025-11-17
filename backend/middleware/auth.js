import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    console.log('🔐 Protect middleware - Headers:', req.headers);
    
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔐 Token found in header');
    } else {
      console.log('🔐 No token found in header');
    }

    if (!token) {
      console.log('🔐 No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No token'
      });
    }

    console.log('🔐 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('🔐 User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - User not found'
      });
    }

    console.log('🔐 User found:', user.email, user.role);
    req.user = user;
    next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - Token expired'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Add this authorize middleware function
export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorize middleware - User role:', req.user?.role);
    console.log('🔐 Authorize middleware - Allowed roles:', roles);
    
    if (!req.user) {
      console.log('🔐 Authorize - No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - No user'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('🔐 Authorize - User role not authorized');
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route. Required roles: ${roles.join(', ')}`
      });
    }

    console.log('🔐 Authorize - User authorized successfully');
    next();
  };
};