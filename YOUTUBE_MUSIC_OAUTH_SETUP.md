# YouTube Music OAuth 설정 가이드

YouTube Music에서 자동 플레이리스트 생성 기능을 사용하려면 Google OAuth 2.0 인증을 설정해야 합니다.

## 🚀 OAuth 설정하기

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하세요
2. 새 프로젝트를 생성하거나 기존 프로젝트를 선택하세요
3. **API 및 서비스 > 라이브러리**로 이동하세요
4. **YouTube Data API v3**를 검색하고 활성화하세요

### 2. OAuth 2.0 클라이언트 ID 생성

1. **API 및 서비스 > 사용자 인증 정보**로 이동하세요
2. **+ 사용자 인증 정보 만들기 > OAuth 클라이언트 ID**를 클릭하세요
3. 애플리케이션 유형으로 **웹 애플리케이션**을 선택하세요
4. 다음 정보를 입력하세요:
   - **이름**: `YouTube Music Playlist Creator`
   - **승인된 JavaScript 원본**: `http://localhost:3000`
   - **승인된 리디렉션 URI**: `http://localhost:3000/oauth/callback`

### 3. 클라이언트 ID 적용

생성된 클라이언트 ID를 다음 파일에 적용하세요:

```typescript
// src/infrastructure/repositories/YouTubeMusicRepository.ts
private readonly CLIENT_ID = 'YOUR_ACTUAL_GOOGLE_CLIENT_ID'; // 여기에 실제 클라이언트 ID 입력
```

### 4. OAuth 동의 화면 설정

1. **OAuth 동의 화면**으로 이동하세요
2. **외부** 사용자 유형을 선택하세요 (개인 사용시)
3. 다음 정보를 입력하세요:
   - **앱 이름**: `YouTube Music Playlist Creator`
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. **범위** 섹션에서 다음 스코프를 추가하세요:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.force-ssl`

## ✨ OAuth 연결 후 가능한 기능

OAuth 인증을 완료하면 다음 기능들이 활성화됩니다:

### 🎵 자동 플레이리스트 생성
- YouTube Music에 새 플레이리스트 자동 생성
- 플레이리스트 제목과 설명 자동 설정
- 개인 계정에 안전하게 저장

### 🎶 자동 곡 추가
- 검색된 곡들을 플레이리스트에 자동 추가
- 실시간 진행률 표시
- 추가 성공/실패 상태 확인

### 🔗 직접 링크 생성
- 생성된 플레이리스트의 YouTube Music 링크 제공
- 바로 접근 가능한 URL 생성

## 🔒 보안 및 권한

### 요청되는 권한
- **YouTube 계정 액세스**: 플레이리스트 생성 및 관리
- **읽기 권한**: 기존 플레이리스트 조회
- **쓰기 권한**: 새 플레이리스트 생성 및 곡 추가

### 데이터 보안
- 모든 데이터는 로컬 브라우저에만 저장
- 서버로 전송되지 않음
- Google OAuth 표준 보안 프로토콜 사용

## 🛠️ 개발 환경 설정

### 로컬 테스트용 설정
```bash
# 개발 서버 실행
npm start

# 브라우저에서 접속
http://localhost:3000
```

### 프로덕션 배포시 주의사항
- 프로덕션 도메인을 Google Cloud Console의 승인된 도메인에 추가
- HTTPS 사용 필수
- 환경변수로 클라이언트 ID 관리 권장

## ❓ 문제 해결

### OAuth 인증 실패시
1. 클라이언트 ID가 올바르게 설정되었는지 확인
2. 승인된 도메인이 정확한지 확인
3. YouTube Data API v3가 활성화되었는지 확인
4. 브라우저 쿠키 및 로컬 스토리지 초기화

### API 할당량 초과시  
- Google Cloud Console에서 할당량 확인
- 필요시 할당량 증가 요청
- API 호출 빈도 제한 확인

## 📞 지원

OAuth 설정에 문제가 있으시면:
1. Google Cloud Console 도움말 참조
2. YouTube Data API 문서 확인
3. 브라우저 개발자 도구에서 오류 로그 확인

---

**⚠️ 주의**: OAuth 설정 없이도 음악 검색 및 수동 플레이리스트 추가는 가능합니다. 