# 배포 가이드 및 체크리스트

## 🚀 배포 전 체크리스트

### 1. 환경 설정 확인
- [ ] `.env` 파일에 모든 필수 환경 변수 설정
- [ ] Firebase 프로젝트 설정 완료
- [ ] Riot API 키 발급 및 설정
- [ ] 결제 시스템 API 키 설정
- [ ] SMS 인증 API 키 설정

### 2. 코드 품질 검사
- [ ] `npm run lint` 통과
- [ ] `npm run type-check` 통과
- [ ] `npm run test` 모든 테스트 통과
- [ ] 코드 리뷰 완료

### 3. 성능 최적화 확인
- [ ] 이미지 최적화 완료
- [ ] 번들 크기 최적화
- [ ] 메모리 누수 검사
- [ ] 성능 프로파일링 완료

### 4. 보안 검사
- [ ] API 키 노출 검사
- [ ] 민감한 정보 하드코딩 검사
- [ ] 권한 설정 검토
- [ ] 데이터 암호화 확인

### 5. 기능 테스트
- [ ] 회원가입/로그인 플로우
- [ ] 내전 생성/참가 기능
- [ ] 용병 등록/고용 기능
- [ ] 채팅 시스템
- [ ] 결제 시스템
- [ ] 푸시 알림

## 📱 플랫폼별 배포 가이드

### iOS 배포

#### 1. Apple Developer 계정 설정
```bash
# Apple Developer 계정 필요
# - Apple Developer Program 가입 ($99/년)
# - App Store Connect 접근 권한
```

#### 2. 인증서 및 프로비저닝 프로파일
```bash
# EAS를 통한 자동 관리 (권장)
eas build --platform ios --profile production

# 수동 관리 시
# - iOS Distribution Certificate
# - App Store Provisioning Profile
```

#### 3. App Store Connect 설정
- [ ] 앱 정보 입력
- [ ] 스크린샷 업로드 (6.7", 6.5", 5.5", 12.9")
- [ ] 앱 설명 및 키워드
- [ ] 개인정보 처리방침 URL
- [ ] 지원 URL
- [ ] 연령 등급 설정

#### 4. 빌드 및 제출
```bash
# 프로덕션 빌드
npm run build:ios

# App Store 제출
npm run submit:ios
```

### Android 배포

#### 1. Google Play Console 설정
```bash
# Google Play Console 계정 필요
# - 개발자 등록비 $25 (일회성)
# - Google Play Console 접근 권한
```

#### 2. 키스토어 생성
```bash
# EAS를 통한 자동 관리 (권장)
eas build --platform android --profile production

# 수동 관리 시
keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000
```

#### 3. Google Play Console 설정
- [ ] 앱 정보 입력
- [ ] 스크린샷 업로드 (폰, 태블릿)
- [ ] 앱 설명 및 키워드
- [ ] 개인정보 처리방침 URL
- [ ] 지원 URL
- [ ] 콘텐츠 등급 설정

#### 4. 빌드 및 제출
```bash
# 프로덕션 빌드
npm run build:android

# Google Play Store 제출
npm run submit:android
```

## 🔧 환경별 설정

### 개발 환경 (Development)
```bash
# 개발 서버 실행
npm start

# 개발 빌드
npm run preview:android
npm run preview:ios
```

### 스테이징 환경 (Staging)
```bash
# 스테이징 빌드
eas build --platform all --profile preview

# 내부 테스터 배포
eas submit --platform all --profile preview
```

### 프로덕션 환경 (Production)
```bash
# 프로덕션 빌드
eas build --platform all --profile production

# 스토어 제출
eas submit --platform all --profile production
```

## 📊 모니터링 설정

### 1. 에러 추적 (Sentry)
```javascript
// Sentry 설정
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

### 2. 분석 (Firebase Analytics)
```javascript
// Firebase Analytics 설정
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('app_open');
```

### 3. 성능 모니터링
```javascript
// Firebase Performance 설정
import perf from '@react-native-firebase/perf';

const trace = await perf().startTrace('custom_trace');
// ... 작업 수행
await trace.stop();
```

## 🔄 업데이트 배포

### OTA 업데이트 (Over-The-Air)
```bash
# 코드 변경사항만 업데이트 (네이티브 코드 변경 없음)
eas update --branch production --message "버그 수정 및 성능 개선"
```

### 전체 앱 업데이트
```bash
# 네이티브 코드 변경 시 전체 빌드 필요
eas build --platform all --profile production
eas submit --platform all --profile production
```

## 🛡️ 보안 체크리스트

### 코드 보안
- [ ] API 키 환경 변수 처리
- [ ] 민감한 정보 하드코딩 제거
- [ ] 디버그 코드 제거
- [ ] 콘솔 로그 제거

### 네트워크 보안
- [ ] HTTPS 통신 강제
- [ ] Certificate Pinning 적용
- [ ] API 레이트 리미팅
- [ ] 토큰 만료 처리

### 데이터 보안
- [ ] 로컬 저장소 암호화
- [ ] 개인정보 암호화
- [ ] 백업 데이터 보안
- [ ] 로그 데이터 마스킹

## 📋 출시 후 체크리스트

### 1. 모니터링 확인
- [ ] 에러 발생률 모니터링
- [ ] 성능 지표 확인
- [ ] 사용자 피드백 수집
- [ ] 앱 스토어 리뷰 모니터링

### 2. 지원 준비
- [ ] 고객 지원 채널 운영
- [ ] FAQ 문서 준비
- [ ] 버그 신고 프로세스
- [ ] 업데이트 계획 수립

### 3. 마케팅
- [ ] 앱 스토어 최적화 (ASO)
- [ ] 소셜 미디어 홍보
- [ ] 커뮤니티 참여
- [ ] 인플루언서 협업

## 🚨 긴급 대응 계획

### 크리티컬 버그 발생 시
1. 즉시 에러 로그 분석
2. 핫픽스 개발 및 테스트
3. OTA 업데이트 또는 긴급 빌드
4. 사용자 공지 및 사과

### 서버 장애 시
1. 백업 서버 활성화
2. 사용자 공지
3. 데이터 복구 작업
4. 장애 원인 분석 및 개선

---

이 가이드를 따라 안전하고 성공적인 배포를 진행하세요! 🚀 