import { create } from 'zustand';
import type { MusicTrack } from '../../shared/utils/musicParser';
import type { 
  YouTubeMusicAuthState, 
  YouTubeMusicPlaylistResult,
  YouTubeMusicSearchResult 
} from '../../shared/types/youtubeMusic';
import { YouTubeMusicService } from '../../domain/services/YouTubeMusicService';
import { YouTubeMusicRepository } from '../../infrastructure/repositories/YouTubeMusicRepository';

interface YouTubeMusicStore {
  // State
  authState: YouTubeMusicAuthState;
  isInitialized: boolean;
  isCreatingPlaylist: boolean;
  creationProgress: {
    current: number;
    total: number;
    currentTrack?: string;
  };
  lastCreationResult: YouTubeMusicPlaylistResult | null;
  searchResults: Map<string, YouTubeMusicSearchResult[]>;

  // Services
  youtubeMusicService: YouTubeMusicService;

  // Actions
  initialize: () => Promise<boolean>;
  authorize: () => Promise<boolean>;
  unauthorize: () => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;
  createPlaylistWithTracks: (
    playlistName: string,
    tracks: MusicTrack[],
    description?: string
  ) => Promise<YouTubeMusicPlaylistResult>;
  searchTracks: (tracks: MusicTrack[]) => Promise<void>;
  clearResults: () => void;
  setCreationProgress: (current: number, total: number, currentTrack?: string) => void;
}

// YouTube Music Service 인스턴스 생성
const youtubeMusicRepository = new YouTubeMusicRepository();
const youtubeMusicService = new YouTubeMusicService(youtubeMusicRepository);

export const useYouTubeMusicStore = create<YouTubeMusicStore>((set, get) => ({
  // Initial State
  authState: {
    isAuthorized: false,
    isLoading: false,
    error: null,
    hasCredentials: false,
  },
  isInitialized: false,
  isCreatingPlaylist: false,
  creationProgress: {
    current: 0,
    total: 0
  },
  lastCreationResult: null,
  searchResults: new Map(),

  // Services
  youtubeMusicService,

  // Actions
  initialize: async () => {
    try {
      set(state => ({
        authState: { ...state.authState, isLoading: true, error: null }
      }));

      const success = await youtubeMusicService.initialize();
      const authState = youtubeMusicService.getAuthState();

      set({
        isInitialized: success,
        authState
      });

      return success;
    } catch (error) {
      set(state => ({
        authState: {
          ...state.authState,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }
      }));
      return false;
    }
  },

  authorize: async () => {
    try {
      set(state => ({
        authState: { ...state.authState, isLoading: true, error: null }
      }));

      const success = await youtubeMusicService.authorize();
      const authState = youtubeMusicService.getAuthState();

      set({ authState });
      return success;
    } catch (error) {
      set(state => ({
        authState: {
          ...state.authState,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authorization failed'
        }
      }));
      return false;
    }
  },

  unauthorize: async () => {
    try {
      await youtubeMusicService.unauthorize();
      const authState = youtubeMusicService.getAuthState();
      
      set({ 
        authState,
        searchResults: new Map(),
        lastCreationResult: null
      });
    } catch (error) {
      console.error('YouTube Music logout failed:', error);
    }
  },

  handleOAuthCallback: async () => {
    try {
      set(state => ({
        authState: { ...state.authState, isLoading: true, error: null }
      }));

      // OAuth 코드를 액세스 토큰으로 교환
      await youtubeMusicRepository.handleOAuthCallback();
      const authState = youtubeMusicService.getAuthState();

      set({ authState });
    } catch (error) {
      set(state => ({
        authState: {
          ...state.authState,
          isLoading: false,
          error: error instanceof Error ? error.message : 'OAuth callback failed'
        }
      }));
      throw error;
    }
  },

  createPlaylistWithTracks: async (
    playlistName: string,
    tracks: MusicTrack[],
    description?: string
  ) => {
    set({ 
      isCreatingPlaylist: true,
      creationProgress: { current: 0, total: tracks.length }
    });

    try {
      const result = await youtubeMusicService.createPlaylistWithSongs(
        playlistName,
        tracks,
        description,
        (current, total, currentTrack) => {
          get().setCreationProgress(current, total, currentTrack);
        }
      );

      set({ 
        lastCreationResult: result,
        isCreatingPlaylist: false,
        creationProgress: { current: 0, total: 0 }
      });

      return result;
    } catch (error) {
      const errorResult: YouTubeMusicPlaylistResult = {
        success: false,
        addedSongs: 0,
        failedSongs: tracks.map(t => `${t.title} - ${t.artist}`),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      set({ 
        lastCreationResult: errorResult,
        isCreatingPlaylist: false,
        creationProgress: { current: 0, total: 0 }
      });

      return errorResult;
    }
  },

  searchTracks: async (tracks: MusicTrack[]) => {
    try {
      const results = await youtubeMusicService.searchMultipleSongs(tracks);
      set({ searchResults: results });
    } catch (error) {
      console.error('YouTube Music track search failed:', error);
    }
  },

  clearResults: () => {
    set({
      searchResults: new Map(),
      lastCreationResult: null,
      creationProgress: { current: 0, total: 0 }
    });
  },

  setCreationProgress: (current: number, total: number, currentTrack?: string) => {
    set({
      creationProgress: { current, total, currentTrack }
    });
  }
})); 