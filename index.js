import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const { TOKEN, CHANNEL_ID, MESSAGE_ID, CHECK_URL } = process.env;
let lastStatus = null;

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag} (Quinx Status)`);

  client.user.setPresence({
    activities: [{ name: `Quinx's Bot`, type: ActivityType.Watching }],
    status: 'idle'
  });

  // Start checking immediately, then every 60s
  checkUptime();
  setInterval(checkUptime, 60 * 1000);
});

async function checkUptime() {
  try {
    const res = await fetch(CHECK_URL, { timeout: 5000 });
    const isUp = res.ok;

    if (isUp !== lastStatus) {
      lastStatus = isUp;

      const channel = await client.channels.fetch(CHANNEL_ID);
      const message = await channel.messages.fetch(MESSAGE_ID);

      const embed = new EmbedBuilder()
        .setTitle('📡 Quinx Bot Uptime')
        .setColor(isUp ? 0x57F287 : 0xED4245)
        .setDescription(
          isUp
            ? '✅ Quinx Bot is **UP** and running smoothly!'
            : '❌ Quinx Bot is **DOWN** or unreachable!'
        )
        .setFooter({ text: `Last Checked` })
        .setTimestamp();

      await message.edit({ embeds: [embed] });
      console.log(`[${new Date().toLocaleTimeString()}] Status changed: ${isUp ? 'UP' : 'DOWN'}`);
    }
  } catch (err) {
    console.error('❗ Error during uptime check:', err.message);
  }
}

client.login(TOKEN);
