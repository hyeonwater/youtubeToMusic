import type { MusicServiceAuthState, MusicServiceSearchResult, PlaylistCreationResult } from './musicService';

export interface YouTubeMusicAuthState extends MusicServiceAuthState {
  hasCredentials: boolean;
}

export interface YouTubeMusicSearchResult extends MusicServiceSearchResult {
  videoId: string;
  albumName?: string;
  thumbnailUrl?: string;
  duration?: string;
}

export interface YouTubeMusicPlaylistResult extends PlaylistCreationResult {
  playlistUrl?: string;
}

// YouTube Music API 응답 타입들
export interface YTMusicSearchResponse {
  category: string;
  contents: YTMusicSearchItem[];
}

export interface YTMusicSearchItem {
  musicTwoRowItemRenderer?: {
    title: {
      runs: Array<{ text: string }>;
    };
    subtitle: {
      runs: Array<{ text: string }>;
    };
    navigationEndpoint: {
      watchEndpoint?: {
        videoId: string;
      };
    };
    thumbnailRenderer: {
      musicThumbnailRenderer: {
        thumbnail: {
          thumbnails: Array<{
            url: string;
            width: number;
            height: number;
          }>;
        };
      };
    };
  };
}

export interface YTMusicPlaylistCreateResponse {
  playlistId: string;
  status: string;
}

export interface YTMusicCredentials {
  cookie?: string;
  headers?: Record<string, string>;
  accessToken?: string;
  refreshToken?: string;
} 