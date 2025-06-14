import { Video } from '../entities/Video';
import type { VideoSummary } from '../entities/Video';

export interface VideoRepository {
  /**
   * 비디오 ID로 비디오 정보를 가져옵니다.
   */
  getVideoById(videoId: string): Promise<Video | null>;

  /**
   * 여러 비디오 ID로 비디오 정보를 일괄 가져옵니다.
   */
  getVideosByIds(videoIds: string[]): Promise<Video[]>;

  /**
   * 비디오 요약 정보를 가져옵니다.
   */
  getVideoSummary(videoId: string): Promise<VideoSummary | null>;

  /**
   * 비디오 존재 여부를 확인합니다.
   */
  checkVideoExists(videoId: string): Promise<boolean>;

  /**
   * 비디오 메타데이터를 가져옵니다.
   */
  getVideoMetadata(videoId: string): Promise<VideoMetadata | null>;
}

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  thumbnailUrl: string;
  tags: string[];
  category?: string;
  language?: string;
  availability: VideoAvailability;
}

export interface VideoAvailability {
  isPublic: boolean;
  isEmbeddable: boolean;
  hasComments: boolean;
  region?: string[];
}

export interface VideoSearchOptions {
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'viewCount';
  publishedAfter?: string;
  publishedBefore?: string;
  regionCode?: string;
  safeSearch?: 'none' | 'moderate' | 'strict';
}

export interface VideoListResult {
  videos: Video[];
  nextPageToken?: string;
  totalResults: number;
} 