import React, { useEffect } from 'react';
import { useYouTubeMusicStore } from '../stores/useYouTubeMusicStore';

export const YouTubeMusicAuth: React.FC = () => {
  const {
    authState,
    isInitialized,
    initialize,
    authorize,
    unauthorize
  } = useYouTubeMusicStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleAuthorize = async () => {
    const success = await authorize();
    if (!success) {
      console.error('YouTube Music authorization failed');
    }
  };

  const handleUnauthorize = async () => {
    await unauthorize();
  };

  if (!isInitialized) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">YouTube Music 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (authState.isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">YouTube Music 인증 중...</p>
        </div>
      </div>
    );
  }

  if (authState.isAuthorized) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.582 6.186c-.23-2.12-2.075-3.965-4.195-4.195C15.413 1.5 12 1.5 12 1.5s-3.413 0-5.387.491C4.493 2.221 2.648 4.066 2.418 6.186 1.927 8.16 1.927 12 1.927 12s0 3.84.491 5.814c.23 2.12 2.075 3.965 4.195 4.195C8.587 22.5 12 22.5 12 22.5s3.413 0 5.387-.491c2.12-.23 3.965-2.075 4.195-4.195C22.073 15.84 22.073 12 22.073 12s0-3.84-.491-5.814z"/>
                <polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/>
              </svg>
            </div>
            <div>
              <h3 className="text-gray-900 font-medium text-base sm:text-lg">YouTube Music 연결됨</h3>
              <p className="text-gray-500 text-sm">플레이리스트를 생성할 준비가 되었습니다</p>
            </div>
          </div>
          <button
            onClick={handleUnauthorize}
            className="text-gray-400 hover:text-gray-600 p-2 sm:p-1 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0 flex items-center justify-center rounded-lg sm:rounded-none hover:bg-gray-100 sm:hover:bg-transparent transition-colors"
            title="연결 해제"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.582 6.186c-.23-2.12-2.075-3.965-4.195-4.195C15.413 1.5 12 1.5 12 1.5s-3.413 0-5.387.491C4.493 2.221 2.648 4.066 2.418 6.186 1.927 8.16 1.927 12 1.927 12s0 3.84.491 5.814c.23 2.12 2.075 3.965 4.195 4.195C8.587 22.5 12 22.5 12 22.5s3.413 0 5.387-.491c2.12-.23 3.965-2.075 4.195-4.195C22.073 15.84 22.073 12 22.073 12s0-3.84-.491-5.814z"/>
            <polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/>
          </svg>
        </div>
        <h3 className="text-gray-900 font-medium text-base sm:text-lg mb-2">YouTube Music 연결</h3>
        <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
          YouTube Music에서 플레이리스트를 생성하려면 로그인이 필요합니다.
        </p>
        
        {authState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{authState.error}</p>
          </div>
        )}

        <button
          onClick={handleAuthorize}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[50px] sm:min-h-0 flex items-center justify-center mx-auto space-x-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.582 6.186c-.23-2.12-2.075-3.965-4.195-4.195C15.413 1.5 12 1.5 12 1.5s-3.413 0-5.387.491C4.493 2.221 2.648 4.066 2.418 6.186 1.927 8.16 1.927 12 1.927 12s0 3.84.491 5.814c.23 2.12 2.075 3.965 4.195 4.195C8.587 22.5 12 22.5 12 22.5s3.413 0 5.387-.491c2.12-.23 3.965-2.075 4.195-4.195C22.073 15.84 22.073 12 22.073 12s0-3.84-.491-5.814z"/>
          </svg>
          <span>Google 계정으로 로그인</span>
        </button>

     
      </div>
    </div>
  );
}; 