import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const MONITORS = [
  {
    name: "Quinx | Support",
    url: "https://api.uptimerobot.com/v2/getMonitors",
    apiKey: "m800892506-092936812863f4592e776d48"
  },
];

const CHANNEL_ID = '1398266959925084221';
const GUILD_ID = '1389456112876785765';

let messageId;

async function fetchMonitorStatus(monitor) {
  const response = await fetch(monitor.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: monitor.apiKey,
      format: 'json',
    }),
  });
  const data = await response.json();
  const status = data.monitors[0].status; // 2 = online, 9 = offline
  return status === 2 ? '🟢 Online' : '🔴 Offline';
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);

  const statuses = await Promise.all(MONITORS.map(fetchMonitorStatus));

  const embed = new EmbedBuilder()
    .setTitle('Quinx Bot Status')
    .setColor('Blurple')
    .addFields(MONITORS.map((monitor, index) => ({
      name: monitor.name,
      value: statuses[index],
      inline: false,
    })))
    .setTimestamp();

  const sent = await channel.send({ embeds: [embed] });
  messageId = sent.id;

  setInterval(async () => {
    const newStatuses = await Promise.all(MONITORS.map(fetchMonitorStatus));
    const updatedEmbed = new EmbedBuilder()
      .setTitle('Quinx Bot Status')
      .setColor('Blurple')
      .addFields(MONITORS.map((monitor, index) => ({
        name: monitor.name,
        value: newStatuses[index],
        inline: false,
      })))
      .setTimestamp();

    const message = await channel.messages.fetch(messageId);
    await message.edit({ embeds: [updatedEmbed] });
  }, 60_000); // Every 1 minute
});

client.login(process.env.DISCORD_TOKEN);
