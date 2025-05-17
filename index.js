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

// تسجيل أمر /bounty
const commands = [
  new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('احصل على بوستر المكافأة الخاصة بك')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
rest.put(
  Routes.applicationGuildCommands(
    process.env.APPLICATION_ID,
    process.env.GUILD_ID
  ),
  { body: commands }
)
  .then(() => console.log('✅ تم تسجيل الأمر /bounty'))
  .catch(console.error);

// بوت جاهز
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// عند دخول عضو جديد
client.on('guildMemberAdd', async (member) => {
  try {
    const fileName = await generateWantedPoster(member.user);

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

// أمر /bounty
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() || interaction.commandName !== 'bounty') return;

  try {
    await interaction.deferReply();

    const fileName = await generateWantedPoster(interaction.user);
    await interaction.editReply({
      content: `🎯 هذه مكافأتك يا **${interaction.user.username}**`,
      files: [fileName],
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error('❌ خطأ في توليد بوستر الأمر:', err);
    try {
      await interaction.followUp({ content: '❌ صار خطأ، حاول لاحقًا.', ephemeral: true });
    } catch (e) {
      console.error('❌ خطأ في الرد الاحتياطي:', e);
    }
  }
});

// توليد البوستر
async function generateWantedPoster(user) {
  const canvas = Canvas.createCanvas(768, 1086);
  const ctx = canvas.getContext('2d');

  const templatePath = path.join(__dirname, 'wanted-template.png');
  if (!fs.existsSync(templatePath)) {
    throw new Error('❌ ملف wanted-template.png غير موجود.');
  }

  const background = await Canvas.loadImage(templatePath);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  const avatarURL = user.displayAvatarURL({ format: 'png', size: 512 });
  const avatar = await Canvas.loadImage(avatarURL);

  ctx.drawImage(avatar, 67, 233, 635, 455);

  ctx.font = 'bold 100px "Times New Roman"';
  ctx.fillStyle = '#3e2a14';
  ctx.textAlign = 'center';
  ctx.fillText(user.username.toUpperCase(), canvas.width / 2, 855);

  const bounty = Math.floor(Math.random() * 7_000_000_001);
  ctx.font = 'bold 100px "Times New Roman"';
  ctx.fillText(`${bounty.toLocaleString()}`, canvas.width / 2, 980);

  const fileName = `bounty-${user.id}.png`;
  fs.writeFileSync(fileName, canvas.toBuffer('image/png'));

  return fileName;
}

client.login(process.env.DISCORD_TOKEN);
