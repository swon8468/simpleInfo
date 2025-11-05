# Firestore 보안 규칙 설정 가이드

## 문제점
현재 Firebase Firestore에서 "Missing or insufficient permissions" 오류가 발생하고 있습니다.
이는 Firestore 보안 규칙이 설정되지 않았거나 너무 제한적으로 설정되어 있기 때문입니다.

## 해결 방법

### 방법 1: Firebase 콘솔에서 직접 설정 (권장)

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com/ 접속
   - 프로젝트 선택: `simpleinfo-a02b0`

2. **Firestore Database로 이동**
   - 왼쪽 메뉴에서 "Firestore Database" 클릭
   - 상단 탭에서 "규칙" 클릭

3. **보안 규칙 입력**
   다음 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // connections 컬렉션: 모든 사용자가 읽기/쓰기 가능 (PIN 기반 연결 시스템)
    match /connections/{connectionId} {
      allow read, write: if true;
    }
    
    // activityLogs 컬렉션: 모든 사용자가 읽기/쓰기 가능 (활동 로그)
    match /activityLogs/{logId} {
      allow read, write: if true;
    }
    
    // settings 컬렉션: 모든 사용자가 읽기 가능, 쓰기는 인증된 사용자만
    match /settings/{settingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // admins 컬렉션: 모든 사용자가 읽기 가능 (관리자 정보 조회)
    match /admins/{adminId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // announcements 컬렉션: 모든 사용자가 읽기 가능
    match /announcements/{announcementId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // schedules 컬렉션: 모든 사용자가 읽기 가능
    match /schedules/{scheduleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // meals 컬렉션: 모든 사용자가 읽기 가능
    match /meals/{mealId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // patchnotes 컬렉션: 모든 사용자가 읽기 가능
    match /patchnotes/{patchnoteId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 기타 컬렉션: 기본적으로 읽기는 허용하되, 쓰기는 인증 필요
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

4. **규칙 게시**
   - "게시" 버튼 클릭
   - 확인 대화상자에서 "게시" 클릭

### 방법 2: Firebase CLI 사용 (선택사항)

프로젝트에 `firestore.rules` 파일이 생성되어 있습니다.
Firebase CLI를 사용하여 배포할 수 있습니다:

```bash
# Firebase CLI 설치 (아직 설치하지 않은 경우)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 프로젝트 초기화 (아직 초기화하지 않은 경우)
firebase init firestore

# 규칙 배포
firebase deploy --only firestore:rules
```

## 주의사항

⚠️ **보안 고려사항:**
- 현재 규칙은 개발/테스트 환경을 위한 것입니다.
- 프로덕션 환경에서는 더 엄격한 보안 규칙을 적용해야 합니다.
- `connections`와 `activityLogs` 컬렉션은 모든 사용자가 쓰기 가능하므로, 
  악의적인 사용자로부터 보호하기 위해 추가적인 검증이 필요할 수 있습니다.

## 규칙 적용 후 확인

1. 브라우저 콘솔을 열고 오류 메시지 확인
2. "Missing or insufficient permissions" 오류가 사라졌는지 확인
3. 앱의 주요 기능들이 정상 작동하는지 테스트:
   - 출력용 세션 생성
   - 제어용 디바이스 연결
   - 활동 로그 기록
   - 데이터 조회

## 문제 해결

규칙을 적용한 후에도 여전히 오류가 발생한다면:
1. Firebase 콘솔에서 규칙이 제대로 게시되었는지 확인
2. 브라우저를 새로고침하고 캐시를 지운 후 다시 시도
3. Firebase 콘솔의 "규칙" 탭에서 규칙 검증 도구 사용

