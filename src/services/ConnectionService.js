import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  query,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';

class ConnectionService {
  constructor() {
    this.currentPin = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // PIN 생성 및 저장 (출력용 디바이스용)
  async generatePin() {
    try {
      console.log('ConnectionService: PIN 생성 시작');
      
      // 활성화된 PIN 개수 확인
      const activePins = await this.getActivePins();
      console.log('ConnectionService: 현재 활성화된 PIN 개수:', activePins.length);
      console.log('ConnectionService: 활성화된 PIN 목록:', activePins);
      
      if (activePins.length >= 10) {
        console.log('ConnectionService: 최대 PIN 개수 도달, PIN 생성 거부');
        throw new Error('최대 PIN 개수(10개)에 도달했습니다. 기존 PIN을 제거한 후 다시 시도해주세요.');
      }
      
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      this.currentPin = pin;
      
      console.log('ConnectionService: PIN 생성:', pin);
      await setDoc(doc(db, 'connections', pin), {
        pin: pin,
        createdAt: serverTimestamp(),
        status: 'waiting',
        deviceType: 'output', // 출력용 디바이스
        controlData: null,
        connectedControlDevice: null // 연결된 제어용 디바이스 ID
      });
      console.log('ConnectionService: PIN 문서 생성 완료:', pin);
      
      // PIN 만료 시간 설정 (5분)
      setTimeout(() => {
        this.cleanupPin(pin);
      }, 5 * 60 * 1000);
      
      return pin;
    } catch (error) {
      console.error('PIN 생성 실패:', error);
      throw error;
    }
  }

  // PIN 검증 및 연결 (제어용 디바이스용)
  async connectWithPin(pin) {
    try {
      console.log('ConnectionService: PIN 연결 시도:', pin);
      const docRef = doc(db, 'connections', pin);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('ConnectionService: PIN 문서 데이터:', data);
        
        // 출력용 디바이스가 생성한 PIN이고 대기 상태인지 확인
        if (data.deviceType === 'output' && data.status === 'waiting' && !data.connectedControlDevice) {
          // 제어용 디바이스 ID 생성
          const controlDeviceId = `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // 연결 고정을 위한 고유한 페어링 ID 생성
          const pairingId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // 출력용 디바이스 문서 업데이트
          await setDoc(docRef, {
            ...data,
            status: 'connected',
            deviceType: 'output',
            connectedControlDevice: controlDeviceId,
            pairingId: pairingId, // 연결 고정을 위한 페어링 ID
            connectedAt: serverTimestamp()
          }, { merge: true });
          
          // 제어용 디바이스 정보 저장
          await setDoc(doc(db, 'connections', controlDeviceId), {
            pin: pin,
            deviceType: 'control',
            connectedOutputDevice: pin,
            pairingId: pairingId, // 연결 고정을 위한 페어링 ID
            status: 'control_connected', // 제어용 디바이스는 다른 상태 사용
            createdAt: serverTimestamp(),
            connectedAt: serverTimestamp(),
            controlData: null
          });
          
          console.log('ConnectionService: 1:1 매칭 연결 완료:', pin, '제어용 ID:', controlDeviceId, '페어링 ID:', pairingId);
          
          this.isConnected = true;
          this.currentPin = pin;
          sessionStorage.setItem('controlDeviceId', controlDeviceId);
          sessionStorage.setItem('connectedPin', pin); // 연결된 PIN도 저장
          sessionStorage.setItem('pairingId', pairingId); // 페어링 ID 저장
          return { success: true, controlDeviceId, pin, pairingId };
        } else if (data.status === 'connected' || data.connectedControlDevice) {
          throw new Error('이 PIN은 이미 다른 제어용 디바이스에 연결되어 있습니다.');
        }
      }
      console.log('ConnectionService: PIN 연결 실패:', pin);
      return { success: false, error: '유효하지 않은 PIN입니다.' };
    } catch (error) {
      console.error('PIN 연결 실패:', error);
      throw error;
    }
  }

  // 실시간 데이터 동기화
  subscribeToControlData(pin, callback) {
    const docRef = doc(db, 'connections', pin);
    let lastData = null;
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        console.log('ConnectionService: 문서 변경 감지:', doc.id, data);
        
        // controlData가 있는 경우에만 콜백 호출
        if (data.controlData) {
          console.log('ConnectionService: controlData 변경 감지:', data.controlData);
          callback(data);
        }
        
        if (data.status === 'connected') {
          this.isConnected = true;
        }
      } else {
        console.log('ConnectionService: 문서가 존재하지 않음:', doc.id);
      }
    });
    
    this.listeners.set(pin, unsubscribe);
    return unsubscribe;
  }

  // 제어 데이터 전송 (1:1 매칭 시스템)
  async sendControlData(pin, data) {
    try {
      const controlDeviceId = sessionStorage.getItem('controlDeviceId');
      const connectedPin = sessionStorage.getItem('connectedPin');
      
      if (!controlDeviceId || !connectedPin) {
        throw new Error('제어용 디바이스 연결 정보가 없습니다.');
      }
      
      // 연결된 PIN이 전달된 PIN과 일치하는지 확인
      if (pin !== connectedPin) {
        console.warn('ConnectionService: PIN 불일치. 전달된 PIN:', pin, '연결된 PIN:', connectedPin);
        pin = connectedPin; // 연결된 PIN 사용
      }
      
      // 출력용 디바이스 문서에 데이터 전송
      const outputDocRef = doc(db, 'connections', pin);
      
      // 문서 존재 여부 확인 후 적절한 방법으로 업데이트
      const docSnap = await getDoc(outputDocRef);
      if (docSnap.exists()) {
        await updateDoc(outputDocRef, {
          controlData: data,
          lastUpdated: serverTimestamp(),
          heartbeat: serverTimestamp() // 연결 상태 확인용
        });
      } else {
        // 문서가 존재하지 않으면 setDoc 사용
        await setDoc(outputDocRef, {
          controlData: data,
          lastUpdated: serverTimestamp(),
          heartbeat: serverTimestamp()
        }, { merge: true });
      }
      
      console.log('ConnectionService: 1:1 매칭 데이터 전송 완료:', pin, controlDeviceId, data);
    } catch (error) {
      console.error('제어 데이터 전송 실패:', error);
      throw error;
    }
  }

  // 연결 정리
  async cleanupPin(pin) {
    try {
      const docRef = doc(db, 'connections', pin);
      await setDoc(docRef, {
        status: 'expired'
      }, { merge: true });
      
      // 리스너 정리
      const unsubscribe = this.listeners.get(pin);
      if (unsubscribe) {
        unsubscribe();
        this.listeners.delete(pin);
      }
    } catch (error) {
      console.error('PIN 정리 실패:', error);
    }
  }

  // 연결 해제 (1:1 매칭 시스템)
  async disconnect(pin) {
    try {
      const controlDeviceId = sessionStorage.getItem('controlDeviceId');
      const connectedPin = sessionStorage.getItem('connectedPin');
      
      console.log('ConnectionService: 연결 해제 시작', { pin, controlDeviceId, connectedPin });
      
      // 제어용 디바이스 문서 삭제
      if (controlDeviceId) {
        const controlDocRef = doc(db, 'connections', controlDeviceId);
        await deleteDoc(controlDocRef);
        sessionStorage.removeItem('controlDeviceId');
        console.log('제어용 디바이스 문서 삭제 완료:', controlDeviceId);
      }
      
      // 출력용 디바이스 문서 삭제
      const outputDocRef = doc(db, 'connections', pin);
      await deleteDoc(outputDocRef);
      console.log('출력용 디바이스 문서 삭제 완료:', pin);
      
      this.isConnected = false;
      
      // 리스너 정리
      const unsubscribe = this.listeners.get(pin);
      if (unsubscribe) {
        unsubscribe();
        this.listeners.delete(pin);
      }
      
      // sessionStorage에서 PIN 제거
      sessionStorage.removeItem('currentPin');
      sessionStorage.removeItem('connectedPin');
      sessionStorage.removeItem('pairingId');
      
      console.log('ConnectionService: 1:1 매칭 연결 해제 완료:', pin, controlDeviceId);
    } catch (error) {
      console.error('연결 해제 실패:', error);
      throw error;
    }
  }

  // 연결 상태 모니터링 (출력용)
  startConnectionMonitoring(pin, onDisconnect) {
    const docRef = doc(db, 'connections', pin);
    let isConnected = true;
    let heartbeatInterval;

    // 하트비트 전송
    const sendHeartbeat = async () => {
      try {
        // 하트비트는 별도 필드로 저장하여 데이터 변경으로 인식되지 않도록 함
        await setDoc(docRef, {
          heartbeat: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('하트비트 전송 실패:', error);
        if (isConnected) {
          isConnected = false;
          onDisconnect();
        }
      }
    };

    // 30초마다 하트비트 전송 (간격을 늘려서 불필요한 업데이트 방지)
    heartbeatInterval = setInterval(sendHeartbeat, 30000);

    // 실시간 연결 상태 모니터링
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (!doc.exists()) {
        // PIN이 삭제된 경우
        if (isConnected) {
          isConnected = false;
          clearInterval(heartbeatInterval);
          onDisconnect();
        }
      }
    }, (error) => {
      console.error('연결 모니터링 실패:', error);
      if (isConnected) {
        isConnected = false;
        clearInterval(heartbeatInterval);
        onDisconnect();
      }
    });

    return () => {
      clearInterval(heartbeatInterval);
      unsubscribe();
    };
  }

  // 페이지 언로드 시 연결 해제
  setupPageUnloadHandler(pin) {
    const handleBeforeUnload = (e) => {
      const message = '페이지를 닫으면 연결이 해제됩니다. 정말 닫으시겠습니까?';
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }

  // 활성화된 모든 PIN 가져오기
  async getActivePins() {
    try {
      console.log('ConnectionService: 활성화된 PIN 조회 시작');
      const connectionsRef = collection(db, 'connections');
      console.log('ConnectionService: connections 컬렉션 참조:', connectionsRef);
      
      // 먼저 모든 연결 문서를 조회해보기
      const allQuery = query(connectionsRef);
      const allSnapshot = await getDocs(allQuery);
      console.log('ConnectionService: 전체 연결 문서 수:', allSnapshot.size);
      
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('ConnectionService: 전체 문서 ID:', doc.id, '상태:', data.status, '생성시간:', data.createdAt, '타입:', data.deviceType, 'PIN:', data.pin);
      });
      
      const q = query(
        connectionsRef, 
        where('deviceType', '==', 'output'),
        where('status', '==', 'connected')
      );
      console.log('ConnectionService: 쿼리 생성:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('ConnectionService: 쿼리 결과 문서 수:', querySnapshot.size);
      console.log('ConnectionService: 쿼리 결과 빈 상태:', querySnapshot.empty);
      
      const activePins = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('ConnectionService: PIN 문서 ID:', doc.id);
        console.log('ConnectionService: PIN 문서 데이터:', data);
        console.log('ConnectionService: PIN 상태:', data.status);
        console.log('ConnectionService: PIN 생성 시간:', data.createdAt);
        activePins.push({ id: doc.id, ...data });
      });
      
      console.log('ConnectionService: 최종 활성화된 PIN 목록:', activePins);
      console.log('ConnectionService: 활성화된 PIN 개수:', activePins.length);
      return activePins;
    } catch (error) {
      console.error('활성화된 PIN 조회 실패:', error);
      return [];
    }
  }

  // 특정 PIN 제거
  async removePin(pin) {
    try {
      // 출력용 디바이스 문서 조회
      const outputDocRef = doc(db, 'connections', pin);
      const outputDocSnap = await getDoc(outputDocRef);
      
      if (outputDocSnap.exists()) {
        const outputData = outputDocSnap.data();
        
        // 연결된 제어용 디바이스가 있다면 함께 삭제
        if (outputData.connectedControlDevice) {
          const controlDocRef = doc(db, 'connections', outputData.connectedControlDevice);
          
          // 제어용 디바이스에게 메인 화면으로 이동하라는 신호 전송
          await updateDoc(controlDocRef, {
            controlData: {
              currentPage: 'main',
              adminRemoved: true,
              message: '관리자에 의해 연결이 해제되었습니다.'
            },
            lastUpdated: serverTimestamp()
          });
          
          await deleteDoc(controlDocRef);
          console.log(`제어용 디바이스 ${outputData.connectedControlDevice} 제거 완료.`);
        }
        
        // 출력용 디바이스에게 메인 화면으로 이동하라는 신호 전송
        await updateDoc(outputDocRef, {
          controlData: {
            currentPage: 'main',
            adminRemoved: true,
            message: '관리자에 의해 연결이 해제되었습니다.'
          },
          lastUpdated: serverTimestamp()
        });
        
        // 출력용 디바이스 문서 삭제
        await deleteDoc(outputDocRef);
        console.log(`출력용 디바이스 PIN ${pin} 제거 완료.`);
      }
      
      return true;
    } catch (error) {
      console.error(`PIN ${pin} 제거 실패:`, error);
      return false;
    }
  }
}

export default new ConnectionService();
