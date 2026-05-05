import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBool = (value, fallback = false) => {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const splitList = (value) => String(value ?? '')
  .split(/[\s,]+/)
  .map((item) => item.trim())
  .filter(Boolean);

const getSessionStrings = (prefix = 'STRING', max = 10) => {
  const sessions = [];
  for (let index = 1; index <= max; index += 1) {
    const session = process.env[`${prefix}${index}`];
    if (session) sessions.push(session);
  }
  sessions.push(...splitList(process.env.SESSION_STRINGS));
  return [...new Set(sessions)];
};

export const config = {
  apiId: toInt(process.env.API_ID),
  apiHash: process.env.API_HASH ?? '',
  token: process.env.TOKEN ?? '',
  sessionStrings: getSessionStrings(),
  sessionType: process.env.SESSION_TYPE ?? 'pyrogram',
  mongoUri: process.env.MONGO_URI ?? '',
  dbName: process.env.DB_NAME ?? 'MusicBot',
  apiUrl: process.env.API_URL ?? 'https://tgmusic.fallenapi.fun',
  apiKey: process.env.API_KEY ?? '',
  ownerId: toInt(process.env.OWNER_ID),
  loggerId: toInt(process.env.LOGGER_ID),
  proxy: process.env.PROXY ?? '',
  defaultService: process.env.DEFAULT_SERVICE ?? 'youtube',
  maxFileSize: toInt(process.env.MAX_FILE_SIZE, 500 * 1024 * 1024),
  songDurationLimit: toInt(process.env.SONG_DURATION_LIMIT, 3600),
  downloadsDir: process.env.DOWNLOADS_DIR || path.resolve('downloads'),
  supportGroup: process.env.SUPPORT_GROUP ?? '',
  supportChannel: process.env.SUPPORT_CHANNEL ?? '',
  devs: splitList(process.env.DEVS).map((id) => toInt(id)).filter(Boolean),
  cookiesPath: splitList(process.env.COOKIES_PATH),
  cookiesUrl: splitList(process.env.COOKIES_URL),
  startImg: process.env.START_IMG ?? '',
  port: process.env.PORT ?? '8080',
  autoLeave: toBool(process.env.AUTO_LEAVE, true),
};

export function validateConfig() {
  const missing = [];
  if (!config.token) missing.push('TOKEN');
  if (!config.mongoUri) missing.push('MONGO_URI');
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
  fs.mkdirSync(config.downloadsDir, { recursive: true });
}
