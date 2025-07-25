require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let messageToEdit;

const monitorsToTrack = [
  "Quinx Chat",
  "Quinx Roles",
  "Quinx | Support"
];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "Quinx's Bots", type: 3 }], // 3 = Watching
    status: "idle",
  });

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  if (!channel) return console.error("❌ Channel not found");

  // Send embed initially
  const embed = await generateStatusEmbed();
  messageToEdit = await channel.send({ embeds: [embed] });

  // Update every 60s
  setInterval(async () => {
    const newEmbed = await generateStatusEmbed();
    if (messageToEdit) {
      messageToEdit.edit({ embeds: [newEmbed] });
    }
  }, 60000);
});

async function generateStatusEmbed() {
  const monitorData = await fetchMonitorData();

  const embed = new EmbedBuilder()
    .setTitle("🔧 Quinx Bot Status")
    .setColor("#8e44ad")
    .setTimestamp();

  for (const monitor of monitorsToTrack) {
    const data = monitorData.find(m => m.friendly_name === monitor);
    let statusIcon = "❓ Unknown";

    if (data) {
      switch (data.status) {
        case 2: statusIcon = "🟢 Active"; break;
        case 9: statusIcon = "🟡 Paused"; break;
        case 0: statusIcon = "🔴 Down"; break;
        default: statusIcon = "❔ Unknown";
      }
    }

    embed.addFields({ name: monitor, value: statusIcon, inline: false });
  }

  return embed;
}

async function fetchMonitorData() {
  try {
    const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        api_key: process.env.UPTIMEROBOT_API_KEY,
        format: "json"
      })
    });

    const json = await res.json();
    return json.monitors || [];
  } catch (err) {
    console.error("❌ Error fetching UptimeRobot data:", err);
    return [];
  }
}

client.login(process.env.TOKEN);
