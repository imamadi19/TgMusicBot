import http from 'node:http';
import { Bot } from 'grammy';
import { config, validateConfig } from './config/index.js';
import { connectDatabase, closeDatabase } from './core/db/mongo.js';
import { loadHandlers } from './handlers/index.js';

function startHealthServer() {
  const server = http.createServer((_, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, service: 'TgMusicBot JS' }));
  });
  server.listen(Number(config.port), '0.0.0.0');
  return server;
}

async function main() {
  validateConfig();
  const server = startHealthServer();
  await connectDatabase();

  const bot = new Bot(config.token);
  bot.api.config.use((prev, method, payload, signal) => {
    if (payload && typeof payload === 'object' && !('parse_mode' in payload)) {
      payload.parse_mode = 'HTML';
    }
    return prev(method, payload, signal);
  });
  loadHandlers(bot);

  bot.catch((error) => {
    console.error('Bot error:', error.error);
  });

  const me = await bot.api.getMe();
  console.log(`Bot started as @${me.username ?? me.first_name} (${me.id})`);
  if (config.loggerId) {
    await bot.api.sendMessage(config.loggerId, 'The JavaScript bot has started!').catch(() => {});
  }

  const stop = async () => {
    console.log('The bot is shutting down...');
    server.close();
    await closeDatabase();
    await bot.stop();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  await bot.start();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
