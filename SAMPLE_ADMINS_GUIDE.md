# 샘플 관리자 계정 생성 가이드

## 방법 1: Firebase 콘솔에서 직접 추가 (권장)

### 1. Firebase 콘솔 접속
- https://console.firebase.google.com/ 접속
- 프로젝트 선택: simpleinfo-a02b0

### 2. Firestore Database로 이동
- 왼쪽 메뉴에서 "Firestore Database" 클릭
- "데이터" 탭 선택

### 3. admins 컬렉션 생성 및 문서 추가

#### 일반 관리자 계정 추가:
1. "컬렉션 시작" 클릭
2. 컬렉션 ID: `admins`
3. 문서 ID: 자동 생성
4. 필드 추가:
   - `name` (문자열): 김일반
   - `adminCode` (문자열): normal123
   - `permissions` (배열): schedule, meal, announcement, allergy
   - `level` (문자열): 일반 관리자
   - `isActive` (불린): true
   - `createdAt` (타임스탬프): 현재 시간
   - `updatedAt` (타임스탬프): 현재 시간

#### 최고 관리자 계정 추가:
1. 같은 컬렉션에 새 문서 추가
2. 필드 추가:
   - `name` (문자열): 박최고
   - `adminCode` (문자열): super456
   - `permissions` (배열): schedule, meal, announcement, allergy, campusLayout, mainNotice, patchnotes, schoolBlocking, pins, adminManagement
   - `level` (문자열): 최고 관리자
   - `isActive` (불린): true
   - `createdAt` (타임스탬프): 현재 시간
   - `updatedAt` (타임스탬프): 현재 시간

## 방법 2: 관리자 패널에서 추가

1. 기존 관리자 코드 `swon8468`로 로그인
2. "관리자 관리" 탭으로 이동
3. "관리자 추가" 버튼 클릭
4. 각 계정 정보 입력 후 저장

## 생성된 계정 정보

### 일반 관리자
- **이름**: 김일반
- **관리자 코드**: normal123
- **권한**: 학사일정, 급식, 공지사항, 알레르기 관리
- **등급**: 일반 관리자
- **제한사항**: 관리자 추가/삭제 불가, 관리자 목록 조회만 가능

### 최고 관리자
- **이름**: 박최고
- **관리자 코드**: super456
- **권한**: 모든 기능 접근 가능
- **등급**: 최고 관리자
- **권한**: 관리자 추가/삭제/수정 가능 (관리자 코드 수정 불가)

## 테스트 방법

1. 관리자 패널에서 로그아웃
2. 각각의 관리자 코드로 로그인 테스트
3. 권한에 따른 탭 접근 제한 확인
4. 일반 관리자로는 관리자 관리 탭 접근 불가 확인
5. 최고 관리자로는 모든 탭 접근 가능 확인
