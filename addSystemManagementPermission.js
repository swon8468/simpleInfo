// 기존 관리자에게 systemManagement 권한 추가 스크립트
// 브라우저 콘솔에서 실행하세요

async function addSystemManagementPermission() {
  try {
    // Firebase 모듈 import (브라우저 환경에서)
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, doc, updateDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Firebase 설정 (실제 프로젝트 설정으로 변경)
    const firebaseConfig = {
      apiKey: "AIzaSyAjKRridqLFy8i-of3wQCe28dvgNYFR010",
      authDomain: "simpleinfo-a02b0.firebaseapp.com",
      projectId: "simpleinfo-a02b0",
      storageBucket: "simpleinfo-a02b0.firebasestorage.app",
      messagingSenderId: "955726620263",
      appId: "1:955726620263:web:70143a50d08bc19696d6c2",
      measurementId: "G-GZBSSL4298"
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 모든 관리자 조회
    const adminsRef = collection(db, 'admins');
    const querySnapshot = await getDocs(adminsRef);
    
    console.log('관리자 목록:');
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${data.name} (${data.adminCode}): ${data.permissions?.join(', ') || '권한 없음'}`);
    });
    
    // swon8468 관리자에게 systemManagement 권한 추가
    const adminDoc = doc(db, 'admins', 'swon8468'); // 실제 문서 ID로 변경 필요
    const adminSnap = await getDoc(adminDoc);
    
    if (adminSnap.exists()) {
      const currentPermissions = adminSnap.data().permissions || [];
      if (!currentPermissions.includes('systemManagement')) {
        const updatedPermissions = [...currentPermissions, 'systemManagement'];
        await updateDoc(adminDoc, {
          permissions: updatedPermissions
        });
        console.log('✅ systemManagement 권한이 추가되었습니다.');
        console.log('새로운 권한 목록:', updatedPermissions);
      } else {
        console.log('✅ systemManagement 권한이 이미 있습니다.');
      }
    } else {
      console.log('❌ swon8468 관리자를 찾을 수 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 실행
addSystemManagementPermission();
