// YouTube API 기본 타입들
export interface YouTubeApiResponse<T> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
}

// 댓글 관련 타입들
export interface CommentSnippet {
  authorDisplayName: string;
  authorProfileImageUrl: string;
  authorChannelUrl?: string;
  authorChannelId?: {
    value: string;
  };
  videoId: string;
  textDisplay: string;
  textOriginal: string;
  canRate: boolean;
  totalReplyCount: number;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
}

export interface CommentThread {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    channelId?: string;
    videoId: string;
    topLevelComment: {
      kind: string;
      etag: string;
      id: string;
      snippet: CommentSnippet;
    };
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
  replies?: {
    comments: Comment[];
  };
}

export interface Comment {
  kind: string;
  etag: string;
  id: string;
  snippet: CommentSnippet;
}

// 비디오 관련 타입들
export interface VideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
  channelTitle: string;
  tags?: string[];
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage?: string;
  localized: {
    title: string;
    description: string;
  };
}

export interface Video {
  kind: string;
  etag: string;
  id: string;
  snippet: VideoSnippet;
}

// 유틸리티 타입들
export type CommentThreadsResponse = YouTubeApiResponse<CommentThread>;
export type VideosResponse = YouTubeApiResponse<Video>;

// 애플리케이션 내부 타입들
export interface PinnedComment {
  id: string;
  author: {
    name: string;
    profileImage: string;
    channelUrl?: string;
  };
  content: {
    text: string;
    originalText: string;
  };
  engagement: {
    likeCount: number;
    replyCount: number;
  };
  timestamps: {
    publishedAt: string;
    updatedAt: string;
  };
  videoId: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

// 에러 타입들
export interface YouTubeApiError {
  code: number;
  message: string;
  errors: Array<{
    message: string;
    domain: string;
    reason: string;
  }>;
}

// 플레이리스트 관련 타입들
export interface PlaylistSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
  channelTitle: string;
  defaultLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
}

export interface Playlist {
  kind: string;
  etag: string;
  id: string;
  snippet: PlaylistSnippet;
  status?: {
    privacyStatus: string;
  };
  contentDetails?: {
    itemCount: number;
  };
}

export interface PlaylistItemSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: {
    kind: string;
    videoId: string;
  };
}

export interface PlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: PlaylistItemSnippet;
  contentDetails?: {
    videoId: string;
    startAt?: string;
    endAt?: string;
    note?: string;
    videoPublishedAt: string;
  };
} 