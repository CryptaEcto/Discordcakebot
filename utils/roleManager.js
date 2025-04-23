const config = require('../config');

/**
 * Creates data structure for a new cake party
 * @returns {Object} Initial party data structure
 */
function createNewParty() {
  const partyData = {
    createdAt: Date.now(),
    messageId: null,
    roles: {}
  };
  
  // Initialize empty arrays for each role
  Object.values(config.roles).forEach(role => {
    partyData.roles[role.id] = [];
  });
  
  return partyData;
}

/**
 * Assigns a user to a specific role
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @param {string} roleId The role ID to assign
 * @returns {boolean} Success status
 */
function assignUserToRole(partyData, userId, roleId) {
  // Validate that the role exists
  if (!partyData.roles.hasOwnProperty(roleId)) {
    return false;
  }
  
  // Remove user from any existing role first
  removeUserFromRole(partyData, userId);
  
  // Add user to new role
  partyData.roles[roleId].push(userId);
  return true;
}

/**
 * Removes a user from their current role
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @returns {boolean} Success status
 */
function removeUserFromRole(partyData, userId) {
  let removed = false;
  
  // Check all roles for the user
  Object.keys(partyData.roles).forEach(roleId => {
    const index = partyData.roles[roleId].indexOf(userId);
    if (index !== -1) {
      partyData.roles[roleId].splice(index, 1);
      removed = true;
    }
  });
  
  return removed;
}

/**
 * Gets the current role of a user
 * @param {Object} partyData The cake party data
 * @param {string} userId The Discord user ID
 * @returns {string|null} The role name, or null if no role
 */
function getUserRole(partyData, userId) {
  for (const roleId in partyData.roles) {
    if (partyData.roles[roleId].includes(userId)) {
      return config.roleMap[roleId];
    }
  }
  return null;
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
  
  // Scale ingredients based on member count
  return role.baseIngredients.map(ingredient => {
    const baseCount = ingredient.count;
    
    // Apply scaling for additional members
    let scaledCount = baseCount;
    if (memberCount > 1) {
      const additionalCount = Math.floor((memberCount - 1) * role.scalingFactor * baseCount);
      scaledCount += additionalCount;
    }
    
    return {
      emoji: ingredient.emoji,
      count: scaledCount
    };
  });
}

module.exports = {
  createNewParty,
  assignUserToRole,
  removeUserFromRole,
  getUserRole,
  calculateRoleIngredients
};
