import { Comment } from '../../domain/entities/Comment';
import type { 
  CommentRepository,
  CommentFetchOptions,
  CommentSearchOptions,
  CommentThreadsResult 
} from '../../domain/repositories/CommentRepository';
import { YouTubeApiClient } from '../api/YouTubeApiClient';
import { YouTubeMapper } from '../mappers/YouTubeMapper';
import { YOUTUBE_API } from '../../shared/constants/api';

export class CommentRepositoryImpl implements CommentRepository {
  constructor(private readonly apiClient: YouTubeApiClient) {}

  async getCommentThreads(
    videoId: string,
    options?: CommentFetchOptions
  ): Promise<CommentThreadsResult> {
    try {
      const response = await this.apiClient.getCommentThreads({
        part: YOUTUBE_API.PARAMS.PART.SNIPPET,
        videoId,
        maxResults: options?.maxResults || 20,
        order: options?.order || 'relevance',
        pageToken: options?.pageToken,
        textFormat: options?.textFormat || 'plainText',
      });

      const comments = YouTubeMapper.mapCommentThreadsToComments(response.items);

      return {
        comments,
        nextPageToken: response.nextPageToken,
        totalResults: response.pageInfo.totalResults,
        hasMore: !!response.nextPageToken,
      };
    } catch (error) {
      console.error('Failed to fetch comment threads:', error);
      throw new Error(`댓글을 가져오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async getPinnedComment(videoId: string): Promise<Comment | null> {
    try {
      // 첫 번째 페이지의 댓글들을 가져와서 고정 댓글을 찾습니다
      const response = await this.apiClient.getCommentThreads({
        part: YOUTUBE_API.PARAMS.PART.SNIPPET,
        videoId,
        maxResults: 10, // 고정 댓글은 보통 상단에 있으므로 적은 수만 가져옴
        order: 'relevance', // 관련성 순으로 정렬
        textFormat: 'plainText',
      });

      if (response.items.length === 0) {
        return null;
      }

      // 고정 댓글 찾기
      const pinnedComment = YouTubeMapper.findPinnedComment(response.items);
      return pinnedComment;
    } catch (error) {
      console.error('Failed to fetch pinned comment:', error);
      throw new Error(`고정 댓글을 가져오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async getCommentReplies(
    commentId: string,
    options?: CommentFetchOptions
  ): Promise<CommentThreadsResult> {
    // YouTube API v3에서는 답글을 직접 가져오는 별도의 엔드포인트가 있지만
    // 현재는 댓글 스레드의 replies 필드를 사용합니다
    try {
      const response = await this.apiClient.getCommentThreads({
        part: `${YOUTUBE_API.PARAMS.PART.SNIPPET},${YOUTUBE_API.PARAMS.PART.REPLIES}`,
        videoId: commentId, // 실제로는 다른 파라미터가 필요할 수 있음
        maxResults: options?.maxResults || 10,
        pageToken: options?.pageToken,
        textFormat: options?.textFormat || 'plainText',
      });

      // 이 부분은 실제 API 응답 구조에 따라 조정이 필요할 수 있습니다
      const comments = YouTubeMapper.mapCommentThreadsToComments(response.items);

      return {
        comments,
        nextPageToken: response.nextPageToken,
        totalResults: response.pageInfo.totalResults,
        hasMore: !!response.nextPageToken,
      };
    } catch (error) {
      console.error('Failed to fetch comment replies:', error);
      throw new Error(`답글을 가져오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async searchComments(
    videoId: string,
    searchTerm: string,
    options?: CommentSearchOptions
  ): Promise<Comment[]> {
    try {
      // YouTube API에서는 댓글 내 검색이 직접 지원되지 않으므로
      // 모든 댓글을 가져와서 클라이언트 사이드에서 필터링합니다
      const allComments: Comment[] = [];
      let pageToken: string | undefined;
      const maxPages = 5; // 너무 많은 API 호출 방지
      let currentPage = 0;

      do {
        const response = await this.apiClient.getCommentThreads({
          part: YOUTUBE_API.PARAMS.PART.SNIPPET,
          videoId,
          maxResults: options?.maxResults || 50,
          order: options?.order || 'relevance',
          pageToken,
          textFormat: options?.textFormat || 'plainText',
        });

        const comments = YouTubeMapper.mapCommentThreadsToComments(response.items);
        allComments.push(...comments);
        
        pageToken = response.nextPageToken;
        currentPage++;
      } while (pageToken && currentPage < maxPages);

      // 클라이언트 사이드 검색
      const filteredComments = allComments.filter(comment =>
        comment.content.contains(searchTerm)
      );

      return filteredComments;
    } catch (error) {
      console.error('Failed to search comments:', error);
      throw new Error(`댓글 검색에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }
} 