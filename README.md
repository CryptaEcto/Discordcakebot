# Cake Party Bot

A collaborative Discord bot designed to transform online cake-making into an interactive, engaging social experience. The bot coordinates team roles, tracks member participation, and provides real-time baking coordination tools with dynamic party management.

## Features

- Start cake parties with a customizable number of cakes (1-50)
- Coordinate multiple roles with specialized responsibilities
- Track user participation and display usernames for each role
- Calculate ingredient requirements that scale based on participant count
- Persistent storage of party data using PostgreSQL
- Interactive embeds and buttons for role selection
- Special dual-role support for Bakers and Spreaders
- Mod-only commands for party management

## Commands

- `!startcakeparty [number]` - Start a new cake party with specified number of cakes (1-50) [Mod only]
- `!endcake` - End the current cake party in the channel [Mod only]
- `!readysetbake` - Display a festive "ready to bake" message when minimum role requirements are met [Mod only]
- `!cakehelp` - Display help information about the bot [Anyone can use]

## Roles

1. **Starter** (1 person) - Initiates the cake-making process
2. **Leafers** (2-4 people) - Prepare the sweetleaf ingredient
3. **Batterers** (1-3 people) - Mix the cake batter
4. **Froster** (1 person) - Creates the frosting
5. **Fruit Frosters** (1-3 people) - Add fruit toppings
6. **Bakers** (1-3 people) - Bake the cake layers
7. **Spreaders** (1-3 people) - Apply jelly between layers

Special feature: Users can join as both Baker and Spreader simultaneously!

## Setup

1. Create a Discord bot on the [Discord Developer Portal](https://discord.com/developers/applications)
2. Clone this repository
3. Install dependencies with `npm install`
4. Create a `.env` file using `.env.example` as a template
5. Add your Discord bot token to the `.env` file
6. Set up a PostgreSQL database and add the connection URL to the `.env` file
7. Start the bot with `node index.js`

## Using Custom Emojis from Other Servers

The bot uses custom emojis to represent ingredients and roles. You can customize these emojis or use emojis from other Discord servers:

1. The bot must be invited to any server whose emojis you want to use
2. To get an emoji's ID, type `\:emoji_name:` in Discord (with the backslash)
3. Discord will show the full emoji ID in the format `<:name:id>` or `<a:name:id>` for animated emojis
4. Open `config.js` and add your custom emojis in the emojis section:

```javascript
const emojis = {
  // Existing emojis...
  
  // Custom server emojis from other servers
  customCake: '<:fancy_cake:123456789012345678>',
  sparklyFrost: '<a:sparkle_frost:987654321098765432>', // Animated emoji example
};
```

5. You can then use these emojis in role configurations or anywhere else in the bot

## Database Structure

The bot uses a PostgreSQL database with two main tables:
- `parties` - Stores information about active cake parties
- `role_assignments` - Tracks which users have which roles

## License

[MIT License](LICENSE)