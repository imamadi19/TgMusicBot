import { spawn } from 'node:child_process';
import { config } from '../../config/index.js';
import { chatCache } from '../cache/chat-cache.js';

const READY_MARKER = 'TGMB_READY';
const START_TIMEOUT_MS = 30000;
const MAX_ERROR_LENGTH = 1200;
const MAX_LOG_LENGTH = 2000;

function truncate(text, max = MAX_ERROR_LENGTH) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function normalizeVoiceError(text) {
  const value = truncate(text);
  const lowered = value.toLowerCase();
  if (lowered.includes('bot_method_invalid') || lowered.includes('phone.creategroupcall')) {
    return 'STRING1/SESSION_STRINGS harus session string akun user assistant, bukan bot token/session bot. Buat ulang STRING1 dari akun Telegram biasa, tambahkan assistant ke grup, dan aktifkan voice/video chat.';
  }
  if (lowered.includes('assistant login terdeteksi sebagai bot')) return value;
  if (lowered.includes('peer id invalid') || lowered.includes('could not find the input entity')) {
    return 'Assistant belum bisa menemukan grup. Pastikan assistant sudah join grup, pernah membuka chat grup, dan chat_id benar.';
  }
  if (lowered.includes('groupcallforbidden') || lowered.includes('forbidden')) {
    return 'Assistant tidak punya izin voice chat. Beri izin/jadikan admin, lalu pastikan voice/video chat grup aktif.';
  }
  return value;
}

function logAdapterOutput(prefix, chunk, writer) {
  const text = String(chunk);
  writer.write(`${prefix} ${text.length > MAX_LOG_LENGTH ? `${text.slice(0, MAX_LOG_LENGTH)}…\n` : text}`);
}

function sessionForChat(chatId) {
  if (config.sessionStrings.length === 0) return '';
  const hash = Math.abs(Number.parseInt(String(chatId).replace(/\D/g, '').slice(-6), 10) || 0);
  return config.sessionStrings[hash % config.sessionStrings.length];
}

export class VoicePlayer {
  #active = new Map();

  #killActive(chatId) {
    const key = String(chatId);
    const active = this.#active.get(key);
    if (active?.process && !active.process.killed) {
      active.process.kill('SIGTERM');
      setTimeout(() => {
        if (!active.process.killed) active.process.kill('SIGKILL');
      }, 5000).unref?.();
    }
    this.#active.delete(key);
  }

  async play(chatId, track) {
    if (!track?.filePath) throw new Error('File audio/video belum tersedia untuk diputar.');
    if (!config.voiceAdapterCommand) throw new Error('VOICE_ADAPTER_COMMAND belum diisi. Gunakan adapter PyTgCalls bawaan atau command adapter lain.');
    if (!config.apiId || !config.apiHash) throw new Error('API_ID dan API_HASH wajib diisi agar assistant bisa login.');

    const sessionString = sessionForChat(chatId);
    if (!sessionString) throw new Error('STRING1/SESSION_STRINGS belum diisi, assistant tidak bisa join obrolan video.');

    this.#killActive(chatId);

    const child = spawn(config.voiceAdapterCommand, [], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TGMB_API_ID: String(config.apiId),
        TGMB_API_HASH: config.apiHash,
        TGMB_SESSION_TYPE: config.sessionType,
        TGMB_SESSION_STRING: sessionString,
        TGMB_CHAT_ID: String(chatId),
        TGMB_FILE_PATH: track.filePath,
        TGMB_TRACK_ID: String(track.trackId ?? ''),
        TGMB_TRACK_TITLE: String(track.name ?? ''),
        TGMB_TRACK_URL: String(track.url ?? ''),
        TGMB_IS_VIDEO: track.isVideo ? '1' : '0',
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stdout); });
    child.stderr.on('data', (chunk) => { stderr += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stderr); });
    child.on('exit', () => {
      const active = this.#active.get(String(chatId));
      if (active?.process === child) this.#active.delete(String(chatId));
    });

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Assistant timeout saat join obrolan video. Pastikan obrolan video aktif dan assistant sudah ada di grup.')), START_TIMEOUT_MS);
      timer.unref?.();

      const cleanup = () => {
        clearTimeout(timer);
        child.stdout.off('data', onStdout);
        child.off('error', onError);
        child.off('exit', onExit);
      };
      const onStdout = () => {
        if (stdout.includes(READY_MARKER)) {
          cleanup();
          resolve();
        }
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const onExit = (code) => {
        cleanup();
        reject(new Error(normalizeVoiceError(stderr || stdout || `Voice adapter keluar dengan kode ${code}`)));
      };

      child.stdout.on('data', onStdout);
      child.once('error', onError);
      child.once('exit', onExit);
    });

    this.#active.set(String(chatId), { ...track, startedAt: new Date(), process: child });
    return this.#active.get(String(chatId));
  }

  pause(chatId) {
    chatCache.setPaused(chatId, true);
    const active = this.#active.get(String(chatId));
    if (active?.process && !active.process.killed) active.process.kill('SIGUSR1');
  }

  resume(chatId) {
    chatCache.setPaused(chatId, false);
    const active = this.#active.get(String(chatId));
    if (active?.process && !active.process.killed) active.process.kill('SIGUSR2');
  }

  stop(chatId) {
    this.#killActive(chatId);
    chatCache.clear(chatId);
  }

  skip(chatId) {
    const skipped = chatCache.shift(chatId);
    this.#killActive(chatId);
    const next = chatCache.current(chatId);
    return { skipped, next };
  }

  activeCalls() {
    return [...this.#active.entries()].map(([chatId, track]) => ({ chatId, track }));
  }
}

export const voicePlayer = new VoicePlayer();
