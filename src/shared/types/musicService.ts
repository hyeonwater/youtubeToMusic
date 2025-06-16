export type MusicServiceType = 'apple-music' | 'youtube-music';

export interface MusicServiceAuthState {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MusicServiceSearchResult {
  id: string;
  title: string;
  artist: string;
  confidence: number;
  isExact: boolean;
}

export interface PlaylistCreationResult {
  success: boolean;
  addedSongs: number;
  failedSongs: string[];
  error?: string;
  playlistId?: string;
  playlistName?: string;
  playlistUrl?: string;
}

export interface MusicServiceRepository {
  // 인증 관련
  initialize(): Promise<boolean>;
  authorize(): Promise<boolean>;
  unauthorize(): Promise<void>;
  getAuthState(): MusicServiceAuthState;
  
  // 음악 검색
  searchSong(title: string, artist: string): Promise<MusicServiceSearchResult[]>;
  
  // 플레이리스트 관련
  createPlaylist(name: string, description?: string): Promise<string>;
  addSongsToPlaylist(
    playlistId: string, 
    tracks: import('../utils/musicParser').MusicTrack[], 
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<PlaylistCreationResult>;
  
  // 선택적 기능
  addSongsToLibrary?(songIds: string[]): Promise<boolean>;
} 