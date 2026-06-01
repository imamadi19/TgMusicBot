import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function finiteNumber(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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
  requestTimeoutMs: toInt(process.env.REQUEST_TIMEOUT_MS, 30000),
  downloadTimeoutMs: toInt(process.env.DOWNLOAD_TIMEOUT_MS, 180000),
  ytdlpTimeoutMs: toInt(process.env.YTDLP_TIMEOUT_MS, 180000),
  songDurationLimit: toInt(process.env.SONG_DURATION_LIMIT, 3600),
  downloadsDir: process.env.DOWNLOADS_DIR || path.resolve('downloads'),
  downloadRetentionHours: finiteNumber(process.env.DOWNLOAD_RETENTION_HOURS, 24),
  downloadCleanupIntervalMinutes: finiteNumber(process.env.DOWNLOAD_CLEANUP_INTERVAL_MINUTES, 30),
  downloadCache: toBool(process.env.DOWNLOAD_CACHE, true),
  downloadCacheMaxAgeHours: finiteNumber(process.env.DOWNLOAD_CACHE_MAX_AGE_HOURS, 24),
  downloadCacheMaxSizeMb: finiteNumber(process.env.DOWNLOAD_CACHE_MAX_SIZE_MB, 2048),
  premiumQueueLimit: (() => {
    const parsed = finiteNumber(process.env.PREMIUM_QUEUE_LIMIT, 50);
    return parsed < 10 ? 50 : parsed;
  })(),
  supportGroup: process.env.SUPPORT_GROUP ?? '',
  supportChannel: process.env.SUPPORT_CHANNEL ?? '',
  sourceUrl: process.env.SOURCE_URL ?? '',
  botUsername: String(process.env.BOT_USERNAME ?? '').replace(/^@+/, ''),
  devs: splitList(process.env.DEVS).map((id) => toInt(id)).filter(Boolean),
  cookiesPath: splitList(process.env.COOKIES_PATH),
  cookiesUrl: splitList(process.env.COOKIES_URL),
  voiceAdapterCommand: process.env.VOICE_ADAPTER_COMMAND ?? 'python3 scripts/pytgcalls_adapter.py',
  startImg: process.env.START_IMG ?? '',
  groupStartImg: process.env.GROUP_START_IMG ?? '',
  port: process.env.PORT ?? '8080',
  autoLeave: toBool(process.env.AUTO_LEAVE, true),
  streamDirect: toBool(process.env.STREAM_DIRECT, false),
  lyricsProvider: process.env.LYRICS_PROVIDER ?? 'lrclib',
  lyricsEnabledDefault: toBool(process.env.LYRICS_ENABLED_DEFAULT, false),
  lyricsAutoStart: toBool(process.env.LYRICS_AUTO_START, true),
  lyricsStrictTrackMatch: toBool(process.env.LYRICS_STRICT_TRACK_MATCH, false),
  lyricsPrefetchOnlyWhenEnabled: toBool(process.env.LYRICS_PREFETCH_ONLY_WHEN_ENABLED, false),
  lyricsCacheTtlHours: finiteNumber(process.env.LYRICS_CACHE_TTL_HOURS, 24),
  lyricsFetchTimeoutMs: finiteNumber(process.env.LYRICS_FETCH_TIMEOUT_MS, 12000),
  lyricsFetchRetries: finiteNumber(process.env.LYRICS_FETCH_RETRIES, 1),
  lyricsSearchMaxQueries: finiteNumber(process.env.LYRICS_SEARCH_MAX_QUERIES, 3),
  lyricsExactMaxCandidates: finiteNumber(process.env.LYRICS_EXACT_MAX_CANDIDATES, 3),
  lyricsPrefetchTimeoutMs: finiteNumber(process.env.LYRICS_PREFETCH_TIMEOUT_MS, 6000),
  lyricsPrefetch: toBool(process.env.LYRICS_PREFETCH, true),
  lyricsSyncOffsetMs: finiteNumber(process.env.LYRICS_SYNC_OFFSET_MS, 0),
  lyricsMinSendIntervalMs: finiteNumber(process.env.LYRICS_MIN_SEND_INTERVAL_MS, 1200),
  lyricsTickIntervalMs: finiteNumber(process.env.LYRICS_TICK_INTERVAL_MS, 300),
  lyricsMaxLineLength: finiteNumber(process.env.LYRICS_MAX_LINE_LENGTH, 300),
  lyricsStartGraceSeconds: finiteNumber(process.env.LYRICS_START_GRACE_SECONDS, 1.5),
  lyricsSkipOldLineThresholdSeconds: finiteNumber(process.env.LYRICS_SKIP_OLD_LINE_THRESHOLD_SECONDS, 3),
  lyricsDebug: toBool(process.env.LYRICS_DEBUG, false),
  lyricsNotFoundCacheTtlMinutes: finiteNumber(process.env.LYRICS_NOT_FOUND_CACHE_TTL_MINUTES, 5),
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
