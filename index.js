require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const embedBuilder = require('./utils/embedBuilder');
const roleManager = require('./utils/roleManager');
const config = require('./config');

// Initialize client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Bot token from environment variables
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('ERROR: Discord token is missing! Please check your .env file.');
  process.exit(1);
}

// Initialize party data storage
// This will store active cake parties by guild/channel
const activeParties = new Map();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving in ${client.guilds.cache.size} guilds`);
  
  // Set bot activity
  client.user.setActivity('!cakehelp', { type: 'PLAYING' });
});

client.on('messageCreate', async message => {
  // Ignore messages from bots
  if (message.author.bot) return;
  
  // Process cake help command
  if (message.content === '!cakehelp') {
    try {
      const helpEmbed = embedBuilder.createHelpEmbed();
      await message.channel.send({ embeds: [helpEmbed] });
    } catch (error) {
      console.error('Error sending help message:', error);
      message.channel.send('Sorry, I had trouble showing the help menu. Please try again.');
    }
  }
  
  // Process start cake party command
  if (message.content.startsWith('!startcakeparty')) {
    try {
      // Check if there's already an active party in this channel
      const partyKey = `${message.guild.id}-${message.channel.id}`;
      if (activeParties.has(partyKey)) {
        return message.reply('There\'s already an active cake party in this channel! Join that one or end it first.');
      }
      
      // Parse cake count from command (required parameter)
      const args = message.content.split(/\s+/);
      if (args.length < 2) {
        return message.reply('Please specify how many cakes to make! Example: `!startcakeparty 3`');
      }
      
      const parsedCount = parseInt(args[1]);
      if (isNaN(parsedCount)) {
        return message.reply('Please provide a valid number of cakes! Example: `!startcakeparty 3`');
      }
      
      if (parsedCount <= 0) {
        return message.reply('You need to make at least 1 cake! Please try again with a positive number.');
      }
      
      if (parsedCount > 10) {
        return message.reply('The maximum number of cakes you can make is 10! Please try again with a smaller number.');
      }
      
      // Create new party data with specified cake count
      const partyData = roleManager.createNewParty(parsedCount);
      activeParties.set(partyKey, partyData);
      
      // Create and send party signup message
      const { embed, components } = embedBuilder.createPartyEmbed(partyData);
      const sentMessage = await message.channel.send({ 
        embeds: [embed], 
        components: components 
      });
      
      // Store message ID with party data for reference
      partyData.messageId = sentMessage.id;
      
      console.log(`Started new cake party in guild ${message.guild.id}, channel ${message.channel.id} with ${parsedCount} cakes`);
    } catch (error) {
      console.error('Error starting cake party:', error);
      message.channel.send('Sorry, I encountered an error starting the cake party. Please try again.');
    }
  }

  // Process end cake party command
  if (message.content === '!endcake') {
    try {
      const partyKey = `${message.guild.id}-${message.channel.id}`;
      if (!activeParties.has(partyKey)) {
        return message.reply('There\'s no active cake party in this channel to end.');
      }
      
      const partyData = activeParties.get(partyKey);
      
      // Generate summary of the party
      const summaryEmbed = embedBuilder.createPartySummaryEmbed(partyData);
      await message.channel.send({ embeds: [summaryEmbed] });
      
      // Remove the party from active parties
      activeParties.delete(partyKey);
      
      console.log(`Ended cake party in guild ${message.guild.id}, channel ${message.channel.id}`);
    } catch (error) {
      console.error('Error ending cake party:', error);
      message.channel.send('Sorry, I encountered an error ending the cake party. Please try again.');
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  
  try {
    // Identify the party this interaction belongs to
    const partyKey = `${interaction.guild.id}-${interaction.channel.id}`;
    if (!activeParties.has(partyKey)) {
      return interaction.reply({ 
        content: 'This cake party is no longer active. Start a new one with !startcakeparty [number]', 
        ephemeral: true 
      });
    }
    
    const partyData = activeParties.get(partyKey);
    
    // Handle role assignment/removal
    if (interaction.customId === 'leave_role') {
      const oldRole = roleManager.getUserRole(partyData, interaction.user.id);
      if (!oldRole) {
        return interaction.reply({ 
          content: "You don't currently have a role to leave!", 
          ephemeral: true 
        });
      }
      
      roleManager.removeUserFromRole(partyData, interaction.user.id);
      await interaction.reply({ 
        content: `You've left your role as a **${oldRole}**!`, 
        ephemeral: true 
      });
      
    } else if (interaction.customId.startsWith('join_')) {
      const roleName = config.roleMap[interaction.customId];
      if (!roleName) {
        return interaction.reply({ 
          content: "That role doesn't exist!", 
          ephemeral: true 
        });
      }
      
      const oldRole = roleManager.getUserRole(partyData, interaction.user.id);
      if (oldRole) {
        roleManager.removeUserFromRole(partyData, interaction.user.id);
      }
      
      roleManager.assignUserToRole(partyData, interaction.user.id, interaction.customId);
      
      // Send appropriate response based on whether they switched roles
      if (oldRole) {
        await interaction.reply({ 
          content: `You've switched from **${oldRole}** to **${roleName}**!`, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: `You've joined as a **${roleName}**!`, 
          ephemeral: true 
        });
      }
    }
    
    // Update the party embed with new role counts and requirements
    try {
      const { embed, components } = embedBuilder.createPartyEmbed(partyData);
      const channel = await client.channels.fetch(interaction.channelId);
      const message = await channel.messages.fetch(partyData.messageId);
      await message.edit({ embeds: [embed], components: components });
    } catch (error) {
      console.error('Error updating party message:', error);
    }
    
  } catch (error) {
    console.error('Error handling button interaction:', error);
    await interaction.reply({ 
      content: 'Sorry, something went wrong processing your request.', 
      ephemeral: true 
    });
  }
});

// Handle errors
client.on('error', error => {
  console.error('Discord client error:', error);
});

// Login to Discord
client.login(token)
  .then(() => console.log('Bot successfully logged in'))
  .catch(error => {
    console.error('Failed to log in:', error);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('Bot is shutting down...');
  client.destroy();
  process.exit(0);
});
