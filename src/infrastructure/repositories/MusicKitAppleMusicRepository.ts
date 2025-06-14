import type { AppleMusicRepository } from '../../domain/repositories/AppleMusicRepository';
import type { 
  AppleMusicAuthState, 
  MusicSearchResult,
  PlaylistCreationResult,
  MusicKitInstance 
} from '../../shared/types/appleMusic';
import type { MusicTrack } from '../../shared/utils/musicParser';



export class MusicKitAppleMusicRepository implements AppleMusicRepository {
  private musicKit: MusicKitInstance | null = null;
  private isInitialized = false;
  private authState: AppleMusicAuthState = {
    isAuthorized: false,
    isLoading: false,
    error: null,
  };

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      // MusicKit JS 라이브러리 로드 대기
      await this.waitForMusicKit();
      
      if (!window.MusicKit) {
        throw new Error('MusicKit JS library failed to load');
      }

      // Developer Token 가져오기
      const developerToken = import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
      if (!developerToken) {
        throw new Error('Apple Music Developer Token is not set. Please add VITE_APPLE_MUSIC_DEVELOPER_TOKEN to your .env file');
      }

      // MusicKit 인스턴스 구성
      this.musicKit = await window.MusicKit.configure({
        developerToken,
        app: {
          name: 'YouTube to Music',
          build: '1.0.0',
        },
      });

      this.isInitialized = true;
      this.authState.isLoading = false;
      this.authState.isAuthorized = this.musicKit?.isAuthorized || false;

      console.log('✅ MusicKit initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MusicKit:', error);
      this.authState.isLoading = false;
      this.authState.error = error instanceof Error ? error.message : 'Unknown error';
      return false;
    }
  }

  getAuthState(): AppleMusicAuthState {
    if (this.musicKit) {
      this.authState.isAuthorized = this.musicKit.isAuthorized;
      // MusicKit에서 실제 사용자 토큰 가져오기
      this.authState.userToken = this.musicKit.musicUserToken;
    }
    return { ...this.authState };
  }

  async authorize(): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      this.authState.isLoading = true;
      this.authState.error = null;

      const userToken = await this.musicKit?.authorize();
      if (!userToken) {
        throw new Error('Failed to get user token from Apple Music');
      }
      
      this.authState.isAuthorized = true;
      this.authState.userToken = userToken;
      this.authState.isLoading = false;

      console.log('✅ Apple Music authorization successful');
      console.log('🔑 User token obtained:', userToken ? 'Yes' : 'No');
      return true;
    } catch (error) {
      console.error('❌ Apple Music authorization failed:', error);
      this.authState.isLoading = false;
      this.authState.error = error instanceof Error ? error.message : 'Authorization failed';
      return false;
    }
  }

  async unauthorize(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.musicKit?.unauthorize();
      this.authState.isAuthorized = false;
      this.authState.userToken = undefined;
      console.log('✅ Apple Music logout successful');
    } catch (error) {
      console.error('❌ Apple Music logout failed:', error);
      throw error;
    }
  }

  async searchSong(title: string, artist: string): Promise<MusicSearchResult[]> {
    await this.ensureInitialized();
    
    try {
      // 사용자 정보 및 지역 확인
      console.log(`🌍 User country: ${this.musicKit?.storefrontId || 'not set'}`);
      console.log(`💳 User authorized: ${this.musicKit?.isAuthorized}`);
      
      // 검색 쿼리 정리 (특수문자 제거, 간단화)
      const cleanTitle = this.cleanSearchQuery(title);
      const cleanArtist = this.cleanSearchQuery(artist);
      
      console.log(`🧹 Cleaned title: "${cleanTitle}", artist: "${cleanArtist}"`);
      
      // 간단한 검색부터 시도
      const query = cleanTitle; // 일단 제목만으로 검색
      console.log(`🔍 Searching for: "${query}"`);
      
      const response = await this.musicKit?.api.search(query, {
        types: ['songs'],
        limit: 10,
      });

      console.log(`📊 Full API Response:`, response);
      console.log(`🔗 Response keys:`, Object.keys(response || {}));
      
      // 가능한 모든 경로 확인 (타입 안전성보다 디버깅 우선)
      const apiResponse = response as any;
      console.log(`📝 response.results:`, apiResponse?.results);
      console.log(`📝 response.results.songs:`, apiResponse?.results?.songs);
      console.log(`📝 response.results.songs.data:`, apiResponse?.results?.songs?.data);
      console.log(`📝 response.songs:`, apiResponse?.songs);
      console.log(`📝 response.songs.data:`, apiResponse?.songs?.data);
      console.log(`📝 response.data:`, apiResponse?.data);
      console.log(`📝 response.data.songs:`, apiResponse?.data?.songs);
      
      // 여러 가능한 경로 시도
      let songsData = null;
      
      if (apiResponse?.results?.songs?.data) {
        songsData = apiResponse.results.songs.data;
        console.log(`✅ Found songs at: response.results.songs.data`);
      } else if (apiResponse?.songs?.data) {
        songsData = apiResponse.songs.data;
        console.log(`✅ Found songs at: response.songs.data`);
      } else if (apiResponse?.data?.songs) {
        songsData = apiResponse.data.songs;
        console.log(`✅ Found songs at: response.data.songs`);
      } else if (apiResponse?.songs) {
        songsData = apiResponse.songs;
        console.log(`✅ Found songs at: response.songs`);
      } else if (Array.isArray(apiResponse?.data)) {
        songsData = apiResponse.data;
        console.log(`✅ Found songs at: response.data (array)`);
      } else {
        console.log(`❌ Could not find songs in any expected location`);
        console.log(`🔍 Trying to find any array in response...`);
        
        // 재귀적으로 배열 찾기
        const findArrays = (obj: any, path = ''): any[] => {
          const arrays: any[] = [];
          if (Array.isArray(obj)) {
            arrays.push({ path, data: obj });
          } else if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach(key => {
              arrays.push(...findArrays(obj[key], path ? `${path}.${key}` : key));
            });
          }
          return arrays;
        };
        
        const foundArrays = findArrays(apiResponse);
        console.log(`🔍 Found arrays:`, foundArrays);
        
        // 첫 번째로 찾은 배열 사용
        if (foundArrays.length > 0) {
          songsData = foundArrays[0].data;
          console.log(`✅ Using first found array at: ${foundArrays[0].path}`);
        }
      }
      
      if (!songsData || !Array.isArray(songsData) || songsData.length === 0) {
        console.log(`❌ No songs found for: "${query}"`);
        return [];
      }
      
      console.log(`🎵 Found ${songsData.length} songs:`, songsData);
      
      const results = songsData.map((song: any) => {
        // 여러 가능한 속성 경로 확인
        const songTitle = song?.attributes?.name || song?.name || song?.title || 'Unknown';
        const songArtist = song?.attributes?.artistName || song?.artistName || song?.artist || 'Unknown';
        const songAlbum = song?.attributes?.albumName || song?.albumName || song?.album || 'Unknown';
        const artwork = song?.attributes?.artwork?.url || song?.artwork?.url || song?.artworkUrl;
        
        console.log(`🎵 Processing song:`, {
          id: song.id,
          title: songTitle,
          artist: songArtist,
          album: songAlbum,
          hasArtwork: !!artwork
        });
        
        const searchResult: MusicSearchResult = {
          id: song.id,
          title: songTitle,
          artist: songArtist,
          album: songAlbum,
          artwork: artwork?.replace('{w}', '300').replace('{h}', '300'),
          isExact: this.isExactMatch(title, artist, songTitle, songArtist),
          confidence: this.calculateConfidence(title, artist, songTitle, songArtist),
        };
        return searchResult;
      });
      
      console.log(`🎯 Search results:`, results.map(r => `${r.title} - ${r.artist} (confidence: ${r.confidence.toFixed(2)})`));
      return results;
    } catch (error) {
      console.error(`❌ Song search failed for "${title} - ${artist}":`, error);
      return [];
    }
  }

  private cleanSearchQuery(text: string): string {
    return text
      .replace(/\(feat\.[^)]*\)/gi, '') // (feat. ...) 제거
      .replace(/\(ft\.[^)]*\)/gi, '')   // (ft. ...) 제거  
      .replace(/feat\.[^,\-]*/gi, '')   // feat. ... 제거
      .replace(/ft\.[^,\-]*/gi, '')     // ft. ... 제거
      .replace(/\$ave/g, 'Save')        // $ave -> Save
      .replace(/[^\w\s\-'가-힣]/g, '')  // 특수문자 제거 (하이픈, 아포스트로피, 한글 제외)
      .replace(/\s+/g, ' ')             // 다중 공백 정리
      .trim();
  }

  async createPlaylist(name: string, description?: string): Promise<string> {
    await this.ensureInitialized();
    
    // 인증 상태 확인
    if (!this.musicKit?.isAuthorized) {
      throw new Error('User is not authorized. Please authorize first.');
    }

    // 사용자 토큰 확인
    const userToken = this.musicKit.musicUserToken;
    if (!userToken) {
      throw new Error('No user token available. Please re-authorize.');
    }

    try {
      console.log('🔑 Creating playlist with user token:', userToken ? 'Available' : 'Missing');
      
      // Apple Music API를 직접 호출하여 플레이리스트 생성
      const requestBody = {
        attributes: {
          name,
          description: description || `Created by YouTube to Music on ${new Date().toLocaleDateString()}`,
        },
      };

      // MusicKit v1 API를 사용하여 직접 POST 요청
      const response = await fetch('https://api.music.apple.com/v1/me/library/playlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN}`,
          'Music-User-Token': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Playlist creation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Playlist creation error response:', errorText);
        throw new Error(`Playlist creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Playlist creation response:', data);
      
      if (!data.data?.[0]?.id) {
        throw new Error('Failed to create playlist - invalid response');
      }

      const playlistId = data.data[0].id;
      console.log('✅ Playlist created successfully:', name, 'ID:', playlistId);
      return playlistId;
    } catch (error) {
      console.error('❌ Playlist creation failed:', error);
      throw error;
    }
  }

  async addSongsToPlaylist(
    playlistId: string, 
    tracks: MusicTrack[], 
    onProgress?: (current: number, total: number, currentTrack?: string) => void
  ): Promise<PlaylistCreationResult> {
    await this.ensureInitialized();
    
    // 인증 상태 확인
    if (!this.musicKit?.isAuthorized) {
      throw new Error('User is not authorized. Please authorize first.');
    }

    const userToken = this.musicKit.musicUserToken;
    if (!userToken) {
      throw new Error('No user token available. Please re-authorize.');
    }

    console.log('🎵 Adding songs to playlist:', playlistId);
    console.log('📋 Tracks to process:', tracks);

    const result: PlaylistCreationResult = {
      success: false,
      addedSongs: 0,
      failedSongs: [],
    };

    try {
      const foundSongs: string[] = [];
      
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        console.log(`🎶 Processing track ${i + 1}/${tracks.length}:`, track);
        onProgress?.(i + 1, tracks.length, `${track.title} - ${track.artist}`);

        try {
          const searchResults = await this.searchSong(track.title, track.artist);
          const bestMatch = searchResults.find(song => song.isExact) || searchResults[0];
          
          if (bestMatch) {
            console.log(`✅ Found match for "${track.title} - ${track.artist}":`, bestMatch);
            foundSongs.push(bestMatch.id);
            result.addedSongs++;
          } else {
            console.log(`❌ No match found for: "${track.title} - ${track.artist}"`);
            result.failedSongs.push(`${track.title} - ${track.artist}`);
          }

          // API 호출 제한을 위한 지연
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`❌ Failed to search for: ${track.title} - ${track.artist}`, error);
          result.failedSongs.push(`${track.title} - ${track.artist}`);
        }
      }

      console.log(`🎯 Search complete: ${foundSongs.length} matches found out of ${tracks.length} tracks`);

      if (foundSongs.length > 0) {
        // 플레이리스트에 노래 추가
        const tracks = foundSongs.map(id => ({
          id,
          type: 'songs',
        }));

        const response = await fetch(`https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN}`,
            'Music-User-Token': userToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: tracks,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Add songs error response:', errorText);
          throw new Error(`Failed to add songs to playlist: ${response.status} ${response.statusText} - ${errorText}`);
        }

        console.log(`✅ Added ${foundSongs.length} songs to playlist`);
      }

      result.success = result.addedSongs > 0;
      result.playlistId = playlistId;

      return result;
    } catch (error) {
      console.error('❌ Failed to add songs to playlist:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  async addSongsToLibrary(songIds: string[]): Promise<boolean> {
    await this.ensureInitialized();
    
    // 인증 상태 확인
    if (!this.musicKit?.isAuthorized) {
      throw new Error('User is not authorized. Please authorize first.');
    }

    const userToken = this.musicKit.musicUserToken;
    if (!userToken) {
      throw new Error('No user token available. Please re-authorize.');
    }
    
    try {
      const response = await fetch('https://api.music.apple.com/v1/me/library', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN}`,
          'Music-User-Token': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: songIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Add to library error response:', errorText);
        throw new Error(`Failed to add songs to library: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`✅ Added ${songIds.length} songs to library`);
      return true;
    } catch (error) {
      console.error('❌ Failed to add songs to library:', error);
      return false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Failed to initialize MusicKit');
      }
    }
  }

  private async waitForMusicKit(): Promise<void> {
    return new Promise((resolve, reject) => {
      // MusicKit이 이미 로드되어 있으면 즉시 반환
      if (window.MusicKit) {
        resolve();
        return;
      }

      // 최대 10초 대기
      const timeout = setTimeout(() => {
        reject(new Error('MusicKit JS library failed to load within 10 seconds'));
      }, 10000);

      // MusicKit 로드 확인 (100ms마다)
      const checkInterval = setInterval(() => {
        if (window.MusicKit) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        }
      }, 100);
    });
  }

  private isExactMatch(searchTitle: string, searchArtist: string, resultTitle: string, resultArtist: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const titleMatch = normalize(searchTitle) === normalize(resultTitle);
    const artistMatch = normalize(searchArtist) === normalize(resultArtist);
    
    return titleMatch && artistMatch;
  }

  private calculateConfidence(searchTitle: string, searchArtist: string, resultTitle: string, resultArtist: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const titleSimilarity = this.stringSimilarity(normalize(searchTitle), normalize(resultTitle));
    const artistSimilarity = this.stringSimilarity(normalize(searchArtist), normalize(resultArtist));
    
    return (titleSimilarity + artistSimilarity) / 2;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
} 