# Premium Features

Dokumen ini mendeskripsikan rancangan fitur premium untuk TgMusicBot agar mudah diimplementasikan bertahap tanpa mengganggu fitur gratis.

## Tujuan

- Memberikan peningkatan pengalaman nyata (respon cepat, audio lebih baik, kontrol queue lebih kuat).
- Menjaga fitur gratis tetap layak digunakan.
- Menyediakan basis monetisasi untuk user individu maupun server komunitas.

## Kategori fitur premium

### 1) Prioritas kualitas & performa

- **Priority queue processing**: request dari user premium diprioritaskan di atas request gratis.
- **Fast command lane**: command playback penting (`/play`, `/skip`, `/pause`, `/resume`) dieksekusi dengan cooldown lebih rendah untuk premium.
- **Premium voice stability**: retry auto reconnect voice lebih agresif untuk sesi premium.
- **Reduced cooldown**: pembatasan antar command lebih longgar untuk user premium.

### 2) Audio experience lebih bagus

- **Audio preset premium**: `bass_boost`, `vocal_boost`, `night_mode`, `clear_voice`.
- **Crossfade**: transisi antar lagu 2–4 detik.
- **Volume normalization**: leveling volume supaya antar track konsisten.
- **Advanced EQ (opsional)**: preset tambahan per room/server.

### 3) Queue & playlist lanjutan

- **Extended queue cap**: batas queue lebih besar atau tanpa batas untuk premium.
- **Extra saved playlists**: slot playlist user/server lebih banyak.
- **Smart continuation**: auto isi queue saat habis berdasarkan artis/genre serupa.
- **Queue management lanjutan**: move track, priority insert, remove by user, bulk clear.
- **Session replay**: putar ulang riwayat sesi terakhir.

### 4) Sosial / community

- **Premium vote skip rule**: threshold vote skip lebih rendah di room premium.
- **DJ role mode**: role khusus untuk lock queue, force play, force skip.
- **Anti spam request**: limit duplicate/flood request lebih ketat dan adaptif.
- **Event mode**: queue lock + only DJ mode + schedule playlist event.

## Rekomendasi rollout

### Fase 1 (MVP premium)

- Priority queue processing.
- Audio preset premium.
- Extended queue dan extra saved playlists.
- DJ role + anti spam request.

### Fase 2

- Volume normalization.
- Smart continuation.
- Premium vote skip rule.
- Event mode.

### Fase 3

- Crossfade.
- Advanced EQ.
- Session replay.

## Saran teknis singkat

- Simpan status premium per user dan per chat/server di MongoDB.
- Pastikan fallback aman: jika premium check gagal, sistem kembali ke perilaku fitur gratis.
- Pisahkan policy premium pada helper/service terpusat agar handler command tetap sederhana.
