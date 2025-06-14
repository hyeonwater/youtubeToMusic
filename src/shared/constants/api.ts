export const YOUTUBE_API = {
  BASE_URL: 'https://www.googleapis.com/youtube/v3',
  KEY: 'AIzaSyArHzxcToSTGl84pq5OYcQfH4aL8DMpniw',
  ENDPOINTS: {
    COMMENT_THREADS: '/commentThreads',
    VIDEOS: '/videos',
  },
  PARAMS: {
    PART: {
      SNIPPET: 'snippet',
      REPLIES: 'replies',
    },
    ORDER: {
      TIME: 'time',
      RELEVANCE: 'relevance',
      RATING: 'rating',
    },
    TEXT_FORMAT: {
      HTML: 'html',
      PLAIN_TEXT: 'plainText',
    },
  },
} as const;

export const APP_CONSTANTS = {
  MAX_RESULTS_PER_PAGE: 20,
  DEBOUNCE_DELAY: 500,
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 2 * 60 * 1000, // 2 minutes
} as const; 