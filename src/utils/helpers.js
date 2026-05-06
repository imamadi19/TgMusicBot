function messageText(message = {}) {
  return message.text ?? message.caption ?? '';
}

function messageEntities(message = {}) {
  return message.entities ?? message.caption_entities ?? [];
}

function entityOffset(entity = {}) {
  return Number(entity.offset ?? entity.Offset ?? 0);
}

function entityLength(entity = {}) {
  return Number(entity.length ?? entity.Length ?? 0);
}

function entityType(entity = {}) {
  return typeof entity.type === 'string' ? entity.type : entity.type?.['@type'] ?? entity.Type?.['@type'] ?? '';
}

function entityUrl(entity = {}) {
  return entity.url ?? entity.type?.url ?? entity.Type?.url ?? '';
}

export function getUrl(message, { isReply = false } = {}) {
  const source = isReply ? message?.reply_to_message : message;
  const text = messageText(source);
  const entities = messageEntities(source);
  if (!text || !Array.isArray(entities) || entities.length === 0) return '';

  for (const entity of entities) {
    const type = entityType(entity);
    if (type === 'url' || type.endsWith('textEntityTypeUrl')) {
      const start = entityOffset(entity);
      const end = start + entityLength(entity);
      if (start >= 0 && end <= text.length) return text.slice(start, end);
    }
    if (type === 'text_link' || type.endsWith('textEntityTypeTextUrl')) {
      return entityUrl(entity);
    }
  }
  return '';
}

function documentMime(message = {}) {
  return String(message.document?.mime_type ?? message.document?.mimeType ?? '').toLowerCase();
}

export function isValidMedia(message) {
  if (!message) return false;
  if (message.audio || message.voice || message.video || message.video_note) return true;
  if (!message.document) return false;
  const mime = documentMime(message);
  return mime.startsWith('audio/') || mime.startsWith('video/');
}

export function getFile(message) {
  if (!message) return { file: null, name: '' };
  if (message.audio) return { file: message.audio, name: message.audio.title || message.audio.file_name || 'audio.mp3' };
  if (message.voice) return { file: message.voice, name: 'voice_note.ogg' };
  if (message.video) return { file: message.video, name: message.video.file_name || 'video.mp4' };
  if (message.video_note) return { file: message.video_note, name: 'video_note.mp4' };
  if (message.document) return { file: message.document, name: message.document.file_name || 'document' };
  return { file: null, name: '' };
}

export function coalesce(a, b) {
  return a !== '' && a != null ? a : b;
}

export function truncate(value, max) {
  const text = String(value ?? '');
  if (!Number.isFinite(Number(max)) || Number(max) < 0) return text;
  return text.length <= Number(max) ? text : text.slice(0, Number(max));
}
