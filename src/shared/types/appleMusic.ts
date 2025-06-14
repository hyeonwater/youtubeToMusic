// Apple Music API 및 MusicKit JS 타입 정의

declare global {
  interface Window {
    MusicKit?: {
      getInstance: () => MusicKitInstance | undefined;
      configure: (config: MusicKitConfig) => Promise<MusicKitInstance>;
    };
  }
}

export interface MusicKitConfig {
  developerToken: string;
  app: {
    name: string;
    build: string;
  };
  suppressErrorDialog?: boolean;
  bitrate?: number;
}

export interface MusicKitInstance {
  configure(options: MusicKitConfig): Promise<MusicKitInstance>;
  authorize(): Promise<string>;
  unauthorize(): Promise<void>;
  api: {
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    library: {
      playlists: {
        create?: (options: any) => Promise<any>; // 일부 환경에서 사용 불가능할 수 있음
      };
    };
  };
  isAuthorized: boolean;
  musicUserToken?: string;
  storefrontId?: string; // 사용자 지역 정보
  user?: MusicKitUser;
}

export interface MusicKitUser {
  isAuthorized: boolean;
  storefront: string;
}

export interface MusicKitAPI {
  search: (searchTerm: string, options?: SearchOptions) => Promise<SearchResponse>;
  addToLibrary: (ids: { songs?: string[]; albums?: string[]; playlists?: string[] }) => Promise<void>;
  library: {
    playlists: {
      create: (attributes: PlaylistAttributes) => Promise<CreatePlaylistResponse>;
      addTracks: (playlistId: string, songs: Song[]) => Promise<void>;
    };
  };
}

export interface SearchOptions {
  types?: string[];
  limit?: number;
  offset?: number;
  include?: string[]; // 관련 데이터 포함 옵션
  storefront?: string; // 지역 설정 옵션
}

export interface SearchResponse {
  results: {
    songs?: {
      data: Song[];
      href?: string;
      next?: string;
    };
    albums?: {
      data: Album[];
      href?: string;
      next?: string;
    };
    artists?: {
      data: Artist[];
      href?: string;
      next?: string;
    };
  };
}

export interface Song {
  id: string;
  type: 'songs';
  href: string;
  attributes: SongAttributes;
  relationships?: {
    artists: {
      data: Artist[];
    };
    albums: {
      data: Album[];
    };
  };
}

export interface SongAttributes {
  name: string;
  artistName: string;
  albumName: string;
  durationInMillis: number;
  playParams?: {
    id: string;
    kind: string;
  };
  artwork?: {
    width: number;
    height: number;
    url: string;
    bgColor?: string;
    textColor1?: string;
    textColor2?: string;
    textColor3?: string;
    textColor4?: string;
  };
  url?: string;
  previews?: Array<{
    url: string;
  }>;
}

export interface Album {
  id: string;
  type: 'albums';
  href: string;
  attributes: {
    name: string;
    artistName: string;
    artwork?: {
      width: number;
      height: number;
      url: string;
    };
  };
}

export interface Artist {
  id: string;
  type: 'artists';
  href: string;
  attributes: {
    name: string;
  };
}

export interface PlaylistAttributes {
  name: string;
  description?: string;
}

export interface CreatePlaylistResponse {
  data: Array<{
    id: string;
    type: 'library-playlists';
    href: string;
    attributes: PlaylistAttributes;
  }>;
}

// 우리 애플리케이션에서 사용할 타입들
export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  isExact: boolean;
  confidence: number;
}

export interface PlaylistCreationResult {
  success: boolean;
  playlistId?: string;
  playlistName?: string;
  addedSongs: number;
  failedSongs: string[];
  error?: string;
}

export interface AppleMusicAuthState {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  userToken?: string;
  storefront?: string;
} 