# 학교생활도우미 (School Life Helper)

광주동신여자고등학교를 위한 학생 생활 지원 시스템입니다. 실시간으로 연결된 디스플레이와 제어 장치를 통해 학사일정, 급식, 교실 배정, 공지사항 등을 효율적으로 관리할 수 있습니다.

## 주요 기능

### 학사일정 관리
- 학사일정 등록, 수정, 삭제
- 실시간 일정 업데이트
- 디스플레이 화면에 자동 반영

### 급식 정보
- 일별 급식 메뉴 관리
- 칼로리 및 영양 정보 제공
- 알레르기 정보 표시

### 공지사항 시스템
- 메인 공지사항 (긴급 공지)
- 일반 공지사항
- 실시간 알림 기능

### 교실 배정 관리
- 교실별 시간표 관리
- 교사 배정 정보
- 실시간 변경사항 반영

### 관리자 기능
- 관리자 인증 시스템
- 실시간 시스템 모니터링
- 학교 차단 기능 (긴급상황 대응)

## 기술 스택

- **Frontend**: React 19, Vite
- **UI Library**: Material-UI (MUI)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Deployment**: GitHub Pages
- **PWA**: Progressive Web App 지원

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/swon8468/simpleInfo.git
cd simpleInfo
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env` 파일을 생성하고 Firebase 설정을 추가하세요:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 프로덕션 빌드
```bash
npm run build
```

## 배포

### GitHub Pages 배포
```bash
npm run deploy
```

배포된 사이트: https://swon8468.github.io/simpleInfo/

## 보안

- Firebase API 키는 환경변수로 관리
- 관리자 인증 시스템 구현
- HTTPS 통신 보장

## 사용법

### 관리자 로그인
1. 관리자 페이지 접속
2. 관리자 인증 정보 입력
3. 시스템 관리 기능 사용

### 일반 사용자
1. 메인 화면에서 정보 확인
2. 공지사항 및 급식 정보 조회
3. 학사일정 확인

## 주요 특징

- **라즈베리파이 호환성**: 이모지 대신 MUI 아이콘 사용으로 하드웨어 호환성 향상
- **실시간 동기화**: Firebase를 통한 실시간 데이터 동기화
- **반응형 디자인**: 다양한 디바이스에서 최적화된 화면 제공
- **PWA 지원**: 오프라인 사용 가능 및 앱 설치 지원

## 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 문의해주세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발자**: swon8468  
**학교**: 광주동신여자고등학교  
**버전**: 1.0.0