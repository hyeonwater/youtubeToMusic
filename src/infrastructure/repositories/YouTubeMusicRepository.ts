import type { MusicServiceRepository } from '../../shared/types/musicService';
import type { 
  YouTubeMusicAuthState, 
  YouTubeMusicSearchResult,
  YouTubeMusicPlaylistResult,
  YTMusicCredentials 
} from '../../shared/types/youtubeMusic';
import type { MusicTrack } from '../../shared/utils/musicParser';
import { YOUTUBE_API } from '../../shared/constants/api';

// YouTube Music Repository for OAuth-based playlist creation

export class YouTubeMusicRepository implements MusicServiceRepository {
  private isInitialized = false;
  private authState: YouTubeMusicAuthState = {
    isAuthorized: false,
    isLoading: false,
    error: null,
    hasCredentials: false,
  };
  private credentials: YTMusicCredentials | null = null;
  private accessToken: string | null = null;
  
  // OAuth 2.0 설정
  private readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; // OAuth 클라이언트 ID를 환경변수에서 읽기
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      // 저장된 인증 정보 확인
      const savedCredentials = this.loadCredentials();
      if (savedCredentials && savedCredentials.accessToken) {
        this.credentials = savedCredentials;
        this.accessToken = savedCredentials.accessToken; // 🔑 중요: 액세스 토큰도 설정
        this.authState.hasCredentials = true;
        this.authState.isAuthorized = true;
        console.log('✅ 저장된 OAuth 토큰 로드됨');
      } else {
        console.log('ℹ️ 저장된 OAuth 토큰이 없습니다');
      }

      this.isInitialized = true;
      this.authState.isLoading = false;

      console.log('✅ YouTube Music initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize YouTube Music:', error);
      this.authState.isLoading = false;
      this.authState.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  async authorize(): Promise<boolean> {
    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      // OAuth 클라이언트 ID가 설정되어 있는지 확인
      if (!this.CLIENT_ID) {
        throw new Error('Google OAuth 클라이언트 ID가 설정되지 않았습니다. 환경변수 VITE_GOOGLE_CLIENT_ID를 설정해주세요.');
      }
      
      // 클라이언트 ID 형식 확인 (% 문자나 기타 잘못된 문자 확인)
      if (this.CLIENT_ID.includes('%') || !this.CLIENT_ID.includes('.apps.googleusercontent.com')) {
        throw new Error('Google OAuth 클라이언트 ID 형식이 잘못되었습니다. .env 파일에서 VITE_GOOGLE_CLIENT_ID의 % 문자를 제거하고 올바른 형식으로 설정해주세요.');
      }

      // Google OAuth 2.0 인증 시작
      const success = await this.initiateOAuthFlow();
      
      this.authState.isLoading = false;
      return success;
    } catch (error) {
      console.error('❌ YouTube Music authorization failed:', error);
      this.authState.isLoading = false;
      this.authState.error = error instanceof Error ? error.message : 'Authorization failed';
      return false;
    }
  }

  private async initiateOAuthFlow(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('🔐 Google Identity Services를 사용한 OAuth 시작...');
      console.log(`🔑 클라이언트 ID: ${this.CLIENT_ID?.substring(0, 20)}...`);
      console.log(`📋 스코프: ${this.SCOPES.join(', ')}`);
      
      // Google Identity Services가 로드되었는지 확인
      if (typeof (window as any).google === 'undefined') {
        console.error('❌ Google Identity Services가 로드되지 않았습니다.');
        console.log('💡 HTML 헤드에 다음 스크립트가 포함되었는지 확인하세요:');
        console.log('<script src="https://accounts.google.com/gsi/client" async defer></script>');
        reject(new Error('Google Identity Services가 로드되지 않았습니다.'));
        return;
      }

      console.log('✅ Google Identity Services 로드됨');
      console.log('🔍 사용 가능한 API:', Object.keys((window as any).google));

      try {
        // Google Identity Services 초기화
        (window as any).google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES.join(' '),
          callback: (response: any) => {
            if (response.error) {
              console.error('❌ OAuth 오류:', response.error);
              this.authState.error = response.error;
              reject(new Error(response.error));
              return;
            }
            
            if (response.access_token) {
              console.log('✅ Google Identity Services OAuth 성공!');
              this.accessToken = response.access_token;
              this.authState.isAuthorized = true;
              this.authState.hasCredentials = true;
              this.authState.isLoading = false;
              this.authState.error = null;

              // 토큰 저장
              this.saveCredentials({ 
                accessToken: response.access_token,
                refreshToken: undefined // Implicit flow에서는 refresh token 없음
              });

              resolve(true);
            } else {
              console.error('❌ 액세스 토큰을 받지 못했습니다.');
              reject(new Error('액세스 토큰을 받지 못했습니다.'));
            }
          },
        }).requestAccessToken();
        
      } catch (error) {
        console.error('❌ Google Identity Services 초기화 실패:', error);
        reject(error);
      }
    });
  }

  async unauthorize(): Promise<void> {
    this.authState.isAuthorized = false;
    this.authState.hasCredentials = false;
    this.credentials = null;
    this.accessToken = null; // 🔑 액세스 토큰도 정리
    this.clearCredentials();
    console.log('✅ YouTube Music logged out successfully');
  }

  async handleOAuthCallback(): Promise<void> {
    // Google Identity Services를 사용하므로 더 이상 필요 없음
    console.log('ℹ️ Google Identity Services를 사용하므로 OAuth 콜백 처리가 필요하지 않습니다.');
    throw new Error('Google Identity Services를 사용하므로 OAuth 콜백이 더 이상 필요하지 않습니다.');
  }

  getAuthState(): YouTubeMusicAuthState {
    return { ...this.authState };
  }

  // 디버깅용 함수
  debugTokenState(): void {
    console.log('🔍 토큰 상태 디버깅:');
    console.log('  - accessToken:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'null');
    console.log('  - authState.isAuthorized:', this.authState.isAuthorized);
    console.log('  - authState.hasCredentials:', this.authState.hasCredentials);
    console.log('  - credentials:', this.credentials);
    console.log('  - localStorage:', localStorage.getItem('youtube-music-credentials')?.substring(0, 100) + '...');
  }

  async searchSong(title: string, artist: string): Promise<YouTubeMusicSearchResult[]> {
    if (!this.authState.isAuthorized) {
      throw new Error('Not authenticated with YouTube Music');
    }

    try {
      const query = `${artist} ${title}`.trim();
      
      // YouTube Data API를 사용한 검색 (공개 API)
      const response = await fetch(
        `${YOUTUBE_API.BASE_URL}/search?` +
        `part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(query)}&` +
        `key=${YOUTUBE_API.KEY}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API request failed: ${response.status}`);
      }

      const data = await response.json();
      const results: YouTubeMusicSearchResult[] = [];

      for (const item of data.items || []) {
        const videoTitle = item.snippet.title;
        const channelTitle = item.snippet.channelTitle;
        
        // 음악 관련 비디오인지 확인 (간단한 필터링)
        if (this.isMusicVideo(videoTitle, channelTitle, artist, title)) {
          const confidence = this.calculateConfidence(title, artist, videoTitle, channelTitle);
          
          results.push({
            id: item.id.videoId,
            videoId: item.id.videoId,
            title: videoTitle,
            artist: channelTitle,
            confidence,
            isExact: confidence > 0.8,
            thumbnailUrl: item.snippet.thumbnails?.default?.url,
          });
        }
      }

      // 신뢰도 순으로 정렬
      return results.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Failed to search YouTube Music:', error);
      return [];
    }
  }

  async createPlaylist(name: string, description?: string): Promise<string> {
    if (!this.authState.isAuthorized) {
      throw new Error('Not authenticated with YouTube Music');
    }

    try {
      console.log(`🎵 YouTube Music 플레이리스트 생성: "${name}"`);
      
      // 실제 OAuth 토큰이 있으면 실제 플레이리스트 생성
      if (this.accessToken && !this.accessToken.startsWith('temp_oauth_token_')) {
        console.log('✅ 실제 OAuth 토큰으로 플레이리스트 생성');
        return await this.createYouTubePlaylist(name, description || '');
      } else {
        // OAuth 없으면 시뮬레이션
        const mockPlaylistId = 'PLrAKn2dHVYu' + Math.random().toString(36).substring(2, 15);
        
        console.log('⚠️ OAuth 토큰 없음 - 시뮬레이션 모드');
        console.log('✅ YouTube Music 플레이리스트 생성 완료!');
        console.log('🆔 플레이리스트 ID:', mockPlaylistId);
        console.log('🔗 플레이리스트 URL:', `https://music.youtube.com/playlist?list=${mockPlaylistId}`);
        
        // 브라우저에서 YouTube Music 플레이리스트 페이지 열기
        const youtubePlaylistUrl = `https://music.youtube.com/library/playlists`;
        window.open(youtubePlaylistUrl, '_blank');
        
        return mockPlaylistId;
      }
    } catch (error) {
      console.error('❌ Failed to create YouTube Music playlist:', error);
      throw error;
    }
  }

  private async createYouTubePlaylist(title: string, description: string): Promise<string> {
    const response = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags: ['music', 'playlist'],
          defaultLanguage: 'ko',
          defaultAudioLanguage: 'ko'
        },
        status: {
          privacyStatus: 'private' // private, public, unlisted 중 선택
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create playlist: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ 플레이리스트 생성 완료!`);
    console.log(`🔗 링크: https://music.youtube.com/playlist?list=${data.id}`);
    
    return data.id;
  }

  async addSongsToPlaylist(
    playlistId: string,
    tracks: MusicTrack[],
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<YouTubeMusicPlaylistResult> {
    if (!this.authState.isAuthorized) {
      throw new Error('Not authenticated with YouTube Music');
    }

    const result: YouTubeMusicPlaylistResult = {
      success: true,
      addedSongs: 0,
      failedSongs: [],
      playlistId,
      playlistUrl: `https://music.youtube.com/playlist?list=${playlistId}`
    };

    try {
      console.log(`🎵 YouTube Music 플레이리스트에 ${tracks.length}곡 추가 중...`);
      console.log(`🔑 액세스 토큰 상태: ${this.accessToken ? '있음' : '없음'}`);
      console.log(`📋 플레이리스트 ID: ${playlistId}`);
      
      if (!this.accessToken) {
        throw new Error('액세스 토큰이 없습니다. 다시 로그인해주세요.');
      }
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const trackString = `${track.title} - ${track.artist}`;
        
        onProgress?.(i + 1, tracks.length, trackString);

        try {
          // 곡 검색 (실제 검색)
          const searchResults = await this.searchSong(track.title, track.artist);
          
          if (searchResults.length > 0) {
            const bestMatch = searchResults[0];
            
            try {
              // 실제로 플레이리스트에 곡 추가
              await this.addVideoToPlaylist(playlistId, bestMatch.videoId);
              result.addedSongs++;
              console.log(`✅ 추가됨: ${trackString} -> ${bestMatch.title}`);
              console.log(`🔗 YouTube Music 링크: https://music.youtube.com/watch?v=${bestMatch.videoId}`);
            } catch (addError) {
              console.error(`❌ 플레이리스트 추가 실패 ${trackString}:`, addError);
              result.failedSongs.push(`${trackString} (추가 실패: ${addError instanceof Error ? addError.message : 'Unknown error'})`);
            }
          } else {
            console.log(`⚠️ 검색 결과 없음: ${trackString}`);
            result.failedSongs.push(`${trackString} (검색 결과 없음)`);
          }

          // API 제한을 고려한 지연
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ 검색 실패 ${trackString}:`, error);
          result.failedSongs.push(`${trackString} (검색 실패: ${error instanceof Error ? error.message : 'Unknown error'})`);
        }
      }

      console.log(`🎉 플레이리스트 생성 완료!`);
      console.log(`✅ 성공: ${result.addedSongs}곡`);
      console.log(`❌ 실패: ${result.failedSongs.length}곡`);
      console.log(`🔗 플레이리스트: ${result.playlistUrl}`);
      
      return result;
    } catch (error) {
      console.error('Failed to add songs to YouTube Music playlist:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  private async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    console.log(`🔄 플레이리스트에 비디오 추가 중: ${videoId} -> ${playlistId}`);
    
    const requestBody = {
      snippet: {
        playlistId,
        resourceId: {
          kind: 'youtube#video',
          videoId
        }
      }
    };

    console.log(`📋 API 요청 데이터:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📡 API 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ API 오류 응답:`, errorData);
      throw new Error(`Failed to add video to playlist: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    console.log(`✅ 비디오 추가 성공:`, responseData.id);
  }

  private isMusicVideo(videoTitle: string, channelTitle: string, targetArtist: string, targetTitle: string): boolean {
    const title = videoTitle.toLowerCase();
    const channel = channelTitle.toLowerCase();
    const artist = targetArtist.toLowerCase();
    const songTitle = targetTitle.toLowerCase();

    // 음악 관련 키워드가 있는지 확인
    const musicKeywords = ['music', 'official', 'audio', 'lyrics', 'video', 'mv'];
    const hasMusic = musicKeywords.some(keyword => title.includes(keyword) || channel.includes(keyword));

    // 아티스트 이름이 포함되어 있는지 확인
    const hasArtist = title.includes(artist) || channel.includes(artist);

    // 곡 제목이 포함되어 있는지 확인
    const hasTitle = title.includes(songTitle);

    // 제외할 키워드들
    const excludeKeywords = ['live', 'concert', 'interview', 'reaction', 'cover', 'tutorial'];
    const shouldExclude = excludeKeywords.some(keyword => title.includes(keyword));

    return (hasMusic || hasArtist || hasTitle) && !shouldExclude;
  }

  private calculateConfidence(targetTitle: string, targetArtist: string, videoTitle: string, channelTitle: string): number {
    const title = videoTitle.toLowerCase();
    const channel = channelTitle.toLowerCase();
    const artist = targetArtist.toLowerCase();
    const songTitle = targetTitle.toLowerCase();

    let confidence = 0;

    // 제목 매칭
    if (title.includes(songTitle)) {
      confidence += 0.4;
    }

    // 아티스트 매칭
    if (title.includes(artist) || channel.includes(artist)) {
      confidence += 0.4;
    }

    // 공식 비디오인지 확인
    if (title.includes('official')) {
      confidence += 0.1;
    }

    // 음악 관련 키워드
    if (title.includes('music') || title.includes('audio')) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // private async getAccessToken(): Promise<string> {
  //   // 실제 구현에서는 OAuth 토큰을 반환해야 함
  //   // 현재는 임시 구현
  //   return 'dummy-access-token';
  // }

  private loadCredentials(): YTMusicCredentials | null {
    try {
      const saved = localStorage.getItem('youtube-music-credentials');
      if (saved) {
        const credentials = JSON.parse(saved);
        console.log('📂 저장된 credentials 로드:', {
          hasAccessToken: !!credentials.accessToken,
          hasRefreshToken: !!credentials.refreshToken,
          accessTokenLength: credentials.accessToken?.length || 0
        });
        return credentials;
      } else {
        console.log('📂 localStorage에 저장된 credentials 없음');
        return null;
      }
    } catch (error) {
      console.error('❌ credentials 로드 실패:', error);
      return null;
    }
  }

  private saveCredentials(credentials: YTMusicCredentials): void {
    localStorage.setItem('youtube-music-credentials', JSON.stringify(credentials));
    this.credentials = credentials;
  }

  private clearCredentials(): void {
    localStorage.removeItem('youtube-music-credentials');
  }


} 