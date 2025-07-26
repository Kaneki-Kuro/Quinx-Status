import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Setup express to keep bot alive on Render
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Quinx Status Bot is running.'));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let messageId = null;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

  const embed = await getStatusEmbed();
  const sentMessage = await channel.send({ embeds: [embed] });
  messageId = sentMessage.id;

  setInterval(async () => {
    const updatedEmbed = await getStatusEmbed();
    const message = await channel.messages.fetch(messageId);
    if (message) {
      await message.edit({ embeds: [updatedEmbed] });
    }
  }, 5 * 60 * 1000); // 5 minutes
});

client.login(process.env.DISCORD_TOKEN);

// Function to fetch status from UptimeRobot
async function getStatusEmbed() {
  const statuses = await Promise.all([
    fetchStatus(process.env.SUPPORT_MONITOR_KEY),
    fetchStatus(process.env.ROLES_MONITOR_KEY),
    fetchStatus(process.env.CHAT_MONITOR_KEY),
  ]);

  const embed = new EmbedBuilder()
    .setTitle('📊 Quinx Bot Status')
    .setColor(0x9b59b6)
    .addFields(
      { name: '📟 Quinx | Support', value: statuses[0], inline: true },
      { name: '📟 Quinx | Roles', value: statuses[1], inline: true },
      { name: '📟 Quinx | Chat', value: statuses[2], inline: true }
    )
    .setFooter({ text: 'Updated every 5 minutes' })
    .setTimestamp();

  return embed;
}

async function fetchStatus(apiKey) {
  try {
    const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, format: 'json' }),
    });

    const data = await res.json();
    const monitor = data.monitors[0];

    if (monitor.status === 2) return '🟢 Online';
    if (monitor.status === 9) return '🔴 Offline';
    return '🟡 Unknown';
  } catch (err) {
    console.error('Error fetching status:', err);
    return '⚠️ Error';
  }
}
