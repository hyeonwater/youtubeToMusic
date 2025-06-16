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
    console.log(`🎯 Starting music search for video: ${videoId}`);
    
    // 1. 고정 댓글에서 찾기
    console.log('🔍 Step 1: Searching in pinned comments...');
    const pinnedResult = await this.searchInPinnedComments(videoId);
    if (pinnedResult.tracks.length > 0) {
      console.log(`✅ Found ${pinnedResult.tracks.length} tracks in pinned comments`);
      return pinnedResult;
    }

    // 2. 비디오 설명에서 찾기
    console.log('🔍 Step 2: Searching in video description...');
    const descriptionResult = await this.searchInVideoDescription(videoId);
    if (descriptionResult.tracks.length > 0) {
      console.log(`✅ Found ${descriptionResult.tracks.length} tracks in video description`);
      return descriptionResult;
    }

    // 3. 일반 댓글에서 찾기
    console.log('🔍 Step 3: Searching in regular comments...');
    const commentsResult = await this.searchInRegularComments(videoId);
    if (commentsResult.tracks.length > 0) {
      console.log(`✅ Found ${commentsResult.tracks.length} tracks in regular comments`);
      return commentsResult;
    }

    console.log('❌ No music found in any source');
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
      console.log(`🔍 Searching for music in pinned comments for videoId: ${videoId}`);
      // 최대 10개의 상위 댓글을 가져와서 고정 댓글 및 음악 목록 찾기
      const commentsResult = await this.commentRepository.getCommentThreads(videoId, {
        maxResults: 10,
        order: 'relevance'
      });

      console.log(`💬 Found ${commentsResult.comments.length} comments to check`);

      for (const comment of commentsResult.comments) {
        const commentPreview = comment.content.originalText.substring(0, 100);
        console.log(`📝 Checking comment: ${commentPreview}...`);
        
        if (containsMusicList(comment.content.originalText)) {
          console.log(`🎵 Found music list in comment`);
          const tracks = parseMusicFromComment(comment.content.originalText);
          console.log(`🎶 Extracted ${tracks.length} tracks from comment`);
          
          if (tracks.length > 0) {
            console.log('✅ Successfully extracted music from pinned comments');
            tracks.slice(0, 3).forEach((track, index) => {
              console.log(`  ${index + 1}. ${track.artist} - ${track.title}`);
            });
            
            return {
              tracks,
              source: 'pinnedComment',
              sourceContent: comment.content.originalText,
              totalFound: tracks.length,
            };
          }
        }
      }

      console.log('❌ No music found in pinned comments');
      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    } catch (error) {
      console.error('❌ Failed to search in pinned comments:', error);
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
      console.log(`🔍 Searching for music in video description for videoId: ${videoId}`);
      const video = await this.videoRepository.getVideoById(videoId);
      
      if (!video) {
        console.log('❌ Video not found');
        return {
          tracks: [],
          source: 'notFound',
          totalFound: 0,
        };
      }

      console.log(`📝 Video description length: ${video.description.length} characters`);
      console.log(`📝 Video description preview: ${video.description.substring(0, 200)}...`);
      
      const hasMusicList = containsMusicList(video.description);
      console.log(`🎵 Contains music list: ${hasMusicList}`);
      
      if (hasMusicList) {
        const tracks = parseMusicFromComment(video.description);
        console.log(`🎶 Found ${tracks.length} tracks in video description`);
        
        if (tracks.length > 0) {
          console.log('✅ Successfully extracted music from video description');
          tracks.slice(0, 3).forEach((track, index) => {
            console.log(`  ${index + 1}. ${track.artist} - ${track.title}`);
          });
          
          return {
            tracks,
            source: 'videoDescription',
            sourceContent: video.description,
            totalFound: tracks.length,
          };
        }
      }

      console.log('❌ No music found in video description');
      return {
        tracks: [],
        source: 'notFound',
        totalFound: 0,
      };
    } catch (error) {
      console.error('❌ Failed to search in video description:', error);
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