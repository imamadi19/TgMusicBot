import { helpCallback, startHandler } from './help.js';
import { activeVcHandler, loopHandler, muteHandler, pauseHandler, playHandler, queueHandler, removeHandler, resumeHandler, skipHandler, speedHandler, stopHandler, unmuteHandler } from './playback.js';
import { addToPlaylistHandler, createPlaylistHandler, deletePlaylistHandler, myPlaylistsHandler, playlistInfoHandler, removeFromPlaylistHandler } from './playlists.js';
import { broadcastHandler, loggerHandler, noopHandler, pingHandler, privacyHandler, settingsHandler, shellHandler, statsHandler } from './misc.js';

export function loadHandlers(bot) {
  bot.command(['start', 'help'], startHandler);
  bot.command('ping', pingHandler);
  bot.command(['play', 'p'], (ctx) => playHandler(ctx, false));
  bot.command(['vplay', 'v'], (ctx) => playHandler(ctx, true));
  bot.command('queue', queueHandler);
  bot.command('skip', skipHandler);
  bot.command(['stop', 'end'], stopHandler);
  bot.command('pause', pauseHandler);
  bot.command('resume', resumeHandler);
  bot.command('remove', removeHandler);
  bot.command('loop', loopHandler);
  bot.command('mute', muteHandler);
  bot.command('unmute', unmuteHandler);
  bot.command('speed', speedHandler);
  bot.command(['av', 'active_vc'], activeVcHandler);
  bot.command(['cplist', 'createplaylist'], createPlaylistHandler);
  bot.command('deleteplaylist', deletePlaylistHandler);
  bot.command(['addtoplaylist', 'addtoplist'], addToPlaylistHandler);
  bot.command(['removefromplaylist', 'rmplist'], removeFromPlaylistHandler);
  bot.command(['plistinfo', 'playlistinfo'], playlistInfoHandler);
  bot.command(['myplaylists', 'myplist'], myPlaylistsHandler);
  bot.command('stats', statsHandler);
  bot.command('settings', settingsHandler);
  bot.command('privacy', privacyHandler);
  bot.command(['broadcast', 'gcast'], broadcastHandler);
  bot.command('logger', loggerHandler);
  bot.command('sh', shellHandler);
  bot.command(['reload', 'authlist', 'auths', 'auth', 'addauth', 'removeauth', 'rmauth', 'stop_gcast', 'stop_broadcast', 'clearass', 'clearassistants', 'leaveall', 'seek'], noopHandler);
  bot.callbackQuery(/^help_/, helpCallback);
  bot.callbackQuery(/^vcplay_/, async (ctx) => {
    const action = ctx.callbackQuery.data.replace('vcplay_', '');
    if (action === 'pause') await pauseHandler(ctx);
    else if (action === 'skip') await skipHandler(ctx);
    else if (action === 'stop') await stopHandler(ctx);
    await ctx.answerCallbackQuery();
  });
}
