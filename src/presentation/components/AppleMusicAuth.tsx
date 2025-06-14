import React from 'react';
import { useAppleMusicStore } from '../stores/useAppleMusicStore';

export const AppleMusicAuth: React.FC = () => {
  const {
    authState,
    isInitialized,
    initialize,
    authorize,
    unauthorize
  } = useAppleMusicStore();

  React.useEffect(() => {
    // 컴포넌트 마운트 시 Apple Music 초기화
    if (!isInitialized && !authState.isLoading) {
      initialize();
    }
  }, [isInitialized, authState.isLoading, initialize]);

  const handleLogin = async () => {
    if (!isInitialized) {
      const initialized = await initialize();
      if (!initialized) return;
    }
    
    await authorize();
  };

  const handleLogout = async () => {
    await unauthorize();
  };

  if (!isInitialized && authState.isLoading) {
    return (
      <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 border-t-apple-red rounded-full animate-spin flex-shrink-0"></div>
        <span className="text-gray-600 text-sm sm:text-base">Apple Music 초기화 중...</span>
      </div>
    );
  }

  if (!isInitialized && authState.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <h3 className="text-red-800 font-medium text-sm sm:text-base">Apple Music 초기화 실패</h3>
            <p className="text-red-600 text-sm mt-1 break-words">{authState.error}</p>
          </div>
        </div>
        <button
          onClick={() => initialize()}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto min-h-[44px] sm:min-h-0"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (authState.isAuthorized) {
    return (
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-800 font-medium text-sm sm:text-base">Apple Music 연결됨</h3>
              <p className="text-gray-600 text-sm break-words">
                플레이리스트를 생성할 준비가 완료되었습니다
                {authState.storefront && (
                  <span className="ml-1">({authState.storefront})</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={authState.isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Apple Music에 연결하기
        </h3>
        
        <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
          추출된 음악 목록을 Apple Music 플레이리스트로 자동 생성하려면 
          먼저 Apple Music에 로그인하세요.
        </p>

        <button
          onClick={handleLogin}
          disabled={authState.isLoading || !isInitialized}
          className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 sm:px-8 py-4 sm:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto min-h-[50px] sm:min-h-0"
        >
          {authState.isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>연결 중...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <span>Apple Music 연결</span>
            </>
          )}
        </button>

        {authState.error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm break-words">{authState.error}</p>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>* Apple Music 구독이 필요합니다</p>
        </div>
      </div>
    </div>
  );
}; 