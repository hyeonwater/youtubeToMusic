export interface MusicTrack {
  title: string;
  artist: string;
  originalText: string;
  timeStamp?: string;
}

/**
 * 고정 댓글에서 음악 목록을 파싱합니다.
 */
export function parseMusicFromComment(comment: string): MusicTrack[] {
  const tracks: MusicTrack[] = [];
  const lines = comment.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    const track = parseMusicLine(line);
    if (track) {
      tracks.push(track);
    }
  }

  return tracks;
}

/**
 * 단일 라인에서 음악 정보를 파싱합니다.
 */
function parseMusicLine(line: string): MusicTrack | null {
  // 먼저 라인을 정리 (양쪽 공백 제거)
  const cleanLine = line.trim();
  
  // 패턴 0: "시간:시간:시간 가수 - 노래제목" (예: "00:01:56 d4vd - Sleep Well")
  const pattern0 = /^(\d{2}:\d{2}:\d{2})\s+(.+?)\s*-\s*(.+?)$/;
  const match0 = cleanLine.match(pattern0);
  if (match0) {
    return {
      title: match0[3].trim().replace(/♥/g, '').trim(),
      artist: match0[2].trim().replace(/♥/g, '').trim(),
      originalText: cleanLine,
      timeStamp: match0[1]
    };
  }

  // 패턴 0_: "시간:시간:시간 노래제목 _ 가수" (예: "00:00 지난날 _ 유재하")
  const pattern0_ = /^(\d{2}:\d{2}:\d{2})\s+(.+?)\s*_\s*(.+?)$/;
  const match0_ = cleanLine.match(pattern0_);
  if (match0_) {
    return {
      title: match0_[2].trim().replace(/♥/g, '').trim(),
      artist: match0_[3].trim().replace(/♥/g, '').trim(),
      originalText: cleanLine,
      timeStamp: match0_[1]
    };
  }

  // 패턴 0-1: "시간:시간:시간 노래제목" (아티스트가 없는 경우, 예: "00:12:32 Until I Found You")
  const pattern0_1 = /^(\d{2}:\d{2}:\d{2})\s+(.+?)(?:\s*♥\s*)?$/;
  const match0_1 = cleanLine.match(pattern0_1);
  if (match0_1 && !cleanLine.includes(' - ') && !cleanLine.includes(' _ ')) {
    return {
      title: match0_1[2].trim().replace(/♥/g, '').trim(),
      artist: 'Unknown Artist',
      originalText: cleanLine,
      timeStamp: match0_1[1]
    };
  }

  // 패턴 1: "시간:시간 노래제목-가수" (예: "0:00 wRoNg (feat. kehlani) -ZAYN", "1:30 TiO-ZAYN")
  const pattern1_title_artist = /^(\d{1,2}:\d{2})\s+(.+?)\s*-\s*(.+?)$/;
  const match1_title_artist = cleanLine.match(pattern1_title_artist);
  if (match1_title_artist) {
    const potentialTitle = match1_title_artist[2].trim().replace(/♥/g, '').trim();
    const potentialArtist = match1_title_artist[3].trim().replace(/♥/g, '').trim();
    
    // 더 정확한 판단 로직
    const hasFeature = potentialTitle.includes('feat.') || potentialTitle.includes('ft.');
    const titleHasParentheses = potentialTitle.includes('(') && potentialTitle.includes(')');
    
    // 아티스트 이름 패턴 감지
    const artistIsShort = potentialArtist.length <= 30;
    const artistHasCapitalPattern = /^[A-Z]/.test(potentialArtist);
    const artistHasSimpleWords = /^[A-Za-z\s&.,'-]+$/.test(potentialArtist);
    const artistIsShorterThanTitle = potentialArtist.length < potentialTitle.length;
    
    // 제목에 복잡한 패턴이 있는지 확인
    const titleHasComplexPatternOld = potentialTitle.includes('(') || potentialTitle.includes('[') || 
                                     potentialTitle.includes('feat.') || potentialTitle.includes('ft.');
    
    // 아티스트가 여러 명인지 확인 (콤마나 &로 구분)
    const hasMultipleArtists = potentialArtist.includes(',') || potentialArtist.includes('&');
    
    // 더 정확한 판단 로직
    // 1. feat./ft.가 있으면 무조건 "제목-아티스트"
    // 2. 일반적인 아티스트 이름 패턴이면 "제목-아티스트"
    // 3. 복잡한 아티스트 이름(여러 명, 콤마)이면 "아티스트-제목"으로 처리
    
    const artistWords = potentialArtist.split(/[\s&,]+/).filter(word => word.length > 0);
    const titleWords = potentialTitle.split(/[\s&,]+/).filter(word => word.length > 0);
    
    // 알려진 아티스트 패턴들
    const knownArtistPatterns = [
      /^[A-Z][a-z]+$/,                    // 단일 단어 (ZAYN, WILLOW)
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/,     // 두 단어 (Justin Bieber, Chris Brown)
      /^[A-Z][a-z]+\s+\d+$/,             // 이름 + 숫자 (Maroon 5)
      /^The\s+[A-Z][a-z\s]+$/,           // The로 시작 (The Weeknd, The Notorious B.I.G.)
      /^[A-Z]{2,}$/,                     // 모두 대문자 (DJ, BTS)
      /^[A-Z][a-z]+\s+[A-Z]\.[A-Z]\.$/,  // 이니셜 포함 (The Notorious B.I.G.)
      /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+$/, // 세 단어 (Ed Sheeran)
      /^DJ\s+[A-Z][a-z]+$/,              // DJ + 이름 (DJ Khaled)
      /^\d+\s+Shake$/,                   // 숫자 + 단어 (070 Shake)
      /^[A-Z][a-z]+\s+Oranges$/,         // 특별한 패턴 (Emotional Oranges)
      /^CKay$/,                          // 특별한 이름들
    ];
    
    // 아티스트가 알려진 패턴에 맞는지 확인
    const matchesArtistPattern = knownArtistPatterns.some(pattern => pattern.test(potentialArtist));
    
    // 제목에 복잡한 패턴이 있는지 확인
    const titleHasComplexPattern = hasFeature || titleHasParentheses || 
                                  potentialTitle.includes('[') || potentialTitle.includes(']');
    
    // 아티스트가 여러 명인지 확인 (콤마로 구분된 경우)
    const hasMultipleArtistsInTitle = potentialTitle.includes(',') && 
                                     potentialTitle.split(',').length > 1 &&
                                     potentialTitle.split(',').every(part => part.trim().length > 2);
    
    // 제목-아티스트 형식으로 판단하는 조건들
    const isDefinitelyTitleArtist = 
      hasFeature ||                                    // feat./ft.가 있으면 무조건 제목-아티스트
      matchesArtistPattern ||                          // 알려진 아티스트 패턴
      (artistWords.length <= 3 && !potentialArtist.includes(',')) || // 단순한 아티스트 이름
      (titleHasComplexPattern && artistWords.length <= 2);           // 복잡한 제목 + 단순한 아티스트
    
    // 아티스트-제목 형식으로 판단하는 조건들  
    const isDefinitelyArtistTitle = 
      hasMultipleArtistsInTitle ||                     // 제목에 여러 아티스트가 콤마로 구분
      (potentialTitle.includes(',') && potentialTitle.includes('&')); // 복잡한 아티스트 조합
    
    if (isDefinitelyArtistTitle) {
      // "아티스트-제목" 형식
      return {
        title: potentialArtist,
        artist: potentialTitle,
        originalText: cleanLine,
        timeStamp: match1_title_artist[1]
      };
    } else {
      // "제목-아티스트" 형식 (기본값)
      return {
        title: potentialTitle,
        artist: potentialArtist,
        originalText: cleanLine,
        timeStamp: match1_title_artist[1]
      };
    }
  }

  // 패턴 1_: "시간:시간 노래제목 _ 가수" (예: "04:55 이 밤이 지나면 _ 임재범")
  const pattern1_ = /^(\d{1,2}:\d{2})\s+(.+?)\s*_\s*(.+?)$/;
  const match1_ = cleanLine.match(pattern1_);
  if (match1_) {
    return {
      title: match1_[2].trim().replace(/♥/g, '').trim(),
      artist: match1_[3].trim().replace(/♥/g, '').trim(),
      originalText: cleanLine,
      timeStamp: match1_[1]
    };
  }

  // 패턴 1-1: "시간:시간 노래제목" (아티스트가 없는 경우)
  const pattern1_1 = /^(\d{1,2}:\d{2})\s+(.+?)(?:\s*♥\s*)?$/;
  const match1_1 = cleanLine.match(pattern1_1);
  if (match1_1 && !cleanLine.includes(' - ') && !cleanLine.includes(' _ ')) {
    return {
      title: match1_1[2].trim().replace(/♥/g, '').trim(),
      artist: 'Unknown Artist',
      originalText: cleanLine,
      timeStamp: match1_1[1]
    };
  }
  
  // 패턴 1 (기존): "시간 가수 - 노래제목" (예: "0:00 Weston Estate - Stoked")
  const pattern1 = /^(\d+:\d+)\s+(.+?)\s*-\s*(.+?)$/;
  const match1 = cleanLine.match(pattern1);
  if (match1) {
    return {
      title: match1[3].trim().replace(/♥/g, '').trim(),
      artist: match1[2].trim().replace(/♥/g, '').trim(),
      originalText: cleanLine,
      timeStamp: match1[1]
    };
  }

  // 패턴 2: "번호. 가수 - 노래제목 시간정보" (예: "1. Artist - Song 3:45")
  const pattern2 = /^\d+\.\s*(.+?)\s*-\s*(.+?)(?:\s+\d+:\d+|$)/;
  const match2 = cleanLine.match(pattern2);
  if (match2) {
    return {
      title: match2[2].trim(),
      artist: match2[1].trim(),
      originalText: cleanLine,
      timeStamp: extractTimeStamp(cleanLine)
    };
  }

  // 패턴 3: "시간범위 노래제목(feat. 다른가수)-가수" (예: "3:09-5:50 Song(feat. Artist)-MainArtist")
  const pattern3 = /^(\d+:\d+[-–]\d+:\d+)\s+(.+?)-(.+?)$/;
  const match3 = cleanLine.match(pattern3);
  if (match3) {
    let title = match3[2].trim();
    let artist = match3[3].trim();

    // feat. 부분 제거
    title = title.replace(/\s*\(feat\..*?\)/i, '');
    
    return {
      title: title.trim(),
      artist: artist.trim(),
      originalText: cleanLine,
      timeStamp: match3[1]
    };
  }

  // 패턴 4: "가수 - 노래제목" (기본, 시간 정보 없음)
  const pattern4 = /^(.+?)\s*[-–]\s*(.+)$/;
  const match4 = cleanLine.match(pattern4);
  if (match4 && !cleanLine.includes('감사합니다') && !cleanLine.includes('좋아요') && !cleanLine.includes('Spotify')) {
    // 숫자로 시작하거나 시간 정보가 있는 경우만
    if (/^\d+\./.test(cleanLine) || /\d+:\d+/.test(cleanLine)) {
      return {
        title: match4[2].trim(),
        artist: match4[1].trim(),
        originalText: cleanLine,
        timeStamp: extractTimeStamp(cleanLine)
      };
    }
  }

  return null;
}

/**
 * 라인에서 타임스탬프를 추출합니다.
 */
function extractTimeStamp(line: string): string | undefined {
  // 시간 패턴들 찾기
  const timePatterns = [
    /\d+:\d+[-–]\d+:\d+/,  // 범위 시간
    /\d+:\d+/,             // 단일 시간
  ];

  for (const pattern of timePatterns) {
    const match = line.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

/**
 * 중복된 트랙을 제거합니다.
 */
export function removeDuplicateTracks(tracks: MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  return tracks.filter(track => {
    const key = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * 음악 정보가 유효한지 검증합니다.
 */
export function isValidMusicTrack(track: MusicTrack): boolean {
  // 제목과 아티스트가 모두 존재하고 의미있는 길이인지 확인
  if (!track.title || !track.artist || track.title.length < 2 || track.artist.length < 2) {
    return false;
  }

  // 일반적이지 않은 패턴 필터링
  const invalidPatterns = [
    /감사합니다/,
    /좋아요/,
    /구독/,
    /알림/,
    /간주\s*점프/,
    /제작에\s*큰\s*힘/
  ];

  const fullText = `${track.title} ${track.artist}`;
  return !invalidPatterns.some(pattern => pattern.test(fullText));
}

/**
 * 음악 목록을 깔끔하게 포맷팅합니다.
 */
export function formatMusicTracks(tracks: MusicTrack[]): string[] {
  return tracks
    .filter(isValidMusicTrack)
    .map(track => {
      // ♥ 기호 제거
      const cleanTitle = track.title.replace(/♥/g, '').trim();
      const cleanArtist = track.artist.replace(/♥/g, '').trim();
      
      // Unknown Artist인 경우 아티스트 부분을 생략
      if (cleanArtist === 'Unknown Artist') {
        return cleanTitle;
      }
      
      return `${cleanArtist} - ${cleanTitle}`;
    });
}

/**
 * 댓글이 음악 목록을 포함하고 있는지 판단합니다.
 */
export function containsMusicList(comment: string): boolean {
  const musicIndicators = [
    /\d+\.\s*.+\s*-\s*.+/,      // 번호가 있는 목록
    /\d+:\d+[-–]\d+:\d+/,       // 시간 범위
    /.+\s*-\s*.+/,              // 하이픈으로 구분된 형태
    /.+\s*_\s*.+/,              // 언더스코어로 구분된 형태
  ];

  return musicIndicators.some(pattern => pattern.test(comment));
} 