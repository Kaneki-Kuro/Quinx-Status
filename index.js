const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let messageId = null;

async function getBotStatus(apiKey) {
  try {
    const res = await axios.post('https://api.uptimerobot.com/v2/getMonitors', {
      api_key: apiKey,
      format: 'json'
    });

    const monitor = res.data.monitors[0];
    return monitor.status === 2 ? '🟢 Online' : '🔴 Offline';
  } catch (err) {
    console.error('Error fetching status:', err.message);
    return '⚠️ Error';
  }
}

async function updateStatus(channel) {
  const supportStatus = await getBotStatus(process.env.UPTIMEROBOT_SUPPORT);
  const chatStatus = await getBotStatus(process.env.UPTIMEROBOT_CHAT);
  const roleStatus = await getBotStatus(process.env.UPTIMEROBOT_ROLE);

  const embed = new EmbedBuilder()
    .setTitle('🔧 Quinx Bot Status')
    .addFields(
      { name: 'Quinx | Support', value: supportStatus, inline: false },
      { name: 'Quinx | Chat', value: chatStatus, inline: false },
      { name: 'Quinx | Role', value: roleStatus, inline: false }
    )
    .setFooter({ text: `Last checked: ${new Date().toLocaleTimeString()}` })
    .setColor(0x800080);

  try {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({ embeds: [embed] });
  } catch (err) {
    const sent = await channel.send({ embeds: [embed] });
    messageId = sent.id;
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  await updateStatus(channel);
  setInterval(() => updateStatus(channel), 5 * 60 * 1000); // every 5 mins
});

client.login(process.env.DISCORD_TOKEN);
