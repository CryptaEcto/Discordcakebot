const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

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
      '• **!startcake** - Start a new cake party in the current channel\n' +
      '• **!endcake** - End the current cake party and see a summary\n' +
      '• **!cakehelp** - Show this help message\n\n' +
      '**How to participate:**\n' +
      '• Click a role button to join that role\n' +
      '• Each role requires specific ingredients\n' +
      '• Ingredient requirements may increase based on how many people join each role\n' +
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
  
  Object.values(config.roles).forEach(role => {
    const memberCount = partyData.roles[role.id]?.length || 0;
    const memberDisplay = memberCount > 0 ? `(${memberCount})` : '';
    
    // Calculate ingredient requirements based on member count
    let ingredientsText = 'No ingredients needed';
    if (role.baseIngredients.length > 0) {
      const ingredients = role.baseIngredients.map(ingredient => {
        // Calculate scaled count based on participants
        let scaledCount = ingredient.count;
        if (memberCount > 1) {
          const additionalCount = Math.floor((memberCount - 1) * role.scalingFactor * ingredient.count);
          scaledCount += additionalCount;
        }
        return `${ingredient.emoji}x${scaledCount}`;
      });
      
      ingredientsText = ingredients.join(' ');
    }
    
    description += `${role.emoji} **${role.name}s** ${memberDisplay} — ${ingredientsText}\n`;
  });
  
  description += '\n*Note: Ingredient totals increase based on how many join each role.*';
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor(config.colors.party)
    .setTitle('🥳🎉 Cake Party Sign-Up 🎉🥳')
    .setDescription(description)
    .setFooter({ text: '🎉 Let the party begin! 🎉' });
  
  // Create action row buttons
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('join_batterer').setLabel('Join Batterer').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_froster').setLabel('Join Froster').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_fruitfroster').setLabel('Join Fruit Froster').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('join_leafer').setLabel('Join Leafer').setStyle(ButtonStyle.Primary),
  );
  
  const row2 = new ActionRowBuilder().addComponents(
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
  
  // Count total participants and build role breakdown text
  Object.values(config.roles).forEach(role => {
    const members = partyData.roles[role.id] || [];
    totalParticipants += members.length;
    
    if (members.length > 0) {
      roleBreakdown += `${role.emoji} **${role.name}s**: ${members.length} participant(s)\n`;
    }
  });
  
  if (roleBreakdown === '') {
    roleBreakdown = 'No participants joined this party 😢';
  }
  
  // Create the summary embed
  return new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle('🎂 Cake Party Completed! 🎂')
    .setDescription(`The cake party has ended with ${totalParticipants} total participant(s)!`)
    .addFields(
      { name: 'Role Breakdown', value: roleBreakdown },
      { name: 'Thanks for participating!', value: `${config.emojis.celebrationcake} Use !startcake to begin another party!` }
    )
    .setFooter({ text: 'Bon appétit! 🍰' });
}

module.exports = {
  createHelpEmbed,
  createPartyEmbed,
  createPartySummaryEmbed
};
