import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LoadingState, UIState, YouTubeUrlForm, AppError } from '../../shared/types/app';

interface AppState {
  // URL and video state
  currentUrl: YouTubeUrlForm | null;
  currentVideoId: string | null;
  
  // Loading and error state
  loadingState: LoadingState;
  
  // UI state
  uiState: UIState;
  
  // Comments state
  pinnedComments: any[];
  commentsError: AppError | null;
}

interface AppStore extends AppState {
  // Actions
  setCurrentUrl: (url: YouTubeUrlForm | null) => void;
  setCurrentVideoId: (videoId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setPinnedComments: (comments: any[]) => void;
  setCommentsError: (error: AppError | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reset: () => void;
}

const initialState: AppState = {
  currentUrl: null,
  currentVideoId: null,
  loadingState: {
    isLoading: false,
    isError: false,
  },
  uiState: {
    theme: 'light',
    sidebarOpen: false,
    modalOpen: false,
  },
  pinnedComments: [],
  commentsError: null,
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setCurrentUrl: (url) => set({ currentUrl: url }),
      setCurrentVideoId: (videoId) => set({ currentVideoId: videoId }),
      setLoading: (loading) => set((state) => ({
        loadingState: { ...state.loadingState, isLoading: loading }
      })),
      setError: (error) => set((state) => ({
        loadingState: { 
          ...state.loadingState, 
          isError: !!error, 
          error: error || undefined 
        }
      })),
      clearError: () => set((state) => ({
        loadingState: { ...state.loadingState, isError: false, error: undefined }
      })),
      setPinnedComments: (comments) => set({ pinnedComments: comments }),
      setCommentsError: (error) => set({ commentsError: error }),
      toggleSidebar: () => set((state) => ({
        uiState: { ...state.uiState, sidebarOpen: !state.uiState.sidebarOpen }
      })),
      setTheme: (theme) => set((state) => ({
        uiState: { ...state.uiState, theme }
      })),
      reset: () => set(initialState),
    }),
    {
      name: 'app-store',
    }
  )
); 