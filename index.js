const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const channel = await client.channels.fetch('1398266959925084221');
  if (channel && channel.isTextBased()) {
    channel.send('Hey wsup, I am online and ready for next test');
  }
});

client.login(process.env.TOKEN);
