# 🎵 YouTube to Music

YouTube 비디오의 고정된 댓글에서 음악 목록을 자동으로 추출하고, Apple Music 플레이리스트로 변환하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- **🎯 스마트 음악 추출**: YouTube 비디오의 고정 댓글, 영상 설명, 일반 댓글에서 음악 목록을 자동 감지
- **🧹 자동 정제**: 중복 제거 및 "제목 - 아티스트" 형태로 깔끔하게 정리
- **🍎 Apple Music 연동**: 추출된 음악을 Apple Music 플레이리스트로 자동 생성
- **📱 반응형 디자인**: 모바일과 데스크톱에서 모두 최적화된 UI
- **⚡ 실시간 진행률**: 플레이리스트 생성 과정을 실시간으로 확인

## 🚀 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **상태 관리**: Zustand
- **스타일링**: TailwindCSS
- **API 통합**: YouTube Data API v3 + Apple MusicKit JS
- **아키텍처**: Clean Architecture 패턴

## 📋 사전 요구사항

1. **YouTube Data API Key**
   - [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
   - YouTube Data API v3 활성화
   - API 키 생성

2. **Apple Music Developer Token**
   - [Apple Developer](https://developer.apple.com/) 계정 필요
   - MusicKit 서비스 활성화
   - Developer Token 생성

3. **Apple Music 구독**
   - 플레이리스트 생성을 위해 활성화된 Apple Music 구독 필요

## ⚙️ 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/your-username/youtubeToMusic.git
cd youtubeToMusic
```

2. **의존성 설치**
```bash
npm install
# 또는
yarn install
```

3. **환경변수 설정**
```bash
# .env 파일 생성
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_apple_music_developer_token_here
```

4. **개발 서버 실행**
```bash
npm run dev
# 또는
yarn dev
```

## 📖 사용 방법

1. **YouTube URL 입력**
   - 음악 목록이 포함된 YouTube 비디오 URL을 입력

2. **음악 목록 추출**
   - 앱이 자동으로 고정 댓글, 영상 설명, 일반 댓글에서 음악을 찾아 추출

3. **Apple Music 로그인**
   - Apple Music 계정으로 로그인

4. **플레이리스트 생성**
   - 플레이리스트 이름 설정
   - 자동으로 Apple Music에서 곡을 검색하고 플레이리스트 생성

## 🎯 지원하는 음악 목록 형식

- `아티스트 - 곡제목`
- `시간 아티스트 - 곡제목` (예: `0:00 Artist - Song`)
- `번호. 아티스트 - 곡제목 시간` (예: `1. Artist - Song 3:45`)
- `시간범위 곡제목-아티스트` (예: `3:09-5:50 Song-Artist`)

## 🏗️ 프로젝트 구조

```
src/
├── app/                    # 애플리케이션 설정
├── domain/                 # 도메인 레이어
│   ├── entities/          # 엔티티
│   ├── repositories/      # 레포지토리 인터페이스
│   └── services/          # 도메인 서비스
├── infrastructure/         # 인프라 레이어
│   ├── api/              # API 클라이언트
│   └── repositories/     # 레포지토리 구현체
├── presentation/          # 프레젠테이션 레이어
│   ├── components/       # React 컴포넌트
│   ├── pages/           # 페이지 컴포넌트
│   ├── stores/          # 상태 관리
│   └── viewmodels/      # 뷰모델
└── shared/               # 공유 유틸리티
    ├── types/           # 타입 정의
    └── utils/           # 유틸리티 함수
```

## 🔧 주요 컴포넌트

- **MusicList**: 추출된 음악 목록 표시
- **AppleMusicAuth**: Apple Music 인증 관리
- **PlaylistCreator**: 플레이리스트 생성 인터페이스
- **YouTubeUrlInput**: YouTube URL 입력 처리

## ⚠️ 주의사항

- Apple Music에서 검색되지 않는 곡은 플레이리스트에 추가되지 않습니다
- 곡 제목과 아티스트명이 정확할수록 매칭 성공률이 높습니다
- API 요청 제한으로 인해 대량의 곡 처리 시 시간이 소요될 수 있습니다

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
