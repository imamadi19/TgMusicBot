# 🐛 Bug Analysis Report

## Bug yang Ditemukan

### 1. Shutdown order terbalik — data bisa hilang
- **File:** `src/index.js:51`
- **Masalah:** `closeDatabase()` dipanggil **sebelum** `bot.stop()`. Artinya koneksi MongoDB ditutup dulu, sementara handler yang masih berjalan (sedang save ke DB) akan error.
- **Fix:** Panggil `bot.stop()` dulu, baru `closeDatabase()`.

### 2. `setGlobalBotApi` dipanggil 2x (redundant)
- **File:** `src/index.js:27` dan `src/handlers/index.js:14`
- **Masalah:** Keduanya panggil `setGlobalBotApi(bot.api)`. Tidak crash tapi redundant dan membingungkan.

### 3. Hardcoded `MAX_QUEUE = 50` tidak sinkron dengan premium limit
- **File:** `src/handlers/playback.js:25`
- **Masalah:** `const MAX_QUEUE = 50` hanya dipakai untuk display di `/queue` (`previewTracks.slice(0, MAX_QUEUE)`). Kalau premium user punya >50 lagu di queue, `/queue` hanya tampilkan 50 pertama — mungkin unintended. Seharusnya pakai `queueLimit` yang dinamis.

### 4. DJ mode check inkonsisten di `playHandler`
- **File:** `src/handlers/playback.js:1412-1419`
- **Masalah:** `playHandler` melakukan check DJ mode sendiri (`if (premiumSettings.djMode) ...`) tapi **tidak** memanggil `enforceDjModeControl()`. Di sini hanya check `owner/dev/auth`, sementara `enforceDjModeControl()` juga mengizinkan **premium user**. Artinya premium user bisa skip/stop/pause tapi **tidak bisa /play** saat DJ mode aktif.
- **Fix:** Gunakan `enforceDjModeControl()` yang sudah ada, bukan custom check.

### 5. `playlistInfoHandler` — missing access control
- **File:** `src/handlers/playlists.js:71`
- **Masalah:** `getPlaylist(playlistId)` tidak memfilter berdasarkan `ownerId`. Siapa pun bisa melihat isi playlist orang lain kalau tahu `playlistId`-nya. Bandingkan dengan `deletePlaylist` yang filter `ownerId`.
- **Fix:** Tambahkan check `playlist.ownerId !== ctx.from.id` atau filter di query.

### 6. Race condition di `WeakMap` download dedup
- **File:** `src/core/dl/queue-downloads.js:6`
- **Masalah:** `downloadPromises` pakai `WeakMap`. Kalau object `track` sudah di-GC sebelum download selesai, key bisa hilang dan download kedua bisa dimulai ulang. Jarang terjadi tapi possible di edge case.

### 7. Broadcast stuck — `broadcastInProgress` tidak di-reset saat sukses
- **File:** `src/handlers/broadcast.js`
- **Masalah:** `broadcastInProgress = true` di-set sebelum `runBroadcast()`, tapi hanya di-reset di `.catch()` block. Kalau `runBroadcast` sukses selesai tanpa error tapi tidak ada code yang set `broadcastInProgress = false` di success path, maka broadcast akan **stuck** dan user tidak bisa broadcast lagi selamanya (sampai bot restart).
- **Fix:** Tambahkan `finally` block atau reset di akhir `runBroadcast`.

### 8. `htmlEscape` didefinisikan 2x — versi berbeda
- **File:** `src/utils/telegram.js` dan `src/core/lyrics/lyrics-runner.js`
- **Masalah:** Versi `telegram.js` pakai `.replaceAll()` dan escape single-quote ke `&#39;`. Versi `lyrics-runner.js` pakai `.replace(/regex/g, ...)` dan escape ke `&#039;`. Inkonsisten, meskipun tidak crash.
- **Fix:** Hapus duplikat di `lyrics-runner.js`, import dari `telegram.js`.

### 9. `helpers.js` — dead code (tidak pernah di-import)
- **File:** `src/utils/helpers.js`
- **Masalah:** Export `getUrl`, `isValidMedia`, `getFile`, `coalesce`, `truncate` — tapi **tidak pernah di-import di mana pun** dalam seluruh codebase. Sepenuhnya dead code.
- **Fix:** Hapus file atau mulai gunakan.

### 10. Memory leak di beberapa Map
- **File:** `src/handlers/playback.js`
- **Masalah:** Map `panelEditLastAt`, `panelEditTasks`, `recentPlayRequests`, `lyricsRetryState`, `lyricsPrefetchTasks` tidak pernah di-cleanup secara periodik. Entry lama terus menumpuk. Untuk bot yang berjalan lama di banyak grup, ini jadi memory leak.
- **Fix:** Tambahkan periodic sweep (setInterval) untuk menghapus entry yang sudah expired.

### 11. Lyrics runner tidak di-stop saat bot shutdown
- **File:** `src/core/lyrics/lyrics-runner.js`
- **Masalah:** Tidak ada cleanup untuk `activeRunners` (Map berisi setInterval) saat bot shutdown di `src/index.js`. Timer yang berjalan bisa mencegah clean exit.
- **Fix:** Tambahkan fungsi `stopAllLyrics()` dan panggil saat shutdown.

---

## ⚠️ Potensi Masalah (tidak crash tapi perlu perhatian)

### No input validation di `premiumGrantHandler`
- **File:** `src/handlers/premium.js`
- **Masalah:** Argumen `days` bisa negatif, menghasilkan `expiresAt` di masa lalu — premium langsung expired saat di-grant.

### `searchSelectionKeyboard` messageId mismatch
- Kalau photo message dihapus dan diganti text, `messageId` bisa berubah tapi token tetap merujuk pada data lama.

---

## 🔴 Prioritas Perbaikan

| Prioritas | Bug | Dampak |
|-----------|-----|--------|
| **TINGGI** | #1 Shutdown order | Data loss saat restart |
| **TINGGI** | #4 DJ mode inkonsisten | Premium user tidak bisa /play |
| **TINGGI** | #5 Playlist access control | Privacy/security issue |
| **TINGGI** | #7 Broadcast stuck | Fitur broadcast rusak permanen |
| **SEDANG** | #10 Memory leak | Bot makin lambat seiring waktu |
| **SEDANG** | #11 Lyrics cleanup | Unclean shutdown |
| **RENDAH** | #2 Redundant call | Code quality |
| **RENDAH** | #3 MAX_QUEUE display | Minor UI issue |
| **RENDAH** | #8 htmlEscape duplikat | Inkonsistensi |
| **RENDAH** | #9 Dead code | Code hygiene |

### 12. Bot Hang / Tidak Merespon karena GROUPCALL_FORBIDDEN (Memory Leak & Process Zombie)
- **File:** `scripts/pytgcalls_adapter.py` dan `src/core/player/player.js`
- **Masalah:** Telegram sering menolak assistant (misal: "GROUPCALL_FORBIDDEN"). Saat ini terjadi berulang kali, script Python PyTgCalls menolak untuk exit dengan sendirinya (zombie thread). Node.js menunggu lewat `child.stdout.on` tanpa batasan buffer. Ini menyebabkan memory Node.js membengkak (OOM) dan process Python yang menggantung menghabiskan resource OS.
- **Fix:**
  1. Batasi ukuran akumulasi `stdout` dan `stderr` di `player.js` menjadi 5000 karakter (`.slice(-5000)`).
  2. Tambahkan `SIGKILL` paksa setelah 3 detik jika `SIGTERM` gagal mematikan Python process (di blok `START_TIMEOUT_MS`).
  3. Ganti `raise SystemExit(1)` menjadi `os._exit(1)` di `pytgcalls_adapter.py` untuk mengakhiri program tanpa terhambat zombie threads C-extension.
