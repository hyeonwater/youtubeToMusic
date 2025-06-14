import React from 'react';
import { useYouTubeViewModel } from '../viewmodels/useYouTubeViewModel';

export const YouTubeUrlInput: React.FC = () => {
  const { 
    currentUrl,
    isLoading, 
    error,
    handleUrlChange,
    clearError
  } = useYouTubeViewModel();

  const [inputValue, setInputValue] = React.useState(currentUrl?.url || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (error) {
      clearError();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      return;
    }

    handleUrlChange(inputValue);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label 
            htmlFor="youtube-url" 
            className="text-lg font-medium text-gray-700"
          >
            YouTube URL 입력
          </label>
          <div className="flex space-x-3">
            <input
              id="youtube-url"
              type="url"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>추출 중...</span>
                </div>
              ) : (
                '추출하기'
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}; 