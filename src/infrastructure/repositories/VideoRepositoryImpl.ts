import { Video } from '../../domain/entities/Video';
import type { VideoRepository } from '../../domain/repositories/VideoRepository';
import { YouTubeApiClient } from '../api/YouTubeApiClient';
import { YouTubeMapper } from '../mappers/YouTubeMapper';

export class VideoRepositoryImpl implements VideoRepository {
  constructor(private readonly apiClient: YouTubeApiClient) {}

  async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const response = await this.apiClient.getVideos({
        part: 'snippet',
        id: videoId,
      });

      if (response.items.length === 0) {
        return null;
      }

      const videoData = response.items[0];
      return YouTubeMapper.mapYouTubeVideoToVideo(videoData);
    } catch (error) {
      console.error('Failed to fetch video:', error);
      throw new Error(`비디오 정보를 가져오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async getVideosByIds(videoIds: string[]): Promise<Video[]> {
    try {
      const response = await this.apiClient.getVideos({
        part: 'snippet',
        id: videoIds.join(','),
      });

      return response.items.map((item: any) => YouTubeMapper.mapYouTubeVideoToVideo(item));
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      throw new Error(`비디오 목록을 가져오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  async getVideoSummary(videoId: string) {
    const video = await this.getVideoById(videoId);
    if (!video) return null;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      channelInfo: video.channelInfo,
      publishedAt: video.publishedAt,
    };
  }

  async checkVideoExists(videoId: string): Promise<boolean> {
    try {
      const video = await this.getVideoById(videoId);
      return video !== null;
    } catch {
      return false;
    }
  }

  async getVideoMetadata(videoId: string) {
    const video = await this.getVideoById(videoId);
    if (!video) return null;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      channelInfo: video.channelInfo,
      thumbnails: video.thumbnails,
      publishedAt: video.publishedAt,
      tags: video.tags,
    };
  }
} 