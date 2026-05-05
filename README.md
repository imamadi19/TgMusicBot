# TgMusicBot JavaScript

TgMusicBot is now a JavaScript/Node.js Telegram music bot that keeps the original project's command flow: configuration loading, MongoDB-backed playlists, queue management, download/search via `yt-dlp`, playback controls, help callbacks, and deployment through Docker/Heroku containers.

> Note: Telegram group-call streaming requires a JavaScript voice-call adapter. The rewrite keeps a dedicated `VoicePlayer` abstraction in `src/core/player/player.js` so a real adapter can be plugged in without changing handlers or queue logic.

## Requirements

- Node.js 20 or newer
- MongoDB
- `yt-dlp` and `ffmpeg` available on `PATH` (the Dockerfile installs both)
- Telegram bot token from BotFather

## Quick start

```bash
cp sample.env .env
npm install
npm start
```

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
