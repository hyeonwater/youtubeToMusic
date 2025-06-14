// 애플리케이션 상태 타입들
export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: string;
}

export interface PaginationState {
  currentPage: number;
  hasNextPage: boolean;
  nextPageToken?: string;
  totalResults: number;
}

// UI 상태 타입들
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  modalOpen: boolean;
}

// 폼 관련 타입들
export interface YouTubeUrlForm {
  url: string;
  isValid: boolean;
  videoId?: string;
}

export interface SearchFilters {
  order: 'time' | 'relevance' | 'rating';
  textFormat: 'html' | 'plainText';
  maxResults: number;
}

// 에러 타입들
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

// 이벤트 타입들
export interface SearchEvent {
  query: string;
  filters: SearchFilters;
  timestamp: Date;
}

export interface CommentFetchEvent {
  videoId: string;
  pageToken?: string;
  timestamp: Date;
}

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 응답 상태 타입들
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> extends LoadingState {
  data?: T;
  status: RequestStatus;
  lastFetched?: Date;
} 