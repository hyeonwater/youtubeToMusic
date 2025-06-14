import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { YOUTUBE_API } from '../../shared/constants/api';
import type { 
  CommentThreadsResponse,
  VideosResponse,
  YouTubeApiError 
} from '../../shared/types/youtube';

export class YouTubeApiClient {
  private readonly client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: YOUTUBE_API.BASE_URL,
      timeout: 10000,
      params: {
        key: apiKey || YOUTUBE_API.KEY,
      },
    });

    this.setupInterceptors();
  }

  /**
   * 비디오의 댓글 스레드를 가져옵니다.
   */
  async getCommentThreads(params: CommentThreadsParams): Promise<CommentThreadsResponse> {
    try {
      const response = await this.client.get<CommentThreadsResponse>(
        YOUTUBE_API.ENDPOINTS.COMMENT_THREADS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 비디오 정보를 가져옵니다.
   */
  async getVideos(params: VideosParams): Promise<VideosResponse> {
    try {
      const response = await this.client.get<VideosResponse>(
        YOUTUBE_API.ENDPOINTS.VIDEOS,
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * API 키를 업데이트합니다.
   */
  updateApiKey(apiKey: string): void {
    this.client.defaults.params = {
      ...this.client.defaults.params,
      key: apiKey,
    };
  }

  /**
   * 요청 인터셉터를 설정합니다.
   */
  private setupInterceptors(): void {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[YouTube API] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
        });
        return config;
      },
      (error) => {
        console.error('[YouTube API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[YouTube API] Response:`, {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error('[YouTube API] Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * API 에러를 처리합니다.
   */
  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<YouTubeApiError>;
      
      if (axiosError.response) {
        // 서버가 응답했지만 오류 상태 코드가 반환됨
        const apiError = axiosError.response.data;
        const errorMessage = apiError?.message || '알 수 없는 API 오류가 발생했습니다.';
        
        switch (axiosError.response.status) {
          case 400:
            return new Error(`잘못된 요청: ${errorMessage}`);
          case 401:
            return new Error('API 키가 유효하지 않습니다.');
          case 403:
            return new Error(`접근이 거부되었습니다: ${errorMessage}`);
          case 404:
            return new Error('요청한 리소스를 찾을 수 없습니다.');
          case 429:
            return new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
          case 500:
            return new Error('YouTube API 서버 오류가 발생했습니다.');
          default:
            return new Error(`API 오류 (${axiosError.response.status}): ${errorMessage}`);
        }
      } else if (axiosError.request) {
        // 요청이 만들어졌지만 응답을 받지 못함
        return new Error('네트워크 오류: YouTube API에 연결할 수 없습니다.');
      } else {
        // 요청을 설정하는 중에 오류가 발생
        return new Error(`요청 설정 오류: ${axiosError.message}`);
      }
    }

    // Axios 오류가 아닌 경우
    return new Error('알 수 없는 오류가 발생했습니다.');
  }
}

// API 파라미터 인터페이스들
export interface CommentThreadsParams {
  part: string;
  videoId: string;
  maxResults?: number;
  order?: 'time' | 'relevance' | 'rating';
  pageToken?: string;
  textFormat?: 'html' | 'plainText';
}

export interface VideosParams {
  part: string;
  id: string;
  maxResults?: number;
}

// 싱글톤 인스턴스
export const youtubeApiClient = new YouTubeApiClient(); 