import React from 'react';
import { YouTubeUrlInput } from '../components/YouTubeUrlInput';
import { VideoInfo } from '../components/VideoInfo';
import { PinnedCommentsList } from '../components/PinnedCommentsList';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎵 YouTube to Music
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              유튜브에 상세내용 또는 댓글에 노래 정보가 있으면 자동으로 추출해 플레이리스트를 만들어드립니다.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* URL Input Section */}
          <section>
            <YouTubeUrlInput />
          </section>

          {/* Video Info Section */}
          <section>
            <VideoInfo />
          </section>

          {/* Music List / Pinned Comments Section */}
          <section>
            <PinnedCommentsList />
          </section>
        </div>
      </main>

    </div>
  );
}; 