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
      
      let searchResults: MusicSearchResult[] = [];
      
      // Unknown Artist인 경우 특별 처리
      if (cleanArtist === 'Unknown Artist' || cleanArtist.toLowerCase().includes('unknown')) {
        console.log(`🔍 Special handling for Unknown Artist: searching by title only`);
        
        // 1차: 제목만으로 검색
        const titleOnlyResults = await this.searchByTitle(cleanTitle);
        searchResults.push(...titleOnlyResults);
        
        // 2차: 제목에서 특별한 패턴 추출하여 검색
        const enhancedResults = await this.searchWithTitleAnalysis(cleanTitle);
        searchResults.push(...enhancedResults);
        
      } else {
        // 일반적인 경우: 제목과 아티스트를 함께 검색
        const query = `${cleanTitle} ${cleanArtist}`.trim();
        console.log(`🔍 Searching for: "${query}"`);
        
        const response = await this.musicKit?.api.search(query, {
          types: ['songs'],
          limit: 10,
        });

        const results = await this.processSearchResponse(response, title, artist);
        searchResults.push(...results);
      }
      
      // 중복 제거 및 정렬
      const uniqueResults = this.removeDuplicateResults(searchResults);
      console.log(`🎯 Final search results:`, uniqueResults.map(r => `${r.title} - ${r.artist} (confidence: ${r.confidence.toFixed(2)})`));
      
      return uniqueResults;
    } catch (error) {
      console.error(`❌ Song search failed for "${title} - ${artist}":`, error);
      return [];
    }
  }

  private async searchByTitle(title: string): Promise<MusicSearchResult[]> {
    try {
      console.log(`🎵 Searching by title only: "${title}"`);
      
      const response = await this.musicKit?.api.search(title, {
        types: ['songs'],
        limit: 15, // 제목만으로 검색할 때는 더 많은 결과 필요
      });

      return await this.processSearchResponse(response, title, 'Unknown Artist');
    } catch (error) {
      console.error(`❌ Title-only search failed for "${title}":`, error);
      return [];
    }
  }

  private async searchWithTitleAnalysis(title: string): Promise<MusicSearchResult[]> {
    const results: MusicSearchResult[] = [];
    
    try {
      // 향상된 검색어 생성
      const searchQueries = this.enhanceSearchQuery(title);
      console.log(`🔍 Enhanced search queries:`, searchQueries);
      
      // 각 검색어로 검색 수행
      for (const query of searchQueries) {
        if (query !== title) { // 기본 검색은 이미 수행했으므로 스킵
          console.log(`🔍 Searching with enhanced query: "${query}"`);
          const queryResults = await this.searchByTitle(query);
          results.push(...queryResults);
          
          // API 호출 제한을 위한 짧은 지연
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Title analysis search failed:`, error);
      return [];
    }
  }

  private async processSearchResponse(response: any, originalTitle: string, originalArtist: string): Promise<MusicSearchResult[]> {
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
      console.log(`❌ No songs found for search`);
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
        isExact: this.isExactMatch(originalTitle, originalArtist, songTitle, songArtist),
        confidence: this.calculateConfidence(originalTitle, originalArtist, songTitle, songArtist),
      };
      return searchResult;
    });
    
    return results;
  }

  private removeDuplicateResults(results: MusicSearchResult[]): MusicSearchResult[] {
    const seen = new Set<string>();
    const uniqueResults: MusicSearchResult[] = [];
    
    for (const result of results) {
      const key = `${result.id}-${result.title}-${result.artist}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push(result);
      }
    }
    
    // 신뢰도 순으로 정렬
    return uniqueResults.sort((a, b) => {
      if (a.isExact && !b.isExact) return -1;
      if (!a.isExact && b.isExact) return 1;
      return b.confidence - a.confidence;
    });
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

  private enhanceSearchQuery(title: string): string[] {
    const queries: string[] = [];
    
    // 기본 검색어
    queries.push(title);
    
    // 잘 알려진 노래들을 위한 특별 매핑
    const knownSongs: { [key: string]: string[] } = {
      'until i found you': [
        'Until I Found You Stephen Sanchez',
        'Stephen Sanchez Until I Found You',
        'Until I Found You'
      ],
      'strawberries cigarettes': [
        'strawberries & cigarettes Troye Sivan',
        'Troye Sivan strawberries cigarettes',
        'strawberries and cigarettes'
      ],
      'fools cant help falling in love': [
        'fools cant help falling in love Elvis Presley',
        'cant help falling in love Elvis',
        'fools falling in love'
      ],
      'just the two of us': [
        'Just the Two of Us Bill Withers',
        'Just the Two of Us Grover Washington',
        'Bill Withers Just the Two of Us'
      ]
    };
    
    const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // 매핑된 검색어가 있으면 추가
    for (const [key, searches] of Object.entries(knownSongs)) {
      if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        queries.push(...searches);
        break;
      }
    }
    
    // 괄호 제거 버전
    const withoutParentheses = title.replace(/\([^)]*\)/g, '').trim();
    if (withoutParentheses !== title && withoutParentheses.length > 2) {
      queries.push(withoutParentheses);
    }
    
    // 특수문자 제거 버전
    const simplified = title
      .replace(/[&$]/g, 'and')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (simplified !== title && simplified.length > 2) {
      queries.push(simplified);
    }
    
    return [...new Set(queries)]; // 중복 제거
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
          
          // 검색에 사용된 클리닝된 제목과 아티스트 추출
          const cleanedTitle = this.cleanSearchQuery(track.title);
          const cleanedArtist = this.cleanSearchQuery(track.artist);
          
          // 단순한 매칭 로직: 제목과 아티스트가 포함되어 있으면 매치로 간주
          const bestMatch = this.findBestSimpleMatch(cleanedTitle, cleanedArtist, searchResults);
          
          if (bestMatch) {
            console.log(`✅ Found match for "${track.title} - ${track.artist}":`, bestMatch);
            foundSongs.push(bestMatch.id);
            result.addedSongs++;
          } else {
            console.log(`❌ No reliable match found for: "${track.title} - ${track.artist}" (best confidence: ${searchResults[0]?.confidence?.toFixed(2) || 'N/A'})`);
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
    
    const normalizedSearchTitle = normalize(searchTitle);
    const normalizedSearchArtist = normalize(searchArtist);
    const normalizedResultTitle = normalize(resultTitle);
    const normalizedResultArtist = normalize(resultArtist);
    
    // Unknown Artist인 경우 제목만 비교
    if (normalizedSearchArtist === 'unknown artist' || normalizedSearchArtist.includes('unknown')) {
      return normalizedSearchTitle === normalizedResultTitle ||
             normalizedResultTitle.includes(normalizedSearchTitle) ||
             normalizedSearchTitle.includes(normalizedResultTitle);
    }
    
    // 정확한 매치
    const exactTitleMatch = normalizedSearchTitle === normalizedResultTitle;
    const exactArtistMatch = normalizedSearchArtist === normalizedResultArtist;
    
    // 포함 관계 매치 (아티스트가 결과에 포함되거나 그 반대)
    const artistIncluded = normalizedResultArtist.includes(normalizedSearchArtist) || 
                          normalizedSearchArtist.includes(normalizedResultArtist);
    
    // 제목이 정확하고 아티스트가 포함관계이면 정확한 매치로 간주
    return (exactTitleMatch && exactArtistMatch) || 
           (exactTitleMatch && artistIncluded) ||
           (normalizedSearchTitle.includes(normalizedResultTitle) && exactArtistMatch);
  }

  private calculateConfidence(searchTitle: string, searchArtist: string, resultTitle: string, resultArtist: string): number {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const normalizedSearchTitle = normalize(searchTitle);
    const normalizedSearchArtist = normalize(searchArtist);
    const normalizedResultTitle = normalize(resultTitle);
    const normalizedResultArtist = normalize(resultArtist);
    
    // Unknown Artist인 경우 제목 중심 매칭
    if (normalizedSearchArtist === 'unknown artist' || normalizedSearchArtist.includes('unknown')) {
      console.log(`🎯 Calculating confidence for Unknown Artist case`);
      
      // 정확한 제목 매치
      if (normalizedSearchTitle === normalizedResultTitle) {
        return 0.95; // 거의 정확한 매치
      }
      
      // 포함 관계 확인
      if (normalizedResultTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedResultTitle)) {
        const includeRatio = Math.min(normalizedSearchTitle.length, normalizedResultTitle.length) / 
                            Math.max(normalizedSearchTitle.length, normalizedResultTitle.length);
        return Math.max(0.8, includeRatio * 0.9);
      }
      
      // 제목 유사도만 계산
      const titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
      
      // 높은 유사도는 좋은 매치
      if (titleSimilarity >= 0.8) {
        return titleSimilarity * 0.9; // Unknown Artist이므로 약간 낮춤
      }
      
      return titleSimilarity * 0.7; // 기본 제목 유사도
    }
    
    // 기존 로직 (아티스트 정보가 있는 경우)
    // 정확한 매치 확인 (더 관대하게)
    const exactTitleMatch = normalizedSearchTitle === normalizedResultTitle;
    const exactArtistMatch = normalizedSearchArtist === normalizedResultArtist;
    
    // 제목 포함관계 확인
    const titleContains = normalizedResultTitle.includes(normalizedSearchTitle) || 
                         normalizedSearchTitle.includes(normalizedResultTitle);
    
    // 아티스트 포함관계 확인  
    const artistContains = normalizedResultArtist.includes(normalizedSearchArtist) || 
                          normalizedSearchArtist.includes(normalizedResultArtist);
    
    // 정확한 매치인 경우 최고 점수
    if (exactTitleMatch && exactArtistMatch) {
      return 1.0;
    }
    
    // 제목 정확 + 아티스트 포함 = 정확한 매치로 간주
    if (exactTitleMatch && artistContains) {
      return 1.0;
    }
    
    // 아티스트 정확 + 제목 포함 = 정확한 매치로 간주  
    if (exactArtistMatch && titleContains) {
      return 1.0;
    }
    
    // 제목 유사도 계산
    let titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
    
    // 제목 포함관계 확인 (더 관대하게)
    if (normalizedResultTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedResultTitle)) {
      titleSimilarity = Math.max(titleSimilarity, 0.9);
    }
    
    // 아티스트 유사도 계산
    let artistSimilarity = this.stringSimilarity(normalizedSearchArtist, normalizedResultArtist);
    
    // 아티스트 포함관계 확인 (더 관대하게)
    if (normalizedResultArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(normalizedResultArtist)) {
      artistSimilarity = Math.max(artistSimilarity, 0.95);
    }
    
    // 특별한 경우들 처리
    
    // 1. 제목이 정확하고 아티스트가 포함관계인 경우
    if (exactTitleMatch && artistSimilarity >= 0.9) {
      return 1.0;
    }
    
    // 2. 아티스트가 정확하고 제목이 포함관계인 경우
    if (exactArtistMatch && titleSimilarity >= 0.9) {
      return 1.0;
    }
    
    // 3. 둘 다 높은 유사도인 경우
    if (titleSimilarity >= 0.8 && artistSimilarity >= 0.8) {
      return Math.min((titleSimilarity * 0.6 + artistSimilarity * 0.4) + 0.1, 1.0);
    }
    
    // 4. 제목이 매우 유사한 경우
    if (titleSimilarity >= 0.9) {
      return titleSimilarity * 0.7 + artistSimilarity * 0.3;
    }
    
    // 5. 아티스트가 매우 유사한 경우
    if (artistSimilarity >= 0.9) {
      return titleSimilarity * 0.5 + artistSimilarity * 0.5;
    }
    
    // 기본 가중 평균
    return titleSimilarity * 0.6 + artistSimilarity * 0.4;
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

  private findBestSimpleMatch(searchTitle: string, searchArtist: string, searchResults: MusicSearchResult[]): MusicSearchResult | undefined {
    if (!searchResults || searchResults.length === 0) {
      return undefined;
    }

    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    const normalizedSearchTitle = normalize(searchTitle);
    const normalizedSearchArtist = normalize(searchArtist);
    
    // 언어 차이 감지 함수
    const hasLanguageMismatch = (searchText: string, resultText: string): boolean => {
      // 영어 vs 한국어/중국어/일본어 문자 패턴 체크
      const searchHasEnglish = /[a-zA-Z]/.test(searchText);
      const searchHasAsian = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(searchText);
      const resultHasEnglish = /[a-zA-Z]/.test(resultText);
      const resultHasAsian = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(resultText);
      
      // 검색어가 주로 영어인데 결과가 주로 아시아 문자이거나, 그 반대인 경우만 불일치로 판단
      const searchIsMainlyEnglish = searchHasEnglish && !searchHasAsian;
      const searchIsMainlyAsian = searchHasAsian && !searchHasEnglish;
      const resultIsMainlyEnglish = resultHasEnglish && !resultHasAsian;
      const resultIsMainlyAsian = resultHasAsian && !resultHasEnglish;
      
      return (searchIsMainlyEnglish && resultIsMainlyAsian) || 
             (searchIsMainlyAsian && resultIsMainlyEnglish);
    };
    
    // Unknown Artist인 경우 특별 처리
    if (normalizedSearchArtist === 'unknown artist' || normalizedSearchArtist.includes('unknown')) {
      console.log(`🎯 Special matching for Unknown Artist: ${searchTitle}`);
      
      // 1순위: 제목이 정확히 일치
      for (const result of searchResults) {
        const normalizedResultTitle = normalize(result.title);
        
        if (normalizedSearchTitle === normalizedResultTitle) {
          console.log(`🎯 Found exact title match for Unknown Artist: ${result.title} - ${result.artist}`);
          return result;
        }
      }
      
      // 2순위: 제목이 포함관계
      for (const result of searchResults) {
        const normalizedResultTitle = normalize(result.title);
        
        if (normalizedResultTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedResultTitle)) {
          console.log(`🎯 Found title contains match for Unknown Artist: ${result.title} - ${result.artist}`);
          return result;
        }
      }
      
      // 3순위: 높은 제목 유사도
      for (const result of searchResults) {
        const normalizedResultTitle = normalize(result.title);
        const titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
        
        if (titleSimilarity >= 0.8) {
          console.log(`🎯 Found high similarity match for Unknown Artist: ${result.title} - ${result.artist} (similarity: ${titleSimilarity.toFixed(2)})`);
          return result;
        }
      }
      
      // 4순위: 적당한 제목 유사도
      for (const result of searchResults) {
        const normalizedResultTitle = normalize(result.title);
        const titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
        
        if (titleSimilarity >= 0.6) {
          console.log(`🎯 Found moderate similarity match for Unknown Artist: ${result.title} - ${result.artist} (similarity: ${titleSimilarity.toFixed(2)})`);
          return result;
        }
      }
      
      // 5순위: 최고 점수 결과 반환
      if (searchResults.length > 0) {
        const bestResult = searchResults[0];
        console.log(`🎯 Returning best available match for Unknown Artist: ${bestResult.title} - ${bestResult.artist}`);
        return bestResult;
      }
      
      console.log(`❌ No match found for Unknown Artist: ${searchTitle}`);
      return undefined;
    }
    
    // 기존 로직 (아티스트 정보가 있는 경우)
    // 1순위: 제목과 아티스트가 정확히 일치
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      if (normalizedSearchTitle === normalizedResultTitle && normalizedSearchArtist === normalizedResultArtist) {
        console.log(`🎯 Found exact match: ${result.title} - ${result.artist}`);
        return result;
      }
    }
    
    // 2순위: 제목이 정확히 일치하고 아티스트가 포함관계
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크 추가
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        console.log(`🚫 2nd priority - Language mismatch detected, skipping: ${result.title} - ${result.artist}`);
        continue;
      }
      
      const artistContains = normalizedResultArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(normalizedResultArtist);
      console.log(`🔍 2nd priority check: "${result.title}" - "${result.artist}"`);
      console.log(`   Title match: ${normalizedSearchTitle === normalizedResultTitle}`);
      console.log(`   Artist contains: ${artistContains} ("${normalizedSearchArtist}" vs "${normalizedResultArtist}")`);
      
      if (normalizedSearchTitle === normalizedResultTitle && artistContains) {
        console.log(`🎯 Found title exact + artist contains match: ${result.title} - ${result.artist}`);
        return result;
      }
    }
    
    // 3순위: 아티스트가 정확히 일치하고 제목이 포함관계
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크 추가
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        console.log(`🚫 3rd priority - Language mismatch detected, skipping: ${result.title} - ${result.artist}`);
        continue;
      }
      
      const titleContains = normalizedResultTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedResultTitle);
      console.log(`🔍 3rd priority check: "${result.title}" - "${result.artist}"`);
      console.log(`   Artist match: ${normalizedSearchArtist === normalizedResultArtist}`);
      console.log(`   Title contains: ${titleContains}`);
      
      if (normalizedSearchArtist === normalizedResultArtist && titleContains) {
        console.log(`🎯 Found artist exact + title contains match: ${result.title} - ${result.artist}`);
        return result;
      }
    }
    
    // 4순위: 제목과 아티스트 모두 포함관계 (단, 아티스트는 더 엄격하게 체크)
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크 - 제목이나 아티스트 중 하나라도 언어가 다르면 스킵
      const titleLanguageMismatch = hasLanguageMismatch(searchTitle, result.title);
      const artistLanguageMismatch = hasLanguageMismatch(searchArtist, result.artist);
      
      console.log(`🔍 Checking 4th priority match: ${result.title} - ${result.artist}`);
      console.log(`   Title language mismatch: ${titleLanguageMismatch}, Artist language mismatch: ${artistLanguageMismatch}`);
      
      if (titleLanguageMismatch || artistLanguageMismatch) {
        console.log(`🚫 Language mismatch detected, skipping: ${result.title} - ${result.artist}`);
        continue;
      }
      
      const titleContainsSearch = normalizedResultTitle.includes(normalizedSearchTitle);
      const searchContainsTitle = normalizedSearchTitle.includes(normalizedResultTitle);
      const titleMatch = titleContainsSearch || searchContainsTitle;
      
      console.log(`   Normalized search title: "${normalizedSearchTitle}"`);
      console.log(`   Normalized result title: "${normalizedResultTitle}"`);
      console.log(`   Title contains search: ${titleContainsSearch}, Search contains title: ${searchContainsTitle}`);
      
      // 아티스트 매칭을 더 엄격하게: 최소 50% 이상 유사도 또는 의미있는 포함관계
      const artistSimilarity = this.stringSimilarity(normalizedSearchArtist, normalizedResultArtist);
      const artistContains = normalizedResultArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(normalizedResultArtist);
      // 포함관계가 성립하고 검색어나 결과 중 하나가 충분히 길면 매치로 인정 (2글자로 완화)
      const artistMatch = artistSimilarity >= 0.5 || (artistContains && Math.max(normalizedSearchArtist.length, normalizedResultArtist.length) >= 2);
      
      console.log(`   Title match: ${titleMatch}, Artist match: ${artistMatch} (similarity: ${artistSimilarity.toFixed(2)}, contains: ${artistContains})`);
      
      if (titleMatch && artistMatch) {
        console.log(`🎯 Found both contains match: ${result.title} - ${result.artist} (artist similarity: ${artistSimilarity.toFixed(2)})`);
        return result;
      }
    }
    
    // 5순위: 관대한 매칭 - 제목이 매우 유사하고 아티스트가 유사
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        console.log(`🚫 Language mismatch detected, skipping: ${result.title} - ${result.artist}`);
        continue;
      }
      
      // 제목 유사도 체크 (최소 80% 유사)
      const titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
      const artistSimilarity = this.stringSimilarity(normalizedSearchArtist, normalizedResultArtist);
      
      if (titleSimilarity >= 0.8 && artistSimilarity >= 0.7) {
        console.log(`🎯 Found similarity match: ${result.title} - ${result.artist} (title: ${titleSimilarity.toFixed(2)}, artist: ${artistSimilarity.toFixed(2)})`);
        return result;
      }
    }
    
    // 6순위: 매우 관대한 매칭 - 제목만 정확하고 아티스트가 어느 정도 유사 (더 엄격하게)
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        console.log(`🚫 Language mismatch detected, skipping: ${result.title} - ${result.artist}`);
        continue;
      }
      
      if (normalizedSearchTitle === normalizedResultTitle) {
        const artistSimilarity = this.stringSimilarity(normalizedSearchArtist, normalizedResultArtist);
        // 아티스트 유사도를 60%로 상향 조정
        if (artistSimilarity >= 0.6) {
          console.log(`🎯 Found title exact + artist similar match: ${result.title} - ${result.artist} (artist similarity: ${artistSimilarity.toFixed(2)})`);
          return result;
        }
      }
    }
    
    // 7순위: 최후의 수단 - 아티스트만 정확하고 제목이 어느 정도 유사 (더 엄격하게)
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      if (normalizedSearchArtist === normalizedResultArtist) {
        const titleSimilarity = this.stringSimilarity(normalizedSearchTitle, normalizedResultTitle);
        // 제목 유사도를 70%로 상향 조정
        if (titleSimilarity >= 0.7) {
          console.log(`🎯 Found artist exact + title similar match: ${result.title} - ${result.artist} (title similarity: ${titleSimilarity.toFixed(2)})`);
          return result;
        }
      }
    }
    
    // 8순위: 매우 관대한 매칭 - 제목이 포함되고 아티스트가 강하게 유사
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedResultArtist = normalize(result.artist);
      
      // 언어 불일치 체크
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        continue;
      }
      
      const titleContainsSearch = normalizedResultTitle.includes(normalizedSearchTitle);
      const artistSimilarity = this.stringSimilarity(normalizedSearchArtist, normalizedResultArtist);
      const artistContains = normalizedResultArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(normalizedResultArtist);
      
      // 제목이 포함되고 아티스트 유사도가 높으면 매치
      if (titleContainsSearch && (artistSimilarity >= 0.4 || artistContains)) {
        console.log(`🎯 Found lenient title+artist match: ${result.title} - ${result.artist} (artist similarity: ${artistSimilarity.toFixed(2)})`);
        return result;
      }
    }
    
    // 9순위: 피처링 케이스 매칭 - 제목에 검색한 아티스트가 feat로 포함된 경우
    for (const result of searchResults) {
      const normalizedResultTitle = normalize(result.title);
      const normalizedSearchArtist = normalize(searchArtist);
      
      // 언어 불일치 체크
      if (hasLanguageMismatch(searchTitle, result.title) || hasLanguageMismatch(searchArtist, result.artist)) {
        continue;
      }
      
      // 제목이 검색 제목을 포함하고, 제목에 검색한 아티스트가 포함된 경우
      const titleContainsSearch = normalizedResultTitle.includes(normalize(searchTitle));
      const titleContainsArtist = normalizedResultTitle.includes(normalizedSearchArtist);
      
      // feat, featuring, ft 등의 패턴 체크
      const hasFeatPattern = /\b(feat|featuring|ft|with)\b/.test(result.title.toLowerCase());
      
      if (titleContainsSearch && titleContainsArtist && hasFeatPattern) {
        console.log(`🎯 Found featuring match: ${result.title} - ${result.artist} (artist "${searchArtist}" found in title)`);
        return result;
      }
    }
    
    console.log(`❌ No simple match found for: ${searchTitle} - ${searchArtist}`);
    return undefined;
  }
} 