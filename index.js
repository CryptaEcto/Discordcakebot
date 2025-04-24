require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const embedBuilder = require('./utils/embedBuilder');
const roleManager = require('./utils/roleManager');
const config = require('./config');
const db = require('./utils/database');
const http = require('http');

// Initialize client with required intents
// Note: To use custom emojis from other servers, the bot must be a member of those servers
// No additional intents are needed for custom emojis, but the bot must have been invited to the server
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

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving in ${client.guilds.cache.size} guilds`);
  
  // Initialize database
  try {
    await db.initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
  
  // Set bot activity
  client.user.setActivity('!cakehelp', { type: 'PLAYING' });
});

// Helper function to check if all roles have at least one member
function checkAllRolesFilled(partyData) {
  let allFilled = true;
  
  Object.values(config.roles).forEach(role => {
    const members = partyData.roles[role.id] || [];
    // If any role has no members, we're not ready
    if (members.length === 0) {
      allFilled = false;
    }
  });
  
  return allFilled;
}

// Helper function to check if a user has moderator permissions
function isModerator(member) {
  // Check if the user has MANAGE_CHANNELS, MANAGE_ROLES, or ADMINISTRATOR permissions
  // These are typical permissions that moderators would have
  return member.permissions.has('ManageChannels') || 
         member.permissions.has('ManageRoles') || 
         member.permissions.has('Administrator');
}

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
  
  // Process ready set bake command
  if (message.content === '!readysetbake') {
    try {
      // Check if user has moderator permissions
      if (!isModerator(message.member)) {
        return message.reply('Sorry, only moderators can use this command!');
      }
      
      const guildId = message.guild.id;
      const channelId = message.channel.id;
      const partyKey = `${guildId}-${channelId}`;
      
      // Check if there's an active party in this channel
      let partyData = null;
      if (activeParties.has(partyKey)) {
        partyData = activeParties.get(partyKey);
      } else {
        // Try to load from database
        partyData = await roleManager.loadPartyData(guildId, channelId);
        if (partyData) {
          // Found in database but not in memory, add to memory
          activeParties.set(partyKey, partyData);
        }
      }
      
      if (!partyData) {
        return message.reply('There\'s no active cake party in this channel!');
      }
      
      // Check if all roles have at least one member
      if (!checkAllRolesFilled(partyData)) {
        return message.reply('Not all roles have members yet! Make sure at least one person has joined each role before starting to bake.');
      }
      
      // Send the ready to bake message
      const readyEmbed = embedBuilder.createReadyToBakeEmbed(partyData);
      await message.channel.send({ embeds: [readyEmbed] });
    } catch (error) {
      console.error('Error processing ready set bake command:', error);
      message.channel.send('Sorry, I encountered an error. Please try again.');
    }
  }
  
  // Process start cake party command
  if (message.content.startsWith('!startcakeparty')) {
    try {
      // Check if user has moderator permissions
      if (!isModerator(message.member)) {
        return message.reply('Sorry, only moderators can use this command!');
      }
      
      // Check if there's already an active party in this channel
      const guildId = message.guild.id;
      const channelId = message.channel.id;
      const partyKey = `${guildId}-${channelId}`;
      
      // Check memory cache first (faster)
      if (activeParties.has(partyKey)) {
        return message.reply('There\'s already an active cake party in this channel! Join that one or end it first.');
      }
      
      // Also check database for existing parties
      const existingParty = await roleManager.loadPartyData(guildId, channelId);
      if (existingParty) {
        // We found an existing party in the database, load it into memory
        activeParties.set(partyKey, existingParty);
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
      
      if (parsedCount > 50) {
        return message.reply('The maximum number of cakes you can make is 50! Please try again with a smaller number.');
      }
      
      // Create new party data with specified cake count
      const partyData = await roleManager.createNewParty(guildId, channelId, parsedCount);
      activeParties.set(partyKey, partyData);
      
      // Create and send party signup message
      const { embed, components } = embedBuilder.createPartyEmbed(partyData);
      const sentMessage = await message.channel.send({ 
        embeds: [embed], 
        components: components 
      });
      
      // Store message ID with party data for reference
      await roleManager.updatePartyMessageId(partyData, sentMessage.id);
      
      console.log(`Started new cake party in guild ${guildId}, channel ${channelId} with ${parsedCount} cakes`);
    } catch (error) {
      console.error('Error starting cake party:', error);
      message.channel.send('Sorry, I encountered an error starting the cake party. Please try again.');
    }
  }

  // Process end cake party command
  if (message.content === '!endcake') {
    try {
      // Check if user has moderator permissions
      if (!isModerator(message.member)) {
        return message.reply('Sorry, only moderators can use this command!');
      }
      
      const guildId = message.guild.id;
      const channelId = message.channel.id;
      const partyKey = `${guildId}-${channelId}`;
      
      // First check memory cache
      let partyData = null;
      if (activeParties.has(partyKey)) {
        partyData = activeParties.get(partyKey);
      } else {
        // Try to load from database
        partyData = await roleManager.loadPartyData(guildId, channelId);
        if (partyData) {
          // Found in database but not in memory, add to memory
          activeParties.set(partyKey, partyData);
        }
      }
      
      if (!partyData) {
        return message.reply('There\'s no active cake party in this channel to end.');
      }
      
      // Generate summary of the party
      const summaryEmbed = embedBuilder.createPartySummaryEmbed(partyData);
      await message.channel.send({ embeds: [summaryEmbed] });
      
      // Delete the party from the database
      await roleManager.deleteParty(guildId, channelId);
      
      // Remove the party from active parties in memory
      activeParties.delete(partyKey);
      
      console.log(`Ended cake party in guild ${guildId}, channel ${channelId}`);
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
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;
    const partyKey = `${guildId}-${channelId}`;
    
    // First check memory
    let partyData = null;
    if (activeParties.has(partyKey)) {
      partyData = activeParties.get(partyKey);
    } else {
      // Try to load from database
      partyData = await roleManager.loadPartyData(guildId, channelId);
      if (partyData) {
        // Found in database but not in memory, add to memory
        activeParties.set(partyKey, partyData);
      }
    }
    
    if (!partyData) {
      return interaction.reply({ 
        content: 'This cake party is no longer active. Start a new one with !startcakeparty [number]', 
        ephemeral: true 
      });
    }
    
    // Handle role assignment/removal
    if (interaction.customId === 'leave_role') {
      const oldRole = await roleManager.getUserRole(partyData, interaction.user.id);
      if (!oldRole) {
        return interaction.reply({ 
          content: "You don't currently have a role to leave!", 
          ephemeral: true 
        });
      }
      
      // Check if it's a Baker & Spreader dual role
      const isBakerAndSpreader = oldRole.includes('&');
      
      await roleManager.removeUserFromRole(partyData, interaction.user.id);
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
      
      // Get current role of the user
      const oldRole = await roleManager.getUserRole(partyData, interaction.user.id);
      
      // Get the user's Discord username
      const username = interaction.user.username || interaction.user.displayName || "Unknown User";
      
      // Try to assign the user to the new role (pass username as third parameter)
      const success = await roleManager.assignUserToRole(partyData, interaction.user.id, username, interaction.customId);
      
      // If role assignment failed due to role being full
      if (!success) {
        // Find the role object to check the max members
        const roleConfig = Object.values(config.roles).find(r => r.id === interaction.customId);
        if (roleConfig && roleConfig.maxMembers > 0) {
          return interaction.reply({
            content: `Sorry, the **${roleName}** role is full (max ${roleConfig.maxMembers} members)!`,
            ephemeral: true
          });
        }
        return interaction.reply({
          content: `Sorry, couldn't assign you to the **${roleName}** role.`,
          ephemeral: true
        });
      }
      
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

// Create a simple web server to respond to pings
// This keeps the bot running on Replit even without Deployments
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end(`Cake Party Bot is online! Serving in ${client.guilds.cache.size || 0} guilds.`);
  console.log('Received ping to keep bot alive: ' + new Date().toISOString());
});

// Start the web server on port 3000
server.listen(3000, () => {
  console.log('Web server is running on port 3000');
});
