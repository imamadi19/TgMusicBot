import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { config } from '../../config/index.js';
import { chatCache } from '../cache/chat-cache.js';

const READY_MARKER = 'TGMB_READY';
const START_TIMEOUT_MS = 30000;
const MAX_ERROR_LENGTH = 1200;
const MAX_LOG_LENGTH = 2000;
const TRACK_END_GRACE_MS = 3000;
const ASSISTANT_LEAVE_DELAY_MS = 60 * 60 * 1000;
const CONTROL_ACK_TIMEOUT_MS = 5000;

function signalProcess(child, signal) {
  if (!child || child.killed) return;
  try {
    if (child.pid) {
      process.kill(-child.pid, signal);
      return;
    }
  } catch {
    // Fall back to signalling the shell process when process groups are unavailable.
  }
  try {
    child.kill(signal);
  } catch {
    // Best-effort control signals must not crash the bot.
  }
}

function truncate(text, max = MAX_ERROR_LENGTH) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function uniqueInviteLinks(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))];
}

function normalizeInviteLinks(options = {}) {
  const values = Array.isArray(options.inviteLinks) ? options.inviteLinks : [options.inviteLink];
  return uniqueInviteLinks(values);
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

export function adapterShellCommand() {
  // Keep the wrapper shell alive when playback-control signals are sent to the
  // detached process group. Without this trap, /bin/sh can terminate on
  // SIGUSR1/SIGUSR2 before the Python adapter handles pause/resume, causing the
  // Node child "exit" handler to forget the active playback.
  return `trap '' USR1 USR2; ${config.voiceAdapterCommand}`;
}

function sessionStartIndexForChat(chatId) {
  if (config.sessionStrings.length === 0) return 0;
  const hash = Math.abs(Number.parseInt(String(chatId).replace(/\D/g, '').slice(-6), 10) || 0);
  return hash % config.sessionStrings.length;
}

function sessionForChat(chatId) {
  return config.sessionStrings[sessionStartIndexForChat(chatId)] ?? '';
}

function sessionCandidatesForChat(chatId) {
  const sessions = config.sessionStrings;
  if (sessions.length === 0) return [];
  const startIndex = sessionStartIndexForChat(chatId);
  return sessions.map((sessionString, offset) => {
    const index = (startIndex + offset) % sessions.length;
    return { assistantNumber: index + 1, sessionString: sessions[index] };
  });
}

function shouldTryNextAssistant(error) {
  const message = String(error?.message ?? error).toLowerCase();
  return [
    'assistant belum bisa menemukan grup',
    'gagal join assistant',
    'semua link invite gagal',
    'peer id invalid',
    'could not find the input entity',
    'assistant login terdeteksi sebagai bot',
    'bot_method_invalid',
    'phone.creategroupcall',
    'groupcallforbidden',
    'forbidden',
  ].some((marker) => message.includes(marker));
}

function durationToMs(duration) {
  const value = Number(duration);
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Most downloader metadata uses seconds, but protect against accidental ms.
  return value > 100000 ? value : value * 1000;
}

function clearTimer(timer) {
  if (timer) clearTimeout(timer);
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((resolve) => child.once('exit', resolve));
}

function waitForAdapterAck(active, commandId, timeoutMs = CONTROL_ACK_TIMEOUT_MS) {
  const okPattern = `TGMB_CONTROL_OK ${commandId} `;
  const errorPattern = `TGMB_CONTROL_ERROR ${commandId} `;
  return new Promise((resolve, reject) => {
    let output = '';
    const cleanup = () => {
      clearTimeout(timer);
      active.process.stdout?.off('data', onData);
      active.process.stderr?.off('data', onData);
      active.process.off('exit', onExit);
    };
    const onData = (chunk) => {
      output += String(chunk);
      if (output.includes(okPattern)) {
        cleanup();
        resolve(true);
        return;
      }
      const errorIndex = output.indexOf(errorPattern);
      if (errorIndex !== -1) {
        cleanup();
        const message = output.slice(errorIndex + errorPattern.length).split(/\r?\n/, 1)[0] || 'adapter command failed';
        reject(new Error(message));
      }
    };
    const onExit = () => {
      cleanup();
      reject(new Error('adapter exited before confirming command'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('adapter command confirmation timed out'));
    }, timeoutMs);
    timer.unref?.();
    active.process.stdout?.on('data', onData);
    active.process.stderr?.on('data', onData);
    active.process.once('exit', onExit);
  });
}

async function sendAdapterCommand(active, command) {
  if (!active?.process?.stdin || active.process.stdin.destroyed || active.process.killed) return false;
  const commandId = crypto.randomUUID();
  const ack = waitForAdapterAck(active, commandId);
  try {
    active.process.stdin.write(`${JSON.stringify({ id: commandId, ...command })}\n`);
    await ack;
    return true;
  } catch (error) {
    console.warn(`Voice adapter control command failed: ${error.message}`);
    return false;
  }
}

function resetTrackTiming(track, startedAt = new Date()) {
  delete track.remainingMs;
  delete track.timerEndsAt;
  track.startedAt = startedAt;
  return startedAt;
}

export function requesterKey(track) {
  const requesterId = track?.userId ?? track?.requesterId ?? track?.requestedById;
  if (requesterId !== undefined && requesterId !== null && requesterId !== '') return `id:${requesterId}`;
  const requesterName = String(track?.user ?? track?.requestedBy ?? '').trim().toLowerCase();
  return requesterName ? `name:${requesterName}` : '';
}

function hasDifferentRequester(current, next) {
  const currentRequester = requesterKey(current);
  const nextRequester = requesterKey(next);
  return Boolean(currentRequester && nextRequester && currentRequester !== nextRequester);
}

export class VoicePlayer {
  #active = new Map();

  #finishTimers = new Map();

  #leaveTimers = new Map();

  #joinAttempts = new Map();

  #chatSessions = new Map();

  #chatInviteLinks = new Map();

  #onTrackEnd = null;

  onTrackEnd(handler) {
    this.#onTrackEnd = handler;
  }

  #inviteLinksFor(chatId, options = {}) {
    const key = String(chatId);
    const incomingLinks = normalizeInviteLinks(options);
    if (incomingLinks.length > 0) {
      const mergedLinks = uniqueInviteLinks([...incomingLinks, ...(this.#chatInviteLinks.get(key) ?? [])]);
      this.#chatInviteLinks.set(key, mergedLinks);
      return mergedLinks;
    }
    return this.#chatInviteLinks.get(key) ?? [];
  }

  #setActiveTrack(chatId, track, process, assistantNumber, startedAt = new Date()) {
    const key = String(chatId);
    chatCache.setPaused(key, false);
    resetTrackTiming(track, startedAt);
    const activeTrack = { ...track, startedAt, process, assistantNumber };
    this.#active.set(key, activeTrack);
    this.#scheduleTrackEnd(key, activeTrack, process);
    return activeTrack;
  }

  async #replaceActiveStream(chatId, track, active) {
    if (!track?.filePath || !(await sendAdapterCommand(active, { action: 'play', file_path: track.filePath, is_video: Boolean(track.isVideo) }))) {
      return null;
    }
    const key = String(chatId);
    if (active.suspended) {
      signalProcess(active.process, 'SIGCONT');
      active.suspended = false;
    }
    this.#clearFinishTimer(key);
    return this.#setActiveTrack(key, track, active.process, active.assistantNumber);
  }

  #clearFinishTimer(chatId) {
    const key = String(chatId);
    clearTimer(this.#finishTimers.get(key));
    this.#finishTimers.delete(key);
  }

  #cancelLeaveTimer(chatId) {
    const key = String(chatId);
    clearTimer(this.#leaveTimers.get(key));
    this.#leaveTimers.delete(key);
  }

  #scheduleLeaveChat(chatId) {
    if (!config.autoLeave) return;
    const key = String(chatId);
    this.#cancelLeaveTimer(key);
    const timer = setTimeout(() => {
      this.#leaveTimers.delete(key);
      if (chatCache.getQueueLength(key) > 0 || this.#active.has(key)) return;
      this.leaveChat(key).catch((error) => console.warn(`Assistant failed to leave chat ${key}`, error));
    }, ASSISTANT_LEAVE_DELAY_MS);
    timer.unref?.();
    this.#leaveTimers.set(key, timer);
  }

  #killActive(chatId, { scheduleLeave = false } = {}) {
    const key = String(chatId);
    this.#clearFinishTimer(key);
    const active = this.#active.get(key);
    if (active?.process && !active.process.killed) {
      signalProcess(active.process, 'SIGTERM');
      setTimeout(() => signalProcess(active.process, 'SIGKILL'), 5000).unref?.();
    }
    this.#active.delete(key);
    if (scheduleLeave) this.#scheduleLeaveChat(key);
  }

  #scheduleTrackEnd(chatId, track, child, delayMs = null) {
    const trackDurationMs = durationToMs(track.duration);
    const durationMs = delayMs ?? (trackDurationMs ? trackDurationMs + TRACK_END_GRACE_MS : 0);
    if (!durationMs || durationMs <= 0) return;
    const key = String(chatId);
    this.#clearFinishTimer(key);
    const active = this.#active.get(key);
    if (active?.process === child) {
      active.timerEndsAt = Date.now() + durationMs;
      active.remainingMs = durationMs;
    }
    const timer = setTimeout(() => {
      const current = this.#active.get(key);
      if (current?.process !== child) return;
      this.#finishTimers.delete(key);
      this.#finishCurrentTrack(key, 'ended');
    }, durationMs);
    timer.unref?.();
    this.#finishTimers.set(key, timer);
  }

  #finishCurrentTrack(chatId, reason) {
    const key = String(chatId);
    const finished = chatCache.shift(key);
    const next = chatCache.current(key);
    if (!next) {
      this.#killActive(key, { scheduleLeave: true });
    } else {
      this.#cancelLeaveTimer(key);
    }
    if (this.#onTrackEnd) {
      Promise.resolve(this.#onTrackEnd({ chatId: key, finished, next, reason })).catch((error) => {
        console.warn(`Track-end handler failed for chat ${key}`, error);
      });
    }
    return { finished, next };
  }

  async #spawnAdapter(chatId, env, { waitReady = true } = {}) {
    const child = spawn(adapterShellCommand(), [], {
      shell: true,
      detached: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        TGMB_API_ID: String(config.apiId),
        TGMB_API_HASH: config.apiHash,
        TGMB_SESSION_TYPE: config.sessionType,
        TGMB_CHAT_ID: String(chatId),
        ...env,
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stdout); });
    child.stderr.on('data', (chunk) => { stderr += chunk; logAdapterOutput(`[voice:${chatId}]`, chunk, process.stderr); });

    if (!waitReady) return child;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signalProcess(child, 'SIGTERM');
        reject(new Error('Assistant timeout saat join obrolan video. Pastikan obrolan video aktif dan assistant sudah ada di grup.'));
      }, START_TIMEOUT_MS);
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
        if (code === 0 && stdout.includes(READY_MARKER)) {
          resolve();
          return;
        }
        reject(new Error(normalizeVoiceError(stderr || stdout || `Voice adapter keluar dengan kode ${code}`)));
      };

      child.stdout.on('data', onStdout);
      child.once('error', onError);
      child.once('exit', onExit);
    });

    return child;
  }

  async joinChat(chatId, options = {}) {
    if (!config.voiceAdapterCommand || !config.apiId || !config.apiHash) return false;

    const sessionCandidates = sessionCandidatesForChat(chatId);
    if (sessionCandidates.length === 0) return false;

    const key = String(chatId);
    if (this.#joinAttempts.has(key)) return this.#joinAttempts.get(key);

    const inviteLinks = this.#inviteLinksFor(key, options);
    const joinPromise = (async () => {
      const failures = [];
      for (const candidate of sessionCandidates) {
        try {
          const child = await this.#spawnAdapter(chatId, {
            TGMB_ACTION: 'join_chat',
            TGMB_SESSION_STRING: candidate.sessionString,
            TGMB_ASSISTANT_INDEX: String(candidate.assistantNumber),
            TGMB_INVITE_LINK: inviteLinks[0] ?? '',
            TGMB_INVITE_LINKS: JSON.stringify(inviteLinks),
          });
          await waitForExit(child);
          this.#chatSessions.set(key, candidate.sessionString);
          return true;
        } catch (error) {
          failures.push({ assistantNumber: candidate.assistantNumber, error });
          if (!shouldTryNextAssistant(error)) throw error;
          if (failures.length < sessionCandidates.length) {
            console.warn(`Assistant ${candidate.assistantNumber} gagal join awal di chat ${chatId}; mencoba assistant berikutnya.`, error);
          }
        }
      }

      const detail = failures.map(({ assistantNumber: number, error }) => `Assistant ${number}: ${truncate(error?.message ?? error, 240)}`).join(' | ');
      throw new Error(`Semua assistant gagal join grup. ${detail}`);
    })();

    this.#joinAttempts.set(key, joinPromise);
    try {
      return await joinPromise;
    } finally {
      this.#joinAttempts.delete(key);
    }
  }

  async play(chatId, track, options = {}) {
    if (!track?.filePath) throw new Error('File audio/video belum tersedia untuk diputar.');
    if (!config.voiceAdapterCommand) throw new Error('VOICE_ADAPTER_COMMAND belum diisi. Gunakan adapter PyTgCalls bawaan atau command adapter lain.');
    if (!config.apiId || !config.apiHash) throw new Error('API_ID dan API_HASH wajib diisi agar assistant bisa login.');

    const sessionCandidates = sessionCandidatesForChat(chatId);
    if (sessionCandidates.length === 0) throw new Error('STRING1/SESSION_STRINGS belum diisi, assistant tidak bisa join obrolan video.');

    const key = String(chatId);
    if (this.#joinAttempts.has(key)) {
      try {
        await this.#joinAttempts.get(key);
      } catch (error) {
        console.warn(`Assistant pre-join failed for chat ${chatId}; play will retry directly.`, error);
      }
    }

    this.#cancelLeaveTimer(key);
    const active = this.#active.get(key);
    if (options.reuseActive && active) {
      const activeTrack = await this.#replaceActiveStream(key, track, active);
      if (activeTrack) return activeTrack;
    }
    this.#killActive(key);

    const inviteLinks = this.#inviteLinksFor(key, options);
    const failures = [];
    let child = null;
    let assistantNumber = 0;

    for (const candidate of sessionCandidates) {
      try {
        child = await this.#spawnAdapter(chatId, {
          TGMB_ACTION: 'play',
          TGMB_SESSION_STRING: candidate.sessionString,
          TGMB_ASSISTANT_INDEX: String(candidate.assistantNumber),
          TGMB_INVITE_LINK: inviteLinks[0] ?? '',
          TGMB_INVITE_LINKS: JSON.stringify(inviteLinks),
          TGMB_FILE_PATH: track.filePath,
          TGMB_TRACK_ID: String(track.trackId ?? ''),
          TGMB_TRACK_TITLE: String(track.name ?? ''),
          TGMB_TRACK_URL: String(track.url ?? ''),
          TGMB_IS_VIDEO: track.isVideo ? '1' : '0',
        });
        assistantNumber = candidate.assistantNumber;
        this.#chatSessions.set(key, candidate.sessionString);
        break;
      } catch (error) {
        failures.push({ assistantNumber: candidate.assistantNumber, error });
        if (!shouldTryNextAssistant(error)) throw error;
        if (failures.length < sessionCandidates.length) {
          console.warn(`Assistant ${candidate.assistantNumber} gagal join/play di chat ${chatId}; mencoba assistant berikutnya.`, error);
        }
      }
    }

    if (!child) {
      const detail = failures.map(({ assistantNumber: number, error }) => `Assistant ${number}: ${truncate(error?.message ?? error, 240)}`).join(' | ');
      throw new Error(`Semua assistant gagal join obrolan video. ${detail}`);
    }

    child.on('exit', () => {
      const active = this.#active.get(String(chatId));
      if (active?.process === child) {
        this.#active.delete(String(chatId));
        this.#clearFinishTimer(chatId);
      }
    });

    return this.#setActiveTrack(key, track, child, assistantNumber);
  }

  async pause(chatId) {
    const key = String(chatId);
    const active = this.#active.get(key);
    if (!active) return false;
    chatCache.setPaused(key, true);
    if (active.timerEndsAt) {
      active.remainingMs = Math.max(1000, active.timerEndsAt - Date.now());
      active.timerEndsAt = null;
      const currentTrack = chatCache.current(key);
      if (currentTrack) {
        currentTrack.remainingMs = active.remainingMs;
        currentTrack.timerEndsAt = null;
        currentTrack.startedAt = active.startedAt;
      }
      this.#clearFinishTimer(key);
    }

    if (active.suspended) {
      signalProcess(active.process, 'SIGCONT');
      active.suspended = false;
    }
    const acknowledged = await sendAdapterCommand(active, { action: 'pause' });
    if (!acknowledged) signalProcess(active.process, 'SIGUSR1');
    return true;
  }

  async resume(chatId) {
    const key = String(chatId);
    const active = this.#active.get(key);
    if (!active) return false;
    if (active.suspended) {
      signalProcess(active.process, 'SIGCONT');
      active.suspended = false;
    }

    const acknowledged = await sendAdapterCommand(active, { action: 'resume' });
    if (!acknowledged) signalProcess(active.process, 'SIGUSR2');
    chatCache.setPaused(key, false);
    if (active.remainingMs && !active.timerEndsAt) {
      const trackDurationMs = durationToMs(active.duration);
      if (trackDurationMs) {
        active.startedAt = new Date(Date.now() - Math.max(0, trackDurationMs - active.remainingMs));
      }
      this.#scheduleTrackEnd(key, active, active.process, active.remainingMs);
      const currentTrack = chatCache.current(key);
      if (currentTrack) {
        currentTrack.remainingMs = active.remainingMs;
        currentTrack.timerEndsAt = active.timerEndsAt;
        currentTrack.startedAt = active.startedAt;
      }
    }
    return true;
  }

  async stopOrAdvance(chatId, { reuseActive = false } = {}) {
    const key = String(chatId);
    const [current, next] = chatCache.getQueue(key);
    if (current && next && hasDifferentRequester(current, next)) {
      const { skipped, next: nextTrack, activeTrack } = await this.skip(key, { reuseActive });
      return { stopped: skipped, next: nextTrack, activeTrack, cleared: false };
    }

    const hadPlayback = this.stop(key);
    return { stopped: current, next: null, activeTrack: null, cleared: true, hadPlayback };
  }

  stop(chatId) {
    const hadPlayback = this.#active.has(String(chatId)) || chatCache.getQueueLength(chatId) > 0;
    this.#killActive(chatId, { scheduleLeave: true });
    this.#chatInviteLinks.delete(String(chatId));
    chatCache.clear(chatId);
    return hadPlayback;
  }

  stopAll() {
    const chatIds = [...this.#active.keys()];
    for (const chatId of chatIds) {
      this.stop(chatId);
    }
    return chatIds.length;
  }

  async replay(chatId, track = chatCache.current(chatId)) {
    const key = String(chatId);
    const active = this.#active.get(key);
    if (!active || !track) return null;
    const activeTrack = await this.#replaceActiveStream(key, track, active);
    return activeTrack;
  }

  async skip(chatId, { reuseActive = false } = {}) {
    const key = String(chatId);
    const active = this.#active.get(key);
    const skipped = chatCache.shift(key);
    const next = chatCache.current(key);

    if (reuseActive && skipped && next && active) {
      const activeTrack = await this.#replaceActiveStream(key, next, active);
      if (activeTrack) {
        this.#cancelLeaveTimer(key);
        return { skipped, next, activeTrack };
      }
    }

    this.#killActive(key, { scheduleLeave: chatCache.getQueueLength(key) === 0 });
    if (next) this.#cancelLeaveTimer(key);
    return { skipped, next, activeTrack: null };
  }

  async leaveChat(chatId) {
    if (!config.voiceAdapterCommand || !config.apiId || !config.apiHash) return false;
    const key = String(chatId);
    const sessionString = this.#chatSessions.get(key) ?? sessionForChat(key);
    if (!sessionString) return false;
    const child = await this.#spawnAdapter(chatId, {
      TGMB_ACTION: 'leave_chat',
      TGMB_SESSION_STRING: sessionString,
    }, { waitReady: false });
    await waitForExit(child);
    return true;
  }

  activeTrack(chatId) {
    return this.#active.get(String(chatId));
  }

  activeCalls() {
    return [...this.#active.entries()].map(([chatId, track]) => ({ chatId, track }));
  }
}

export const voicePlayer = new VoicePlayer();
