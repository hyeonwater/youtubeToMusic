import React, { useEffect } from 'react';
import { useYouTubeMusicStore } from '../stores/useYouTubeMusicStore';

export const OAuthCallback: React.FC = () => {
  const { handleOAuthCallback } = useYouTubeMusicStore();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔗 OAuth 콜백 페이지 로드됨');
      console.log('📍 현재 URL:', window.location.href);
      console.log('🔍 URL 파라미터:', window.location.search);
      console.log('🌐 현재 Origin:', window.location.origin);
      console.log('📦 예상 리디렉션 URI:', `${window.location.origin}/youtubeToMusic/oauth/callback`);
      
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');

      console.log('📋 파라미터 분석:');
      console.log('  - code:', code);
      console.log('  - error:', error);
      console.log('  - state:', state);

      if (error) {
        console.error('❌ OAuth 오류:', error);
        alert('로그인 중 오류가 발생했습니다: ' + error);
        // 개발 환경과 프로덕션 환경에 따라 다른 경로로 리디렉션
        window.location.href = import.meta.env.MODE === 'development' ? '/' : '/youtubeToMusic/';
        return;
      }

      if (code) {
        console.log('✅ OAuth 인증 코드 받음:', code.substring(0, 20) + '...');
        try {
          await handleOAuthCallback(code);
          console.log('🎉 YouTube Music 로그인 완료!');
          // 개발 환경과 프로덕션 환경에 따라 다른 경로로 리디렉션
          window.location.href = import.meta.env.MODE === 'development' ? '/' : '/youtubeToMusic/';
        } catch (error) {
          console.error('❌ OAuth 콜백 처리 실패:', error);
          alert('로그인 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
          // 개발 환경과 프로덕션 환경에 따라 다른 경로로 리디렉션
          window.location.href = import.meta.env.MODE === 'development' ? '/' : '/youtubeToMusic/';
        }
      } else {
        console.error('❌ OAuth 코드가 없습니다');
        console.log('⚠️ 메인 페이지로 리디렉션합니다');
        // 개발 환경과 프로덕션 환경에 따라 다른 경로로 리디렉션
        window.location.href = import.meta.env.MODE === 'development' ? '/' : '/youtubeToMusic/';
      }
    };

    handleCallback();
  }, [handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">YouTube Music 로그인 처리 중...</h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}; 