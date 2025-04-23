const config = require('../config');
const db = require('./database');

/**
 * Creates data structure for a new cake party
 * @param {string} guildId The Discord guild ID
 * @param {string} channelId The Discord channel ID
 * @param {number} cakeCount The number of cakes to make (default: 1)
 * @returns {Promise<Object>} Initial party data structure
 */
async function createNewParty(guildId, channelId, cakeCount = 1) {
  try {
    // Create the party in the database
    const partyRecord = await db.createParty(guildId, channelId, cakeCount);
    
    // Format the party data in the expected structure
    const partyData = {
      id: partyRecord.id,
      createdAt: partyRecord.created_at,
      messageId: null,
      cakeCount: cakeCount,
      roles: {}
    };
    
    // Initialize empty arrays for each role
    Object.values(config.roles).forEach(role => {
      partyData.roles[role.id] = [];
    });
    
    return partyData;
  } catch (error) {
    console.error('Error creating new party:', error);
    
    // Fallback to in-memory data if database fails
    const partyData = {
      createdAt: Date.now(),
      messageId: null,
      cakeCount: cakeCount,
      roles: {}
    };
    
    // Initialize empty arrays for each role
    Object.values(config.roles).forEach(role => {
      partyData.roles[role.id] = [];
    });
    
    return partyData;
  }
}

/**
 * Updates the message ID for a party
 * @param {Object} partyData The cake party data
 * @param {string} messageId The Discord message ID
 * @returns {Promise<boolean>} Success status
 */
async function updatePartyMessageId(partyData, messageId) {
  try {
    if (partyData.id) {
      await db.updatePartyMessageId(partyData.id, messageId);
    }
    
    // Update the in-memory data as well
    partyData.messageId = messageId;
    return true;
  } catch (error) {
    console.error('Error updating party message ID:', error);
    // Still update the in-memory data
    partyData.messageId = messageId;
    return false;
  }
}

/**
 * Assigns a user to a specific role
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @param {string} username The Discord username
 * @param {string} roleId The role ID to assign
 * @returns {Promise<boolean>} Success status
 */
async function assignUserToRole(partyData, userId, username, roleId) {
  // Validate that the role exists
  if (!partyData.roles.hasOwnProperty(roleId)) {
    return false;
  }
  
  // Find the role
  const roleConfig = Object.values(config.roles).find(r => r.id === roleId);
  
  // Check if role is at max capacity
  if (roleConfig && roleConfig.maxMembers > 0) {
    const currentMembers = partyData.roles[roleId].length;
    if (currentMembers >= roleConfig.maxMembers) {
      return false; // Role is full
    }
  }
  
  try {
    // Remove user from any existing role first
    await removeUserFromRole(partyData, userId);
    
    // Add user to new role in the database if we have a party ID
    if (partyData.id) {
      await db.assignRole(partyData.id, userId, username, roleId);
    }
    
    // Update the in-memory data
    partyData.roles[roleId].push({
      id: userId,
      username: username
    });
    
    return true;
  } catch (error) {
    console.error('Error assigning user to role:', error);
    
    // Update the in-memory data anyway
    // Remove from any current role in memory
    Object.keys(partyData.roles).forEach(id => {
      partyData.roles[id] = partyData.roles[id].filter(user => 
        typeof user === 'string' ? user !== userId : user.id !== userId
      );
    });
    
    // Add to new role in memory
    partyData.roles[roleId].push({
      id: userId,
      username: username
    });
    
    return true;
  }
}

/**
 * Removes a user from their current role
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @returns {Promise<boolean>} Success status
 */
async function removeUserFromRole(partyData, userId) {
  let removed = false;
  
  try {
    // Remove from database if we have a party ID
    if (partyData.id) {
      await db.removeRole(partyData.id, userId);
    }
    
    // Update the in-memory data
    Object.keys(partyData.roles).forEach(roleId => {
      // Handle both new format (objects with id/username) and old format (string IDs)
      const userIndex = partyData.roles[roleId].findIndex(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (userIndex !== -1) {
        partyData.roles[roleId].splice(userIndex, 1);
        removed = true;
      }
    });
    
    return removed;
  } catch (error) {
    console.error('Error removing user from role:', error);
    
    // Update in-memory data anyway
    Object.keys(partyData.roles).forEach(roleId => {
      const userIndex = partyData.roles[roleId].findIndex(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (userIndex !== -1) {
        partyData.roles[roleId].splice(userIndex, 1);
        removed = true;
      }
    });
    
    return removed;
  }
}

/**
 * Gets the current role of a user
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @returns {Promise<string|null>} The role name, or null if no role
 */
async function getUserRole(partyData, userId) {
  try {
    // Try to get from database if we have a party ID
    if (partyData.id) {
      const roleId = await db.getUserRole(partyData.id, userId);
      if (roleId) {
        return config.roleMap[roleId];
      }
    }
    
    // Fallback to in-memory check
    for (const roleId in partyData.roles) {
      // Handle both new format (objects with id/username) and old format (string IDs)
      const hasUser = partyData.roles[roleId].some(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (hasUser) {
        return config.roleMap[roleId];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    
    // Fallback to in-memory check
    for (const roleId in partyData.roles) {
      const hasUser = partyData.roles[roleId].some(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (hasUser) {
        return config.roleMap[roleId];
      }
    }
    
    return null;
  }
}

/**
 * Loads party data from the database
 * @param {string} guildId The Discord guild ID
 * @param {string} channelId The Discord channel ID
 * @returns {Promise<Object|null>} The party data or null if not found
 */
async function loadPartyData(guildId, channelId) {
  try {
    const partyData = await db.getFullPartyData(guildId, channelId);
    
    if (!partyData) {
      return null;
    }
    
    // Make sure all role arrays are initialized
    Object.values(config.roles).forEach(role => {
      if (!partyData.roles[role.id]) {
        partyData.roles[role.id] = [];
      }
    });
    
    return partyData;
  } catch (error) {
    console.error('Error loading party data:', error);
    return null;
  }
}

/**
 * Deletes a party from the database
 * @param {string} guildId The Discord guild ID
 * @param {string} channelId The Discord channel ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteParty(guildId, channelId) {
  try {
    return await db.deleteParty(guildId, channelId);
  } catch (error) {
    console.error('Error deleting party:', error);
    return false;
  }
}

/**
 * Calculates the required ingredients for a role based on participants
 * @param {Object} partyData The cake party data
 * @param {string} roleId The role ID
 * @returns {Array} List of ingredient requirements
 */
function calculateRoleIngredients(partyData, roleId) {
  const role = Object.values(config.roles).find(r => r.id === roleId);
  if (!role) return [];
  
  const memberCount = partyData.roles[roleId].length;
  if (memberCount === 0) return role.baseIngredients;
  
  const cakeCount = partyData.cakeCount || 1;
  
  // Calculate ingredients based on role type and cake count
  return role.baseIngredients.map(ingredient => {
    // Base ingredient count per cake
    const baseCountPerCake = ingredient.count;
    // Total base count for all cakes
    const totalBaseCount = baseCountPerCake * cakeCount;
    
    // For roles that divide ingredients among members
    let countPerMember = totalBaseCount;
    if (memberCount > 0 && role.scalingFactor === 0) {
      // Evenly divide ingredients among all participants
      countPerMember = Math.ceil(totalBaseCount / memberCount);
    }
    
    return {
      emoji: ingredient.emoji,
      // Total count for the entire role group
      totalCount: totalBaseCount,
      // Count per member (for display purposes)
      countPerMember: countPerMember
    };
  });
}

module.exports = {
  createNewParty,
  updatePartyMessageId,
  assignUserToRole,
  removeUserFromRole,
  getUserRole,
  calculateRoleIngredients,
  loadPartyData,
  deleteParty
};
