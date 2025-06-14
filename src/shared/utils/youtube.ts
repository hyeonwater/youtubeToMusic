/**
 * YouTube URL에서 비디오 ID를 추출합니다.
 */
export function extractVideoId(url: string): string | null {
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
 * YouTube URL이 유효한지 검증합니다.
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const videoId = extractVideoId(url);
  return videoId !== null && videoId.length === 11;
}

/**
 * YouTube 비디오 ID가 유효한지 검증합니다.
 */
export function isValidVideoId(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') {
    return false;
  }

  // YouTube 비디오 ID는 11자리 영숫자 및 일부 특수문자(-_)로 구성됩니다.
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/;
  return videoIdPattern.test(videoId);
}

/**
 * YouTube 썸네일 URL을 생성합니다.
 */
export function generateThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * YouTube 비디오 URL을 생성합니다.
 */
export function generateVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * 댓글 텍스트에서 HTML 태그를 제거합니다.
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * 댓글 텍스트의 길이를 제한합니다.
 */
export function truncateText(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trim() + '...';
}

/**
 * 상대적 시간을 표시합니다 (예: "2시간 전", "3일 전").
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '주', seconds: 604800 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} 전`;
    }
  }

  return '방금 전';
}

/**
 * 숫자를 축약된 형태로 표시합니다 (예: 1234 -> 1.2K).
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  const units = ['K', 'M', 'B', 'T'];
  let unitIndex = -1;
  let formattedNum = num;

  while (formattedNum >= 1000 && unitIndex < units.length - 1) {
    formattedNum /= 1000;
    unitIndex++;
  }

  const decimalPlaces = formattedNum % 1 === 0 ? 0 : 1;
  return `${formattedNum.toFixed(decimalPlaces)}${units[unitIndex]}`;
} 