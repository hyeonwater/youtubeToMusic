import jwt from 'jsonwebtoken';
import fs from 'fs';

// 🔧 여기에 실제 값들을 입력하세요
const config = {
  TEAM_ID: '9Q9JG2Q9HB',                    // 이전 스크린샷에서 확인된 Team ID
  KEY_ID: 'JXB973UC6V',                    // AuthKey_XXXXXXXXXX.p8에서 XXXXXXXXXX 부분
  PRIVATE_KEY_PATH: './AuthKey_JXB973UC6V.p8'  // 다운로드한 .p8 파일 경로
};

function generateAppleMusicToken() {
  try {
    console.log('🔑 Apple Music Developer Token 생성 중...\n');
    
    // Private Key 읽기
    const privateKey = fs.readFileSync(config.PRIVATE_KEY_PATH, 'utf8');
    console.log('✅ Private Key 파일 읽기 성공');
    
    // JWT Payload 설정
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: config.TEAM_ID,
      iat: now,
      exp: now + (180 * 24 * 60 * 60) // 180일 후 만료
    };
    
    // JWT 토큰 생성
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: config.KEY_ID
      }
    });
    
    console.log('✅ Developer Token 생성 성공!\n');
    console.log('📋 토큰 정보:');
    console.log(`Team ID: ${config.TEAM_ID}`);
    console.log(`Key ID: ${config.KEY_ID}`);
    console.log(`만료일: ${new Date((now + 180 * 24 * 60 * 60) * 1000).toLocaleDateString()}\n`);
    
    console.log('🔗 환경변수에 추가할 토큰:');
    console.log(`VITE_APPLE_MUSIC_DEVELOPER_TOKEN=${token}\n`);
    
    // .env 파일 자동 업데이트
    updateEnvFile(token);
    
    // 토큰 검증 안내
    verifyToken(token);
    
    return token;
    
  } catch (error) {
    console.error('❌ 토큰 생성 실패:', error.message);
    console.error('\n🔍 해결 방법:');
    console.error('1. TEAM_ID, KEY_ID 값이 올바른지 확인');
    console.error('2. .p8 파일 경로가 정확한지 확인');
    console.error('3. .p8 파일이 손상되지 않았는지 확인');
    process.exit(1);
  }
}

function updateEnvFile(token) {
  try {
    const envPath = '.env';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // 기존 Apple Music 토큰이 있으면 교체
      if (envContent.includes('VITE_APPLE_MUSIC_DEVELOPER_TOKEN=')) {
        envContent = envContent.replace(
          /VITE_APPLE_MUSIC_DEVELOPER_TOKEN=.*/,
          `VITE_APPLE_MUSIC_DEVELOPER_TOKEN=${token}`
        );
      } else {
        envContent += `\nVITE_APPLE_MUSIC_DEVELOPER_TOKEN=${token}\n`;
      }
    } else {
      envContent = `# Apple Music Developer Token\nVITE_APPLE_MUSIC_DEVELOPER_TOKEN=${token}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 파일이 업데이트되었습니다!');
    
  } catch (error) {
    console.warn('⚠️  .env 파일 업데이트 실패:', error.message);
    console.log('수동으로 .env 파일에 토큰을 추가해주세요.');
  }
}

function verifyToken(token) {
  console.log('🔍 토큰 검증 안내');
  console.log('\n🌐 브라우저 콘솔에서 다음 코드로 토큰을 검증하세요:');
  console.log(`
fetch('https://api.music.apple.com/v1/catalog/us/search?term=test&types=songs&limit=1', {
  headers: {
    'Authorization': 'Bearer ${token.substring(0, 50)}...'
  }
})
.then(r => r.json())
.then(d => console.log('✅ 토큰 검증 성공!', d))
.catch(e => console.error('❌ 토큰 검증 실패:', e));
  `);
}

// 설정 확인
function checkConfig() {
  console.log('⚙️  설정 확인 중...\n');
  
  if (config.KEY_ID === 'YOUR_KEY_ID') {
    console.error('❌ KEY_ID를 설정해주세요!');
    console.error('AuthKey_XXXXXXXXXX.p8 파일명에서 XXXXXXXXXX 부분을 복사하세요.');
    process.exit(1);
  }
  
  if (!fs.existsSync(config.PRIVATE_KEY_PATH)) {
    console.error(`❌ Private Key 파일을 찾을 수 없습니다: ${config.PRIVATE_KEY_PATH}`);
    console.error('다운로드한 .p8 파일을 프로젝트 루트에 복사해주세요.');
    process.exit(1);
  }
  
  console.log('✅ 설정 확인 완료');
}

// 실행 (ES Module 방식)
checkConfig();
generateAppleMusicToken(); 