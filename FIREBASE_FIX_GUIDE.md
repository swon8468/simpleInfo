# Firebase 콘솔에서 관리자 계정 수정 방법

## 문제점
현재 Firebase 콘솔에서 `code` 필드로 되어 있지만, 우리 시스템에서는 `adminCode` 필드를 사용합니다.

## 해결 방법

### 1. 기존 문서 수정
1. Firebase 콘솔에서 `admins` 컬렉션의 문서 선택
2. `code` 필드를 삭제
3. 새 필드 추가:
   - 필드명: `adminCode`
   - 값: `test` (또는 원하는 관리자 코드)

### 2. 추가 필드 확인
다음 필드들이 모두 있는지 확인하세요:

- `name` (문자열): 관리자 이름
- `adminCode` (문자열): 관리자 코드 (로그인에 사용)
- `permissions` (배열): 권한 목록
- `level` (문자열): 등급 (일반 관리자 또는 최고 관리자)
- `isActive` (불린): true
- `createdAt` (타임스탬프): 생성 시간
- `updatedAt` (타임스탬프): 수정 시간

### 3. 권한 설정
`permissions` 필드는 배열로 설정해야 합니다:
- `schedule` (학사일정)
- `meal` (급식)
- `announcement` (공지사항)
- `allergy` (알레르기)
- `campusLayout` (교실 배치)
- `mainNotice` (메인 공지사항)
- `patchnotes` (패치노트)
- `schoolBlocking` (학교 차단)
- `pins` (PIN 관리)
- `adminManagement` (관리자 관리)

### 4. 테스트용 계정 예시

#### 일반 관리자:
```
name: "테스트 관리자"
adminCode: "test123"
permissions: ["schedule", "meal", "announcement", "allergy"]
level: "일반 관리자"
isActive: true
```

#### 최고 관리자:
```
name: "최고 관리자"
adminCode: "admin456"
permissions: ["schedule", "meal", "announcement", "allergy", "campusLayout", "mainNotice", "patchnotes", "schoolBlocking", "pins", "adminManagement"]
level: "최고 관리자"
isActive: true
```

## 수정 후 테스트
1. 관리자 패널에서 로그아웃
2. 수정된 `adminCode`로 로그인 시도
3. 권한에 따른 탭 접근 확인
