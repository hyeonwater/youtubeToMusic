import React from 'react';
import { 
  parseMusicFromComment, 
  removeDuplicateTracks, 
  formatMusicTracks, 
  containsMusicList,
  type MusicTrack 
} from '../../shared/utils/musicParser';
import { useAppleMusicStore } from '../stores/useAppleMusicStore';
import { useYouTubeMusicStore } from '../stores/useYouTubeMusicStore';
import { MusicServiceSelector } from './MusicServiceSelector';
import { AppleMusicAuth } from './AppleMusicAuth';
import { YouTubeMusicAuth } from './YouTubeMusicAuth';
import { PlaylistCreator } from './PlaylistCreator';

interface MusicListProps {
  comments: Array<{
    id: string;
    content: string;
    author: string;
    publishedAt: string;
    likeCount: number;
    source?: string;
    tracks?: MusicTrack[];
  }>;
  videoTitle?: string;
}

export const MusicList: React.FC<MusicListProps> = ({ comments, videoTitle }) => {
  const [allTracks, setAllTracks] = React.useState<MusicTrack[]>([]);
  const [formattedTracks, setFormattedTracks] = React.useState<string[]>([]);
  const [sourceInfo, setSourceInfo] = React.useState<string>('');
  const [selectedService, setSelectedService] = React.useState<'apple-music' | 'youtube-music'>('apple-music');
  const [lastClearedTrackCount, setLastClearedTrackCount] = React.useState(0);

  // Get stores for clearing playlist results when tracks change
  const appleMusicStore = useAppleMusicStore();
  const youtubeMusicStore = useYouTubeMusicStore();

  // 서비스 변경 시 다른 서비스의 상태 초기화
  const handleServiceChange = React.useCallback((service: 'apple-music' | 'youtube-music') => {
    setSelectedService(service);
    // 선택된 서비스가 아닌 다른 서비스의 결과 초기화
    if (service === 'apple-music') {
      youtubeMusicStore.clearResults();
    } else {
      appleMusicStore.clearResults();
    }
  }, []); // 의존성 배열을 비워서 무한 루프 방지

  React.useEffect(() => {
    const musicTracks: MusicTrack[] = [];
    
    // 모든 댓글에서 음악 정보 추출
    for (const comment of comments) {
      // 이미 파싱된 트랙이 있으면 우선 사용
      if (comment.tracks && comment.tracks.length > 0) {
        musicTracks.push(...comment.tracks);
      } else if (containsMusicList(comment.content)) {
        const tracks = parseMusicFromComment(comment.content);
        musicTracks.push(...tracks);
      }
    }

    // 중복 제거
    const uniqueTracks = removeDuplicateTracks(musicTracks);
    const formatted = formatMusicTracks(uniqueTracks);

    setAllTracks(uniqueTracks);
    setFormattedTracks(formatted);
    
    // 소스 정보 설정
    const musicComment = comments.find(c => c.tracks && c.tracks.length > 0);
    if (musicComment && musicComment.source) {
      setSourceInfo(getSourceDisplayName(musicComment.source));
    } else {
      setSourceInfo('고정 댓글');
    }
  }, [comments]);

  // Clear playlist creation results when new music is loaded (only when track count changes)
  React.useEffect(() => {
    if (allTracks.length > 0 && allTracks.length !== lastClearedTrackCount) {
      appleMusicStore.clearResults();
      youtubeMusicStore.clearResults();
      setLastClearedTrackCount(allTracks.length);
    }
  }, [allTracks.length, lastClearedTrackCount]);

  function getSourceDisplayName(source: string): string {
    switch (source) {
      case 'pinnedComment': return '고정 댓글';
      case 'videoDescription': return '영상 설명';
      case 'regularComments': return '일반 댓글';
      default: return '댓글';
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedTracks.join('\n'));
      // TODO: Show success toast
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadAsText = () => {
    const content = formattedTracks.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  };

  if (formattedTracks.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-gray-600 font-medium text-lg mb-2">음악 목록을 찾을 수 없습니다</h3>
          <p className="text-gray-500 text-sm">고정된 댓글에서 음악 정보를 찾지 못했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* 음악 서비스 선택 */}
      <MusicServiceSelector 
        selectedService={selectedService}
        onServiceChange={handleServiceChange}
      />
      
      {/* 선택된 서비스에 따른 인증 */}
      {selectedService === 'apple-music' ? <AppleMusicAuth /> : <YouTubeMusicAuth />}
      
      {/* 플레이리스트 생성기 */}
      <PlaylistCreator 
        tracks={allTracks} 
        videoTitle={videoTitle} 
        selectedService={selectedService}
      />
      
      {/* 음악 목록 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-youtube-red to-red-600 text-white p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">🎵 추출된 음악 목록</h2>
              <p className="text-red-100 text-sm sm:text-base">
                총 {formattedTracks.length}곡의 음악을 발견했습니다
                {sourceInfo && (
                  <span className="block sm:inline sm:ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded mt-1 sm:mt-0">
                    📍 {sourceInfo}에서 추출
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={copyToClipboard}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 min-h-[44px] sm:min-h-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <span>복사</span>
              </button>
              <button
                onClick={downloadAsText}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 min-h-[44px] sm:min-h-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>다운로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* Music List */}
        <div className="p-4 sm:p-6">
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {formattedTracks.map((track, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 sm:space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-youtube-red rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium text-sm sm:text-base leading-tight">{track}</p>
                  {allTracks[index]?.timeStamp && (
                    <p className="text-gray-500 text-xs mt-1">⏱️ {allTracks[index].timeStamp}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => navigator.clipboard.writeText(track)}
                    className="text-gray-400 hover:text-gray-600 p-2 sm:p-1 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center rounded-lg sm:rounded-none hover:bg-gray-200 sm:hover:bg-transparent transition-colors"
                    title="이 곡만 복사"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 text-xs sm:text-sm text-gray-600">
            <span>📝 "노래제목 - 가수" 형태로 정리되었습니다</span>
            <span>✨ 중복 제거 및 정제 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 