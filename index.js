import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = '1398266959925084221';
const STAFF_ALERT_CHANNEL_ID = '1390280298742288408';

const MONITORS = [
  {
    name: 'Quinx',
    apiKey: 'm800892506-092936812863f4592e776d48',
  },
  {
    name: 'Quinx Role',
    apiKey: 'u2822432-2c4c6580ce03ea9701e612e3',
  },
  {
    name: 'Quinx Chat',
    apiKey: 'u2822432-2c4c6580ce03ea9701e612e3',
  },
];

let messageToEdit = null;

async function checkStatusAndUpdateEmbed() {
  const statuses = await Promise.all(
    MONITORS.map(async ({ name, apiKey }) => {
      try {
        const res = await fetch('https://api.uptimerobot.com/v2/getMonitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, format: 'json' }),
        });

        const data = await res.json();
        const status = data.monitors?.[0]?.status;
        return {
          name,
          online: status === 2,
        };
      } catch {
        return { name, online: false };
      }
    })
  );

  const embed = new EmbedBuilder()
    .setTitle('🔧 Quinx Bot Status')
    .setColor(0x9146ff)
    .setDescription(
      statuses
        .map(
          (s) => `${s.name} : ${s.online ? '🟢 Online' : '🔴 Offline'}`
        )
        .join('\n')
    )
    .setFooter({ text: 'Updates every 5 minutes' })
    .setTimestamp();

  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!messageToEdit) {
    messageToEdit = await channel.send({ embeds: [embed] });
  } else {
    await messageToEdit.edit({ embeds: [embed] });
  }

  // Notify staff if any bot is offline
  const offlineBots = statuses.filter((s) => !s.online);
  if (offlineBots.length > 0) {
    const staffChannel = await client.channels.fetch(STAFF_ALERT_CHANNEL_ID);
    await staffChannel.send(
      `⚠️ The following bot(s) are offline:\n${offlineBots
        .map((b) => `**${b.name}**`)
        .join(', ')}`
    );
  }
}

client.once('ready', async () => {
  console.log(`Bot is ready as ${client.user.tag}`);
  await checkStatusAndUpdateEmbed();
  setInterval(checkStatusAndUpdateEmbed, 5 * 60 * 1000); // Every 5 mins
});

client.login(process.env.TOKEN);

// Express to keep Render app live
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (_, res) => {
  res.send('Quinx Status Bot is running!');
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
