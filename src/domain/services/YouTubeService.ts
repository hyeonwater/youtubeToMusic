import { Comment } from '../entities/Comment';
import { Video } from '../entities/Video';
import type { CommentRepository } from '../repositories/CommentRepository';
import type { VideoRepository } from '../repositories/VideoRepository';
import type { CommentFetchOptions, CommentThreadsResult } from '../repositories/CommentRepository';

export class YouTubeService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly videoRepository: VideoRepository
  ) {}

  /**
   * YouTube URL에서 고정 댓글을 찾아 반환합니다.
   */
  async getPinnedCommentFromUrl(url: string): Promise<PinnedCommentResult> {
    const videoId = this.extractVideoIdFromUrl(url);
    
    if (!videoId) {
      throw new Error('유효하지 않은 YouTube URL입니다.');
    }

    // 비디오 존재 여부 확인
    const videoExists = await this.videoRepository.checkVideoExists(videoId);
    if (!videoExists) {
      throw new Error('비디오를 찾을 수 없습니다.');
    }

    // 비디오 정보 가져오기
    const video = await this.videoRepository.getVideoById(videoId);
    if (!video) {
      throw new Error('비디오 정보를 가져올 수 없습니다.');
    }

    // 고정 댓글 가져오기
    const pinnedComment = await this.commentRepository.getPinnedComment(videoId);

    return {
      video,
      pinnedComment,
      hasVideo: true,
      hasPinnedComment: !!pinnedComment,
    };
  }

  /**
   * 비디오의 모든 댓글을 페이지네이션으로 가져옵니다.
   */
  async getVideoComments(
    videoId: string,
    options?: CommentFetchOptions
  ): Promise<CommentThreadsResult> {
    return await this.commentRepository.getCommentThreads(videoId, options);
  }

  /**
   * 비디오의 인기 댓글들을 가져옵니다.
   */
  async getPopularComments(
    videoId: string,
    minLikes: number = 100,
    maxResults: number = 20
  ): Promise<Comment[]> {
    const result = await this.commentRepository.getCommentThreads(videoId, {
      order: 'rating',
      maxResults: maxResults * 2, // 필터링을 위해 더 많이 가져옴
    });

    return result.comments.filter(comment => comment.isPopular(minLikes));
  }

  /**
   * 댓글에서 특정 키워드를 검색합니다.
   */
  async searchCommentsWithKeyword(
    videoId: string,
    keyword: string,
    options?: CommentFetchOptions
  ): Promise<Comment[]> {
    return await this.commentRepository.searchComments(videoId, keyword, options);
  }

  /**
   * 댓글 통계를 분석합니다.
   */
  async analyzeComments(videoId: string): Promise<CommentAnalytics> {
    const allComments: Comment[] = [];
    let pageToken: string | undefined;
    const maxPages = 10; // 너무 많은 API 호출 방지
    let currentPage = 0;

    // 여러 페이지에서 댓글 수집
    do {
      const result = await this.commentRepository.getCommentThreads(videoId, {
        pageToken,
        maxResults: 100,
      });
      
      allComments.push(...result.comments);
      pageToken = result.nextPageToken;
      currentPage++;
    } while (pageToken && currentPage < maxPages);

    return this.calculateCommentAnalytics(allComments);
  }

  /**
   * URL에서 비디오 ID를 추출합니다.
   */
  private extractVideoIdFromUrl(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 댓글 분석 결과를 계산합니다.
   */
  private calculateCommentAnalytics(comments: Comment[]): CommentAnalytics {
    if (comments.length === 0) {
      return {
        totalComments: 0,
        averageLikes: 0,
        mostLikedComment: null,
        topAuthors: [],
        engagementRate: 0,
      };
    }

    const totalLikes = comments.reduce((sum, comment) => sum + comment.engagement.likeCount, 0);
    const averageLikes = totalLikes / comments.length;

    const mostLikedComment = comments.reduce((max, comment) => 
      comment.engagement.likeCount > max.engagement.likeCount ? comment : max
    );

    // 작성자별 통계
    const authorStats = new Map<string, { commentCount: number; totalLikes: number }>();
    
    comments.forEach(comment => {
      const authorName = comment.author.name;
      const existing = authorStats.get(authorName) || { commentCount: 0, totalLikes: 0 };
      authorStats.set(authorName, {
        commentCount: existing.commentCount + 1,
        totalLikes: existing.totalLikes + comment.engagement.likeCount,
      });
    });

    const topAuthors = Array.from(authorStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10);

    const totalReplies = comments.reduce((sum, comment) => sum + comment.engagement.replyCount, 0);
    const engagementRate = (totalLikes + totalReplies) / comments.length;

    return {
      totalComments: comments.length,
      averageLikes,
      mostLikedComment,
      topAuthors,
      engagementRate,
    };
  }
}

export interface PinnedCommentResult {
  video: Video;
  pinnedComment: Comment | null;
  hasVideo: boolean;
  hasPinnedComment: boolean;
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