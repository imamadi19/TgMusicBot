import { InlineKeyboard } from 'grammy';
import { config } from '../config/index.js';

export function supportKeyboard() {
  const keyboard = new InlineKeyboard();
  if (config.supportGroup) keyboard.url('Support', config.supportGroup);
  if (config.supportChannel) keyboard.url('Channel', config.supportChannel);
  return keyboard;
}

export function helpKeyboard() {
  return new InlineKeyboard()
    .text('User', 'help_user').text('Admin', 'help_admin').row()
    .text('Playlist', 'help_playlist').text('Owner', 'help_owner').row()
    .text('Developer', 'help_devs');
}

export function backKeyboard() {
  return new InlineKeyboard().text('Back', 'help_all');
}

export function controlKeyboard() {
  return new InlineKeyboard()
    .text('⏸ Pause', 'vcplay_pause').text('⏭ Skip', 'vcplay_skip').row()
    .text('⏹ Stop', 'vcplay_stop');
}
