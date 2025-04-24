# Cake Party Discord Bot

A dynamic Discord bot that transforms cake-making into an interactive social experience, enabling seamless team coordination and flexible party management for baking enthusiasts.

## Features

- Start cake parties with a customizable number of cakes (1-50)
- Seven different roles with specific ingredient responsibilities
- Role-based party coordination with visual ingredient requirements
- Custom emoji support for a visually pleasing interface
- Persistent data storage using PostgreSQL
- Special dual-role capability (Baker & Spreader)
- Party readiness notifications with the `!readysetbake` command

## Commands

- `!startcakeparty [number]` - Start a new cake party with the specified number of cakes (1-50) (Moderator only)
- `!endcake` - End the current cake party and display a summary (Moderator only)
- `!readysetbake` - Display a festive message with helpful tips when all required roles are filled (Moderator only)
- `!cakehelp` - Display help information about the bot (Anyone can use)

## Keeping the Bot Running

The bot includes a simple web server that responds to HTTP requests. To keep the bot running 24/7 without using Replit Deployments, you can:

1. **Use a ping service** like UptimeRobot or Cron-job.org to send periodic HTTP requests to the bot's web server
2. **Set up the ping service:**
   - Sign up for a free account on [UptimeRobot](https://uptimerobot.com/) or similar service
   - Create a new monitor with type "HTTP(s)"
   - Use your Replit URL as the target (e.g., `https://your-repl-name.your-username.repl.co`)
   - Set the monitoring interval to 5 minutes
   - Save the monitor

The web server will respond to these pings, keeping your bot awake and running even without a paid Replit subscription.

## Alternative Option

For a more reliable solution, consider using Replit Deployments which is designed to keep applications running reliably without the need for external pinging services.

## Setup

1. Install dependencies: `npm install`
2. Create a `.env` file with your Discord bot token and database credentials:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DATABASE_URL=your_postgresql_database_url
   ```
3. Start the bot: `node index.js`

## Role Breakdown

- **Starter** (1 person) - Provides the blueberry, the most important ingredient
- **Leafers** (2-4 people) - Provide the sweetleaf, a key ingredient
- **Batterers** (1-3 people) - Mix the batter for the cake
- **Froster** (1 person) - Prepares the frosting
- **Fruit Frosters** (1-3 people) - Add apple and blueberry, the starring ingredients
- **Bakers** (1-3 people) - Bake the cake in the oven
- **Spreaders** (1-3 people) - Apply jellied cake layers

Special note: Users can join as both Bakers and Spreaders simultaneously!