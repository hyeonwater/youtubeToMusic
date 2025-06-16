import React from 'react';
import type { MusicServiceType } from '../../shared/types/musicService';

interface MusicServiceSelectorProps {
  selectedService: MusicServiceType;
  onServiceChange: (service: MusicServiceType) => void;
}

export const MusicServiceSelector: React.FC<MusicServiceSelectorProps> = ({
  selectedService,
  onServiceChange
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🎵 플레이리스트 생성 서비스 선택</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Apple Music */}
        <div 
          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedService === 'apple-music' 
              ? 'border-pink-500 bg-pink-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onServiceChange('apple-music')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.001-.08-.014-.12-.014H5.986c-.04 0-.08.013-.12.014-.525.015-1.046.057-1.563.15-.674.121-1.304.353-1.878.727C1.304 1.624.558 2.624.24 3.934.066 4.654 0 5.386 0 6.124v11.754c0 .738.065 1.47.24 2.189.318 1.31 1.063 2.31 2.181 3.043.574.374 1.204.606 1.878.726.517.094 1.038.136 1.563.151.04.001.08.013.12.013h12.013c.04 0 .08-.012.12-.013.526-.015 1.047-.057 1.564-.151.673-.12 1.303-.352 1.877-.726 1.118-.733 1.863-1.734 2.181-3.043.175-.719.24-1.451.24-2.189V6.124zM8.717 8.883c0-.414.088-.778.263-1.09.175-.313.42-.56.736-.742.315-.18.675-.271 1.082-.271.406 0 .766.091 1.081.271.316.182.562.429.736.742.175.312.262.676.262 1.09 0 .415-.087.779-.262 1.091-.174.313-.42.56-.736.742-.315.18-.675.271-1.081.271-.407 0-.767-.091-1.082-.271-.316-.182-.561-.429-.736-.742-.175-.312-.263-.676-.263-1.091zm7.447 0c0-.414.088-.778.263-1.09.175-.313.42-.56.736-.742.315-.18.675-.271 1.082-.271.406 0 .766.091 1.081.271.316.182.562.429.736.742.175.312.262.676.262 1.09 0 .415-.087.779-.262 1.091-.174.313-.42.56-.736.742-.315.18-.675.271-1.081.271-.407 0-.767-.091-1.082-.271-.316-.182-.561-.429-.736-.742-.175-.312-.263-.676-.263-1.091z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Apple Music</h4>
            </div>
            {selectedService === 'apple-music' && (
              <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
         
        </div>

        {/* YouTube Music */}
        <div 
          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedService === 'youtube-music' 
              ? 'border-red-500 bg-red-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onServiceChange('youtube-music')}
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.582 6.186c-.23-2.12-2.075-3.965-4.195-4.195C15.413 1.5 12 1.5 12 1.5s-3.413 0-5.387.491C4.493 2.221 2.648 4.066 2.418 6.186 1.927 8.16 1.927 12 1.927 12s0 3.84.491 5.814c.23 2.12 2.075 3.965 4.195 4.195C8.587 22.5 12 22.5 12 22.5s3.413 0 5.387-.491c2.12-.23 3.965-2.075 4.195-4.195C22.073 15.84 22.073 12 22.073 12s0-3.84-.491-5.814z"/>
                <polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">YouTube Music</h4>
            </div>
            {selectedService === 'youtube-music' && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
        </div>
      </div>

   
    </div>
  );
}; 