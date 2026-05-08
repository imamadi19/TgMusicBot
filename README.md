# TgMusicBot JavaScript

TgMusicBot adalah bot musik Telegram berbasis **Node.js** yang dapat mencari lagu/video, mengunduh media dengan `yt-dlp`, menyimpan playlist di MongoDB, lalu memutar hasilnya ke obrolan suara grup Telegram melalui adapter PyTgCalls bawaan.

Repo ini cocok untuk menjalankan bot musik mandiri di VPS, Docker, atau platform container seperti Heroku. Bot utama ditulis dengan `grammy`, sedangkan proses join dan streaming ke voice chat ditangani oleh skrip Python `scripts/pytgcalls_adapter.py`.

## Fitur utama

- Putar audio dengan `/play` atau `/p`.
- Putar video dengan `/vplay` atau `/v`.
- Pencarian metadata via YouTube Music, lalu fallback ke `yt-dlp` jika diperlukan.
- Mendukung URL YouTube, YouTube Music, Spotify, JioSaavn, Apple Music, dan SoundCloud selama dapat diproses `yt-dlp`.
- Queue per grup dengan batas 10 lagu.
- Kontrol playback: skip, pause, resume, stop, remove, loop, mute, unmute, dan speed.
- Playlist pengguna berbasis MongoDB.
- Menu bahasa, bantuan, statistik, pengaturan, dan privacy.
- Health server HTTP sederhana untuk deployment container.
- Siap dijalankan lewat Docker/Docker Compose.

## Alur logic aplikasi

1. **Start aplikasi**
   - `src/index.js` memuat environment variable dari `.env`, memvalidasi konfigurasi wajib, membuat health server, menghubungkan MongoDB, membuat instance bot `grammy`, mendaftarkan handler, lalu menjalankan polling bot.

2. **Command Telegram masuk**
   - Semua command didaftarkan di `src/handlers/index.js`.
   - Contoh: `/play` dan `/p` diarahkan ke `playHandler`, `/queue` ke `queueHandler`, `/skip` ke `skipHandler`, dan command playlist diarahkan ke handler playlist.

3. **Pencarian lagu/video**
   - `playHandler` membaca argumen command.
   - Jika input berupa ID playlist internal `tgpl_...`, bot mengambil daftar lagu dari MongoDB.
   - Jika input berupa kata kunci, bot mencoba mencari metadata lewat YouTube Music.
   - Jika YouTube Music gagal atau input berupa URL, bot memakai `yt-dlp` untuk mengambil info media.

4. **Validasi dan queue**
   - URL dicek agar hanya host yang didukung yang diproses.
   - Lagu/video pertama dari hasil pencarian dimasukkan ke queue grup.
   - Queue disimpan di cache memori per chat melalui `src/core/cache/chat-cache.js`.
   - Jika queue sebelumnya kosong, bot langsung mulai memutar track pertama.

5. **Download media**
   - Saat track akan diputar, `Downloader.download()` menjalankan `yt-dlp`.
   - Audio diunduh dan diekstrak menjadi MP3.
   - Video diunduh sebagai file video.
   - File hasil download disimpan ke folder `downloads` atau folder dari `DOWNLOADS_DIR`.

6. **Streaming ke voice chat**
   - `src/core/player/player.js` menjalankan command adapter dari `VOICE_ADAPTER_COMMAND`.
   - Secara default command ini adalah `python3 scripts/pytgcalls_adapter.py`.
   - Adapter memakai `API_ID`, `API_HASH`, dan session string assistant (`STRING1` atau `SESSION_STRINGS`) untuk login sebagai akun user Telegram, join voice chat grup, lalu memutar file yang sudah diunduh.

7. **Kontrol playback**
   - `/pause` dan `/resume` mengubah status pause di cache dan mengirim sinyal ke proses adapter.
   - `/skip` menghentikan proses aktif, mengeluarkan track saat ini dari queue, lalu memutar track berikutnya jika ada.
   - `/stop` atau `/end` menghentikan proses aktif dan mengosongkan queue grup.

8. **Playlist**
   - Data playlist tersimpan di collection `playlists` pada MongoDB.
   - User dapat membuat playlist, menambah lagu, menghapus lagu, melihat info playlist, dan memutar playlist memakai ID `tgpl_...`.

## Struktur folder penting

```text
src/config/              Parsing dan validasi environment variable
src/core/cache/          Cache TTL dan queue per chat
src/core/db/             Koneksi MongoDB, playlist, dan pengaturan user
src/core/dl/             Pencarian YouTube Music dan wrapper yt-dlp
src/core/player/         Abstraksi player dan proses adapter voice chat
src/handlers/            Handler command dan callback Telegram
src/i18n/                Pesan multi bahasa
src/utils/               Helper durasi dan Telegram
scripts/pytgcalls_adapter.py  Adapter Python untuk join dan streaming voice chat
```

## Prasyarat

### Wajib

- Node.js **20 atau lebih baru**.
- MongoDB lokal atau MongoDB Atlas.
- Bot Telegram dari BotFather.
- `yt-dlp` tersedia di `PATH`.
- `ffmpeg` tersedia di `PATH`.
- Python 3 dan paket dari `requirements.txt` untuk adapter PyTgCalls.
- Akun user Telegram sebagai assistant, sudah dibuat session string-nya.

### Data Telegram yang perlu disiapkan

1. **TOKEN**
   - Buat bot melalui [@BotFather](https://t.me/BotFather).
   - Salin token bot ke `TOKEN`.

2. **API_ID dan API_HASH**
   - Ambil dari <https://my.telegram.org/apps>.
   - Data ini dipakai assistant agar bisa login ke Telegram.

3. **STRING1 / SESSION_STRINGS**
   - Ini adalah session string akun user Telegram assistant.
   - Assistant harus ditambahkan ke grup tempat bot dipakai.
   - Assistant perlu bisa join voice chat grup.

4. **MONGO_URI**
   - Gunakan MongoDB lokal, contoh: `mongodb://127.0.0.1:27017`.
   - Atau MongoDB Atlas, contoh: `mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/?retryWrites=true&w=majority`.

## Cara instalasi lokal sampai jalan

### 1. Clone repo

```bash
git clone <url-repo-ini>
cd TgMusicBot
```

### 2. Install dependency sistem

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip ffmpeg curl
python3 -m pip install --user -r requirements.txt
python3 -m pip install --user --force-reinstall pyrogrammod tgcrypto
```

Jika versi Node.js dari repository OS masih di bawah 20, install Node.js 20+ dari NodeSource, nvm, atau package manager lain yang sesuai VPS Anda.

#### macOS

```bash
brew install node python ffmpeg yt-dlp
python3 -m pip install -r requirements.txt
python3 -m pip install --force-reinstall pyrogrammod tgcrypto
```

> Catatan: `requirements.txt` sudah memasukkan `yt-dlp`, tetapi Anda boleh memasang `yt-dlp` dari package manager selama command `yt-dlp` bisa dipanggil dari terminal.

### 3. Install dependency Node.js

```bash
npm install
```

### 4. Buat file `.env`

```bash
cp sample.env .env
```

Edit `.env` dan minimal isi variabel berikut:

```env
TOKEN=token_bot_dari_botfather
MONGO_URI=mongodb://127.0.0.1:27017
API_ID=123456
API_HASH=api_hash_anda
STRING1=session_string_assistant
OWNER_ID=id_telegram_owner
LOGGER_ID=id_chat_log_opsional
DB_NAME=MusicBot
DOWNLOADS_DIR=downloads
VOICE_ADAPTER_COMMAND=python3 scripts/pytgcalls_adapter.py
PORT=8080
AUTO_LEAVE=true
```

### 5. Siapkan MongoDB

Jika memakai MongoDB lokal di Ubuntu/Debian, pastikan service MongoDB aktif:

```bash
sudo systemctl enable --now mongod
sudo systemctl status mongod
```

Jika memakai MongoDB Atlas, cukup pastikan `MONGO_URI` benar dan IP server sudah diizinkan di Network Access Atlas.

### 6. Siapkan grup Telegram

1. Tambahkan bot ke grup Telegram.
2. Jadikan bot admin jika command tidak terbaca atau grup memakai pembatasan tertentu.
3. Tambahkan akun assistant yang session string-nya dipakai di `STRING1`.
4. Mulai voice chat/video chat di grup sebelum menjalankan command play.
5. Kirim `/start` ke bot, lalu coba `/play nama lagu` di grup.

### 7. Jalankan bot

```bash
npm start
```

Jika berhasil, terminal akan menampilkan bot started sebagai username bot. Health endpoint juga tersedia di port dari `PORT`, misalnya:

```bash
curl http://127.0.0.1:8080
```

Respons normal:

```json
{"ok":true,"service":"TgMusicBot JS"}
```

## Instalasi dengan Docker Compose

Cara ini paling ringkas karena Dockerfile sudah memasang Node.js, ffmpeg, Python, dan paket Python yang dibutuhkan.

### 1. Buat `.env`

```bash
cp sample.env .env
```

Isi minimal:

```env
TOKEN=token_bot_dari_botfather
MONGO_URI=mongodb://host.docker.internal:27017
API_ID=123456
API_HASH=api_hash_anda
STRING1=session_string_assistant
OWNER_ID=id_telegram_owner
VOICE_ADAPTER_COMMAND=python3 scripts/pytgcalls_adapter.py
PORT=8080
```

Untuk Linux, jika MongoDB berjalan di host dan `host.docker.internal` belum tersedia, gunakan IP host Docker atau jalankan MongoDB sebagai service terpisah.

### 2. Build dan jalankan

```bash
docker compose up -d --build
```

### 3. Lihat log

```bash
docker compose logs -f tgmusic
```

### 4. Stop bot

```bash
docker compose down
```

Folder `./downloads` di host dipasang ke `/app/downloads` di container agar file download tetap tersimpan di luar container.

## Instalasi Docker manual

```bash
docker build -t tgmusicbot .
docker run -d \
  --name tgmusicbot \
  --env-file .env \
  -p 8080:8080 \
  -v "$PWD/downloads:/app/downloads" \
  tgmusicbot
```

Melihat log:

```bash
docker logs -f tgmusicbot
```

Menghentikan container:

```bash
docker stop tgmusicbot && docker rm tgmusicbot
```

## Konfigurasi environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `TOKEN` | Ya | Token bot dari BotFather. |
| `MONGO_URI` | Ya | URI koneksi MongoDB. |
| `API_ID` | Ya untuk voice | API ID Telegram assistant. |
| `API_HASH` | Ya untuk voice | API hash Telegram assistant. |
| `STRING1` - `STRING10` | Ya untuk voice | Session string assistant. Bisa lebih dari satu untuk load balancing per chat. |
| `SESSION_STRINGS` | Opsional | Alternatif multi session dalam satu variabel, dipisah spasi atau koma. |
| `SESSION_TYPE` | Opsional | Default `pyrogram`. |
| `VOICE_ADAPTER_COMMAND` | Ya untuk voice | Default `python3 scripts/pytgcalls_adapter.py`. |
| `VOICE_VIDEO_QUALITY` | Opsional | Kualitas video PyTgCalls untuk `/vplay`; default `hd_720p` agar video lebih stabil. Nilai: `360p`, `480p`, `720p`, `1080p`, `2k`, `4k`. |
| `VOICE_VIDEO_REALTIME` | Opsional | Default `true`; menambahkan mode real-time FFmpeg (`-re`) supaya video tidak terkirim terlalu cepat dan tampak freeze. |
| `DB_NAME` | Opsional | Nama database, default `MusicBot`. |
| `DOWNLOADS_DIR` | Opsional | Folder download, default `downloads`. |
| `DEFAULT_SERVICE` | Opsional | Default `youtube`. |
| `SONG_DURATION_LIMIT` | Opsional | Batas durasi lagu dalam detik. |
| `MAX_FILE_SIZE` | Opsional | Batas ukuran file download. |
| `COOKIES_PATH` | Opsional | Path file cookies Netscape untuk `yt-dlp`. |
| `COOKIES_URL` | Opsional | URL file cookies yang akan diunduh bot. |
| `OWNER_ID` | Disarankan | ID Telegram owner. |
| `LOGGER_ID` | Opsional | Chat ID untuk pesan log startup. |
| `SUPPORT_GROUP` | Opsional | Link grup support. |
| `SUPPORT_CHANNEL` | Opsional | Link channel support. |
| `DEVS` | Opsional | Daftar ID developer, dipisah koma/spasi. |
| `PORT` | Opsional | Port health server, default `8080`. |
| `AUTO_LEAVE` | Opsional | Default `true`. |
| `API_URL` / `API_KEY` | Opsional | Disediakan untuk kompatibilitas konfigurasi. |

## Command bot

### Playback

| Command | Fungsi |
| --- | --- |
| `/play <judul/url>` atau `/p <judul/url>` | Cari, download, masukkan queue, dan putar audio. |
| `/vplay <judul/url>` atau `/v <judul/url>` | Cari, download, masukkan queue, dan putar video. |
| `/queue` | Menampilkan queue saat ini. |
| `/skip` | Lewati track aktif dan putar track berikutnya. |
| `/pause` | Pause playback. |
| `/resume` | Resume playback. |
| `/stop` atau `/end` | Hentikan playback dan kosongkan queue. |
| `/remove <nomor>` | Hapus item dari queue. |
| `/loop <jumlah>` | Atur loop. |
| `/mute` / `/unmute` | Ubah status mute di cache playback. |
| `/speed <angka>` | Atur speed playback di cache. |
| `/av` atau `/active_vc` | Lihat voice chat aktif yang dikelola bot. |

### Playlist

| Command | Fungsi |
| --- | --- |
| `/createplaylist <nama>` atau `/cplist <nama>` | Membuat playlist baru. |
| `/addtoplaylist <playlist_id> <judul/url>` | Menambahkan lagu ke playlist. |
| `/removefromplaylist <playlist_id> <track_id>` | Menghapus lagu dari playlist. |
| `/playlistinfo <playlist_id>` atau `/plistinfo <playlist_id>` | Melihat detail playlist. |
| `/myplaylists` atau `/myplist` | Melihat daftar playlist milik user. |
| `/deleteplaylist <playlist_id>` | Menghapus playlist. |

### Utility

| Command | Fungsi |
| --- | --- |
| `/start` | Menu awal. |
| `/help` | Bantuan. |
| `/language` atau `/lang` | Pilih bahasa. |
| `/ping` | Cek respons bot. |
| `/stats` | Statistik bot. |
| `/settings` | Menu pengaturan. |
| `/reload` | Muat ulang cache admin grup dengan cooldown 3 menit. |
| `/privacy` | Info privasi. |

## Cookies YouTube / yt-dlp

Kadang YouTube meminta login atau menolak request otomatis. Jika muncul pesan seperti `Sign in to confirm you're not a bot`, lakukan ini:

1. Export cookies YouTube dari browser dalam format Netscape cookies.txt.
2. Simpan file, misalnya `/home/bot/cookies.txt`.
3. Isi `.env`:

```env
COOKIES_PATH=/home/bot/cookies.txt
```

Atau host file cookies di URL privat dan isi:

```env
COOKIES_URL=https://domain-anda.example/cookies.txt
```

Jaga file cookies tetap rahasia karena dapat berisi akses akun.

## Troubleshooting

### Bot tidak start karena `TOKEN` atau `MONGO_URI` kosong

Isi variabel wajib di `.env`, lalu jalankan ulang `npm start`.

### Voice chat gagal join

Periksa hal berikut:

- `API_ID` dan `API_HASH` benar.
- `STRING1` valid dan belum expired.
- Akun assistant sudah masuk grup.
- Voice chat/video chat grup sedang aktif.
- Assistant tidak dibatasi atau dibanned.
- `VOICE_ADAPTER_COMMAND` mengarah ke adapter yang benar.

### `yt-dlp` tidak ditemukan

Pastikan command ini berhasil:

```bash
yt-dlp --version
```

Jika gagal, install `yt-dlp` atau pastikan path instalasinya masuk ke `PATH`.

### `ffmpeg` tidak ditemukan

Pastikan command ini berhasil:

```bash
ffmpeg -version
```

Jika gagal, install `ffmpeg`.

### YouTube meminta login/cookies

Isi `COOKIES_PATH` atau `COOKIES_URL` seperti bagian cookies di atas.

### MongoDB tidak bisa connect

- Untuk MongoDB lokal, pastikan service berjalan.
- Untuk Atlas, cek username, password, database user permission, dan allowlist IP.
- Di Docker, pastikan `MONGO_URI` menunjuk host yang bisa dijangkau dari container.

## Development dan test

Menjalankan test bawaan:

```bash
npm test
```

Menjalankan bot mode development tetap memakai command yang sama:

```bash
npm start
```

Pastikan `.env` tidak pernah di-commit karena berisi token, API hash, dan session string.

## Catatan keamanan

- Jangan bagikan `TOKEN`, `API_HASH`, `STRING1`, atau file cookies.
- Pakai akun assistant khusus, bukan akun utama pribadi.
- Batasi akses MongoDB hanya dari server yang menjalankan bot.
- Jika credential bocor, revoke token bot di BotFather dan buat session string baru.

## Lisensi

Project ini menggunakan lisensi GPL-3.0-only. Lihat file `LICENSE` untuk detail.
