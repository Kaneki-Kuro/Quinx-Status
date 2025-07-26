const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

// ENV Variables
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1398266959925084221';
const STAFF_ALERT_CHANNEL = '1390280298742288408';
const MONITORS = [
  { name: 'Quinx', key: 'm800892506-092936812863f4592e776d48' },
  { name: 'Quinx Role', key: 'u2822432-2c4c6580ce03ea9701e612e3' },
  { name: 'Quinx Chat', key: 'u2822432-2c4c6580ce03ea9701e612e3' }
];

let statusMessage = null;

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return console.error('❌ Failed to find channel');

  const embed = await buildStatusEmbed();
  statusMessage = await channel.send({ embeds: [embed] });

  setInterval(async () => {
    const newEmbed = await buildStatusEmbed();
    await statusMessage.edit({ embeds: [newEmbed] });

    const anyOffline = newEmbed.data.fields.some(f => f.value === '🔴 Offline');
    if (anyOffline) {
      const staffChannel = await client.channels.fetch(STAFF_ALERT_CHANNEL);
      if (staffChannel) {
        staffChannel.send('⚠️ One or more monitored bots are offline! Please check.');
      }
    }
  }, 5 * 60 * 1000); // Every 5 mins
});

async function buildStatusEmbed() {
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Quinx Bot Status')
    .setColor(0x9146FF)
    .setTimestamp();

  for (const monitor of MONITORS) {
    const status = await getMonitorStatus(monitor.key);
    embed.addFields({
      name: monitor.name,
      value: status === 2 ? '🟢 Online' : '🔴 Offline',
      inline: false,
    });
  }

  return embed;
}

async function getMonitorStatus(apiKey) {
  try {
    const res = await axios.post('https://api.uptimerobot.com/v2/getMonitors', null, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      params: { api_key: apiKey, format: 'json' },
    });

    const monitor = res.data.monitors[0];
    return monitor.status; // 2 = Up, 9 = Down
  } catch (err) {
    console.error('Monitor fetch error:', err.message);
    return 9;
  }
}

// Express to keep Render alive
const app = express();
app.get('/', (_, res) => res.send('Bot is running'));
app.listen(10000, () => console.log('Web server running on port 10000'));

client.login(TOKEN);
