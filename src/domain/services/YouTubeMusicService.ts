import type { MusicServiceRepository } from '../../shared/types/musicService';
import type { MusicTrack } from '../../shared/utils/musicParser';
import type { 
  YouTubeMusicAuthState, 
  YouTubeMusicSearchResult,
  YouTubeMusicPlaylistResult 
} from '../../shared/types/youtubeMusic';

export class YouTubeMusicService {
  constructor(private youtubeMusicRepository: MusicServiceRepository) {}

  /**
   * YouTube Music을 초기화합니다.
   */
  async initialize(): Promise<boolean> {
    return this.youtubeMusicRepository.initialize();
  }

  /**
   * YouTube Music 사용자 인증을 수행합니다.
   */
  async authorize(): Promise<boolean> {
    return this.youtubeMusicRepository.authorize();
  }

  /**
   * YouTube Music 로그아웃을 수행합니다.
   */
  async unauthorize(): Promise<void> {
    return this.youtubeMusicRepository.unauthorize();
  }

  /**
   * 현재 인증 상태를 가져옵니다.
   */
  getAuthState(): YouTubeMusicAuthState {
    return this.youtubeMusicRepository.getAuthState() as YouTubeMusicAuthState;
  }

  /**
   * 음악 트랙을 검색하고 매칭도가 높은 순으로 정렬합니다.
   */
  async searchSong(title: string, artist: string): Promise<YouTubeMusicSearchResult[]> {
    const results = await this.youtubeMusicRepository.searchSong(title, artist);
    
    // 매칭도와 정확성에 따라 정렬
    return (results as YouTubeMusicSearchResult[]).sort((a, b) => {
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
  ): Promise<Map<string, YouTubeMusicSearchResult[]>> {
    const results = new Map<string, YouTubeMusicSearchResult[]>();
    
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
        await this.delay(300); // YouTube API는 더 긴 지연 필요
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
  ): Promise<YouTubeMusicPlaylistResult> {
    try {
      // 1. 플레이리스트 생성
      const playlistId = await this.youtubeMusicRepository.createPlaylist(
        playlistName, 
        description
      );

      // 2. 곡들을 플레이리스트에 추가
      const result = await this.youtubeMusicRepository.addSongsToPlaylist(
        playlistId,
        tracks,
        onProgress
      );

      return {
        ...result,
        playlistId,
        playlistName,
      } as YouTubeMusicPlaylistResult;
    } catch (error) {
      console.error('Failed to create YouTube Music playlist with songs:', error);
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
  ): Promise<YouTubeMusicPlaylistResult> {
    return this.youtubeMusicRepository.addSongsToPlaylist(playlistId, tracks, onProgress) as Promise<YouTubeMusicPlaylistResult>;
  }

  /**
   * 매칭 결과 통계를 제공합니다.
   */
  analyzeSearchResults(results: Map<string, YouTubeMusicSearchResult[]>): {
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

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 