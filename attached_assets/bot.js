require('dotenv').config();
const { loadJson, saveJson } = require('./storage');

let cakeHosts = loadJson('cake_hosts.json'); // { guildId: [userId, ...] }
let activeParties = loadJson('active_parties.json'); // { guildId: { ...party data... } }
function addCakeHost(guildId, userId) {
    if (!cakeHosts[guildId]) cakeHosts[guildId] = [];
    if (!cakeHosts[guildId].includes(userId)) {
        cakeHosts[guildId].push(userId);
        saveJson('cake_hosts.json', cakeHosts);
    }
}
function startCakeParty(guildId, messageId, channelId) {
    activeParties[guildId] = {
        messageId,
        channelId,
        roles: {
            starter: null,
            leafer: [],
            batterer: [],
            baker: [],
            froster: [],
            fruit_froster: [],
            spreader: []
        }
    };
    saveJson('active_parties.json', activeParties);
}
function assignRole(guildId, roleName, userId) {
    const party = activeParties[guildId];
    if (!party) return false;

    if (roleName === 'starter') {
        party.roles.starter = userId;
    } else {
        if (!party.roles[roleName].includes(userId)) {
            party.roles[roleName].push(userId);
        }
    }
    saveJson('active_parties.json', activeParties);
    return true;
}
function endCakeParty(guildId) {
    delete activeParties[guildId];
    saveJson('active_parties.json', activeParties);
}

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require('discord.js');

const token = process.env.TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

const hostUsers = new Set(); // Store user IDs

const roles = ['Starter', 'Batterer', 'Froster', 'Fruit Froster', 'Leafer', 'Spreader', 'Baker'];
const signups = Object.fromEntries(roles.map(role => [role, []]));

const roleEmojis = {
  Starter: '<:Celebrationcake:1364749415386058785>',
  Batterer: '<:Cakebatter:1364749218467811338>',
  Froster: '<:Frosting:1364749219474309242>',
  'Fruit Froster': '<:Fruitfrosting:1364749220745187338>',
  Leafer: '<:Groundsweetleaf:1364749217595129968>',
  Spreader: '<:Jelliedcakelayer:1364749526883369001>',
  Baker: '<:Cakelayer:1364749223303843842>'
};

const ingredientEmojis = {
  Sweetleaf: '<:Sweetleaf:1364749235547017246>',
  Sugar: '<:Sugar:1364749093800513678>',
  Star: '<:Star:1364749225799454801>',
  Milk: '<:Milk:1364749224599879780>',
  Lockbox: '<:Lockbox:1364749337246302230>',
  Flour: '<:Flour:1364749221978177617>',
  Egg: '<:Egg:1364749064226209904>',
  Butter: '<:Butter:1364749228827607141>',
  Blueberry: '<:Blueberry:1364750405338271835>',
  Apple: '<:Apple:1364749232204152873>'
};

const roleIngredients = {
  Starter: {
    ingredients: { Blueberry: 1 }
  },
  Batterer: {
    ingredients: { Butter: 3, Egg: 3, Flour: 3 }
  },
  Froster: {
    ingredients: { Milk: 1, Butter: 1 }
  },
  'Fruit Froster': {
    ingredients: { 'Apple/Blueberry': 3, Sugar: 3 }
  },
  Leafer: {
    ingredients: { Sweetleaf: 4 }
  },
  Spreader: { ingredients: {} },
  Baker: { ingredients: {} }
};

function getIngredients(role, count) {
  const itemSet = roleIngredients[role]?.ingredients || {};
  if (Object.keys(itemSet).length === 0) return 'No ingredients needed';
  return Object.entries(itemSet).map(([item, amt]) => `${ingredientEmojis[item.replace('/', '')] || ''} ${amt * count} ${item}`).join(', ');
}

function allRolesFilled() {
  return roles.every(role => signups[role]?.length > 0);
}

function createPartyEmbed(totalCakes) {
  return new EmbedBuilder()
    .setColor('#d4f7dc')
    .setTitle('🥳🎉 Cake Party Sign-Up 🎉🥳')
    .setDescription(
      `🎂 Making ${totalCakes} cakes! 🎂\n\n` +
      roles.map(role => {
        const emoji = roleEmojis[role] || '';
        const tip =
          role === 'Starter' ? 'Tip: Also needs the Celebration Cake Recipe' :
          role === 'Batterer' ? 'Tip: Lock away your milk so you don\'t accidentally use it!' :
          role === 'Froster' ? 'Tip: Lock away your flour so you don\'t accidentally use it!' :
          role === 'Spreader' ? 'Tip: You can also join as a Baker at the same time!' :
          role === 'Baker' ? 'Tip: You can also join as a Spreader at the same time!' : '';
        const names = signups[role].length ? signups[role].map(name => `• ${name}`).join('\n') : '_None yet_';
        const max = role === 'Starter' || role === 'Froster' ? 1 :
                    ['Spreader', 'Baker'].includes(role) && allRolesFilled() ? 3 :
                    ['Spreader', 'Baker'].includes(role) ? 1 : 3;
        return `${emoji} **${role}s (${signups[role].length}/${max})**\n${names}\n${getIngredients(role, totalCakes)}\n${tip}`;
      }).join('\n\n') +
      (allRolesFilled()
        ? `\n\n<:Celebrationcake:1364749415386058785> **Time to Bake!** All roles have at least one member!\n🔹 Check Ingredients\n🔹 Lock Ingredients \n🔹 Have Fun!`
        : '') +
      '\n\n🎉 Let the party begin! 🎉'
    );
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// All other event handlers remain the same and should be manually inserted below if needed.


client.on('messageCreate', async message => {
  if (message.content === '!cakehelp') {
    return message.channel.send(`🥳🎉🎈  **Cake Party Help**  🎈🎉🥳\n\n**Commands:**\n• \`!startcakeparty [number]\` - (Mod only) Start a new cake party for the specified number of cakes\n• \`!endcake\` - (Mod only) End the current cake party and show a final summary\n• \`!cakehelp\` - Show this help message (anyone can use)\n\n**How to participate:**\n• Click a role button to join that role\n• Each role needs specific ingredients (listed when the party starts)\n• The number of ingredients depends on how many cakes are being made\n• Click **Leave Role** to remove yourself from a role\n\n🧁 Let’s get baking! 🧁`);
  }

  if (message.content.startsWith('!startcakeparty')) {
    if (
  !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
  !hostUsers.has(message.author.id)
) {
  return message.reply('❌ You do not have permission to use this command.');
}
    const args = message.content.split(' ');
    const totalCakes = parseInt(args[1]) || 1;
    for (const role of roles) signups[role] = [];

    const embed = createPartyEmbed(totalCakes);
    const buttons = roles.map(role =>
      new ButtonBuilder().setCustomId(`role_${role}`).setLabel(role).setStyle(ButtonStyle.Primary)
    );
    buttons.push(new ButtonBuilder().setCustomId('leave').setLabel('Leave Role').setStyle(ButtonStyle.Danger));

    const rows = [];
    while (buttons.length) rows.push(new ActionRowBuilder().addComponents(buttons.splice(0, 5)));

    const sentMessage = await message.channel.send({ embeds: [embed], components: rows });
    client.currentCakeMessage = sentMessage;
    client.currentCakeCount = totalCakes;
  }

  if (message.content === '!endcake') {
    if (
  !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) &&
  !hostUsers.has(message.author.id)
) {
  return message.reply('❌ You do not have permission to use this command.');
}

    if (!client.currentCakeCount) return message.channel.send('No active cake party!');

    const embed = createPartyEmbed(client.currentCakeCount);
    message.channel.send({ content: '🎉 Final Cake Party Summary:', embeds: [embed] });

    client.currentCakeMessage = null;
    client.currentCakeCount = null;
    for (const role of roles) signups[role] = [];
  }
 if (message.content.startsWith('!makehost')) {
  if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return message.reply('❌ You need Manage Server permission to assign a host.');
  }

  const mention = message.mentions.users.first();
  if (!mention) {
    return message.reply('❌ Please mention a user to assign as a host (e.g. `!makehost @User`).');
  }

  hostUsers.add(mention.id);
  return message.reply(`✅ ${mention.username} has been granted Cake Host powers! They can now use \`!startcakeparty\` and \`!endcake\`.`);
}
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const member = interaction.member;
  const nickname = member?.displayName;
  const customId = interaction.customId;

  if (!nickname) return interaction.reply({ content: 'Could not determine your nickname.', ephemeral: true });

  if (customId === 'leave') {
    for (const role of roles) {
      signups[role] = signups[role].filter(name => name !== nickname);
    }
    await interaction.reply({ content: `${nickname} has left all roles.`, ephemeral: true });
  }

if (customId.startsWith('role_')) {
  const role = customId.replace('role_', '');
  const isStarter = signups['Starter'].includes(nickname);
  const alreadyIn = signups[role].includes(nickname);

  if (alreadyIn) {
    return interaction.reply({ content: `You're already signed up as **${role}**.`, ephemeral: true });
  }

  let maxAllowed = 3;
  const isBakerOrSpreader = ['Baker', 'Spreader'].includes(role);
  const isRoleFull = () => signups[role].length >= maxAllowed;

  if (role === 'Starter') {
    maxAllowed = 1;
  } else if (role === 'Froster') {
    maxAllowed = 1;
  } else if (isBakerOrSpreader) {
    // Limit to 1 person until all roles are filled, then allow up to 3
    maxAllowed = allRolesFilled() ? 3 : 1;
  }

  if (isRoleFull()) {
    return interaction.reply({ content: `❌ The **${role}** role is full (${maxAllowed} max).`, ephemeral: true });
  }

  // Add the nickname to the appropriate role
  signups[role].push(nickname);

  // Refresh embed
  if (client.currentCakeMessage && client.currentCakeCount) {
    const updated = createPartyEmbed(client.currentCakeCount);
    await client.currentCakeMessage.edit({ embeds: [updated] });
  }

  await interaction.reply({ content: `${nickname} has joined the **${role}** role!`, ephemeral: true });
}


  // Refresh embed
  if (client.currentCakeMessage && client.currentCakeCount) {
    const updated = createPartyEmbed(client.currentCakeCount);
    await client.currentCakeMessage.edit({ embeds: [updated] });
  }
});

client.login(token);
