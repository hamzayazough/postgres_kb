const authService = require('../../services/auth-service');

const authMiddleware = async (req, res, next) => {
  try {
    const user = await authService.getAuthenticatedUser(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = null;
    next();
  }
};


const requireAuth = async (req, res, next) => {
  try {
    const user = await authService.getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        errors: [{
          message: 'You must be logged in to access this resource'
        }]
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      errors: [{
        message: 'Authentication error'
      }]
    });
  }
};

module.exports = { 
  authMiddleware,
  requireAuth
};