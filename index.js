import fetch from 'node-fetch';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import 'dotenv/config';

const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let messageToEdit;

const bots = [
  {
    name: 'Quinx | Support',
    apiKey: 'm800892506-092936812863f4592e776d48'
  },
  {
    name: 'Quinx Role',
    apiKey: 'm800908696-2881622ef05dc0650d3ce333'
  },
  {
    name: 'Quinx Chat',
    apiKey: 'm800886135-7381e8041a8fd32ab404dba0'
  }
];

function statusToEmoji(status) {
  if (status === 2) return '✅ Online';
  if (status === 9) return '❌ Offline';
  if (status === 0) return '🟡 Paused';
  return '❔ Unknown';
}

async function fetchBotStatus(apiKey) {
  const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, format: 'json' })
  });
  const data = await response.json();
  return data.monitors?.[0]?.status || -1;
}

async function updateStatusEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('📡 Quinx Bot Status')
    .setColor(0x9146ff)
    .setTimestamp()
    .setFooter({ text: 'Last Updated' });

  for (const bot of bots) {
    const status = await fetchBotStatus(bot.apiKey);
    embed.addFields({ name: bot.name, value: statusToEmoji(status), inline: true });
  }

  if (!messageToEdit) {
    const channel = await client.channels.fetch(CHANNEL_ID);
    messageToEdit = await channel.send({ embeds: [embed] });
  } else {
    await messageToEdit.edit({ embeds: [embed] });
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  updateStatusEmbed();
  setInterval(updateStatusEmbed, 5 * 60 * 1000);
});

client.login(BOT_TOKEN);
