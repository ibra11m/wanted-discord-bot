require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    const canvas = Canvas.createCanvas(768, 1086);
    const ctx = canvas.getContext('2d');

    const background = await Canvas.loadImage(path.join(__dirname, 'wanted-template.png'));
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const avatarURL = member.user.displayAvatarURL({ format: 'png', size: 512 });
    const avatar = await Canvas.loadImage(avatarURL);

    // 🖼️ رسم الصورة في مكان مضبوط داخل الإطار
    const avatarX = 67;
const avatarY = 233;
const avatarWidth = 635;
const avatarHeight = 455;
    ctx.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);

    // 🆔 اسم العضو بخط Times New Roman عريض فوق المكافأة
    ctx.font = 'bold 100px "Times New Roman"';
    ctx.fillStyle = '#3e2a14';
    ctx.textAlign = 'center';
    ctx.fillText(member.user.username.toUpperCase(), canvas.width / 2, 855);

    // 💰 مكافأة بشكل أقرب لـ "Wanted" الحقيقي
    const bounty = Math.floor(Math.random() * 100000000) + 10000000;
    ctx.font = 'bold 100px "Times New Roman"';
    ctx.fillText(`${bounty.toLocaleString()}`, canvas.width / 2, 980);

    // 📤 حفظ الصورة وإرسالها
    const fileName = `wanted-${member.id}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(fileName, buffer);

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      content: `🪙 عضو جديد انضم للطاقم: **${member.user.username}**!`,
      files: [fileName],
    });

    fs.unlinkSync(fileName);
  } catch (err) {
    console.error('❌ خطأ في توليد الصورة:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
