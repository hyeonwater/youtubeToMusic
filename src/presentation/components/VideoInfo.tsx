import React from 'react';
import { useYouTubeViewModel } from '../viewmodels/useYouTubeViewModel';
import { generateThumbnailUrl, generateVideoUrl } from '../../shared/utils/youtube';

export const VideoInfo: React.FC = () => {
  const { currentUrl, currentVideoId } = useYouTubeViewModel();

  if (!currentUrl || !currentUrl.isValid || !currentVideoId) {
    return null;
  }

  const thumbnailUrl = generateThumbnailUrl(currentVideoId, 'medium');
  const videoUrl = generateVideoUrl(currentVideoId);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:flex-shrink-0">
            <img 
              src={thumbnailUrl} 
              alt="Video thumbnail"
              className="h-48 w-full object-cover md:h-32 md:w-48"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/320x180/ff0000/ffffff?text=YouTube';
              }}
            />
          </div>
          <div className="p-6 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-youtube-red rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136C4.495 20.455 12 20.455 12 20.455s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600">YouTube 비디오</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  비디오 ID: {currentVideoId}
                </h3>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">{currentUrl.url}</span>
                  </span>
                </div>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-youtube-red transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  보기
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 