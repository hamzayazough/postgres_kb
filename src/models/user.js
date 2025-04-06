const db = require('../config/db');

const userModel = {
  findByUsername: async (username) => {
    const res = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    return res.rows[0] || null;
  },
  
  findByEmail: async (email) => {
    const res = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    return res.rows[0] || null;
  },
  
  findById: async (id) => {
    const res = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] || null;
  },
  
  findByFirebaseId: async (firebaseUid) => {
    const res = await db.query("SELECT * FROM users WHERE firebase_uid = $1", [firebaseUid]);
    return res.rows[0] || null;
  },
  
  create: async (userData) => {
    const {
      firebase_uid,
      username,
      email,
      phone_number = null,
      first_name = null,
      last_name = null,
      profile_picture_url = null
    } = userData;
    
    const res = await db.query(
      `INSERT INTO users 
       (firebase_uid, username, email, phone_number, first_name, last_name, profile_picture_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`, 
      [
        firebase_uid,       
        username,           
        email,              
        phone_number,
        first_name,
        last_name,
        profile_picture_url
      ]
    );
    
    return res.rows[0];
  },
  
  
  
  update: async (id, userData) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const currentUserRes = await client.query(
        "SELECT * FROM users WHERE id = $1",
        [id]
      );
      
      if (currentUserRes.rows.length === 0) {
        throw new Error("User not found");
      }
      
      const currentUser = currentUserRes.rows[0];
      
      const updatedUser = {
        ...currentUser,
        ...userData,
        updated_at: new Date()
      };
      
      const updateRes = await client.query(
        `UPDATE users 
         SET username = $2, 
             email = $3, 
             phone_number = $4,
             first_name = $5,
             last_name = $6,
             profile_picture_url = $7,
             updated_at = $8
         WHERE id = $1
         RETURNING *`,
        [
          id,
          updatedUser.username,
          updatedUser.email,
          updatedUser.phone_number,
          updatedUser.first_name,
          updatedUser.last_name,
          updatedUser.profile_picture_url,
          updatedUser.updated_at
        ]
      );
      
      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  findOrCreate: async (username, email) => {
    let user = await userModel.findByUsername(username);
    
    if (!user) {
      user = await userModel.create({ username, email });
    }
    
    return user;
  },
  
  updateLastLogin: async (id) => {
    const now = new Date();
    const res = await db.query(
      `UPDATE users SET last_login_date = $2 WHERE id = $1 RETURNING *`,
      [id, now]
    );
    return res.rows[0];
  }
};

module.exports = userModel;