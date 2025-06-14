import { Comment } from '../entities/Comment';
import type { SearchFilters } from '../../shared/types/app';

export interface CommentRepository {
  /**
   * 비디오의 댓글 스레드를 가져옵니다.
   */
  getCommentThreads(
    videoId: string,
    options?: CommentFetchOptions
  ): Promise<CommentThreadsResult>;

  /**
   * 비디오의 고정 댓글을 가져옵니다.
   */
  getPinnedComment(videoId: string): Promise<Comment | null>;

  /**
   * 특정 댓글의 답글을 가져옵니다.
   */
  getCommentReplies(
    commentId: string,
    options?: CommentFetchOptions
  ): Promise<CommentThreadsResult>;

  /**
   * 댓글을 검색합니다.
   */
  searchComments(
    videoId: string,
    searchTerm: string,
    options?: CommentSearchOptions
  ): Promise<Comment[]>;
}

export interface CommentFetchOptions {
  maxResults?: number;
  pageToken?: string;
  order?: 'time' | 'relevance' | 'rating';
  textFormat?: 'html' | 'plainText';
}

export interface CommentSearchOptions extends CommentFetchOptions {
  filters?: SearchFilters;
  includeReplies?: boolean;
}

export interface CommentThreadsResult {
  comments: Comment[];
  nextPageToken?: string;
  totalResults: number;
  hasMore: boolean;
}

export interface CommentAnalytics {
  totalComments: number;
  averageLikes: number;
  mostLikedComment: Comment | null;
  topAuthors: Array<{
    name: string;
    commentCount: number;
    totalLikes: number;
  }>;
  engagementRate: number;
} 