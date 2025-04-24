const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const roleManager = require('./roleManager');

/**
 * Creates the help embed for the cake party bot
 * @returns {EmbedBuilder} The formatted help embed
 */
function createHelpEmbed() {
  return new EmbedBuilder()
    .setColor(config.colors.help)
    .setTitle('🥳🎉🎈  Cake Party Help  🎈🎉🥳')
    .setDescription(
      'Welcome to the Cake Party Bot!\n\n' +
      '**Commands:**\n' +
      '• **!startcakeparty [number]** - (Mod only) Start a new cake party to make the specified number of cakes\n' +
      '• **!readysetbake** - (Mod only) Display a party-ready message with helpful tips when all roles are filled\n' +
      '• **!endcake** - (Mod only) End the current cake party and see a summary\n' +
      '• **!cakehelp** - Show this help message (anyone can use)\n\n' +
      '**How to participate:**\n' +
      '• Click a role button to join that role\n' +
      '• Each role requires specific ingredients\n' +
      '• Ingredient requirements can increase/decrease based on how many people join each role and the number of cakes\n' +
      '• Click **Leave Role** to give up your current role'
    )
    .setFooter({ text: 'Let\'s get baking! 🧁' });
}

/**
 * Creates the party signup embed with updated role information
 * @param {Object} partyData Current state of the cake party
 * @returns {Object} Object containing embed and components for the message
 */
function createPartyEmbed(partyData) {
  // Create description with role information and requirements
  let description = '';
  
  // Show number of cakes
  const cakeCount = partyData.cakeCount || 1;
  description += `**🎂 Making ${cakeCount} cake${cakeCount > 1 ? 's' : ''}! 🎂**\n\n`;
  
  Object.values(config.roles).forEach(role => {
    const members = partyData.roles[role.id] || [];
    const memberCount = members.length;
    const maxMembers = role.maxMembers || 0;
    const memberDisplay = memberCount > 0 ? `(${memberCount}/${maxMembers})` : `(0/${maxMembers})`;
    
    // Get role requirements and display
    const ingredientData = roleManager.calculateRoleIngredients(partyData, role.id);
    
    // Calculate ingredient requirements based on member count and cake count
    let ingredientsText = 'No ingredients needed';
    if (role.baseIngredients.length > 0) {
      if (memberCount === 0) {
        // Show base requirements per cake
        const ingredients = role.baseIngredients.map(ingredient => {
          const totalNeeded = ingredient.count * cakeCount;
          return `${ingredient.emoji}x${totalNeeded}`;
        });
        ingredientsText = ingredients.join(' ');
      } else {
        // Show requirements divided among members if applicable
        const ingredients = ingredientData.map(ingredient => {
          if (memberCount > 1 && role.scalingFactor === 0) {
            return `${ingredient.emoji}x${ingredient.countPerMember}/person`;
          } else {
            return `${ingredient.emoji}x${ingredient.totalCount}`;
          }
        });
        ingredientsText = ingredients.join(' ');
      }
    }
    
    // Add tip if available
    const tipText = role.tip ? `\n    *Tip: ${role.tip}*` : '';
    
    // Basic description with role name and membership count
    description += `${role.emoji} **${role.name}s** ${memberDisplay} — ${ingredientsText}${tipText}\n`;
    
    // Add list of usernames if there are members
    if (memberCount > 0) {
      description += '    *Assigned to: ';
      
      // Get all usernames for this role
      const usernames = members.map(member => {
        // Handle both new format (objects with id/username) and old format (string IDs)
        return typeof member === 'string' ? 'Unknown User' : member.username || 'Unknown User';
      });
      
      description += `${usernames.join(', ')}*\n`;
    }
  });
  
  description += '\n*Note: Ingredient requirements can increase/decrease based on how many join each role and the number of cakes.*';
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor(config.colors.party)
    .setTitle('🥳🎉 Cake Party Sign-Up 🎉🥳')
    .setDescription(description)
    .setFooter({ text: '🎉 Let the party begin! 🎉' });
  
  // Create action row buttons
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('join_starter').setLabel('Join Starter').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_batterer').setLabel('Join Batterer').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_froster').setLabel('Join Froster').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_fruitfroster').setLabel('Join Fruit Froster').setStyle(ButtonStyle.Primary),
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('join_leafer').setLabel('Join Leafer').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_spreader').setLabel('Join Spreader').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_baker').setLabel('Join Baker').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('leave_role').setLabel('Leave Role').setStyle(ButtonStyle.Danger),
  );
  
  return {
    embed,
    components: [row1, row2]
  };
}

/**
 * Creates a summary embed when a cake party ends
 * @param {Object} partyData The party data to summarize
 * @returns {EmbedBuilder} The formatted summary embed
 */
function createPartySummaryEmbed(partyData) {
  let totalParticipants = 0;
  let roleBreakdown = '';
  const cakeCount = partyData.cakeCount || 1;
  
  // Count total participants and build role breakdown text
  Object.values(config.roles).forEach(role => {
    const members = partyData.roles[role.id] || [];
    totalParticipants += members.length;
    
    if (members.length > 0) {
      roleBreakdown += `${role.emoji} **${role.name}s**: ${members.length} participant(s)\n`;
      
      // Add the list of participants with usernames
      const usernames = members.map(member => 
        typeof member === 'string' ? 'Unknown User' : member.username || 'Unknown User'
      );
      
      roleBreakdown += `   *${usernames.join(', ')}*\n`;
    }
  });
  
  if (roleBreakdown === '') {
    roleBreakdown = 'No participants joined this party 😢';
  }
  
  // Create the summary embed
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(`🎂 Cake Party Completed! 🎂`)
    .setDescription(`The cake party has ended with ${totalParticipants} total participant(s)! Together you made ${cakeCount} ${cakeCount > 1 ? 'cakes' : 'cake'}!`)
    .addFields(
      { name: 'Role Breakdown', value: roleBreakdown },
      { name: 'Thanks for participating!', value: `${config.emojis.celebrationcake} Use !startcakeparty [number] to begin another party!` }
    )
    .setFooter({ text: 'Bon appétit! 🍰' });
}

/**
 * Creates a "Ready to Bake" embed when all required roles are filled
 * @param {Object} partyData The party data
 * @returns {EmbedBuilder} The formatted ready to bake embed
 */
function createReadyToBakeEmbed(partyData) {
  const cakeCount = partyData.cakeCount || 1;
  
  // Create a fun party message with emojis
  const embed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(`${config.emojis.tada} We are ready to PARTY! ${config.emojis.partying_face}`)
    .setDescription(
      `${config.emojis.sparkles} **Tips for a successful cake party:** ${config.emojis.sparkles}\n\n` +
      `${config.emojis.lockbox} Batterers don't forget to lock away your milk!\n` +
      `${config.emojis.lockbox} Frosters don't forget to lock away your eggs!\n\n` +
      `${config.emojis.cake} Remember to eat so you don't lose focus!\n` +
      `${config.emojis.heart} Don't be scared to ask any questions, we are here to help each other and have fun!\n\n` +
      `${config.emojis.confetti} Let's bake ${cakeCount} amazing ${cakeCount > 1 ? 'cakes' : 'cake'} together! ${config.emojis.confetti}`
    )
    .setFooter({ text: `${config.emojis.balloon} Let the baking begin! ${config.emojis.balloon}` });
  
  return embed;
}

module.exports = {
  createHelpEmbed,
  createPartyEmbed,
  createPartySummaryEmbed,
  createReadyToBakeEmbed
};
