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
    // Special case for Baker and Spreader - they can be joined at the same time
    const isBakerOrSpreader = roleId === 'join_baker' || roleId === 'join_spreader';
    const otherDualRole = roleId === 'join_baker' ? 'join_spreader' : 'join_baker';
    
    // Check if user is already in the other dual role (baker/spreader)
    let isInOtherDualRole = false;
    if (isBakerOrSpreader) {
      const otherRoleMembers = partyData.roles[otherDualRole] || [];
      isInOtherDualRole = otherRoleMembers.some(member => 
        typeof member === 'string' ? member === userId : member.id === userId
      );
    }
    
    // For roles other than Baker/Spreader OR if not already in the other dual role,
    // remove from all current roles except the dual role
    if (!isBakerOrSpreader || !isInOtherDualRole) {
      // Remove from roles except the baker/spreader dual role if needed
      await removeUserFromRole(partyData, userId, isBakerOrSpreader ? otherDualRole : null);
    }
    
    // Add user to new role in the database if we have a party ID
    if (partyData.id) {
      await db.assignRole(partyData.id, userId, username, roleId);
    }
    
    // Update the in-memory data - only add if not already in this role
    const isAlreadyInRole = partyData.roles[roleId].some(member => 
      typeof member === 'string' ? member === userId : member.id === userId
    );
    
    if (!isAlreadyInRole) {
      partyData.roles[roleId].push({
        id: userId,
        username: username
      });
    }
    
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
 * Removes a user from their current role(s)
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @param {string|null} preserveRoleId Optional role ID to preserve (not remove)
 * @returns {Promise<boolean>} Success status
 */
async function removeUserFromRole(partyData, userId, preserveRoleId = null) {
  let removed = false;
  
  try {
    // If we're preserving a role (for the Baker/Spreader dual role case)
    // then we need to handle the database differently
    if (partyData.id) {
      if (preserveRoleId) {
        // Remove from database except the preserved role
        // This is complex with SQL, so we'll just delete all and re-add the one we want to keep
        await db.removeRole(partyData.id, userId);
        
        // Check if user is in the preserved role and get their username
        const preservedRole = partyData.roles[preserveRoleId] || [];
        const userInPreservedRole = preservedRole.find(user => 
          typeof user === 'string' ? user === userId : user.id === userId
        );
        
        // If they're in the preserved role, re-add it
        if (userInPreservedRole) {
          const username = typeof userInPreservedRole === 'string' ? 'Unknown User' : userInPreservedRole.username;
          await db.assignRole(partyData.id, userId, username, preserveRoleId);
        }
      } else {
        // No role to preserve, remove from all
        await db.removeRole(partyData.id, userId);
      }
    }
    
    // Update the in-memory data
    Object.keys(partyData.roles).forEach(roleId => {
      // Skip the role we want to preserve
      if (preserveRoleId && roleId === preserveRoleId) {
        return;
      }
      
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
      // Skip the role we want to preserve
      if (preserveRoleId && roleId === preserveRoleId) {
        return;
      }
      
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
 * Gets the current role(s) of a user
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @returns {Promise<string|null>} The role name(s), or null if no role
 */
async function getUserRole(partyData, userId) {
  try {
    // Check if user is in both Baker and Spreader roles
    const roles = [];
    const bakerRole = 'join_baker';
    const spreaderRole = 'join_spreader';
    
    // Check in-memory data for the roles the user has
    for (const roleId in partyData.roles) {
      // Handle both new format (objects with id/username) and old format (string IDs)
      const hasUser = partyData.roles[roleId].some(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (hasUser) {
        roles.push(roleId);
      }
    }
    
    // If user has no roles
    if (roles.length === 0) {
      return null;
    }
    
    // If user has both Baker and Spreader roles
    const hasBakerRole = roles.includes(bakerRole);
    const hasSpreaderRole = roles.includes(spreaderRole);
    
    if (hasBakerRole && hasSpreaderRole) {
      return `${config.roleMap[bakerRole]} & ${config.roleMap[spreaderRole]}`;
    }
    
    // Otherwise return the first role found
    return config.roleMap[roles[0]];
  } catch (error) {
    console.error('Error getting user role:', error);
    
    // Fallback to in-memory check
    const roles = [];
    
    for (const roleId in partyData.roles) {
      const hasUser = partyData.roles[roleId].some(user => 
        typeof user === 'string' ? user === userId : user.id === userId
      );
      
      if (hasUser) {
        roles.push(roleId);
      }
    }
    
    if (roles.length === 0) {
      return null;
    }
    
    // Check for the special Baker & Spreader dual role case
    const hasBakerRole = roles.includes('join_baker');
    const hasSpreaderRole = roles.includes('join_spreader');
    
    if (hasBakerRole && hasSpreaderRole) {
      return `${config.roleMap['join_baker']} & ${config.roleMap['join_spreader']}`;
    }
    
    return config.roleMap[roles[0]];
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
