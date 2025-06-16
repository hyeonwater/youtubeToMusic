import type { Playlist, PlaylistItem } from '../../shared/types/youtube';

export interface PlaylistRepository {
  /**
   * 플레이리스트 ID로 플레이리스트 정보를 가져옵니다.
   */
  getPlaylistById(playlistId: string): Promise<Playlist | null>;

  /**
   * 플레이리스트의 아이템들을 가져옵니다.
   */
  getPlaylistItems(playlistId: string, maxResults?: number): Promise<PlaylistItem[]>;

  /**
   * 플레이리스트의 모든 아이템들을 가져옵니다.
   */
  getAllPlaylistItems(playlistId: string): Promise<PlaylistItem[]>;
} 