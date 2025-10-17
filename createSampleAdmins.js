// 샘플 관리자 계정 생성 스크립트
import DataService from './src/services/DataService.js';

async function createSampleAdmins() {
  try {
    console.log('샘플 관리자 계정 생성 시작...');

    // 일반 관리자 계정 생성
    const normalAdmin = await DataService.createAdmin({
      name: '김일반',
      adminCode: 'normal123',
      permissions: ['schedule', 'meal', 'announcement', 'allergy'],
      level: '일반 관리자'
    });
    console.log('일반 관리자 계정 생성 완료:', normalAdmin);

    // 최고 관리자 계정 생성
    const superAdmin = await DataService.createAdmin({
      name: '박최고',
      adminCode: 'super456',
      permissions: ['schedule', 'meal', 'announcement', 'allergy', 'campusLayout', 'mainNotice', 'patchnotes', 'schoolBlocking', 'pins', 'adminManagement'],
      level: '최고 관리자'
    });
    console.log('최고 관리자 계정 생성 완료:', superAdmin);

    console.log('모든 샘플 계정 생성 완료!');
    console.log('\n=== 생성된 계정 정보 ===');
    console.log('1. 일반 관리자:');
    console.log('   이름: 김일반');
    console.log('   관리자 코드: normal123');
    console.log('   권한: 학사일정, 급식, 공지사항, 알레르기');
    console.log('   등급: 일반 관리자');
    console.log('\n2. 최고 관리자:');
    console.log('   이름: 박최고');
    console.log('   관리자 코드: super456');
    console.log('   권한: 모든 권한');
    console.log('   등급: 최고 관리자');

  } catch (error) {
    console.error('샘플 계정 생성 실패:', error);
  }
}

// 스크립트 실행
createSampleAdmins();
