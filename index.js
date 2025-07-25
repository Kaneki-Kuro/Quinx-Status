import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = 'YOUR_CHANNEL_ID_HERE';
const MONITOR_IDS = {
  'Quinx Chat': 778228821, // Replace with your actual monitor IDs
  'Quinx Roles': 778228825,
  'Quinx | Support': 778228829
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const embed = await getStatusEmbed();
  const channel = await client.channels.fetch(CHANNEL_ID);

  const sentMessage = await channel.send({ embeds: [embed] });

  setInterval(async () => {
    const updatedEmbed = await getStatusEmbed();
    await sentMessage.edit({ embeds: [updatedEmbed] });
  }, 60_000); // update every 60 seconds
});

async function getStatusEmbed() {
  const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.UPTIMEROBOT_API_KEY,
      monitors: Object.values(MONITOR_IDS).join(','),
      format: 'json'
    })
  });

  const data = await res.json();

  const statusMap = {
    2: '🟢 Online',
    9: '🔴 Offline'
  };

  const lines = Object.entries(MONITOR_IDS).map(([name, id]) => {
    const monitor = data.monitors.find(m => m.id === id);
    const status = statusMap[monitor?.status] || '❔ Unknown';
    return `${name}: ${status}`;
  });

  return new EmbedBuilder()
    .setTitle('🔧 Quinx Bot Status')
    .setDescription(lines.join('\n'))
    .setColor('#8000ff')
    .setTimestamp();
}

client.login(DISCORD_TOKEN);
