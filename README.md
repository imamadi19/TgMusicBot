# TgMusicBot JavaScript

TgMusicBot is now a JavaScript/Node.js Telegram music bot that keeps the original project's command flow: configuration loading, MongoDB-backed playlists, queue management, download/search via `yt-dlp`, playback controls, help callbacks, and deployment through Docker/Heroku containers.

> Note: Telegram group-call streaming is handled by the bundled PyTgCalls adapter (`scripts/pytgcalls_adapter.py`). Set `API_ID`, `API_HASH`, `STRING1`, and keep `VOICE_ADAPTER_COMMAND=python3 scripts/pytgcalls_adapter.py` so the assistant account can join the active voice chat.

## Requirements

- Node.js 20 or newer
- MongoDB
- `yt-dlp` and `ffmpeg` available on `PATH` (the Dockerfile installs both)
- Python packages `pyrogram`, `tgcrypto`, and `py-tgcalls` for the bundled Telegram voice adapter (the Dockerfile installs them)
- `ytmusic-api` is used for YouTube Music search metadata before falling back to `yt-dlp`
- Telegram bot token from BotFather

## Quick start

```bash
cp sample.env .env
npm install
npm start
```

If YouTube asks yt-dlp to sign in, export browser cookies to a Netscape-format file and set `COOKIES_PATH=/absolute/path/to/cookies.txt` in `.env`. You can also set `COOKIES_URL` to a hosted cookies file URL.

For voice chat playback, add the assistant user account to your group, start the group voice/video chat, and set `SESSION_TYPE=pyrogram` plus `STRING1` in `.env`. The default adapter command is `VOICE_ADAPTER_COMMAND=python3 scripts/pytgcalls_adapter.py`; override it only if you provide your own adapter.

## Main commands

- `/play` or `/p` — search/download and queue audio
- `/vplay` or `/v` — search/download and queue video
- `/queue` — show the current queue
- `/skip`, `/pause`, `/resume`, `/stop`, `/end` — playback controls
- `/createplaylist`, `/addtoplaylist`, `/playlistinfo`, `/myplaylists` — playlist flow
- `/stats`, `/settings`, `/privacy` — utility commands

## Project layout

```text
src/config        Environment parsing and validation
src/core/cache    TTL cache and per-chat queue cache
src/core/db       MongoDB connection and playlist collections
src/core/dl       yt-dlp search/download wrapper
src/core/player   Voice player abstraction
src/handlers      Telegram command and callback handlers
src/utils         Telegram and duration helpers
```
