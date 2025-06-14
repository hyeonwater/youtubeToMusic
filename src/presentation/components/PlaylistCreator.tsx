import React, { useState } from 'react';
import { useAppleMusicStore } from '../stores/useAppleMusicStore';
import type { MusicTrack } from '../../shared/utils/musicParser';

interface PlaylistCreatorProps {
  tracks: MusicTrack[];
  videoTitle?: string;
}

export const PlaylistCreator: React.FC<PlaylistCreatorProps> = ({ 
  tracks, 
  videoTitle 
}) => {
  const {
    authState,
    isCreatingPlaylist,
    creationProgress,
    lastCreationResult,
    createPlaylistWithTracks,
    clearResults,
    authorize
  } = useAppleMusicStore();

  const [playlistName, setPlaylistName] = useState(
    () => videoTitle ? `${videoTitle.slice(0, 50)}${videoTitle.length > 50 ? '...' : ''}` : 'YouTube Music Playlist'
  );
  const [description, setDescription] = useState(
    'YouTube to Music 앱으로 생성된 플레이리스트'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setError('플레이리스트 이름을 입력해주세요.');
      return;
    }

    try {
      setError('');
      console.log('🎵 Starting playlist creation...');
      console.log('📋 Playlist name:', playlistName);
      console.log('🎶 Number of tracks:', tracks.length);
      
      // Apple Music 인증 상태 확인
      console.log('🔐 Auth state:', authState);
      
      if (!authState.isAuthorized) {
        console.log('❌ User not authorized, starting authorization...');
        const success = await authorize();
        if (!success) {
          throw new Error('Apple Music 인증에 실패했습니다.');
        }
      }

      clearResults();
      const result = await createPlaylistWithTracks(playlistName, tracks, description);
      console.log('📊 Playlist creation result:', result);
      
      if (!result.success) {
        console.error('❌ Playlist creation failed with result:', result);
        throw new Error(result.error || '플레이리스트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 Playlist creation error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      setError(
        error instanceof Error 
          ? `플레이리스트 생성 실패: ${error.message}` 
          : '알 수 없는 오류가 발생했습니다.'
      );
    }
  };

  if (!authState.isAuthorized) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-gray-600 font-medium mb-1 text-base sm:text-lg">Apple Music 로그인 필요</h3>
          <p className="text-gray-500 text-sm">
            플레이리스트를 생성하려면 먼저 Apple Music에 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="text-gray-600 font-medium mb-1 text-base sm:text-lg">음악 목록이 없습니다</h3>
          <p className="text-gray-500 text-sm">
            먼저 YouTube 영상에서 음악 목록을 추출해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 플레이리스트 생성 결과 표시
  if (lastCreationResult) {
    return (
      <div className="space-y-4">
        {lastCreationResult.success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-green-800 font-medium text-base sm:text-lg mb-2">
                  🎉 플레이리스트 생성 완료!
                </h3>
                <div className="text-green-700 space-y-1">
                  <p className="font-medium text-sm sm:text-base break-words">"{lastCreationResult.playlistName}"</p>
                  <p className="text-sm">
                    총 {tracks.length}곡 중 {lastCreationResult.addedSongs}곡 추가됨
                  </p>
                  {lastCreationResult.failedSongs.length > 0 && (
                    <p className="text-sm">
                      {lastCreationResult.failedSongs.length}곡을 찾을 수 없어 추가하지 못했습니다
                    </p>
                  )}
                </div>
              </div>
            </div>

            {lastCreationResult.failedSongs.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-green-700 text-sm font-medium">
                  추가하지 못한 곡 목록 보기 ({lastCreationResult.failedSongs.length}곡)
                </summary>
                <div className="mt-2 bg-green-100 rounded p-3 max-h-32 overflow-y-auto">
                  {lastCreationResult.failedSongs.map((song, index) => (
                    <div key={index} className="text-sm text-green-800 py-1 break-words">
                      • {song}
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => clearResults()}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0"
              >
                새 플레이리스트 만들기
              </button>
              <button
                onClick={() => window.open('https://music.apple.com', '_blank')}
                className="bg-white hover:bg-gray-50 text-green-700 border border-green-300 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0"
              >
                Apple Music에서 확인
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <h3 className="text-red-800 font-medium text-base sm:text-lg">플레이리스트 생성 실패</h3>
                <p className="text-red-600 text-sm mt-1 break-words">
                  {lastCreationResult.error || '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => clearResults()}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    );
  }

  // 플레이리스트 생성 중 표시
  if (isCreatingPlaylist) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-blue-800 font-medium text-base sm:text-lg mb-2">
            플레이리스트 생성 중...
          </h3>
          <div className="text-blue-700 space-y-2">
            <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ 
                  width: `${creationProgress.total > 0 ? (creationProgress.current / creationProgress.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <p className="text-sm">
              {creationProgress.current} / {creationProgress.total} 곡 처리 중
            </p>
            {creationProgress.currentTrack && (
              <p className="text-xs break-words max-w-full px-4">
                현재: {creationProgress.currentTrack}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 플레이리스트 생성 폼
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">
            Apple Music 플레이리스트 생성
          </h3>
          <p className="text-gray-600 text-sm">
            {tracks.length}곡을 Apple Music 플레이리스트로 추가합니다
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="playlistName" className="block text-sm font-medium text-gray-700 mb-2">
            플레이리스트 이름 *
          </label>
          <input
            id="playlistName"
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base sm:text-sm"
            placeholder="플레이리스트 이름을 입력하세요"
            maxLength={100}
          />
        </div>

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1 py-2 min-h-[44px] sm:min-h-0"
          >
            <span>고급 설정</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base sm:text-sm resize-none"
                placeholder="플레이리스트 설명 (선택사항)"
                rows={3}
                maxLength={300}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">📋 추가될 곡 목록</h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {tracks.slice(0, 10).map((track, index) => (
              <div key={index} className="text-sm text-gray-700 py-1 break-words">
                {index + 1}. {track.title} - {track.artist}
              </div>
            ))}
            {tracks.length > 10 && (
              <div className="text-sm text-gray-500 py-1">
                ... 외 {tracks.length - 10}곡
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleCreatePlaylist}
            disabled={!playlistName.trim() || isCreatingPlaylist}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 py-4 sm:py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-h-[50px] sm:min-h-0"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>플레이리스트 생성</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <h4 className="text-red-800 font-medium text-sm">오류</h4>
                <p className="text-red-600 text-sm mt-1 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 p-1 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="font-medium text-yellow-800 mb-1">⚠️ 주의사항</p>
          <ul className="space-y-1 text-yellow-700">
            <li>• Apple Music에서 검색되지 않는 곡은 추가되지 않습니다</li>
            <li>• 곡 제목과 아티스트명이 정확할수록 매칭 성공률이 높습니다</li>
            <li>• 플레이리스트 생성에는 곡 수에 따라 시간이 소요될 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 