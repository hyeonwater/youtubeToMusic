import type { AppleMusicRepository } from '../repositories/AppleMusicRepository';
import type { MusicTrack } from '../../shared/utils/musicParser';
import type { 
  MusicSearchResult, 
  PlaylistCreationResult, 
  AppleMusicAuthState 
} from '../../shared/types/appleMusic';

export class AppleMusicService {
  constructor(private appleMusicRepository: AppleMusicRepository) {}

  /**
   * Apple Music을 초기화합니다.
   */
  async initialize(): Promise<boolean> {
    return this.appleMusicRepository.initialize();
  }

  /**
   * Apple Music 사용자 인증을 수행합니다.
   */
  async authorize(): Promise<boolean> {
    return this.appleMusicRepository.authorize();
  }

  /**
   * Apple Music 로그아웃을 수행합니다.
   */
  async unauthorize(): Promise<void> {
    return this.appleMusicRepository.unauthorize();
  }

  /**
   * 현재 인증 상태를 가져옵니다.
   */
  getAuthState(): AppleMusicAuthState {
    return this.appleMusicRepository.getAuthState();
  }

  /**
   * 음악 트랙을 검색하고 매칭도가 높은 순으로 정렬합니다.
   */
  async searchSong(title: string, artist: string): Promise<MusicSearchResult[]> {
    const results = await this.appleMusicRepository.searchSong(title, artist);
    
    // 매칭도와 정확성에 따라 정렬
    return results.sort((a, b) => {
      // 정확한 매치를 우선
      if (a.isExact && !b.isExact) return -1;
      if (!a.isExact && b.isExact) return 1;
      
      // 매칭도 점수에 따라 정렬
      return b.confidence - a.confidence;
    });
  }

  /**
   * 여러 음악 트랙을 한 번에 검색합니다.
   */
  async searchMultipleSongs(
    tracks: MusicTrack[],
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<Map<string, MusicSearchResult[]>> {
    const results = new Map<string, MusicSearchResult[]>();
    
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const trackKey = `${track.title} - ${track.artist}`;
      
      if (onProgress) {
        onProgress(i + 1, tracks.length, trackKey);
      }
      
      try {
        const searchResults = await this.searchSong(track.title, track.artist);
        results.set(trackKey, searchResults);
        
        // API 요청 제한을 고려하여 짧은 지연 추가
        await this.delay(200);
      } catch (error) {
        console.error(`Failed to search for ${trackKey}:`, error);
        results.set(trackKey, []);
      }
    }
    
    return results;
  }

  /**
   * 플레이리스트를 생성하고 곡들을 추가합니다.
   */
  async createPlaylistWithSongs(
    playlistName: string,
    tracks: MusicTrack[],
    description?: string,
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<PlaylistCreationResult> {
    try {
      // 1. 플레이리스트 생성
      const playlistId = await this.appleMusicRepository.createPlaylist(
        playlistName, 
        description
      );

      // 2. 곡들을 플레이리스트에 추가
      const result = await this.appleMusicRepository.addSongsToPlaylist(
        playlistId,
        tracks,
        onProgress
      );

      return {
        ...result,
        playlistId,
        playlistName,
      };
    } catch (error) {
      console.error('Failed to create playlist with songs:', error);
      return {
        success: false,
        addedSongs: 0,
        failedSongs: tracks.map(t => `${t.title} - ${t.artist}`),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 기존 플레이리스트에 곡들을 추가합니다.
   */
  async addSongsToExistingPlaylist(
    playlistId: string,
    tracks: MusicTrack[],
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<PlaylistCreationResult> {
    return this.appleMusicRepository.addSongsToPlaylist(playlistId, tracks, onProgress);
  }

  /**
   * 곡들을 사용자의 라이브러리에 직접 추가합니다.
   */
  async addSongsToLibrary(tracks: MusicTrack[]): Promise<{ 
    success: boolean; 
    addedCount: number; 
    failedTracks: string[];
  }> {
    const searchResults = await this.searchMultipleSongs(tracks);
    const songIds: string[] = [];
    const failedTracks: string[] = [];

    for (const [trackKey, results] of searchResults) {
      if (results.length > 0 && results[0].isExact) {
        songIds.push(results[0].id);
      } else {
        failedTracks.push(trackKey);
      }
    }

    if (songIds.length > 0) {
      const success = await this.appleMusicRepository.addSongsToLibrary(songIds);
      return {
        success,
        addedCount: success ? songIds.length : 0,
        failedTracks
      };
    }

    return {
      success: false,
      addedCount: 0,
      failedTracks
    };
  }

  /**
   * 간단한 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 매칭 결과 통계를 제공합니다.
   */
  analyzeSearchResults(results: Map<string, MusicSearchResult[]>): {
    totalTracks: number;
    exactMatches: number;
    partialMatches: number;
    noMatches: number;
    matchRate: number;
  } {
    const totalTracks = results.size;
    let exactMatches = 0;
    let partialMatches = 0;
    let noMatches = 0;

    for (const searchResults of results.values()) {
      if (searchResults.length === 0) {
        noMatches++;
      } else if (searchResults[0].isExact) {
        exactMatches++;
      } else {
        partialMatches++;
      }
    }

    const matchRate = totalTracks > 0 ? (exactMatches + partialMatches) / totalTracks : 0;

    return {
      totalTracks,
      exactMatches,
      partialMatches,
      noMatches,
      matchRate
    };
  }
} 