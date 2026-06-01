export const translations = {
  en: {
    buttons: {
      support: 'Support', channel: 'Channel', source: 'Source', addToGroup: 'Add me to your group', user: 'User', admin: 'Admin', playlist: 'Playlist', owner: 'Owner', developer: 'Developer', back: 'Back', pause: '⏸ Pause', resume: '▶️ Resume', skip: '⏭ Skip', stop: '⏹ Stop', mute: '🔇 Mute', unmute: '🔊 Unmute', addToPlaylist: '➕ Playlist', close: 'Close', language: '🌐 Language', help: 'Help', settings: 'Settings', chooseLanguage: 'Choose language',
      setupGuide: 'Setup Guide', musicFeatures: 'Music Features', myPlaylists: 'My Playlists', premium: 'Premium', playMusic: 'Play Music', playVideo: 'Play Video', queue: 'Queue', groupSettings: 'Group Settings', djMode: 'DJ Mode',
      defaultService: 'Default Service', audioPreset: 'Audio Preset', premiumInfo: 'Premium Info',
      lyricsOn: 'Turn On',
      lyricsOff: 'Turn Off',
      lyricsRefresh: 'Refresh',
      lyricsClearCache: 'Clear Cache',
      lyricsClearRefresh: 'Clear + Refresh',
      lyricsOnNext: 'Turn On for Next Song'
    },
    general: { user: 'User', openingHelp: 'Opening help menu...', unknownHelp: 'Unknown help category.', chooseHelp: 'Choose a help category:', useBack: 'Use the button below to go back.' },
    language: { choose: 'Please choose your language. Your choice will be saved until you change it again.', saved: 'Language saved: {language}', invalid: 'Unsupported language.', current: 'Current language: {language}' },
    start: {
      text: '👋 Hey {name},\nThis is <b>{botName}</b>!\n\n🎧 A music player bot with some awesome and useful features.\n\nℹ️ Click on the help button for more info.',
      private: {
        title: 'Welcome to TgMusicBot',
        greeting: 'Hi, <b>{name}</b>!',
        description: 'I can help play music and videos in Telegram group voice chats.',
        stepsTitle: 'How to start:',
        stepAddBot: 'Add the bot to your group',
        stepAddAssistant: 'Add the assistant/userbot to the group',
        stepStartVoice: 'Start the voice chat',
        stepPlay: 'Type <code>/play song name</code>',
        featuresTitle: 'Main features:',
        featurePlayback: 'Audio & video playback',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Personal playlists',
        featureQueue: 'Queue control',
        featurePremiumPreset: 'Premium audio presets',
        featureDjMode: 'DJ mode for groups',
        chooseMenu: 'Choose a menu below:'
      },
      group: {
        title: 'TgMusicBot is active in this group!',
        description: 'Ready to play music in voice chat.',
        statusTitle: 'Group status:',
        queueLimit: 'Queue limit: <b>{limit}</b>',
        djMode: 'DJ Mode: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Use the buttons below for quick help.',
        voiceTip: 'Tip: Start the voice chat before playing music.'
      },
      setup: {
        title: 'TgMusicBot Setup Guide',
        content: '1. <b>Add the bot to your group</b>\nPromote the bot to admin if the group restricts messages/commands.\n\n2. <b>Add the assistant</b>\nThe assistant/userbot must be in the group to join the voice chat.\n\n3. <b>Start the voice chat</b>\nStart the voice chat/video chat in the group.\n\n4. <b>Play a song</b>\nUse <code>/play song title</code>.'
      },
      features: {
        title: 'Music Features',
        content: '• Audio & video playback\n• YouTube / Spotify / Apple Music / SoundCloud\n• Queue control\n• Personal playlists\n• Premium audio presets\n• DJ mode for groups'
      },
      playlist: {
        title: 'Personal Playlists',
        content: 'Use:\n<code>/cplist name</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Larger queue limits\n• /qmove to move queue items\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo to check status'
      },
      groupPlay: {
        title: 'Play Music',
        content: 'Use:\n<code>/play song title</code>\n\nExample:\n<code>/play faded alan walker</code>\n\nTip:\nStart the voice chat before playing music.'
      },
      groupVideo: {
        title: 'Play Video',
        content: 'Use:\n<code>/vplay video title</code>\n\nExample:\n<code>/vplay faded alan walker official video</code>\n\nTip:\nStart the voice chat / video chat before playing video.'
      },
      groupQueue: {
        title: 'Queue',
        content: 'Use:\n<code>/queue</code>\n\nThis command displays the list of songs currently in the group queue.'
      },
      groupSkip: {
        title: 'Skip',
        content: 'Use:\n<code>/skip</code>\n\nThis command skips the currently playing song.\nIf DJ Mode is active, only admin/auth/premium users can use this control.'
      },
      groupDjMode: {
        title: 'DJ Mode',
        content: 'Use:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nWhen active, controls like skip, stop, seek, volume, shuffle, and qmove can only be used by admin/auth/premium users.'
      },
      settings: {
        title: 'Settings',
        content: 'Use the <code>/settings</code> command to open the bot settings menu.'
      },
      closed: 'Closed.',
      back: 'Back',
      close: 'Close'
    },
    help: { userTitle: 'User Commands', adminTitle: 'Admin Commands', devTitle: 'Developer Commands', ownerTitle: 'Owner Commands', playlistTitle: 'Playlist Commands', userContent: '<b>Playback:</b>\n• <code>/play [song]</code> — Play a track\n• <code>/vplay [song]</code> — Play as video\n\n<b>Utilities:</b>\n• <code>/start</code> — Start the bot\n• <code>/language</code> — Change language\n• <code>/privacy</code> — View privacy policy\n• <code>/queue</code> — Show current queue', adminContent: '<b>Controls:</b>\n• <code>/skip</code> — Skip current track\n• <code>/pause</code> — Pause playback\n• <code>/resume</code> — Resume playback\n• <code>/seek [sec]</code> — Seek marker\n\n<b>Queue:</b>\n• <code>/remove [x]</code> — Remove a track\n• <code>/loop [0-10]</code> — Set loop count', devContent: '<b>System:</b>\n• <code>/stats</code> — Show usage statistics\n• <code>/av</code> — Active voice chats', ownerContent: '<b>Maintenance:</b>\n• <code>/broadcast [text]</code> — Broadcast message\n• <code>/logger</code> — Show logger chat\n• <code>/settings</code> — Chat settings', playlistContent: '<b>Management:</b>\n• <code>/createplaylist [name]</code> — Create playlist\n• <code>/deleteplaylist [id]</code> — Delete playlist\n• <code>/addtoplaylist [id] [url]</code> — Add track\n• <code>/removefromplaylist [id] [trackId]</code> — Remove track\n• <code>/playlistinfo [id]</code> — Show playlist\n• <code>/myplaylists</code> — List playlists' },
    callbacks: { track: 'Track', nowPlaying: 'Now Playing', paused: 'Paused', muted: 'Muted', noActivePlayback: 'There is no active playback.', settingsIgnored: 'Settings callbacks are handled separately.', closingPanel: 'Closing panel.', trackSkipped: 'Track skipped.', playbackStopped: 'Playback stopped.', playbackPaused: 'Playback paused.', playbackResumed: 'Playback resumed.', playbackMuted: 'Playback muted.', playbackUnmuted: 'Playback unmuted.', actionFailed: 'Unable to process playback action.', requestedBy: 'Requested by: {user}', pausedBy: 'Paused by {user}', resumedBy: 'Resumed by {user}', mutedBy: 'Muted by {user}', unmutedBy: 'Unmuted by {user}', defaultPlaylistName: 'My Playlist (TgMusic)', addedToPlaylist: 'Track "{song}" added to playlist "{playlist}".', requesterOnly: 'Only the user who requested this track can use these buttons.' },
    playback: { addedToQueue: 'Added to queue: {count}', nowPlaying: 'Now playing', title: 'Title', duration: 'Duration', requestedBy: 'Requested by', duplicate: 'Track already in queue or playing.', downloadFailed: 'Download failed: {error}', voiceFailed: 'Assistant failed to join/play in voice chat: {error}', voiceChatInactiveWarning: '⚠️ Voice chat is not active in this group yet. Start a voice/video chat first, then play music.', queueFull: 'Queue is full (max {max} tracks). Use /end to clear.', playUsage: '<b>Usage:</b>\n/play [song or URL]\n/play request [song name]\n/play url [direct URL or playlist URL]\n\n<b>Supported Platforms:</b>\n- YouTube\n- Spotify\n- JioSaavn\n- Apple Music\n- SoundCloud', searchingPlaylist: '🔍 Searching playlist...', searchingDownload: '🔍 Searching and downloading...', playlistNotFound: '❌ Playlist not found.', playlistEmpty: '❌ Playlist is empty.', addedPlaylistTracks: '✅ Added {count} track(s) from playlist. Queue length: {length}.', invalidUrl: 'Invalid URL or unsupported platform.\n\nSupported: YouTube, Spotify, Apple Music, SoundCloud.', fetchError: '❌ Error fetching track info: {error}', noTracks: 'No tracks found.', queueEmpty: 'Queue is empty.', queueTitle: 'Queue:', nothingPlaying: 'Nothing is playing.', skippedNow: 'Skipped: {skipped}\nNow playing: {next}', skippedEnded: 'Skipped: {skipped}\nQueue ended.', queueEnded: 'Music has finished.', stopped: 'Stopped playback and cleared queue.', paused: 'Paused playback.', resumed: 'Resumed playback.', removeUsage: 'Usage: /remove [queue number]', removed: 'Removed: {name}', invalidQueue: 'Invalid queue number.', loopSet: 'Loop count set to {count}.', muted: 'Muted playback.', unmuted: 'Unmuted playback.', speedSet: 'Playback speed set to {speed}x.', seekUsage: 'Usage: /seek <seconds|mm:ss|+seconds|-seconds>', seekOutOfRange: 'Seek position is out of range.', seeked: 'Seeked to {position}.', volumeUsage: 'Usage: /volume <0-200>', volumeSet: 'Volume set to {volume}.', shuffleNotEnough: 'Need at least 2 upcoming tracks to shuffle.', shuffleDone: 'Upcoming queue shuffled.', noActive: 'No active voice chats.',
      chooseTrack: 'Choose a YouTube result:',
      selectionExpired: 'This YouTube selection has expired. Please search again.',
      selectionOwnerOnly: 'Only the user who searched can choose this result.',
      invalidSelection: 'Invalid YouTube selection.',
      trackSelected: 'Selected result #{number}.',
      downloadingSelected: '⬇️ Downloading selected track: {title}',
      channel: 'Channel',
      views: 'Views',
      upload: 'Upload',
      url: 'URL',
      soundcloudDiscovery: 'SoundCloud Discovery',
      soundcloudSelectHint: 'Choose this SoundCloud track to play.',
      soundcloudOpen: 'Open on SoundCloud',
      soundcloudNowPlaying: 'SoundCloud Now Playing' },
    auth: { listTitle: 'Authorized Users', none: 'No authorized users found.', groupOnly: 'This command can only be used in groups.', adminOnly: 'You must be an administrator to use this command.', adminVerifyFailed: 'Unable to verify administrator status.', targetRequired: 'Reply to a user or provide a numeric user ID.', already: 'This user is already authorized.', notAuthorized: 'This user is not authorized.', added: 'User {userId} has been authorized.', removed: 'User {userId} has been removed from the authorized list.', addFailed: 'Failed to authorize the user.', removeFailed: 'Failed to remove authorized user.' },
    playlist: { createUsage: 'Usage: /createplaylist [name]', created: '✅ Playlist created.\nName: {name}\nID: <code>{id}</code>', deleteUsage: 'Usage: /deleteplaylist [playlist id]', deleted: '✅ Playlist deleted.', notFound: '❌ Playlist not found.', addUsage: 'Usage: /addtoplaylist [playlist id] [song or URL]', noTrack: 'No track found.', added: '✅ Added {song} to {playlist}.', removeUsage: 'Usage: /removefromplaylist [playlist id] [track id]', removed: '✅ Track removed.', infoUsage: 'Usage: /playlistinfo [playlist id]', empty: 'Empty', none: 'You do not have playlists yet.', trackCount: 'tracks' },
    filters: { botNotAdmin: 'Bot is not an administrator in this chat.\nPlease promote the bot with invite users permission.', botAdminVerifyFailed: 'Unable to verify bot administrator status.', botMissingInvite: 'The bot does not have permission to invite users.', botNotAdminReload: 'Bot is not an administrator in this chat.\nUse /reload to refresh admin cache.', adminRequired: 'You must be an administrator to use this command.', notAuthorized: 'You are not authorized to use this command.', adminActionRequired: 'You must be an administrator to use this action.', actionNotAuthorized: 'You are not authorized to use this action.', playModeAdminOnly: 'Play mode is enabled.\nOnly administrators and authorized users can start playback.' },
    devs: { devOnly: 'Only developers can use this command.', noActiveChats: 'No active chats found.', clearAssistantsDone: 'Removed assistant from {count} chats.', clearAssistantsFailed: 'Failed to clear assistants: {error}', leaveAllStarted: 'Assistant is leaving all chats...', leaveAllDone: "Assistant left {count} chats.", leaveAllFailed: 'Failed to leave all chats: {error}', loggerMissing: 'Please set LOGGER_ID in .env first.', loggerUsage: 'Usage: /logger [enable|disable|on|off]\nCurrent status: {status}', loggerEnabled: 'Logger Enabled', loggerDisabled: 'Logger disabled', loggerInvalid: "Invalid argument. Use 'enable', 'disable', 'on', or 'off'." },
    broadcast: { usage: 'Please reply to a message to broadcast.\n\nUsage:\n/broadcast -chat : groups only\n/broadcast -user : users only\n/broadcast -both : groups + users (default)\n/broadcast -copy : send as copy\n\nExamples:\n/broadcast\n/broadcast -chat\n/broadcast -user -copy', started: 'Broadcast started.', ended: 'Broadcast ended.\nGroups: {groups}\nUsers: {users}', stopped: 'Broadcast stopped.\nGroups: {groups}\nUsers: {users}', stopRequested: 'Broadcast stopped.', noneInProgress: 'No broadcast in progress.', alreadyInProgress: 'A broadcast is already in progress.', noTargets: 'No targets found.', failed: 'Broadcast failed: {error}' },
    misc: { pinging: 'Pinging...', pong: 'Pong! {ms} ms', stats: 'Uptime: {uptime}s\nMemory: {memory} MB\nCPU: {cpu} core(s)\nNode: {node}', privacy: '<b>Privacy Policy for {botName}</b>\n\n1. <b>Data Storage</b>\nWe do not store personal data on your device or track browsing activity.\n\n2. <b>Collection</b>\nWe only collect Telegram user IDs, chat IDs, chat settings, authorization data, and playlists needed to provide music services. We do not store phone numbers or locations.\n\n3. <b>Usage</b>\nData is used strictly for bot functionality. No marketing or commercial use.\n\n4. <b>Sharing</b>\nWe do not sell, trade, or share user data with third parties except Telegram infrastructure required for bot operation.\n\n5. <b>Security</b>\nWe use reasonable safeguards, but no online service is 100% secure.\n\n6. <b>Cookies</b>\n{botName} does not use tracking cookies. Optional YouTube cookies configured by the bot owner are only used for media extraction.\n\n7. <b>Your Rights</b>\nYou can request data deletion or block the bot to revoke access.\n\n8. <b>Updates</b>\nPolicy changes will be announced in the bot.\n\n9. <b>Contact</b>\nQuestions? Contact our {support}.\n\n──────────────────\nNote: This policy ensures a safe and respectful experience with {botName}.', settings: 'Settings\nDefault service: {service}\nSong duration limit: {limit}s\nMax file size: {size} MB\nLanguage: {language}', logger: 'Logger chat: {logger}', notConfigured: 'not configured', ownerBroadcast: 'Only the owner can broadcast.', broadcastPending: 'Broadcast scheduling is preserved in the JavaScript flow; connect a chat registry before sending.', broadcastUsage: 'Usage: /broadcast [text]', ownerShell: 'Only the owner can use shell commands.', shellDisabled: 'Shell execution is disabled in the JavaScript rewrite for safer default deployments.', noop: 'Command accepted. This administrative flow is available as a JavaScript extension point.' },
    premium: { ownerOnly: 'Only the owner can manage premium.', grantUsage: 'Usage: /premiumgrant [user|chat] [id] [days=30]', revokeUsage: 'Usage: /premiumrevoke [user|chat] [id]', infoUsage: 'Usage: /premiuminfo [user|chat] [id]', granted: '✅ Premium granted for {scope} <code>{id}</code> until {expires}.', revoked: '✅ Premium revoked for {scope} <code>{id}</code>.', notFound: 'No premium data found for {scope} <code>{id}</code>.', notActiveFeature: 'This feature is only available for active premium user/chat.', info: 'Premium {scope} <code>{id}</code>\nStatus: <b>{status}</b>\nExpires: <b>{expires}</b>', features: '<b>Premium Features</b>\n\n1) Priority Quality & Performance\n• Priority queue processing\n• Faster playback command lane\n• Better reconnect stability\n\n2) Better Audio Experience\n• Premium audio presets\n• Crossfade support\n• Volume normalization\n\n3) Advanced Queue & Playlist\n• Higher queue limit\n• More saved playlists\n• Smart continuation\n\n4) Social / Community\n• Better vote-skip rule\n• DJ role mode\n• Anti-spam request\n• Event mode' },
    settings: {
      private: { title: 'Settings', description: 'Manage your personal bot preferences.' },
      group: { title: 'Group Settings', description: 'Manage this group\'s music preferences.' },
      labels: { user: 'User', group: 'Group', language: 'Language', defaultService: 'Default service', userDefaultService: 'Your default service', audioPreset: 'Audio preset', djMode: 'DJ Mode', premium: 'Premium', queueLimit: 'Queue limit' },
      chooseMenu: 'Choose a setting below:',
      service: { title: 'Default Service', description: 'Choose which platform should be used first when searching music.', current: 'Current', unsupported: 'Unsupported service.', alreadySelected: '{service} is already selected.', selected: '{service} selected.' },
      help: { title: 'Settings Help', content: '• Default Service determines the primary search platform.\n• Language changes the bot display language.\n• In groups, Audio Preset and DJ Mode are managed with premium/admin commands.' },
      preset: { title: 'Audio Preset', content: 'Use the following commands to change the audio preset:', current: 'Current preset' },
      djMode: { title: 'DJ Mode', content: 'When DJ Mode is active, sensitive controls (skip, stop, seek, volume, shuffle, qmove) are restricted to admin/auth/premium users.', current: 'Current status' },
      premium: {
        title: 'Premium Info',
        content: 'Use /premiumfeatures and /premiuminfo to learn more about premium features.',
        status: 'Status: <b>{premium}</b>',
        queueLimit: 'Queue limit: <b>{queueLimit}</b>'
      },
      groupOnly: 'This setting is only available in groups.',
      closed: 'Closed.'
    },
    admin: { groupOnly: 'This command can only be used in groups.', reloadWait: 'Please wait {time} before using this command again.', reloadStarted: 'Reloading administrator cache...', reloadSuccess: 'Administrator cache reloaded successfully. Cached {count} admin(s).', reloadFailed: 'Failed to reload administrator cache: {error}' },
    lyrics: {
      enabled: 'Synced lyrics enabled.',
      disabled: 'Synced lyrics disabled.',
      noActiveTrack: 'No active song is playing.',
      willStartNext: 'Lyrics will activate when the next song starts playing.',
      fetching: 'Searching synced lyrics...',
      notFound: 'Synced lyrics are not available for this song.',
      syncedAvailable: 'Synced lyrics are available. Use <code>/lyrics on</code> to enable.',
      plainOnly: 'Only plain lyrics are available, synced lyrics are not available.',
      started: 'Synced lyrics started.',
      stopped: 'Synced lyrics stopped.',
      status: 'Lyrics Status',
      statusEnabled: 'Enabled',
      statusDisabled: 'Disabled',
      provider: 'Provider',
      currentTrack: 'Current song',
      adminOnly: 'Only admins/auth users can toggle lyrics in groups.',
      error: 'Failed to process lyrics: {error}',
      prefetching: 'Preparing lyrics...',
      cached: 'Lyrics are available in cache.',
      syncOffset: 'Sync offset',
      currentPosition: 'Current position',
      linesLoaded: 'Lyrics lines loaded',
      waitingForCache: 'Lyrics are being prepared in the background.',
      cacheCleared: 'Lyrics cache for this song has been cleared.',
      cacheMiss: 'Cache: miss',
      cacheHit: 'Cache: hit',
      refreshing: 'Refreshing lyrics...',
      debugTitle: 'Lyrics Debug',
      notFoundReason: 'Not found reason',
      noCache: 'No cache for this song.',
      lookupCandidates: 'Search candidates',
      bestMatch: 'Best match',
      panelTitle: 'Lyrics',
      track: 'Track',
      statusLabel: 'Status',
      cache: 'Cache',
      synced: 'Synced',
      lines: 'Lines',
      chooseAction: 'Choose action below:',
      cacheSynced: 'Cache: synced',
      cachePlainOnly: 'Cache: plain lyrics only',
      cacheNotFound: 'Cache: not found',
      refreshDone: 'Lyrics refresh completed.',
      clearRefresh: 'Clear + Refresh',
      permissionDenied: 'Only admins/auth/requester/premium can change lyrics.',
      providerTimeout: 'LRCLIB timeout. Coba refresh lagi.',
      providerError: 'Provider lirik sedang bermasalah. Coba lagi nanti.',
      closed: 'Closed.',
      notAvailable: 'Not available',
      available: 'Available',
      unknown: 'Not checked'
    }
  },
};

const aliases = {
  id: {
    buttons: {
      support: 'Dukungan',
      channel: 'Kanal',
      source: 'Sumber',
      addToGroup: 'Tambahkan ke Grup',
      user: 'Pengguna',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Pemilik',
      developer: 'Developer',
      back: 'Kembali',
      pause: '⏸ Jeda',
      resume: '▶️ Lanjutkan',
      skip: '⏭ Lewati',
      stop: '⏹ Stop',
      mute: '🔇 Bisukan',
      unmute: '🔊 Bunyikan',
      addToPlaylist: '➕ Playlist',
      close: 'Tutup',
      language: '🌐 Bahasa',
      help: 'Bantuan',
      settings: 'Pengaturan',
      chooseLanguage: 'Pilih bahasa',
      setupGuide: 'Panduan Setup',
      musicFeatures: 'Fitur Musik',
      myPlaylists: 'Playlist Saya',
      premium: 'Premium',
      playMusic: 'Play Musik',
      playVideo: 'Play Video',
      queue: 'Queue',
      groupSettings: 'Settings Grup',
      djMode: 'DJ Mode',
      lyricsOn: 'Nyalakan',
      lyricsOff: 'Matikan',
      lyricsRefresh: 'Refresh',
      lyricsClearCache: 'Clear Cache',
      lyricsClearRefresh: 'Clear + Refresh',
      lyricsOnNext: 'Nyalakan untuk lagu berikutnya'
    },
    language: {
      choose: 'Silakan pilih bahasa. Pilihanmu akan disimpan sampai kamu mengubahnya lagi.',
      saved: 'Bahasa disimpan: {language}',
      invalid: 'Bahasa tidak didukung.',
      current: 'Bahasa saat ini: {language}'
    },
    start: {
      text: "Halo {name},\n\nSaya {botName}, pemutar musik Telegram berbasis JavaScript.\n\n<b>Platform yang didukung:</b> YouTube, Spotify, Apple Music, SoundCloud.\n\nGunakan tombol di bawah untuk melihat perintah atau mengubah bahasa.",
      private: {
        title: 'Selamat datang di TgMusicBot',
        greeting: 'Hai, <b>{name}</b>!',
        description: 'Aku bisa membantu memutar musik dan video ke voice chat grup Telegram.',
        stepsTitle: 'Cara mulai:',
        stepAddBot: 'Tambahkan bot ke grup',
        stepAddAssistant: 'Tambahkan assistant/userbot ke grup',
        stepStartVoice: 'Aktifkan voice chat',
        stepPlay: 'Ketik <code>/play nama lagu</code>',
        featuresTitle: 'Fitur utama:',
        featurePlayback: 'Audio & video playback',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Playlist pribadi',
        featureQueue: 'Queue control',
        featurePremiumPreset: 'Premium audio preset',
        featureDjMode: 'DJ mode untuk grup',
        chooseMenu: 'Pilih menu di bawah:'
      },
      group: {
        title: 'TgMusicBot aktif di grup ini!',
        description: 'Siap memutar musik ke voice chat.',
        statusTitle: 'Status grup:',
        queueLimit: 'Queue limit: <b>{limit}</b>',
        djMode: 'DJ Mode: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Gunakan tombol di bawah untuk bantuan cepat.',
        voiceTip: 'Tips: Mulai voice chat dulu sebelum memutar lagu.'
      },
      setup: {
        title: 'Panduan Setup TgMusicBot',
        content: '1. <b>Tambahkan bot ke grup</b>\nJadikan bot admin jika grup membatasi pesan/command.\n\n2. <b>Tambahkan assistant</b>\nAssistant/userbot harus ada di grup agar bisa join voice chat.\n\n3. <b>Aktifkan voice chat</b>\nMulai voice chat/video chat di grup.\n\n4. <b>Putar lagu</b>\nGunakan <code>/play judul lagu</code>.'
      },
      features: {
        title: 'Fitur Musik',
        content: '• Audio & video playback\n• YouTube / Spotify / Apple Music / SoundCloud\n• Queue control\n• Playlist pribadi\n• Premium audio preset\n• DJ mode untuk grup'
      },
      playlist: {
        title: 'Playlist Pribadi',
        content: 'Gunakan:\n<code>/cplist nama</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Queue limit lebih besar\n• /qmove untuk memindahkan antrean\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo untuk melihat status'
      },
      groupPlay: {
        title: 'Putar Musik',
        content: 'Gunakan:\n<code>/play judul lagu</code>\n\nContoh:\n<code>/play faded alan walker</code>\n\nTips:\nMulai voice chat dulu sebelum memutar lagu.'
      },
      groupVideo: {
        title: 'Putar Video',
        content: 'Gunakan:\n<code>/vplay judul video</code>\n\nContoh:\n<code>/vplay faded alan walker official video</code>\n\nTips:\nMulai video chat/voice chat dulu sebelum memutar video.'
      },
      groupQueue: {
        title: 'Queue',
        content: 'Gunakan:\n<code>/queue</code>\n\nCommand ini menampilkan daftar lagu yang sedang antre di grup.'
      },
      groupSkip: {
        title: 'Skip',
        content: 'Gunakan:\n<code>/skip</code>\n\nCommand ini melewati lagu yang sedang diputar.\nJika DJ Mode aktif, hanya admin/auth/premium user yang bisa memakai kontrol ini.'
      },
      groupDjMode: {
        title: 'DJ Mode',
        content: 'Gunakan:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nSaat aktif, kontrol seperti skip, stop, seek, volume, shuffle, dan qmove hanya bisa dipakai admin/auth/premium user.'
      },
      settings: {
        title: 'Pengaturan',
        content: 'Gunakan perintah <code>/settings</code> untuk membuka menu pengaturan bot.'
      },
      closed: 'Ditutup.',
      back: 'Kembali',
      close: 'Tutup'
    },
    general: { chooseHelp: 'Pilih kategori bantuan:', openingHelp: 'Membuka menu bantuan...', unknownHelp: 'Kategori bantuan tidak dikenal.', useBack: 'Gunakan tombol di bawah untuk kembali.', user: 'Pengguna' },
    playback: { nowPlaying: 'Sedang diputar', addedToQueue: 'Ditambahkan ke antrean: {count}', queueEmpty: 'Antrean kosong.', nothingPlaying: 'Tidak ada yang sedang diputar.', stopped: 'Pemutaran dihentikan dan antrean dibersihkan.', paused: 'Pemutaran dijeda.', resumed: 'Pemutaran dilanjutkan.', noTracks: 'Tidak ada lagu ditemukan.', playlistNotFound: '❌ Playlist tidak ditemukan.', playlistEmpty: '❌ Playlist kosong.', duplicate: 'Lagu sudah ada di antrean atau sedang diputar.', queueTitle: 'Antrean:', queueEnded: 'Musik telah selesai.', searchingDownload: '🔍 Mencari dan mengunduh...', chooseTrack: 'Pilih hasil YouTube:', downloadingSelected: '⬇️ Mengunduh trek terpilih: {title}', channel: 'Channel', views: 'Dilihat', upload: 'Diunggah', url: 'URL' },
    misc: { pinging: 'Menguji...', privacy: 'Privasi: bot ini menyimpan pengaturan chat, data otorisasi, dan playlist yang diperlukan untuk pemutaran. Bot ini tidak menjual data pengguna.', notConfigured: 'belum dikonfigurasi' },
    playlist: { notFound: '❌ Playlist tidak ditemukan.', empty: 'Kosong', none: 'Kamu belum memiliki playlist.' },
    callbacks: { requesterOnly: 'Hanya pengguna yang request lagu ini yang bisa memakai tombol ini.' },
    lyrics: {
      enabled: 'Lirik sinkron diaktifkan.',
      disabled: 'Lirik sinkron dimatikan.',
      noActiveTrack: 'Tidak ada lagu yang sedang diputar.',
      willStartNext: 'Lirik akan aktif saat lagu berikutnya diputar.',
      fetching: 'Mencari lirik sinkron...',
      notFound: 'Lirik sinkron tidak tersedia untuk lagu ini.',
      syncedAvailable: 'Lirik sinkron tersedia. Gunakan <code>/lyrics on</code> untuk menyalakan.',
      plainOnly: 'Hanya lirik biasa yang tersedia, lirik sinkron tidak tersedia.',
      started: 'Lirik sinkron dimulai.',
      stopped: 'Lirik sinkron dihentikan.',
      status: 'Status lirik',
      statusEnabled: 'Aktif',
      statusDisabled: 'Nonaktif',
      provider: 'Provider',
      currentTrack: 'Lagu saat ini',
      adminOnly: 'Hanya admin/auth yang bisa mengubah lirik di grup.',
      error: 'Gagal memproses lirik: {error}',
      prefetching: 'Menyiapkan lirik...',
      cached: 'Lirik sudah tersedia di cache.',
      syncOffset: 'Offset sinkronisasi',
      currentPosition: 'Posisi saat ini',
      linesLoaded: 'Baris lirik dimuat',
      waitingForCache: 'Lirik sedang disiapkan di background.',
      cacheCleared: 'Cache lirik untuk lagu ini dihapus.',
      cacheMiss: 'Cache: miss',
      cacheHit: 'Cache: hit',
      refreshing: 'Mengambil ulang lirik...',
      debugTitle: 'Debug Lirik',
      notFoundReason: 'Alasan tidak ditemukan',
      noCache: 'Belum ada cache untuk lagu ini.',
      lookupCandidates: 'Kandidat pencarian',
      bestMatch: 'Hasil terbaik',
      panelTitle: 'Lirik',
      track: 'Lagu',
      statusLabel: 'Status',
      cache: 'Cache',
      synced: 'Sinkron',
      lines: 'Baris',
      chooseAction: 'Pilih aksi di bawah:',
      cacheSynced: 'Cache: lirik sinkron',
      cachePlainOnly: 'Cache: hanya lirik biasa',
      cacheNotFound: 'Cache: tidak ditemukan',
      refreshDone: 'Refresh lirik selesai.',
      clearRefresh: 'Clear + Refresh',
      permissionDenied: 'Hanya admin/auth/requester/premium yang bisa mengubah lirik.',
      providerTimeout: 'LRCLIB timeout. Coba Refresh lagi.',
      providerError: 'Provider lirik sedang bermasalah. Coba lagi nanti.',
      closed: 'Ditutup.',
      notAvailable: 'Tidak tersedia',
      available: 'Tersedia',
      unknown: 'Belum dicek'
    }
  },
  ru: {
    buttons: {
      support: 'Поддержка',
      channel: 'Канал',
      source: 'Исходный код',
      addToGroup: 'Добавить в группу',
      user: 'Пользователь',
      admin: 'Админ',
      playlist: 'Плейлист',
      owner: 'Владелец',
      developer: 'Разработчик',
      back: 'Назад',
      pause: '⏸ Пауза',
      resume: '▶️ Возобновить',
      skip: '⏭ Пропустить',
      stop: '⏹ Стоп',
      mute: '🔇 Выкл. звук',
      unmute: '🔊 Вкл. звук',
      addToPlaylist: '➕ Плейлист',
      close: 'Закрыть',
      language: '🌐 Язык',
      help: 'Помощь',
      settings: 'Настройки',
      chooseLanguage: 'Выбрать язык',
      setupGuide: 'Инструкция',
      musicFeatures: 'Функции музыки',
      myPlaylists: 'Мои плейлисты',
      premium: 'Premium',
      playMusic: 'Играть музыку',
      playVideo: 'Играть видео',
      queue: 'Очередь',
      groupSettings: 'Настройки группы',
      djMode: 'Режим DJ'
    },
    language: { choose: 'Выберите язык. Выбор сохранится, пока вы не измените его снова.', saved: 'Язык сохранён: {language}', invalid: 'Язык не поддерживается.', current: 'Текущий язык: {language}' },
    start: {
      text: "👋 Привет, {name}!\nЭто <b>{botName}</b>!\n\n🎧 Бот для проигрывания музыки с отличными функциями.\n\nℹ️ Нажмите кнопку помощи для подробностей.",
      private: {
        title: 'Добро пожаловать в TgMusicBot',
        greeting: 'Привет, <b>{name}</b>!',
        description: 'Я могу помочь воспроизводить музыку и видео в голосовых чатах групп Telegram.',
        stepsTitle: 'Как начать:',
        stepAddBot: 'Добавьте бота в вашу группу',
        stepAddAssistant: 'Добавьте ассистента/юзербота в группу',
        stepStartVoice: 'Запустите голосовой чат',
        stepPlay: 'Введите <code>/play название песни</code>',
        featuresTitle: 'Основные функции:',
        featurePlayback: 'Воспроизведение аудио и видео',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Личные плейлисты',
        featureQueue: 'Управление очередью',
        featurePremiumPreset: 'Премиум аудио пресеты',
        featureDjMode: 'Режим DJ для групп',
        chooseMenu: 'Выберите меню ниже:'
      },
      group: {
        title: 'TgMusicBot активен в этой группе!',
        description: 'Готов воспроизводить музыку в голосовом чате.',
        statusTitle: 'Статус группы:',
        queueLimit: 'Лимит очереди: <b>{limit}</b>',
        djMode: 'Режим DJ: <b>{djMode}</b>',
        preset: 'Пресет: <b>{preset}</b>',
        premium: 'Премиум: <b>{premium}</b>',
        quickHelp: 'Используйте кнопки ниже для быстрой помощи.',
        voiceTip: 'Совет: Запустите голосовой чат перед воспроизведением.'
      },
      setup: {
        title: 'Руководство по настройке TgMusicBot',
        content: '1. <b>Добавьте бота в группу</b>\nСделайте бота администратором, если в группе ограничены сообщения/команды.\n\n2. <b>Добавьте ассистента</b>\nАссистент/юзербот должен быть в группе, чтобы войти в голосовой чат.\n\n3. <b>Запустите голосовой чат</b>\nЗапустите голосовой или видеочат в группе.\n\n4. <b>Включите песню</b>\nИспользуйте <code>/play название песни</code>.'
      },
      features: {
        title: 'Функции музыки',
        content: '• Воспроизведение аудио и видео\n• YouTube / Spotify / Apple Music / SoundCloud\n• Управление очередью\n• Личные плейлисты\n• Премиум аудио пресеты\n• Режим DJ для групп'
      },
      playlist: {
        title: 'Личные плейлисты',
        content: 'Используйте:\n<code>/cplist название</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Увеличенные лимиты очереди\n• /qmove для перемещения элементов\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo для проверки статуса'
      },
      groupPlay: {
        title: 'Играть музыку',
        content: 'Используйте:\n<code>/play название песни</code>\n\nПример:\n<code>/play faded alan walker</code>\n\nСовет:\nЗапустите голосовой чат перед началом воспроизведения.'
      },
      groupVideo: {
        title: 'Играть видео',
        content: 'Используйте:\n<code>/vplay название видео</code>\n\nПример:\n<code>/vplay faded alan walker official video</code>\n\nСовет:\nЗапустите голосовой/видеочат перед воспроизведением.'
      },
      groupQueue: {
        title: 'Очередь',
        content: 'Используйте:\n<code>/queue</code>\n\nЭта команда показывает список песен в очереди группы.'
      },
      groupSkip: {
        title: 'Пропустить',
        content: 'Используйте:\n<code>/skip</code>\n\nПропускает текущую песню.\nЕсли режим DJ активен, управлять могут только админы/авторизованные/премиум пользователи.'
      },
      groupDjMode: {
        title: 'Режим DJ',
        content: 'Используйте:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nПри активации управление (skip, stop, seek, volume, shuffle, qmove) доступно только админам/авторизованным/премиум пользователям.'
      },
      settings: {
        title: 'Настройки',
        content: 'Используйте <code>/settings</code> для открытия меню настроек бота.'
      },
      closed: 'Закрыто.',
      back: 'Назад',
      close: 'Закрыть'
    }
  },
  ja: {
    buttons: {
      support: 'サポート',
      channel: 'チャンネル',
      source: 'ソースコード',
      addToGroup: 'グループに追加',
      user: 'ユーザー',
      admin: '管理者',
      playlist: 'プレイリスト',
      owner: '所有者',
      developer: '開発者',
      back: '戻る',
      pause: '⏸ 一時停止',
      resume: '▶️ 再開',
      skip: '⏭ スキップ',
      stop: '⏹ 停止',
      mute: '🔇 ミュート',
      unmute: '🔊 ミュート解除',
      addToPlaylist: '➕ プレイリスト',
      close: '閉じる',
      language: '🌐 言語',
      help: 'ヘルプ',
      settings: '設定',
      chooseLanguage: '言語を選択',
      setupGuide: 'セットアップガイド',
      musicFeatures: '音楽機能',
      myPlaylists: 'マイプレイリスト',
      premium: 'Premium',
      playMusic: '音楽を再生',
      playVideo: '動画を再生',
      queue: 'キュー',
      groupSettings: 'グループ設定',
      djMode: 'DJモード'
    },
    language: { choose: '言語を選択してください。設定は再度変更するまで保存されます。', saved: '言語を保存しました: {language}', invalid: '対応していない言語です。', current: '現在の言語: {language}' },
    start: {
      text: "👋 こんにちは、{name}さん！\n私は <b>{botName}</b> です！\n\n🎧 多くの素晴らしい機能を持った、音楽プレイヤーボットです。\n\nℹ️ 詳細についてはヘルプボタンをクリックしてください。",
      private: {
        title: 'TgMusicBot へようこそ',
        greeting: 'こんにちは、<b>{name}</b>さん！',
        description: 'Telegramグループの音声チャットで音楽や動画を再生できます。',
        stepsTitle: '開始手順:',
        stepAddBot: 'ボットをグループに追加する',
        stepAddAssistant: 'アシスタント/ユーザーボットをグループに追加する',
        stepStartVoice: '音声チャットを開始する',
        stepPlay: '<code>/play 曲名</code> と入力する',
        featuresTitle: '主な機能:',
        featurePlayback: 'オーディオ＆ビデオ再生',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: '個人プレイリスト',
        featureQueue: 'キューコントロール',
        featurePremiumPreset: 'プレミアムオーディオプリセット',
        featureDjMode: 'グループ用DJモード',
        chooseMenu: '以下のメニューを選択してください:'
      },
      group: {
        title: 'TgMusicBot はこのグループで有効です！',
        description: '音声チャットでの再生準備が完了しました。',
        statusTitle: 'グループステータス:',
        queueLimit: 'キュー制限: <b>{limit}</b>',
        djMode: 'DJモード: <b>{djMode}</b>',
        preset: 'プリセット: <b>{preset}</b>',
        premium: 'プレミアム: <b>{premium}</b>',
        quickHelp: 'クイックヘルプには以下のボタンを使用してください。',
        voiceTip: 'ヒント: 再生する前に音声チャットを開始してください。'
      },
      setup: {
        title: 'TgMusicBot セットアップガイド',
        content: '1. <b>ボットをグループに追加する</b>\nグループがメッセージやコマンドを制限している場合は、ボットを管理者に昇格させてください。\n\n2. <b>アシスタントを追加する</b>\n音声チャットに参加するにはアシスタント/ユーザーボットがグループにいる必要があります。\n\n3. <b>音声チャットを開始する</b>\nグループで音声チャット/ビデオチャットを開始します。\n\n4. <b>曲を再生する</b>\n<code>/play 曲名</code> を使用します。'
      },
      features: {
        title: '音楽機能',
        content: '• オーディオ＆ビデオ再生\n• YouTube / Spotify / Apple Music / SoundCloud\n• キューコントロール\n• 個人プレイリスト\n• プレミアムオーディオプリセット\n• グループ用DJモード'
      },
      playlist: {
        title: '個人プレイリスト',
        content: '使い方:\n<code>/cplist プレイリスト名</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• キュー上限の拡張\n• キュー項目を移動する /qmove\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo でステータスを確認'
      },
      groupPlay: {
        title: '音楽を再生',
        content: '使い方:\n<code>/play 曲名</code>\n\n例:\n<code>/play faded alan walker</code>\n\nヒント:\n再生する前に音声チャットを開始してください。'
      },
      groupVideo: {
        title: '動画を再生',
        content: '使い方:\n<code>/vplay 動画名</code>\n\n例:\n<code>/vplay faded alan walker official video</code>\n\nヒント:\n再生する前に音声/ビデオチャットを開始してください。'
      },
      groupQueue: {
        title: 'キュー',
        content: '使い方:\n<code>/queue</code>\n\nグループキューに現在ある曲の一覧を表示します。'
      },
      groupSkip: {
        title: 'スキップ',
        content: '使い方:\n<code>/skip</code>\n\n現在再生中の曲をスキップします。\nDJモードが有効な場合、管理者/認証ユーザー/プレミアムユーザーのみこの操作を行えます。'
      },
      groupDjMode: {
        title: 'DJモード',
        content: '使い方:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\n有効な場合、スキップ、停止、シーク、音量、シャッフル、qmoveなどの操作は、管理者/認証ユーザー/プレミアムユーザーのみに制限されます。'
      },
      settings: {
        title: '設定',
        content: '<code>/settings</code> コマンドを使用して、ボットの設定メニューを開きます。'
      },
      closed: '閉じました。',
      back: '戻る',
      close: '閉じる'
    }
  },
  hi: {
    buttons: {
      support: 'सहायता',
      channel: 'चैनल',
      source: 'सोर्स कोड',
      addToGroup: 'ग्रुप में जोड़ें',
      user: 'यूज़र',
      admin: 'एडमिन',
      playlist: 'प्लेलिस्ट',
      owner: 'मालिक',
      developer: 'डेवलपर',
      back: 'वापस',
      pause: '⏸ रोकें',
      resume: '▶️ फिर शुरू',
      skip: '⏭ छोड़ें',
      stop: '⏹ बंद',
      mute: '🔇 म्यूट',
      unmute: '🔊 अनम्यूट',
      addToPlaylist: '➕ प्लेलिस्ट',
      close: 'बंद करें',
      language: '🌐 भाषा',
      help: 'मदद',
      settings: 'सेटिंग्स',
      chooseLanguage: 'भाषा चुनें',
      setupGuide: 'सेटअप गाइड',
      musicFeatures: 'संगीत विशेषताएं',
      myPlaylists: 'मेरी प्लेलिस्ट',
      premium: 'Premium',
      playMusic: 'संगीत चलाएं',
      playVideo: '영상 चलाएं',
      queue: 'क्यू',
      groupSettings: 'ग्रुप सेटिंग्स',
      djMode: 'DJ मोड'
    },
    language: { choose: 'कृपया अपनी भाषा चुनें। यह सेटिंग तब तक सेव रहेगी जब तक आप इसे फिर से नहीं बदलते।', saved: 'भाषा सेव हुई: {language}', invalid: 'यह भाषा समर्थित नहीं है।', current: 'वर्तमान भाषा: {language}' },
    start: {
      text: "👋 नमस्ते {name},\nमैं <b>{botName}</b> हूँ!\n\n🎧 बेहतरीन और उपयोगी सुविधाओं वाला एक संगीत प्लेयर बॉट।\n\nℹ️ अधिक जानकारी के लिए मदद बटन पर क्लिक करें।",
      private: {
        title: 'TgMusicBot में आपका स्वागत है',
        greeting: 'नमस्ते, <b>{name}</b>!',
        description: 'मैं टेलीग्राम ग्रुप वॉइस चैट में संगीत और वीडियो चलाने में मदद कर सकता हूँ।',
        stepsTitle: 'शुरू कैसे करें:',
        stepAddBot: 'बॉट को अपने ग्रुप में जोड़ें',
        stepAddAssistant: 'सहायक/यूज़रबॉट को ग्रुप में जोड़ें',
        stepStartVoice: 'वॉइस चैट शुरू करें',
        stepPlay: '<code>/play गाने का नाम</code> टाइप करें',
        featuresTitle: 'मुख्य विशेषताएं:',
        featurePlayback: 'ऑडियो और वीडियो प्लेबैक',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'व्यक्तिगत प्लेलिस्ट',
        featureQueue: 'क्यू नियंत्रण',
        featurePremiumPreset: 'प्रीमियम ऑडियो प्रीसेट',
        featureDjMode: 'ग्रुप्स के लिए DJ मोड',
        chooseMenu: 'नीचे दिए गए मेनू में से चुनें:'
      },
      group: {
        title: 'TgMusicBot इस ग्रुप में सक्रिय है!',
        description: 'वॉइस चैट में संगीत चलाने के लिए तैयार।',
        statusTitle: 'ग्रुप की स्थिति:',
        queueLimit: 'क्यू सीमा: <b>{limit}</b>',
        djMode: 'DJ मोड: <b>{djMode}</b>',
        preset: 'प्रीसेट: <b>{preset}</b>',
        premium: 'प्रीमियम: <b>{premium}</b>',
        quickHelp: 'त्वरित मदद के लिए नीचे दिए गए बटनों का उपयोग करें।',
        voiceTip: 'सलाह: संगीत चलाने से पहले वॉइस चैट शुरू करें।'
      },
      setup: {
        title: 'TgMusicBot सेटअप गाइड',
        content: '1. <b>बॉट को अपने ग्रुप में जोड़ें</b>\nयदि ग्रुप संदेशों/कमांडों को प्रतिबंधित करता है तो बॉट को एडमिन बनाएं।\n\n2. <b>सहायक जोड़ें</b>\nवॉइस चैट में शामिल होने के लिए सहायक/यूज़रबॉट ग्रुप में होना चाहिए।\n\n3. <b>वॉइस चैट शुरू करें</b>\nग्रुप में वॉइस चैट/वीडियो चैट शुरू करें।\n\n4. <b>गाना चलाएं</b>\n<code>/play गाने का शीर्षक</code> उपयोग करें।'
      },
      features: {
        title: 'संगीत विशेषताएं',
        content: '• ऑडियो और वीडियो प्लेबैक\n• YouTube / Spotify / Apple Music / SoundCloud\n• क्यू नियंत्रण\n• व्यक्तिगत प्लेलिस्ट\n• प्रीमियम ऑडियो प्रीसेट\n• ग्रुप्स के लिए DJ मोड'
      },
      playlist: {
        title: 'व्यक्तिगत प्लेलिस्ट',
        content: 'उपयोग करें:\n<code>/cplist नाम</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• बड़ी क्यू सीमाएं\n• क्यू आइटम ले जाने के लिए /qmove\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• स्थिति की जांच के लिए /premiuminfo'
      },
      groupPlay: {
        title: 'संगीत चलाएं',
        content: 'उपयोग करें:\n<code>/play गाने का शीर्षक</code>\n\nउदाहरण:\n<code>/play faded alan walker</code>\n\nसलाह:\nसंगीत चलाने से पहले वॉइस चैट शुरू करें।'
      },
      groupVideo: {
        title: 'वीडियो चलाएं',
        content: 'उपयोग करें:\n<code>/vplay वीडियो का शीर्षक</code>\n\nउदाहरण:\n<code>/vplay faded alan walker official video</code>\n\nसलाह:\nवीडियो चलाने से पहले वॉइस चैट/वीडियो चैट शुरू करें।'
      },
      groupQueue: {
        title: 'क्यू',
        content: 'उपयोग करें:\n<code>/queue</code>\n\nयह कमांड वर्तमान में ग्रुप क्यू में मौजूद गानों की सूची प्रदर्शित करता है।'
      },
      groupSkip: {
        title: 'छोड़ें (Skip)',
        content: 'उपयोग करें:\n<code>/skip</code>\n\nयह कमांड वर्तमान में चल रहे गाने को छोड़ देता है।\nयदि DJ मोड सक्रिय है, तो केवल एडमिन/सत्यापित/प्रीमियम यूज़र ही इसका उपयोग कर सकते हैं।'
      },
      groupDjMode: {
        title: 'DJ मोड',
        content: 'उपयोग करें:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nसक्रिय होने पर, स्किप, स्टॉप, सीक, वॉल्यूम, शफ़ल और qmove जैसे नियंत्रण केवल एडमिन/सत्यापित/प्रीमियम यूज़र द्वारा ही उपयोग किए जा सकते हैं।'
      },
      settings: {
        title: 'सेटिंग्स',
        content: 'बॉट सेटिंग्स मेनू खोलने के लिए <code>/settings</code> कमांड का उपयोग करें।'
      },
      closed: 'बंद।',
      back: 'वापस',
      close: 'बंद करें'
    }
  },
  it: {
    buttons: {
      support: 'Supporto',
      channel: 'Canale',
      source: 'Codice sorgente',
      addToGroup: 'Aggiungimi al gruppo',
      user: 'Utente',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Proprietario',
      developer: 'Sviluppatore',
      back: 'Indietro',
      pause: '⏸ Pausa',
      resume: '▶️ Riprendi',
      skip: '⏭ Salta',
      stop: '⏹ Stop',
      mute: '🔇 Muta',
      unmute: '🔊 Riattiva',
      addToPlaylist: '➕ Playlist',
      close: 'Chiudi',
      language: '🌐 Lingua',
      help: 'Aiuto',
      settings: 'Impostazioni',
      chooseLanguage: 'Scegli lingua',
      setupGuide: 'Guida configurazione',
      musicFeatures: 'Funzioni musicali',
      myPlaylists: 'Mie playlist',
      premium: 'Premium',
      playMusic: 'Riproduci musica',
      playVideo: 'Riproduci video',
      queue: 'Coda',
      groupSettings: 'Impostazioni gruppo',
      djMode: 'Modalità DJ'
    },
    language: { choose: 'Scegli la tua lingua. La scelta resterà salvata finché non la cambierai di nuovo.', saved: 'Lingua salvata: {language}', invalid: 'Lingua non supportata.', current: 'Lingua attuale: {language}' },
    start: {
      text: "👋 Ehi {name},\nQuesto è <b>{botName}</b>!\n\n🎧 Un bot per la riproduzione musicale con alcune fantastiche funzioni.\n\nℹ️ Clicca sul pulsante aiuto per maggiori informazioni.",
      private: {
        title: 'Benvenuto in TgMusicBot',
        greeting: 'Ciao, <b>{name}</b>!',
        description: 'Posso aiutarti a riprodurre musica e video nelle chat vocali dei gruppi Telegram.',
        stepsTitle: 'Come iniziare:',
        stepAddBot: 'Aggiungi il bot al tuo gruppo',
        stepAddAssistant: "Aggiungi l'assistente/userbot al gruppo",
        stepStartVoice: 'Avvia la chat vocale',
        stepPlay: 'Scrivi <code>/play nome della canzone</code>',
        featuresTitle: 'Funzionalità principali:',
        featurePlayback: 'Riproduzione audio e video',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Playlist personali',
        featureQueue: 'Controllo della coda',
        featurePremiumPreset: 'Preset audio premium',
        featureDjMode: 'Modalità DJ per gruppi',
        chooseMenu: 'Scegli un menu qui sotto:'
      },
      group: {
        title: 'TgMusicBot è attivo in questo gruppo!',
        description: 'Pronto a riprodurre musica in chat vocale.',
        statusTitle: 'Stato del gruppo:',
        queueLimit: 'Limite coda: <b>{limit}</b>',
        djMode: 'Modalità DJ: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Usa i pulsanti qui sotto per un aiuto rapido.',
        voiceTip: 'Suggerimento: Avvia la chat vocale prima di riprodurre musica.'
      },
      setup: {
        title: 'Guida alla configurazione di TgMusicBot',
        content: "1. <b>Aggiungi il bot al tuo gruppo</b>\nPromuovi il bot ad amministratore se il gruppo limita messaggi/comandi.\n\n2. <b>Aggiungi l'assistente</b>\nL'assistente/userbot deve essere nel gruppo per accedere alla chat vocale.\n\n3. <b>Avvia la chat vocale</b>\nAvvia la chat vocale o video nel gruppo.\n\n4. <b>Riproduci un brano</b>\nUsa <code>/play titolo canzone</code>."
      },
      features: {
        title: 'Funzioni musicali',
        content: '• Riproduzione audio e video\n• YouTube / Spotify / Apple Music / SoundCloud\n• Controllo della coda\n• Playlist personali\n• Preset audio premium\n• Modalità DJ per gruppi'
      },
      playlist: {
        title: 'Playlist personali',
        content: 'Uso:\n<code>/cplist nome</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Limiti di coda più alti\n• /qmove per spostare gli elementi della coda\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo per controllare lo stato'
      },
      groupPlay: {
        title: 'Riproduci musica',
        content: 'Uso:\n<code>/play titolo canzone</code>\n\nEsempio:\n<code>/play faded alan walker</code>\n\nSuggerimento:\nAvvia la chat vocale prima di riproduzione musica.'
      },
      groupVideo: {
        title: 'Riproduci video',
        content: 'Uso:\n<code>/vplay titolo video</code>\n\nEsempio:\n<code>/vplay faded alan walker official video</code>\n\nSuggerimento:\nAvvia la chat vocale/video prima di riprodurre video.'
      },
      groupQueue: {
        title: 'Coda',
        content: 'Uso:\n<code>/queue</code>\n\nQuesto comando mostra la lista dei brani attualmente in coda nel gruppo.'
      },
      groupSkip: {
        title: 'Salta',
        content: 'Uso:\n<code>/skip</code>\n\nQuesto comando salta la canzone attualmente in riproduzione.\nSe la modalità DJ è attiva, solo gli admin/utenti autorizzati/premium possono usare questo comando.'
      },
      groupDjMode: {
        title: 'Modalità DJ',
        content: 'Uso:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nQuando attiva, controlli come skip, stop, seek, volume, shuffle e qmove possono essere usati solo da admin/utenti autorizzati/premium.'
      },
      settings: {
        title: 'Impostazioni',
        content: 'Usa il comando <code>/settings</code> per aprire il menu delle impostazioni del bot.'
      },
      closed: 'Chiuso.',
      back: 'Indietro',
      close: 'Chiudi'
    }
  },
  es: {
    buttons: {
      support: 'Soporte',
      channel: 'Canal',
      source: 'Código fuente',
      addToGroup: 'Añadir al grupo',
      user: 'Usuario',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Dueño',
      developer: 'Desarrollador',
      back: 'Atrás',
      pause: '⏸ Pausa',
      resume: '▶️ Reanudar',
      skip: '⏭ Saltar',
      stop: '⏹ Detener',
      mute: '🔇 Silenciar',
      unmute: '🔊 Activar sonido',
      addToPlaylist: '➕ Playlist',
      close: 'Cerrar',
      language: '🌐 Idioma',
      help: 'Ayuda',
      settings: 'Ajustes',
      chooseLanguage: 'Elegir idioma',
      setupGuide: 'Guía de instalación',
      musicFeatures: 'Funciones de música',
      myPlaylists: 'Mis playlists',
      premium: 'Premium',
      playMusic: 'Reproducir música',
      playVideo: 'Reproducir video',
      queue: 'Cola',
      groupSettings: 'Ajustes de grupo',
      djMode: 'Modo DJ'
    },
    language: { choose: 'Elige tu idioma. Tu elección se guardará hasta que la cambies de nuevo.', saved: 'Idioma guardado: {language}', invalid: 'Idioma no compatible.', current: 'Idioma actual: {language}' },
    start: {
      text: "👋 ¡Hola {name}!\nSoy <b>{botName}</b>.\n\n🎧 Un bot de música con funciones excelentes y útiles.\n\nℹ️ Presiona el botón de ayuda para más información.",
      private: {
        title: 'Bienvenido a TgMusicBot',
        greeting: '¡Hola, <b>{name}</b>!',
        description: 'Puedo ayudarte a reproducir música y videos en los chats de voz de grupos de Telegram.',
        stepsTitle: 'Cómo empezar:',
        stepAddBot: 'Añade el bot a tu grupo',
        stepAddAssistant: 'Añade el asistente/userbot al grupo',
        stepStartVoice: 'Inicia el chat de voz',
        stepPlay: 'Escribe <code>/play nombre de la canción</code>',
        featuresTitle: 'Características principales:',
        featurePlayback: 'Reproducción de audio y video',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Playlists personales',
        featureQueue: 'Control de cola',
        featurePremiumPreset: 'Ajustes preestablecidos de audio premium',
        featureDjMode: 'Modo DJ para grupos',
        chooseMenu: 'Elige un menú de abajo:'
      },
      group: {
        title: '¡TgMusicBot está activo en este grupo!',
        description: 'Listo para reproducir música en el chat de voz.',
        statusTitle: 'Estado del grupo:',
        queueLimit: 'Límite de cola: <b>{limit}</b>',
        djMode: 'Modo DJ: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Usa los botones de abajo para ayuda rápida.',
        voiceTip: 'Consejo: Inicia el chat de voz antes de reproducir música.'
      },
      setup: {
        title: 'Guía de instalación de TgMusicBot',
        content: '1. <b>Añade el bot a tu grupo</b>\nPromueve el bot a administrador si el grupo restringe mensajes/comandos.\n\n2. <b>Añade el asistente</b>\nEl asistente/userbot debe estar en el grupo para unirse al chat de voz.\n\n3. <b>Inicia el chat de voz</b>\nInicia el chat de voz/video en el grupo.\n\n4. <b>Reproduce una canción</b>\nUsa <code>/play título canción</code>.'
      },
      features: {
        title: 'Funciones de música',
        content: '• Reproducción de audio y video\n• YouTube / Spotify / Apple Music / SoundCloud\n• Control de cola\n• Playlists personales\n• Ajustes preestablecidos de audio premium\n• Modo DJ para grupos'
      },
      playlist: {
        title: 'Playlists personales',
        content: 'Uso:\n<code>/cplist nombre</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Límites de cola más grandes\n• /qmove para mover elementos de la cola\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo para comprobar estado'
      },
      groupPlay: {
        title: 'Reproducir música',
        content: 'Uso:\n<code>/play título canción</code>\n\nEjemplo:\n<code>/play faded alan walker</code>\n\nConsejo:\nInicia el chat de voz antes de reproducir música.'
      },
      groupVideo: {
        title: 'Reproducir video',
        content: 'Uso:\n<code>/vplay título video</code>\n\nEjemplo:\n<code>/vplay faded alan walker video oficial</code>\n\nConsejo:\nInicia el chat de voz/video antes de reproducir video.'
      },
      groupQueue: {
        title: 'Cola',
        content: 'Uso:\n<code>/queue</code>\n\nEste comando muestra la lista de canciones en la cola del grupo.'
      },
      groupSkip: {
        title: 'Saltar',
        content: 'Uso:\n<code>/skip</code>\n\nEste comando salta la canción en reproducción.\nSi el Modo DJ está activo, solo administradores/usuarios autorizados/premium pueden usar este control.'
      },
      groupDjMode: {
        title: 'Modo DJ',
        content: 'Uso:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nCuando está activo, los controles como skip, stop, seek, volume, shuffle y qmove solo pueden ser usados por administradores/usuarios autorizados/premium.'
      },
      settings: {
        title: 'Ajustes',
        content: 'Usa el comando <code>/settings</code> para abrir el menú de ajustes del bot.'
      },
      closed: 'Cerrado.',
      back: 'Atrás',
      close: 'Cerrar'
    }
  },
  fr: {
    buttons: {
      support: 'Support',
      channel: 'Canal',
      source: 'Code source',
      addToGroup: 'Ajouter au groupe',
      user: 'Utilisateur',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Propriétaire',
      developer: 'Développeur',
      back: 'Retour',
      pause: '⏸ Pause',
      resume: '▶️ Reprendre',
      skip: '⏭ Passer',
      stop: '⏹ Stop',
      mute: '🔇 Muet',
      unmute: '🔊 Réactiver le son',
      addToPlaylist: '➕ Playlist',
      close: 'Fermer',
      language: '🌐 Langue',
      help: 'Aide',
      settings: 'Paramètres',
      chooseLanguage: 'Choisir la langue',
      setupGuide: "Guide d'installation",
      musicFeatures: 'Fonctions de musique',
      myPlaylists: 'Mes playlists',
      premium: 'Premium',
      playMusic: 'Lancer la musique',
      playVideo: 'Lancer la vidéo',
      queue: "File d'attente",
      groupSettings: 'Paramètres du groupe',
      djMode: 'Mode DJ'
    },
    language: { choose: 'Choisissez votre langue. Elle restera enregistrée jusqu’à ce que vous la changiez.', saved: 'Langue enregistrée : {language}', invalid: 'Langue non prise en charge.', current: 'Langue actuelle : {language}' },
    start: {
      text: "👋 Salut {name},\nIci <b>{botName}</b> !\n\n🎧 Un bot de lecture de musique avec des fonctionnalités super et utiles.\n\nℹ️ Cliquez sur le bouton d'aide pour en savoir plus.",
      private: {
        title: 'Bienvenue sur TgMusicBot',
        greeting: 'Salut, <b>{name}</b> !',
        description: 'Je peux vous aider à lire de la musique et des vidéos dans les chats vocaux de groupe Telegram.',
        stepsTitle: 'Comment commencer :',
        stepAddBot: 'Ajoutez le bot à votre groupe',
        stepAddAssistant: "Ajoutez l'assistant/userbot au groupe",
        stepStartVoice: 'Démarrez le chat vocal',
        stepPlay: 'Tapez <code>/play nom de la chanson</code>',
        featuresTitle: 'Fonctionnalités principales :',
        featurePlayback: 'Lecture audio et vidéo',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Playlists personnelles',
        featureQueue: "Contrôle de la file d'attente",
        featurePremiumPreset: 'Préréglages audio premium',
        featureDjMode: 'Mode DJ pour les groupes',
        chooseMenu: 'Choisissez un menu ci-dessous :'
      },
      group: {
        title: 'TgMusicBot est actif dans ce groupe !',
        description: 'Prêt à lire de la musique dans le chat vocal.',
        statusTitle: 'Statut du groupe :',
        queueLimit: 'Limite de file : <b>{limit}</b>',
        djMode: 'Mode DJ : <b>{djMode}</b>',
        preset: 'Preset : <b>{preset}</b>',
        premium: 'Premium : <b>{premium}</b>',
        quickHelp: 'Utilisez les boutons ci-dessous pour une aide rapide.',
        voiceTip: 'Conseil : Démarrez le chat vocal avant de lancer la musique.'
      },
      setup: {
        title: "Guide d'installation de TgMusicBot",
        content: "1. <b>Ajoutez le bot à votre groupe</b>\nPromouvez le bot comme admin si le groupe restreint les messages/commandes.\n\n2. <b>Ajoutez l'assistant</b>\nL'assistant/userbot doit être dans le groupe pour rejoindre le chat vocal.\n\n3. <b>Démarrez le chat vocal</b>\nDémarrez le chat vocal/vidéo dans le groupe.\n\n4. <b>Jouez une chanson</b>\nUtilisez <code>/play titre de la chanson</code>."
      },
      features: {
        title: 'Fonctions de musique',
        content: "• Lecture audio et vidéo\n• YouTube / Spotify / Apple Music / SoundCloud\n• Contrôle de la file d'attente\n• Playlists personnelles\n• Préréglages audio premium\n• Mode DJ pour les groupes"
      },
      playlist: {
        title: 'Playlists personnelles',
        content: 'Utilisation :\n<code>/cplist nom</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: "• Limites de file d'attente plus grandes\n• /qmove pour déplacer les éléments de la file\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo pour vérifier le statut"
      },
      groupPlay: {
        title: 'Lancer la musique',
        content: 'Utilisation :\n<code>/play titre de la chanson</code>\n\nExemple :\n<code>/play faded alan walker</code>\n\nConseil :\nDémarrez le chat vocal avant de lancer la musique.'
      },
      groupVideo: {
        title: 'Lancer la vidéo',
        content: 'Utilisation :\n<code>/vplay titre de la vidéo</code>\n\nExemple :\n<code>/vplay faded alan walker official video</code>\n\nConseil :\nDémarrez le chat vocal/vidéo avant de lancer la vidéo.'
      },
      groupQueue: {
        title: "File d'attente",
        content: "Utilisation :\n<code>/queue</code>\n\nCette commande affiche la liste des chansons actuellement dans la file d'attente du groupe."
      },
      groupSkip: {
        title: 'Passer',
        content: 'Utilisation :\n<code>/skip</code>\n\nCette commande passe la chanson en cours.\nSi le mode DJ est actif, seuls les admins/utilisateurs autorisés/premium peuvent utiliser ce contrôle.'
      },
      groupDjMode: {
        title: 'Mode DJ',
        content: "Utilisation :\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nLorsqu'il est actif, les commandes comme skip, stop, seek, volume, shuffle, et qmove sont réservées aux admins/utilisateurs autorisés/premium."
      },
      settings: {
        title: 'Paramètres',
        content: 'Utilisez la commande <code>/settings</code> pour ouvrir le menu des paramètres du bot.'
      },
      closed: 'Fermé.',
      back: 'Retour',
      close: 'Fermer'
    }
  },
  de: {
    buttons: {
      support: 'Support',
      channel: 'Kanal',
      source: 'Quellcode',
      addToGroup: 'In Gruppe hinzufügen',
      user: 'Nutzer',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Besitzer',
      developer: 'Entwickler',
      back: 'Zurück',
      pause: '⏸ Pause',
      resume: '▶️ Fortsetzen',
      skip: '⏭ Überspringen',
      stop: '⏹ Stopp',
      mute: '🔇 Stumm',
      unmute: '🔊 Ton an',
      addToPlaylist: '➕ Playlist',
      close: 'Schließen',
      language: '🌐 Sprache',
      help: 'Hilfe',
      settings: 'Einstellungen',
      chooseLanguage: 'Sprache wählen',
      setupGuide: 'Setup-Anleitung',
      musicFeatures: 'Musik-Funktionen',
      myPlaylists: 'Meine Playlists',
      premium: 'Premium',
      playMusic: 'Musik abspielen',
      playVideo: 'Video abspielen',
      queue: 'Warteschlange',
      groupSettings: 'Gruppen-Einstellungen',
      djMode: 'DJ-Modus'
    },
    language: { choose: 'Bitte wähle deine Sprache. Die Auswahl bleibt gespeichert, bis du sie wieder änderst.', saved: 'Sprache gespeichert: {language}', invalid: 'Nicht unterstützte Sprache.', current: 'Aktuelle Sprache: {language}' },
    start: {
      text: "Hallo {name},\nich bin {botName}, ein JavaScript-Telegram-Musikplayer.\n\n<b>Unterstützte Plattformen:</b> YouTube, Spotify, Apple Music, SoundCloud.\n\nNutze die Buttons unten, um Befehle zu sehen oder die Sprache zu ändern.",
      private: {
        title: 'Willkommen bei TgMusicBot',
        greeting: 'Hallo, <b>{name}</b>!',
        description: 'Ich kann helfen, Musik und Videos in Telegram-Gruppen-Sprachchats abzuspielen.',
        stepsTitle: 'Erste Schritte:',
        stepAddBot: 'Füge den Bot zu deiner Gruppe hinzu',
        stepAddAssistant: 'Füge den Assistenten/Userbot zur Gruppe hinzu',
        stepStartVoice: 'Starte den Sprachchat',
        stepPlay: 'Schreibe <code>/play Songname</code>',
        featuresTitle: 'Hauptfunktionen:',
        featurePlayback: 'Audio- & Videowiedergabe',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Persönliche Playlists',
        featureQueue: 'Steuerung der Warteschlange',
        featurePremiumPreset: 'Premium-Audio-Presets',
        featureDjMode: 'DJ-Modus für Gruppen',
        chooseMenu: 'Wähle unten ein Menü aus:'
      },
      group: {
        title: 'TgMusicBot ist in dieser Gruppe aktiv!',
        description: 'Bereit, Musik im Sprachchat abzuspielen.',
        statusTitle: 'Gruppenstatus:',
        queueLimit: 'Warteschlangenlimit: <b>{limit}</b>',
        djMode: 'DJ-Modus: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Nutze die Buttons unten für schnelle Hilfe.',
        voiceTip: 'Tipp: Starte den Sprachchat, bevor du Musik abspielst.'
      },
      setup: {
        title: 'TgMusicBot Setup-Anleitung',
        content: '1. <b>Füge den Bot zur Gruppe hinzu</b>\nBefördere den Bot zum Admin, wenn die Gruppe Nachrichten/Befehle einschränkt.\n\n2. <b>Füge den Assistenten hinzu</b>\nDer Assistent/Userbot muss in der Gruppe sein, um dem Sprachchat beizutreten.\n\n3. <b>Starte den Sprachchat</b>\nStarte den Sprach-/Videochat in der Gruppe.\n\n4. <b>Spiele einen Song ab</b>\nNutze <code>/play Songtitel</code>.'
      },
      features: {
        title: 'Musik-Funktionen',
        content: '• Audio- & Videowiedergabe\n• YouTube / Spotify / Apple Music / SoundCloud\n• Steuerung der Warteschlange\n• Persönliche Playlists\n• Premium-Audio-Presets\n• DJ-Modus für Gruppen'
      },
      playlist: {
        title: 'Persönliche Playlists',
        content: 'Nutzung:\n<code>/cplist Name</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Größere Warteschlangenlimits\n• /qmove, um Warteschlangenelemente zu verschieben\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo zur Überprüfung des Status'
      },
      groupPlay: {
        title: 'Musik abspielen',
        content: 'Nutzung:\n<code>/play Songtitel</code>\n\nBeispiel:\n<code>/play faded alan walker</code>\n\nTipp:\nStarte den Sprachchat vor dem Abspielen von Musik.'
      },
      groupVideo: {
        title: 'Video abspielen',
        content: 'Nutzung:\n<code>/vplay Videotitel</code>\n\nBeispiel:\n<code>/vplay faded alan walker official video</code>\n\nTipp:\nStarte den Sprach-/Videochat vor dem Abspielen von Videos.'
      },
      groupQueue: {
        title: 'Warteschlange',
        content: 'Nutzung:\n<code>/queue</code>\n\nDieser Befehl zeigt die aktuelle Warteschlange der Gruppe an.'
      },
      groupSkip: {
        title: 'Überspringen',
        content: 'Nutzung:\n<code>/skip</code>\n\nÜberspringt den aktuellen Song.\nWenn der DJ-Modus aktiv ist, können nur Admins/autorisierte/Premium-Nutzer diesen Befehl nutzen.'
      },
      groupDjMode: {
        title: 'DJ-Modus',
        content: 'Nutzung:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nWenn aktiv, können Steuerungen wie skip, stop, seek, volume, shuffle und qmove nur von Admins/autorisierten/Premium-Nutzern verwendet werden.'
      },
      settings: {
        title: 'Einstellungen',
        content: 'Nutze den Befehl <code>/settings</code>, um das Einstellungsmenü zu öffnen.'
      },
      closed: 'Geschlossen.',
      back: 'Zurück',
      close: 'Schließen'
    }
  },
  pt: {
    buttons: {
      support: 'Suporte',
      channel: 'Canal',
      source: 'Código fonte',
      addToGroup: 'Adicionar ao grupo',
      user: 'Usuário',
      admin: 'Admin',
      playlist: 'Playlist',
      owner: 'Dono',
      developer: 'Desenvolvedor',
      back: 'Voltar',
      pause: '⏸ Pausar',
      resume: '▶️ Retomar',
      skip: '⏭ Pular',
      stop: '⏹ Parar',
      mute: '🔇 Silenciar',
      unmute: '🔊 Ativar som',
      addToPlaylist: '➕ Playlist',
      close: 'Fechar',
      language: '🌐 Idioma',
      help: 'Ajuda',
      settings: 'Configurações',
      chooseLanguage: 'Escolher idioma',
      setupGuide: 'Guia de instalação',
      musicFeatures: 'Recursos de música',
      myPlaylists: 'Minhas playlists',
      premium: 'Premium',
      playMusic: 'Tocar música',
      playVideo: 'Tocar vídeo',
      queue: 'Fila',
      groupSettings: 'Configurações do grupo',
      djMode: 'Modo DJ'
    },
    language: { choose: 'Escolha seu idioma. A escolha ficará salva até você alterá-la novamente.', saved: 'Idioma salvo: {language}', invalid: 'Idioma não suportado.', current: 'Idioma atual: {language}' },
    start: {
      text: "👋 Olá {name},\nEu sou o <b>{botName}</b>!\n\n🎧 Um bot player de música com ótimos recursos e utilidades.\n\nℹ️ Clique no botão de ajuda para mais informações.",
      private: {
        title: 'Bem-vindo ao TgMusicBot',
        greeting: 'Olá, <b>{name}</b>!',
        description: 'Posso ajudar a reproduzir músicas e vídeos nos chats de voz de grupos do Telegram.',
        stepsTitle: 'Como começar:',
        stepAddBot: 'Adicione o bot ao seu grupo',
        stepAddAssistant: 'Adicione o assistente/userbot ao grupo',
        stepStartVoice: 'Inicie o chat de voz',
        stepPlay: 'Digite <code>/play nome da música</code>',
        featuresTitle: 'Principais recursos:',
        featurePlayback: 'Reprodução de áudio e vídeo',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Playlists pessoais',
        featureQueue: 'Controle de fila',
        featurePremiumPreset: 'Predefinições de áudio premium',
        featureDjMode: 'Modo DJ para grupos',
        chooseMenu: 'Escolha um menu abaixo:'
      },
      group: {
        title: 'TgMusicBot está ativo neste grupo!',
        description: 'Pronto para tocar música no chat de voz.',
        statusTitle: 'Status do grupo:',
        queueLimit: 'Limite da fila: <b>{limit}</b>',
        djMode: 'Modo DJ: <b>{djMode}</b>',
        preset: 'Preset: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Use os botões abaixo para ajuda rápida.',
        voiceTip: 'Dica: Inicie o chat de voz antes de tocar música.'
      },
      setup: {
        title: 'Guia de instalação do TgMusicBot',
        content: '1. <b>Adicione o bot ao seu grupo</b>\nPromova o bot a admin se o grupo restringir mensagens/comandos.\n\n2. <b>Adicione o assistente</b>\nO assistente/userbot deve estar no grupo para entrar no chat de voz.\n\n3. <b>Inicie o chat de voz</b>\nInicie o chat de voz/vídeo no grupo.\n\n4. <b>Toque uma música</b>\nUse <code>/play título da música</code>.'
      },
      features: {
        title: 'Recursos de música',
        content: '• Reprodução de áudio e video\n• YouTube / Spotify / Apple Music / SoundCloud\n• Controle de fila\n• Playlists pessoais\n• Predefinições de áudio premium\n• Modo DJ para grupos'
      },
      playlist: {
        title: 'Playlists pessoais',
        content: 'Uso:\n<code>/cplist nome</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Limites de fila maiores\n• /qmove para mover itens da fila\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo para verificar o status'
      },
      groupPlay: {
        title: 'Tocar música',
        content: 'Uso:\n<code>/play título da música</code>\n\nExemplo:\n<code>/play faded alan walker</code>\n\nDica:\nInicie o chat de voz antes de tocar música.'
      },
      groupVideo: {
        title: 'Tocar vídeo',
        content: 'Uso:\n<code>/vplay título do vídeo</code>\n\nExemplo:\n<code>/vplay faded alan walker vídeo oficial</code>\n\nDica:\nInicie o chat de voz/vídeo antes de tocar vídeo.'
      },
      groupQueue: {
        title: 'Fila',
        content: 'Uso:\n<code>/queue</code>\n\nEste comando exibe a lista de músicas na fila do grupo.'
      },
      groupSkip: {
        title: 'Pular',
        content: 'Uso:\n<code>/skip</code>\n\nEste comando pula a música atual.\nSe o Modo DJ estiver ativo, apenas admins/usuários autorizados/premium podem usar.'
      },
      groupDjMode: {
        title: 'Modo DJ',
        content: 'Uso:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nQuando ativo, controles como skip, stop, seek, volume, shuffle e qmove só podem ser usados por admins/usuários autorizados/premium.'
      },
      settings: {
        title: 'Configurações',
        content: 'Use o comando <code>/settings</code> para abrir o menu de configurações do bot.'
      },
      closed: 'Fechado.',
      back: 'Voltar',
      close: 'Fechar'
    }
  },
  ar: {
    buttons: {
      support: 'الدعم',
      channel: 'القناة',
      source: 'المصدر',
      addToGroup: 'إضافة للمجموعة',
      user: 'مستخدم',
      admin: 'مشرف',
      playlist: 'قائمة التشغيل',
      owner: 'المالك',
      developer: 'المطور',
      back: 'رجوع',
      pause: '⏸ مؤقت',
      resume: '▶️ استئناف',
      skip: '⏭ تخطي',
      stop: '⏹ إيقاف',
      mute: '🔇 كتم',
      unmute: '🔊 إلغاء الكتم',
      addToPlaylist: '➕ قائمة',
      close: 'إغلاق',
      language: '🌐 اللغة',
      help: 'مساعدة',
      settings: 'إعدادات',
      chooseLanguage: 'اختر اللغة',
      setupGuide: 'دليل الإعداد',
      musicFeatures: 'ميزات الموسيقى',
      myPlaylists: 'قوائمي',
      premium: 'Premium',
      playMusic: 'تشغيل الموسيقى',
      playVideo: 'تشغيل الفيديو',
      queue: 'الانتظار',
      groupSettings: 'إعدادات المجموعة',
      djMode: 'وضع الـ DJ'
    },
    language: { choose: 'اختر لغتك. سيتم حفظ اختيارك حتى تغيّره مرة أخرى.', saved: 'تم حفظ اللغة: {language}', invalid: 'اللغة غير مدعومة.', current: 'اللغة الحالية: {language}' },
    start: {
      text: "👋 مرحبًا {name}،\nأنا <b>{botName}</b>!\n\n🎧 بوت لتشغيل الموسيقى مع ميزات رائعة ومفيدة للغاية.\n\nℹ️ اضغط على زر المساعدة لمزيد من المعلومات.",
      private: {
        title: 'مرحبًا بك في TgMusicBot',
        greeting: 'مرحبًا، <b>{name}</b>!',
        description: 'يمكنني المساعدة in تشغيل الموسيقى ومقاطع الفيديو في دردشات Telegram الجماعية الصوتية.',
        stepsTitle: 'كيف تبدأ:',
        stepAddBot: 'أضف البوت إلى مجموعتك',
        stepAddAssistant: 'أضف المساعد/حساب المساعد إلى المجموعة',
        stepStartVoice: 'ابدأ المحادثة الصوتية',
        stepPlay: 'اكتب <code>/play اسم الأغنية</code>',
        featuresTitle: 'الميزات الرئيسية:',
        featurePlayback: 'تشغيل الصوت والفيديو',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'قوائم التشغيل الشخصية',
        featureQueue: 'التحكم في قائمة الانتظار',
        featurePremiumPreset: 'تأثيرات صوتية مميزة (Premium)',
        featureDjMode: 'وضع DJ للمجموعات',
        chooseMenu: 'اختر قائمة من الأسفل:'
      },
      group: {
        title: 'TgMusicBot نشط في هذه المجموعة!',
        description: 'جاهز لتشغيل الموسيقى في المحادثة الصوتية.',
        statusTitle: 'حالة المجموعة:',
        queueLimit: 'حد قائمة الانتظار: <b>{limit}</b>',
        djMode: 'وضع DJ: <b>{djMode}</b>',
        preset: 'التأثير: <b>{preset}</b>',
        premium: 'بريميوم: <b>{premium}</b>',
        quickHelp: 'استخدم الأزرار أدناه للحصول على مساعدة سريعة.',
        voiceTip: 'نصيحة: ابدأ المحادثة الصوتية قبل تشغيل الموسيقى.'
      },
      setup: {
        title: 'دليل إعداد TgMusicBot',
        content: '1. <b>أضف البوت إلى مجموعتك</b>\nقم بترقية البوت إلى مشرف إذا كانت المجموعة تقيد الرسائل/الأوامر.\n\n2. <b>أضف المساعد</b>\nيجب أن يكون المساعد/حساب المساعد في المجموعة للانضمام إلى المحادثة الصوتية.\n\n3. <b>ابدأ المحادثة الصوتية</b>\nابدأ محادثة صوتية/فيديو في المجموعة.\n\n4. <b>قم بتشغيل أغنية</b>\nاستخدم <code>/play اسم الأغنية</code>.'
      },
      features: {
        title: 'ميزات الموسيقى',
        content: '• تشغيل الصوت والفيديو\n• YouTube / Spotify / Apple Music / SoundCloud\n• التحكم في قائمة الانتظار\n• قوائم تشغيل شخصية\n• تأثيرات صوتية مميزة\n• وضع DJ للمجموعات'
      },
      playlist: {
        title: 'قوائم التشغيل الشخصية',
        content: 'الاستخدام:\n<code>/cplist الاسم</code>\n<code>/addtoplaylist المعرف/الرابط</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist المعرف</code>'
      },
      premium: {
        title: 'Premium',
        content: '• حدود أكبر لقائمة الانتظار\n• /qmove لنقل عناصر الانتظار\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• /premiuminfo للتحقق من الحالة'
      },
      groupPlay: {
        title: 'تشغيل الموسيقى',
        content: 'الاستخدام:\n<code>/play اسم الأغنية</code>\n\nمثال:\n<code>/play faded alan walker</code>\n\nنصيحة:\nابدأ المحادثة الصوتية قبل تشغيل الموسيقى.'
      },
      groupVideo: {
        title: 'تشغيل الفيديو',
        content: 'الاستخدام:\n<code>/vplay اسم الفيديو</code>\n\nمثال:\n<code>/vplay faded alan walker official video</code>\n\nنصيحة:\nابدأ المحادثة الصوتية/الفيديو قبل تشغيل الفيديو.'
      },
      groupQueue: {
        title: 'قائمة الانتظار',
        content: 'الاستخدام:\n<code>/queue</code>\n\nيعرض هذا الأمر قائمة الأغاني الموجودة حاليًا في قائمة انتظار المجموعة.'
      },
      groupSkip: {
        title: 'تخطي',
        content: 'الاستخدام:\n<code>/skip</code>\n\nيتخطى هذا الأمر الأغنية قيد التشغيل حاليًا.\nإذا كان وضع DJ نشطًا، يمكن للمشرفين/المصرح لهم/الأعضاء المميزين فقط استخدام هذا التحكم.'
      },
      groupDjMode: {
        title: 'وضع DJ',
        content: 'الاستخدام:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nعند تفعيله، تقتصر عناصر التحكم مثل التخطي، الإيقاف، البحث، الصوت، الخلط، و qmove على المشرفين/المصرح لهم/الأعضاء المميزين فقط.'
      },
      settings: {
        title: 'الإعدادات',
        content: 'استخدم الأمر <code>/settings</code> لفتح قائمة إعدادات البوت.'
      },
      closed: 'مغلق.',
      back: 'رجوع',
      close: 'إغلاق'
    }
  },
  tr: {
    buttons: {
      support: 'Destek',
      channel: 'Kanal',
      source: 'Kaynak Kodu',
      addToGroup: 'Beni gruba ekle',
      user: 'Kullanıcı',
      admin: 'Admin',
      playlist: 'Çalma Listesi',
      owner: 'Sahip',
      developer: 'Geliştirici',
      back: 'Geri',
      pause: '⏸ Duraklat',
      resume: '▶️ Sürdür',
      skip: '⏭ Atla',
      stop: '⏹ Durdur',
      mute: '🔇 Sustur',
      unmute: '🔊 Sesi Aç',
      addToPlaylist: '➕ Çalma Listesi',
      close: 'Kapat',
      language: '🌐 Dil',
      help: 'Yardım',
      settings: 'Ayarlar',
      chooseLanguage: 'Dil seç',
      setupGuide: 'Kurulum Kılavuzu',
      musicFeatures: 'Müzik Özellikleri',
      myPlaylists: 'Çalma Listelerim',
      premium: 'Premium',
      playMusic: 'Müzik Çal',
      playVideo: 'Video Oynat',
      queue: 'Sıra',
      groupSettings: 'Grup Ayarları',
      djMode: 'DJ Modu'
    },
    language: { choose: 'Lütfen dilini seç. Bu seçim tekrar değiştirene kadar saklanır.', saved: 'Dil kaydedildi: {language}', invalid: 'Desteklenmeyen dil.', current: 'Geçerli dil: {language}' },
    start: {
      text: "Merhaba {name},\n\nBen {botName}, JavaScript Telegram müzik oynatıcısıyım.\n\n<b>Desteklenen platformlar:</b> YouTube, Spotify, Apple Music, SoundCloud.\n\nKomutları görmek veya dili değiştirmek için aşağıdaki düğmeleri kullan.",
      private: {
        title: "TgMusicBot'a Hoş Geldiniz",
        greeting: 'Merhaba, <b>{name}</b>!',
        description: 'Telegram grup sesli sohbetlerinde müzik ve video oynatmanıza yardımcı olabilirim.',
        stepsTitle: 'Nasıl başlanır:',
        stepAddBot: 'Botu grubunuza ekleyin',
        stepAddAssistant: 'Asistanı/userbotu gruba ekleyin',
        stepStartVoice: 'Sesli sohbeti başlatın',
        stepPlay: '<code>/play şarkı adı</code> yazın',
        featuresTitle: 'Ana özellikler:',
        featurePlayback: 'Ses ve video oynatma',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: 'Kişisel çalma listeleri',
        featureQueue: 'Sıra kontrolü',
        featurePremiumPreset: 'Premium ses efektleri',
        featureDjMode: 'Gruplar için DJ modu',
        chooseMenu: 'Aşağıdan bir menü seçin:'
      },
      group: {
        title: 'TgMusicBot bu grupta aktif!',
        description: 'Sesli sohbette müzik oynatmaya hazır.',
        statusTitle: 'Grup durumu:',
        queueLimit: 'Sıra sınırı: <b>{limit}</b>',
        djMode: 'DJ Modu: <b>{djMode}</b>',
        preset: 'Hazır ayar: <b>{preset}</b>',
        premium: 'Premium: <b>{premium}</b>',
        quickHelp: 'Hızlı yardım için aşağıdaki düğmeleri kullanın.',
        voiceTip: 'İpucu: Müzik çalmadan önce sesli sohbeti başlatın.'
      },
      setup: {
        title: 'TgMusicBot Kurulum Kılavuzu',
        content: '1. <b>Botu grubunuza ekleyin</b>\nGrup mesajları/komutları kısıtlıyorsa botu yönetici yapın.\n\n2. <b>Asistanı ekleyin</b>\nSesli sohbete katılmak için asistan/userbot grupta olmalıdır.\n\n3. <b>Sesli sohbeti başlatın</b>\nGrupta sesli veya görüntülü sohbet başlatın.\n\n4. <b>Şarkı çalın</b>\n<code>/play şarkı adı</code> kullanın.'
      },
      features: {
        title: 'Müzik Özellikleri',
        content: '• Ses ve video oynatma\n• YouTube / Spotify / Apple Music / SoundCloud\n• Sıra kontrolü\n• Kişisel çalma listeleri\n• Premium ses efektleri\n• Gruplar için DJ modu'
      },
      playlist: {
        title: 'Kişisel Çalma Listeleri',
        content: 'Kullanım:\n<code>/cplist isim</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• Daha büyük sıra sınırları\n• Sıra ögelerini taşımak için /qmove\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• Durumu kontrol etmek için /premiuminfo'
      },
      groupPlay: {
        title: 'Müzik Çal',
        content: 'Kullanım:\n<code>/play şarkı adı</code>\n\nÖrnek:\n<code>/play faded alan walker</code>\n\nİpucu:\nMüzik çalmadan önce sesli sohbeti başlatın.'
      },
      groupVideo: {
        title: 'Video Oynat',
        content: 'Kullanım:\n<code>/vplay video adı</code>\n\nÖrnek:\n<code>/vplay faded alan walker official video</code>\n\nİpucu:\nVideo oynatmadan önce sesli/görüntülü sohbet başlatın.'
      },
      groupQueue: {
        title: 'Sıra',
        content: 'Kullanım:\n<code>/queue</code>\n\nBu komut şu anda gruptaki şarkı sırasını gösterir.'
      },
      groupSkip: {
        title: 'Atla',
        content: 'Kullanım:\n<code>/skip</code>\n\nÇalan şarkıyı atlar.\nDJ Modu aktifse sadece admin/yetkili/premium üyeler bu komutu kullanabilir.'
      },
      groupDjMode: {
        title: 'DJ Modu',
        content: 'Kullanım:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\nAktifken skip, stop, seek, volume, shuffle ve qmove gibi kontroller sadece admin/yetkili/premium üyelerce kullanılabilir.'
      },
      settings: {
        title: 'Ayarlar',
        content: 'Bot ayarlar menüsünü açmak için <code>/settings</code> komutunu kullanın.'
      },
      closed: 'Kapatıldı.',
      back: 'Geri',
      close: 'Kapat'
    }
  },
  ko: {
    buttons: {
      support: '지원',
      channel: '채널',
      source: '소스 코드',
      addToGroup: '그룹에 추가',
      user: '사용자',
      admin: '관리자',
      playlist: '플레이리스트',
      owner: '소유자',
      developer: '개발자',
      back: '뒤로',
      pause: '⏸ 일시정지',
      resume: '▶️ 재개',
      skip: '⏭ 건너뛰기',
      stop: '⏹ 중지',
      mute: '🔇 음소거',
      unmute: '🔊 음소거 해제',
      addToPlaylist: '➕ 플레이리스트',
      close: '닫기',
      language: '🌐 언어',
      help: '도움말',
      settings: '설정',
      chooseLanguage: '언어 선택',
      setupGuide: '설치 가이드',
      musicFeatures: '음악 기능',
      myPlaylists: '내 플레이리스트',
      premium: 'Premium',
      playMusic: '음악 재생',
      playVideo: '비디오 재생',
      queue: '대기열',
      groupSettings: '그룹 설정',
      djMode: 'DJ 모드'
    },
    language: { choose: '언어를 선택하세요. 다시 변경할 때까지 저장됩니다.', saved: '언어가 저장되었습니다: {language}', invalid: '지원하지 않는 언어입니다.', current: '현재 언어: {language}' },
    start: {
      text: "👋 안녕하세요 {name}님,\n저는 <b>{botName}</b>입니다!\n\n🎧 몇 가지 훌륭하고 유용한 기능을 갖춘 음악 플레이어 봇입니다.\n\nℹ️ 자세한 내용은 도움말 버튼을 누르세요.",
      private: {
        title: 'TgMusicBot에 오신 것을 환영합니다',
        greeting: '안녕하세요, <b>{name}</b>님!',
        description: '텔레그램 그룹 음성 채팅에서 음악과 비디오를 재생할 수 있도록 도와드립니다.',
        stepsTitle: '시작하는 방법:',
        stepAddBot: '그룹에 봇 추가',
        stepAddAssistant: '그룹에 어시스턴트/유저봇 추가',
        stepStartVoice: '음성 채팅 시작',
        stepPlay: '<code>/play 노래 제목</code> 입력',
        featuresTitle: '주요 기능:',
        featurePlayback: '오디오 및 비디오 재생',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: '개인 플레이리스트',
        featureQueue: '대기열 제어',
        featurePremiumPreset: '프리미엄 오디오 프리셋',
        featureDjMode: '그룹 DJ 모드',
        chooseMenu: '아래에서 메뉴를 선택하세요:'
      },
      group: {
        title: '이 그룹에서 TgMusicBot이 활성화되었습니다!',
        description: '음성 채팅에서 음악을 재생할 준비가 되었습니다.',
        statusTitle: '그룹 상태:',
        queueLimit: '대기열 제한: <b>{limit}</b>',
        djMode: 'DJ 모드: <b>{djMode}</b>',
        preset: '프리셋: <b>{preset}</b>',
        premium: '프리미엄: <b>{premium}</b>',
        quickHelp: '빠른 도움말을 보려면 아래 버튼을 사용하세요.',
        voiceTip: '팁: 음악을 재생하기 전에 음성 채팅을 시작하세요.'
      },
      setup: {
        title: 'TgMusicBot 설치 가이드',
        content: '1. <b>그룹에 봇 추가</b>\n그룹에 메시지/명령어 제한이 있는 경우 봇을 관리자로 승격하세요.\n\n2. <b>어시스턴트 추가</b>\n음성 채팅에 참여하려면 어시스턴트/유저봇이 그룹에 있어야 합니다.\n\n3. <b>음성 채팅 시작</b>\n그룹에서 음성 채팅/영상 채팅을 시작합니다.\n\n4. <b>노래 재생</b>\n<code>/play 노래 제목</code>을 사용합니다.'
      },
      features: {
        title: '음악 기능',
        content: '• 오디오 및 비디오 재생\n• YouTube / Spotify / Apple Music / SoundCloud\n• 대기열 제어\n• 개인 플레이리스트\n• 프리미엄 오디오 프리셋\n• 그룹 DJ 모드'
      },
      playlist: {
        title: '개인 플레이리스트',
        content: '사용법:\n<code>/cplist 이름</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• 더 큰 대기열 제한\n• 대기열 항목 이동을 위한 /qmove\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• 상태 확인을 위한 /premiuminfo'
      },
      groupPlay: {
        title: '음악 재생',
        content: '사용법:\n<code>/play 노래 제목</code>\n\n예시:\n<code>/play faded alan walker</code>\n\n팁:\n음악을 재생하기 전에 음성 채팅을 시작하세요.'
      },
      groupVideo: {
        title: '비디오 재생',
        content: '사용법:\n<code>/vplay 비디오 제목</code>\n\n예시:\n<code>/vplay faded alan walker official video</code>\n\n팁:\n비디오를 재생하기 전에 음성/영상 채팅을 시작하세요.'
      },
      groupQueue: {
        title: '대기열',
        content: '사용법:\n<code>/queue</code>\n\n이 명령어는 현재 그룹 대기열에 있는 곡 목록을 보여줍니다.'
      },
      groupSkip: {
        title: '건너뛰기',
        content: '사용법:\n<code>/skip</code>\n\n현재 재생 중인 곡을 건너뜁니다.\nDJ 모드가 활성화된 경우 관리자/인증/프리미엄 사용자만 이 컨트롤을 사용할 수 있습니다.'
      },
      groupDjMode: {
        title: 'DJ 모드',
        content: '사용법:\n<code>/djmode on</code>\n<code>/djmode off</code>\n\n활성화 시 skip, stop, seek, volume, shuffle, qmove 등의 제어는 관리자/인증/프리미엄 사용자만 사용할 수 있습니다.'
      },
      settings: {
        title: '설정',
        content: '봇 설정 메뉴를 열려면 <code>/settings</code> 명령어를 사용하세요.'
      },
      closed: '닫힘.',
      back: '뒤로',
      close: '닫기'
    }
  },
  zh: {
    buttons: {
      support: '支持',
      channel: '频道',
      source: '源码',
      addToGroup: '添加到群组',
      user: '用户',
      admin: '管理员',
      playlist: '播放列表',
      owner: '所有者',
      developer: '开发者',
      back: '返回',
      pause: '⏸ 暂停',
      resume: '▶️ 继续',
      skip: '⏭ 跳过',
      stop: '⏹ 停止',
      mute: '🔇 静音',
      unmute: '🔊 取消静音',
      addToPlaylist: '➕ 播放列表',
      close: '关闭',
      language: '🌐 语言',
      help: '帮助',
      settings: '设置',
      chooseLanguage: '选择语言',
      setupGuide: '设置指南',
      musicFeatures: '音乐功能',
      myPlaylists: '我的播放列表',
      premium: 'Premium',
      playMusic: '播放音乐',
      playVideo: '播放视频',
      queue: '队列',
      groupSettings: '群组设置',
      djMode: 'DJ 模式'
    },
    language: { choose: '请选择你的语言。设置会一直保存，直到你再次更改。', saved: '语言已保存：{language}', invalid: '不支持的语言。', current: '当前语言：{language}' },
    start: {
      text: "👋 你好 {name}，\n我是 <b>{botName}</b>！\n\n🎧 一个具有超棒且实用功能的音乐播放器机器人。\n\nℹ️ 点击帮助按钮查看更多信息。",
      private: {
        title: '欢迎使用 TgMusicBot',
        greeting: '你好，<b>{name}</b>！',
        description: '我可以帮助在 Telegram 群组语音通话中播放音乐和视频。',
        stepsTitle: '如何开始：',
        stepAddBot: '将机器人添加到你的群组',
        stepAddAssistant: '将助手/副号（userbot）添加到群组',
        stepStartVoice: '开启语音通话',
        stepPlay: '输入 <code>/play 歌曲名称</code>',
        featuresTitle: '主要功能：',
        featurePlayback: '音频和视频播放',
        featurePlatforms: 'YouTube / Spotify / Apple Music / SoundCloud',
        featurePlaylist: '个人播放列表',
        featureQueue: '队列控制',
        featurePremiumPreset: '高级音频预设',
        featureDjMode: '群组 DJ 模式',
        chooseMenu: '在下方选择一个菜单：'
      },
      group: {
        title: 'TgMusicBot 已在此群组中激活！',
        description: '已准备好在语音通话中播放音乐。',
        statusTitle: '群组状态：',
        queueLimit: '队列限制：<b>{limit}</b>',
        djMode: 'DJ 模式：<b>{djMode}</b>',
        preset: '预设：<b>{preset}</b>',
        premium: '会员（Premium）：<b>{premium}</b>',
        quickHelp: '使用下方按钮获取快速帮助。',
        voiceTip: '提示：在播放音乐之前，请先开启语音通话。'
      },
      setup: {
        title: 'TgMusicBot 设置指南',
        content: '1. <b>将机器人添加到你的群组</b>\n如果群组限制了消息/命令，请将机器人设为管理员。\n\n2. <b>添加助手</b>\n助手/副号（userbot）必须在群组中才能加入语音通话。\n\n3. <b>开启语音通话</b>\n在群组中开启语音或视频通话。\n\n4. <b>播放歌曲</b>\n使用 <code>/play 歌曲标题</code>。'
      },
      features: {
        title: '音乐功能',
        content: '• 音频和视频播放\n• YouTube / Spotify / Apple Music / SoundCloud\n• 队列控制\n• 个人播放列表\n• 高级音频预设\n• 群组 DJ 模式'
      },
      playlist: {
        title: '个人播放列表',
        content: '使用方法：\n<code>/cplist 名称</code>\n<code>/addtoplaylist id/url</code>\n<code>/myplaylists</code>\n<code>/deleteplaylist id</code>'
      },
      premium: {
        title: 'Premium',
        content: '• 更大的队列限制\n• 使用 /qmove 移动队列项目\n• /setpreset normal/bass/nightcore/vaporwave\n• /djmode on/off\n• 使用 /premiuminfo 检查状态'
      },
      groupPlay: {
        title: '播放音乐',
        content: '使用方法：\n<code>/play 歌曲标题</code>\n\n示例：\n<code>/play faded alan walker</code>\n\n提示：\n在播放音乐之前开启语音通话。'
      },
      groupVideo: {
        title: '播放视频',
        content: '使用方法：\n<code>/vplay 视频标题</code>\n\n示例：\n<code>/vplay faded alan walker official video</code>\n\n提示：\n在播放视频之前开启语音/视频通话。'
      },
      groupQueue: {
        title: '队列',
        content: '使用方法：\n<code>/queue</code>\n\n此命令将显示群组队列中当前排队的歌曲列表。'
      },
      groupSkip: {
        title: '跳过',
        content: '使用方法：\n<code>/skip</code>\n\n此命令跳过当前播放的歌曲。\n如果 DJ 模式处于激活状态，则只有管理员/已授权/Premium 会员可以使用此控制。'
      },
      groupDjMode: {
        title: 'DJ 模式',
        content: '使用方法：\n<code>/djmode on</code>\n<code>/djmode off</code>\n\n激活时，跳过、停止、定位、音量、随机播放和 qmove 等控制仅限管理员/已授权/Premium 会员使用。'
      },
      settings: {
        title: '设置',
        content: '使用 <code>/settings</code> 命令打开机器人设置菜单。'
      },
      closed: '已关闭。',
      back: '返回',
      close: '关闭'
    }
  }
};

function mergeDeep(base, override = {}) {
  const output = { ...base };
  for (const [key, value] of Object.entries(override)) {
    output[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? mergeDeep(base[key] ?? {}, value)
      : value;
  }
  return output;
}

for (const [code, override] of Object.entries(aliases)) {
  translations[code] = mergeDeep(translations.en, override);
}

const phraseOverrides = {
  id: {
    help: { userTitle: 'Perintah Pengguna', adminTitle: 'Perintah Admin', devTitle: 'Perintah Developer', ownerTitle: 'Perintah Pemilik', playlistTitle: 'Perintah Playlist' },
    playback: { title: 'Judul', duration: 'Durasi', requestedBy: 'Diminta oleh', downloadFailed: 'Unduhan gagal: {error}', voiceFailed: 'Asisten gagal naik/memutar di obrolan video: {error}', voiceChatInactiveWarning: '🎙️ Obrolan suara belum aktif di grup ini.\n\nSilakan mulai <b>Voice Chat / Video Chat</b> dulu, lalu kirim <b>/play</b> lagi ya ✨', queueFull: 'Antrean penuh (maks 10 lagu). Gunakan /end untuk membersihkan.', searchingPlaylist: '🔍 Mencari playlist...', searchingDownload: '🔍 Mencari dan mengunduh...', addedPlaylistTracks: '✅ Menambahkan {count} lagu dari playlist. Panjang antrean: {length}.', invalidUrl: 'URL tidak valid atau platform tidak didukung.\n\nDidukung: YouTube, Spotify, Apple Music, SoundCloud.', fetchError: '❌ Gagal mengambil info lagu: {error}', skippedNow: 'Dilewati: {skipped}\nSekarang diputar: {next}', skippedEnded: 'Dilewati: {skipped}\nAntrean selesai.', removeUsage: 'Penggunaan: /remove [nomor antrean]', removed: 'Dihapus: {name}', invalidQueue: 'Nomor antrean tidak valid.', loopSet: 'Jumlah loop diatur ke {count}.', muted: 'Pemutaran dibisukan.', unmuted: 'Pemutaran tidak dibisukan.', speedSet: 'Kecepatan pemutaran diatur ke {speed}x.', seekUsage: 'Penggunaan: /seek <detik|mm:ss|+detik|-detik>', seekOutOfRange: 'Posisi seek di luar rentang.', seeked: 'Seek ke {position}.', volumeUsage: 'Penggunaan: /volume <0-200>', volumeSet: 'Volume diatur ke {volume}.', shuffleNotEnough: 'Butuh minimal 2 lagu berikutnya untuk diacak.', shuffleDone: 'Antrean berikutnya sudah diacak.', noActive: 'Tidak ada voice chat aktif.',
      chooseTrack: 'Pilih hasil YouTube:',
      selectionExpired: 'Pilihan YouTube ini sudah kedaluwarsa. Silakan cari lagi.',
      selectionOwnerOnly: 'Hanya user yang mencari yang bisa memilih hasil ini.',
      invalidSelection: 'Pilihan YouTube tidak valid.',
      trackSelected: 'Memilih hasil #{number}.',
      downloadingSelected: '⬇️ Mengunduh lagu yang dipilih: {title}',
      soundcloudDiscovery: 'Penelusuran SoundCloud',
      soundcloudSelectHint: 'Pilih lagu SoundCloud ini untuk diputar.',
      soundcloudOpen: 'Buka di SoundCloud',
      soundcloudNowPlaying: 'Sedang diputar dari SoundCloud' },
    misc: { pong: 'Pong! {ms} md', stats: 'Uptime: {uptime}d\nMemori: {memory} MB\nCPU: {cpu} core\nNode: {node}', privacy: '<b>Kebijakan Privasi untuk {botName}</b>\n\n1. <b>Penyimpanan Data</b>\nKami tidak menyimpan data pribadi di perangkatmu atau melacak aktivitas browsing.\n\n2. <b>Pengumpulan</b>\nKami hanya mengumpulkan ID pengguna Telegram, ID chat, pengaturan chat, data otorisasi, dan playlist yang dibutuhkan untuk layanan musik. Kami tidak menyimpan nomor telepon atau lokasi.\n\n3. <b>Penggunaan</b>\nData hanya digunakan untuk fungsi bot. Tidak ada penggunaan marketing atau komersial.\n\n4. <b>Berbagi Data</b>\nKami tidak menjual, menukar, atau membagikan data pengguna ke pihak ketiga kecuali infrastruktur Telegram yang dibutuhkan untuk operasi bot.\n\n5. <b>Keamanan</b>\nKami memakai perlindungan yang wajar, tetapi tidak ada layanan online yang 100% aman.\n\n6. <b>Cookies</b>\n{botName} tidak memakai tracking cookies. Cookies YouTube opsional dari owner bot hanya digunakan untuk ekstraksi media.\n\n7. <b>Hak Kamu</b>\nKamu dapat meminta penghapusan data atau memblokir bot untuk mencabut akses.\n\n8. <b>Pembaruan</b>\nPerubahan kebijakan akan diumumkan di bot.\n\n9. <b>Kontak</b>\nAda pertanyaan? Hubungi {support}.\n\n──────────────────\nCatatan: Kebijakan ini menjaga pengalaman yang aman dan saling menghormati dengan {botName}.', settings: 'Pengaturan\nLayanan default: {service}\nBatas durasi lagu: {limit}d\nUkuran file maksimum: {size} MB\nBahasa: {language}', logger: 'Chat logger: {logger}', ownerBroadcast: 'Hanya pemilik yang dapat broadcast.', broadcastUsage: 'Penggunaan: /broadcast [teks]', ownerShell: 'Hanya pemilik yang dapat memakai perintah shell.', shellDisabled: 'Eksekusi shell dinonaktifkan agar deployment default lebih aman.', noop: 'Perintah diterima. Alur administrasi ini tersedia sebagai titik ekstensi JavaScript.' },
    admin: { groupOnly: 'Perintah ini hanya bisa digunakan di grup.', reloadWait: 'Tunggu {time} sebelum memakai perintah ini lagi.', reloadStarted: 'Memuat ulang cache administrator...', reloadSuccess: 'Cache administrator berhasil dimuat ulang. Menyimpan {count} admin.', reloadFailed: 'Gagal memuat ulang cache administrator: {error}' },
    playlist: { createUsage: 'Penggunaan: /createplaylist [nama]', created: '✅ Playlist dibuat.\nNama: {name}\nID: <code>{id}</code>', deleteUsage: 'Penggunaan: /deleteplaylist [id playlist]', deleted: '✅ Playlist dihapus.', addUsage: 'Penggunaan: /addtoplaylist [id playlist] [lagu atau URL]', noTrack: 'Tidak ada lagu ditemukan.', added: '✅ Menambahkan {song} ke {playlist}.', removeUsage: 'Penggunaan: /removefromplaylist [id playlist] [id lagu]', removed: '✅ Lagu dihapus.', infoUsage: 'Penggunaan: /playlistinfo [id playlist]', trackCount: 'lagu' },
  },
  ru: { general: { chooseHelp: 'Выберите категорию помощи:', openingHelp: 'Открываю меню помощи...', unknownHelp: 'Неизвестная категория помощи.', useBack: 'Используйте кнопку ниже, чтобы вернуться.', user: 'Пользователь' }, help: { userTitle: 'Команды пользователя', adminTitle: 'Команды администратора', devTitle: 'Команды разработчика', ownerTitle: 'Команды владельца', playlistTitle: 'Команды плейлистов' }, playback: { nowPlaying: 'Сейчас играет', addedToQueue: 'Добавлено в очередь: {count}', title: 'Название', duration: 'Длительность', requestedBy: 'Запросил', duplicate: 'Трек уже в очереди или играет.', queueEmpty: 'Очередь пуста.', queueTitle: 'Очередь:', nothingPlaying: 'Сейчас ничего не играет.', stopped: 'Воспроизведение остановлено, очередь очищена.', paused: 'Воспроизведение на паузе.', resumed: 'Воспроизведение продолжено.', noTracks: 'Треки не найдены.', playlistNotFound: '❌ Плейлист не найден.', playlistEmpty: '❌ Плейлист пуст.' }, misc: { pinging: 'Пинг...', privacy: 'Конфиденциальность: бот хранит настройки чата, данные авторизации и плейлисты, необходимые для воспроизведения. Он не продаёт данные пользователей.', notConfigured: 'не настроено' }, playlist: { notFound: '❌ Плейлист не найден.', empty: 'Пусто', none: 'У вас пока нет плейлистов.' } },
  ja: { general: { chooseHelp: 'ヘルプカテゴリを選択してください:', openingHelp: 'ヘルプメニューを開いています...', unknownHelp: '不明なヘルプカテゴリです。', useBack: '戻るには下のボタンを使ってください。', user: 'ユーザー' }, help: { userTitle: 'ユーザーコマンド', adminTitle: '管理者コマンド', devTitle: '開発者コマンド', ownerTitle: '所有者コマンド', playlistTitle: 'プレイリストコマンド' }, playback: { nowPlaying: '再生中', addedToQueue: 'キューに追加: {count}', title: 'タイトル', duration: '長さ', requestedBy: 'リクエスト', duplicate: 'この曲は既にキュー内または再生中です。', queueEmpty: 'キューは空です。', queueTitle: 'キュー:', nothingPlaying: '何も再生されていません。', stopped: '再生を停止し、キューをクリアしました。', paused: '再生を一時停止しました。', resumed: '再生を再開しました。', noTracks: '曲が見つかりません。', playlistNotFound: '❌ プレイリストが見つかりません。', playlistEmpty: '❌ プレイリストは空です。' }, misc: { pinging: '確認中...', privacy: 'プライバシー: このボットは再生に必要なチャット設定、認証データ、プレイリストを保存します。ユーザーデータは販売しません。', notConfigured: '未設定' }, playlist: { notFound: '❌ プレイリストが見つかりません。', empty: '空', none: 'まだプレイリストがありません。' } },
  hi: { general: { chooseHelp: 'मदद की श्रेणी चुनें:', openingHelp: 'मदद मेनू खोला जा रहा है...', unknownHelp: 'अज्ञात मदद श्रेणी।', useBack: 'वापस जाने के लिए नीचे वाला बटन इस्तेमाल करें।', user: 'यूज़र' }, help: { userTitle: 'यूज़र कमांड', adminTitle: 'एडमिन कमांड', devTitle: 'डेवलपर कमांड', ownerTitle: 'Owner कमांड', playlistTitle: 'प्लेलिस्ट कमांड' }, playback: { nowPlaying: 'अभी चल रहा है', addedToQueue: 'क्यू में जोड़ा गया: {count}', title: 'शीर्षक', duration: 'अवधि', requestedBy: 'अनुरोधकर्ता', duplicate: 'यह ट्रैक पहले से क्यू में है या चल रहा है।', queueEmpty: 'क्यू खाली है।', queueTitle: 'क्यू:', nothingPlaying: 'कुछ भी नहीं चल रहा है।', stopped: 'प्लेबैक रोका गया और क्यू साफ़ हुआ।', paused: 'प्लेबैक रुका।', resumed: 'प्लेबैक फिर शुरू हुआ।', noTracks: 'कोई ट्रैक नहीं मिला।', playlistNotFound: '❌ प्लेलिस्ट नहीं मिली।', playlistEmpty: '❌ प्लेलिस्ट खाली है।' }, misc: { pinging: 'पिंग...', privacy: 'Privacy: यह bot playback के लिए जरूरी chat settings, authorization data और playlists store करता है। यह user data नहीं बेचता।', notConfigured: 'कॉन्फ़िगर नहीं' }, playlist: { notFound: '❌ प्लेलिस्ट नहीं मिली।', empty: 'खाली', none: 'आपके पास अभी playlist नहीं है।' } },
  it: { general: { chooseHelp: 'Scegli una categoria di aiuto:', openingHelp: 'Apro il menu di aiuto...', unknownHelp: 'Categoria di aiuto sconosciuta.', useBack: 'Usa il pulsante qui sotto per tornare indietro.', user: 'Utente' }, help: { userTitle: 'Comandi utente', adminTitle: 'Comandi admin', devTitle: 'Comandi sviluppatore', ownerTitle: 'Comandi proprietario', playlistTitle: 'Comandi playlist' }, playback: { nowPlaying: 'In riproduzione', addedToQueue: 'Aggiunto alla coda: {count}', title: 'Titolo', duration: 'Durata', requestedBy: 'Richiesto da', duplicate: 'Traccia già in coda o in riproduzione.', queueEmpty: 'La coda è vuota.', queueTitle: 'Coda:', nothingPlaying: 'Nulla in riproduzione.', stopped: 'Riproduzione fermata e coda svuotata.', paused: 'Riproduzione in pausa.', resumed: 'Riproduzione ripresa.', noTracks: 'Nessuna traccia trovata.', playlistNotFound: '❌ Playlist non trovata.', playlistEmpty: '❌ La playlist è vuota.' }, misc: { pinging: 'Ping...', privacy: 'Privacy: questo bot salva impostazioni chat, dati di autorizzazione e playlist necessari alla riproduzione. Non vende dati utente.', notConfigured: 'non configurato' }, playlist: { notFound: '❌ Playlist non trovata.', empty: 'Vuota', none: 'Non hai ancora playlist.' } },
  es: { general: { chooseHelp: 'Elige una categoría de ayuda:', openingHelp: 'Abriendo menú de ayuda...', unknownHelp: 'Categoría de ayuda desconocida.', useBack: 'Usa el botón de abajo para volver.', user: 'Usuario' }, help: { userTitle: 'Comandos de usuario', adminTitle: 'Comandos de admin', devTitle: 'Comandos de desarrollador', ownerTitle: 'Comandos del dueño', playlistTitle: 'Comandos de playlist' }, playback: { nowPlaying: 'Reproduciendo', addedToQueue: 'Añadido a la cola: {count}', title: 'Título', duration: 'Duración', requestedBy: 'Pedido por', duplicate: 'La pista ya está en la cola o reproduciéndose.', queueEmpty: 'La cola está vacía.', queueTitle: 'Cola:', nothingPlaying: 'No hay nada reproduciéndose.', stopped: 'Reproducción detenida y cola limpiada.', paused: 'Reproducción pausada.', resumed: 'Reproducción reanudada.', noTracks: 'No se encontraron pistas.', playlistNotFound: '❌ Playlist no encontrada.', playlistEmpty: '❌ La playlist está vacía.' }, misc: { pinging: 'Haciendo ping...', privacy: 'Privacidad: este bot guarda ajustes de chat, datos de autorización y playlists necesarios para reproducir. No vende datos de usuario.', notConfigured: 'no configurado' }, playlist: { notFound: '❌ Playlist no encontrada.', empty: 'Vacía', none: 'Aún no tienes playlists.' } },
};

for (const [code, override] of Object.entries(phraseOverrides)) {
  translations[code] = mergeDeep(translations[code], override);
}


const playbackSelectionTranslations = {
  id: { playback: { searchingDownload: '🔍 Mencari dan mengunduh...', chooseTrack: 'Pilih hasil YouTube:', downloadingSelected: '⬇️ Mengunduh lagu yang dipilih: {title}', channel: 'Channel', views: 'Dilihat', upload: 'Diunggah', url: 'URL' } },
  ru: { playback: { searchingDownload: '🔍 Поиск и загрузка...', chooseTrack: 'Выберите результат YouTube:', downloadingSelected: '⬇️ Загружается выбранный трек: {title}', channel: 'Канал', views: 'Просмотры', upload: 'Загрузка', url: 'Ссылка' } },
  ja: { playback: { searchingDownload: '🔍 検索してダウンロード中...', chooseTrack: 'YouTube の結果を選択:', downloadingSelected: '⬇️ 選択したトラックをダウンロード中: {title}', channel: 'チャンネル', views: '再生回数', upload: '公開', url: 'URL' } },
  hi: { playback: { searchingDownload: '🔍 खोज और डाउनलोड किया जा रहा है...', chooseTrack: 'YouTube परिणाम चुनें:', downloadingSelected: '⬇️ चुना गया ट्रैक डाउनलोड हो रहा है: {title}', channel: 'चैनल', views: 'व्यूज़', upload: 'अपलोड', url: 'URL' } },
  it: { playback: { searchingDownload: '🔍 Ricerca e download in corso...', chooseTrack: 'Scegli un risultato YouTube:', downloadingSelected: '⬇️ Download della traccia selezionata: {title}', channel: 'Canale', views: 'Visualizzazioni', upload: 'Caricato', url: 'URL' } },
  es: { playback: { searchingDownload: '🔍 Buscando y descargando...', chooseTrack: 'Elige un resultado de YouTube:', downloadingSelected: '⬇️ Descargando la pista seleccionada: {title}', channel: 'Canal', views: 'Vistas', upload: 'Subido', url: 'URL' } },
  fr: { playback: { searchingDownload: '🔍 Recherche et téléchargement...', chooseTrack: 'Choisissez un résultat YouTube :', downloadingSelected: '⬇️ Téléchargement du morceau sélectionné : {title}', channel: 'Chaîne', views: 'Vues', upload: 'Mise en ligne', url: 'URL' } },
  de: { playback: { searchingDownload: '🔍 Suche und Download...', chooseTrack: 'Wähle ein YouTube-Ergebnis:', downloadingSelected: '⬇️ Ausgewählter Titel wird heruntergeladen: {title}', channel: 'Kanal', views: 'Aufrufe', upload: 'Hochgeladen', url: 'URL' } },
  pt: { playback: { searchingDownload: '🔍 Pesquisando e baixando...', chooseTrack: 'Escolha um resultado do YouTube:', downloadingSelected: '⬇️ Baixando faixa selecionada: {title}', channel: 'Canal', views: 'Visualizações', upload: 'Enviado', url: 'URL' } },
  ar: { playback: { searchingDownload: '🔍 جارٍ البحث والتنزيل...', chooseTrack: 'اختر نتيجة من يوتيوب:', downloadingSelected: '⬇️ جارٍ تنزيل المقطع المحدد: {title}', channel: 'القناة', views: 'المشاهدات', upload: 'الرفع', url: 'الرابط' } },
  tr: { playback: { searchingDownload: '🔍 Aranıyor ve indiriliyor...', chooseTrack: 'Bir YouTube sonucu seç:', downloadingSelected: '⬇️ Seçilen parça indiriliyor: {title}', channel: 'Kanal', views: 'Görüntülenme', upload: 'Yükleme', url: 'URL' } },
  ko: { playback: { searchingDownload: '🔍 검색 및 다운로드 중...', chooseTrack: 'YouTube 결과를 선택하세요:', downloadingSelected: '⬇️ 선택한 트랙 다운로드 중: {title}', channel: '채널', views: '조회수', upload: '업로드', url: 'URL' } },
  zh: { playback: { searchingDownload: '🔍 正在搜索并下载...', chooseTrack: '请选择一个 YouTube 结果：', downloadingSelected: '⬇️ 正在下载已选择的曲目：{title}', channel: '频道', views: '观看次数', upload: '上传', url: '链接' } },
};

for (const [code, override] of Object.entries(playbackSelectionTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}

const featureTranslations = {
  id: {
    buttons: { resume: '▶️ Lanjutkan', mute: '🔇 Bisukan', unmute: '🔊 Bunyikan', addToPlaylist: '➕ Playlist', close: 'Tutup' },
    callbacks: { track: 'Lagu', nowPlaying: 'Sedang Diputar', paused: 'Dijeda', muted: 'Dibisukan', noActivePlayback: 'Tidak ada pemutaran aktif.', settingsIgnored: 'Callback pengaturan ditangani terpisah.', closingPanel: 'Menutup panel.', trackSkipped: 'Lagu dilewati.', playbackStopped: 'Pemutaran dihentikan.', playbackPaused: 'Pemutaran dijeda.', playbackResumed: 'Pemutaran dilanjutkan.', playbackMuted: 'Pemutaran dibisukan.', playbackUnmuted: 'Pemutaran dibunyikan.', actionFailed: 'Tidak dapat memproses aksi pemutaran.', requestedBy: 'Diminta oleh: {user}', pausedBy: 'Dijeda oleh {user}', resumedBy: 'Dilanjutkan oleh {user}', mutedBy: 'Dibisukan oleh {user}', unmutedBy: 'Dibunyikan oleh {user}', defaultPlaylistName: 'Playlist Saya (TgMusic)', addedToPlaylist: 'Lagu "{song}" ditambahkan ke playlist "{playlist}".' },
    auth: { listTitle: 'Pengguna Terotorisasi', none: 'Tidak ada pengguna terotorisasi.', groupOnly: 'Perintah ini hanya bisa digunakan di grup.', adminOnly: 'Kamu harus menjadi administrator untuk memakai perintah ini.', adminVerifyFailed: 'Tidak dapat memverifikasi status administrator.', targetRequired: 'Balas pengguna atau berikan ID pengguna numerik.', already: 'Pengguna ini sudah diotorisasi.', notAuthorized: 'Pengguna ini belum diotorisasi.', added: 'Pengguna {userId} telah diotorisasi.', removed: 'Pengguna {userId} dihapus dari daftar otorisasi.', addFailed: 'Gagal mengotorisasi pengguna.', removeFailed: 'Gagal menghapus pengguna terotorisasi.' },
    devs: { devOnly: 'Hanya developer yang dapat menggunakan perintah ini.', noActiveChats: 'Tidak ada chat aktif ditemukan.', clearAssistantsDone: 'Menghapus assistant dari {count} chat.', clearAssistantsFailed: 'Gagal membersihkan assistant: {error}', leaveAllStarted: 'Assistant sedang keluar dari semua chat...', leaveAllDone: 'Assistant keluar dari {count} chat.', leaveAllFailed: 'Gagal keluar dari semua chat: {error}', loggerMissing: 'Harap atur LOGGER_ID di .env terlebih dahulu.', loggerUsage: 'Penggunaan: /logger [enable|disable|on|off]\nStatus saat ini: {status}', loggerEnabled: 'Logger diaktifkan', loggerDisabled: 'Logger dinonaktifkan', loggerInvalid: "Argumen tidak valid. Gunakan 'enable', 'disable', 'on', atau 'off'." },
    broadcast: { usage: 'Balas pesan untuk broadcast.\n\nPenggunaan:\n/broadcast -chat : hanya grup\n/broadcast -user : hanya pengguna\n/broadcast -both : grup + pengguna (default)\n/broadcast -copy : kirim sebagai salinan\n\nContoh:\n/broadcast\n/broadcast -chat\n/broadcast -user -copy', started: 'Broadcast dimulai.', ended: 'Broadcast selesai.\nGrup: {groups}\nPengguna: {users}', stopped: 'Broadcast dihentikan.\nGrup: {groups}\nPengguna: {users}', stopRequested: 'Broadcast dihentikan.', noneInProgress: 'Tidak ada broadcast berjalan.', alreadyInProgress: 'Broadcast sedang berjalan.', noTargets: 'Tidak ada target ditemukan.', failed: 'Broadcast gagal: {error}' },
  },
  ru: {
    buttons: { resume: '▶️ Продолжить', mute: '🔇 Выкл. звук', unmute: '🔊 Вкл. звук', addToPlaylist: '➕ Плейлист', close: 'Закрыть' },
    callbacks: { track: 'Трек', nowPlaying: 'Сейчас играет', paused: 'На паузе', muted: 'Без звука', noActivePlayback: 'Активного воспроизведения нет.', settingsIgnored: 'Кнопки настроек обрабатываются отдельно.', closingPanel: 'Закрываю панель.', trackSkipped: 'Трек пропущен.', playbackStopped: 'Воспроизведение остановлено.', playbackPaused: 'Воспроизведение на паузе.', playbackResumed: 'Воспроизведение продолжено.', playbackMuted: 'Звук выключен.', playbackUnmuted: 'Звук включен.', actionFailed: 'Не удалось выполнить действие.', requestedBy: 'Запросил: {user}', pausedBy: 'Поставил на паузу: {user}', resumedBy: 'Продолжил: {user}', mutedBy: 'Выключил звук: {user}', unmutedBy: 'Включил звук: {user}', defaultPlaylistName: 'Мой плейлист (TgMusic)', addedToPlaylist: 'Трек "{song}" добавлен в плейлист "{playlist}".' },
    auth: { listTitle: 'Авторизованные пользователи', none: 'Авторизованных пользователей нет.', groupOnly: 'Эту команду можно использовать только в группах.', adminOnly: 'Для этой команды нужны права администратора.', adminVerifyFailed: 'Не удалось проверить статус администратора.', targetRequired: 'Ответьте пользователю или укажите числовой ID.', already: 'Этот пользователь уже авторизован.', notAuthorized: 'Этот пользователь не авторизован.', added: 'Пользователь {userId} авторизован.', removed: 'Пользователь {userId} удалён из списка авторизации.', addFailed: 'Не удалось авторизовать пользователя.', removeFailed: 'Не удалось удалить авторизованного пользователя.' },
    broadcast: { usage: 'Ответьте на сообщение для рассылки.\n\nИспользование:\n/broadcast -chat : только группы\n/broadcast -user : только пользователи\n/broadcast -both : группы + пользователи (по умолчанию)\n/broadcast -copy : отправить копией', started: 'Рассылка началась.', ended: 'Рассылка завершена.\nГруппы: {groups}\nПользователи: {users}', stopped: 'Рассылка остановлена.\nГруппы: {groups}\nПользователи: {users}', stopRequested: 'Рассылка остановлена.', noneInProgress: 'Активной рассылки нет.', alreadyInProgress: 'Рассылка уже выполняется.', noTargets: 'Цели не найдены.', failed: 'Ошибка рассылки: {error}' },
  },
  ja: {
    buttons: { resume: '▶️ 再開', mute: '🔇 ミュート', unmute: '🔊 ミュート解除', addToPlaylist: '➕ プレイリスト', close: '閉じる' },
    callbacks: { track: '曲', nowPlaying: '再生中', paused: '一時停止中', muted: 'ミュート中', noActivePlayback: '再生中のものはありません。', settingsIgnored: '設定コールバックは別に処理されます。', closingPanel: 'パネルを閉じます。', trackSkipped: '曲をスキップしました。', playbackStopped: '再生を停止しました。', playbackPaused: '再生を一時停止しました。', playbackResumed: '再生を再開しました。', playbackMuted: '再生をミュートしました。', playbackUnmuted: 'ミュートを解除しました。', actionFailed: '再生操作を処理できませんでした。', requestedBy: 'リクエスト: {user}', pausedBy: '{user} が一時停止しました', resumedBy: '{user} が再開しました', mutedBy: '{user} がミュートしました', unmutedBy: '{user} がミュート解除しました', defaultPlaylistName: 'マイプレイリスト (TgMusic)', addedToPlaylist: '曲「{song}」をプレイリスト「{playlist}」に追加しました。' },
    auth: { listTitle: '認証済みユーザー', none: '認証済みユーザーはいません。', groupOnly: 'このコマンドはグループでのみ使用できます。', adminOnly: 'このコマンドには管理者権限が必要です。', adminVerifyFailed: '管理者状態を確認できません。', targetRequired: 'ユーザーに返信するか数値のユーザーIDを指定してください。', already: 'このユーザーは既に認証済みです。', notAuthorized: 'このユーザーは認証されていません。', added: 'ユーザー {userId} を認証しました。', removed: 'ユーザー {userId} を認証リストから削除しました。', addFailed: 'ユーザーの認証に失敗しました。', removeFailed: '認証済みユーザーの削除に失敗しました。' },
    broadcast: { usage: '配信するメッセージに返信してください。\n\n使い方:\n/broadcast -chat : グループのみ\n/broadcast -user : ユーザーのみ\n/broadcast -both : グループ + ユーザー (既定)\n/broadcast -copy : コピーとして送信', started: '一斉配信を開始しました。', ended: '一斉配信が完了しました。\nグループ: {groups}\nユーザー: {users}', stopped: '一斉配信を停止しました。\nグループ: {groups}\nユーザー: {users}', stopRequested: '一斉配信を停止しました。', noneInProgress: '実行中の一斉配信はありません。', alreadyInProgress: '一斉配信は既に実行中です。', noTargets: '送信先が見つかりません。', failed: '一斉配信に失敗しました: {error}' },
  },
  hi: {
    buttons: { resume: '▶️ फिर शुरू', mute: '🔇 म्यूट', unmute: '🔊 अनम्यूट', addToPlaylist: '➕ प्लेलिस्ट', close: 'बंद' },
    callbacks: { track: 'ट्रैक', nowPlaying: 'अभी चल रहा है', paused: 'रुका हुआ', muted: 'म्यूट', noActivePlayback: 'कोई सक्रिय प्लेबैक नहीं है।', settingsIgnored: 'सेटिंग callback अलग से संभाले जाते हैं।', closingPanel: 'पैनल बंद हो रहा है।', trackSkipped: 'ट्रैक छोड़ दिया गया।', playbackStopped: 'प्लेबैक रोक दिया गया।', playbackPaused: 'प्लेबैक रोक दिया गया।', playbackResumed: 'प्लेबैक फिर शुरू हुआ।', playbackMuted: 'प्लेबैक म्यूट हुआ।', playbackUnmuted: 'प्लेबैक अनम्यूट हुआ।', actionFailed: 'प्लेबैक कार्रवाई प्रोसेस नहीं हो सकी।', requestedBy: 'अनुरोधकर्ता: {user}', pausedBy: '{user} ने रोका', resumedBy: '{user} ने शुरू किया', mutedBy: '{user} ने म्यूट किया', unmutedBy: '{user} ने अनम्यूट किया', defaultPlaylistName: 'मेरी प्लेलिस्ट (TgMusic)', addedToPlaylist: 'ट्रैक "{song}" प्लेलिस्ट "{playlist}" में जोड़ा गया।' },
    auth: { listTitle: 'अधिकृत उपयोगकर्ता', none: 'कोई अधिकृत उपयोगकर्ता नहीं मिला।', groupOnly: 'यह कमांड केवल ग्रुप में इस्तेमाल हो सकता है।', adminOnly: 'इस कमांड के लिए admin होना जरूरी है।', adminVerifyFailed: 'Admin स्थिति सत्यापित नहीं हो सकी।', targetRequired: 'किसी user को reply करें या numeric user ID दें।', already: 'यह user पहले से authorized है।', notAuthorized: 'यह user authorized नहीं है।', added: 'User {userId} authorized हो गया।', removed: 'User {userId} authorization list से हटाया गया।', addFailed: 'User को authorize करने में विफल।', removeFailed: 'Authorized user हटाने में विफल।' },
    broadcast: { usage: 'Broadcast के लिए किसी message पर reply करें।\n\nUsage:\n/broadcast -chat : केवल groups\n/broadcast -user : केवल users\n/broadcast -both : groups + users (default)\n/broadcast -copy : copy के रूप में भेजें', started: 'Broadcast शुरू हुआ।', ended: 'Broadcast समाप्त।\nGroups: {groups}\nUsers: {users}', stopped: 'Broadcast रोका गया।\nGroups: {groups}\nUsers: {users}', stopRequested: 'Broadcast रोका गया।', noneInProgress: 'कोई broadcast चल नहीं रहा है।', alreadyInProgress: 'Broadcast पहले से चल रहा है।', noTargets: 'कोई target नहीं मिला।', failed: 'Broadcast विफल: {error}' },
  },
  it: {
    buttons: { resume: '▶️ Riprendi', mute: '🔇 Muta', unmute: '🔊 Riattiva', addToPlaylist: '➕ Playlist', close: 'Chiudi' },
    callbacks: { track: 'Traccia', nowPlaying: 'In riproduzione', paused: 'In pausa', muted: 'Muto', noActivePlayback: 'Non c’è una riproduzione attiva.', settingsIgnored: 'I callback delle impostazioni sono gestiti separatamente.', closingPanel: 'Chiudo il pannello.', trackSkipped: 'Traccia saltata.', playbackStopped: 'Riproduzione fermata.', playbackPaused: 'Riproduzione in pausa.', playbackResumed: 'Riproduzione ripresa.', playbackMuted: 'Riproduzione mutata.', playbackUnmuted: 'Audio riattivato.', actionFailed: 'Impossibile eseguire l’azione di riproduzione.', requestedBy: 'Richiesto da: {user}', pausedBy: 'Messo in pausa da {user}', resumedBy: 'Ripreso da {user}', mutedBy: 'Mutato da {user}', unmutedBy: 'Riattivato da {user}', defaultPlaylistName: 'La mia playlist (TgMusic)', addedToPlaylist: 'Traccia "{song}" aggiunta alla playlist "{playlist}".' },
    auth: { listTitle: 'Utenti autorizzati', none: 'Nessun utente autorizzato trovato.', groupOnly: 'Questo comando può essere usato solo nei gruppi.', adminOnly: 'Devi essere amministratore per usare questo comando.', adminVerifyFailed: 'Impossibile verificare lo stato di amministratore.', targetRequired: 'Rispondi a un utente o fornisci un ID utente numerico.', already: 'Questo utente è già autorizzato.', notAuthorized: 'Questo utente non è autorizzato.', added: 'Utente {userId} autorizzato.', removed: 'Utente {userId} rimosso dalla lista autorizzati.', addFailed: 'Impossibile autorizzare l’utente.', removeFailed: 'Impossibile rimuovere l’utente autorizzato.' },
    broadcast: { usage: 'Rispondi a un messaggio da trasmettere.\n\nUso:\n/broadcast -chat : solo gruppi\n/broadcast -user : solo utenti\n/broadcast -both : gruppi + utenti (default)\n/broadcast -copy : invia come copia', started: 'Broadcast avviato.', ended: 'Broadcast terminato.\nGruppi: {groups}\nUtenti: {users}', stopped: 'Broadcast fermato.\nGruppi: {groups}\nUtenti: {users}', stopRequested: 'Broadcast fermato.', noneInProgress: 'Nessun broadcast in corso.', alreadyInProgress: 'Un broadcast è già in corso.', noTargets: 'Nessun destinatario trovato.', failed: 'Broadcast fallito: {error}' },
  },
  es: {
    buttons: { resume: '▶️ Reanudar', mute: '🔇 Silenciar', unmute: '🔊 Activar sonido', addToPlaylist: '➕ Playlist', close: 'Cerrar' },
    callbacks: { track: 'Pista', nowPlaying: 'Reproduciendo', paused: 'Pausado', muted: 'Silenciado', noActivePlayback: 'No hay reproducción activa.', settingsIgnored: 'Los callbacks de ajustes se manejan por separado.', closingPanel: 'Cerrando panel.', trackSkipped: 'Pista saltada.', playbackStopped: 'Reproducción detenida.', playbackPaused: 'Reproducción pausada.', playbackResumed: 'Reproducción reanudada.', playbackMuted: 'Reproducción silenciada.', playbackUnmuted: 'Sonido reactivado.', actionFailed: 'No se pudo procesar la acción de reproducción.', requestedBy: 'Pedido por: {user}', pausedBy: 'Pausado por {user}', resumedBy: 'Reanudado por {user}', mutedBy: 'Silenciado por {user}', unmutedBy: 'Sonido activado por {user}', defaultPlaylistName: 'Mi playlist (TgMusic)', addedToPlaylist: 'Pista "{song}" añadida a la playlist "{playlist}".' },
    auth: { listTitle: 'Usuarios autorizados', none: 'No se encontraron usuarios autorizados.', groupOnly: 'Este comando solo se puede usar en grupos.', adminOnly: 'Debes ser administrador para usar este comando.', adminVerifyFailed: 'No se pudo verificar el estado de administrador.', targetRequired: 'Responde a un usuario o proporciona un ID numérico.', already: 'Este usuario ya está autorizado.', notAuthorized: 'Este usuario no está autorizado.', added: 'Usuario {userId} autorizado.', removed: 'Usuario {userId} eliminado de la lista autorizada.', addFailed: 'No se pudo autorizar al usuario.', removeFailed: 'No se pudo eliminar al usuario autorizado.' },
    broadcast: { usage: 'Responde a un mensaje para difundirlo.\n\nUso:\n/broadcast -chat : solo grupos\n/broadcast -user : solo usuarios\n/broadcast -both : grupos + usuarios (default)\n/broadcast -copy : enviar como copia', started: 'Broadcast iniciado.', ended: 'Broadcast finalizado.\nGrupos: {groups}\nUsuarios: {users}', stopped: 'Broadcast detenido.\nGrupos: {groups}\nUsuarios: {users}', stopRequested: 'Broadcast detenido.', noneInProgress: 'No hay broadcast en curso.', alreadyInProgress: 'Ya hay un broadcast en curso.', noTargets: 'No se encontraron destinatarios.', failed: 'Broadcast fallido: {error}' },
  },
  fr: {
    buttons: { resume: '▶️ Reprendre', mute: '🔇 Muet', unmute: '🔊 Réactiver', addToPlaylist: '➕ Playlist', close: 'Fermer' },
    callbacks: { track: 'Piste', nowPlaying: 'En lecture', paused: 'En pause', muted: 'Muet', noActivePlayback: 'Aucune lecture active.', settingsIgnored: 'Les callbacks des paramètres sont gérés séparément.', closingPanel: 'Fermeture du panneau.', trackSkipped: 'Piste passée.', playbackStopped: 'Lecture arrêtée.', playbackPaused: 'Lecture mise en pause.', playbackResumed: 'Lecture reprise.', playbackMuted: 'Lecture mise en sourdine.', playbackUnmuted: 'Son réactivé.', actionFailed: 'Impossible de traiter l’action de lecture.', requestedBy: 'Demandé par : {user}', pausedBy: 'Mis en pause par {user}', resumedBy: 'Repris par {user}', mutedBy: 'Mis en sourdine par {user}', unmutedBy: 'Réactivé par {user}', defaultPlaylistName: 'Ma playlist (TgMusic)', addedToPlaylist: 'Piste "{song}" ajoutée à la playlist "{playlist}".' },
    auth: { listTitle: 'Utilisateurs autorisés', none: 'Aucun utilisateur autorisé trouvé.', groupOnly: 'Cette commande ne peut être utilisée que dans les groupes.', adminOnly: 'Vous devez être administrateur pour utiliser cette commande.', adminVerifyFailed: 'Impossible de vérifier le statut administrateur.', targetRequired: 'Répondez à un utilisateur ou fournissez un ID numérique.', already: 'Cet utilisateur est déjà autorisé.', notAuthorized: 'Cet utilisateur n’est pas autorisé.', added: 'Utilisateur {userId} autorisé.', removed: 'Utilisateur {userId} retiré de la liste autorisée.', addFailed: 'Impossible d’autoriser l’utilisateur.', removeFailed: 'Impossible de retirer l’utilisateur autorisé.' },
    broadcast: { usage: 'Répondez à un message pour le diffuser.\n\nUtilisation :\n/broadcast -chat : groupes uniquement\n/broadcast -user : utilisateurs uniquement\n/broadcast -both : groupes + utilisateurs (défaut)\n/broadcast -copy : envoyer comme copie', started: 'Diffusion commencée.', ended: 'Diffusion terminée.\nGroupes : {groups}\nUtilisateurs : {users}', stopped: 'Diffusion arrêtée.\nGroupes : {groups}\nUtilisateurs : {users}', stopRequested: 'Diffusion arrêtée.', noneInProgress: 'Aucune diffusion en cours.', alreadyInProgress: 'Une diffusion est déjà en cours.', noTargets: 'Aucune cible trouvée.', failed: 'Échec de la diffusion : {error}' },
  },
  de: {
    buttons: { resume: '▶️ Fortsetzen', mute: '🔇 Stumm', unmute: '🔊 Ton an', addToPlaylist: '➕ Playlist', close: 'Schließen' },
    callbacks: { track: 'Titel', nowPlaying: 'Läuft gerade', paused: 'Pausiert', muted: 'Stumm', noActivePlayback: 'Keine aktive Wiedergabe.', settingsIgnored: 'Einstellungs-Callbacks werden separat behandelt.', closingPanel: 'Panel wird geschlossen.', trackSkipped: 'Titel übersprungen.', playbackStopped: 'Wiedergabe gestoppt.', playbackPaused: 'Wiedergabe pausiert.', playbackResumed: 'Wiedergabe fortgesetzt.', playbackMuted: 'Wiedergabe stummgeschaltet.', playbackUnmuted: 'Ton wieder aktiviert.', actionFailed: 'Wiedergabeaktion konnte nicht verarbeitet werden.', requestedBy: 'Angefordert von: {user}', pausedBy: 'Pausiert von {user}', resumedBy: 'Fortgesetzt von {user}', mutedBy: 'Stummgeschaltet von {user}', unmutedBy: 'Ton aktiviert von {user}', defaultPlaylistName: 'Meine Playlist (TgMusic)', addedToPlaylist: 'Titel "{song}" zur Playlist "{playlist}" hinzugefügt.' },
    auth: { listTitle: 'Autorisierte Benutzer', none: 'Keine autorisierten Benutzer gefunden.', groupOnly: 'Dieser Befehl kann nur in Gruppen verwendet werden.', adminOnly: 'Du musst Administrator sein, um diesen Befehl zu verwenden.', adminVerifyFailed: 'Administratorstatus konnte nicht geprüft werden.', targetRequired: 'Antworte einem Benutzer oder gib eine numerische Benutzer-ID an.', already: 'Dieser Benutzer ist bereits autorisiert.', notAuthorized: 'Dieser Benutzer ist nicht autorisiert.', added: 'Benutzer {userId} wurde autorisiert.', removed: 'Benutzer {userId} wurde aus der Autorisierungsliste entfernt.', addFailed: 'Benutzer konnte nicht autorisiert werden.', removeFailed: 'Autorisierter Benutzer konnte nicht entfernt werden.' },
    broadcast: { usage: 'Antworte auf eine Nachricht, um sie zu senden.\n\nNutzung:\n/broadcast -chat : nur Gruppen\n/broadcast -user : nur Benutzer\n/broadcast -both : Gruppen + Benutzer (Standard)\n/broadcast -copy : als Kopie senden', started: 'Broadcast gestartet.', ended: 'Broadcast beendet.\nGruppen: {groups}\nBenutzer: {users}', stopped: 'Broadcast gestoppt.\nGruppen: {groups}\nBenutzer: {users}', stopRequested: 'Broadcast gestoppt.', noneInProgress: 'Kein Broadcast läuft.', alreadyInProgress: 'Ein Broadcast läuft bereits.', noTargets: 'Keine Ziele gefunden.', failed: 'Broadcast fehlgeschlagen: {error}' },
  },
  pt: {
    buttons: { resume: '▶️ Retomar', mute: '🔇 Silenciar', unmute: '🔊 Reativar', addToPlaylist: '➕ Playlist', close: 'Fechar' },
    callbacks: { track: 'Faixa', nowPlaying: 'Tocando agora', paused: 'Pausado', muted: 'Silenciado', noActivePlayback: 'Não há reprodução ativa.', settingsIgnored: 'Callbacks de configurações são tratados separadamente.', closingPanel: 'Fechando painel.', trackSkipped: 'Faixa pulada.', playbackStopped: 'Reprodução parada.', playbackPaused: 'Reprodução pausada.', playbackResumed: 'Reprodução retomada.', playbackMuted: 'Reprodução silenciada.', playbackUnmuted: 'Som reativado.', actionFailed: 'Não foi possível processar a ação de reprodução.', requestedBy: 'Pedido por: {user}', pausedBy: 'Pausado por {user}', resumedBy: 'Retomado por {user}', mutedBy: 'Silenciado por {user}', unmutedBy: 'Reativado por {user}', defaultPlaylistName: 'Minha playlist (TgMusic)', addedToPlaylist: 'Faixa "{song}" adicionada à playlist "{playlist}".' },
    auth: { listTitle: 'Usuários autorizados', none: 'Nenhum usuário autorizado encontrado.', groupOnly: 'Este comando só pode ser usado em grupos.', adminOnly: 'Você precisa ser administrador para usar este comando.', adminVerifyFailed: 'Não foi possível verificar o status de administrador.', targetRequired: 'Responda a um usuário ou forneça um ID numérico.', already: 'Este usuário já está autorizado.', notAuthorized: 'Este usuário não está autorizado.', added: 'Usuário {userId} autorizado.', removed: 'Usuário {userId} removido da lista autorizada.', addFailed: 'Falha ao autorizar o usuário.', removeFailed: 'Falha ao remover usuário autorizado.' },
    broadcast: { usage: 'Responda a uma mensagem para transmitir.\n\nUso:\n/broadcast -chat : apenas grupos\n/broadcast -user : apenas usuários\n/broadcast -both : grupos + usuários (padrão)\n/broadcast -copy : enviar como cópia', started: 'Broadcast iniciado.', ended: 'Broadcast finalizado.\nGrupos: {groups}\nUsuários: {users}', stopped: 'Broadcast parado.\nGrupos: {groups}\nUsuários: {users}', stopRequested: 'Broadcast parado.', noneInProgress: 'Nenhum broadcast em andamento.', alreadyInProgress: 'Já há um broadcast em andamento.', noTargets: 'Nenhum destino encontrado.', failed: 'Broadcast falhou: {error}' },
  },
  ar: {
    buttons: { resume: '▶️ استئناف', mute: '🔇 كتم', unmute: '🔊 إلغاء الكتم', addToPlaylist: '➕ قائمة', close: 'إغلاق' },
    callbacks: { track: 'المقطع', nowPlaying: 'قيد التشغيل', paused: 'متوقف مؤقتًا', muted: 'مكتوم', noActivePlayback: 'لا يوجد تشغيل نشط.', settingsIgnored: 'يتم التعامل مع أزرار الإعدادات بشكل منفصل.', closingPanel: 'جارٍ إغلاق اللوحة.', trackSkipped: 'تم تخطي المقطع.', playbackStopped: 'تم إيقاف التشغيل.', playbackPaused: 'تم إيقاف التشغيل مؤقتًا.', playbackResumed: 'تم استئناف التشغيل.', playbackMuted: 'تم كتم التشغيل.', playbackUnmuted: 'تم إلغاء كتم التشغيل.', actionFailed: 'تعذرت معالجة إجراء التشغيل.', requestedBy: 'طلب بواسطة: {user}', pausedBy: 'أوقفه مؤقتًا {user}', resumedBy: 'استأنفه {user}', mutedBy: 'كتمه {user}', unmutedBy: 'ألغى كتمه {user}', defaultPlaylistName: 'قائمتي (TgMusic)', addedToPlaylist: 'تمت إضافة المقطع "{song}" إلى القائمة "{playlist}".' },
    auth: { listTitle: 'المستخدمون المصرح لهم', none: 'لم يتم العثور على مستخدمين مصرح لهم.', groupOnly: 'لا يمكن استخدام هذا الأمر إلا في المجموعات.', adminOnly: 'يجب أن تكون مشرفًا لاستخدام هذا الأمر.', adminVerifyFailed: 'تعذر التحقق من حالة المشرف.', targetRequired: 'قم بالرد على مستخدم أو قدم معرف مستخدم رقمي.', already: 'هذا المستخدم مصرح له بالفعل.', notAuthorized: 'هذا المستخدم غير مصرح له.', added: 'تم التصريح للمستخدم {userId}.', removed: 'تمت إزالة المستخدم {userId} من قائمة التصريح.', addFailed: 'فشل التصريح للمستخدم.', removeFailed: 'فشلت إزالة المستخدم المصرح له.' },
    broadcast: { usage: 'قم بالرد على رسالة لبثها.\n\nالاستخدام:\n/broadcast -chat : المجموعات فقط\n/broadcast -user : المستخدمون فقط\n/broadcast -both : المجموعات + المستخدمون (افتراضي)\n/broadcast -copy : إرسال كنسخة', started: 'بدأ البث.', ended: 'انتهى البث.\nالمجموعات: {groups}\nالمستخدمون: {users}', stopped: 'تم إيقاف البث.\nالمجموعات: {groups}\nالمستخدمون: {users}', stopRequested: 'تم إيقاف البث.', noneInProgress: 'لا يوجد بث قيد التشغيل.', alreadyInProgress: 'يوجد بث قيد التشغيل بالفعل.', noTargets: 'لم يتم العثور على أهداف.', failed: 'فشل البث: {error}' },
  },
  tr: {
    buttons: { resume: '▶️ Sürdür', mute: '🔇 Sustur', unmute: '🔊 Sesi aç', addToPlaylist: '➕ Playlist', close: 'Kapat' },
    callbacks: { track: 'Parça', nowPlaying: 'Çalıyor', paused: 'Duraklatıldı', muted: 'Sessiz', noActivePlayback: 'Aktif oynatma yok.', settingsIgnored: 'Ayar callbackleri ayrı işlenir.', closingPanel: 'Panel kapatılıyor.', trackSkipped: 'Parça atlandı.', playbackStopped: 'Oynatma durduruldu.', playbackPaused: 'Oynatma duraklatıldı.', playbackResumed: 'Oynatma sürdürüldü.', playbackMuted: 'Oynatma susturuldu.', playbackUnmuted: 'Ses açıldı.', actionFailed: 'Oynatma eylemi işlenemedi.', requestedBy: 'İsteyen: {user}', pausedBy: '{user} duraklattı', resumedBy: '{user} sürdürdü', mutedBy: '{user} susturdu', unmutedBy: '{user} sesi açtı', defaultPlaylistName: 'Playlistim (TgMusic)', addedToPlaylist: '"{song}" parçası "{playlist}" playlistine eklendi.' },
    auth: { listTitle: 'Yetkili kullanıcılar', none: 'Yetkili kullanıcı bulunamadı.', groupOnly: 'Bu komut sadece gruplarda kullanılabilir.', adminOnly: 'Bu komutu kullanmak için yönetici olmalısın.', adminVerifyFailed: 'Yönetici durumu doğrulanamadı.', targetRequired: 'Bir kullanıcıya yanıt ver veya sayısal kullanıcı ID gir.', already: 'Bu kullanıcı zaten yetkili.', notAuthorized: 'Bu kullanıcı yetkili değil.', added: '{userId} kullanıcısı yetkilendirildi.', removed: '{userId} kullanıcısı yetki listesinden kaldırıldı.', addFailed: 'Kullanıcı yetkilendirilemedi.', removeFailed: 'Yetkili kullanıcı kaldırılamadı.' },
    broadcast: { usage: 'Yayınlamak için bir mesaja yanıt ver.\n\nKullanım:\n/broadcast -chat : sadece gruplar\n/broadcast -user : sadece kullanıcılar\n/broadcast -both : gruplar + kullanıcılar (varsayılan)\n/broadcast -copy : kopya olarak gönder', started: 'Broadcast başladı.', ended: 'Broadcast bitti.\nGruplar: {groups}\nKullanıcılar: {users}', stopped: 'Broadcast durduruldu.\nGruplar: {groups}\nKullanıcılar: {users}', stopRequested: 'Broadcast durduruldu.', noneInProgress: 'Devam eden broadcast yok.', alreadyInProgress: 'Zaten devam eden bir broadcast var.', noTargets: 'Hedef bulunamadı.', failed: 'Broadcast başarısız: {error}' },
  },
  ko: {
    buttons: { resume: '▶️ 재개', mute: '🔇 음소거', unmute: '🔊 음소거 해제', addToPlaylist: '➕ 플레이리스트', close: '닫기' },
    callbacks: { track: '트랙', nowPlaying: '재생 중', paused: '일시정지됨', muted: '음소거됨', noActivePlayback: '활성 재생이 없습니다.', settingsIgnored: '설정 콜백은 별도로 처리됩니다.', closingPanel: '패널을 닫습니다.', trackSkipped: '트랙을 건너뛰었습니다.', playbackStopped: '재생을 중지했습니다.', playbackPaused: '재생을 일시정지했습니다.', playbackResumed: '재생을 재개했습니다.', playbackMuted: '재생을 음소거했습니다.', playbackUnmuted: '음소거를 해제했습니다.', actionFailed: '재생 작업을 처리할 수 없습니다.', requestedBy: '요청자: {user}', pausedBy: '{user}님이 일시정지함', resumedBy: '{user}님이 재개함', mutedBy: '{user}님이 음소거함', unmutedBy: '{user}님이 음소거 해제함', defaultPlaylistName: '내 플레이리스트 (TgMusic)', addedToPlaylist: '트랙 "{song}"을(를) 플레이리스트 "{playlist}"에 추가했습니다.' },
    auth: { listTitle: '인증된 사용자', none: '인증된 사용자가 없습니다.', groupOnly: '이 명령은 그룹에서만 사용할 수 있습니다.', adminOnly: '이 명령을 사용하려면 관리자여야 합니다.', adminVerifyFailed: '관리자 상태를 확인할 수 없습니다.', targetRequired: '사용자에게 답장하거나 숫자 사용자 ID를 입력하세요.', already: '이 사용자는 이미 인증되었습니다.', notAuthorized: '이 사용자는 인증되지 않았습니다.', added: '사용자 {userId} 인증 완료.', removed: '사용자 {userId}을(를) 인증 목록에서 제거했습니다.', addFailed: '사용자 인증에 실패했습니다.', removeFailed: '인증된 사용자 제거에 실패했습니다.' },
    broadcast: { usage: '방송할 메시지에 답장하세요.\n\n사용법:\n/broadcast -chat : 그룹만\n/broadcast -user : 사용자만\n/broadcast -both : 그룹 + 사용자 (기본)\n/broadcast -copy : 복사본으로 전송', started: '방송을 시작했습니다.', ended: '방송이 종료되었습니다.\n그룹: {groups}\n사용자: {users}', stopped: '방송이 중지되었습니다.\n그룹: {groups}\n사용자: {users}', stopRequested: '방송이 중지되었습니다.', noneInProgress: '진행 중인 방송이 없습니다.', alreadyInProgress: '이미 방송이 진행 중입니다.', noTargets: '대상을 찾을 수 없습니다.', failed: '방송 실패: {error}' },
  },
  zh: {
    buttons: { resume: '▶️ 继续', mute: '🔇 静音', unmute: '🔊 取消静音', addToPlaylist: '➕ 播放列表', close: '关闭' },
    callbacks: { track: '曲目', nowPlaying: '正在播放', paused: '已暂停', muted: '已静音', noActivePlayback: '当前没有播放。', settingsIgnored: '设置回调会单独处理。', closingPanel: '正在关闭面板。', trackSkipped: '已跳过曲目。', playbackStopped: '播放已停止。', playbackPaused: '播放已暂停。', playbackResumed: '播放已继续。', playbackMuted: '播放已静音。', playbackUnmuted: '已取消静音。', actionFailed: '无法处理播放操作。', requestedBy: '请求者：{user}', pausedBy: '{user} 已暂停', resumedBy: '{user} 已继续', mutedBy: '{user} 已静音', unmutedBy: '{user} 已取消静音', defaultPlaylistName: '我的播放列表 (TgMusic)', addedToPlaylist: '曲目“{song}”已添加到播放列表“{playlist}”。' },
    auth: { listTitle: '已授权用户', none: '未找到已授权用户。', groupOnly: '此命令只能在群组中使用。', adminOnly: '你必须是管理员才能使用此命令。', adminVerifyFailed: '无法验证管理员状态。', targetRequired: '请回复用户或提供数字用户 ID。', already: '此用户已被授权。', notAuthorized: '此用户未被授权。', added: '用户 {userId} 已授权。', removed: '用户 {userId} 已从授权列表移除。', addFailed: '授权用户失败。', removeFailed: '移除已授权用户失败。' },
    broadcast: { usage: '请回复一条消息进行广播。\n\n用法：\n/broadcast -chat : 仅群组\n/broadcast -user : 仅用户\n/broadcast -both : 群组 + 用户（默认）\n/broadcast -copy : 作为副本发送', started: '广播已开始。', ended: '广播已结束。\n群组：{groups}\n用户：{users}', stopped: '广播已停止。\n群组：{groups}\n用户：{users}', stopRequested: '广播已停止。', noneInProgress: '没有正在进行的广播。', alreadyInProgress: '已有广播正在进行。', noTargets: '未找到目标。', failed: '广播失败：{error}' },
  },
};

for (const [code, override] of Object.entries(featureTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}

const devTranslations = {
  ru: { devs: { devOnly: 'Только разработчики могут использовать эту команду.', noActiveChats: 'Активные чаты не найдены.', clearAssistantsDone: 'Ассистент удалён из {count} чатов.', clearAssistantsFailed: 'Не удалось очистить ассистентов: {error}', leaveAllStarted: 'Ассистент выходит из всех чатов...', leaveAllDone: 'Ассистент вышел из {count} чатов.', leaveAllFailed: 'Не удалось выйти из всех чатов: {error}', loggerMissing: 'Сначала задайте LOGGER_ID в .env.', loggerUsage: 'Использование: /logger [enable|disable|on|off]\nТекущий статус: {status}', loggerEnabled: 'Логгер включён', loggerDisabled: 'Логгер выключен', loggerInvalid: "Недопустимый аргумент. Используйте 'enable', 'disable', 'on' или 'off'." } },
  ja: { devs: { devOnly: 'このコマンドは開発者のみ使用できます。', noActiveChats: 'アクティブなチャットは見つかりません。', clearAssistantsDone: '{count} 件のチャットからアシスタントを削除しました。', clearAssistantsFailed: 'アシスタントのクリアに失敗しました: {error}', leaveAllStarted: 'アシスタントがすべてのチャットから退出しています...', leaveAllDone: 'アシスタントは {count} 件のチャットから退出しました。', leaveAllFailed: 'すべてのチャットから退出できませんでした: {error}', loggerMissing: '先に .env に LOGGER_ID を設定してください。', loggerUsage: '使い方: /logger [enable|disable|on|off]\n現在の状態: {status}', loggerEnabled: 'ロガーを有効にしました', loggerDisabled: 'ロガーを無効にしました', loggerInvalid: "無効な引数です。'enable'、'disable'、'on'、'off' を使ってください。" } },
  hi: { devs: { devOnly: 'यह command केवल developers के लिए है।', noActiveChats: 'कोई active chat नहीं मिला।', clearAssistantsDone: '{count} chats से assistant हटाया गया।', clearAssistantsFailed: 'Assistants साफ़ करने में विफल: {error}', leaveAllStarted: 'Assistant सभी chats छोड़ रहा है...', leaveAllDone: 'Assistant ने {count} chats छोड़े।', leaveAllFailed: 'सभी chats छोड़ने में विफल: {error}', loggerMissing: 'पहले .env में LOGGER_ID सेट करें।', loggerUsage: 'Usage: /logger [enable|disable|on|off]\nCurrent status: {status}', loggerEnabled: 'Logger enabled', loggerDisabled: 'Logger disabled', loggerInvalid: "Invalid argument. 'enable', 'disable', 'on', या 'off' इस्तेमाल करें।" } },
  it: { devs: { devOnly: 'Solo gli sviluppatori possono usare questo comando.', noActiveChats: 'Nessuna chat attiva trovata.', clearAssistantsDone: 'Assistente rimosso da {count} chat.', clearAssistantsFailed: 'Impossibile pulire gli assistenti: {error}', leaveAllStarted: 'L’assistente sta lasciando tutte le chat...', leaveAllDone: 'L’assistente ha lasciato {count} chat.', leaveAllFailed: 'Impossibile lasciare tutte le chat: {error}', loggerMissing: 'Imposta prima LOGGER_ID in .env.', loggerUsage: 'Uso: /logger [enable|disable|on|off]\nStato attuale: {status}', loggerEnabled: 'Logger abilitato', loggerDisabled: 'Logger disabilitato', loggerInvalid: "Argomento non valido. Usa 'enable', 'disable', 'on' o 'off'." } },
  es: { devs: { devOnly: 'Solo los desarrolladores pueden usar este comando.', noActiveChats: 'No se encontraron chats activos.', clearAssistantsDone: 'Asistente eliminado de {count} chats.', clearAssistantsFailed: 'No se pudieron limpiar los asistentes: {error}', leaveAllStarted: 'El asistente está saliendo de todos los chats...', leaveAllDone: 'El asistente salió de {count} chats.', leaveAllFailed: 'No se pudo salir de todos los chats: {error}', loggerMissing: 'Configura LOGGER_ID en .env primero.', loggerUsage: 'Uso: /logger [enable|disable|on|off]\nEstado actual: {status}', loggerEnabled: 'Logger activado', loggerDisabled: 'Logger desactivado', loggerInvalid: "Argumento inválido. Usa 'enable', 'disable', 'on' u 'off'." } },
  fr: { devs: { devOnly: 'Seuls les développeurs peuvent utiliser cette commande.', noActiveChats: 'Aucun chat actif trouvé.', clearAssistantsDone: 'Assistant retiré de {count} chats.', clearAssistantsFailed: 'Impossible de nettoyer les assistants : {error}', leaveAllStarted: 'L’assistant quitte tous les chats...', leaveAllDone: 'L’assistant a quitté {count} chats.', leaveAllFailed: 'Impossible de quitter tous les chats : {error}', loggerMissing: 'Veuillez définir LOGGER_ID dans .env d’abord.', loggerUsage: 'Utilisation : /logger [enable|disable|on|off]\nStatut actuel : {status}', loggerEnabled: 'Logger activé', loggerDisabled: 'Logger désactivé', loggerInvalid: "Argument invalide. Utilisez 'enable', 'disable', 'on' ou 'off'." } },
  de: { devs: { devOnly: 'Nur Entwickler können diesen Befehl verwenden.', noActiveChats: 'Keine aktiven Chats gefunden.', clearAssistantsDone: 'Assistent aus {count} Chats entfernt.', clearAssistantsFailed: 'Assistenten konnten nicht gelöscht werden: {error}', leaveAllStarted: 'Assistent verlässt alle Chats...', leaveAllDone: 'Assistent hat {count} Chats verlassen.', leaveAllFailed: 'Konnte nicht alle Chats verlassen: {error}', loggerMissing: 'Bitte zuerst LOGGER_ID in .env setzen.', loggerUsage: 'Nutzung: /logger [enable|disable|on|off]\nAktueller Status: {status}', loggerEnabled: 'Logger aktiviert', loggerDisabled: 'Logger deaktiviert', loggerInvalid: "Ungültiges Argument. Verwende 'enable', 'disable', 'on' oder 'off'." } },
  pt: { devs: { devOnly: 'Apenas desenvolvedores podem usar este comando.', noActiveChats: 'Nenhum chat ativo encontrado.', clearAssistantsDone: 'Assistente removido de {count} chats.', clearAssistantsFailed: 'Falha ao limpar assistentes: {error}', leaveAllStarted: 'O assistente está saindo de todos os chats...', leaveAllDone: 'O assistente saiu de {count} chats.', leaveAllFailed: 'Falha ao sair de todos os chats: {error}', loggerMissing: 'Defina LOGGER_ID no .env primeiro.', loggerUsage: 'Uso: /logger [enable|disable|on|off]\nStatus atual: {status}', loggerEnabled: 'Logger ativado', loggerDisabled: 'Logger desativado', loggerInvalid: "Argumento inválido. Use 'enable', 'disable', 'on' ou 'off'." } },
  ar: { devs: { devOnly: 'يمكن للمطورين فقط استخدام هذا الأمر.', noActiveChats: 'لم يتم العثور على محادثات نشطة.', clearAssistantsDone: 'تمت إزالة المساعد من {count} محادثات.', clearAssistantsFailed: 'فشل مسح المساعدين: {error}', leaveAllStarted: 'المساعد يغادر كل المحادثات...', leaveAllDone: 'غادر المساعد {count} محادثات.', leaveAllFailed: 'فشل مغادرة كل المحادثات: {error}', loggerMissing: 'يرجى تعيين LOGGER_ID في .env أولاً.', loggerUsage: 'الاستخدام: /logger [enable|disable|on|off]\nالحالة الحالية: {status}', loggerEnabled: 'تم تفعيل السجل', loggerDisabled: 'تم تعطيل السجل', loggerInvalid: "وسيط غير صالح. استخدم 'enable' أو 'disable' أو 'on' أو 'off'." } },
  tr: { devs: { devOnly: 'Bu komutu sadece geliştiriciler kullanabilir.', noActiveChats: 'Aktif sohbet bulunamadı.', clearAssistantsDone: 'Asistan {count} sohbetten kaldırıldı.', clearAssistantsFailed: 'Asistanlar temizlenemedi: {error}', leaveAllStarted: 'Asistan tüm sohbetlerden ayrılıyor...', leaveAllDone: 'Asistan {count} sohbetten ayrıldı.', leaveAllFailed: 'Tüm sohbetlerden ayrılma başarısız: {error}', loggerMissing: 'Önce .env içinde LOGGER_ID ayarla.', loggerUsage: 'Kullanım: /logger [enable|disable|on|off]\nMevcut durum: {status}', loggerEnabled: 'Logger etkinleştirildi', loggerDisabled: 'Logger devre dışı', loggerInvalid: "Geçersiz argüman. 'enable', 'disable', 'on' veya 'off' kullan." } },
  ko: { devs: { devOnly: '개발자만 이 명령을 사용할 수 있습니다.', noActiveChats: '활성 채팅을 찾을 수 없습니다.', clearAssistantsDone: '{count}개 채팅에서 어시스턴트를 제거했습니다.', clearAssistantsFailed: '어시스턴트 정리에 실패했습니다: {error}', leaveAllStarted: '어시스턴트가 모든 채팅에서 나가는 중...', leaveAllDone: '어시스턴트가 {count}개 채팅에서 나갔습니다.', leaveAllFailed: '모든 채팅에서 나가지 못했습니다: {error}', loggerMissing: '먼저 .env에 LOGGER_ID를 설정하세요.', loggerUsage: '사용법: /logger [enable|disable|on|off]\n현재 상태: {status}', loggerEnabled: '로거 활성화됨', loggerDisabled: '로거 비활성화됨', loggerInvalid: "잘못된 인수입니다. 'enable', 'disable', 'on', 'off' 중 하나를 사용하세요." } },
  zh: { devs: { devOnly: '只有开发者可以使用此命令。', noActiveChats: '未找到活跃聊天。', clearAssistantsDone: '已从 {count} 个聊天移除助手。', clearAssistantsFailed: '清理助手失败：{error}', leaveAllStarted: '助手正在离开所有聊天...', leaveAllDone: '助手已离开 {count} 个聊天。', leaveAllFailed: '离开所有聊天失败：{error}', loggerMissing: '请先在 .env 中设置 LOGGER_ID。', loggerUsage: '用法：/logger [enable|disable|on|off]\n当前状态：{status}', loggerEnabled: '日志已启用', loggerDisabled: '日志已禁用', loggerInvalid: "参数无效。请使用 'enable'、'disable'、'on' 或 'off'。" } },
};

for (const [code, override] of Object.entries(devTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}

const filterTranslations = {
  id: { filters: { botNotAdmin: 'Bot bukan administrator di chat ini.\nPromosikan bot dengan izin mengundang pengguna.', botAdminVerifyFailed: 'Tidak dapat memverifikasi status administrator bot.', botMissingInvite: 'Bot tidak memiliki izin mengundang pengguna.', botNotAdminReload: 'Bot bukan administrator di chat ini.\nGunakan /reload untuk menyegarkan cache admin.', adminRequired: 'Kamu harus menjadi administrator untuk menggunakan perintah ini.', notAuthorized: 'Kamu tidak diizinkan menggunakan perintah ini.', adminActionRequired: 'Kamu harus menjadi administrator untuk menggunakan aksi ini.', actionNotAuthorized: 'Kamu tidak diizinkan menggunakan aksi ini.', playModeAdminOnly: 'Play mode aktif.\nHanya administrator dan pengguna terotorisasi yang dapat memulai playback.' } },
  ru: { playback: { voiceChatInactiveWarning: '⚠️ В этом чате ещё не запущен голосовой чат. Сначала запустите голосовой/видеочат, затем включайте музыку.' }, filters: { botNotAdmin: 'Бот не администратор в этом чате.\nВыдайте боту право приглашать пользователей.', botAdminVerifyFailed: 'Не удалось проверить статус администратора бота.', botMissingInvite: 'У бота нет права приглашать пользователей.', botNotAdminReload: 'Бот не администратор в этом чате.\nИспользуйте /reload для обновления кэша админов.', adminRequired: 'Вы должны быть администратором для этой команды.', notAuthorized: 'Вы не авторизованы для этой команды.', adminActionRequired: 'Вы должны быть администратором для этого действия.', actionNotAuthorized: 'Вы не авторизованы для этого действия.', playModeAdminOnly: 'Режим play включён.\nТолько администраторы и авторизованные пользователи могут запускать воспроизведение.' } },
  ja: { playback: { voiceChatInactiveWarning: '⚠️ このグループではまだ音声チャットが開始されていません。先に音声/ビデオチャットを開始してから再生してください。' }, filters: { botNotAdmin: 'このチャットでボットは管理者ではありません。\nユーザー招待権限付きで昇格してください。', botAdminVerifyFailed: 'ボットの管理者状態を確認できません。', botMissingInvite: 'ボットにユーザー招待権限がありません。', botNotAdminReload: 'このチャットでボットは管理者ではありません。\n/reload で管理者キャッシュを更新してください。', adminRequired: 'このコマンドには管理者権限が必要です。', notAuthorized: 'このコマンドを使用する権限がありません。', adminActionRequired: 'この操作には管理者権限が必要です。', actionNotAuthorized: 'この操作を実行する権限がありません。', playModeAdminOnly: 'Play mode が有効です。\n管理者と認証済みユーザーのみ再生を開始できます。' } },
  hi: { playback: { voiceChatInactiveWarning: '⚠️ इस समूह में अभी voice chat सक्रिय नहीं है। पहले voice/video chat शुरू करें, फिर /play चलाएँ।' }, filters: { botNotAdmin: 'Bot इस chat में administrator नहीं है।\nBot को invite users permission के साथ promote करें।', botAdminVerifyFailed: 'Bot administrator status verify नहीं हो सका।', botMissingInvite: 'Bot के पास users invite करने की permission नहीं है।', botNotAdminReload: 'Bot इस chat में administrator नहीं है।\nAdmin cache refresh करने के लिए /reload इस्तेमाल करें।', adminRequired: 'इस command के लिए administrator होना जरूरी है।', notAuthorized: 'आप इस command के लिए authorized नहीं हैं।', adminActionRequired: 'इस action के लिए administrator होना जरूरी है।', actionNotAuthorized: 'आप इस action के लिए authorized नहीं हैं।', playModeAdminOnly: 'Play mode enabled है।\nकेवल administrators और authorized users playback शुरू कर सकते हैं।' } },
  it: { playback: { voiceChatInactiveWarning: '⚠️ La chat vocale non è ancora attiva in questo gruppo. Avvia prima la chat vocale/video, poi riprova con /play.' }, filters: { botNotAdmin: 'Il bot non è amministratore in questa chat.\nPromuovi il bot con il permesso di invitare utenti.', botAdminVerifyFailed: 'Impossibile verificare lo stato amministratore del bot.', botMissingInvite: 'Il bot non ha il permesso di invitare utenti.', botNotAdminReload: 'Il bot non è amministratore in questa chat.\nUsa /reload per aggiornare la cache admin.', adminRequired: 'Devi essere amministratore per usare questo comando.', notAuthorized: 'Non sei autorizzato a usare questo comando.', adminActionRequired: 'Devi essere amministratore per questa azione.', actionNotAuthorized: 'Non sei autorizzato per questa azione.', playModeAdminOnly: 'Play mode è attivo.\nSolo amministratori e utenti autorizzati possono avviare la riproduzione.' } },
  es: { playback: { voiceChatInactiveWarning: '⚠️ El chat de voz aún no está activo en este grupo. Inicia primero el chat de voz/video y luego vuelve a usar /play.' }, filters: { botNotAdmin: 'El bot no es administrador en este chat.\nPromueve al bot con permiso para invitar usuarios.', botAdminVerifyFailed: 'No se pudo verificar el estado de administrador del bot.', botMissingInvite: 'El bot no tiene permiso para invitar usuarios.', botNotAdminReload: 'El bot no es administrador en este chat.\nUsa /reload para refrescar la caché de admins.', adminRequired: 'Debes ser administrador para usar este comando.', notAuthorized: 'No estás autorizado para usar este comando.', adminActionRequired: 'Debes ser administrador para esta acción.', actionNotAuthorized: 'No estás autorizado para esta acción.', playModeAdminOnly: 'Play mode está activado.\nSolo administradores y usuarios autorizados pueden iniciar reproducción.' } },
  fr: { playback: { voiceChatInactiveWarning: '⚠️ Le chat vocal n’est pas encore actif dans ce groupe. Lancez d’abord un chat vocal/vidéo puis relancez /play.' }, filters: { botNotAdmin: 'Le bot n’est pas administrateur dans ce chat.\nPromouvez le bot avec la permission d’inviter des utilisateurs.', botAdminVerifyFailed: 'Impossible de vérifier le statut administrateur du bot.', botMissingInvite: 'Le bot n’a pas la permission d’inviter des utilisateurs.', botNotAdminReload: 'Le bot n’est pas administrateur dans ce chat.\nUtilisez /reload pour rafraîchir le cache admin.', adminRequired: 'Vous devez être administrateur pour utiliser cette commande.', notAuthorized: 'Vous n’êtes pas autorisé à utiliser cette commande.', adminActionRequired: 'Vous devez être administrateur pour cette action.', actionNotAuthorized: 'Vous n’êtes pas autorisé pour cette action.', playModeAdminOnly: 'Le play mode est activé.\nSeuls les administrateurs et utilisateurs autorisés peuvent lancer la lecture.' } },
  de: { playback: { voiceChatInactiveWarning: '⚠️ Der Sprachchat ist in dieser Gruppe noch nicht aktiv. Starte zuerst den Sprach-/Videochat und nutze dann /play erneut.' }, filters: { botNotAdmin: 'Der Bot ist in diesem Chat kein Administrator.\nGib dem Bot die Berechtigung, Benutzer einzuladen.', botAdminVerifyFailed: 'Administratorstatus des Bots konnte nicht geprüft werden.', botMissingInvite: 'Der Bot darf keine Benutzer einladen.', botNotAdminReload: 'Der Bot ist in diesem Chat kein Administrator.\nNutze /reload, um den Admin-Cache zu aktualisieren.', adminRequired: 'Du musst Administrator sein, um diesen Befehl zu verwenden.', notAuthorized: 'Du bist für diesen Befehl nicht autorisiert.', adminActionRequired: 'Du musst Administrator sein, um diese Aktion zu verwenden.', actionNotAuthorized: 'Du bist für diese Aktion nicht autorisiert.', playModeAdminOnly: 'Play mode ist aktiviert.\nNur Administratoren und autorisierte Benutzer können Wiedergabe starten.' } },
  pt: { playback: { voiceChatInactiveWarning: '⚠️ O chat de voz ainda não está ativo neste grupo. Inicie primeiro o chat de voz/vídeo e depois use /play novamente.' }, filters: { botNotAdmin: 'O bot não é administrador neste chat.\nPromova o bot com permissão para convidar usuários.', botAdminVerifyFailed: 'Não foi possível verificar o status de administrador do bot.', botMissingInvite: 'O bot não tem permissão para convidar usuários.', botNotAdminReload: 'O bot não é administrador neste chat.\nUse /reload para atualizar o cache de admins.', adminRequired: 'Você precisa ser administrador para usar este comando.', notAuthorized: 'Você não está autorizado a usar este comando.', adminActionRequired: 'Você precisa ser administrador para esta ação.', actionNotAuthorized: 'Você não está autorizado para esta ação.', playModeAdminOnly: 'Play mode está ativado.\nApenas administradores e usuários autorizados podem iniciar a reprodução.' } },
  ar: { playback: { voiceChatInactiveWarning: '⚠️ الدردشة الصوتية غير مفعلة بعد في هذه المجموعة. ابدأ أولًا دردشة صوتية/فيديو ثم أعد استخدام /play.' }, filters: { botNotAdmin: 'البوت ليس مشرفًا في هذه المحادثة.\nقم بترقية البوت مع صلاحية دعوة المستخدمين.', botAdminVerifyFailed: 'تعذر التحقق من حالة مشرف البوت.', botMissingInvite: 'لا يملك البوت صلاحية دعوة المستخدمين.', botNotAdminReload: 'البوت ليس مشرفًا في هذه المحادثة.\nاستخدم /reload لتحديث كاش المشرفين.', adminRequired: 'يجب أن تكون مشرفًا لاستخدام هذا الأمر.', notAuthorized: 'أنت غير مصرح لاستخدام هذا الأمر.', adminActionRequired: 'يجب أن تكون مشرفًا لاستخدام هذا الإجراء.', actionNotAuthorized: 'أنت غير مصرح لهذا الإجراء.', playModeAdminOnly: 'وضع التشغيل مفعل.\nيمكن للمشرفين والمستخدمين المصرح لهم فقط بدء التشغيل.' } },
  tr: { playback: { voiceChatInactiveWarning: '⚠️ Bu grupta sesli sohbet henüz aktif değil. Önce sesli/görüntülü sohbet başlatın, ardından /play kullanın.' }, filters: { botNotAdmin: 'Bot bu sohbette yönetici değil.\nBotu kullanıcı davet etme izniyle yönetici yap.', botAdminVerifyFailed: 'Bot yönetici durumu doğrulanamadı.', botMissingInvite: 'Botun kullanıcı davet etme izni yok.', botNotAdminReload: 'Bot bu sohbette yönetici değil.\nAdmin önbelleğini yenilemek için /reload kullan.', adminRequired: 'Bu komutu kullanmak için yönetici olmalısın.', notAuthorized: 'Bu komutu kullanmaya yetkili değilsin.', adminActionRequired: 'Bu eylem için yönetici olmalısın.', actionNotAuthorized: 'Bu eylem için yetkili değilsin.', playModeAdminOnly: 'Play mode etkin.\nSadece yöneticiler ve yetkili kullanıcılar oynatmayı başlatabilir.' } },
  ko: { playback: { voiceChatInactiveWarning: '⚠️ 이 그룹에서 음성 채팅이 아직 활성화되지 않았습니다. 먼저 음성/영상 채팅을 시작한 뒤 /play를 사용하세요.' }, filters: { botNotAdmin: '이 채팅에서 봇이 관리자가 아닙니다.\n사용자 초대 권한과 함께 봇을 관리자로 승격하세요.', botAdminVerifyFailed: '봇 관리자 상태를 확인할 수 없습니다.', botMissingInvite: '봇에 사용자 초대 권한이 없습니다.', botNotAdminReload: '이 채팅에서 봇이 관리자가 아닙니다.\n/reload로 관리자 캐시를 새로고침하세요.', adminRequired: '이 명령을 사용하려면 관리자여야 합니다.', notAuthorized: '이 명령을 사용할 권한이 없습니다.', adminActionRequired: '이 작업을 사용하려면 관리자여야 합니다.', actionNotAuthorized: '이 작업을 사용할 권한이 없습니다.', playModeAdminOnly: 'Play mode가 활성화되었습니다.\n관리자와 인증된 사용자만 재생을 시작할 수 있습니다.' } },
  zh: { playback: { voiceChatInactiveWarning: '⚠️ 此群组的语音聊天尚未开启。请先开启语音/视频聊天，然后再使用 /play。' }, filters: { botNotAdmin: '机器人不是此聊天的管理员。\n请授予机器人邀请用户权限。', botAdminVerifyFailed: '无法验证机器人管理员状态。', botMissingInvite: '机器人没有邀请用户权限。', botNotAdminReload: '机器人不是此聊天的管理员。\n使用 /reload 刷新管理员缓存。', adminRequired: '你必须是管理员才能使用此命令。', notAuthorized: '你无权使用此命令。', adminActionRequired: '你必须是管理员才能执行此操作。', actionNotAuthorized: '你无权执行此操作。', playModeAdminOnly: 'Play mode 已启用。\n只有管理员和已授权用户可以开始播放。' } },
};

for (const [code, override] of Object.entries(filterTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}

const appleMusicTranslations = {
  en: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artist', appleMusicAlbum: 'Album', appleMusicRelease: 'Release', appleMusicGenre: 'Genre', appleMusicOpen: 'Open in Apple Music', appleMusicSelectHint: 'Select this song to start playback in voice chat.', appleMusicNowPlaying: 'Now Playing from Apple Music', appleMusicPlaybackVia: 'Audio resolved via', appleMusicResolving: '🍎 Resolving Apple Music track...', appleMusicMatchFailed: 'Apple Music track found, but no playable audio source is currently available.', appleMusicTrackLinkRequired: 'Please send an Apple Music track link, not an album link.', appleMusicFetchFailed: 'Failed to fetch track information from Apple Music.', appleMusicDownloaderNotConfigured: 'Apple Music downloader provider is not configured by bot admin yet.' } },
  id: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artis', appleMusicAlbum: 'Album', appleMusicRelease: 'Rilis', appleMusicGenre: 'Genre', appleMusicOpen: 'Buka di Apple Music', appleMusicSelectHint: 'Pilih lagu ini untuk diputar di voice chat.', appleMusicNowPlaying: 'Sedang Diputar dari Apple Music', appleMusicPlaybackVia: 'Audio ditemukan melalui', appleMusicResolving: '🍎 Menyiapkan lagu Apple Music...', appleMusicMatchFailed: 'Lagu Apple Music ditemukan, tetapi sumber audio yang dapat diputar belum tersedia.', appleMusicTrackLinkRequired: 'Kirim tautan lagu Apple Music, bukan tautan album.', appleMusicFetchFailed: 'Gagal mengambil informasi lagu dari Apple Music.', appleMusicDownloaderNotConfigured: 'Provider downloader Apple Music belum dikonfigurasi oleh admin bot.' } },
  ru: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Исполнитель', appleMusicAlbum: 'Альбом', appleMusicRelease: 'Релиз', appleMusicGenre: 'Жанр', appleMusicOpen: 'Открыть в Apple Music', appleMusicSelectHint: 'Выберите этот трек для воспроизведения в голосовом чате.', appleMusicNowPlaying: 'Сейчас играет из Apple Music', appleMusicPlaybackVia: 'Аудио найдено через', appleMusicResolving: '🍎 Подготавливаем трек Apple Music...', appleMusicMatchFailed: 'Трек Apple Music найден, но воспроизводимый источник аудио не найден.', appleMusicTrackLinkRequired: 'Отправьте ссылку на трек Apple Music, а не на альбом.', appleMusicFetchFailed: 'Не удалось получить информацию о треке из Apple Music.' } },
  ja: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'アーティスト', appleMusicAlbum: 'アルバム', appleMusicRelease: 'リリース', appleMusicGenre: 'ジャンル', appleMusicOpen: 'Apple Musicで開く', appleMusicSelectHint: 'この曲を選択してボイスチャットで再生します。', appleMusicNowPlaying: 'Apple Music から再生中', appleMusicPlaybackVia: '音源の取得元', appleMusicResolving: '🍎 Apple Music の曲を準備中...', appleMusicMatchFailed: 'Apple Music の曲は見つかりましたが、再生可能な音源が見つかりませんでした。', appleMusicTrackLinkRequired: 'アルバムではなく Apple Music の曲リンクを送信してください。', appleMusicFetchFailed: 'Apple Music から曲情報を取得できませんでした。' } },
  hi: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'कलाकार', appleMusicAlbum: 'एल्बम', appleMusicRelease: 'रिलीज़', appleMusicGenre: 'शैली', appleMusicOpen: 'Apple Music में खोलें', appleMusicSelectHint: 'वॉइस चैट में चलाने के लिए यह गाना चुनें।', appleMusicNowPlaying: 'Apple Music से अभी चल रहा है', appleMusicPlaybackVia: 'ऑडियो स्रोत', appleMusicResolving: '🍎 Apple Music गाना तैयार किया जा रहा है...', appleMusicMatchFailed: 'Apple Music गाना मिला, लेकिन चलाने योग्य ऑडियो स्रोत उपलब्ध नहीं है।', appleMusicTrackLinkRequired: 'कृपया Apple Music ट्रैक लिंक भेजें, एल्बम लिंक नहीं।', appleMusicFetchFailed: 'Apple Music से गाने की जानकारी नहीं मिल सकी।' } },
  it: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artista', appleMusicAlbum: 'Album', appleMusicRelease: 'Uscita', appleMusicGenre: 'Genere', appleMusicOpen: 'Apri in Apple Music', appleMusicSelectHint: 'Seleziona questo brano per avviare la riproduzione in chat vocale.', appleMusicNowPlaying: 'In riproduzione da Apple Music', appleMusicPlaybackVia: 'Audio trovato tramite', appleMusicResolving: '🍎 Preparazione brano Apple Music...', appleMusicMatchFailed: 'Brano Apple Music trovato, ma non è disponibile una sorgente audio riproducibile.', appleMusicTrackLinkRequired: 'Invia un link brano Apple Music, non un link album.', appleMusicFetchFailed: 'Impossibile recuperare i dati del brano da Apple Music.' } },
  es: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artista', appleMusicAlbum: 'Álbum', appleMusicRelease: 'Lanzamiento', appleMusicGenre: 'Género', appleMusicOpen: 'Abrir en Apple Music', appleMusicSelectHint: 'Selecciona esta canción para reproducirla en el chat de voz.', appleMusicNowPlaying: 'Reproduciendo desde Apple Music', appleMusicPlaybackVia: 'Audio encontrado mediante', appleMusicResolving: '🍎 Preparando canción de Apple Music...', appleMusicMatchFailed: 'Se encontró la canción de Apple Music, pero no hay una fuente de audio reproducible disponible.', appleMusicTrackLinkRequired: 'Envía un enlace de canción de Apple Music, no un enlace de álbum.', appleMusicFetchFailed: 'No se pudo obtener la información de la canción desde Apple Music.' } },
  fr: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artiste', appleMusicAlbum: 'Album', appleMusicRelease: 'Sortie', appleMusicGenre: 'Genre', appleMusicOpen: 'Ouvrir dans Apple Music', appleMusicSelectHint: 'Sélectionnez ce titre pour lancer la lecture dans le chat vocal.', appleMusicNowPlaying: 'Lecture depuis Apple Music', appleMusicPlaybackVia: 'Audio trouvé via', appleMusicResolving: '🍎 Préparation du morceau Apple Music...', appleMusicMatchFailed: 'Morceau Apple Music trouvé, mais aucune source audio lisible n’est disponible.', appleMusicTrackLinkRequired: 'Envoyez un lien de morceau Apple Music, pas un lien d’album.', appleMusicFetchFailed: 'Impossible de récupérer les informations du morceau depuis Apple Music.' } },
  de: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Künstler', appleMusicAlbum: 'Album', appleMusicRelease: 'Veröffentlichung', appleMusicGenre: 'Genre', appleMusicOpen: 'In Apple Music öffnen', appleMusicSelectHint: 'Wähle diesen Song aus, um ihn im Sprachchat abzuspielen.', appleMusicNowPlaying: 'Wiedergabe von Apple Music', appleMusicPlaybackVia: 'Audio gefunden über', appleMusicResolving: '🍎 Apple-Music-Titel wird vorbereitet...', appleMusicMatchFailed: 'Apple-Music-Titel gefunden, aber keine abspielbare Audioquelle verfügbar.', appleMusicTrackLinkRequired: 'Bitte sende einen Apple-Music-Track-Link, keinen Album-Link.', appleMusicFetchFailed: 'Track-Informationen von Apple Music konnten nicht geladen werden.' } },
  pt: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Artista', appleMusicAlbum: 'Álbum', appleMusicRelease: 'Lançamento', appleMusicGenre: 'Gênero', appleMusicOpen: 'Abrir no Apple Music', appleMusicSelectHint: 'Selecione esta música para iniciar a reprodução no chat de voz.', appleMusicNowPlaying: 'Tocando do Apple Music', appleMusicPlaybackVia: 'Áudio encontrado via', appleMusicResolving: '🍎 Preparando música do Apple Music...', appleMusicMatchFailed: 'Música do Apple Music encontrada, mas a fonte de áudio reproduzível não está disponível.', appleMusicTrackLinkRequired: 'Envie um link de faixa do Apple Music, não de álbum.', appleMusicFetchFailed: 'Falha ao buscar informações da faixa no Apple Music.' } },
  ar: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'الفنان', appleMusicAlbum: 'الألبوم', appleMusicRelease: 'الإصدار', appleMusicGenre: 'النوع', appleMusicOpen: 'فتح في Apple Music', appleMusicSelectHint: 'اختر هذه الأغنية لبدء التشغيل في الدردشة الصوتية.', appleMusicNowPlaying: 'يتم التشغيل من Apple Music', appleMusicPlaybackVia: 'تم العثور على الصوت عبر', appleMusicResolving: '🍎 جارٍ تجهيز أغنية Apple Music...', appleMusicMatchFailed: 'تم العثور على أغنية Apple Music، ولكن لا يتوفر مصدر صوت قابل للتشغيل.', appleMusicTrackLinkRequired: 'أرسل رابط أغنية Apple Music وليس رابط ألبوم.', appleMusicFetchFailed: 'تعذر جلب معلومات الأغنية من Apple Music.' } },
  tr: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: 'Sanatçı', appleMusicAlbum: 'Albüm', appleMusicRelease: 'Çıkış', appleMusicGenre: 'Tür', appleMusicOpen: 'Apple Music’te aç', appleMusicSelectHint: 'Sesli sohbette oynatmak için bu şarkıyı seç.', appleMusicNowPlaying: 'Apple Music’ten Çalınıyor', appleMusicPlaybackVia: 'Ses kaynağı', appleMusicResolving: '🍎 Apple Music şarkısı hazırlanıyor...', appleMusicMatchFailed: 'Apple Music şarkısı bulundu ancak oynatılabilir ses kaynağı bulunamadı.', appleMusicTrackLinkRequired: 'Albüm bağlantısı değil, Apple Music şarkı bağlantısı gönderin.', appleMusicFetchFailed: 'Apple Music’ten şarkı bilgisi alınamadı.' } },
  ko: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: '아티스트', appleMusicAlbum: '앨범', appleMusicRelease: '발매', appleMusicGenre: '장르', appleMusicOpen: 'Apple Music에서 열기', appleMusicSelectHint: '음성 채팅에서 재생하려면 이 곡을 선택하세요.', appleMusicNowPlaying: 'Apple Music에서 재생 중', appleMusicPlaybackVia: '오디오 소스', appleMusicResolving: '🍎 Apple Music 곡 준비 중...', appleMusicMatchFailed: 'Apple Music 곡을 찾았지만 재생 가능한 오디오 소스를 찾지 못했습니다.', appleMusicTrackLinkRequired: '앨범 링크가 아닌 Apple Music 트랙 링크를 보내주세요.', appleMusicFetchFailed: 'Apple Music에서 곡 정보를 가져오지 못했습니다.' } },
  zh: { playback: { appleMusicDiscovery: 'Apple Music Discovery', appleMusicArtist: '艺术家', appleMusicAlbum: '专辑', appleMusicRelease: '发行', appleMusicGenre: '流派', appleMusicOpen: '在 Apple Music 中打开', appleMusicSelectHint: '选择这首歌即可在语音聊天中播放。', appleMusicNowPlaying: '正在通过 Apple Music 播放', appleMusicPlaybackVia: '音频来源', appleMusicResolving: '🍎 正在准备 Apple Music 歌曲...', appleMusicMatchFailed: '已找到 Apple Music 歌曲，但暂时没有可播放的音频来源。', appleMusicTrackLinkRequired: '请发送 Apple Music 单曲链接，而不是专辑链接。', appleMusicFetchFailed: '无法从 Apple Music 获取歌曲信息。' } },
};
for (const [code, override] of Object.entries(appleMusicTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}


const spotifyTranslations = {
  en: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Open in Spotify', spotifySelectHint: 'Select this song to start playback in voice chat.', spotifyNowPlaying: 'Now Playing from Spotify', spotifyPlaybackVia: 'Audio resolved via', spotifyResolving: '🟢 Resolving Spotify track...', spotifyMatchFailed: 'Spotify track found, but no playable audio source is currently available.', spotifyTrackLinkRequired: 'Please send a Spotify track link, not album/playlist/artist links.', spotifyFetchFailed: 'Failed to fetch track information from Spotify.', spotifyDownloaderNotConfigured: 'Spotify downloader provider is not configured by bot admin yet.' } },
  id: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Buka di Spotify', spotifySelectHint: 'Pilih lagu ini untuk diputar di voice chat.', spotifyNowPlaying: 'Sedang Diputar dari Spotify', spotifyPlaybackVia: 'Audio ditemukan melalui', spotifyResolving: '🟢 Menyiapkan lagu Spotify...', spotifyMatchFailed: 'Lagu Spotify ditemukan, tetapi sumber audio yang dapat diputar belum tersedia.', spotifyTrackLinkRequired: 'Kirim tautan lagu Spotify, bukan album/playlist/artis.', spotifyFetchFailed: 'Gagal mengambil informasi lagu dari Spotify.', spotifyDownloaderNotConfigured: 'Provider downloader Spotify belum dikonfigurasi oleh admin bot.' } },
  ru: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Открыть в Spotify', spotifySelectHint: 'Выберите этот трек для воспроизведения в голосовом чате.', spotifyNowPlaying: 'Сейчас играет из Spotify', spotifyPlaybackVia: 'Аудио найдено через', spotifyResolving: '🟢 Подготавливаем трек Spotify...', spotifyMatchFailed: 'Трек Spotify найден, но воспроизводимый источник аудио не найден.', spotifyTrackLinkRequired: 'Отправьте ссылку на трек Spotify, а не на альбом/плейлист/артиста.', spotifyFetchFailed: 'Не удалось получить информацию о треке из Spotify.' } },
  ja: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Spotifyで開く', spotifySelectHint: 'この曲を選択してボイスチャットで再生します。', spotifyNowPlaying: 'Spotify から再生中', spotifyPlaybackVia: '音源の取得元', spotifyResolving: '🟢 Spotify の曲を準備中...', spotifyMatchFailed: 'Spotify の曲は見つかりましたが、再生可能な音源が見つかりませんでした。', spotifyTrackLinkRequired: 'アルバム/プレイリスト/アーティストではなく Spotify の曲リンクを送信してください。', spotifyFetchFailed: 'Spotify から曲情報を取得できませんでした。' } },
  hi: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Spotify में खोलें', spotifySelectHint: 'वॉइस चैट में चलाने के लिए यह गाना चुनें।', spotifyNowPlaying: 'Spotify से अभी चल रहा है', spotifyPlaybackVia: 'ऑडियो स्रोत', spotifyResolving: '🟢 Spotify गाना तैयार किया जा रहा है...', spotifyMatchFailed: 'Spotify गाना मिला, लेकिन चलाने योग्य ऑडियो स्रोत उपलब्ध नहीं है।', spotifyTrackLinkRequired: 'कृपया Spotify ट्रैक लिंक भेजें, एल्बम/प्लेलिस्ट/आर्टिस्ट लिंक नहीं।', spotifyFetchFailed: 'Spotify से गाने की जानकारी नहीं मिल सकी।' } },
  it: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Apri in Spotify', spotifySelectHint: 'Seleziona questo brano per avviare la riproduzione in chat vocale.', spotifyNowPlaying: 'In riproduzione da Spotify', spotifyPlaybackVia: 'Audio trovato tramite', spotifyResolving: '🟢 Preparazione brano Spotify...', spotifyMatchFailed: 'Brano Spotify trovato, ma non è disponibile una sorgente audio riproducibile.', spotifyTrackLinkRequired: 'Invia un link brano Spotify, non album/playlist/artista.', spotifyFetchFailed: 'Impossibile recuperare i dati del brano da Spotify.' } },
  es: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Abrir en Spotify', spotifySelectHint: 'Selecciona esta canción para reproducirla en el chat de voz.', spotifyNowPlaying: 'Reproduciendo desde Spotify', spotifyPlaybackVia: 'Audio encontrado mediante', spotifyResolving: '🟢 Preparando canción de Spotify...', spotifyMatchFailed: 'Se encontró la canción de Spotify, pero no hay una fuente de audio reproducible disponible.', spotifyTrackLinkRequired: 'Envía un enlace de canción de Spotify, no de álbum/lista/artista.', spotifyFetchFailed: 'No se pudo obtener la información de la canción desde Spotify.' } },
  fr: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Ouvrir dans Spotify', spotifySelectHint: 'Sélectionnez ce titre pour lancer la lecture dans le chat vocal.', spotifyNowPlaying: 'Lecture depuis Spotify', spotifyPlaybackVia: 'Audio trouvé via', spotifyResolving: '🟢 Préparation du morceau Spotify...', spotifyMatchFailed: 'Morceau Spotify trouvé, mais aucune source audio lisible n’est disponible.', spotifyTrackLinkRequired: 'Envoyez un lien de morceau Spotify, pas un lien album/playlist/artiste.', spotifyFetchFailed: 'Impossible de récupérer les informations du morceau depuis Spotify.' } },
  de: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'In Spotify öffnen', spotifySelectHint: 'Wähle diesen Song aus, um ihn im Sprachchat abzuspielen.', spotifyNowPlaying: 'Wiedergabe von Spotify', spotifyPlaybackVia: 'Audio gefunden über', spotifyResolving: '🟢 Spotify-Titel wird vorbereitet...', spotifyMatchFailed: 'Spotify-Titel gefunden, aber keine abspielbare Audioquelle verfügbar.', spotifyTrackLinkRequired: 'Bitte sende einen Spotify-Track-Link, keinen Album/Playlist/Artist-Link.', spotifyFetchFailed: 'Track-Informationen von Spotify konnten nicht geladen werden.' } },
  pt: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Abrir no Spotify', spotifySelectHint: 'Selecione esta música para iniciar a reprodução no chat de voz.', spotifyNowPlaying: 'Tocando do Spotify', spotifyPlaybackVia: 'Áudio encontrado via', spotifyResolving: '🟢 Preparando música do Spotify...', spotifyMatchFailed: 'Música do Spotify encontrada, mas a fonte de áudio reproduzível não está disponível.', spotifyTrackLinkRequired: 'Envie um link de faixa do Spotify, não de álbum/playlist/artista.', spotifyFetchFailed: 'Falha ao buscar informações da faixa no Spotify.' } },
  ar: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'فتح في Spotify', spotifySelectHint: 'اختر هذه الأغنية لبدء التشغيل في الدردشة الصوتية.', spotifyNowPlaying: 'يتم التشغيل من Spotify', spotifyPlaybackVia: 'تم العثور على الصوت عبر', spotifyResolving: '🟢 جارٍ تجهيز أغنية Spotify...', spotifyMatchFailed: 'تم العثور على أغنية Spotify، ولكن لا يتوفر مصدر صوت قابل للتشغيل.', spotifyTrackLinkRequired: 'أرسل رابط أغنية Spotify وليس رابط ألبوم/قائمة تشغيل/فنان.', spotifyFetchFailed: 'تعذر جلب معلومات الأغنية من Spotify.' } },
  tr: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Spotify’ta aç', spotifySelectHint: 'Sesli sohbette oynatmak için bu şarkıyı seç.', spotifyNowPlaying: 'Spotify’den Çalınıyor', spotifyPlaybackVia: 'Ses kaynağı', spotifyResolving: '🟢 Spotify şarkısı hazırlanıyor...', spotifyMatchFailed: 'Spotify şarkısı bulundu ancak oynatılabilir ses kaynağı bulunamadı.', spotifyTrackLinkRequired: 'Albüm/çalma listesi/sanatçı bağlantısı değil, Spotify şarkı bağlantısı gönderin.', spotifyFetchFailed: 'Spotify’den şarkı bilgisi alınamadı.' } },
  ko: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: 'Spotify에서 열기', spotifySelectHint: '음성 채팅에서 재생하려면 이 곡을 선택하세요.', spotifyNowPlaying: 'Spotify에서 재생 중', spotifyPlaybackVia: '오디오 소스', spotifyResolving: '🟢 Spotify 곡 준비 중...', spotifyMatchFailed: 'Spotify 곡을 찾았지만 재생 가능한 오디오 소스를 찾지 못했습니다.', spotifyTrackLinkRequired: '앨범/플레이리스트/아티스트 링크가 아닌 Spotify 트랙 링크를 보내주세요.', spotifyFetchFailed: 'Spotify에서 곡 정보를 가져오지 못했습니다.' } },
  zh: { playback: { spotifyDiscovery: 'Spotify Discovery', spotifyOpen: '在 Spotify 中打开', spotifySelectHint: '选择这首歌即可在语音聊天中播放。', spotifyNowPlaying: '正在通过 Spotify 播放', spotifyPlaybackVia: '音频来源', spotifyResolving: '🟢 正在准备 Spotify 歌曲...', spotifyMatchFailed: '已找到 Spotify 歌曲，但暂时没有可播放的音频来源。', spotifyTrackLinkRequired: '请发送 Spotify 单曲链接，而不是专辑/歌单/艺人链接。', spotifyFetchFailed: '无法从 Spotify 获取歌曲信息。' } },
};
for (const [code, override] of Object.entries(spotifyTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}

const settingsTranslations = {
  id: {
    buttons: { defaultService: 'Layanan Default', audioPreset: 'Preset Audio', premiumInfo: 'Info Premium' },
    settings: {
      private: { title: 'Pengaturan', description: 'Kelola preferensi bot pribadimu.' },
      group: { title: 'Pengaturan Grup', description: 'Kelola preferensi musik grup ini.' },
      labels: { user: 'Pengguna', group: 'Grup', language: 'Bahasa', defaultService: 'Layanan default', userDefaultService: 'Layanan default kamu', audioPreset: 'Preset audio', djMode: 'DJ Mode', premium: 'Premium', queueLimit: 'Batas antrean' },
      chooseMenu: 'Pilih pengaturan di bawah:',
      service: { title: 'Layanan Default', description: 'Pilih platform yang digunakan pertama saat mencari musik.', current: 'Saat ini', unsupported: 'Layanan tidak didukung.', alreadySelected: '{service} sudah dipilih.', selected: '{service} dipilih.' },
      help: { title: 'Bantuan Pengaturan', content: '• Layanan Default menentukan platform pencarian utama.\n• Bahasa mengubah bahasa tampilan bot.\n• Di grup, Preset Audio dan DJ Mode dikelola dengan command premium/admin.' },
      preset: { title: 'Preset Audio', content: 'Gunakan command berikut untuk mengubah preset audio:', current: 'Preset saat ini' },
      djMode: { title: 'DJ Mode', content: 'Saat DJ Mode aktif, kontrol sensitif (skip, stop, seek, volume, shuffle, qmove) hanya bisa dipakai admin/auth/premium user.', current: 'Status saat ini' },
      premium: {
        title: 'Info Premium',
        content: 'Gunakan /premiumfeatures dan /premiuminfo untuk mempelajari fitur premium.',
        status: 'Status: <b>{premium}</b>',
        queueLimit: 'Batas antrean: <b>{queueLimit}</b>'
      },
      groupOnly: 'Pengaturan ini hanya tersedia di grup.',
      closed: 'Ditutup.'
    }
  },
  ru: {
    buttons: { defaultService: 'Сервис по умолч.', audioPreset: 'Аудио пресет', premiumInfo: 'Инфо Premium' },
    settings: {
      private: { title: 'Настройки', description: 'Управление персональными настройками бота.' },
      group: { title: 'Настройки группы', description: 'Управление музыкальными настройками группы.' },
      labels: { user: 'Пользователь', group: 'Группа', language: 'Язык', defaultService: 'Сервис по умолчанию', userDefaultService: 'Ваш сервис по умолчанию', audioPreset: 'Аудио пресет', djMode: 'Режим DJ', premium: 'Премиум', queueLimit: 'Лимит очереди' },
      chooseMenu: 'Выберите настройку:',
      service: { title: 'Сервис по умолчанию', description: 'Выберите платформу для поиска музыки.', current: 'Текущий', unsupported: 'Сервис не поддерживается.', alreadySelected: '{service} уже выбран.', selected: '{service} выбран.' },
      help: { title: 'Помощь по настройкам', content: '• Сервис по умолчанию определяет основную поисковую платформу.\n• Язык меняет язык отображения бота.\n• В группах Аудио пресет и Режим DJ управляются командами премиум/админа.' },
      preset: { title: 'Аудио пресет', content: 'Используйте следующие команды для изменения аудио пресета:', current: 'Текущий пресет' },
      djMode: { title: 'Режим DJ', content: 'Когда режим DJ активен, чувствительные элементы управления (skip, stop, seek, volume, shuffle, qmove) доступны только админам/авторизованным/премиум пользователям.', current: 'Текущий статус' },
      premium: {
        title: 'Инфо Premium',
        content: 'Используйте /premiumfeatures и /premiuminfo для получения информации о премиум-функциях.',
        status: 'Статус: <b>{premium}</b>',
        queueLimit: 'Лимит очереди: <b>{queueLimit}</b>'
      },
      groupOnly: 'Эта настройка доступна только в группах.',
      closed: 'Закрыто.'
    }
  },
  ja: {
    buttons: { defaultService: 'デフォルトサービス', audioPreset: 'オーディオプリセット', premiumInfo: 'プレミアム情報' },
    settings: {
      private: { title: '設定', description: '個人のボット設定を管理します。' },
      group: { title: 'グループ設定', description: 'このグループの音楽設定を管理します。' },
      labels: { user: 'ユーザー', group: 'グループ', language: '言語', defaultService: 'デフォルトサービス', userDefaultService: 'あなたのデフォルトサービス', audioPreset: 'オーディオプリセット', djMode: 'DJ モード', premium: 'プレミアム', queueLimit: 'キュー上限' },
      chooseMenu: '設定を選択してください:',
      service: { title: 'デフォルトサービス', description: '音楽検索時に最初に使用するプラットフォームを選択します。', current: '現在', unsupported: 'サポートされていないサービスです。', alreadySelected: '{service} は既に選択されています。', selected: '{service} を選択しました。' },
      help: { title: '設定ヘルプ', content: '• デフォルトサービスは主要な検索プラットフォームを決定します.\n• 言語はボットの表示言語を変更します。\n• グループでは、オーディオプリセットとDJモードはプレミアム/管理者コマンドで管理されます。' },
      preset: { title: 'オーディオプリセット', content: '次のコマンドでオーディオプリセットを変更できます:', current: '現在のプリセット' },
      djMode: { title: 'DJ モード', content: 'DJ モードが有効な場合、操作（skip, stop, seek, volume, shuffle, qmove）は管理者/認証済み/プレミアムユーザーのみ使用できます。', current: '現在の状態' },
      premium: {
        title: 'プレミアム情報',
        content: '/premiumfeatures と /premiuminfo でプレミアム機能の詳細をご確認ください。',
        status: 'ステータス: <b>{premium}</b>',
        queueLimit: 'キュー上限: <b>{queueLimit}</b>'
      },
      groupOnly: 'この設定はグループでのみ利用可能です。',
      closed: '閉じました。'
    }
  },
  hi: {
    buttons: { defaultService: 'डिफ़ॉल्ट सेवा', audioPreset: 'ऑडियो प्रीसेट', premiumInfo: 'प्रीमियम जानकारी' },
    settings: {
      private: { title: 'सेटिंग्स', description: 'अपनी व्यक्तिगत बॉट प्राथमिकताएँ प्रबंधित करें।' },
      group: { title: 'ग्रुप सेटिंग्स', description: 'इस ग्रुप की संगीत प्राथमिकताएँ प्रबंधित करें।' },
      labels: { user: 'यूज़र', group: 'ग्रुप', language: 'भाषा', defaultService: 'डिफ़ॉल्ट सेवा', userDefaultService: 'आपकी डिफ़ॉल्ट सेवा', audioPreset: 'ऑडियो प्रीसेट', djMode: 'DJ मोड', premium: 'प्रीमियम', queueLimit: 'क्यू सीमा' },
      chooseMenu: 'नीचे सेटिंग चुनें:',
      service: { title: 'डिफ़ॉल्ट सेवा', description: 'संगीत खोजते समय पहले कौन सा प्लेटफ़ॉर्म इस्तेमाल हो, चुनें।', current: 'वर्तमान', unsupported: 'असमर्थित सेवा।', alreadySelected: '{service} पहले से चुना हुआ है।', selected: '{service} चुना गया।' },
      help: { title: 'सेटिंग्स सहायता', content: '• डिफ़ॉल्ट सेवा प्राथमिक खोज प्लेटफ़ॉर्म निर्धारित करती है।\n• भाषा बॉट की प्रदर्शन भाषा बदलती है।\n• ग्रुप में, ऑडियो प्रीसेट और DJ मोड premium/admin commands से प्रबंधित होते हैं।' },
      preset: { title: 'ऑडियो प्रीसेट', content: 'ऑडियो प्रीसेट बदलने के लिए ये commands इस्तेमाल करें:', current: 'वर्तमान प्रीसेट' },
      djMode: { title: 'DJ मोड', content: 'जब DJ मोड सक्रिय हो, संवेदनशील नियंत्रण (skip, stop, seek, volume, shuffle, qmove) केवल admin/auth/premium users के लिए हैं।', current: 'वर्तमान स्थिति' },
      premium: {
        title: 'प्रीमियम जानकारी',
        content: 'प्रीमियम सुविधाओं के बारे में जानने के लिए /premiumfeatures and /premiuminfo इस्तेमाल करें।',
        status: 'स्थिति: <b>{premium}</b>',
        queueLimit: 'क्यू सीमा: <b>{queueLimit}</b>'
      },
      groupOnly: 'यह सेटिंग केवल ग्रुप में उपलब्ध है।',
      closed: 'बंद।'
    }
  },
  it: {
    buttons: { defaultService: 'Servizio predefinito', audioPreset: 'Preset audio', premiumInfo: 'Info Premium' },
    settings: {
      private: { title: 'Impostazioni', description: 'Gestisci le tue preferenze personali del bot.' },
      group: { title: 'Impostazioni gruppo', description: 'Gestisci le preferenze musicali del gruppo.' },
      labels: { user: 'Utente', group: 'Gruppo', language: 'Lingua', defaultService: 'Servizio predefinito', userDefaultService: 'Il tuo servizio predefinito', audioPreset: 'Preset audio', djMode: 'Modalità DJ', premium: 'Premium', queueLimit: 'Limite coda' },
      chooseMenu: 'Scegli un\'impostazione:',
      service: { title: 'Servizio predefinito', description: 'Scegli quale piattaforma usare per la ricerca musicale.', current: 'Attuale', unsupported: 'Servizio non supportato.', alreadySelected: '{service} è già selezionato.', selected: '{service} selezionato.' },
      help: { title: 'Aiuto impostazioni', content: '• Il servizio predefinito determina la piattaforma di ricerca principale.\n• La lingua cambia la lingua del bot.\n• Nei gruppi, Preset audio e Modalità DJ sono gestiti con comandi premium/admin.' },
      preset: { title: 'Preset audio', content: 'Usa i seguenti comandi per cambiare il preset audio:', current: 'Preset attuale' },
      djMode: { title: 'Modalità DJ', content: 'Quando la Modalità DJ è attiva, i controlli sensibili (skip, stop, seek, volume, shuffle, qmove) sono riservati a admin/autorizzati/premium.', current: 'Stato attuale' },
      premium: {
        title: 'Info Premium',
        content: 'Usa /premiumfeatures e /premiuminfo per saperne di più sulle funzionalità premium.',
        status: 'Stato: <b>{premium}</b>',
        queueLimit: 'Limite coda: <b>{queueLimit}</b>'
      },
      groupOnly: 'Questa impostazione è disponibile solo nei gruppi.',
      closed: 'Chiuso.'
    }
  },
  es: {
    buttons: { defaultService: 'Servicio predeterminado', audioPreset: 'Preset de audio', premiumInfo: 'Info Premium' },
    settings: {
      private: { title: 'Configuración', description: 'Gestiona tus preferencias personales del bot.' },
      group: { title: 'Configuración del grupo', description: 'Gestiona las preferencias musicales de este grupo.' },
      labels: { user: 'Usuario', group: 'Grupo', language: 'Idioma', defaultService: 'Servicio predeterminado', userDefaultService: 'Tu servicio predeterminado', audioPreset: 'Preset de audio', djMode: 'Modo DJ', premium: 'Premium', queueLimit: 'Límite de cola' },
      chooseMenu: 'Elige una opción:',
      service: { title: 'Servicio predeterminado', description: 'Elige qué plataforma usar primero al buscar música.', current: 'Actual', unsupported: 'Servicio no soportado.', alreadySelected: '{service} ya está seleccionado.', selected: '{service} seleccionado.' },
      help: { title: 'Ayuda de configuración', content: '• El servicio predeterminado determina la plataforma de búsqueda principal.\n• El idioma cambia el idioma del bot.\n• En grupos, Preset de audio y Modo DJ se gestionan con comandos premium/admin.' },
      preset: { title: 'Preset de audio', content: 'Usa los siguientes comandos para cambiar el preset de audio:', current: 'Preset actual' },
      djMode: { title: 'Modo DJ', content: 'Cuando el Modo DJ está activo, los controles sensibles (skip, stop, seek, volume, shuffle, qmove) solo están disponibles para admin/autorizados/premium.', current: 'Estado actual' },
      premium: {
        title: 'Info Premium',
        content: 'Usa /premiumfeatures y /premiuminfo para saber más sobre las funciones premium.',
        status: 'Estado: <b>{premium}</b>',
        queueLimit: 'Límite de cola: <b>{queueLimit}</b>'
      },
      groupOnly: 'Esta configuración solo está disponible en grupos.',
      closed: 'Cerrado.'
    }
  },
  fr: {
    buttons: { defaultService: 'Service par défaut', audioPreset: 'Preset audio', premiumInfo: 'Info Premium' },
    settings: {
      private: { title: 'Paramètres', description: 'Gérez vos préférences personnelles du bot.' },
      group: { title: 'Paramètres du groupe', description: 'Gérez les préférences musicales de ce groupe.' },
      labels: { user: 'Utilisateur', group: 'Groupe', language: 'Langue', defaultService: 'Service par défaut', userDefaultService: 'Votre service par défaut', audioPreset: 'Preset audio', djMode: 'Mode DJ', premium: 'Premium', queueLimit: 'Limite de file' },
      chooseMenu: 'Choisissez un paramètre :',
      service: { title: 'Service par défaut', description: 'Choisissez la plateforme utilisée en premier pour la recherche musicale.', current: 'Actuel', unsupported: 'Service non supporté.', alreadySelected: '{service} est déjà sélectionné.', selected: '{service} sélectionné.' },
      help: { title: 'Aide des paramètres', content: '• Le service par défaut détermine la plateforme de recherche principale.\n• La langue change la langue d\'affichage du bot.\n• Dans les groupes, Preset audio et Mode DJ sont gérés par les commandes premium/admin.' },
      preset: { title: 'Preset audio', content: 'Utilisez les commandes suivantes pour changer le preset audio :', current: 'Preset actuel' },
      djMode: { title: 'Mode DJ', content: 'Quand le Mode DJ est actif, les contrôles sensibles (skip, stop, seek, volume, shuffle, qmove) sont réservés aux admin/autorisés/premium.', current: 'État actuel' },
      premium: {
        title: 'Info Premium',
        content: 'Utilisez /premiumfeatures et /premiuminfo pour en savoir plus sur les fonctionnalités premium.',
        status: 'Statut : <b>{premium}</b>',
        queueLimit: 'Limite de file : <b>{queueLimit}</b>'
      },
      groupOnly: 'Ce paramètre est uniquement disponible dans les groupes.',
      closed: 'Fermé.'
    }
  },
  de: {
    buttons: { defaultService: 'Standarddienst', audioPreset: 'Audio-Preset', premiumInfo: 'Premium-Info' },
    settings: {
      private: { title: 'Einstellungen', description: 'Verwalte deine persönlichen Bot-Einstellungen.' },
      group: { title: 'Gruppeneinstellungen', description: 'Verwalte die Musikeinstellungen dieser Gruppe.' },
      labels: { user: 'Benutzer', group: 'Gruppe', language: 'Sprache', defaultService: 'Standarddienst', userDefaultService: 'Dein Standarddienst', audioPreset: 'Audio-Preset', djMode: 'DJ-Modus', premium: 'Premium', queueLimit: 'Warteschlangenlimit' },
      chooseMenu: 'Wähle eine Einstellung:',
      service: { title: 'Standarddienst', description: 'Wähle die Plattform, die zuerst für die Musiksuche verwendet wird.', current: 'Aktuell', unsupported: 'Nicht unterstützter Dienst.', alreadySelected: '{service} ist bereits ausgewählt.', selected: '{service} ausgewählt.' },
      help: { title: 'Einstellungshilfe', content: '• Der Standarddienst bestimmt die primäre Suchplattform.\n• Die Sprache ändert die Anzeigesprache des Bots.\n• In Gruppen werden Audio-Preset und DJ-Modus mit Premium/Admin-Befehlen verwaltet.' },
      preset: { title: 'Audio-Preset', content: 'Verwende folgende Befehle, um das Audio-Preset zu ändern:', current: 'Aktuelles Preset' },
      djMode: { title: 'DJ-Modus', content: 'Wenn der DJ-Modus aktiv ist, sind sensible Steuerungen (skip, stop, seek, volume, shuffle, qmove) nur für Admin/Autorisierte/Premium-Benutzer verfügbar.', current: 'Aktueller Status' },
      premium: {
        title: 'Premium-Info',
        content: 'Verwende /premiumfeatures und /premiuminfo, um mehr über Premium-Funktionen zu erfahren.',
        status: 'Status: <b>{premium}</b>',
        queueLimit: 'Warteschlangenlimit: <b>{queueLimit}</b>'
      },
      groupOnly: 'Diese Einstellung ist nur in Gruppen verfügbar.',
      closed: 'Geschlossen.'
    }
  },
  pt: {
    buttons: { defaultService: 'Serviço padrão', audioPreset: 'Preset de áudio', premiumInfo: 'Info Premium' },
    settings: {
      private: { title: 'Configurações', description: 'Gerencie suas preferências pessoais do bot.' },
      group: { title: 'Configurações do grupo', description: 'Gerencie as preferências musicais deste grupo.' },
      labels: { user: 'Usuário', group: 'Grupo', language: 'Idioma', defaultService: 'Serviço padrão', userDefaultService: 'Seu serviço padrão', audioPreset: 'Preset de áudio', djMode: 'Modo DJ', premium: 'Premium', queueLimit: 'Limite da fila' },
      chooseMenu: 'Escolha uma configuração:',
      service: { title: 'Serviço padrão', description: 'Escolha qual plataforma usar primeiro ao pesquisar música.', current: 'Atual', unsupported: 'Serviço não suportado.', alreadySelected: '{service} já está selecionado.', selected: '{service} selecionado.' },
      help: { title: 'Ajuda das configurações', content: '• O serviço padrão determina a plataforma de pesquisa principal.\n• O idioma altera o idioma de exibição do bot.\n• Em grupos, Preset de áudio e Modo DJ são gerenciados com comandos premium/admin.' },
      preset: { title: 'Preset de áudio', content: 'Use os seguintes comandos para alterar o preset de áudio:', current: 'Preset atual' },
      djMode: { title: 'Modo DJ', content: 'Quando o Modo DJ está ativo, controles sensíveis (skip, stop, seek, volume, shuffle, qmove) são restritos a admin/autorizados/premium.', current: 'Status atual' },
      premium: {
        title: 'Info Premium',
        content: 'Use /premiumfeatures e /premiuminfo para saber mais sobre os recursos premium.',
        status: 'Status: <b>{premium}</b>',
        queueLimit: 'Limite da fila: <b>{queueLimit}</b>'
      },
      groupOnly: 'Esta configuração está disponível apenas em grupos.',
      closed: 'Fechado.'
    }
  },
  ar: {
    buttons: { defaultService: 'الخدمة الافتراضية', audioPreset: 'إعداد الصوت', premiumInfo: 'معلومات Premium' },
    settings: {
      private: { title: 'الإعدادات', description: 'إدارة تفضيلاتك الشخصية للبوت.' },
      group: { title: 'إعدادات المجموعة', description: 'إدارة تفضيلات الموسيقى لهذه المجموعة.' },
      labels: { user: 'المستخدم', group: 'المجموعة', language: 'اللغة', defaultService: 'الخدمة الافتراضية', userDefaultService: 'الخدمة الافتراضية الخاصة بك', audioPreset: 'إعداد الصوت', djMode: 'وضع DJ', premium: 'بريميوم', queueLimit: 'حد قائمة الانتظار' },
      chooseMenu: 'اختر إعدادًا:',
      service: { title: 'الخدمة الافتراضية', description: 'اختر المنصة المستخدمة أولاً عند البحث عن الموسيقى.', current: 'الحالي', unsupported: 'خدمة غير مدعومة.', alreadySelected: '{service} محدد بالفعل.', selected: 'تم تحديد {service}.' },
      help: { title: 'مساعدة الإعدادات', content: '• تحدد الخدمة الافتراضية منصة البحث الرئيسية.\n• تغير اللغة لغة عرض البوت.\n• في المجموعات، يتم إدارة إعداد الصوت ووضع DJ بأوامر premium/admin.' },
      preset: { title: 'إعداد الصوت', content: 'استخدم الأوامر التالية لتغيير إعداد الصوت:', current: 'الإعداد الحالي' },
      djMode: { title: 'وضع DJ', content: 'عندما يكون وضع DJ مفعلاً، تقتصر أدوات التحكم الحساسة (skip, stop, seek, volume, shuffle, qmove) على admin/المصرح لهم/premium.', current: 'الحالة الحالية' },
      premium: {
        title: 'معلومات Premium',
        content: 'استخدم /premiumfeatures و /premiuminfo لمعرفة المزيد عن ميزات Premium.',
        status: 'الحالة: <b>{premium}</b>',
        queueLimit: 'حد قائمة الانتظار: <b>{queueLimit}</b>'
      },
      groupOnly: 'هذا الإعداد متاح فقط في المجموعات.',
      closed: 'تم الإغلاق.'
    }
  },
  tr: {
    buttons: { defaultService: 'Varsayılan Servis', audioPreset: 'Ses Ön Ayarı', premiumInfo: 'Premium Bilgi' },
    settings: {
      private: { title: 'Ayarlar', description: 'Kişisel bot tercihlerini yönet.' },
      group: { title: 'Grup Ayarları', description: 'Bu grubun müzik tercihlerini yönet.' },
      labels: { user: 'Kullanıcı', group: 'Grup', language: 'Dil', defaultService: 'Varsayılan servis', userDefaultService: 'Varsayılan servisiniz', audioPreset: 'Ses ön ayarı', djMode: 'DJ Modu', premium: 'Premium', queueLimit: 'Kuyruk limiti' },
      chooseMenu: 'Bir ayar seç:',
      service: { title: 'Varsayılan Servis', description: 'Müzik ararken ilk kullanılacak platformu seç.', current: 'Mevcut', unsupported: 'Desteklenmeyen servis.', alreadySelected: '{service} zaten seçili.', selected: '{service} seçildi.' },
      help: { title: 'Ayar Yardımı', content: '• Varsayılan Servis birincil arama platformunu belirler.\n• Dil, botun görüntüleme dilini değiştirir.\n• Gruplarda, Ses Ön Ayarı ve DJ Modu premium/admin komutlarıyla yönetilir.' },
      preset: { title: 'Ses Ön Ayarı', content: 'Ses ön ayarını değiştirmek için şu komutları kullan:', current: 'Mevcut ön ayar' },
      djMode: { title: 'DJ Modu', content: 'DJ Modu aktifken, hassas kontroller (skip, stop, seek, volume, shuffle, qmove) yalnızca admin/yetkili/premium kullanıcılara açıktır.', current: 'Mevcut durum' },
      premium: {
        title: 'Premium Bilgi',
        content: 'Premium özellikler hakkında bilgi almak için /premiumfeatures ve /premiuminfo kullan.',
        status: 'Durum: <b>{premium}</b>',
        queueLimit: 'Kuyruk limiti: <b>{queueLimit}</b>'
      },
      groupOnly: 'Bu ayar yalnızca gruplarda kullanılabilir.',
      closed: 'Kapatıldı.'
    }
  },
  ko: {
    buttons: { defaultService: '기본 서비스', audioPreset: '오디오 프리셋', premiumInfo: '프리미엄 정보' },
    settings: {
      private: { title: '설정', description: '개인 봇 환경설정을 관리합니다.' },
      group: { title: '그룹 설정', description: '이 그룹의 음악 환경설정을 관리합니다.' },
      labels: { user: '사용자', group: '그룹', language: '언어', defaultService: '기본 서비스', userDefaultService: '귀하의 기본 서비스', audioPreset: '오디오 프리셋', djMode: 'DJ 모드', premium: '프리미엄', queueLimit: '대기열 제한' },
      chooseMenu: '설정을 선택하세요:',
      service: { title: '기본 서비스', description: '음악 검색 시 먼저 사용할 플랫폼을 선택하세요.', current: '현재', unsupported: '지원되지 않는 서비스입니다.', alreadySelected: '{service}은(는) 이미 선택되었습니다.', selected: '{service} 선택됨.' },
      help: { title: '설정 도움말', content: '• 기본 서비스는 주 검색 플랫폼을 결정합니다.\n• 언어는 봇 표시 언어를 변경합니다.\n• 그룹에서는 오디오 프리셋과 DJ 모드가 프리미엄/관리자 명령으로 관리됩니다.' },
      preset: { title: '오디오 프리셋', content: '다음 명령으로 오디오 프리셋을 변경할 수 있습니다:', current: '현재 프리셋' },
      djMode: { title: 'DJ 모드', content: 'DJ 모드가 활성화되면 민감한 제어(skip, stop, seek, volume, shuffle, qmove)는 관리자/인증/프리미엄 사용자만 사용할 수 있습니다.', current: '현재 상태' },
      premium: {
        title: '프리미엄 정보',
        content: '프리미엄 기능에 대해 자세히 알아보려면 /premiumfeatures 및 /premiuminfo를 사용하세요.',
        status: '상태: <b>{premium}</b>',
        queueLimit: '대기열 제한: <b>{queueLimit}</b>'
      },
      groupOnly: '이 설정은 그룹에서만 사용할 수 있습니다.',
      closed: '닫힘.'
    }
  },
  zh: {
    buttons: { defaultService: '默认服务', audioPreset: '音频预设', premiumInfo: '高级版信息' },
    settings: {
      private: { title: '设置', description: '管理你的个人机器人偏好设置。' },
      group: { title: '群组设置', description: '管理此群组的音乐偏好设置。' },
      labels: { user: '用户', group: '群组', language: '语言', defaultService: '默认服务', userDefaultService: '你的默认服务', audioPreset: '音频预设', djMode: 'DJ 模式', premium: '高级版', queueLimit: '队列上限' },
      chooseMenu: '请选择设置项：',
      service: { title: '默认服务', description: '选择搜索音乐时优先使用的平台。', current: '当前', unsupported: '不支持的服务。', alreadySelected: '{service} 已被选中。', selected: '已选择 {service}。' },
      help: { title: '设置帮助', content: '• 默认服务决定主要搜索平台.\n• 语言更改机器人显示语言。\n• 在群组中，音频预设和 DJ 模式通过高级版/管理员命令管理。' },
      preset: { title: '音频预设', content: '使用以下命令更改音频预设：', current: '当前预设' },
      djMode: { title: 'DJ 模式', content: 'DJ 模式启用时，敏感控制（skip、stop、seek、volume、shuffle、qmove）仅限管理员/授权/高级版用户使用。', current: '当前状态' },
      premium: {
        title: '高级版信息',
        content: '使用 /premiumfeatures 和 /premiuminfo 了解更多高级版功能。',
        status: '状态: <b>{premium}</b>',
        queueLimit: '队列上限: <b>{queueLimit}</b>'
      },
      groupOnly: '此设置仅在群组中可用。',
      closed: '已关闭。'
    }
  }
};
for (const [code, override] of Object.entries(settingsTranslations)) {
  translations[code] = mergeDeep(translations[code], override);
}
