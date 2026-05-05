import crypto from 'node:crypto';
import { db } from './mongo.js';

export async function createPlaylist(ownerId, name) {
  const playlist = {
    playlistId: `tgpl_${crypto.randomBytes(4).toString('hex')}`,
    ownerId: Number(ownerId),
    name,
    songs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db().collection('playlists').insertOne(playlist);
  return playlist;
}

export async function getPlaylist(playlistId) {
  return db().collection('playlists').findOne({ playlistId });
}

export async function listPlaylists(ownerId) {
  return db().collection('playlists').find({ ownerId: Number(ownerId) }).sort({ updatedAt: -1 }).toArray();
}

export async function deletePlaylist(ownerId, playlistId) {
  const result = await db().collection('playlists').deleteOne({ ownerId: Number(ownerId), playlistId });
  return result.deletedCount > 0;
}

export async function addSongToPlaylist(ownerId, playlistId, song) {
  const result = await db().collection('playlists').findOneAndUpdate(
    { ownerId: Number(ownerId), playlistId },
    { $addToSet: { songs: song }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return result;
}

export async function removeSongFromPlaylist(ownerId, playlistId, trackId) {
  const result = await db().collection('playlists').findOneAndUpdate(
    { ownerId: Number(ownerId), playlistId },
    { $pull: { songs: { trackId } }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return result;
}
