import express from "express";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
const PORT = process.env.PORT || 10000;

// Express server to keep Render alive
app.get("/", (req, res) => res.send("Bot is live!"));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// UptimeRobot API keys and config
const MONITORS = [
  {
    name: "Quinx | Support",
    apiKey: "m800892506-092936812863f4592e776d48",
  },
  {
    name: "Quinx Roles",
    apiKey: "u2822432-2c4c6580ce03ea9701e612e3",
  },
  {
    name: "Quinx Chat",
    apiKey: "u2822432-2c4c6580ce03ea9701e612e3",
  },
];

const GUILD_ID = "1389456112876785765";
const CHANNEL_ID = "1398266959925084221";

let statusMessage = null;

client.once("ready", async () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);

  const guild = await client.guilds.fetch(GUILD_ID);
  const channel = await guild.channels.fetch(CHANNEL_ID);

  const embed = await generateStatusEmbed();
  statusMessage = await channel.send({ embeds: [embed] });

  // Update every 5 minutes
  setInterval(async () => {
    const updatedEmbed = await generateStatusEmbed();
    if (statusMessage) {
      await statusMessage.edit({ embeds: [updatedEmbed] });
    }
  }, 5 * 60 * 1000);
});

async function generateStatusEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("🟢 Quinx Bot Status")
    .setColor("Blurple")
    .setTimestamp();

  for (const monitor of MONITORS) {
    const data = await fetchUptimeStatus(monitor.apiKey);
    embed.addFields({
      name: monitor.name,
      value: data,
      inline: true,
    });
  }

  return embed;
}

async function fetchUptimeStatus(apiKey) {
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, format: "json" }),
    });
    const json = await res.json();
    const monitor = json.monitors?.[0];
    if (!monitor) return "❓ Unknown";

    return monitor.status === 2 ? "🟢 Online" : "🔴 Offline";
  } catch (e) {
    return "⚠️ Error fetching";
  }
}

client.login(process.env.DISCORD_TOKEN);
