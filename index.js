import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import 'dotenv/config';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const guildId = process.env.GUILD_ID;
const channelId = process.env.CHANNEL_ID;
const botToken = process.env.BOT_TOKEN;
const monitorKeys = {
  'Quinx | Support': process.env.MONITOR_SUPPORT,
  'Quinx Role': process.env.MONITOR_ROLE,
  'Quinx Chat': process.env.MONITOR_CHAT,
};

let statusCache = {};
let statusMessage;

async function getStatus(apiKey) {
  try {
    const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        format: 'json',
      }),
    });
    const data = await response.json();
    return data.monitors?.[0]?.status === 2 ? '🟢 Online' : '🔴 Offline';
  } catch (e) {
    console.error('Error fetching status:', e);
    return '⚠️ Error';
  }
}

async function updateStatus() {
  const fields = [];

  for (const [name, key] of Object.entries(monitorKeys)) {
    const status = await getStatus(key);

    // Only push if status changed or initial
    if (statusCache[name] !== status) {
      statusCache[name] = status;
    }

    fields.push({ name, value: status, inline: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('🛡️ Quinx Bot Status Monitor')
    .setColor(0x9b59b6)
    .setTimestamp()
    .addFields(fields)
    .setFooter({ text: 'Updated every 5 minutes' });

  if (!statusMessage) {
    const channel = await client.channels.fetch(channelId);
    statusMessage = await channel.send({ embeds: [embed] });
  } else {
    await statusMessage.edit({ embeds: [embed] });
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await updateStatus();
  setInterval(updateStatus, 5 * 60 * 1000); // Every 5 minutes
});

client.login(botToken);
