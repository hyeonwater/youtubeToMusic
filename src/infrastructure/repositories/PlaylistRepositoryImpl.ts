import type { PlaylistRepository } from '../../domain/repositories/PlaylistRepository';
import type { YouTubeApiClient } from '../api/YouTubeApiClient';
import type { Playlist, PlaylistItem } from '../../shared/types/youtube';

export class PlaylistRepositoryImpl implements PlaylistRepository {
  constructor(private readonly apiClient: YouTubeApiClient) {}

  async getPlaylistById(playlistId: string): Promise<Playlist | null> {
    try {
      const response = await this.apiClient.getPlaylists({
        part: 'snippet',
        id: playlistId,
        maxResults: 1,
      });

      return response.items[0] || null;
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
      return null;
    }
  }

  async getPlaylistItems(playlistId: string, maxResults: number = 50): Promise<PlaylistItem[]> {
    try {
      const response = await this.apiClient.getPlaylistItems({
        part: 'snippet',
        playlistId,
        maxResults,
      });

      return response.items;
    } catch (error) {
      console.error('Failed to fetch playlist items:', error);
      return [];
    }
  }

  async getAllPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
    const allItems: PlaylistItem[] = [];
    let nextPageToken: string | undefined;

    try {
      do {
        const response = await this.apiClient.getPlaylistItems({
          part: 'snippet',
          playlistId,
          maxResults: 50,
          pageToken: nextPageToken,
        });

        allItems.push(...response.items);
        nextPageToken = response.nextPageToken;
      } while (nextPageToken);

      return allItems;
    } catch (error) {
      console.error('Failed to fetch all playlist items:', error);
      return allItems; // 지금까지 가져온 항목들이라도 반환
    }
  }
} 