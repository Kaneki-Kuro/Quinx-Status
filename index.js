import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const { TOKEN, CHANNEL_ID } = process.env;

// List of monitored bots
const services = [
  { name: 'Support Bot', url: 'https://support-uptime.com', color: 0x57F287 },
  { name: 'Mod Bot', url: 'https://mod-uptime.com', color: 0xFEE75C },
  { name: 'Store Bot', url: 'https://store-uptime.com', color: 0x5865F2 }
];

let messageMap = {};
try {
  messageMap = JSON.parse(fs.readFileSync('./data.json'));
} catch {
  console.log('No saved messages found.');
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: `Quinx's Bot`, type: ActivityType.Watching }],
    status: 'idle'
  });

  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const service of services) {
    if (!messageMap[service.name]) {
      const embed = createEmbed(service.name, true);
      const msg = await channel.send({ embeds: [embed] });
      messageMap[service.name] = msg.id;
      console.log(`📤 Sent new embed for ${service.name}`);
    }
  }

  fs.writeFileSync('./data.json', JSON.stringify(messageMap, null, 2));
  checkAll();
  setInterval(checkAll, 60 * 1000);
});

async function checkAll() {
  for (const service of services) {
    await checkService(service);
  }
}

async function checkService(service) {
  try {
    const res = await fetch(service.url, { timeout: 5000 });
    const isUp = res.ok;

    const embed = createEmbed(service.name, isUp);
    const channel = await client.channels.fetch(CHANNEL_ID);
    const msg = await channel.messages.fetch(messageMap[service.name]);

    await msg.edit({ embeds: [embed] });
    console.log(`[${new Date().toLocaleTimeString()}] Updated ${service.name} → ${isUp ? 'UP' : 'DOWN'}`);
  } catch (err) {
    console.error(`❌ Error checking ${service.name}:`, err.message);
  }
}

function createEmbed(name, isUp) {
  return new EmbedBuilder()
    .setTitle(`📡 ${name} Status`)
    .setDescription(isUp
      ? '✅ This service is **UP** and responding.'
      : '❌ This service appears to be **DOWN** or unreachable!')
    .setColor(isUp ? 0x57F287 : 0xED4245)
    .setFooter({ text: `Last checked` })
    .setTimestamp();
}

client.login(TOKEN);
