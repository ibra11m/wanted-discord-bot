require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// تسجيل الأمر /bounty
const commands = [
  new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('احصل على بوستر المكافأة الخاصة بك')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands }
).then(() => console.log('✅ تم تسجيل الأمر /bounty')).catch(console.error);

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    const fileName = await generateWantedPoster(member.user);

    // يرسل البوستر في روم الدخول فقط
    const welcomeChannel = await client.channels.fetch(process.env.JOIN_CHANNEL_ID);
    if (welcomeChannel) {
      await welcomeChannel.send({
        content: `🪙 عضو جديد انضم للطاقم: **${member.user.username}**!`,
        files: [fileName],
      });
    }

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error('❌ خطأ في توليد صورة الانضمام:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() || interaction.commandName !== 'bounty') return;

  try {
    const fileName = await generateWantedPoster(interaction.user);
    await interaction.reply({
      content: `🎯 هذه مكافأتك يا **${interaction.user.username}**`,
      files: [fileName],
    });
    fs.unlinkSync(fileName);
  } catch (err) {
    console.error('❌ خطأ في توليد بوستر الأمر:', err);
    await interaction.reply({ content: '❌ صار خطأ، حاول لاحقًا.', ephemeral: true });
  }
});

// توليد صورة البوستر (مشتركة بين الانضمام و /bounty)
async function generateWantedPoster(user) {
  const canvas = Canvas.createCanvas(768, 1086);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage(path.join(__dirname, 'wanted-template.png'));
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const avatarURL = user.displayAvatarURL({ format: 'png', size: 512 });
  const avatar = await Canvas.loadImage(avatarURL);

  const avatarX = 67;
  const avatarY = 233;
  const avatarWidth = 635;
  const avatarHeight = 455;
  ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);

  ctx.font = 'bold 100px "Times New Roman"';
  ctx.fillStyle = '#3e2a14';
  ctx.textAlign = 'center';
  ctx.fillText(user.username.toUpperCase(), canvas.width / 2, 855);

  const bounty = Math.floor(Math.random() * 100000000) + 10000000;
  ctx.font = 'bold 100px "Times New Roman"';
  ctx.fillText(`${bounty.toLocaleString()}`, canvas.width / 2, 980);

  const fileName = `bounty-${user.id}.png`;
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(fileName, buffer);

  return fileName;
}

client.login(process.env.DISCORD_TOKEN);
