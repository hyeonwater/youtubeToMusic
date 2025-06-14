import type { CommentRepository } from '../repositories/CommentRepository';
import type { VideoRepository } from '../repositories/VideoRepository';
import { parseMusicFromComment, containsMusicList, type MusicTrack } from '../../shared/utils/musicParser';

export interface MusicSearchResult {
  tracks: MusicTrack[];
  source: 'pinnedComment' | 'videoDescription' | 'regularComments' | 'notFound';
  sourceContent?: string;
  totalFound: number;
}

export class MusicSearchService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly videoRepository: VideoRepository
  ) {}

  /**
   * 다양한 소스에서 음악 목록을 검색합니다.
   * 우선순위: 고정댓글 → 비디오 설명 → 일반 댓글
   */
  async searchMusicList(videoId: string): Promise<MusicSearchResult> {
    // 1. 고정 댓글에서 찾기
    const pinnedResult = await this.searchInPinnedComments(videoId);
    if (pinnedResult.tracks.length > 0) {
      return pinnedResult;
    }

    // 2. 비디오 설명에서 찾기
    const descriptionResult = await this.searchInVideoDescription(videoId);
    if (descriptionResult.tracks.length > 0) {
      return descriptionResult;
    }

    // 3. 일반 댓글에서 찾기
    const commentsResult = await this.searchInRegularComments(videoId);
    if (commentsResult.tracks.length > 0) {
      return commentsResult;
    }

    return {
      tracks: [],
      source: 'notFound',
      totalFound: 0,
    };
  }

  /**
   * 고정 댓글에서 음악 목록을 검색합니다.
   */
  private async searchInPinnedComments(videoId: string): Promise<MusicSearchResult> {
    try {
      // 최대 10개의 상위 댓글을 가져와서 고정 댓글 및 음악 목록 찾기
      const commentsResult = await this.commentRepository.getCommentThreads(videoId, {
        maxResults: 10,
        order: 'relevance'
      });

      for (const comment of commentsResult.comments) {
        if (containsMusicList(comment.content.originalText)) {
          const tracks = parseMusicFromComment(comment.content.originalText);
          
          if (tracks.length > 0) {
            return {
              tracks,
              source: 'pinnedComment',
              sourceContent: comment.content.originalText,
              totalFound: tracks.length,
            };
          }
        }
      }

      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    } catch (error) {
      console.error('Failed to search in pinned comments:', error);
      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    }
  }

  /**
   * 비디오 설명에서 음악 목록을 검색합니다.
   */
  private async searchInVideoDescription(videoId: string): Promise<MusicSearchResult> {
    try {
      const video = await this.videoRepository.getVideoById(videoId);
      
      if (video && containsMusicList(video.description)) {
        const tracks = parseMusicFromComment(video.description);
        
        if (tracks.length > 0) {
          return {
            tracks,
            source: 'videoDescription',
            sourceContent: video.description,
            totalFound: tracks.length,
          };
        }
      }

      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    } catch (error) {
      console.error('Failed to search in video description:', error);
      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    }
  }

  /**
   * 일반 댓글에서 음악 목록을 검색합니다.
   */
  private async searchInRegularComments(videoId: string): Promise<MusicSearchResult> {
    try {
      // 상위 50개 댓글을 검색
      const commentsResult = await this.commentRepository.getCommentThreads(videoId, {
        maxResults: 50,
        order: 'relevance'
      });

      // 음악 목록이 포함된 댓글 찾기
      for (const comment of commentsResult.comments) {
        if (containsMusicList(comment.content.originalText)) {
          const tracks = parseMusicFromComment(comment.content.originalText);
          
          if (tracks.length > 3) { // 최소 3곡 이상인 경우만
            return {
              tracks,
              source: 'regularComments',
              sourceContent: comment.content.originalText,
              totalFound: tracks.length,
            };
          }
        }
      }

      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    } catch (error) {
      console.error('Failed to search in regular comments:', error);
      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    }
  }

  /**
   * 소스별 검색 결과를 모두 반환합니다. (디버깅용)
   */
  async searchAllSources(videoId: string): Promise<{
    pinnedComments: MusicSearchResult;
    videoDescription: MusicSearchResult;
    regularComments: MusicSearchResult;
  }> {
    const [pinnedComments, videoDescription, regularComments] = await Promise.all([
      this.searchInPinnedComments(videoId),
      this.searchInVideoDescription(videoId),
      this.searchInRegularComments(videoId),
    ]);

    return {
      pinnedComments,
      videoDescription,
      regularComments,
    };
  }
} 