const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

// Carrega database
let db = { ofertas: {} };

if (fs.existsSync("db.json")) {
  db = JSON.parse(fs.readFileSync("db.json"));
}

function saveDB() {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// NOME DO CARGO DE TÉCNICO
const CARGO_TECNICO = "Técnico";

// Lista dos times
const TIMES = [
  "Internacional",
  "Grêmio",
  "Flamengo",
  "Palmeiras",
  "São Paulo",
  "Corinthians"
];

client.on("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

// Verifica de qual time o técnico é
function pegarTimeDoTecnico(member) {
  if (!member.roles.cache.some(r => r.name === CARGO_TECNICO)) return null;

  let time = null;
  member.roles.cache.forEach(role => {
    if (TIMES.includes(role.name)) {
      time = role.name;
    }
  });

  return time;
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const args = msg.content.split(" ");
  const cmd = args[0].toLowerCase();

  if (cmd === "!oferta") {
    const tecnicoTime = pegarTimeDoTecnico(msg.member);
    if (!tecnicoTime)
      return msg.reply("❌ Você não é técnico ou não tem cargo de time.");

    const jogador = msg.mentions.users.first();
    if (!jogador) return msg.reply("Use: `!oferta @jogador`");

    if (!db.ofertas[jogador.id]) db.ofertas[jogador.id] = [];
    db.ofertas[jogador.id].push(tecnicoTime);
    saveDB();

    return msg.reply(
      `📨 Oferta enviada!\nO jogador **${jogador.username}** recebeu uma proposta do **${tecnicoTime}**.`
    );
  }

  if (cmd === "!contratar") {
    const tecnicoTime = pegarTimeDoTecnico(msg.member);
    if (!tecnicoTime)
      return msg.reply("❌ Você não é técnico ou não tem cargo de time.");

    const jogador = msg.mentions.members.first();
    if (!jogador) return msg.reply("Use: `!contratar @jogador`");

    if (!db.ofertas[jogador.id] || !db.ofertas[jogador.id].includes(tecnicoTime)) {
      return msg.reply("❌ Esse jogador **não tem oferta do seu time**.");
    }

    db.ofertas[jogador.id] = [];
    saveDB();

    const roleTime = msg.guild.roles.cache.find(r => r.name === tecnicoTime);
    if (roleTime) jogador.roles.add(roleTime);

    return msg.reply(
      `✅ **Contratação concluída!**\n\nJogador **${jogador.user.username}** agora é do **${tecnicoTime}**!`
    );
  }

});

client.login(process.env.TOKEN);
