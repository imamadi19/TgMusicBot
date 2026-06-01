import { readFileSync, writeFileSync } from 'fs';

const filePath = './src/i18n/messages.js';
let content = readFileSync(filePath, 'utf8');

// ==========================================
// PART 1: English translations
// ==========================================

// 1a. Add new button keys to English buttons (line 5)
// Find: djMode: 'DJ Mode'\n    },
// Replace with: djMode: 'DJ Mode',\n      defaultService: 'Default Service', audioPreset: 'Audio Preset', premiumInfo: 'Premium Info'\n    },
content = content.replace(
  "      setupGuide: 'Setup Guide', musicFeatures: 'Music Features', myPlaylists: 'My Playlists', premium: 'Premium', playMusic: 'Play Music', playVideo: 'Play Video', queue: 'Queue', groupSettings: 'Group Settings', djMode: 'DJ Mode'\n    },",
  "      setupGuide: 'Setup Guide', musicFeatures: 'Music Features', myPlaylists: 'My Playlists', premium: 'Premium', playMusic: 'Play Music', playVideo: 'Play Video', queue: 'Queue', groupSettings: 'Group Settings', djMode: 'DJ Mode',\n      defaultService: 'Default Service', audioPreset: 'Audio Preset', premiumInfo: 'Premium Info'\n    },"
);

// 1b. Add top-level settings key to English translations after admin
// Find the admin line followed by the closing of en
content = content.replace(
  "    admin: { groupOnly: 'This command can only be used in groups.', reloadWait: 'Please wait {time} before using this command again.', reloadStarted: 'Reloading administrator cache...', reloadSuccess: 'Administrator cache reloaded successfully. Cached {count} admin(s).', reloadFailed: 'Failed to reload administrator cache: {error}' },\n  },",
  `    admin: { groupOnly: 'This command can only be used in groups.', reloadWait: 'Please wait {time} before using this command again.', reloadStarted: 'Reloading administrator cache...', reloadSuccess: 'Administrator cache reloaded successfully. Cached {count} admin(s).', reloadFailed: 'Failed to reload administrator cache: {error}' },
    settings: {
      private: { title: 'Settings', description: 'Manage your bot preferences.' },
      group: { title: 'Group Settings', description: 'View and manage group bot settings.' },
      labels: { user: 'User', group: 'Group', language: 'Language', defaultService: 'Default Service', audioPreset: 'Audio Preset', djMode: 'DJ Mode', premium: 'Premium', queueLimit: 'Queue Limit' },
      chooseMenu: 'Choose a setting below:',
      service: { title: 'Default Service', description: 'Choose the default platform for music search.', current: 'Current service', unsupported: 'Unsupported service.', alreadySelected: '{service} is already the default service.', selected: '{service} selected.' },
      help: { title: 'Settings Help', content: '• <b>Default Service</b> sets the primary search platform.\\n• <b>Language</b> changes the bot display language.\\n• In groups, <b>Audio Preset</b> and <b>DJ Mode</b> are managed with premium commands.' },
      preset: { title: 'Audio Preset', content: 'Use the following commands to change audio preset:', current: 'Current preset' },
      djMode: { title: 'DJ Mode', content: 'Use the following commands to toggle DJ Mode:', current: 'Current status' },
      premium: { title: 'Premium Info', content: 'Use <code>/premiumfeatures</code> to see all premium features.' },
      closed: 'Settings closed.',
      groupOnly: 'This setting is only available in groups.',
      privateOnly: 'This setting is for private chat.'
    },
  },`
);

// ==========================================
// PART 2: Language aliases - buttons + settings
// ==========================================

// Helper: for each language, we need to:
// 1. Add 3 button keys after djMode in their buttons block
// 2. Add settings block before the closing `  },` of the language

const langData = {
  id: {
    // buttons djMode line
    buttonFind: "      djMode: 'DJ Mode'\n    },\n    language: {",
    buttonReplace: "      djMode: 'DJ Mode',\n      defaultService: 'Layanan Default', audioPreset: 'Audio Preset', premiumInfo: 'Info Premium'\n    },\n    language: {",
    // settings: add before the closing `  },` of id block (before `  ru: {`)
    // The id block ends with: `    callbacks: { ... }\n  },`
    closingFind: "    callbacks: { requesterOnly: 'Hanya pengguna yang request lagu ini yang bisa memakai tombol ini.' }\n  },\n  ru: {",
    closingReplace: `    callbacks: { requesterOnly: 'Hanya pengguna yang request lagu ini yang bisa memakai tombol ini.' },
    settings: {
      private: { title: 'Pengaturan', description: 'Kelola preferensi bot kamu.' },
      group: { title: 'Pengaturan Grup', description: 'Lihat dan kelola pengaturan bot di grup.' },
      labels: { user: 'Pengguna', group: 'Grup', language: 'Bahasa', defaultService: 'Layanan Default', audioPreset: 'Audio Preset', djMode: 'DJ Mode', premium: 'Premium', queueLimit: 'Batas Antrean' },
      chooseMenu: 'Pilih pengaturan di bawah:',
      service: { title: 'Layanan Default', description: 'Pilih platform default untuk pencarian musik.', current: 'Layanan saat ini', unsupported: 'Layanan tidak didukung.', alreadySelected: '{service} sudah menjadi layanan default.', selected: '{service} dipilih.' },
      help: { title: 'Bantuan Pengaturan', content: '• <b>Layanan Default</b> mengatur platform pencarian utama.\\n• <b>Bahasa</b> mengubah bahasa tampilan bot.\\n• Di grup, <b>Audio Preset</b> dan <b>DJ Mode</b> dikelola dengan command premium.' },
      preset: { title: 'Audio Preset', content: 'Gunakan command berikut untuk mengubah audio preset:', current: 'Preset saat ini' },
      djMode: { title: 'DJ Mode', content: 'Gunakan command berikut untuk mengatur DJ Mode:', current: 'Status saat ini' },
      premium: { title: 'Info Premium', content: 'Gunakan <code>/premiumfeatures</code> untuk melihat fitur premium.' },
      closed: 'Pengaturan ditutup.',
      groupOnly: 'Pengaturan ini hanya tersedia di grup.',
      privateOnly: 'Pengaturan ini untuk chat pribadi.'
    }
  },
  ru: {`
  },
  ru: {
    buttonFind: "      djMode: 'Режим DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'Режим DJ',\n      defaultService: 'Сервис по умолчанию', audioPreset: 'Аудио пресет', premiumInfo: 'Инфо Премиум'\n    },\n    language:",
    closingFind: "      close: 'Закрыть'\n    }\n  },\n  ja: {",
    closingReplace: `      close: 'Закрыть'
    },
    settings: {
      private: { title: 'Настройки', description: 'Управление настройками бота.' },
      group: { title: 'Настройки группы', description: 'Просмотр и управление настройками бота в группе.' },
      labels: { user: 'Пользователь', group: 'Группа', language: 'Язык', defaultService: 'Сервис по умолчанию', audioPreset: 'Аудио пресет', djMode: 'Режим DJ', premium: 'Премиум', queueLimit: 'Лимит очереди' },
      chooseMenu: 'Выберите настройку:',
      service: { title: 'Сервис по умолчанию', description: 'Выберите платформу для поиска музыки.', current: 'Текущий сервис', unsupported: 'Сервис не поддерживается.', alreadySelected: '{service} уже является сервисом по умолчанию.', selected: '{service} выбран.' },
      help: { title: 'Помощь по настройкам', content: '• <b>Сервис по умолчанию</b> задаёт основную платформу поиска.\\n• <b>Язык</b> изменяет язык отображения бота.\\n• В группах <b>Аудио пресет</b> и <b>Режим DJ</b> управляются премиум командами.' },
      preset: { title: 'Аудио пресет', content: 'Используйте команды для изменения аудио пресета:', current: 'Текущий пресет' },
      djMode: { title: 'Режим DJ', content: 'Используйте команды для управления режимом DJ:', current: 'Текущий статус' },
      premium: { title: 'Информация о Премиум', content: 'Используйте <code>/premiumfeatures</code> для просмотра функций премиум.' },
      closed: 'Настройки закрыты.',
      groupOnly: 'Эта настройка доступна только в группах.',
      privateOnly: 'Эта настройка только для личного чата.'
    }
  },
  ja: {`
  },
  ja: {
    buttonFind: "      djMode: 'DJモード'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJモード',\n      defaultService: 'デフォルトサービス', audioPreset: 'オーディオプリセット', premiumInfo: 'プレミアム情報'\n    },\n    language:",
    closingFind: "      close: '閉じる'\n    }\n  },\n  hi: {",
    closingReplace: `      close: '閉じる'
    },
    settings: {
      private: { title: '設定', description: 'ボットの設定を管理します。' },
      group: { title: 'グループ設定', description: 'グループのボット設定を表示・管理します。' },
      labels: { user: 'ユーザー', group: 'グループ', language: '言語', defaultService: 'デフォルトサービス', audioPreset: 'オーディオプリセット', djMode: 'DJ モード', premium: 'プレミアム', queueLimit: 'キュー制限' },
      chooseMenu: '設定を選択してください：',
      service: { title: 'デフォルトサービス', description: '音楽検索のデフォルトプラットフォームを選択します。', current: '現在のサービス', unsupported: 'サポートされていないサービスです。', alreadySelected: '{service} は既にデフォルトサービスです。', selected: '{service} が選択されました。' },
      help: { title: '設定ヘルプ', content: '• <b>デフォルトサービス</b>は主要な検索プラットフォームを設定します。\\n• <b>言語</b>はボットの表示言語を変更します。\\n• グループでは<b>オーディオプリセット</b>と<b>DJ モード</b>はプレミアムコマンドで管理します。' },
      preset: { title: 'オーディオプリセット', content: 'オーディオプリセットを変更するには以下のコマンドを使用してください：', current: '現在のプリセット' },
      djMode: { title: 'DJ モード', content: 'DJ モードを切り替えるには以下のコマンドを使用してください：', current: '現在の状態' },
      premium: { title: 'プレミアム情報', content: '<code>/premiumfeatures</code> でプレミアム機能を確認できます。' },
      closed: '設定を閉じました。',
      groupOnly: 'この設定はグループでのみ利用できます。',
      privateOnly: 'この設定はプライベートチャット用です。'
    }
  },
  hi: {`
  },
  hi: {
    buttonFind: "      djMode: 'DJ मोड'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJ मोड',\n      defaultService: 'डिफ़ॉल्ट सेवा', audioPreset: 'ऑडियो प्रीसेट', premiumInfo: 'प्रीमियम जानकारी'\n    },\n    language:",
    closingFind: "      close: 'बंद करें'\n    }\n  },\n  it: {",
    closingReplace: `      close: 'बंद करें'
    },
    settings: {
      private: { title: 'सेटिंग्स', description: 'अपनी बॉट प्राथमिकताएं प्रबंधित करें।' },
      group: { title: 'ग्रुप सेटिंग्स', description: 'ग्रुप बॉट सेटिंग्स देखें और प्रबंधित करें।' },
      labels: { user: 'उपयोगकर्ता', group: 'ग्रुप', language: 'भाषा', defaultService: 'डिफ़ॉल्ट सेवा', audioPreset: 'ऑडियो प्रीसेट', djMode: 'DJ मोड', premium: 'प्रीमियम', queueLimit: 'कतार सीमा' },
      chooseMenu: 'नीचे एक सेटिंग चुनें:',
      service: { title: 'डिफ़ॉल्ट सेवा', description: 'संगीत खोज के लिए डिफ़ॉल्ट प्लेटफ़ॉर्म चुनें।', current: 'वर्तमान सेवा', unsupported: 'असमर्थित सेवा।', alreadySelected: '{service} पहले से डिफ़ॉल्ट सेवा है।', selected: '{service} चुना गया।' },
      help: { title: 'सेटिंग्स सहायता', content: '• <b>डिफ़ॉल्ट सेवा</b> प्राथमिक खोज प्लेटफ़ॉर्म सेट करता है।\\n• <b>भाषा</b> बॉट की प्रदर्शन भाषा बदलता है।\\n• ग्रुप में <b>ऑडियो प्रीसेट</b> और <b>DJ मोड</b> प्रीमियम कमांड से प्रबंधित होते हैं।' },
      preset: { title: 'ऑडियो प्रीसेट', content: 'ऑडियो प्रीसेट बदलने के लिए निम्न कमांड का उपयोग करें:', current: 'वर्तमान प्रीसेट' },
      djMode: { title: 'DJ मोड', content: 'DJ मोड को टॉगल करने के लिए निम्न कमांड का उपयोग करें:', current: 'वर्तमान स्थिति' },
      premium: { title: 'प्रीमियम जानकारी', content: 'प्रीमियम सुविधाएं देखने के लिए <code>/premiumfeatures</code> का उपयोग करें।' },
      closed: 'सेटिंग्स बंद।',
      groupOnly: 'यह सेटिंग केवल ग्रुप में उपलब्ध है।',
      privateOnly: 'यह सेटिंग निजी चैट के लिए है।'
    }
  },
  it: {`
  },
  it: {
    buttonFind: "      djMode: 'Modalità DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'Modalità DJ',\n      defaultService: 'Servizio Predefinito', audioPreset: 'Preset Audio', premiumInfo: 'Info Premium'\n    },\n    language:",
    closingFind: "      close: 'Chiudi'\n    }\n  },\n  es: {",
    closingReplace: `      close: 'Chiudi'
    },
    settings: {
      private: { title: 'Impostazioni', description: 'Gestisci le preferenze del bot.' },
      group: { title: 'Impostazioni Gruppo', description: 'Visualizza e gestisci le impostazioni del bot nel gruppo.' },
      labels: { user: 'Utente', group: 'Gruppo', language: 'Lingua', defaultService: 'Servizio Predefinito', audioPreset: 'Preset Audio', djMode: 'Modalità DJ', premium: 'Premium', queueLimit: 'Limite Coda' },
      chooseMenu: "Scegli un'impostazione:",
      service: { title: 'Servizio Predefinito', description: 'Scegli la piattaforma predefinita per la ricerca musicale.', current: 'Servizio attuale', unsupported: 'Servizio non supportato.', alreadySelected: '{service} è già il servizio predefinito.', selected: '{service} selezionato.' },
      help: { title: 'Aiuto Impostazioni', content: '• <b>Servizio Predefinito</b> imposta la piattaforma di ricerca principale.\\n• <b>Lingua</b> cambia la lingua di visualizzazione del bot.\\n• Nei gruppi, <b>Preset Audio</b> e <b>Modalità DJ</b> sono gestiti con comandi premium.' },
      preset: { title: 'Preset Audio', content: 'Usa i seguenti comandi per cambiare il preset audio:', current: 'Preset attuale' },
      djMode: { title: 'Modalità DJ', content: 'Usa i seguenti comandi per attivare/disattivare la Modalità DJ:', current: 'Stato attuale' },
      premium: { title: 'Info Premium', content: 'Usa <code>/premiumfeatures</code> per visualizzare le funzionalità premium.' },
      closed: 'Impostazioni chiuse.',
      groupOnly: 'Questa impostazione è disponibile solo nei gruppi.',
      privateOnly: 'Questa impostazione è per la chat privata.'
    }
  },
  es: {`
  },
  es: {
    buttonFind: "      djMode: 'Modo DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'Modo DJ',\n      defaultService: 'Servicio Predeterminado', audioPreset: 'Preset de Audio', premiumInfo: 'Info Premium'\n    },\n    language:",
    closingFind: "      close: 'Cerrar'\n    }\n  },\n  fr: {",
    closingReplace: `      close: 'Cerrar'
    },
    settings: {
      private: { title: 'Ajustes', description: 'Administra las preferencias del bot.' },
      group: { title: 'Ajustes del Grupo', description: 'Ver y administrar los ajustes del bot en el grupo.' },
      labels: { user: 'Usuario', group: 'Grupo', language: 'Idioma', defaultService: 'Servicio Predeterminado', audioPreset: 'Preset de Audio', djMode: 'Modo DJ', premium: 'Premium', queueLimit: 'Límite de Cola' },
      chooseMenu: 'Elige un ajuste:',
      service: { title: 'Servicio Predeterminado', description: 'Elige la plataforma predeterminada para buscar música.', current: 'Servicio actual', unsupported: 'Servicio no compatible.', alreadySelected: '{service} ya es el servicio predeterminado.', selected: '{service} seleccionado.' },
      help: { title: 'Ayuda de Ajustes', content: '• <b>Servicio Predeterminado</b> establece la plataforma principal de búsqueda.\\n• <b>Idioma</b> cambia el idioma de visualización del bot.\\n• En grupos, <b>Preset de Audio</b> y <b>Modo DJ</b> se gestionan con comandos premium.' },
      preset: { title: 'Preset de Audio', content: 'Usa los siguientes comandos para cambiar el preset de audio:', current: 'Preset actual' },
      djMode: { title: 'Modo DJ', content: 'Usa los siguientes comandos para activar/desactivar el Modo DJ:', current: 'Estado actual' },
      premium: { title: 'Info Premium', content: 'Usa <code>/premiumfeatures</code> para ver las funciones premium.' },
      closed: 'Ajustes cerrados.',
      groupOnly: 'Este ajuste solo está disponible en grupos.',
      privateOnly: 'Este ajuste es para chat privado.'
    }
  },
  fr: {`
  },
  fr: {
    buttonFind: "      djMode: 'Mode DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'Mode DJ',\n      defaultService: 'Service par défaut', audioPreset: 'Preset Audio', premiumInfo: 'Info Premium'\n    },\n    language:",
    closingFind: "      close: 'Fermer'\n    }\n  },\n  de: {",
    closingReplace: `      close: 'Fermer'
    },
    settings: {
      private: { title: 'Paramètres', description: 'Gérez vos préférences du bot.' },
      group: { title: 'Paramètres du Groupe', description: 'Afficher et gérer les paramètres du bot dans le groupe.' },
      labels: { user: 'Utilisateur', group: 'Groupe', language: 'Langue', defaultService: 'Service par défaut', audioPreset: 'Preset Audio', djMode: 'Mode DJ', premium: 'Premium', queueLimit: "Limite de file d'attente" },
      chooseMenu: 'Choisissez un paramètre :',
      service: { title: 'Service par défaut', description: 'Choisissez la plateforme par défaut pour la recherche musicale.', current: 'Service actuel', unsupported: 'Service non pris en charge.', alreadySelected: '{service} est déjà le service par défaut.', selected: '{service} sélectionné.' },
      help: { title: 'Aide Paramètres', content: "• <b>Service par défaut</b> définit la plateforme de recherche principale.\\n• <b>Langue</b> change la langue d'affichage du bot.\\n• Dans les groupes, <b>Preset Audio</b> et <b>Mode DJ</b> sont gérés avec les commandes premium." },
      preset: { title: 'Preset Audio', content: "Utilisez les commandes suivantes pour changer le preset audio :", current: 'Preset actuel' },
      djMode: { title: 'Mode DJ', content: 'Utilisez les commandes suivantes pour activer/désactiver le Mode DJ :', current: 'Statut actuel' },
      premium: { title: 'Info Premium', content: 'Utilisez <code>/premiumfeatures</code> pour voir les fonctionnalités premium.' },
      closed: 'Paramètres fermés.',
      groupOnly: "Ce paramètre n'est disponible que dans les groupes.",
      privateOnly: 'Ce paramètre est pour le chat privé.'
    }
  },
  de: {`
  },
  de: {
    buttonFind: "      djMode: 'DJ-Modus'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJ-Modus',\n      defaultService: 'Standarddienst', audioPreset: 'Audio-Preset', premiumInfo: 'Premium-Info'\n    },\n    language:",
    closingFind: "      close: 'Schließen'\n    }\n  },\n  pt: {",
    closingReplace: `      close: 'Schließen'
    },
    settings: {
      private: { title: 'Einstellungen', description: 'Verwalte deine Bot-Einstellungen.' },
      group: { title: 'Gruppeneinstellungen', description: 'Bot-Einstellungen der Gruppe anzeigen und verwalten.' },
      labels: { user: 'Nutzer', group: 'Gruppe', language: 'Sprache', defaultService: 'Standarddienst', audioPreset: 'Audio-Preset', djMode: 'DJ-Modus', premium: 'Premium', queueLimit: 'Warteschlangenlimit' },
      chooseMenu: 'Wähle eine Einstellung:',
      service: { title: 'Standarddienst', description: 'Wähle die Standardplattform für die Musiksuche.', current: 'Aktueller Dienst', unsupported: 'Nicht unterstützter Dienst.', alreadySelected: '{service} ist bereits der Standarddienst.', selected: '{service} ausgewählt.' },
      help: { title: 'Einstellungshilfe', content: '• <b>Standarddienst</b> legt die Hauptsuchplattform fest.\\n• <b>Sprache</b> ändert die Anzeigesprache des Bots.\\n• In Gruppen werden <b>Audio-Preset</b> und <b>DJ-Modus</b> mit Premium-Befehlen verwaltet.' },
      preset: { title: 'Audio-Preset', content: 'Verwende die folgenden Befehle, um das Audio-Preset zu ändern:', current: 'Aktuelles Preset' },
      djMode: { title: 'DJ-Modus', content: 'Verwende die folgenden Befehle, um den DJ-Modus umzuschalten:', current: 'Aktueller Status' },
      premium: { title: 'Premium-Info', content: 'Verwende <code>/premiumfeatures</code> um die Premium-Funktionen anzuzeigen.' },
      closed: 'Einstellungen geschlossen.',
      groupOnly: 'Diese Einstellung ist nur in Gruppen verfügbar.',
      privateOnly: 'Diese Einstellung ist für den privaten Chat.'
    }
  },
  pt: {`
  },
  pt: {
    buttonFind: "      djMode: 'Modo DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'Modo DJ',\n      defaultService: 'Serviço Padrão', audioPreset: 'Preset de Áudio', premiumInfo: 'Info Premium'\n    },\n    language:",
    closingFind: "      close: 'Fechar'\n    }\n  },\n  ar: {",
    closingReplace: `      close: 'Fechar'
    },
    settings: {
      private: { title: 'Configurações', description: 'Gerencie suas preferências do bot.' },
      group: { title: 'Configurações do Grupo', description: 'Visualize e gerencie as configurações do bot no grupo.' },
      labels: { user: 'Usuário', group: 'Grupo', language: 'Idioma', defaultService: 'Serviço Padrão', audioPreset: 'Preset de Áudio', djMode: 'Modo DJ', premium: 'Premium', queueLimit: 'Limite da Fila' },
      chooseMenu: 'Escolha uma configuração:',
      service: { title: 'Serviço Padrão', description: 'Escolha a plataforma padrão para busca de músicas.', current: 'Serviço atual', unsupported: 'Serviço não suportado.', alreadySelected: '{service} já é o serviço padrão.', selected: '{service} selecionado.' },
      help: { title: 'Ajuda de Configurações', content: '• <b>Serviço Padrão</b> define a plataforma principal de busca.\\n• <b>Idioma</b> altera o idioma de exibição do bot.\\n• Em grupos, <b>Preset de Áudio</b> e <b>Modo DJ</b> são gerenciados com comandos premium.' },
      preset: { title: 'Preset de Áudio', content: 'Use os seguintes comandos para alterar o preset de áudio:', current: 'Preset atual' },
      djMode: { title: 'Modo DJ', content: 'Use os seguintes comandos para ativar/desativar o Modo DJ:', current: 'Status atual' },
      premium: { title: 'Info Premium', content: 'Use <code>/premiumfeatures</code> para ver os recursos premium.' },
      closed: 'Configurações fechadas.',
      groupOnly: 'Esta configuração só está disponível em grupos.',
      privateOnly: 'Esta configuração é para chat privado.'
    }
  },
  ar: {`
  },
  ar: {
    buttonFind: "      djMode: 'وضع الـ DJ'\n    },\n    language:",
    buttonReplace: "      djMode: 'وضع الـ DJ',\n      defaultService: 'الخدمة الافتراضية', audioPreset: 'إعداد الصوت', premiumInfo: 'معلومات بريميوم'\n    },\n    language:",
    closingFind: "      close: 'إغلاق'\n    }\n  },\n  tr: {",
    closingReplace: `      close: 'إغلاق'
    },
    settings: {
      private: { title: 'الإعدادات', description: 'إدارة تفضيلات البوت.' },
      group: { title: 'إعدادات المجموعة', description: 'عرض وإدارة إعدادات البوت في المجموعة.' },
      labels: { user: 'المستخدم', group: 'المجموعة', language: 'اللغة', defaultService: 'الخدمة الافتراضية', audioPreset: 'إعداد الصوت', djMode: 'وضع DJ', premium: 'بريميوم', queueLimit: 'حد قائمة الانتظار' },
      chooseMenu: 'اختر إعدادًا:',
      service: { title: 'الخدمة الافتراضية', description: 'اختر المنصة الافتراضية للبحث عن الموسيقى.', current: 'الخدمة الحالية', unsupported: 'خدمة غير مدعومة.', alreadySelected: '{service} هي بالفعل الخدمة الافتراضية.', selected: 'تم اختيار {service}.' },
      help: { title: 'مساعدة الإعدادات', content: '• <b>الخدمة الافتراضية</b> تحدد منصة البحث الرئيسية.\\n• <b>اللغة</b> تغيّر لغة عرض البوت.\\n• في المجموعات، يتم إدارة <b>إعداد الصوت</b> و<b>وضع DJ</b> بأوامر بريميوم.' },
      preset: { title: 'إعداد الصوت', content: 'استخدم الأوامر التالية لتغيير إعداد الصوت:', current: 'الإعداد الحالي' },
      djMode: { title: 'وضع DJ', content: 'استخدم الأوامر التالية لتبديل وضع DJ:', current: 'الحالة الحالية' },
      premium: { title: 'معلومات بريميوم', content: 'استخدم <code>/premiumfeatures</code> لعرض ميزات بريميوم.' },
      closed: 'تم إغلاق الإعدادات.',
      groupOnly: 'هذا الإعداد متاح فقط في المجموعات.',
      privateOnly: 'هذا الإعداد للمحادثة الخاصة.'
    }
  },
  tr: {`
  },
  tr: {
    buttonFind: "      djMode: 'DJ Modu'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJ Modu',\n      defaultService: 'Varsayılan Servis', audioPreset: 'Ses Efekti', premiumInfo: 'Premium Bilgisi'\n    },\n    language:",
    closingFind: "      close: 'Kapat'\n    }\n  },\n  ko: {",
    closingReplace: `      close: 'Kapat'
    },
    settings: {
      private: { title: 'Ayarlar', description: 'Bot tercihlerinizi yönetin.' },
      group: { title: 'Grup Ayarları', description: 'Gruptaki bot ayarlarını görüntüleyin ve yönetin.' },
      labels: { user: 'Kullanıcı', group: 'Grup', language: 'Dil', defaultService: 'Varsayılan Servis', audioPreset: 'Ses Efekti', djMode: 'DJ Modu', premium: 'Premium', queueLimit: 'Sıra Limiti' },
      chooseMenu: 'Bir ayar seçin:',
      service: { title: 'Varsayılan Servis', description: 'Müzik araması için varsayılan platformu seçin.', current: 'Mevcut servis', unsupported: 'Desteklenmeyen servis.', alreadySelected: '{service} zaten varsayılan servis.', selected: '{service} seçildi.' },
      help: { title: 'Ayarlar Yardımı', content: '• <b>Varsayılan Servis</b> birincil arama platformunu belirler.\\n• <b>Dil</b> botun görüntüleme dilini değiştirir.\\n• Gruplarda <b>Ses Efekti</b> ve <b>DJ Modu</b> premium komutlarıyla yönetilir.' },
      preset: { title: 'Ses Efekti', content: 'Ses efektini değiştirmek için aşağıdaki komutları kullanın:', current: 'Mevcut efekt' },
      djMode: { title: 'DJ Modu', content: 'DJ Modunu açmak/kapatmak için aşağıdaki komutları kullanın:', current: 'Mevcut durum' },
      premium: { title: 'Premium Bilgisi', content: 'Premium özellikleri görmek için <code>/premiumfeatures</code> kullanın.' },
      closed: 'Ayarlar kapatıldı.',
      groupOnly: 'Bu ayar yalnızca gruplarda kullanılabilir.',
      privateOnly: 'Bu ayar özel sohbet içindir.'
    }
  },
  ko: {`
  },
  ko: {
    buttonFind: "      djMode: 'DJ 모드'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJ 모드',\n      defaultService: '기본 서비스', audioPreset: '오디오 프리셋', premiumInfo: '프리미엄 정보'\n    },\n    language:",
    closingFind: "      close: '닫기'\n    }\n  },\n  zh: {",
    closingReplace: `      close: '닫기'
    },
    settings: {
      private: { title: '설정', description: '봇 환경설정을 관리합니다.' },
      group: { title: '그룹 설정', description: '그룹 봇 설정을 확인하고 관리합니다.' },
      labels: { user: '사용자', group: '그룹', language: '언어', defaultService: '기본 서비스', audioPreset: '오디오 프리셋', djMode: 'DJ 모드', premium: '프리미엄', queueLimit: '대기열 제한' },
      chooseMenu: '설정을 선택하세요:',
      service: { title: '기본 서비스', description: '음악 검색의 기본 플랫폼을 선택합니다.', current: '현재 서비스', unsupported: '지원하지 않는 서비스입니다.', alreadySelected: '{service}은(는) 이미 기본 서비스입니다.', selected: '{service}이(가) 선택되었습니다.' },
      help: { title: '설정 도움말', content: '• <b>기본 서비스</b>는 기본 검색 플랫폼을 설정합니다.\\n• <b>언어</b>는 봇 표시 언어를 변경합니다.\\n• 그룹에서 <b>오디오 프리셋</b>과 <b>DJ 모드</b>는 프리미엄 명령으로 관리합니다.' },
      preset: { title: '오디오 프리셋', content: '오디오 프리셋을 변경하려면 다음 명령어를 사용하세요:', current: '현재 프리셋' },
      djMode: { title: 'DJ 모드', content: 'DJ 모드를 전환하려면 다음 명령어를 사용하세요:', current: '현재 상태' },
      premium: { title: '프리미엄 정보', content: '프리미엄 기능을 보려면 <code>/premiumfeatures</code>를 사용하세요.' },
      closed: '설정이 닫혔습니다.',
      groupOnly: '이 설정은 그룹에서만 사용할 수 있습니다.',
      privateOnly: '이 설정은 개인 채팅용입니다.'
    }
  },
  zh: {`
  },
  // zh is the LAST language - it ends with `  }\n};` not `  },`
  zh: {
    buttonFind: "      djMode: 'DJ 模式'\n    },\n    language:",
    buttonReplace: "      djMode: 'DJ 模式',\n      defaultService: '默认服务', audioPreset: '音频预设', premiumInfo: '会员信息'\n    },\n    language:",
    closingFind: "      close: '关闭'\n    }\n  }\n};",
    closingReplace: `      close: '关闭'
    },
    settings: {
      private: { title: '设置', description: '管理您的机器人偏好设置。' },
      group: { title: '群组设置', description: '查看和管理群组机器人设置。' },
      labels: { user: '用户', group: '群组', language: '语言', defaultService: '默认服务', audioPreset: '音频预设', djMode: 'DJ 模式', premium: '会员', queueLimit: '队列限制' },
      chooseMenu: '选择一个设置：',
      service: { title: '默认服务', description: '选择音乐搜索的默认平台。', current: '当前服务', unsupported: '不支持的服务。', alreadySelected: '{service} 已经是默认服务。', selected: '已选择 {service}。' },
      help: { title: '设置帮助', content: '• <b>默认服务</b>设置主要搜索平台。\\n• <b>语言</b>更改机器人显示语言。\\n• 在群组中，<b>音频预设</b>和<b>DJ 模式</b>通过会员命令管理。' },
      preset: { title: '音频预设', content: '使用以下命令更改音频预设：', current: '当前预设' },
      djMode: { title: 'DJ 模式', content: '使用以下命令切换 DJ 模式：', current: '当前状态' },
      premium: { title: '会员信息', content: '使用 <code>/premiumfeatures</code> 查看会员功能。' },
      closed: '设置已关闭。',
      groupOnly: '此设置仅在群组中可用。',
      privateOnly: '此设置适用于私聊。'
    }
  }
};`
  }
};

// Apply all replacements
let replacementCount = 0;
for (const [lang, data] of Object.entries(langData)) {
  // Button replacement
  if (content.includes(data.buttonFind)) {
    content = content.replace(data.buttonFind, data.buttonReplace);
    replacementCount++;
    console.log(`✅ ${lang}: buttons patched`);
  } else {
    console.error(`❌ ${lang}: button pattern NOT FOUND`);
    console.error(`  Looking for: ${JSON.stringify(data.buttonFind.substring(0, 80))}`);
  }

  // Settings replacement
  if (content.includes(data.closingFind)) {
    content = content.replace(data.closingFind, data.closingReplace);
    replacementCount++;
    console.log(`✅ ${lang}: settings patched`);
  } else {
    console.error(`❌ ${lang}: closing pattern NOT FOUND`);
    console.error(`  Looking for: ${JSON.stringify(data.closingFind.substring(0, 80))}`);
  }
}

// Write the file
writeFileSync(filePath, content, 'utf8');
console.log(`\nTotal replacements: ${replacementCount} (expected: 28 = 14 languages × 2)`);
console.log('File written successfully.');

// Validate by importing
console.log('\nValidating syntax...');
try {
  await import('./src/i18n/messages.js');
  console.log('✅ Import successful - file is valid JS');
} catch (e) {
  console.error('❌ Import failed:', e.message);
  process.exit(1);
}
