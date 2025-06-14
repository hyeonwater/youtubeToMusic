import { Comment, Author, Content, Engagement, Timestamps } from '../../domain/entities/Comment';
import { Video, ChannelInfo, Thumbnail, Thumbnails } from '../../domain/entities/Video';
import type { 
  CommentThread,
  CommentSnippet,
  Video as YouTubeVideo,
  VideoSnippet 
} from '../../shared/types/youtube';

export class YouTubeMapper {
  /**
   * YouTube API 댓글 스레드를 Comment 엔티티로 변환합니다.
   */
  static mapCommentThreadToComment(commentThread: CommentThread): Comment {
    const snippet = commentThread.snippet.topLevelComment.snippet;
    const isPinned = this.determineIfPinned(commentThread);
    
    return new Comment(
      commentThread.id,
      this.mapCommentSnippetToAuthor(snippet),
      this.mapCommentSnippetToContent(snippet),
      this.mapCommentSnippetToEngagement(snippet),
      this.mapCommentSnippetToTimestamps(snippet),
      snippet.videoId,
      isPinned
    );
  }

  /**
   * YouTube API 비디오를 Video 엔티티로 변환합니다.
   */
  static mapYouTubeVideoToVideo(youtubeVideo: YouTubeVideo): Video {
    const snippet = youtubeVideo.snippet;
    
    return new Video(
      youtubeVideo.id,
      snippet.title,
      snippet.description,
      this.mapVideoSnippetToChannelInfo(snippet),
      this.mapVideoSnippetToThumbnails(snippet),
      snippet.publishedAt,
      snippet.tags || []
    );
  }

  /**
   * 댓글 스니펫을 Author 엔티티로 변환합니다.
   */
  private static mapCommentSnippetToAuthor(snippet: CommentSnippet): Author {
    return new Author(
      snippet.authorDisplayName,
      snippet.authorProfileImageUrl,
      snippet.authorChannelUrl,
      snippet.authorChannelId?.value
    );
  }

  /**
   * 댓글 스니펫을 Content 엔티티로 변환합니다.
   */
  private static mapCommentSnippetToContent(snippet: CommentSnippet): Content {
    return new Content(
      snippet.textDisplay,
      snippet.textOriginal
    );
  }

  /**
   * 댓글 스니펫을 Engagement 엔티티로 변환합니다.
   */
  private static mapCommentSnippetToEngagement(snippet: CommentSnippet): Engagement {
    return new Engagement(
      snippet.likeCount,
      snippet.totalReplyCount
    );
  }

  /**
   * 댓글 스니펫을 Timestamps 엔티티로 변환합니다.
   */
  private static mapCommentSnippetToTimestamps(snippet: CommentSnippet): Timestamps {
    return new Timestamps(
      snippet.publishedAt,
      snippet.updatedAt
    );
  }

  /**
   * 비디오 스니펫을 ChannelInfo 엔티티로 변환합니다.
   */
  private static mapVideoSnippetToChannelInfo(snippet: VideoSnippet): ChannelInfo {
    return new ChannelInfo(
      snippet.channelId,
      snippet.channelTitle,
      `https://www.youtube.com/channel/${snippet.channelId}`
    );
  }

  /**
   * 비디오 스니펫을 Thumbnails 엔티티로 변환합니다.
   */
  private static mapVideoSnippetToThumbnails(snippet: VideoSnippet): Thumbnails {
    const thumbnails = snippet.thumbnails;
    
    return new Thumbnails(
      this.mapThumbnailData(thumbnails.default || thumbnails.medium),
      this.mapThumbnailData(thumbnails.medium || thumbnails.default),
      this.mapThumbnailData(thumbnails.high || thumbnails.medium),
      thumbnails.standard ? this.mapThumbnailData(thumbnails.standard) : undefined,
      thumbnails.maxres ? this.mapThumbnailData(thumbnails.maxres) : undefined
    );
  }

  /**
   * 썸네일 데이터를 Thumbnail 엔티티로 변환합니다.
   */
  private static mapThumbnailData(thumbnailData: any): Thumbnail {
    return new Thumbnail(
      thumbnailData.url,
      thumbnailData.width,
      thumbnailData.height
    );
  }

  /**
   * 댓글이 고정 댓글인지 판단합니다.
   * 
   * 주의: YouTube API v3에서는 고정 댓글을 직접 식별하는 필드가 없습니다.
   * 따라서 다음과 같은 휴리스틱을 사용합니다:
   * 1. 첫 번째 댓글이고
   * 2. 비디오 채널 소유자가 작성했거나
   * 3. 좋아요 수가 특별히 높은 경우
   */
  private static determineIfPinned(commentThread: CommentThread): boolean {
    const snippet = commentThread.snippet.topLevelComment.snippet;
    
    // 현재는 간단한 로직 사용 (실제로는 더 복잡한 로직이 필요할 수 있음)
    // YouTube API에서는 고정 댓글을 명시적으로 표시하지 않으므로
    // 채널 소유자 댓글인지 확인하는 것이 가장 좋은 방법입니다.
    return snippet.authorChannelId?.value === commentThread.snippet.channelId;
  }

  /**
   * 여러 댓글 스레드를 Comment 엔티티 배열로 변환합니다.
   */
  static mapCommentThreadsToComments(commentThreads: CommentThread[]): Comment[] {
    return commentThreads.map(thread => this.mapCommentThreadToComment(thread));
  }

  /**
   * 여러 비디오를 Video 엔티티 배열로 변환합니다.
   */
  static mapYouTubeVideosToVideos(youtubeVideos: YouTubeVideo[]): Video[] {
    return youtubeVideos.map(video => this.mapYouTubeVideoToVideo(video));
  }

  /**
   * 첫 번째 댓글이 고정 댓글인지 확인하고 반환합니다.
   */
  static findPinnedComment(commentThreads: CommentThread[]): Comment | null {
    if (commentThreads.length === 0) {
      return null;
    }

    const firstComment = this.mapCommentThreadToComment(commentThreads[0]);
    
    // 첫 번째 댓글이 고정 댓글일 가능성이 높습니다
    if (firstComment.isPinned) {
      return firstComment;
    }

    // 추가 로직: 채널 소유자의 댓글 찾기
    for (const thread of commentThreads.slice(0, 5)) { // 처음 5개만 확인
      const comment = this.mapCommentThreadToComment(thread);
      if (comment.isPinned) {
        return comment;
      }
    }

    return null;
  }
} 