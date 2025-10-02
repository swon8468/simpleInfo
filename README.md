# 학교생활도우미 (School Life Assistant)

광주동신여자고등학교를 위한 학생 생활 도우미 웹 애플리케이션입니다. 제어용과 출력용 디바이스로 구성되어 실시간으로 학교 정보를 관리하고 표시할 수 있습니다.

## 🚀 주요 기능

### 📱 제어용 디바이스
- **학사일정 관리**: 월별/주별 학사일정 조회 및 제어
- **급식 정보**: 일별 급식 메뉴 확인 및 날짜 이동
- **알레르기 정보**: 4x6 표 형태로 알레르기 정보 표시
- **공지사항**: 공지사항 조회 및 네비게이션
- **교실 배치**: 교실 배치도 확인 안내
- **연결 관리**: PIN 기반 실시간 연결 및 해제

### 🖥️ 출력용 디바이스
- **메인 화면**: 학교 로고와 프로젝트명 표시
- **학사일정**: 월별/주별 달력 형태로 학사일정 표시
- **급식 정보**: 점심/저녁 메뉴를 깔끔한 디자인으로 표시
- **교실 배치**: Firebase Storage에 업로드된 교실 배치도 표시
- **공지사항**: 테이블 형태로 공지사항 목록 표시 (조회수 자동 증가)

### 🔧 관리자 패널
- **학사일정 관리**: 달력 기반 학사일정 추가/수정/삭제
- **급식 관리**: 달력 기반 급식 정보 추가/수정/삭제
- **공지사항 관리**: 테이블 형태로 공지사항 CRUD
- **알레르기 정보**: 알레르기 정보 관리
- **교실 배치**: Firebase Storage를 통한 이미지 업로드/삭제
- **PIN 관리**: 활성화된 PIN 조회 및 제거 (최대 10개)

## 🛠️ 기술 스택

- **Frontend**: React.js, Vite
- **Backend**: Firebase (Firestore, Storage, Authentication)
- **Styling**: CSS3 (Flexbox, Grid, 애니메이션)
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router
- **Real-time Communication**: Firebase onSnapshot

## 📦 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone https://github.com/swon8468/simpleInfo.git
cd simpleInfo
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드
```bash
npm run build
```

## 🔧 Firebase 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Storage 활성화
4. Authentication 설정 (선택사항)

### 2. Firebase 설정 파일
`src/firebase.js` 파일에 Firebase 설정 정보를 입력하세요:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // 개발용 - 프로덕션에서는 인증 필요
    }
  }
}
```

### 4. Storage 보안 규칙
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // 개발용 - 프로덕션에서는 인증 필요
    }
  }
}
```

## 📊 데이터베이스 구조

### Firestore Collections

#### connections
```javascript
{
  pin: "123456",
  createdAt: timestamp,
  status: "connected" | "waiting" | "disconnected",
  controlData: {
    currentPage: "main" | "schedule" | "meal" | "roadmap" | "announcement",
    scheduleView: "monthly" | "weekly",
    scheduleDate: "2024-01-01T00:00:00.000Z",
    mealDate: 0,
    announcementIndex: 0
  }
}
```

#### announcements
```javascript
{
  createdAt: timestamp,
  title: "공지사항 제목",
  content: "공지사항 내용",
  views: 0
}
```

#### schedules
```javascript
{
  createdAt: timestamp,
  eventDate: "2024-01-01",
  title: "행사명",
  target: ["1학년", "2학년", "3학년"]
}
```

#### meals
```javascript
{
  createdAt: timestamp,
  date: "2024-01-01",
  lunch: ["메뉴1", "메뉴2", "메뉴3"],
  dinner: ["메뉴1", "메뉴2", "메뉴3"]
}
```

#### settings
```javascript
// 알레르기 정보
{
  items: ["견과류", "우유", "계란", "대두"]
}

// 교실 배치 이미지
{
  imageURL: "https://firebasestorage.googleapis.com/...",
  fileName: "campus-layout-1234567890.jpg",
  uploadedAt: timestamp
}
```

## 🎯 사용 방법

### 1. 출력용 디바이스 설정
1. 메인 화면에서 "출력용" 선택
2. 생성된 PIN 번호 확인
3. 출력용 화면에서 PIN 번호 표시

### 2. 제어용 디바이스 설정
1. 메인 화면에서 "제어용" 선택
2. 출력용 디바이스에 표시된 PIN 번호 입력
3. 연결 성공 후 제어 시작

### 3. 관리자 패널 접근
- URL에 `?admin=true` 추가
- 또는 `Ctrl + Shift + A` 키 조합
- 비밀번호: `swon8468`

## 🔄 실시간 동기화

- Firebase의 `onSnapshot`을 사용하여 실시간 데이터 동기화
- 제어용 디바이스의 모든 조작이 즉시 출력용 디바이스에 반영
- 연결 상태 모니터링 및 자동 해제 기능
- 페이지 새로고침 시 자동으로 메인 화면으로 이동

## 🎨 주요 디자인 특징

- **반응형 디자인**: 다양한 화면 크기에 대응
- **중앙 정렬**: 모든 요소가 화면 중앙에 배치
- **일관된 색상**: 파란색 계열의 통일된 디자인
- **로딩 스피너**: 데이터 로드 중 사용자 경험 개선
- **애니메이션**: 부드러운 전환 효과 및 호버 효과

## 📱 네트워크 설정

개발 서버를 네트워크에서 접근 가능하게 하려면:

```bash
npm run dev -- --host 0.0.0.0
```

## 🔒 보안 고려사항

- 프로덕션 환경에서는 Firestore 및 Storage 보안 규칙을 강화하세요
- 관리자 비밀번호를 변경하세요
- PIN 생성 제한을 적절히 조정하세요

## 🐛 알려진 이슈

- Firebase Storage 권한 설정이 필요할 수 있습니다
- 일부 브라우저에서 WebRTC 관련 기능이 제한될 수 있습니다

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여자

- **개발자**: swon8468
- **학교**: 광주동신여자고등학교

## 📞 지원

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**학교생활도우미** - 학생들의 학교 생활을 더욱 편리하게 만들어주는 디지털 도우미입니다. 🎓