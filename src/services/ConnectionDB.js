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

class ConnectionDB {
  constructor() {
    this.listeners = new Map();
  }

  // 새로운 연결 세션 생성 (출력용 디바이스용)
  async createOutputSession() {
    try {
      console.log('ConnectionDB: 출력용 세션 생성 시작');
      
      // 활성화된 연결 개수 확인
      const activeConnections = await this.getActiveConnections();
      console.log('ConnectionDB: 현재 활성화된 연결 개수:', activeConnections.length);
      
      if (activeConnections.length >= 10) {
        throw new Error('최대 연결 개수(10개)에 도달했습니다. 기존 연결을 제거한 후 다시 시도해주세요.');
      }
      
      // 고유한 세션 ID 생성
      const sessionId = `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 연결 문서 생성
      await setDoc(doc(db, 'connections', sessionId), {
        sessionId: sessionId,
        pin: pin,
        deviceType: 'output',
        status: 'waiting',
        createdAt: serverTimestamp(),
        controlData: null,
        connectedControlSession: null,
        pairingId: null
      });
      
      console.log('ConnectionDB: 출력용 세션 생성 완료:', sessionId, 'PIN:', pin);
      
      // PIN 만료 시간 설정 (5분)
      setTimeout(() => {
        this.cleanupSession(sessionId);
      }, 5 * 60 * 1000);
      
      return { sessionId, pin };
    } catch (error) {
      console.error('출력용 세션 생성 실패:', error);
      throw error;
    }
  }

  // 제어용 디바이스 연결 (PIN으로 연결)
  async connectControlDevice(pin) {
    try {
      console.log('ConnectionDB: 제어용 디바이스 연결 시도, PIN:', pin);
      
      // PIN으로 출력용 세션 찾기
      const outputSessions = await this.findOutputSessionByPin(pin);
      
      if (outputSessions.length === 0) {
        return { success: false, error: '유효하지 않은 PIN입니다.' };
      }
      
      const outputSession = outputSessions[0];
      
      // 이미 연결된 상태인지 확인
      if (outputSession.status === 'connected' || outputSession.connectedControlSession) {
        return { success: false, error: '이 PIN은 이미 다른 제어용 디바이스에 연결되어 있습니다.' };
      }
      
      // 제어용 세션 ID 생성
      const controlSessionId = `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pairingId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 출력용 세션 업데이트
      console.log('ConnectionDB: 출력용 세션 업데이트 시작:', outputSession.sessionId);
      await updateDoc(doc(db, 'connections', outputSession.sessionId), {
        status: 'connected',
        connectedControlSession: controlSessionId,
        pairingId: pairingId,
        connectedAt: serverTimestamp()
      });
      console.log('ConnectionDB: 출력용 세션 업데이트 완료:', outputSession.sessionId);
      
      // 제어용 세션 생성
      console.log('ConnectionDB: 제어용 세션 생성 시작:', controlSessionId);
      await setDoc(doc(db, 'connections', controlSessionId), {
        sessionId: controlSessionId,
        pin: pin,
        deviceType: 'control',
        status: 'connected',
        connectedOutputSession: outputSession.sessionId,
        pairingId: pairingId,
        createdAt: serverTimestamp(),
        connectedAt: serverTimestamp(),
        controlData: null
      });
      console.log('ConnectionDB: 제어용 세션 생성 완료:', controlSessionId);
      
      console.log('ConnectionDB: 연결 완료:', {
        outputSessionId: outputSession.sessionId,
        controlSessionId: controlSessionId,
        pairingId: pairingId
      });
      
      return { 
        success: true, 
        outputSessionId: outputSession.sessionId,
        controlSessionId: controlSessionId,
        pairingId: pairingId,
        pin: pin
      };
    } catch (error) {
      console.error('제어용 디바이스 연결 실패:', error);
      throw error;
    }
  }

  // PIN으로 출력용 세션 찾기
  async findOutputSessionByPin(pin) {
    try {
      console.log('ConnectionDB: PIN으로 출력용 세션 찾기 시작, PIN:', pin);
      const connectionsRef = collection(db, 'connections');
      const q = query(
        connectionsRef,
        where('pin', '==', pin),
        where('deviceType', '==', 'output')
      );
      const querySnapshot = await getDocs(q);
      
      console.log('ConnectionDB: 쿼리 결과 개수:', querySnapshot.size);
      const sessions = querySnapshot.docs.map(doc => {
        const data = { sessionId: doc.id, ...doc.data() };
        console.log('ConnectionDB: 찾은 세션:', data);
        return data;
      });
      
      return sessions;
    } catch (error) {
      console.error('PIN으로 출력용 세션 찾기 실패:', error);
      return [];
    }
  }

  // 활성화된 연결 목록 가져오기
  async getActiveConnections() {
    try {
      console.log('ConnectionDB.getActiveConnections: 쿼리 시작');
      const connectionsRef = collection(db, 'connections');
      
      // 모든 연결 상태에서 PIN이 있는 출력용 디바이스 조회
      const allConnectionsSnapshot = await getDocs(connectionsRef);
      console.log('ConnectionDB.getActiveConnections: 전체 연결 문서 수:', allConnectionsSnapshot.size);
      
      const activePins = [];
      allConnectionsSnapshot.forEach((doc) => {
        const data = { sessionId: doc.id, ...doc.data() };
        console.log('ConnectionDB.getActiveConnections: 전체 문서:', doc.id, {
          deviceType: data.deviceType,
          status: data.status,
          pin: data.pin,
          createdAt: data.createdAt,
          connectedAt: data.connectedAt
        });
        
        // 출력용 디바이스이면서 6자리 PIN이 있는 경우만 포함
        if (data.deviceType === 'output' && 
            data.pin && 
            data.pin.length === 6 &&
            (data.status === 'connected' || data.status === 'control_connected' || data.connectedControlSession)) {
          activePins.push(data);
          console.log('ConnectionDB.getActiveConnections: 활성 PIN 추가:', data);
        }
      });
      
      console.log('ConnectionDB.getActiveConnections: 최종 활성 PIN 결과:', activePins);
      console.log('ConnectionDB.getActiveConnections: 최종 활성 PIN 개수:', activePins.length);
      return activePins;
    } catch (error) {
      console.error('활성화된 연결 목록 가져오기 실패:', error);
      return [];
    }
  }

  // 실시간으로 연결 상태 모니터링 (스냅샷 리스너)
  subscribeToActiveConnections(callback) {
    try {
      console.log('ConnectionDB.subscribeToActiveConnections: 실시간 모니터링 시작');
      const connectionsRef = collection(db, 'connections');
      
      // 전체 연결 컬렉션을 실시간 감시
      const unsubscribe = onSnapshot(connectionsRef, (snapshot) => {
        console.log('ConnectionDB.subscribeToActiveConnections: 실시간 변경 감지, 전체 문서 수:', snapshot.size);
        
        const activePins = [];
        snapshot.forEach((doc) => {
          const data = { sessionId: doc.id, ...doc.data() };
          console.log('ConnectionDB.subscribeToActiveConnections: 실시간 문서:', doc.id, {
            deviceType: data.deviceType,
            status: data.status,
            pin: data.pin,
            createdAt: data.createdAt
          });
          
          // 출력용 디바이스이면서 6자리 PIN이 있는 경우만 포함
          if (data.deviceType === 'output' && 
              data.pin && 
              data.pin.length === 6 &&
              (data.status === 'connected' || data.status === 'control_connected' || data.connectedControlSession)) {
            activePins.push(data);
            console.log('ConnectionDB.subscribeToActiveConnections: 실시간 활성 PIN 추가:', data);
          }
        });
        
        console.log('ConnectionDB.subscribeToActiveConnections: 실시간 활성 PIN들:', activePins);
        callback(activePins);
      }, (error) => {
        console.error('ConnectionDB.subscribeToActiveConnections: 실시간 모니터링 실패:', error);
        callback([]);
      });
      
      console.log('ConnectionDB.subscribeToActiveConnections: 스냅샷 리스너 등록 완료');
      return unsubscribe;
    } catch (error) {
      console.error('ConnectionDB.subscribeToActiveConnections: 설정 실패:', error);
      return () => {};
    }
  }

  // 실시간 데이터 구독 (출력용 디바이스용)
  subscribeToOutputData(sessionId, callback) {
    const docRef = doc(db, 'connections', sessionId);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log('ConnectionDB: 출력용 데이터 변경 감지:', sessionId, data);
        
        // 연결 상태 변화나 controlData가 있는 경우 콜백 호출
        if (data.connectedControlSession || data.controlData) {
          callback(data);
        }
      } else {
        console.log('ConnectionDB: 출력용 세션이 존재하지 않음:', sessionId);
      }
    });
    
    this.listeners.set(sessionId, unsubscribe);
    return unsubscribe;
  }

  // 제어 데이터 전송 (제어용 디바이스에서 출력용 디바이스로)
  async sendControlData(controlSessionId, data) {
    try {
      console.log('ConnectionDB: 제어 데이터 전송 시도:', controlSessionId, data);
      
      // 제어용 세션 정보 가져오기
      const controlDocRef = doc(db, 'connections', controlSessionId);
      const controlDocSnap = await getDoc(controlDocRef);
      
      console.log('ConnectionDB: 제어용 세션 문서 존재 여부:', controlDocSnap.exists());
      
      if (!controlDocSnap.exists()) {
        throw new Error('제어용 세션이 존재하지 않습니다.');
      }
      
      const controlData = controlDocSnap.data();
      const outputSessionId = controlData.connectedOutputSession;
      
      console.log('ConnectionDB: 제어용 세션 데이터:', controlData);
      console.log('ConnectionDB: 연결된 출력용 세션 ID:', outputSessionId);
      
      if (!outputSessionId) {
        throw new Error('연결된 출력용 세션이 없습니다.');
      }
      
      // 출력용 세션에 제어 데이터 전송
      const outputDocRef = doc(db, 'connections', outputSessionId);
      console.log('ConnectionDB: 출력용 세션에 데이터 전송 시작:', outputSessionId);
      await updateDoc(outputDocRef, {
        controlData: data,
        lastUpdated: serverTimestamp(),
        heartbeat: serverTimestamp()
      });
      
      console.log('ConnectionDB: 제어 데이터 전송 완료:', outputSessionId);
    } catch (error) {
      console.error('제어 데이터 전송 실패:', error);
      throw error;
    }
  }

  // 연결 해제
  async disconnectSession(sessionId) {
    try {
      console.log('ConnectionDB: 연결 해제 시작:', sessionId);
      
      const docRef = doc(db, 'connections', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 연결된 상대방 세션도 삭제
        if (data.deviceType === 'output' && data.connectedControlSession) {
          await deleteDoc(doc(db, 'connections', data.connectedControlSession));
          console.log('제어용 세션 삭제 완료:', data.connectedControlSession);
        } else if (data.deviceType === 'control' && data.connectedOutputSession) {
          await deleteDoc(doc(db, 'connections', data.connectedOutputSession));
          console.log('출력용 세션 삭제 완료:', data.connectedOutputSession);
        }
        
        // 현재 세션 삭제
        await deleteDoc(docRef);
        console.log('세션 삭제 완료:', sessionId);
      }
      
      // 리스너 정리
      const unsubscribe = this.listeners.get(sessionId);
      if (unsubscribe) {
        unsubscribe();
        this.listeners.delete(sessionId);
      }
      
      console.log('ConnectionDB: 연결 해제 완료:', sessionId);
    } catch (error) {
      console.error('연결 해제 실패:', error);
      throw error;
    }
  }

  // 세션 정리 (만료된 세션)
  async cleanupSession(sessionId) {
    try {
      const docRef = doc(db, 'connections', sessionId);
      await updateDoc(docRef, {
        status: 'expired'
      });
      
      // 리스너 정리
      const unsubscribe = this.listeners.get(sessionId);
      if (unsubscribe) {
        unsubscribe();
        this.listeners.delete(sessionId);
      }
    } catch (error) {
      console.error('세션 정리 실패:', error);
    }
  }

  // 관리자용: 모든 활성 연결 목록 가져오기
  async getAllActiveConnections() {
    try {
      const connectionsRef = collection(db, 'connections');
      const q = query(
        connectionsRef,
        where('status', '==', 'connected')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ sessionId: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('모든 활성 연결 목록 가져오기 실패:', error);
      return [];
    }
  }

  // 관리자용: 연결 강제 해제
  async forceDisconnect(sessionId) {
    try {
      console.log('ConnectionDB: 관리자 강제 연결 해제:', sessionId);
      
      const docRef = doc(db, 'connections', sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // 연결된 상대방에게 해제 알림 전송
        if (data.deviceType === 'output' && data.connectedControlSession) {
          await updateDoc(doc(db, 'connections', data.connectedControlSession), {
            controlData: {
              adminRemoved: true,
              message: '관리자에 의해 연결이 해제되었습니다.',
              timestamp: serverTimestamp()
            }
          });
        } else if (data.deviceType === 'control' && data.connectedOutputSession) {
          await updateDoc(doc(db, 'connections', data.connectedOutputSession), {
            controlData: {
              adminRemoved: true,
              message: '관리자에 의해 연결이 해제되었습니다.',
              timestamp: serverTimestamp()
            }
          });
        }
        
        // 연결 해제
        await this.disconnectSession(sessionId);
      }
    } catch (error) {
      console.error('관리자 강제 연결 해제 실패:', error);
      throw error;
    }
  }

  // 메인 공지사항 전송 (출력용 디바이스용)
  async sendMainNotice(outputSessionId, noticeData) {
    try {
      console.log('ConnectionDB: 메인 공지사항 전송 시작:', outputSessionId, noticeData);
      
      const docRef = doc(db, 'connections', outputSessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('출력용 세션을 찾을 수 없습니다.');
      }
      
      const connectionData = docSnap.data();
      
      // 세션 상태 확인
      if (connectionData.status !== 'connected') {
        throw new Error('출력용 세션이 연결되지 않았습니다.');
      }
      
      // 상대방 세션도 확인
      const targetSessionId = connectionData.connectedControlSession;
      if (targetSessionId) {
        const targetDocRef = doc(db, 'connections', targetSessionId);
        const targetDocSnap = await getDoc(targetDocRef);
        
        if (!targetDocSnap.exists()) {
          throw new Error('연결된 제어용 세션을 찾을 수 없습니다.');
        }
        
        const targetConnectionData = targetDocSnap.data();
        if (targetConnectionData.status !== 'connected') {
          throw new Error('제어용 세션이 연결되지 않았습니다.');
        }
      }
      
      // 메인 공지사항 데이터 저장
      await updateDoc(docRef, {
        mainNotice: {
          ...noticeData,
          timestamp: serverTimestamp(),
          isActive: true
        },
        updatedAt: serverTimestamp()
      });
      
      console.log('ConnectionDB: 메인 공지사항 전송 완료:', outputSessionId);
    } catch (error) {
      console.error('메인 공지사항 전송 실패:', error);
      throw error;
    }
  }

  // 메인 공지사항 비활성화 (출력용 디바이스용)
  async deactivateMainNotice(outputSessionId) {
    try {
      console.log('ConnectionDB: 메인 공지사항 비활성화 시작:', outputSessionId);
      
      const docRef = doc(db, 'connections', outputSessionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('출력용 세션을 찾을 수 없습니다.');
      }
      
      const connectionData = docSnap.data();
      
      // 세션 상태 확인
      if (connectionData.status !== 'connected') {
        throw new Error('출력용 세션이 연결되지 않았습니다.');
      }
      
      // 메인 공지사항 비활성화
      await updateDoc(docRef, {
        mainNotice: {
          isActive: false,
          deactivatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
      
      console.log('ConnectionDB: 메인 공지사항 비활성화 완료:', outputSessionId);
    } catch (error) {
      console.error('메인 공지사항 비활성화 실패:', error);
      throw error;
    }
  }

  // 전체 디바이스에 메인 공지사항 활성 상태 알림
  async notifyMainNoticeActive(isActive) {
    try {
      // 현재 활성화된 모든 연결에 알림 전송
      const connectionsRef = collection(db, 'connections');
      const allDocs = await getDocs(connectionsRef);
      
      const updatePromises = allDocs.docs.map(async (docSnapshot) => {
        const docRef = doc(db, 'connections', docSnapshot.id);
        await updateDoc(docRef, {
          mainNoticeAlert: {
            isActive: isActive,
            timestamp: new Date().toISOString()
          }
        });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      throw error;
    }
  }

  // 학교 생활 도우미 차단 관련 함수들
  async getSchoolBlockingStatus() {
    try {
      const settingsRef = collection(db, 'settings');
      const blockingDoc = doc(settingsRef, 'schoolBlocking');
      const docSnap = await getDoc(blockingDoc);
      
      if (docSnap.exists()) {
        return docSnap.data().isActive || false;
      }
      
      return false;
    } catch (error) {
      console.error('차단 상태 조회 실패:', error);
      return false;
    }
  }

  async setSchoolBlockingStatus(isActive) {
    try {
      const settingsRef = collection(db, 'settings');
      const blockingDoc = doc(settingsRef, 'schoolBlocking');
      
      await setDoc(blockingDoc, {
        isActive: isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('차단 상태 설정 실패:', error);
      throw error;
    }
  }

  // 학교 차단 상태 구독 함수
  subscribeToSchoolBlockingStatus(callback) {
    const settingsRef = collection(db, 'settings');
    const blockingDoc = doc(settingsRef, 'schoolBlocking');
    
    return onSnapshot(blockingDoc, (doc) => {
      if (doc.exists()) {
        callback(doc.data().isActive || false);
      } else {
        callback(false);
      }
    });
  }

  // 모든 연결된 디바이스에 차단 상태 알림 전송
  async notifyBlockingStatus(isActive) {
    const connectionsRef = collection(db, 'connections');
    const querySnapshot = await getDocs(connectionsRef);
    
    const updatePromises = [];
    querySnapshot.forEach((doc) => {
      updatePromises.push(
        updateDoc(doc.ref, {
          blockingAlert: isActive,
          blockingTimestamp: new Date().toISOString()
        })
      );
    });
    
    await Promise.all(updatePromises);
  }

  // PIN 별명 설정/업데이트
  async setPinNickname(pin, nickname) {
    try {
      const pinDoc = doc(db, 'connections', `pin_${pin}`);
      const pinData = {
        nickname: nickname.trim(),
        updatedAt: serverTimestamp(),
        pin: pin // PIN 번호도 함께 저장
      };
      
      // 먼저 기존 문서가 있는지 확인
      const pinSnap = await getDoc(pinDoc);
      
      if (pinSnap.exists()) {
        // 문서가 존재하면 업데이트
        await updateDoc(pinDoc, {
          nickname: nickname.trim(),
          updatedAt: serverTimestamp()
        });
      } else {
        // 문서가 없으면 새로 생성
        await setDoc(pinDoc, pinData);
      }
      
      console.log(`PIN ${pin} 별명 설정:`, nickname);
      return true;
    } catch (error) {
      console.error('PIN 별명 설정 실패:', error);
      return false;
    }
  }

  // PIN 별명 가져오기
  async getPinNickname(pin) {
    try {
      const pinDoc = doc(db, 'connections', `pin_${pin}`);
      const pinSnap = await getDoc(pinDoc);
      if (pinSnap.exists()) {
        return pinSnap.data().nickname || '';
      }
      return '';
    } catch (error) {
      console.error('PIN 별명 조회 실패:', error);
      return '';
    }
  }

  // 활성 연결에 별명 정보 추가
  async getActiveConnectionsWithNicknames() {
    try {
      const activeConnections = await this.getActiveConnections();
      
      // 각 PIN에 별명 정보 추가
      const connectionsWithNicknames = await Promise.all(
        activeConnections.map(async (connection) => {
          const nickname = await this.getPinNickname(connection.pin);
          return {
            ...connection,
            nickname: nickname || ''
          };
        })
      );
      
      return connectionsWithNicknames;
    } catch (error) {
      console.error('별명 포함 활성 연결 조회 실패:', error);
      return [];
    }
  }
}

export default new ConnectionDB();
