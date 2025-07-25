require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const monitorNames = {
  'Quinx Chat': 'Quinx Chat',
  'Quinx Roles': 'Quinx Roles',
  'Quinx | Support': 'Quinx | Support'
};

const STATUS_EMOJIS = {
  2: '🟢 Online',
  9: '🔴 Offline'
};

let statusMessage = null;
const channelId = 'YOUR_CHANNEL_ID_HERE'; // Replace with your actual channel ID

async function fetchStatuses() {
  const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      format: 'json'
    })
  });

  const data = await res.json();

  if (!data.monitors) {
    console.error('❌ Error fetching monitors:', data);
    return null;
  }

  let statusLines = [];

  for (const monitor of data.monitors) {
    if (monitorNames[monitor.friendly_name]) {
      const name = monitor.friendly_name;
      const status = STATUS_EMOJIS[monitor.status] || '❔ Unknown';
      statusLines.push(`${name}: ${status}`);
    }
  }

  return statusLines;
}

async function updateStatus() {
  const channel = await client.channels.fetch(channelId);
  if (!channel) return;

  const statuses = await fetchStatuses();
  if (!statuses) return;

  const embed = new EmbedBuilder()
    .setTitle('🔧 Quinx Bot Status')
    .setDescription(statuses.join('\n'))
    .setColor('#8000ff')
    .setTimestamp();

  if (!statusMessage) {
    statusMessage = await channel.send({ embeds: [embed] });
  } else {
    await statusMessage.edit({ embeds: [embed] });
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await updateStatus();
  setInterval(updateStatus, 60_000); // every 1 minute
});

client.login(process.env.DISCORD_TOKEN);
