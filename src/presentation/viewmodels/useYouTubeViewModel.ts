import React, { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';
import { useAppleMusicStore } from '../stores/useAppleMusicStore';
import { useYouTubeMusicStore } from '../stores/useYouTubeMusicStore';
import type { YouTubeUrlForm } from '../../shared/types/app';
import { CommentRepositoryImpl } from '../../infrastructure/repositories/CommentRepositoryImpl';
import { VideoRepositoryImpl } from '../../infrastructure/repositories/VideoRepositoryImpl';
import { YouTubeApiClient } from '../../infrastructure/api/YouTubeApiClient';
import { MusicSearchService } from '../../domain/services/MusicSearchService';
import { extractVideoId } from '../../shared/utils/youtube';

function getSourceDisplayName(source: string): string {
  switch (source) {
    case 'pinnedComment': return '고정 댓글';
    case 'videoDescription': return '영상 설명';
    case 'regularComments': return '일반 댓글';
    default: return '알 수 없음';
  }
}

export const useYouTubeViewModel = () => {
  const {
    currentUrl,
    currentVideoId,
    loadingState,
    pinnedComments,
    commentsError,
    setCurrentUrl,
    setCurrentVideoId,
    setLoading,
    clearError,
    setPinnedComments,
    setCommentsError,
  } = useAppStore();

  // Music stores for clearing playlist creation results
  const appleMusicStore = useAppleMusicStore();
  const youtubeMusicStore = useYouTubeMusicStore();

  // Initialize repositories and services
  const repositories = React.useMemo(() => {
    const apiClient = new YouTubeApiClient();
    const commentRepository = new CommentRepositoryImpl(apiClient);
    const videoRepository = new VideoRepositoryImpl(apiClient);
    const musicSearchService = new MusicSearchService(commentRepository, videoRepository as any);
    
    return { commentRepository, videoRepository, musicSearchService };
  }, []);

  // Fetch video information
  const {
    data: videoInfo,
    isLoading: isVideoLoading,
  } = useQuery({
    queryKey: ['videoInfo', currentVideoId],
    queryFn: async () => {
      if (!currentVideoId) {
        throw new Error('No video ID provided');
      }
      
      const video = await repositories.videoRepository.getVideoById(currentVideoId);
      return video;
    },
    enabled: !!currentVideoId,
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Validate and process YouTube URL
  const processUrl = useCallback((urlString: string): YouTubeUrlForm => {
    try {
      const videoId = extractVideoId(urlString);
      
      return {
        url: urlString,
        isValid: !!videoId,
        videoId: videoId || undefined,
      };
    } catch {
      return {
        url: urlString,
        isValid: false,
      };
    }
  }, []);

  // Handle URL input change
  const handleUrlChange = useCallback((urlString: string) => {
    clearError();
    
    // Clear playlist creation results when URL changes
    appleMusicStore.clearResults();
    youtubeMusicStore.clearResults();
    
    const urlForm = processUrl(urlString);
    setCurrentUrl(urlForm);
    
    if (urlForm.isValid && urlForm.videoId) {
      setCurrentVideoId(urlForm.videoId);
    } else {
      setCurrentVideoId(null);
    }
  }, [processUrl, setCurrentUrl, setCurrentVideoId, clearError, appleMusicStore, youtubeMusicStore]);

  // Fetch pinned comments using React Query
  const {
    data: comments,
    isLoading: isCommentsLoading,
    error: commentsQueryError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['pinnedComments', currentVideoId],
    queryFn: async () => {
      if (!currentVideoId) {
        throw new Error('No video ID provided');
      }
      
      // Use MusicSearchService to find music lists from multiple sources
      const musicResult = await repositories.musicSearchService.searchMusicList(currentVideoId);
      
      if (musicResult.tracks.length > 0) {
        // Convert music tracks to UI comment format
        return [{
          id: 'music-list',
          content: musicResult.sourceContent || musicResult.tracks.map(t => `${t.artist} - ${t.title}`).join('\n'),
          author: `Music List (from ${getSourceDisplayName(musicResult.source)})`,
          publishedAt: new Date().toISOString(),
          likeCount: musicResult.totalFound,
          source: musicResult.source,
          tracks: musicResult.tracks,
        }];
      }
      
      // Fallback: get regular comments if no music found
      const commentsResult = await repositories.commentRepository.getCommentThreads(currentVideoId, {
        maxResults: 5,
        order: 'relevance'
      });
      
      // Convert to UI format
      return commentsResult.comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content.originalText,
        author: comment.author.name,
        publishedAt: comment.timestamps.publishedAt,
        likeCount: comment.engagement.likeCount,
      }));
    },
    enabled: !!currentVideoId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when query state changes
  React.useEffect(() => {
    setLoading(isCommentsLoading || isVideoLoading);
  }, [isCommentsLoading, isVideoLoading, setLoading]);

  React.useEffect(() => {
    if (commentsQueryError) {
      setCommentsError({
        code: 'FETCH_ERROR',
        message: commentsQueryError.message,
        details: commentsQueryError,
      });
    } else {
      setCommentsError(null);
    }
  }, [commentsQueryError, setCommentsError]);

  React.useEffect(() => {
    if (comments) {
      setPinnedComments(comments);
    }
  }, [comments, setPinnedComments]);

  // Clear all data
  const clearData = useCallback(() => {
    setCurrentUrl(null);
    setCurrentVideoId(null);
    setPinnedComments([]);
    setCommentsError(null);
    clearError();
    
    // Clear playlist creation results
    appleMusicStore.clearResults();
    youtubeMusicStore.clearResults();
  }, [setCurrentUrl, setCurrentVideoId, setPinnedComments, setCommentsError, clearError, appleMusicStore, youtubeMusicStore]);

  return {
    // State
    currentUrl,
    currentVideoId,
    videoInfo,
    isLoading: loadingState.isLoading,
    error: loadingState.error,
    pinnedComments,
    commentsError,
    
    // Actions
    handleUrlChange,
    refetchComments,
    clearData,
    clearError,
  };
}; 