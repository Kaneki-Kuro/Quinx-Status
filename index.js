import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// === CONFIG ===
const GUILD_ID = '1389456112876785765';
const STATUS_CHANNEL_ID = '1398266959925084221';
const ALERT_CHANNEL_ID = '1390280298742288408';

const MONITORS = [
  { name: 'Quinx', apiKey: 'm800892506-092936812863f4592e776d48' },
  { name: 'Quinx Role', apiKey: 'u2822432-2c4c6580ce03ea9701e612e3' },
  { name: 'Quinx Chat', apiKey: 'u2822432-2c4c6580ce03ea9701e612e3' }
];

let messageToEdit;

async function checkStatuses() {
  const statuses = [];

  for (const monitor of MONITORS) {
    try {
      const response = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: monitor.apiKey, format: 'json' })
      });

      const data = await response.json();
      const statusCode = data.monitors?.[0]?.status;

      const isOnline = statusCode === 2; // 2 = online, 9 = offline
      statuses.push({
        name: monitor.name,
        online: isOnline
      });

      // Alert staff if offline
      if (!isOnline) {
        const alertChannel = await client.channels.fetch(ALERT_CHANNEL_ID);
        alertChannel.send(`⚠️ ${monitor.name} is currently **offline**! <@&1389488347126435942>`);
      }

    } catch (error) {
      console.error(`Error checking ${monitor.name}:`, error);
      statuses.push({ name: monitor.name, online: false });
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('🛰 Quinx Bot Status')
    .setColor(0x6A0DAD) // Purple
    .setTimestamp()
    .setDescription(
      statuses
        .map(status => `**${status.name}** : ${status.online ? '🟢 Online' : '🔴 Offline'}`)
        .join('\n')
    );

  try {
    const statusChannel = await client.channels.fetch(STATUS_CHANNEL_ID);
    if (!messageToEdit) {
      messageToEdit = await statusChannel.send({ embeds: [embed] });
    } else {
      await messageToEdit.edit({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Error sending/updating status embed:', err);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Initial run
  await checkStatuses();

  // Run every 5 minutes
  setInterval(checkStatuses, 5 * 60 * 1000);
});

client.login(process.env.BOT_TOKEN);
