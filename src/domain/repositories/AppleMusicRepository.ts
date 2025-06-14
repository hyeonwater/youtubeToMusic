import type { MusicTrack } from '../../shared/utils/musicParser';
import type { 
  MusicSearchResult, 
  PlaylistCreationResult, 
  AppleMusicAuthState 
} from '../../shared/types/appleMusic';

export interface AppleMusicRepository {
  // 인증 관련
  initialize(): Promise<boolean>;
  authorize(): Promise<boolean>;
  unauthorize(): Promise<void>;
  getAuthState(): AppleMusicAuthState;
  
  // 음악 검색
  searchSong(title: string, artist: string): Promise<MusicSearchResult[]>;
  
  // 플레이리스트 관련
  createPlaylist(name: string, description?: string): Promise<string>;
  addSongsToPlaylist(
    playlistId: string, 
    tracks: MusicTrack[], 
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<PlaylistCreationResult>;
  
  // 라이브러리에 직접 추가
  addSongsToLibrary(songIds: string[]): Promise<boolean>;
} 