import { create } from 'zustand';
import type { MusicTrack } from '../../shared/utils/musicParser';
import type { 
  AppleMusicAuthState, 
  PlaylistCreationResult,
  MusicSearchResult 
} from '../../shared/types/appleMusic';
import { AppleMusicService } from '../../domain/services/AppleMusicService';
import { MusicKitAppleMusicRepository } from '../../infrastructure/repositories/MusicKitAppleMusicRepository';

interface AppleMusicStore {
  // State
  authState: AppleMusicAuthState;
  isInitialized: boolean;
  isCreatingPlaylist: boolean;
  creationProgress: {
    current: number;
    total: number;
    currentTrack?: string;
  };
  lastCreationResult: PlaylistCreationResult | null;
  searchResults: Map<string, MusicSearchResult[]>;

  // Services
  appleMusicService: AppleMusicService;

  // Actions
  initialize: () => Promise<boolean>;
  authorize: () => Promise<boolean>;
  unauthorize: () => Promise<void>;
  createPlaylistWithTracks: (
    playlistName: string,
    tracks: MusicTrack[],
    description?: string
  ) => Promise<PlaylistCreationResult>;
  searchTracks: (tracks: MusicTrack[]) => Promise<void>;
  clearResults: () => void;
  setCreationProgress: (current: number, total: number, currentTrack?: string) => void;
}

// Apple Music Service 인스턴스 생성
const appleMusicRepository = new MusicKitAppleMusicRepository();
const appleMusicService = new AppleMusicService(appleMusicRepository);

export const useAppleMusicStore = create<AppleMusicStore>((set, get) => ({
  // Initial State
  authState: {
    isAuthorized: false,
    isLoading: false,
    error: null
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
  appleMusicService,

  // Actions
  initialize: async () => {
    try {
      set(state => ({
        authState: { ...state.authState, isLoading: true, error: null }
      }));

      const success = await appleMusicService.initialize();
      const authState = appleMusicService.getAuthState();

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

      const success = await appleMusicService.authorize();
      const authState = appleMusicService.getAuthState();

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
      await appleMusicService.unauthorize();
      const authState = appleMusicService.getAuthState();
      
      set({ 
        authState,
        searchResults: new Map(),
        lastCreationResult: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
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
      const result = await appleMusicService.createPlaylistWithSongs(
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
      const errorResult: PlaylistCreationResult = {
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
      const results = await appleMusicService.searchMultipleSongs(tracks);
      set({ searchResults: results });
    } catch (error) {
      console.error('Track search failed:', error);
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