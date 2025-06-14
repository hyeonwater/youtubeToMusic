import React from 'react';
import { useYouTubeViewModel } from '../viewmodels/useYouTubeViewModel';
import { formatNumber, getRelativeTime } from '../../shared/utils/youtube';
import { MusicList } from './MusicList';
import { containsMusicList } from '../../shared/utils/musicParser';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    author: string;
    publishedAt: string;
    likeCount: number;
  };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-youtube-red">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-youtube-red to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {comment.author.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {comment.author}
            </h3>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-youtube-red text-white rounded-full">
              📌 고정됨
            </span>
          </div>
          
          <div className="text-gray-800 text-sm leading-relaxed mb-3">
            {comment.content}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{formatNumber(comment.likeCount)}</span>
            </div>
            <span>{getRelativeTime(comment.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PinnedCommentsList: React.FC = () => {
  const { pinnedComments, commentsError, isLoading, videoInfo } = useYouTubeViewModel();

  // 음악 목록이 포함된 댓글이 있는지 확인
  const hasMusicComments = pinnedComments.some(comment => 
    containsMusicList(comment.content)
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (commentsError) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-red-800 font-medium">오류가 발생했습니다</h3>
              <p className="text-red-600 text-sm mt-1">{commentsError.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pinnedComments || pinnedComments.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-gray-600 font-medium text-lg mb-2">고정된 댓글이 없습니다</h3>
          <p className="text-gray-500 text-sm">이 비디오에는 고정된 댓글이 없거나 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // 음악 목록이 있으면 MusicList 컴포넌트를 표시
  if (hasMusicComments) {
    return (
      <div className="space-y-8">
        <MusicList comments={pinnedComments} videoTitle={videoInfo?.title} />
        
        {/* 원본 댓글도 표시 (접을 수 있게) */}
        <details className="w-full max-w-4xl mx-auto">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium mb-4">
            📋 원본 댓글 보기 ({pinnedComments.length}개)
          </summary>
          <div className="space-y-6">
            {pinnedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          고정된 댓글 ({pinnedComments.length}개)
        </h2>
        <p className="text-gray-600">
          이 YouTube 비디오에서 찾은 고정된 댓글들입니다.
        </p>
      </div>
      
      <div className="space-y-6">
        {pinnedComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}; 