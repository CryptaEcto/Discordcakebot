/**
 * Database operations for the Cake Party Bot
 */
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize database tables
async function initDatabase() {
  try {
    // Create parties table to store active cake parties
    await pool.query(`
      CREATE TABLE IF NOT EXISTS parties (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        cake_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(guild_id, channel_id)
      )
    `);

    // Create roles table to store user role assignments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_assignments (
        id SERIAL PRIMARY KEY,
        party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(party_id, user_id)
      )
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

/**
 * Create a new cake party
 * @param {string} guildId Guild ID
 * @param {string} channelId Channel ID
 * @param {number} cakeCount Number of cakes
 * @returns {Promise<Object|null>} Party data or null
 */
async function createParty(guildId, channelId, cakeCount) {
  try {
    // Delete existing party in the same channel if it exists
    await pool.query(
      'DELETE FROM parties WHERE guild_id = $1 AND channel_id = $2',
      [guildId, channelId]
    );

    // Create new party
    const result = await pool.query(
      `INSERT INTO parties (guild_id, channel_id, cake_count) 
       VALUES ($1, $2, $3) 
       RETURNING id, guild_id, channel_id, message_id, cake_count, created_at`,
      [guildId, channelId, cakeCount]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating party:', error);
    return null;
  }
}

/**
 * Update a party's message ID
 * @param {number} partyId Party ID
 * @param {string} messageId Message ID to store
 * @returns {Promise<boolean>} Success status
 */
async function updatePartyMessageId(partyId, messageId) {
  try {
    await pool.query(
      'UPDATE parties SET message_id = $1 WHERE id = $2',
      [messageId, partyId]
    );
    return true;
  } catch (error) {
    console.error('Error updating party message ID:', error);
    return false;
  }
}

/**
 * Get a party by guild and channel ID
 * @param {string} guildId Guild ID
 * @param {string} channelId Channel ID
 * @returns {Promise<Object|null>} Party data or null
 */
async function getParty(guildId, channelId) {
  try {
    const result = await pool.query(
      'SELECT * FROM parties WHERE guild_id = $1 AND channel_id = $2',
      [guildId, channelId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting party:', error);
    return null;
  }
}

/**
 * Delete a party by guild and channel ID
 * @param {string} guildId Guild ID
 * @param {string} channelId Channel ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteParty(guildId, channelId) {
  try {
    await pool.query(
      'DELETE FROM parties WHERE guild_id = $1 AND channel_id = $2',
      [guildId, channelId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting party:', error);
    return false;
  }
}

/**
 * Assign a user to a role in a party
 * @param {number} partyId Party ID
 * @param {string} userId User ID
 * @param {string} username User's Discord username
 * @param {string} roleId Role ID
 * @returns {Promise<boolean>} Success status
 */
async function assignRole(partyId, userId, username, roleId) {
  try {
    // Remove any existing role for this user in this party
    await pool.query(
      'DELETE FROM role_assignments WHERE party_id = $1 AND user_id = $2',
      [partyId, userId]
    );
    
    // Assign the new role with username
    await pool.query(
      `INSERT INTO role_assignments (party_id, user_id, username, role_id)
       VALUES ($1, $2, $3, $4)`,
      [partyId, userId, username, roleId]
    );
    
    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Remove a user's role in a party
 * @param {number} partyId Party ID
 * @param {string} userId User ID
 * @returns {Promise<boolean>} Success status
 */
async function removeRole(partyId, userId) {
  try {
    await pool.query(
      'DELETE FROM role_assignments WHERE party_id = $1 AND user_id = $2',
      [partyId, userId]
    );
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
}

/**
 * Get all role assignments for a party
 * @param {number} partyId Party ID
 * @returns {Promise<Object|null>} Object with roleId keys and arrays of user data objects
 */
async function getPartyRoles(partyId) {
  try {
    const result = await pool.query(
      'SELECT role_id, user_id, username FROM role_assignments WHERE party_id = $1',
      [partyId]
    );
    
    // Format the results into the expected structure
    const roles = {};
    
    result.rows.forEach(row => {
      if (!roles[row.role_id]) {
        roles[row.role_id] = [];
      }
      
      // Store both user ID and username in the roles object
      roles[row.role_id].push({
        id: row.user_id,
        username: row.username || 'Unknown User' // Fallback if username not stored
      });
    });
    
    return roles;
  } catch (error) {
    console.error('Error getting party roles:', error);
    return null;
  }
}

/**
 * Get a user's role in a party
 * @param {number} partyId Party ID
 * @param {string} userId User ID
 * @returns {Promise<string|null>} Role ID or null
 */
async function getUserRole(partyId, userId) {
  try {
    const result = await pool.query(
      'SELECT role_id FROM role_assignments WHERE party_id = $1 AND user_id = $2',
      [partyId, userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].role_id;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Get full party data including role assignments
 * @param {string} guildId Guild ID
 * @param {string} channelId Channel ID
 * @returns {Promise<Object|null>} Party data with roles
 */
async function getFullPartyData(guildId, channelId) {
  try {
    // Get party data
    const party = await getParty(guildId, channelId);
    if (!party) {
      return null;
    }
    
    // Get role assignments
    const roles = await getPartyRoles(party.id);
    
    // Format the data in the expected structure
    return {
      id: party.id,
      createdAt: party.created_at,
      messageId: party.message_id,
      cakeCount: party.cake_count,
      roles: roles || {}
    };
  } catch (error) {
    console.error('Error getting full party data:', error);
    return null;
  }
}

// Export database functions
module.exports = {
  initDatabase,
  createParty,
  updatePartyMessageId,
  getParty,
  deleteParty,
  assignRole,
  removeRole,
  getPartyRoles,
  getUserRole,
  getFullPartyData
};