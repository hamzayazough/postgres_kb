const { auth } = require('../config/firebase');
const userModel = require('../models/user');

const authService = {
  /**
   * Verify Firebase ID token and get user info
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<Object>} - User info
   */
  verifyIdToken: async (idToken) => {
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      throw new Error('Invalid authentication token');
    }
  },

  /**
   * Get or create user in our database based on Firebase user
   * @param {Object} firebaseUser - Firebase user object
   * @returns {Promise<Object>} - User from our database
   */
  findOrCreateUser: async (firebaseUser) => {
    const { uid, email, phone_number, name } = firebaseUser;
    console.log('Firebase user:', firebaseUser);
    
    // Try to find user by Firebase UID
    let user = await userModel.findByFirebaseId(uid);
    console.log('User found:', user, uid);
    
    if (!user) {
      // Extract first and last name if available
      let firstName = null;
      let lastName = null;
      
      if (name) {
        const nameParts = name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      }
      console.log("creating user if not found", uid);
      // Create new user if not found
      user = await userModel.create({
        firebase_uid: uid,
        username: email.split('@')[0], // Default username from email
        email,
        phone_number,
        first_name: firstName,
        last_name: lastName
      });
    }
    
    console.log("updating last login", user.id);
    await userModel.updateLastLogin(user.id);
    
    return user;
  },

  /**
   * Get authenticated user from request
   * @param {Object} req - Express request object
   * @returns {Promise<Object|null>} - User object or null if not authenticated
   */
  getAuthenticatedUser: async (req) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await authService.verifyIdToken(idToken);
      return await authService.findOrCreateUser(decodedToken);
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

};

module.exports = authService;