require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Partials } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const token = process.env.DISCORD_TOKEN;

const emojis = {
  apple: '<:apple:1364650758775247059>',
  blueberry: '<:blueberry:1364650527513645209>',
  sweetleaf: '<:sweetleaf:1364650657184747571>',
  milk: '<:milk:1364650830095192186>',
  egg: '<:egg:1364651054725337261>',
  flour: '<:flour:1364651107497803796>',
  butter: '<:butter:1364651171649814618>',
  sugar: '<:sugar:1364651294794448987>',
  star: '<:star:1364651827886555146>',
  cakebatter: '<:cakebatter:1364653780112510996>',
  fruitfrosting: '<:fruitfrosting:1364653475811561603>',
  jelliedcakelayer: '<:jelliedcakelayer:1364653208777003048>',
  cakelayer: '<:cakelayer:1364653062437736620>',
  frosting: '<:frosting:1364652782795227227>',
  groundsweetleaf: '<:groundsweetleaf:1364652261766201475>',
  celebrationcake: '<:celebrationcake:1364657276954214522>',
  lockbox: '<:lockbox:1364652635495465022>'
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '!cakehelp') {
    const helpEmbed = new EmbedBuilder()
      .setColor('#f7c8ff')
      .setTitle('🥳🎉🎈  Cake Party Help  🎈🎉🥳')
      .setDescription('Welcome to the Cake Party Bot!\n\nUse **!startcake** to start a new party.\nClick a button to join a role.\nClick **Leave Role** to leave your current one.\n\nRoles may require ingredients, and amounts may change depending on how many join.')
      .setFooter({ text: 'Let’s get baking!' });

    await message.channel.send({ embeds: [helpEmbed] });
  }

  if (message.content === '!startcake') {
    const ingredientsEmbed = new EmbedBuilder()
      .setColor('#ffdde0')
      .setTitle('🥳🎉 Cake Party Sign-Up 🎉🥳')
      .setDescription(
        `${emojis.cakebatter} **Batterers** — ${emojis.egg}x3 ${emojis.butter}x3 ${emojis.milk}x1\n` +
        `${emojis.frosting} **Frosters** — ${emojis.egg}x1 ${emojis.butter}x1 ${emojis.flour}x1\n` +
        `${emojis.fruitfrosting} **Fruit Frosters** — ${emojis.star}${emojis.apple}x2 ${emojis.star}${emojis.blueberry}x2\n` +
        `${emojis.groundsweetleaf} **Leafers** — ${emojis.sweetleaf}x2\n` +
        `${emojis.jelliedcakelayer} **Spreaders** — ${emojis.sugar}x2\n` +
        `${emojis.cakelayer} **Bakers** — No ingredients needed\n\n*Note: Ingredient totals may change based on how many join each role.*`
      )
      .setFooter({ text: '🎉 Let the party begin! 🎉' });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_batterer').setLabel('Join Batterer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('join_froster').setLabel('Join Froster').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('join_fruitfroster').setLabel('Join Fruit Froster').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('join_leafer').setLabel('Join Leafer').setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_spreader').setLabel('Join Spreader').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('join_baker').setLabel('Join Baker').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('leave_role').setLabel('Leave Role').setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [ingredientsEmbed], components: [row1, row2] });
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const roleMap = {
    join_batterer: 'Batterer',
    join_froster: 'Froster',
    join_fruitfroster: 'Fruit Froster',
    join_leafer: 'Leafer',
    join_spreader: 'Spreader',
    join_baker: 'Baker'
  };

  if (interaction.customId === 'leave_role') {
    await interaction.reply({ content: `You've left your role!`, ephemeral: true });
  } else if (roleMap[interaction.customId]) {
    await interaction.reply({ content: `You've joined as a **${roleMap[interaction.customId]}**!`, ephemeral: true });
  }
});

client.login(token);