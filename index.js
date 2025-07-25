import dotenv from "dotenv";
import fetch from "node-fetch";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const MONITORS = [
  { name: "Quinx Chat", url: "https://chat-uptime.com" },
  { name: "Quinx Roles", url: "https://roles-uptime.com" },
  { name: "Quinx Support", url: "https://support-uptime.com" },
];

async function checkStatus() {
  const results = await Promise.allSettled(
    MONITORS.map((m) =>
      fetch(m.url, { method: "HEAD", timeout: 5000 }).then((res) => ({
        name: m.name,
        status: res.ok ? "🟢 Active" : "🔴 Offline",
      }))
    )
  );

  const statuses = results.map((result, i) => {
    if (result.status === "fulfilled") return `${result.value.name}: ${result.value.status}`;
    return `${MONITORS[i].name}: 🔴 Offline`;
  });

  const embed = new EmbedBuilder()
    .setTitle("🔧 Quinx Bot Status")
    .setDescription(statuses.join("\n"))
    .setColor(0x9370db) // Purple
    .setTimestamp();

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  if (channel) {
    if (!global.statusMessage) {
      const msg = await channel.send({ embeds: [embed] });
      global.statusMessage = msg;
    } else {
      global.statusMessage.edit({ embeds: [embed] });
    }
  }
}

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  checkStatus();
  setInterval(checkStatus, 60_000); // every 60 seconds
});

client.login(process.env.DISCORD_TOKEN);
